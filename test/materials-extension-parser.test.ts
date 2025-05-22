import { expect, test, describe } from 'bun:test';
import {
  parseTexture2D,
  parseTexture2DGroup,
  parseColorGroup,
  parseCompositeMaterials,
  parseMultiProperties,
  parsePBSpecularDisplayProperties,
  parseTranslucentDisplayProperties
} from '../src/materials-extension/parser';
import { ResourcesParseError } from '../src/resources';

describe('Materials Extension Parser - Individual Element Parsers', () => {
  describe('parseTexture2D', () => {
    test('parses minimal attributes', () => {
      const el = { '@_id': '1', '@_path': '/tex.png', '@_contenttype': 'image/png' };
      const tex = parseTexture2D(el);
      expect(tex.id).toBe(1);
      expect(tex.path).toBe('/tex.png');
      expect(tex.contentType).toBe('image/png');
      expect(tex.tileStyleU).toBeUndefined();
      expect(tex.tileStyleV).toBeUndefined();
      expect(tex.filter).toBeUndefined();
    });

    test('parses all attributes and extras', () => {
      const el = {
        '@_id': '2', '@_path': '/img.jpg', '@_contenttype': 'image/jpeg',
        '@_tilestyleu': 'wrap', '@_tilestylev': 'mirror', '@_filter': 'nearest',
        '@_custom': 'foo'
      };
      const tex = parseTexture2D(el);
      expect(tex.id).toBe(2);
      expect(tex.tileStyleU).toBe('wrap');
      expect(tex.tileStyleV).toBe('mirror');
      expect(tex.filter).toBe('nearest');
      expect((tex as any)['@_custom']).toBe('foo');
    });

    test('throws if missing required attributes', () => {
      expect(() => parseTexture2D({ '@_path': '/tex.png', '@_contenttype': 'image/png' })).toThrow(ResourcesParseError);
      expect(() => parseTexture2D({ '@_id': '1', '@_contenttype': 'image/png' })).toThrow(ResourcesParseError);
      expect(() => parseTexture2D({ '@_id': '1', '@_path': '/tex.png' })).toThrow(ResourcesParseError);
    });
  });

  describe('parseTexture2DGroup', () => {
    test('parses minimal attributes', () => {
      const el = { '@_id': '10', '@_texid': '20' };
      const grp = parseTexture2DGroup(el);
      expect(grp.id).toBe(10);
      expect(grp.texId).toBe(20);
      expect(grp.tex2Coords).toEqual([]);
    });

    test('parses children and extras', () => {
      const el: any = {
        '@_id': '11', '@_texid': '21', '@_displaypropertiesid': '100',
        tex2coord: { '@_u': '0.1', '@_v': '0.2', '@_foo': 'bar' }, '@_extra': 'baz'
      };
      const grp = parseTexture2DGroup(el);
      expect(grp.displayPropertiesId).toBe(100);
      expect(grp.tex2Coords.length).toBe(1);
      expect(grp.tex2Coords[0]!.u).toBeCloseTo(0.1);
      expect(grp.tex2Coords[0]!.v).toBeCloseTo(0.2);
      expect((grp.tex2Coords[0] as any)['@_foo']).toBe('bar');
      expect((grp as any)['@_extra']).toBe('baz');
    });

    test('throws if missing id or texid', () => {
      expect(() => parseTexture2DGroup({ '@_texid': '1' })).toThrow(ResourcesParseError);
      expect(() => parseTexture2DGroup({ '@_id': '1' })).toThrow(ResourcesParseError);
    });
  });

  describe('parseColorGroup', () => {
    test('parses minimal attributes', () => {
      const el = { '@_id': '5' };
      const grp = parseColorGroup(el);
      expect(grp.id).toBe(5);
      expect(grp.colors).toEqual([]);
    });
    test('parses colors and extras', () => {
      const el: any = {
        '@_id': '6', '@_displaypropertiesid': '200',
        color: { '@_color': '#FF00FF', '@_note': 'test' },
        '@_foo': 'bar'
      };
      const grp = parseColorGroup(el);
      expect(grp.displayPropertiesId).toBe(200);
      expect(grp.colors.length).toBe(1);
      expect(grp.colors[0]!.color).toBe('#FF00FF');
      expect((grp.colors[0] as any)['@_note']).toBe('test');
      expect((grp as any)['@_foo']).toBe('bar');
    });
    test('throws if missing id', () => {
      expect(() => parseColorGroup({})).toThrow(ResourcesParseError);
    });
  });

  describe('parseCompositeMaterials', () => {
    test('parses minimal attributes and composites', () => {
      const el: any = {
        '@_id': '7', '@_matid': '1', '@_matindices': '0 2',
        composite: [{ '@_values': '0.3 0.7', '@_x': 'y' }]
      };
      const grp = parseCompositeMaterials(el);
      expect(grp.id).toBe(7);
      expect(grp.matId).toBe(1);
      expect(grp.matIndices).toEqual([0, 2]);
      expect(grp.composites[0]!.values).toEqual([0.3, 0.7]);
      expect((grp.composites[0] as any)['@_x']).toBe('y');
    });
    test('throws if missing required attrs', () => {
      expect(() => parseCompositeMaterials({ '@_matid': '1', '@_matindices': '0' })).toThrow(ResourcesParseError);
      expect(() => parseCompositeMaterials({ '@_id': '7', '@_matindices': '0' })).toThrow(ResourcesParseError);
      expect(() => parseCompositeMaterials({ '@_id': '7', '@_matid': '1' })).toThrow(ResourcesParseError);
    });
  });

  describe('parseMultiProperties', () => {
    test('parses minimal attributes and multis', () => {
      const el: any = {
        '@_id': '8', '@_pids': '2 3',
        multi: { '@_pindices': '0 1', '@_note': 'n' }
      };
      const mp = parseMultiProperties(el);
      expect(mp.id).toBe(8);
      expect(mp.pids).toEqual([2,3]);
      expect(mp.multis[0]!.pIndices).toEqual([0,1]);
      expect((mp.multis[0] as any)['@_note']).toBe('n');
    });
    test('throws if missing required attrs', () => {
      expect(() => parseMultiProperties({ '@_pids': '1' })).toThrow(ResourcesParseError);
      expect(() => parseMultiProperties({ '@_id': '8' })).toThrow(ResourcesParseError);
    });
  });

  describe('parsePBSpecularDisplayProperties', () => {
    test('parses specular display properties', () => {
      const el: any = {
        '@_id': '9',
        pbspecular: { '@_name': 'S', '@_specularcolor': '#010203', '@_glossiness': '0.5', '@_x': 'y' }
      };
      const dp = parsePBSpecularDisplayProperties(el);
      expect(dp.id).toBe(9);
      expect(dp.specular[0]!.name).toBe('S');
      expect(dp.specular[0]!.specularColor).toBe('#010203');
      expect(dp.specular[0]!.glossiness).toBeCloseTo(0.5);
      expect((dp.specular[0] as any)['@_x']).toBe('y');
    });
    test('throws if missing id or name', () => {
      expect(() => parsePBSpecularDisplayProperties({})).toThrow(ResourcesParseError);
      expect(() => parsePBSpecularDisplayProperties({ '@_id': '9' })).toThrow(ResourcesParseError);
    });
  });

  describe('parseTranslucentDisplayProperties', () => {
    test('parses translucent display properties', () => {
      const el: any = {
        '@_id': '10',
        translucent: { '@_name': 'T', '@_attenuation': '0.1 0.2 0.3', '@_refractiveindex': '1.0 1.1 1.2', '@_roughness': '0.4', '@_z': 'w' }
      };
      const dp = parseTranslucentDisplayProperties(el);
      expect(dp.id).toBe(10);
      expect(dp.translucent[0]!.name).toBe('T');
      expect(dp.translucent[0]!.attenuation).toEqual([0.1,0.2,0.3]);
      expect(dp.translucent[0]!.refractiveIndex).toEqual([1.0,1.1,1.2]);
      expect(dp.translucent[0]!.roughness).toBeCloseTo(0.4);
      expect((dp.translucent[0] as any)['@_z']).toBe('w');
    });
    test('throws if missing required attrs', () => {
      expect(() => parseTranslucentDisplayProperties({})).toThrow(ResourcesParseError);
      expect(() => parseTranslucentDisplayProperties({ '@_id': '10' })).toThrow(ResourcesParseError);
    });
  });
}); 