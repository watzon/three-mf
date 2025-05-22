import { expect, test, describe } from 'bun:test';
import { ThreeMFDocument } from '../src/document';
import { Unit } from '../src/model';
import type { Model } from '../src/model';
import type {
  Texture2D,
  Texture2DGroup,
  ColorGroup,
  CompositeMaterials,
  MultiProperties,
  PBSpecularDisplayProperties,
  TranslucentDisplayProperties
} from '../src/materials-extension/types';

describe('Materials Extension Document Integration', () => {
  const dummyModel: Model = { unit: Unit.Millimeter };
  const dummyBuild: any[] = [];

  test('toJSON includes extension resources', () => {
    // Setup resources with one item each
    const resources: any = {
      baseMaterials: new Map(),
      objects: new Map(),
      textures: new Map<number, Texture2D>([
        [1, { id: 1, path: '/tex.png', contentType: 'image/png' }]
      ]),
      texture2DGroups: new Map<number, Texture2DGroup>([
        [2, { id: 2, texId: 3, tex2Coords: [] }]
      ]),
      colorGroups: new Map<number, ColorGroup>([
        [3, { id: 3, colors: [] }]
      ]),
      compositeMaterials: new Map<number, CompositeMaterials>([
        [4, { id: 4, matId: 1, matIndices: [], composites: [] }]
      ]),
      multiProperties: new Map<number, MultiProperties>([
        [5, { id: 5, pids: [], multis: [] }]
      ]),
      displayProperties: new Map<number, PBSpecularDisplayProperties | TranslucentDisplayProperties>([
        [6, { id: 6, specular: [] } as PBSpecularDisplayProperties]
      ])
    };
    const doc = new ThreeMFDocument(dummyModel, resources, dummyBuild as any);
    const json = doc.toJSON();
    expect(json.resources.textures).toHaveLength(1);
    expect(json.resources.textures[0]!.path).toBe('/tex.png');
    expect(json.resources.texture2DGroups).toHaveLength(1);
    expect(json.resources.texture2DGroups[0]!.id).toBe(2);
    expect(json.resources.colorGroups).toHaveLength(1);
    expect(json.resources.colorGroups[0]!.id).toBe(3);
    expect(json.resources.compositeMaterials).toHaveLength(1);
    expect(json.resources.compositeMaterials[0]!.id).toBe(4);
    expect(json.resources.multiProperties).toHaveLength(1);
    expect(json.resources.multiProperties[0]!.id).toBe(5);
    expect(json.resources.displayProperties).toHaveLength(1);
    expect(json.resources.displayProperties[0]!.id).toBe(6);
  });

  test('fromJSON rebuilds extension resources maps', () => {
    const json: any = {
      model: dummyModel,
      resources: {
        baseMaterials: [],
        objects: [],
        textures: [{ id:1, path:'/tex.png', contentType:'image/png' }],
        texture2DGroups: [{ id:2, texId:3, tex2Coords: [] }],
        colorGroups: [{ id:3, colors: [] }],
        compositeMaterials: [{ id:4, matId:1, matIndices: [], composites: [] }],
        multiProperties: [{ id:5, pids: [], multis: [] }],
        displayProperties: [{ id:6, specular: [] }]
      },
      build: []
    };
    const doc = ThreeMFDocument.fromJSON(json as any);
    expect(doc.resources.textures.get(1)!.path).toBe('/tex.png');
    expect(doc.resources.texture2DGroups.get(2)!.texId).toBe(3);
    expect(doc.resources.colorGroups.get(3)!.id).toBe(3);
    expect(doc.resources.compositeMaterials.get(4)!.matId).toBe(1);
    expect(doc.resources.multiProperties.get(5)!.pids).toEqual([]);
    expect(doc.resources.displayProperties.get(6)!.id).toBe(6);
  });

  test('round-trip JSON preserves extension data', () => {
    const resources: any = {
      baseMaterials: new Map(),
      objects: new Map(),
      textures: new Map([[1, { id: 1, path: '/tex.png', contentType: 'image/png' }]]),
      texture2DGroups: new Map([[2, { id: 2, texId: 3, tex2Coords: [] }]]),
      colorGroups: new Map([[3, { id: 3, colors: [] }]]),
      compositeMaterials: new Map([[4, { id: 4, matId: 1, matIndices: [], composites: [] }]]),
      multiProperties: new Map([[5, { id: 5, pids: [], multis: [] }]]),
      displayProperties: new Map([[6, { id: 6, specular: [] } as PBSpecularDisplayProperties]])
    };
    const doc1 = new ThreeMFDocument(dummyModel, resources, dummyBuild as any);
    const json = doc1.toJSON();
    const doc2 = ThreeMFDocument.fromJSON(json);
    expect(doc2.resources.textures.get(1)!.path).toBe('/tex.png');
    expect(doc2.resources.displayProperties.get(6)!.id).toBe(6);
  });
}); 