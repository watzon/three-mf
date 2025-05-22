/**
 * Component composition functionality for 3MF objects
 */
import { ObjectType, ResourcesParseError } from './resources';
import { ValidationError } from './errors';
import type { ObjectResource, Component } from './resources';
import type { Mesh, Triangle, Vertex } from './mesh';
import { MeshError } from './mesh';

/**
 * 3D Matrix as defined in the 3MF spec (4x4 matrix with last row fixed as [0,0,0,1])
 */
export class Matrix3D {
  private values: number[];

  /**
   * Creates a new Matrix3D
   * @param values Array of 12 numbers for the matrix (row-major order)
   */
  constructor(values?: number[]) {
    if (values && values.length !== 12) {
      throw new Error('Matrix3D must have exactly 12 values (4x3 matrix)');
    }
    
    // If values are provided, use them; otherwise, use identity matrix
    this.values = values || [
      1, 0, 0, // m00, m01, m02
      0, 1, 0, // m10, m11, m12
      0, 0, 1, // m20, m21, m22
      0, 0, 0  // m30, m31, m32
    ];
  }

  /**
   * Parse a Matrix3D from a string representation
   * @param matrixString String representation of the matrix (12 space-separated values)
   * @returns Matrix3D instance
   * @throws Error if the string is invalid
   */
  static fromString(matrixString?: string): Matrix3D {
    if (!matrixString) {
      return new Matrix3D(); // Identity matrix
    }
    
    const values = matrixString.trim().split(/\s+/).map(Number);
    if (values.length !== 12 || values.some(isNaN)) {
      throw new Error(`Invalid matrix string: ${matrixString}`);
    }
    
    return new Matrix3D(values);
  }

  /**
   * Get the determinant of the 3x3 rotation/scale part of the matrix
   * Used to detect if the matrix flips orientation (negative determinant)
   */
  get determinant(): number {
    // Destructure values safely
    const m00 = this.values[0] || 0;
    const m01 = this.values[1] || 0;
    const m02 = this.values[2] || 0;
    const m10 = this.values[3] || 0;
    const m11 = this.values[4] || 0;
    const m12 = this.values[5] || 0;
    const m20 = this.values[6] || 0;
    const m21 = this.values[7] || 0;
    const m22 = this.values[8] || 0;
    
    return (
      m00 * (m11 * m22 - m12 * m21) -
      m01 * (m10 * m22 - m12 * m20) +
      m02 * (m10 * m21 - m11 * m20)
    );
  }

  /**
   * Transform a vertex using this matrix
   * @param vertex The vertex to transform
   * @returns Transformed vertex
   */
  transformVertex(vertex: Vertex): Vertex {
    // Safely extract values with defaults of 0
    const m00 = this.values[0] || 0;
    const m01 = this.values[1] || 0;
    const m02 = this.values[2] || 0;
    const m10 = this.values[3] || 0;
    const m11 = this.values[4] || 0;
    const m12 = this.values[5] || 0;
    const m20 = this.values[6] || 0;
    const m21 = this.values[7] || 0;
    const m22 = this.values[8] || 0;
    const m30 = this.values[9] || 0;
    const m31 = this.values[10] || 0;
    const m32 = this.values[11] || 0;
    
    return {
      x: m00 * vertex.x + m10 * vertex.y + m20 * vertex.z + m30,
      y: m01 * vertex.x + m11 * vertex.y + m21 * vertex.z + m31,
      z: m02 * vertex.x + m12 * vertex.y + m22 * vertex.z + m32
    };
  }

  /**
   * Multiply this matrix by another matrix (this * other)
   * @param other The matrix to multiply with
   * @returns A new Matrix3D representing the result
   */
  multiply(other: Matrix3D): Matrix3D {
    // Safely extract values with defaults of 0
    const a00 = this.values[0] || 0;
    const a01 = this.values[1] || 0;
    const a02 = this.values[2] || 0;
    const a10 = this.values[3] || 0;
    const a11 = this.values[4] || 0;
    const a12 = this.values[5] || 0;
    const a20 = this.values[6] || 0;
    const a21 = this.values[7] || 0;
    const a22 = this.values[8] || 0;
    const a30 = this.values[9] || 0;
    const a31 = this.values[10] || 0;
    const a32 = this.values[11] || 0;
    
    const b00 = other.values[0] || 0;
    const b01 = other.values[1] || 0;
    const b02 = other.values[2] || 0;
    const b10 = other.values[3] || 0;
    const b11 = other.values[4] || 0;
    const b12 = other.values[5] || 0;
    const b20 = other.values[6] || 0;
    const b21 = other.values[7] || 0;
    const b22 = other.values[8] || 0;
    const b30 = other.values[9] || 0;
    const b31 = other.values[10] || 0;
    const b32 = other.values[11] || 0;
    
    // Matrix multiplication
    return new Matrix3D([
      a00 * b00 + a10 * b01 + a20 * b02,
      a01 * b00 + a11 * b01 + a21 * b02,
      a02 * b00 + a12 * b01 + a22 * b02,
      
      a00 * b10 + a10 * b11 + a20 * b12,
      a01 * b10 + a11 * b11 + a21 * b12,
      a02 * b10 + a12 * b11 + a22 * b12,
      
      a00 * b20 + a10 * b21 + a20 * b22,
      a01 * b20 + a11 * b21 + a21 * b22,
      a02 * b20 + a12 * b21 + a22 * b22,
      
      a00 * b30 + a10 * b31 + a20 * b32 + a30,
      a01 * b30 + a11 * b31 + a21 * b32 + a31,
      a02 * b30 + a12 * b31 + a22 * b32 + a32
    ]);
  }

  /**
   * Convert the matrix to a string representation
   * @returns String representation of the matrix
   */
  toString(): string {
    return this.values.join(' ');
  }
}

/**
 * Error thrown when component resolution fails
 */
export class ComponentError extends ValidationError {
  constructor(message: string) {
    super(message);
    this.name = 'ComponentError';
  }
}

/**
 * Parse component references from object XML
 * @param componentsElement The components element from the object XML
 * @returns Array of Component objects
 * @throws ComponentError if parsing fails
 */
export function parseComponents(componentsElement: any): Component[] {
  if (!componentsElement.component) {
    return [];
  }
  
  // Handle single or multiple components
  const componentList = Array.isArray(componentsElement.component) 
    ? componentsElement.component 
    : [componentsElement.component];
  
  return componentList.map((component: any) => {
    if (!component['@_objectid']) {
      throw new ComponentError('Component missing required objectid attribute');
    }
    
    const objectId = parseInt(component['@_objectid'], 10);
    
    return { 
      objectId, 
      transform: component['@_transform']
    };
  });
}

/**
 * Check for circular references in component hierarchy
 * @param objectId ID of the object to check
 * @param objects Map of all objects
 * @param visitedIds Set of already visited object IDs in current path
 * @throws ComponentError if a circular reference is detected
 */
function checkCircularReferences(
  objectId: number,
  objects: Map<number, ObjectResource>,
  visitedIds: Set<number> = new Set()
): void {
  // If we've seen this object before in current path, it's a circular reference
  if (visitedIds.has(objectId)) {
    throw new ComponentError(`Circular reference detected involving object ID ${objectId}`);
  }
  
  // Get the object
  const obj = objects.get(objectId);
  if (!obj) {
    throw new ComponentError(`Referenced object ID ${objectId} not found`);
  }
  
  // If the object has components, check each one recursively
  if (obj.hasComponents && obj.components) {
    // Add current object to visited path
    visitedIds.add(objectId);
    
    // Check each component
    for (const component of obj.components) {
      checkCircularReferences(component.objectId, objects, new Set(visitedIds));
    }
    
    // Remove current object from visited path when done with this branch
    visitedIds.delete(objectId);
  }
}

/**
 * Validate all component references in the resource set
 * @param objects Map of all objects
 * @throws ComponentError if validation fails (circular references or missing references)
 */
export function validateComponentReferences(objects: Map<number, ObjectResource>): void {
  // Check that all referenced component objects exist
  for (const [id, object] of objects.entries()) {
    if (object.hasComponents && object.components) {
      for (const component of object.components) {
        if (!objects.has(component.objectId)) {
          throw new ComponentError(`Object ${id} references non-existent component objectid ${component.objectId}`);
        }
        
        // Make sure components don't reference objects of type "other"
        const referencedObject = objects.get(component.objectId);
        if (referencedObject && referencedObject.type === ObjectType.Other) {
          throw new ComponentError(`Object ${id} references a component of type "other" (objectid ${component.objectId}), which is not allowed`);
        }
      }
    }
  }
  
  // Check for circular references
  for (const [id, object] of objects.entries()) {
    if (object.hasComponents) {
      checkCircularReferences(id, objects);
    }
  }
}

/**
 * Flatten a component hierarchy into a single mesh
 * @param rootId ID of the root object to flatten
 * @param objects Map of all objects
 * @param transform Optional matrix transform to apply to the entire hierarchy
 * @returns Flattened mesh combining all components with transformations applied
 * @throws ComponentError if flattening fails
 */
export function flattenComponentHierarchy(
  rootId: number,
  objects: Map<number, ObjectResource>,
  transform?: Matrix3D
): Mesh {
  const rootObj = objects.get(rootId);
  if (!rootObj) {
    throw new ComponentError(`Root object ID ${rootId} not found`);
  }
  
  // Initialize result mesh
  const result: Mesh = {
    vertices: [],
    triangles: []
  };
  
  // Process the object recursively
  processObject(rootObj, transform || new Matrix3D(), result, objects);
  
  return result;
}

/**
 * Process an object and add its mesh data to the result
 * @param obj The object to process
 * @param transform Matrix transform to apply
 * @param result Mesh to add the processed data to
 * @param objects Map of all objects for resolving components
 */
function processObject(
  obj: ObjectResource,
  transform: Matrix3D,
  result: Mesh,
  objects: Map<number, ObjectResource>
): void {
  // If object has a mesh, transform and add its vertices and triangles
  if (obj.hasMesh && obj.mesh) {
    // Check if we need to flip winding order due to negative determinant
    const flipWinding = transform.determinant < 0;
    
    // Record the offset before adding new vertices
    const vertexOffset = result.vertices.length;
    
    // Transform and add vertices
    for (const vertex of obj.mesh.vertices) {
      result.vertices.push(transform.transformVertex(vertex));
    }
    
    // Add triangles with adjusted indices
    for (const triangle of obj.mesh.triangles) {
      // Create a new triangle with adjusted vertex indices
      const newTriangle: Triangle = {
        v1: triangle.v1 + vertexOffset,
        v2: triangle.v2 + vertexOffset,
        v3: triangle.v3 + vertexOffset
      };
      
      // If we need to flip winding order, swap v2 and v3
      if (flipWinding) {
        [newTriangle.v2, newTriangle.v3] = [newTriangle.v3, newTriangle.v2];
      }
      
      // Copy property indices if present
      if (triangle.p1 !== undefined) newTriangle.p1 = triangle.p1;
      if (triangle.p2 !== undefined) newTriangle.p2 = flipWinding ? triangle.p3 : triangle.p2;
      if (triangle.p3 !== undefined) newTriangle.p3 = flipWinding ? triangle.p2 : triangle.p3;
      if (triangle.pid !== undefined) newTriangle.pid = triangle.pid;
      
      result.triangles.push(newTriangle);
    }
  }
  // If object has components, process each one recursively
  else if (obj.hasComponents && obj.components) {
    for (const component of obj.components) {
      const componentObj = objects.get(component.objectId);
      if (!componentObj) {
        throw new ComponentError(`Component object ID ${component.objectId} not found`);
      }
      
      let componentTransform = transform;
      
      // If the component has a transform, parse it and multiply with current transform
      if (component.transform) {
        try {
          const compMatrix = Matrix3D.fromString(component.transform);
          componentTransform = transform.multiply(compMatrix);
        } catch (error) {
          throw new ComponentError(`Invalid transform in component: ${(error as Error).message}`);
        }
      }
      
      // Process the component recursively
      processObject(componentObj, componentTransform, result, objects);
    }
  }
}

/**
 * Update components with transforms from the XML and validate all references
 * @param objects Map of objects to validate component references
 * @throws ComponentError if validation fails
 */
export function validateAllComponentReferences(objects: Map<number, ObjectResource>): void {
  // Validate all component references
  validateComponentReferences(objects);
} 