// Parser for 3MF Materials and Properties Extension (version 1.2.1)

import type {
  ResourceID,
  Texture2D,
  Texture2DGroup,
  ColorGroup,
  CompositeMaterials,
  MultiProperties,
  PBSpecularDisplayProperties,
  PBMetallicDisplayProperties,
  PBSpecularTextureDisplayProperties,
  PBMetallicTextureDisplayProperties,
  TranslucentDisplayProperties,
  Tex2Coord,
  Color,
  Composite,
  Multi,
  MaterialsExtensionResources
} from './types';
import { ResourcesParseError } from '../resources';

const MATERIALS_EXTENSION_NAMESPACE = 'http://schemas.microsoft.com/3dmanufacturing/material/2015/02';
const MATERIALS_EXTENSION_PREFIX = 'm';

/** Parse a single <texture2d> element */
export function parseTexture2D(element: any): Texture2D {
  const attrs = element;
  if (!attrs['@_id']) {
    throw new ResourcesParseError('texture2d missing required id attribute');
  }
  if (!attrs['@_path']) {
    throw new ResourcesParseError('texture2d missing required path attribute');
  }
  if (!attrs['@_contenttype']) {
    throw new ResourcesParseError('texture2d missing required contenttype attribute');
  }
  const id = parseInt(attrs['@_id'], 10);
  const texture: Texture2D = {
    id,
    path: attrs['@_path'],
    contentType: attrs['@_contenttype'],
  };
  if (attrs['@_tilestyleu']) texture.tileStyleU = attrs['@_tilestyleu'];
  if (attrs['@_tilestylev']) texture.tileStyleV = attrs['@_tilestylev'];
  if (attrs['@_filter']) texture.filter = attrs['@_filter'];
  // attach any other attributes
  for (const key of Object.keys(attrs)) {
    if (!key.startsWith('@_')) continue;
    if (
      ['@_id','@_path','@_contenttype','@_tilestyleu','@_tilestylev','@_filter'].includes(key)
    ) {
      continue;
    }
    (texture as any)[key] = attrs[key];
  }
  return texture;
}

/** Parse a single <texture2dgroup> element */
export function parseTexture2DGroup(element: any): Texture2DGroup {
  const attrs = element;
  if (!attrs['@_id']) {
    throw new ResourcesParseError('texture2dgroup missing required id attribute');
  }
  if (!attrs['@_texid']) {
    throw new ResourcesParseError('texture2dgroup missing required texid attribute');
  }
  const id = parseInt(attrs['@_id'], 10);
  const texId = parseInt(attrs['@_texid'], 10);
  const group: Texture2DGroup = { id, texId, tex2Coords: [] };
  if (attrs['@_displaypropertiesid']) {
    group.displayPropertiesId = parseInt(attrs['@_displaypropertiesid'], 10);
  }
  // parse child tex2coord elements
  const coords = element.tex2coord ? (Array.isArray(element.tex2coord) ? element.tex2coord : [element.tex2coord]) : [];
  for (const coord of coords) {
    if (coord['@_u'] === undefined || coord['@_v'] === undefined) {
      throw new ResourcesParseError('tex2coord missing required u or v attribute');
    }
    const u = parseFloat(coord['@_u']);
    const v = parseFloat(coord['@_v']);
    const tex2: Tex2Coord = { u, v };
    // attach other attributes
    for (const key of Object.keys(coord)) {
      if (!key.startsWith('@_')) continue;
      if (['@_u','@_v'].includes(key)) continue;
      (tex2 as any)[key] = coord[key];
    }
    group.tex2Coords.push(tex2);
  }
  // other attributes
  for (const key of Object.keys(attrs)) {
    if (!key.startsWith('@_')) continue;
    if (['@_id','@_texid','@_displaypropertiesid'].includes(key)) continue;
    (group as any)[key] = attrs[key];
  }
  return group;
}

/** Parse a single <colorgroup> element */
export function parseColorGroup(element: any): ColorGroup {
  const attrs = element;
  if (!attrs['@_id']) {
    throw new ResourcesParseError('colorgroup missing required id attribute');
  }
  const id = parseInt(attrs['@_id'], 10);
  const group: ColorGroup = { id, colors: [] };
  if (attrs['@_displaypropertiesid']) {
    group.displayPropertiesId = parseInt(attrs['@_displaypropertiesid'], 10);
  }
  const cols = element.color ? (Array.isArray(element.color) ? element.color : [element.color]) : [];
  for (const col of cols) {
    if (!col['@_color']) {
      throw new ResourcesParseError('color missing required color attribute');
    }
    const c: Color = { color: col['@_color'] };
    // extra attrs
    for (const key of Object.keys(col)) {
      if (key !== '@_color') (c as any)[key] = col[key];
    }
    group.colors.push(c);
  }
  // extra attrs
  for (const key of Object.keys(attrs)) {
    if (!key.startsWith('@_')) continue;
    if (['@_id','@_displaypropertiesid'].includes(key)) continue;
    (group as any)[key] = attrs[key];
  }
  return group;
}

/** Parse a single <compositematerials> element */
export function parseCompositeMaterials(element: any): CompositeMaterials {
  const attrs = element;
  if (!attrs['@_id']) throw new ResourcesParseError('compositematerials missing required id attribute');
  if (!attrs['@_matid']) throw new ResourcesParseError('compositematerials missing required matid attribute');
  if (!attrs['@_matindices']) throw new ResourcesParseError('compositematerials missing required matindices attribute');
  const id = parseInt(attrs['@_id'], 10);
  const matId = parseInt(attrs['@_matid'], 10);
  const matIndices = attrs['@_matindices'].split(/\s+/).map((s: string) => parseInt(s, 10));
  const group: CompositeMaterials = { id, matId, matIndices, composites: [] };
  if (attrs['@_displaypropertiesid']) group.displayPropertiesId = parseInt(attrs['@_displaypropertiesid'], 10);
  const comps = element.composite ? (Array.isArray(element.composite) ? element.composite : [element.composite]) : [];
  for (const comp of comps) {
    if (!comp['@_values']) throw new ResourcesParseError('composite missing required values attribute');
    const values = comp['@_values'].split(/\s+/).map((s: string) => parseFloat(s));
    const c: Composite = { values };
    for (const key of Object.keys(comp)) {
      if (key !== '@_values') (c as any)[key] = comp[key];
    }
    group.composites.push(c);
  }
  // extra attrs
  for (const key of Object.keys(attrs)) {
    if (!key.startsWith('@_')) continue;
    if (['@_id','@_matid','@_matindices','@_displaypropertiesid'].includes(key)) continue;
    (group as any)[key] = attrs[key];
  }
  return group;
}

/** Parse a single <multiproperties> element */
export function parseMultiProperties(element: any): MultiProperties {
  const attrs = element;
  if (!attrs['@_id']) throw new ResourcesParseError('multiproperties missing required id attribute');
  if (!attrs['@_pids']) throw new ResourcesParseError('multiproperties missing required pids attribute');
  const id = parseInt(attrs['@_id'], 10);
  const pids = attrs['@_pids'].split(/\s+/).map((s: string) => parseInt(s, 10));
  const mp: MultiProperties = { id, pids, multis: [] };
  if (attrs['@_blendmethods']) mp.blendMethods = attrs['@_blendmethods'].split(/\s+/) as any;
  const multis = element.multi ? (Array.isArray(element.multi) ? element.multi : [element.multi]) : [];
  for (const m of multis) {
    if (!m['@_pindices']) throw new ResourcesParseError('multi missing required pindices attribute');
    const pIndices = m['@_pindices'].split(/\s+/).map((s: string) => parseInt(s, 10));
    const mu: Multi = { pIndices };
    for (const key of Object.keys(m)) {
      if (key !== '@_pindices') (mu as any)[key] = m[key];
    }
    mp.multis.push(mu);
  }
  // extra attrs
  for (const key of Object.keys(attrs)) {
    if (!key.startsWith('@_')) continue;
    if (['@_id','@_pids','@_blendmethods'].includes(key)) continue;
    (mp as any)[key] = attrs[key];
  }
  return mp;
}

/** Parse a single <pbspeculardisplayproperties> element */
export function parsePBSpecularDisplayProperties(element: any): PBSpecularDisplayProperties {
  const attrs = element;
  if (!attrs['@_id']) throw new ResourcesParseError('pbspeculardisplayproperties missing required id attribute');
  const id = parseInt(attrs['@_id'], 10);
  // require at least one <pbspecular> child element
  if (!element.pbspecular) {
    throw new ResourcesParseError('pbspeculardisplayproperties missing required pbspecular element');
  }
  // specular elements
  const items = element.pbspecular ? (Array.isArray(element.pbspecular) ? element.pbspecular : [element.pbspecular]) : [];
  const specular = items.map((item: any) => {
    if (!item['@_name']) throw new ResourcesParseError('pbspecular missing required name attribute');
    const spec: PBSpecularDisplayProperties['specular'][0] = { name: item['@_name'] };
    if (item['@_specularcolor']) spec.specularColor = item['@_specularcolor'];
    if (item['@_glossiness']) spec.glossiness = parseFloat(item['@_glossiness']);
    // other attrs
    for (const key of Object.keys(item)) {
      if (!['@_name','@_specularcolor','@_glossiness'].includes(key)) (spec as any)[key] = item[key];
    }
    return spec;
  });
  const dp: PBSpecularDisplayProperties = { id, specular };
  // attach other attrs on container
  for (const key of Object.keys(attrs)) {
    if (key.startsWith('@_') && key !== '@_id') dp[key] = attrs[key];
  }
  return dp;
}

/** Parse a single <pbmetallicdisplayproperties> element */
export function parsePBMetallicDisplayProperties(element: any): PBMetallicDisplayProperties {
  const attrs = element;
  if (!attrs['@_id']) throw new ResourcesParseError('pbmetallicdisplayproperties missing required id attribute');
  const id = parseInt(attrs['@_id'], 10);
  const items = element.pbmetallic ? (Array.isArray(element.pbmetallic) ? element.pbmetallic : [element.pbmetallic]) : [];
  const metallic = items.map((item: any) => {
    if (!item['@_name']) throw new ResourcesParseError('pbmetallic missing required name attribute');
    const m: PBMetallicDisplayProperties['metallic'][0] = { name: item['@_name'] };
    if (item['@_metallicness']) m.metallicness = parseFloat(item['@_metallicness']);
    if (item['@_roughness']) m.roughness = parseFloat(item['@_roughness']);
    for (const key of Object.keys(item)) {
      if (!['@_name','@_metallicness','@_roughness'].includes(key)) (m as any)[key] = item[key];
    }
    return m;
  });
  const dp: PBMetallicDisplayProperties = { id, metallic };
  for (const key of Object.keys(attrs)) {
    if (key.startsWith('@_') && key !== '@_id') dp[key] = attrs[key];
  }
  return dp;
}

/** Parse a single <pbspeculartexturedisplayproperties> element */
export function parsePBSpecularTextureDisplayProperties(element: any): PBSpecularTextureDisplayProperties {
  const attrs = element;
  if (!attrs['@_id']) throw new ResourcesParseError('pbspeculartexturedisplayproperties missing required id attribute');
  if (!attrs['@_name']) throw new ResourcesParseError('pbspeculartexturedisplayproperties missing required name attribute');
  if (!attrs['@_speculartextureid']) throw new ResourcesParseError('pbspeculartexturedisplayproperties missing required speculartextureid attribute');
  if (!attrs['@_glossinesstextureid']) throw new ResourcesParseError('pbspeculartexturedisplayproperties missing required glossinesstextureid attribute');
  const dp: PBSpecularTextureDisplayProperties = {
    id: parseInt(attrs['@_id'], 10),
    name: attrs['@_name'],
    specularTextureId: parseInt(attrs['@_speculartextureid'], 10),
    glossinessTextureId: parseInt(attrs['@_glossinesstextureid'], 10),
  };
  if (attrs['@_diffusefactor']) dp.diffuseFactor = attrs['@_diffusefactor'];
  if (attrs['@_specularfactor']) dp.specularFactor = attrs['@_specularfactor'];
  if (attrs['@_glossinessfactor']) dp.glossinessFactor = parseFloat(attrs['@_glossinessfactor']);
  for (const key of Object.keys(attrs)) {
    if (key.startsWith('@_') && !['@_id','@_name','@_speculartextureid','@_glossinesstextureid','@_diffusefactor','@_specularfactor','@_glossinessfactor'].includes(key)) {
      (dp as any)[key] = attrs[key];
    }
  }
  return dp;
}

/** Parse a single <pbmetallictexturedisplayproperties> element */
export function parsePBMetallicTextureDisplayProperties(element: any): PBMetallicTextureDisplayProperties {
  const attrs = element;
  if (!attrs['@_id']) throw new ResourcesParseError('pbmetallictexturedisplayproperties missing required id attribute');
  if (!attrs['@_name']) throw new ResourcesParseError('pbmetallictexturedisplayproperties missing required name attribute');
  if (!attrs['@_metallictextureid']) throw new ResourcesParseError('pbmetallictexturedisplayproperties missing required metallictextureid attribute');
  if (!attrs['@_roughnesstextureid']) throw new ResourcesParseError('pbmetallictexturedisplayproperties missing required roughnesstextureid attribute');
  const dp: PBMetallicTextureDisplayProperties = {
    id: parseInt(attrs['@_id'], 10),
    name: attrs['@_name'],
    metallicTextureId: parseInt(attrs['@_metallictextureid'], 10),
    roughnessTextureId: parseInt(attrs['@_roughnesstextureid'], 10),
  };
  if (attrs['@_metallicfactor']) dp.metallicFactor = parseFloat(attrs['@_metallicfactor']);
  if (attrs['@_roughnessfactor']) dp.roughnessFactor = parseFloat(attrs['@_roughnessfactor']);
  for (const key of Object.keys(attrs)) {
    if (key.startsWith('@_') && !['@_id','@_name','@_metallictextureid','@_roughnesstextureid','@_metallicfactor','@_roughnessfactor'].includes(key)) {
      (dp as any)[key] = attrs[key];
    }
  }
  return dp;
}

/** Parse a single <translucentdisplayproperties> element */
export function parseTranslucentDisplayProperties(element: any): TranslucentDisplayProperties {
  const attrs = element;
  if (!attrs['@_id']) throw new ResourcesParseError('translucentdisplayproperties missing required id attribute');
  if (!element.translucent) {
    throw new ResourcesParseError('translucentdisplayproperties missing required translucent element');
  }
  const id = parseInt(attrs['@_id'], 10);
  const items = element.translucent ? (Array.isArray(element.translucent) ? element.translucent : [element.translucent]) : [];
  const translucent = items.map((item: any) => {
    if (!item['@_name']) throw new ResourcesParseError('translucent missing required name attribute');
    if (!item['@_attenuation']) throw new ResourcesParseError('translucent missing required attenuation attribute');
    const t: TranslucentDisplayProperties['translucent'][0] = {
      name: item['@_name'],
      attenuation: item['@_attenuation'].split(/\s+/).map((s: string) => parseFloat(s)),
    };
    if (item['@_refractiveindex']) t.refractiveIndex = item['@_refractiveindex'].split(/\s+/).map((s: string) => parseFloat(s));
    if (item['@_roughness']) t.roughness = parseFloat(item['@_roughness']);
    for (const key of Object.keys(item)) {
      if (!['@_name','@_attenuation','@_refractiveindex','@_roughness'].includes(key)) (t as any)[key] = item[key];
    }
    return t;
  });
  const dp: TranslucentDisplayProperties = { id, translucent };
  for (const key of Object.keys(attrs)) {
    if (key.startsWith('@_') && key !== '@_id') dp[key] = attrs[key];
  }
  return dp;
}

/** Parse display property groups under <resources> */
export function parseMaterialsExtensions(xmlObj: any): MaterialsExtensionResources {
  const result: MaterialsExtensionResources = {
    textures: new Map(),
    texture2DGroups: new Map(),
    colorGroups: new Map(),
    compositeMaterials: new Map(),
    multiProperties: new Map(),
    displayProperties: new Map(),
  };
  if (!xmlObj || !xmlObj.model) return result;
  const model = xmlObj.model;
  const nsKey = `@_xmlns:${MATERIALS_EXTENSION_PREFIX}`;
  if (model[nsKey] !== MATERIALS_EXTENSION_NAMESPACE) return result;
  const resources = model.resources;
  if (!resources) return result;
  // parse textures
  if (resources.texture2d) {
    const list = Array.isArray(resources.texture2d) ? resources.texture2d : [resources.texture2d];
    for (const el of list) {
      const tex = parseTexture2D(el);
      if (result.textures.has(tex.id)) throw new ResourcesParseError(`Duplicate texture2d id: ${tex.id}`);
      result.textures.set(tex.id, tex);
    }
  }
  // parse texture2dgroup
  if (resources.texture2dgroup) {
    const list = Array.isArray(resources.texture2dgroup) ? resources.texture2dgroup : [resources.texture2dgroup];
    for (const el of list) {
      const grp = parseTexture2DGroup(el);
      if (result.texture2DGroups.has(grp.id)) throw new ResourcesParseError(`Duplicate texture2dgroup id: ${grp.id}`);
      result.texture2DGroups.set(grp.id, grp);
    }
  }
  // parse colorgroup
  if (resources.colorgroup) {
    const list = Array.isArray(resources.colorgroup) ? resources.colorgroup : [resources.colorgroup];
    for (const el of list) {
      const grp = parseColorGroup(el);
      if (result.colorGroups.has(grp.id)) throw new ResourcesParseError(`Duplicate colorgroup id: ${grp.id}`);
      result.colorGroups.set(grp.id, grp);
    }
  }
  // parse compositematerials
  if (resources.compositematerials) {
    const list = Array.isArray(resources.compositematerials)
      ? resources.compositematerials
      : [resources.compositematerials];
    for (const el of list) {
      const grp = parseCompositeMaterials(el);
      if (result.compositeMaterials.has(grp.id)) throw new ResourcesParseError(`Duplicate compositematerials id: ${grp.id}`);
      result.compositeMaterials.set(grp.id, grp);
    }
  }
  // parse multiproperties
  if (resources.multiproperties) {
    const list = Array.isArray(resources.multiproperties)
      ? resources.multiproperties
      : [resources.multiproperties];
    for (const el of list) {
      const mp = parseMultiProperties(el);
      if (result.multiProperties.has(mp.id)) throw new ResourcesParseError(`Duplicate multiproperties id: ${mp.id}`);
      result.multiProperties.set(mp.id, mp);
    }
  }
  // parse pbspeculardisplayproperties
  if (resources.pbspeculardisplayproperties) {
    const list = Array.isArray(resources.pbspeculardisplayproperties)
      ? resources.pbspeculardisplayproperties
      : [resources.pbspeculardisplayproperties];
    for (const el of list) {
      const dp = parsePBSpecularDisplayProperties(el);
      if (result.displayProperties.has(dp.id)) throw new ResourcesParseError(`Duplicate pbspeculardisplayproperties id: ${dp.id}`);
      result.displayProperties.set(dp.id, dp);
    }
  }
  // parse pbmetallicdisplayproperties
  if (resources.pbmetallicdisplayproperties) {
    const list = Array.isArray(resources.pbmetallicdisplayproperties)
      ? resources.pbmetallicdisplayproperties
      : [resources.pbmetallicdisplayproperties];
    for (const el of list) {
      const dp = parsePBMetallicDisplayProperties(el);
      if (result.displayProperties.has(dp.id)) throw new ResourcesParseError(`Duplicate pbmetallicdisplayproperties id: ${dp.id}`);
      result.displayProperties.set(dp.id, dp);
    }
  }
  // parse pbspeculartexturedisplayproperties
  if (resources.pbspeculartexturedisplayproperties) {
    const list = Array.isArray(resources.pbspeculartexturedisplayproperties)
      ? resources.pbspeculartexturedisplayproperties
      : [resources.pbspeculartexturedisplayproperties];
    for (const el of list) {
      const dp = parsePBSpecularTextureDisplayProperties(el);
      if (result.displayProperties.has(dp.id)) throw new ResourcesParseError(`Duplicate pbspeculartexturedisplayproperties id: ${dp.id}`);
      result.displayProperties.set(dp.id, dp);
    }
  }
  // parse pbmetallictexturedisplayproperties
  if (resources.pbmetallictexturedisplayproperties) {
    const list = Array.isArray(resources.pbmetallictexturedisplayproperties)
      ? resources.pbmetallictexturedisplayproperties
      : [resources.pbmetallictexturedisplayproperties];
    for (const el of list) {
      const dp = parsePBMetallicTextureDisplayProperties(el);
      if (result.displayProperties.has(dp.id)) throw new ResourcesParseError(`Duplicate pbmetallictexturedisplayproperties id: ${dp.id}`);
      result.displayProperties.set(dp.id, dp);
    }
  }
  // parse translucentdisplayproperties
  if (resources.translucentdisplayproperties) {
    const list = Array.isArray(resources.translucentdisplayproperties)
      ? resources.translucentdisplayproperties
      : [resources.translucentdisplayproperties];
    for (const el of list) {
      const dp = parseTranslucentDisplayProperties(el);
      if (result.displayProperties.has(dp.id)) throw new ResourcesParseError(`Duplicate translucentdisplayproperties id: ${dp.id}`);
      result.displayProperties.set(dp.id, dp);
    }
  }
  
  return result;
} 