import type { Model } from './model';
import type { Resources, BaseMaterialsGroup, BaseMaterial, ObjectResource } from './resources';
import type { BuildItem } from './build';
import { Matrix3D } from './components';

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
    }>;
  };
  build: Array<{ objectId: number; transform: string; partnumber?: string }>;
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
        hasComponents: obj.hasComponents
      })
    );

    const build = this.build.map(item => ({
      objectId: item.objectId,
      transform: item.transform.toString(),
      partnumber: item.partnumber
    }));

    return { model: this.model, resources: { baseMaterials, objects }, build };
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
        hasComponents: obj.hasComponents
      });
    });

    const resources: Resources = {
      baseMaterials: baseMaterialsMap,
      objects: objectsMap
    };

    const buildItems: BuildItem[] = json.build.map(item => ({
      objectId: item.objectId,
      object: objectsMap.get(item.objectId)!,
      transform: Matrix3D.fromString(item.transform),
      partnumber: item.partnumber
    }));

    return new ThreeMFDocument(json.model, resources, buildItems);
  }
} 