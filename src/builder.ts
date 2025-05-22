import type { Mesh, Triangle, Vertex } from './mesh';
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
 * XML representation of a vertex
 */
export interface XmlVertex {
  '@_x': number;
  '@_y': number;
  '@_z': number;
}

/**
 * XML representation of a triangle
 */
export interface XmlTriangle {
  '@_v1': number;
  '@_v2': number;
  '@_v3': number;
  '@_p1'?: number;
  '@_p2'?: number;
  '@_p3'?: number;
  '@_pid'?: number;
}

/**
 * Convert a Mesh object into XML-friendly structure for 3MF
 */
export function meshToXml(mesh: Mesh): {
  vertices: { vertex: XmlVertex[] };
  triangles: { triangle: XmlTriangle[] };
} {
  const vertices: XmlVertex[] = mesh.vertices.map((v: Vertex) => ({ '@_x': v.x, '@_y': v.y, '@_z': v.z }));
  const triangles: XmlTriangle[] = mesh.triangles.map((t: Triangle) => {
    const xmlTri: XmlTriangle = { '@_v1': t.v1, '@_v2': t.v2, '@_v3': t.v3 };
    if (t.p1 !== undefined) xmlTri['@_p1'] = t.p1;
    if (t.p2 !== undefined) xmlTri['@_p2'] = t.p2;
    if (t.p3 !== undefined) xmlTri['@_p3'] = t.p3;
    if (t.pid !== undefined) xmlTri['@_pid'] = t.pid;
    return xmlTri;
  });
  return { vertices: { vertex: vertices }, triangles: { triangle: triangles } };
}

/**
 * Convert a Mesh into a full Object XML element for inclusion in resources
 * @param id Numeric object ID
 * @param mesh Mesh data to serialize
 * @param attributes Optional extra XML attributes (@_name, @_partnumber, etc.)
 */
export function objectWithMesh(
  id: number,
  mesh: Mesh,
  attributes: Record<string, string | number> = {}
): any {
  const obj: any = { '@_id': String(id), '@_type': 'model', ...attributes };
  obj.mesh = meshToXml(mesh);
  return obj;
}

/**
 * Build a minimal XML object literal for the 3MF <build> section
 * @param objectId ID of the resource object to include in the build
 * @param attributes Optional extra XML attributes (e.g. @_transform)
 */
export function buildItemXml(
  objectId: number,
  attributes: Record<string, string> = {}
): any {
  return { '@_objectid': String(objectId), ...attributes };
}

/**
 * Top-level 3MF XML structure types for serialization
 */
export type ObjectElement = ReturnType<typeof objectWithMesh>;
export type BuildItemElement = ReturnType<typeof buildItemXml>;

export interface ResourcesXml {
  object: ObjectElement | ObjectElement[];
}

export interface BuildXml {
  item: BuildItemElement | BuildItemElement[];
}

export interface ModelXml {
  '@_unit': string;
  '@_xmlns': string;
  resources: ResourcesXml;
  build: BuildXml;
}

export interface ThreeMFXml {
  model: ModelXml;
}

// Builder helper functions for 3MF Materials & Properties Extension

/** Build <texture2d> element */
export function texture2dToXml(tex: Texture2D): any {
  const el: any = { '@_id': String(tex.id), '@_path': tex.path, '@_contenttype': tex.contentType };
  if (tex.tileStyleU) el['@_tilestyleu'] = tex.tileStyleU;
  if (tex.tileStyleV) el['@_tilestylev'] = tex.tileStyleV;
  if (tex.filter) el['@_filter'] = tex.filter;
  for (const key of Object.keys(tex)) {
    if (!['id','path','contentType','tileStyleU','tileStyleV','filter'].includes(key)) {
      (el as any)[key] = (tex as any)[key];
    }
  }
  return el;
}

/** Build <texture2dgroup> element */
export function texture2dGroupToXml(grp: Texture2DGroup): any {
  const el: any = { '@_id': String(grp.id), '@_texid': String(grp.texId) };
  if (grp.displayPropertiesId) el['@_displaypropertiesid'] = String(grp.displayPropertiesId);
  el.tex2coord = grp.tex2Coords.map(coord => {
    const c: any = { '@_u': coord.u, '@_v': coord.v };
    for (const key of Object.keys(coord)) {
      if (!['u','v'].includes(key)) (c as any)[key] = (coord as any)[key];
    }
    return c;
  });
  for (const key of Object.keys(grp)) {
    if (!['id','texId','displayPropertiesId','tex2Coords'].includes(key)) {
      (el as any)[key] = (grp as any)[key];
    }
  }
  return el;
}

/** Build <colorgroup> element */
export function colorGroupToXml(grp: ColorGroup): any {
  const el: any = { '@_id': String(grp.id) };
  if (grp.displayPropertiesId) el['@_displaypropertiesid'] = String(grp.displayPropertiesId);
  el.color = grp.colors.map(color => {
    const c: any = { '@_color': color.color };
    for (const key of Object.keys(color)) {
      if (key !== 'color') (c as any)[key] = (color as any)[key];
    }
    return c;
  });
  for (const key of Object.keys(grp)) {
    if (!['id','displayPropertiesId','colors'].includes(key)) {
      (el as any)[key] = (grp as any)[key];
    }
  }
  return el;
}

/** Build <compositematerials> element */
export function compositeMaterialsToXml(grp: CompositeMaterials): any {
  const el: any = { '@_id': String(grp.id), '@_matid': String(grp.matId), '@_matindices': grp.matIndices.join(' ') };
  if (grp.displayPropertiesId) el['@_displaypropertiesid'] = String(grp.displayPropertiesId);
  el.composite = grp.composites.map(comp => {
    const c: any = { '@_values': comp.values.join(' ') };
    for (const key of Object.keys(comp)) {
      if (key !== 'values') (c as any)[key] = (comp as any)[key];
    }
    return c;
  });
  for (const key of Object.keys(grp)) {
    if (!['id','matId','matIndices','displayPropertiesId','composites'].includes(key)) {
      (el as any)[key] = (grp as any)[key];
    }
  }
  return el;
}

/** Build <multiproperties> element */
export function multiPropertiesToXml(mp: MultiProperties): any {
  const el: any = { '@_id': String(mp.id), '@_pids': mp.pids.join(' ') };
  if (mp.blendMethods) el['@_blendmethods'] = mp.blendMethods.join(' ');
  el.multi = mp.multis.map(m => {
    const mu: any = { '@_pindices': m.pIndices.join(' ') };
    for (const key of Object.keys(m)) {
      if (key !== 'pIndices') (mu as any)[key] = (m as any)[key];
    }
    return mu;
  });
  for (const key of Object.keys(mp)) {
    if (!['id','pids','blendMethods','multis'].includes(key)) {
      (el as any)[key] = (mp as any)[key];
    }
  }
  return el;
}

// Display properties builders

/** Build <pbspeculardisplayproperties> element */
export function pbSpecularDisplayPropertiesToXml(dp: PBSpecularDisplayProperties): any {
  const el: any = { '@_id': String(dp.id) };
  el.pbspecular = dp.specular.map(s => {
    const c: any = { '@_name': s.name };
    if (s.specularColor) c['@_specularcolor'] = s.specularColor;
    if (s.glossiness !== undefined) c['@_glossiness'] = s.glossiness;
    for (const key of Object.keys(s)) {
      if (!['name','specularColor','glossiness'].includes(key)) (c as any)[key] = (s as any)[key];
    }
    return c;
  });
  for (const key of Object.keys(dp)) {
    if (key !== 'id' && key !== 'specular') (el as any)[`@_${key}`] = (dp as any)[key];
  }
  return el;
}

/** Build <translucentdisplayproperties> element */
export function translucentDisplayPropertiesToXml(dp: TranslucentDisplayProperties): any {
  const el: any = { '@_id': String(dp.id) };
  el.translucent = dp.translucent.map(t => {
    const c: any = { '@_name': t.name, '@_attenuation': t.attenuation.join(' ') };
    if (t.refractiveIndex) c['@_refractiveindex'] = t.refractiveIndex.join(' ');
    if (t.roughness !== undefined) c['@_roughness'] = t.roughness;
    for (const key of Object.keys(t)) {
      if (!['name','attenuation','refractiveIndex','roughness'].includes(key)) (c as any)[key] = (t as any)[key];
    }
    return c;
  });
  for (const key of Object.keys(dp)) {
    if (key !== 'id' && key !== 'translucent') (el as any)[`@_${key}`] = (dp as any)[key];
  }
  return el;
}

/** Build <pbmetallicdisplayproperties> element */
export function pbMetallicDisplayPropertiesToXml(dp: PBMetallicDisplayProperties): any {
  const el: any = { '@_id': String(dp.id) };
  el.pbmetallic = dp.metallic.map(m => {
    const c: any = { '@_name': m.name };
    if (m.metallicness !== undefined) c['@_metallicness'] = m.metallicness;
    if (m.roughness !== undefined) c['@_roughness'] = m.roughness;
    for (const key of Object.keys(m)) {
      if (!['name','metallicness','roughness'].includes(key)) (c as any)[key] = (m as any)[key];
    }
    return c;
  });
  for (const key of Object.keys(dp)) {
    if (key !== 'id' && key !== 'metallic') (el as any)[`@_${key}`] = (dp as any)[key];
  }
  return el;
}

/** Build <pbspeculartexturedisplayproperties> element */
export function pbSpecularTextureDisplayPropertiesToXml(dp: PBSpecularTextureDisplayProperties): any {
  const el: any = {
    '@_id': String(dp.id),
    '@_name': dp.name,
    '@_speculartextureid': String(dp.specularTextureId),
    '@_glossinesstextureid': String(dp.glossinessTextureId)
  };
  if (dp.diffuseFactor) el['@_diffusefactor'] = dp.diffuseFactor;
  if (dp.specularFactor) el['@_specularfactor'] = dp.specularFactor;
  if (dp.glossinessFactor !== undefined) el['@_glossinessfactor'] = dp.glossinessFactor;
  for (const key of Object.keys(dp)) {
    if (key.startsWith('@_') && !['@_id','@_name','@_speculartextureid','@_glossinesstextureid','@_diffusefactor','@_specularfactor','@_glossinessfactor'].includes(key)) {
      (el as any)[key] = (dp as any)[key];
    }
  }
  return el;
}

/** Build <pbmetallictexturedisplayproperties> element */
export function pbMetallicTextureDisplayPropertiesToXml(dp: PBMetallicTextureDisplayProperties): any {
  const el: any = {
    '@_id': String(dp.id),
    '@_name': dp.name,
    '@_metallictextureid': String(dp.metallicTextureId),
    '@_roughnesstextureid': String(dp.roughnessTextureId)
  };
  if (dp.metallicFactor !== undefined) el['@_metallicfactor'] = dp.metallicFactor;
  if (dp.roughnessFactor !== undefined) el['@_roughnessfactor'] = dp.roughnessFactor;
  for (const key of Object.keys(dp)) {
    if (key.startsWith('@_') && !['@_id','@_name','@_metallictextureid','@_roughnesstextureid','@_metallicfactor','@_roughnessfactor'].includes(key)) {
      (el as any)[key] = (dp as any)[key];
    }
  }
  return el;
} 