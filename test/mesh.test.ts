import { describe, expect, it } from 'bun:test';
import {
  parseMesh,
  parseVertices,
  parseTriangles,
  calculateNormal,
  checkManifoldEdges,
  checkConsistentOrientation,
  validateMesh,
  MeshError
} from '../src/mesh';

describe('Mesh Parser', () => {
  // Simple tetrahedron XML for testing
  const validTetrahedron = {
    vertices: {
      vertex: [
        { '@_x': '0', '@_y': '0', '@_z': '0' },
        { '@_x': '1', '@_y': '0', '@_z': '0' },
        { '@_x': '0', '@_y': '1', '@_z': '0' },
        { '@_x': '0', '@_y': '0', '@_z': '1' }
      ]
    },
    triangles: {
      triangle: [
        { '@_v1': '0', '@_v2': '1', '@_v3': '2' },
        { '@_v1': '0', '@_v2': '1', '@_v3': '3' },
        { '@_v1': '1', '@_v2': '2', '@_v3': '3' },
        { '@_v1': '0', '@_v2': '2', '@_v3': '3' }
      ]
    }
  };

  // Inverted winding on one triangle
  const invertedTetrahedron = {
    vertices: {
      vertex: [
        { '@_x': '0', '@_y': '0', '@_z': '0' },
        { '@_x': '1', '@_y': '0', '@_z': '0' },
        { '@_x': '0', '@_y': '1', '@_z': '0' },
        { '@_x': '0', '@_y': '0', '@_z': '1' }
      ]
    },
    triangles: {
      triangle: [
        { '@_v1': '0', '@_v2': '1', '@_v3': '2' },
        { '@_v1': '0', '@_v2': '1', '@_v3': '3' },
        { '@_v1': '1', '@_v2': '2', '@_v3': '3' },
        // This triangle has inverted winding
        { '@_v1': '0', '@_v2': '3', '@_v3': '2' }
      ]
    }
  };

  // Non-manifold example
  const nonManifoldMesh = {
    vertices: {
      vertex: [
        { '@_x': '0', '@_y': '0', '@_z': '0' },
        { '@_x': '1', '@_y': '0', '@_z': '0' },
        { '@_x': '0', '@_y': '1', '@_z': '0' },
        { '@_x': '0', '@_y': '0', '@_z': '1' },
        { '@_x': '2', '@_y': '0', '@_z': '0' }
      ]
    },
    triangles: {
      triangle: [
        { '@_v1': '0', '@_v2': '1', '@_v3': '2' },
        { '@_v1': '0', '@_v2': '1', '@_v3': '3' },
        { '@_v1': '1', '@_v2': '2', '@_v3': '3' },
        // This triangle shares only one vertex with the others
        { '@_v1': '1', '@_v2': '4', '@_v3': '3' }
      ]
    }
  };

  it('should parse vertices correctly', () => {
    const vertices = parseVertices(validTetrahedron);
    expect(vertices.length).toBe(4);
    expect(vertices[0]).toEqual({ x: 0, y: 0, z: 0 });
    expect(vertices[3]).toEqual({ x: 0, y: 0, z: 1 });
  });

  it('should parse triangles correctly', () => {
    const triangles = parseTriangles(validTetrahedron, 4);
    expect(triangles.length).toBe(4);
    expect(triangles[0]).toEqual({ v1: 0, v2: 1, v3: 2 });
  });

  it('should calculate normals correctly', () => {
    const normal = calculateNormal(
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 }
    );
    
    // Normal for triangle on XY plane should point along Z
    expect(normal.x).toBeCloseTo(0);
    expect(normal.y).toBeCloseTo(0);
    expect(normal.z).toBeCloseTo(1);
  });

  it('should identify a valid manifold mesh', () => {
    const mesh = parseMesh(validTetrahedron);
    expect(checkManifoldEdges(mesh)).toBe(true);
  });

  it('should identify a non-manifold mesh', () => {
    const mesh = parseMesh(nonManifoldMesh);
    expect(checkManifoldEdges(mesh)).toBe(false);
  });

  it('should correctly validate a model-type tetrahedron', () => {
    const mesh = parseMesh(validTetrahedron);
    const validatedMesh = validateMesh(mesh, 'model');
    expect(validatedMesh.isManifold).toBe(true);
    expect(validatedMesh.hasConsistentOrientation).toBe(true);
  });

  it('should reject a model-type mesh with inconsistent orientation', () => {
    const mesh = parseMesh(invertedTetrahedron);
    
    expect(() => {
      validateMesh(mesh, 'model');
    }).toThrow(MeshError);
  });

  it('should allow non-manifold mesh for support type', () => {
    const mesh = parseMesh(nonManifoldMesh);
    
    // This should not throw
    const validatedMesh = validateMesh(mesh, 'support');
    
    // But it should still be marked as non-manifold
    expect(validatedMesh.isManifold).toBe(false);
  });
}); 