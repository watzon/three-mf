import { describe, expect, it } from 'bun:test';
import {
  Matrix3D,
  validateComponentReferences,
  flattenComponentHierarchy,
  validateAllComponentReferences,
  ComponentError
} from '../src/components';
import { ObjectType } from '../src/resources';
import type { ObjectResource, Component } from '../src/resources';
import type { Mesh, Vertex } from '../src/mesh';

describe('Matrix3D', () => {
  it('should create an identity matrix by default', () => {
    const matrix = new Matrix3D();
    expect(matrix.toString()).toBe('1 0 0 0 1 0 0 0 1 0 0 0');
  });
  
  it('should parse a matrix from string', () => {
    const matrixString = '1 0 0 0 1 0 0 0 1 10 20 30';
    const matrix = Matrix3D.fromString(matrixString);
    expect(matrix.toString()).toBe(matrixString);
  });
  
  it('should transform a vertex', () => {
    // Translation matrix
    const matrix = Matrix3D.fromString('1 0 0 0 1 0 0 0 1 10 20 30');
    const vertex: Vertex = { x: 1, y: 2, z: 3 };
    
    const transformed = matrix.transformVertex(vertex);
    
    expect(transformed.x).toBe(11); // 1 + 10
    expect(transformed.y).toBe(22); // 2 + 20
    expect(transformed.z).toBe(33); // 3 + 30
  });
  
  it('should multiply matrices', () => {
    // Translation matrices
    const matrix1 = Matrix3D.fromString('1 0 0 0 1 0 0 0 1 10 20 30');
    const matrix2 = Matrix3D.fromString('1 0 0 0 1 0 0 0 1 5 10 15');
    
    const result = matrix1.multiply(matrix2);
    
    // Result should be a translation by (15, 30, 45)
    const vertex: Vertex = { x: 0, y: 0, z: 0 };
    const transformed = result.transformVertex(vertex);
    
    expect(transformed.x).toBe(15);
    expect(transformed.y).toBe(30);
    expect(transformed.z).toBe(45);
  });
  
  it('should calculate determinant', () => {
    // Identity matrix has determinant 1
    const identity = new Matrix3D();
    expect(identity.determinant).toBe(1);
    
    // Scale matrix with negative scale on one axis
    const flipMatrix = Matrix3D.fromString('-1 0 0 0 1 0 0 0 1 0 0 0');
    expect(flipMatrix.determinant).toBe(-1);
  });
});

describe('Component Resolution', () => {
  it('should validate component references', () => {
    // Create a simple object hierarchy
    const objects = new Map<number, ObjectResource>();
    
    // Object 1 - mesh
    objects.set(1, {
      id: 1,
      type: ObjectType.Model,
      hasMesh: true,
      hasComponents: false,
      mesh: { vertices: [], triangles: [] }
    });
    
    // Object 2 - references Object 1
    objects.set(2, {
      id: 2,
      type: ObjectType.Model,
      hasMesh: false,
      hasComponents: true,
      components: [{ objectId: 1 }]
    });
    
    // This should not throw
    expect(() => validateComponentReferences(objects)).not.toThrow();
  });
  
  it('should detect missing component references', () => {
    const objects = new Map<number, ObjectResource>();
    
    // Object 2 references non-existent Object 1
    objects.set(2, {
      id: 2,
      type: ObjectType.Model,
      hasMesh: false,
      hasComponents: true,
      components: [{ objectId: 1 }]
    });
    
    expect(() => validateComponentReferences(objects)).toThrow(ComponentError);
  });
  
  it('should detect circular references', () => {
    const objects = new Map<number, ObjectResource>();
    
    // Create circular reference: 1 -> 2 -> 3 -> 1
    objects.set(1, {
      id: 1,
      type: ObjectType.Model,
      hasMesh: false,
      hasComponents: true,
      components: [{ objectId: 2 }]
    });
    
    objects.set(2, {
      id: 2,
      type: ObjectType.Model,
      hasMesh: false,
      hasComponents: true,
      components: [{ objectId: 3 }]
    });
    
    objects.set(3, {
      id: 3,
      type: ObjectType.Model,
      hasMesh: false,
      hasComponents: true,
      components: [{ objectId: 1 }]
    });
    
    expect(() => validateComponentReferences(objects)).toThrow(ComponentError);
  });
  
  it('should reject "other" type components', () => {
    const objects = new Map<number, ObjectResource>();
    
    // Object 1 - "other" type with mesh
    objects.set(1, {
      id: 1,
      type: ObjectType.Other,
      hasMesh: true,
      hasComponents: false,
      mesh: { vertices: [], triangles: [] }
    });
    
    // Object 2 - references Object 1
    objects.set(2, {
      id: 2,
      type: ObjectType.Model,
      hasMesh: false,
      hasComponents: true,
      components: [{ objectId: 1 }]
    });
    
    expect(() => validateComponentReferences(objects)).toThrow(ComponentError);
  });
});

describe('Component Flattening', () => {
  it('should flatten a simple component hierarchy', () => {
    // Create a simple object hierarchy
    const objects = new Map<number, ObjectResource>();
    
    // Object 1 - a cube at the origin
    const cubeMesh: Mesh = {
      vertices: [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
        { x: 1, y: 1, z: 0 },
        { x: 0, y: 0, z: 1 },
        { x: 1, y: 0, z: 1 },
        { x: 0, y: 1, z: 1 },
        { x: 1, y: 1, z: 1 }
      ],
      triangles: [
        { v1: 0, v2: 1, v3: 2 },
        { v1: 1, v2: 3, v3: 2 },
        { v1: 4, v2: 6, v3: 5 },
        { v1: 5, v2: 6, v3: 7 },
      ]
    };
    
    objects.set(1, {
      id: 1,
      type: ObjectType.Model,
      hasMesh: true,
      hasComponents: false,
      mesh: cubeMesh
    });
    
    // Object 2 - references Object 1 with translation
    objects.set(2, {
      id: 2,
      type: ObjectType.Model,
      hasMesh: false,
      hasComponents: true,
      components: [{ 
        objectId: 1, 
        transform: '1 0 0 0 1 0 0 0 1 2 0 0' // Translate by (2, 0, 0)
      }]
    });
    
    // Flatten the hierarchy
    const flattened = flattenComponentHierarchy(2, objects);
    
    // Add non-null assertions
    expect(flattened.vertices.length).toBe(cubeMesh.vertices.length);
    expect(flattened.triangles.length).toBe(cubeMesh.triangles.length);
    
    // Check that vertices exist before comparing
    expect(flattened.vertices[0]).toBeDefined();
    expect(flattened.vertices[1]).toBeDefined();
    
    // Vertices should be translated
    expect(flattened.vertices[0]!.x).toBe(2); // 0 + 2
    expect(flattened.vertices[0]!.y).toBe(0);
    expect(flattened.vertices[0]!.z).toBe(0);
    
    expect(flattened.vertices[1]!.x).toBe(3); // 1 + 2
    expect(flattened.vertices[1]!.y).toBe(0);
    expect(flattened.vertices[1]!.z).toBe(0);
  });
  
  it('should handle nested component hierarchies', () => {
    // Create a more complex hierarchy
    const objects = new Map<number, ObjectResource>();
    
    // Object 1 - a simple triangle
    objects.set(1, {
      id: 1,
      type: ObjectType.Model,
      hasMesh: true,
      hasComponents: false,
      mesh: {
        vertices: [
          { x: 0, y: 0, z: 0 },
          { x: 1, y: 0, z: 0 },
          { x: 0, y: 1, z: 0 }
        ],
        triangles: [
          { v1: 0, v2: 1, v3: 2 }
        ]
      }
    });
    
    // Object 2 - references Object 1 with translation
    objects.set(2, {
      id: 2,
      type: ObjectType.Model,
      hasMesh: false,
      hasComponents: true,
      components: [{ 
        objectId: 1, 
        transform: '1 0 0 0 1 0 0 0 1 2 0 0' // Translate by (2, 0, 0)
      }]
    });
    
    // Object 3 - references Object 2 with another translation
    objects.set(3, {
      id: 3,
      type: ObjectType.Model,
      hasMesh: false,
      hasComponents: true,
      components: [{ 
        objectId: 2, 
        transform: '1 0 0 0 1 0 0 0 1 0 3 0' // Translate by (0, 3, 0)
      }]
    });
    
    // Flatten the hierarchy
    const flattened = flattenComponentHierarchy(3, objects);
    
    // Check that vertices exist before comparing
    expect(flattened.vertices[0]).toBeDefined();
    expect(flattened.vertices[1]).toBeDefined();
    
    // Check the first vertex - should be translated by (2, 3, 0)
    expect(flattened.vertices[0]!.x).toBe(2); // 0 + 2 + 0
    expect(flattened.vertices[0]!.y).toBe(3); // 0 + 0 + 3
    expect(flattened.vertices[0]!.z).toBe(0);
    
    // Check the second vertex - should also be translated
    expect(flattened.vertices[1]!.x).toBe(3); // 1 + 2 + 0
    expect(flattened.vertices[1]!.y).toBe(3); // 0 + 0 + 3
    expect(flattened.vertices[1]!.z).toBe(0);
  });
}); 