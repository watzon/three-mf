import { expect, test, describe } from 'bun:test';
import { ThreeMFDocument } from '../src/document';
import type { DocumentJSON } from '../src/document';
import { Unit } from '../src/model';
import type { Resources } from '../src/resources';
import type { BuildItem } from '../src/build';
import { Matrix3D } from '../src/components';

describe('In-Memory API Definition', () => {
  test('JSON round-trip retains data', () => {
    // Minimal model
    const model = { unit: Unit.Millimeter };
    // Minimal resources with one baseMaterials and one object
    const resources: Resources = {
      baseMaterials: new Map([[1, { id: 1, materials: [{ name: 'Material1', displayColor: '#abcdef' }] }]]),
      objects: new Map([[1, { id: 1, type: 'model', hasMesh: false, hasComponents: false } as any]])
    };
    // Minimal build items
    const buildItems: BuildItem[] = [
      {
        objectId: 1,
        object: resources.objects.get(1)!,
        transform: Matrix3D.fromString('1 0 0 0 1 0 0 0 1 0 0 0')
      }
    ];

    const doc = new ThreeMFDocument(model as any, resources, buildItems);
    const json: DocumentJSON = doc.toJSON();
    const doc2 = ThreeMFDocument.fromJSON(json);
    expect(doc2.toJSON()).toEqual(json);
  });
}); 