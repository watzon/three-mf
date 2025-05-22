import { expect, test, describe } from 'bun:test';
import { parseBuildFromXml, BuildParseError } from '../src/build';
import type { Resources, ObjectResource } from '../src/resources';
import { ObjectType } from '../src/resources';

describe('Build Parsing', () => {
  // Dummy object resource for testing
  const dummyObject: ObjectResource = {
    id: 1,
    type: ObjectType.Model,
    hasMesh: false,
    hasComponents: false
  };

  // Resources with one object
  const resources: Resources = {
    baseMaterials: new Map(),
    objects: new Map([[1, dummyObject]])
  };

  // Resources with no objects
  const emptyResources: Resources = {
    baseMaterials: new Map(),
    objects: new Map()
  };

  test('should return empty array when no build element is present', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <model xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
      <resources></resources>
    </model>`;
    const items = parseBuildFromXml(xml, resources);
    expect(items).toEqual([]);
  });

  test('should return empty array when build element has no items', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <model xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
      <resources></resources>
      <build></build>
    </model>`;
    const items = parseBuildFromXml(xml, resources);
    expect(items).toEqual([]);
  });

  test('should parse a single build item correctly', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <model xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
      <resources></resources>
      <build>
        <item objectid="1" transform="1 0 0 0 1 0 0 0 1 10 20 30" partnumber="PN123" />
      </build>
    </model>`;
    const items = parseBuildFromXml(xml, resources);
    expect(items.length).toBe(1);
    const item = items[0]!;
    expect(item.objectId).toBe(1);
    expect(item.object).toBe(dummyObject);
    expect(item.transform.toString()).toBe('1 0 0 0 1 0 0 0 1 10 20 30');
    expect(item.partnumber).toBe('PN123');
  });

  test('should throw error for missing objectid', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <model xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
      <resources></resources>
      <build>
        <item transform="1 0 0 0 1 0 0 0 1 0 0 0" />
      </build>
    </model>`;
    expect(() => parseBuildFromXml(xml, resources)).toThrow(BuildParseError);
    expect(() => parseBuildFromXml(xml, resources)).toThrow('Build item missing required objectid attribute');
  });

  test('should throw error for invalid objectid', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <model xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
      <resources></resources>
      <build>
        <item objectid="abc" transform="1 0 0 0 1 0 0 0 1 0 0 0" />
      </build>
    </model>`;
    expect(() => parseBuildFromXml(xml, resources)).toThrow(BuildParseError);
    expect(() => parseBuildFromXml(xml, resources)).toThrow('Invalid objectid value: abc');
  });

  test('should throw error for missing object resource reference', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <model xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
      <resources></resources>
      <build>
        <item objectid="2" transform="1 0 0 0 1 0 0 0 1 0 0 0" />
      </build>
    </model>`;
    expect(() => parseBuildFromXml(xml, emptyResources)).toThrow(BuildParseError);
    expect(() => parseBuildFromXml(xml, emptyResources)).toThrow('Build item references missing object resource with id 2');
  });

  test('should throw error for invalid transform', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <model xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
      <resources></resources>
      <build>
        <item objectid="1" transform="invalid_string" />
      </build>
    </model>`;
    expect(() => parseBuildFromXml(xml, resources)).toThrow(BuildParseError);
    expect(() => parseBuildFromXml(xml, resources)).toThrow('Invalid transform for build item with objectid 1');
  });
}); 