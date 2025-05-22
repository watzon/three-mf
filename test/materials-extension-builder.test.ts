import { expect, test, describe } from 'bun:test';
import {
  texture2dToXml,
  texture2dGroupToXml,
  colorGroupToXml,
  compositeMaterialsToXml,
  multiPropertiesToXml,
  pbSpecularDisplayPropertiesToXml,
  pbMetallicDisplayPropertiesToXml,
  pbSpecularTextureDisplayPropertiesToXml,
  pbMetallicTextureDisplayPropertiesToXml,
  translucentDisplayPropertiesToXml
} from '../src/builder';
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
} from '../src/materials-extension/types';

describe('Materials Extension Builder - Individual Element Builders', () => {
  describe('texture2dToXml', () => {
    test('builds minimal attributes', () => {
      const tex: Texture2D = { id: 1, path: '/t.png', contentType: 'image/png' };
      const xml = texture2dToXml(tex);
      expect(xml['@_id']).toBe('1');
      expect(xml['@_path']).toBe('/t.png');
      expect(xml['@_contenttype']).toBe('image/png');
      expect(xml['@_tilestyleu']).toBeUndefined();
      expect(xml['custom']).toBeUndefined();
    });

    test('builds optional attributes and extras', () => {
      const tex = {
        id: 2,
        path: '/t.jpg',
        contentType: 'image/jpeg',
        tileStyleU: 'wrap',
        tileStyleV: 'mirror',
        filter: 'nearest',
        custom: 'foo'
      } as unknown as Texture2D;
      const xml = texture2dToXml(tex);
      expect(xml['@_tilestyleu']).toBe('wrap');
      expect(xml['@_tilestylev']).toBe('mirror');
      expect(xml['@_filter']).toBe('nearest');
      expect((xml as any).custom).toBe('foo');
    });
  });

  describe('texture2dGroupToXml', () => {
    test('builds minimal attributes', () => {
      const grp: Texture2DGroup = { id: 10, texId: 20, tex2Coords: [] };
      const xml = texture2dGroupToXml(grp);
      expect(xml['@_id']).toBe('10');
      expect(xml['@_texid']).toBe('20');
      expect(xml.tex2coord).toEqual([]);
    });

    test('builds coords, displayPropertiesId and extras', () => {
      const grp = {
        id: 11,
        texId: 21,
        displayPropertiesId: 100,
        tex2Coords: [{ u: 0.1, v: 0.2, foo: 'bar' }],
        extra: 'baz'
      } as unknown as Texture2DGroup;
      const xml = texture2dGroupToXml(grp);
      expect(xml['@_displaypropertiesid']).toBe('100');
      expect(xml.tex2coord.length).toBe(1);
      const coord = xml.tex2coord[0];
      expect(coord['@_u']).toBe(0.1);
      expect(coord['@_v']).toBe(0.2);
      expect((coord as any).foo).toBe('bar');
      expect((xml as any).extra).toBe('baz');
    });
  });

  describe('colorGroupToXml', () => {
    test('builds minimal attributes', () => {
      const grp: ColorGroup = { id: 5, colors: [] };
      const xml = colorGroupToXml(grp);
      expect(xml['@_id']).toBe('5');
      expect(xml.color).toEqual([]);
    });

    test('builds colors, displayPropertiesId and extras', () => {
      const grp = {
        id: 6,
        displayPropertiesId: 200,
        colors: [{ color: '#FF00FF', note: 'test' }],
        foo: 'bar'
      } as unknown as ColorGroup;
      const xml = colorGroupToXml(grp);
      expect(xml['@_displaypropertiesid']).toBe('200');
      expect(xml.color.length).toBe(1);
      const col = xml.color[0];
      expect(col['@_color']).toBe('#FF00FF');
      expect((col as any).note).toBe('test');
      expect((xml as any).foo).toBe('bar');
    });
  });

  describe('compositeMaterialsToXml', () => {
    test('builds minimal attributes and composites', () => {
      const grp = {
        id: 7,
        matId: 1,
        matIndices: [0, 2],
        composites: [{ values: [0.3, 0.7], x: 'y' }]
      } as unknown as CompositeMaterials;
      const xml = compositeMaterialsToXml(grp);
      expect(xml['@_matindices']).toBe('0 2');
      expect(xml.composite.length).toBe(1);
      expect(xml.composite[0]['@_values']).toBe('0.3 0.7');
      expect((xml.composite[0] as any).x).toBe('y');
    });

    test('includes displayPropertiesId and extras', () => {
      const grp = {
        id: 8,
        matId: 2,
        matIndices: [1],
        displayPropertiesId: 300,
        composites: [{ values: [1.0], foo: 'bar' }],
        extra: 'baz'
      } as unknown as CompositeMaterials;
      const xml = compositeMaterialsToXml(grp);
      expect(xml['@_displaypropertiesid']).toBe('300');
      expect((xml as any).extra).toBe('baz');
    });
  });

  describe('multiPropertiesToXml', () => {
    test('builds minimal attributes and multis', () => {
      const mp = {
        id: 9,
        pids: [2, 3],
        multis: [{ pIndices: [0, 1], bar: 'baz' }]
      } as unknown as MultiProperties;
      const xml = multiPropertiesToXml(mp);
      expect(xml['@_pids']).toBe('2 3');
      expect(xml.multi.length).toBe(1);
      expect(xml.multi[0]['@_pindices']).toBe('0 1');
      expect((xml.multi[0] as any).bar).toBe('baz');
    });

    test('includes blendMethods and extras', () => {
      const mp = {
        id: 10,
        pids: [4],
        blendMethods: ['mix', 'multiply'],
        multis: [{ pIndices: [2], note: 'n' }],
        extraField: 'x'
      } as unknown as MultiProperties;
      const xml = multiPropertiesToXml(mp);
      expect(xml['@_blendmethods']).toBe('mix multiply');
      expect((xml as any).extraField).toBe('x');
    });
  });

  describe('pbSpecularDisplayPropertiesToXml', () => {
    test('builds minimal id and specular children', () => {
      const dp: PBSpecularDisplayProperties = { id: 11, specular: [{ name: 'S' }] };
      const xml = pbSpecularDisplayPropertiesToXml(dp);
      expect(xml['@_id']).toBe('11');
      expect(xml.pbspecular.length).toBe(1);
      expect(xml.pbspecular[0]['@_name']).toBe('S');
    });

    test('builds color, glossiness and extras', () => {
      const dp = {
        id: 12,
        specular: [{ name: 'T', specularColor: '#010203', glossiness: 0.5, foo: 'bar' }],
        customAttr: 'v'
      } as unknown as PBSpecularDisplayProperties;
      const xml = pbSpecularDisplayPropertiesToXml(dp);
      expect(xml.pbspecular[0]['@_specularcolor']).toBe('#010203');
      expect(xml.pbspecular[0]['@_glossiness']).toBe(0.5);
      expect((xml.pbspecular[0] as any).foo).toBe('bar');
      expect(xml['@_customAttr']).toBe('v');
    });
  });

  describe('pbMetallicDisplayPropertiesToXml', () => {
    test('builds minimal id and metallic children', () => {
      const dp: PBMetallicDisplayProperties = { id: 13, metallic: [{ name: 'M' }] };
      const xml = pbMetallicDisplayPropertiesToXml(dp);
      expect(xml['@_id']).toBe('13');
      expect(xml.pbmetallic.length).toBe(1);
      expect(xml.pbmetallic[0]['@_name']).toBe('M');
    });

    test('builds metallicness, roughness and extras', () => {
      const dp = {
        id: 14,
        metallic: [{ name: 'N', metallicness: 0.7, roughness: 0.2, bar: 'baz' }],
        extra: 'e'
      } as unknown as PBMetallicDisplayProperties;
      const xml = pbMetallicDisplayPropertiesToXml(dp);
      expect(xml.pbmetallic[0]['@_metallicness']).toBe(0.7);
      expect(xml.pbmetallic[0]['@_roughness']).toBe(0.2);
      expect((xml.pbmetallic[0] as any).bar).toBe('baz');
      expect(xml['@_extra']).toBe('e');
    });
  });

  describe('pbSpecularTextureDisplayPropertiesToXml', () => {
    test('builds minimal attributes', () => {
      const dp: PBSpecularTextureDisplayProperties = {
        id: 15,
        name: 'A',
        specularTextureId: 5,
        glossinessTextureId: 6
      };
      const xml = pbSpecularTextureDisplayPropertiesToXml(dp);
      expect(xml['@_id']).toBe('15');
      expect(xml['@_name']).toBe('A');
      expect(xml['@_speculartextureid']).toBe('5');
      expect(xml['@_glossinesstextureid']).toBe('6');
    });

    test('builds optional factors', () => {
      const dp = {
        id: 16,
        name: 'B',
        specularTextureId: 7,
        glossinessTextureId: 8,
        diffuseFactor: '#FFF',
        specularFactor: '#000',
        glossinessFactor: 0.9
      } as PBSpecularTextureDisplayProperties;
      const xml = pbSpecularTextureDisplayPropertiesToXml(dp);
      expect(xml['@_diffusefactor']).toBe('#FFF');
      expect(xml['@_specularfactor']).toBe('#000');
      expect(xml['@_glossinessfactor']).toBe(0.9);
    });
  });

  describe('pbMetallicTextureDisplayPropertiesToXml', () => {
    test('builds minimal attributes', () => {
      const dp: PBMetallicTextureDisplayProperties = {
        id: 17,
        name: 'C',
        metallicTextureId: 9,
        roughnessTextureId: 10
      };
      const xml = pbMetallicTextureDisplayPropertiesToXml(dp);
      expect(xml['@_metallictextureid']).toBe('9');
      expect(xml['@_roughnesstextureid']).toBe('10');
    });

    test('builds optional factors', () => {
      const dp = {
        id: 18,
        name: 'D',
        metallicTextureId: 11,
        roughnessTextureId: 12,
        metallicFactor: 0.3,
        roughnessFactor: 0.4
      } as PBMetallicTextureDisplayProperties;
      const xml = pbMetallicTextureDisplayPropertiesToXml(dp);
      expect(xml['@_metallicfactor']).toBe(0.3);
      expect(xml['@_roughnessfactor']).toBe(0.4);
    });
  });

  describe('translucentDisplayPropertiesToXml', () => {
    test('builds minimal attributes and translucent children', () => {
      const dp: TranslucentDisplayProperties = { id: 19, translucent: [{ name: 'T', attenuation: [0.1, 0.2] }] };
      const xml = translucentDisplayPropertiesToXml(dp);
      expect(xml['@_id']).toBe('19');
      expect(xml.translucent.length).toBe(1);
      expect(xml.translucent[0]['@_name']).toBe('T');
      expect(xml.translucent[0]['@_attenuation']).toBe('0.1 0.2');
    });

    test('builds optional refractiveIndex, roughness and extras', () => {
      const dp = {
        id: 20,
        translucent: [{ name: 'U', attenuation: [0.3], refractiveIndex: [1, 1.1], roughness: 0.5, foo: 'bar' }],
        extra: 'x'
      } as unknown as TranslucentDisplayProperties;
      const xml = translucentDisplayPropertiesToXml(dp);
      expect(xml.translucent[0]['@_refractiveindex']).toBe('1 1.1');
      expect(xml.translucent[0]['@_roughness']).toBe(0.5);
      expect((xml.translucent[0] as any).foo).toBe('bar');
      expect(xml['@_extra']).toBe('x');
    });
  });
}); 