import type { Mesh, Triangle, Vertex } from './mesh';

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