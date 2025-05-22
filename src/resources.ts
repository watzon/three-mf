import { XMLParser } from 'fast-xml-parser';
import { MeshError, parseMesh, validateMesh } from './mesh';
import type { Mesh } from './mesh';
import { ValidationError } from './errors';
import { parseProductionExtensions } from './production-extension/parser';

/**
 * Supported object types in 3MF
 */
export enum ObjectType {
  Model = 'model',
  SolidSupport = 'solidsupport',
  Support = 'support',
  Surface = 'surface',
  Other = 'other'
}

/**
 * Base material definition
 */
export interface BaseMaterial {
  name: string;
  displayColor: string;
}

/**
 * Base materials group
 */
export interface BaseMaterialsGroup {
  id: number;
  materials: BaseMaterial[];
}

/**
 * Component reference with transformation
 */
export interface Component {
  objectId: number;
  transform?: string;
  path?: string;
  uuid?: string;
}

/**
 * Object resource interface
 */
export interface ObjectResource {
  id: number;
  type: ObjectType;
  name?: string;
  partnumber?: string;
  thumbnail?: string;
  pid?: number;
  pindex?: number;
  hasMesh: boolean;
  hasComponents: boolean;
  mesh?: Mesh;
  components?: Component[];
  uuid?: string;
}

/**
 * Resources container
 */
export interface Resources {
  baseMaterials: Map<number, BaseMaterialsGroup>;
  objects: Map<number, ObjectResource>;
}

/**
 * Error thrown when resources parsing fails
 */
export class ResourcesParseError extends ValidationError {
  constructor(message: string) {
    super(message);
    this.name = 'ResourcesParseError';
  }
}

/**
 * Parse base materials from the model XML
 * @param resourcesElement The resources element from the model XML
 * @returns Map of base materials groups by ID
 * @throws ResourcesParseError if parsing fails or validation errors occur
 */
function parseBaseMaterials(resourcesElement: any): Map<number, BaseMaterialsGroup> {
  const baseMaterialsMap = new Map<number, BaseMaterialsGroup>();
  
  // If no basematerials, return empty map
  if (!resourcesElement.basematerials) {
    return baseMaterialsMap;
  }
  
  // Handle single or multiple basematerials
  const baseMaterialsList = Array.isArray(resourcesElement.basematerials) 
    ? resourcesElement.basematerials 
    : [resourcesElement.basematerials];
  
  for (const baseMaterials of baseMaterialsList) {
    // Extract id attribute
    if (!baseMaterials['@_id']) {
      throw new ResourcesParseError('Base materials group missing required id attribute');
    }
    
    const id = parseInt(baseMaterials['@_id'], 10);
    
    // Ensure ID is unique
    if (baseMaterialsMap.has(id)) {
      throw new ResourcesParseError(`Duplicate base materials group ID: ${id}`);
    }
    
    // Parse base materials
    const materials: BaseMaterial[] = [];
    
    // Handle base materials
    if (baseMaterials.base) {
      const baseList = Array.isArray(baseMaterials.base) 
        ? baseMaterials.base 
        : [baseMaterials.base];
      
      for (const base of baseList) {
        if (!base['@_name']) {
          throw new ResourcesParseError('Base material missing required name attribute');
        }
        
        if (!base['@_displaycolor']) {
          throw new ResourcesParseError('Base material missing required displaycolor attribute');
        }
        
        materials.push({
          name: base['@_name'],
          displayColor: base['@_displaycolor']
        });
      }
    }
    
    baseMaterialsMap.set(id, {
      id,
      materials
    });
  }
  
  return baseMaterialsMap;
}

/**
 * Parse objects from the model XML
 * @param resourcesElement The resources element from the model XML
 * @returns Map of objects by ID
 * @throws ResourcesParseError if parsing fails or validation errors occur
 */
function parseObjects(resourcesElement: any): Map<number, ObjectResource> {
  const objectsMap = new Map<number, ObjectResource>();
  
  // If no objects, return empty map
  if (!resourcesElement.object) {
    return objectsMap;
  }
  
  // Handle single or multiple objects
  const objectsList = Array.isArray(resourcesElement.object) 
    ? resourcesElement.object 
    : [resourcesElement.object];
  
  for (const object of objectsList) {
    // Extract id attribute
    if (!object['@_id']) {
      throw new ResourcesParseError('Object missing required id attribute');
    }
    
    const id = parseInt(object['@_id'], 10);
    
    // Ensure ID is unique
    if (objectsMap.has(id)) {
      throw new ResourcesParseError(`Duplicate object ID: ${id}`);
    }
    
    // Parse object type
    const typeValue = object['@_type'] || ObjectType.Model;
    if (!Object.values(ObjectType).includes(typeValue as ObjectType)) {
      throw new ResourcesParseError(`Invalid object type: ${typeValue}`);
    }
    
    // Create object resource
    const objectResource: ObjectResource = {
      id,
      type: typeValue as ObjectType,
      name: object['@_name'],
      partnumber: object['@_partnumber'],
      thumbnail: object['@_thumbnail'],
      hasMesh: !!object.mesh,
      hasComponents: !!object.components
    };
    
    // Parse pid and pindex if present
    if (object['@_pid'] !== undefined) {
      objectResource.pid = parseInt(object['@_pid'], 10);
    }
    
    if (object['@_pindex'] !== undefined) {
      objectResource.pindex = parseInt(object['@_pindex'], 10);
    }
    
    // Validate that an object has either mesh or components, but not both
    if (objectResource.hasMesh && objectResource.hasComponents) {
      throw new ResourcesParseError(`Object ${id} has both mesh and components, which is not allowed`);
    }
    
    // Validate that an object has either mesh or components
    if (!objectResource.hasMesh && !objectResource.hasComponents) {
      throw new ResourcesParseError(`Object ${id} has neither mesh nor components`);
    }
    
    // Parse mesh if present
    if (objectResource.hasMesh) {
      try {
        const mesh = parseMesh(object.mesh);
        
        // Validate mesh based on object type
        objectResource.mesh = validateMesh(mesh, objectResource.type);
      } catch (error) {
        if (error instanceof MeshError) {
          throw new ResourcesParseError(`Error parsing mesh for object ${id}: ${error.message}`);
        }
        throw error;
      }
    }
    
    // Parse components if present
    if (objectResource.hasComponents) {
      objectResource.components = [];
      
      if (object.components.component) {
        const componentList = Array.isArray(object.components.component)
          ? object.components.component
          : [object.components.component];
        
        for (const component of componentList) {
          if (component['@_objectid'] === undefined) {
            throw new ResourcesParseError(`Component in object ${id} missing required objectid attribute`);
          }
          
          const objectId = parseInt(component['@_objectid'], 10);
          // Map production extension attributes
          objectResource.components.push({
            objectId,
            transform: component['@_transform'],
            path: (component as any).path,
            uuid: (component as any).componentUUID
          });
        }
      }
    }
    
    // Assign production extension UUID if present
    if ((object as any).resourceUUID) {
      objectResource.uuid = (object as any).resourceUUID;
    }
    
    objectsMap.set(id, objectResource);
  }
  
  return objectsMap;
}

/**
 * Parse resources from the model XML
 * @param modelXml The model XML object
 * @returns Resources object with base materials and objects
 * @throws ResourcesParseError if parsing fails or validation errors occur
 */
export function parseResources(modelXml: any): Resources {
  // If there's no <model> element, that's a fatal error
  if (!modelXml.model) {
    throw new ResourcesParseError('Model missing required model element');
  }
  const resourcesElement = modelXml.model.resources;
  // If there's no <resources> element, return empty Resources
  if (!resourcesElement) {
    return {
      baseMaterials: new Map<number, BaseMaterialsGroup>(),
      objects: new Map<number, ObjectResource>()
    };
  }
  try {
    const baseMaterials = parseBaseMaterials(resourcesElement);
    const objects = parseObjects(resourcesElement);
    return { baseMaterials, objects };
  } catch (error) {
    if (error instanceof ResourcesParseError) {
      throw error;
    }
    throw new ResourcesParseError(`Failed to parse resources: ${(error as Error).message}`);
  }
}

/**
 * Parse resources from model XML content
 * @param modelXmlContent The XML content of the 3D model part
 * @returns Resources object with base materials and objects
 * @throws ResourcesParseError if parsing fails or validation errors occur
 */
export function parseResourcesFromXml(modelXmlContent: string): Resources {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    isArray: (name: string) => ['metadata', 'base'].includes(name)
  });
  
  try {
    const xmlObj = parser.parse(modelXmlContent);
    parseProductionExtensions(xmlObj);
    return parseResources(xmlObj);
  } catch (error) {
    if (error instanceof ResourcesParseError) {
      throw error;
    }
    throw new ResourcesParseError(`Failed to parse model XML for resources: ${(error as Error).message}`);
  }
} 