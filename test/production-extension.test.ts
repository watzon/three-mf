import { expect, test, describe } from 'bun:test';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import { parseProductionExtensions } from '../src/production-extension/parser';
import { serializeProductionExtensions, generatePartRels } from '../src/production-extension/serializer';

// Parser unit tests
describe('Production Extension Parser', () => {
  test('extracts build and item attributes', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <model xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02"
           xmlns:p="http://schemas.microsoft.com/3dmanufacturing/production/2015/06">
      <build p:UUID="build-uuid">
        <item objectid="1" p:UUID="item-uuid" path="/models/child.model"/>
      </build>
    </model>`;
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
    const xmlObj: any = parser.parse(xml);
    parseProductionExtensions(xmlObj);
    expect(xmlObj.model.build.buildUUID).toBe('build-uuid');
    const item = xmlObj.model.build.item;
    expect(item.path).toBe('/models/child.model');
    expect(item.itemUUID).toBe('item-uuid');
  });

  test('extracts object and component attributes', () => {
    const xml = `<?xml version="1.0"?>
    <model xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02"
           xmlns:p="http://schemas.microsoft.com/3dmanufacturing/production/2015/06">
      <resources>
        <object id="2" p:UUID="obj-uuid">
          <components>
            <component objectid="3" p:UUID="comp-uuid" path="/models/comp.model" />
          </components>
        </object>
      </resources>
    </model>`;
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
    const xmlObj: any = parser.parse(xml);
    parseProductionExtensions(xmlObj);
    const resources = xmlObj.model.resources;
    const objects = Array.isArray(resources.object) ? resources.object : [resources.object];
    expect(objects[0].resourceUUID).toBe('obj-uuid');
    const comp = objects[0].components.component;
    expect(comp.path).toBe('/models/comp.model');
    expect(comp.componentUUID).toBe('comp-uuid');
  });
});

// Serializer unit tests
describe('Production Extension Serializer', () => {
  test('adds namespace and attributes', () => {
    const xmlObj: any = {
      model: {
        build: { buildUUID: 'build-uuid', item: { path: '/models/child.model', itemUUID: 'item-uuid' } },
        resources: { object: { resourceUUID: 'obj-uuid', components: { component: { path: '/models/comp.model', componentUUID: 'comp-uuid' } } } }
      }
    };
    serializeProductionExtensions(xmlObj);
    expect(xmlObj.model['@_xmlns:p']).toBe('http://schemas.microsoft.com/3dmanufacturing/production/2015/06');
    expect(xmlObj.model.build['@_p:UUID']).toBe('build-uuid');
    const item = xmlObj.model.build.item;
    expect(item['@_path']).toBe('/models/child.model');
    expect(item['@_p:UUID']).toBe('item-uuid');
    const object = xmlObj.model.resources.object;
    expect(object['@_p:UUID']).toBe('obj-uuid');
    const comp = object.components.component;
    expect(comp['@_path']).toBe('/models/comp.model');
    expect(comp['@_p:UUID']).toBe('comp-uuid');
  });

  test('generatePartRels returns rel entries for objects with path', () => {
    const xmlObj: any = {
      model: {
        resources: {
          object: [
            { path: '/models/child.model' },
            { /* no path */ },
            { path: '/models/other.model' }
          ]
        }
      }
    };
    const rels = generatePartRels(xmlObj);
    expect(rels).toEqual([
      { Id: 'rel1', Type: 'http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel', Target: '/models/child.model' },
      { Id: 'rel2', Type: 'http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel', Target: '/models/other.model' }
    ]);
  });
});

// Integration test: round-trip parse and serialize
describe('Production Extension Integration', () => {
  test('roundtrip parse and serialize retains attributes', () => {
    const xml = `<?xml version="1.0"?>
    <model xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02"
           xmlns:p="http://schemas.microsoft.com/3dmanufacturing/production/2015/06">
      <build p:UUID="build-uuid">
        <item objectid="1" p:UUID="item-uuid" path="/models/child.model" />
      </build>
      <resources>
        <object id="1" p:UUID="obj-uuid">
          <components>
            <component objectid="2" p:UUID="comp-uuid" path="/models/comp.model" />
          </components>
        </object>
      </resources>
    </model>`;
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
    const xmlObj: any = parser.parse(xml);
    parseProductionExtensions(xmlObj);
    serializeProductionExtensions(xmlObj);
    const builder = new XMLBuilder({ ignoreAttributes: false, attributeNamePrefix: '@_' });
    const builtXml = builder.build(xmlObj);
    expect(builtXml).toContain('xmlns:p="http://schemas.microsoft.com/3dmanufacturing/production/2015/06"');
    expect(builtXml).toContain('p:UUID="build-uuid"');
    expect(builtXml).toContain('path="/models/child.model"');
    const rels = generatePartRels(xmlObj);
    expect(rels.length).toBe(2);
    expect(rels[0]!.Target).toBe('/models/child.model');
  });
}); 