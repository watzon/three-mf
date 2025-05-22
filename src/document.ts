import type { Model } from './model';
import type { Resources, BaseMaterialsGroup, BaseMaterial, ObjectResource } from './resources';
import type { BuildItem } from './build';
import { Matrix3D } from './components';
import type {
  Texture2D,
  Texture2DGroup,
  ColorGroup,
  CompositeMaterials,
  MultiProperties,
  PBSpecularDisplayProperties,
  PBMetallicDisplayProperties,
  PBSpecularTextureDisplayProperties,
  PBMetallicTextureDisplayProperties,
  TranslucentDisplayProperties
} from './materials-extension/types';

/**
 * JSON structure for serializing a 3MF document
 */
export interface DocumentJSON {
  model: Model;
  resources: {
    baseMaterials: Array<{
      id: number;
      materials: Array<{ name: string; displayColor: string }>;
    }>;
    objects: Array<{
      id: number;
      type: string;
      name?: string;
      partnumber?: string;
      thumbnail?: string;
      pid?: number;
      pindex?: number;
      hasMesh: boolean;
      hasComponents: boolean;
      uuid?: string;
    }>;
    textures: Texture2D[];
    texture2DGroups: Texture2DGroup[];
    colorGroups: ColorGroup[];
    compositeMaterials: CompositeMaterials[];
    multiProperties: MultiProperties[];
    displayProperties: (
      PBSpecularDisplayProperties |
      PBMetallicDisplayProperties |
      PBSpecularTextureDisplayProperties |
      PBMetallicTextureDisplayProperties |
      TranslucentDisplayProperties
    )[];
  };
  build: Array<{
    objectId: number;
    transform: string;
    partnumber?: string;
    path?: string;
    uuid?: string;
  }>;
}

/**
 * In-memory representation of a parsed 3MF document, with serialization hooks
 */
export class ThreeMFDocument {
  constructor(
    public model: Model,
    public resources: Resources,
    public build: BuildItem[]
  ) {}

  /**
   * Serialize the document to a JSON-friendly structure
   */
  toJSON(): DocumentJSON {
    const baseMaterials = Array.from(this.resources.baseMaterials.values()).map(
      (group: BaseMaterialsGroup) => ({
        id: group.id,
        materials: group.materials.map((mat: BaseMaterial) => ({
          name: mat.name,
          displayColor: mat.displayColor
        }))
      })
    );

    const objects = Array.from(this.resources.objects.values()).map(
      (obj: ObjectResource) => ({
        id: obj.id,
        type: obj.type,
        name: obj.name,
        partnumber: obj.partnumber,
        thumbnail: obj.thumbnail,
        pid: obj.pid,
        pindex: obj.pindex,
        hasMesh: obj.hasMesh,
        hasComponents: obj.hasComponents,
        uuid: (obj as any).uuid
      })
    );

    const build = this.build.map(item => ({
      objectId: item.objectId,
      transform: item.transform.toString(),
      partnumber: item.partnumber,
      path: (item as any).path,
      uuid: (item as any).uuid
    }));

    // Extension resources
    const textures = Array.from((this.resources.textures ?? new Map()).values());
    const texture2DGroups = Array.from((this.resources.texture2DGroups ?? new Map()).values());
    const colorGroups = Array.from((this.resources.colorGroups ?? new Map()).values());
    const compositeMaterials = Array.from((this.resources.compositeMaterials ?? new Map()).values());
    const multiProperties = Array.from((this.resources.multiProperties ?? new Map()).values());
    const displayProperties = Array.from((this.resources.displayProperties ?? new Map()).values());

    return {
      model: this.model,
      resources: { baseMaterials, objects, textures, texture2DGroups, colorGroups, compositeMaterials, multiProperties, displayProperties },
      build
    };
  }

  /**
   * Reconstruct a ThreeMFDocument from serialized JSON
   */
  static fromJSON(json: DocumentJSON): ThreeMFDocument {
    // Rebuild resources maps
    const baseMaterialsMap: Map<number, BaseMaterialsGroup> = new Map();
    json.resources.baseMaterials.forEach(group => {
      baseMaterialsMap.set(group.id, {
        id: group.id,
        materials: group.materials.map(m => ({ name: m.name, displayColor: m.displayColor }))
      });
    });

    const objectsMap: Map<number, ObjectResource> = new Map();
    json.resources.objects.forEach(obj => {
      objectsMap.set(obj.id, {
        id: obj.id,
        type: obj.type as any,
        name: obj.name,
        partnumber: obj.partnumber,
        thumbnail: obj.thumbnail,
        pid: obj.pid,
        pindex: obj.pindex,
        hasMesh: obj.hasMesh,
        hasComponents: obj.hasComponents,
        uuid: obj.uuid
      });
    });

    // Rebuild extension resource maps
    const texturesMap: Map<number, Texture2D> = new Map();
    json.resources.textures.forEach(tex => texturesMap.set(tex.id, tex));
    const texture2DGroupsMap: Map<number, Texture2DGroup> = new Map();
    json.resources.texture2DGroups.forEach(grp => texture2DGroupsMap.set(grp.id, grp));
    const colorGroupsMap: Map<number, ColorGroup> = new Map();
    json.resources.colorGroups.forEach(grp => colorGroupsMap.set(grp.id, grp));
    const compositeMaterialsMap: Map<number, CompositeMaterials> = new Map();
    json.resources.compositeMaterials.forEach(grp => compositeMaterialsMap.set(grp.id, grp));
    const multiPropertiesMap: Map<number, MultiProperties> = new Map();
    json.resources.multiProperties.forEach(mp => multiPropertiesMap.set(mp.id, mp));
    const displayPropertiesMap: Map<number, PBSpecularDisplayProperties | PBMetallicDisplayProperties | PBSpecularTextureDisplayProperties | PBMetallicTextureDisplayProperties | TranslucentDisplayProperties> = new Map();
    json.resources.displayProperties.forEach(dp => displayPropertiesMap.set(dp.id, dp));

    const resources: Resources = {
      baseMaterials: baseMaterialsMap,
      objects: objectsMap,
      textures: texturesMap,
      texture2DGroups: texture2DGroupsMap,
      colorGroups: colorGroupsMap,
      compositeMaterials: compositeMaterialsMap,
      multiProperties: multiPropertiesMap,
      displayProperties: displayPropertiesMap
    };

    const buildItems: BuildItem[] = json.build.map(item => ({
      objectId: item.objectId,
      object: objectsMap.get(item.objectId)!,
      transform: Matrix3D.fromString(item.transform),
      partnumber: item.partnumber,
      path: item.path,
      uuid: item.uuid
    }));

    return new ThreeMFDocument(json.model, resources, buildItems);
  }
} 