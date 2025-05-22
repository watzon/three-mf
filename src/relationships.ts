import { XMLParser } from 'fast-xml-parser';
import JSZip from 'jszip';

// Standard relationship types from the 3MF spec
export const RELATIONSHIP_TYPES = {
  START_PART: 'http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel',
  THUMBNAIL: 'http://schemas.openxmlformats.org/package/2006/relationships/metadata/thumbnail',
  PRINT_TICKET: 'http://schemas.microsoft.com/3dmanufacturing/2013/01/printticket',
  MUST_PRESERVE: 'http://schemas.openxmlformats.org/package/2006/relationships/mustpreserve'
} as const;

/**
 * Represents a relationship between parts in the package
 */
export interface Relationship {
  id: string;
  type: string;
  target: string;
  targetMode?: string; // Optional, e.g. "Internal" or "External"
}

/**
 * Maps relationship IDs to relationship objects
 */
export interface RelationshipMap {
  byId: Map<string, Relationship>;
  byType: Map<string, Relationship[]>;
  all: Relationship[];
}

/**
 * Parses _rels/.rels to extract package-level relationships
 * @param zip JSZip instance of the opened archive
 */
export async function getRelationships(zip: JSZip): Promise<RelationshipMap> {
  // Get the _rels/.rels file
  const relsFile = zip.file('_rels/.rels');
  if (!relsFile) {
    throw new Error('Missing root relationships file (_rels/.rels)');
  }
  
  // Parse the relationships XML
  const relsXml = await relsFile.async('text');
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    isArray: (name) => name === 'Relationship'
  });
  
  try {
    const parsed = parser.parse(relsXml);
    if (!parsed.Relationships) {
      throw new Error('Invalid _rels/.rels: Missing Relationships element');
    }
    
    const byId = new Map<string, Relationship>();
    const byType = new Map<string, Relationship[]>();
    const all: Relationship[] = [];
    
    // Process Relationship elements
    if (parsed.Relationships.Relationship) {
      for (const rel of parsed.Relationships.Relationship) {
        if (!rel['@_Id'] || !rel['@_Type'] || !rel['@_Target']) {
          throw new Error('Invalid _rels/.rels: Relationship element missing required attributes');
        }
        
        const relationship: Relationship = {
          id: rel['@_Id'],
          type: rel['@_Type'],
          target: rel['@_Target'],
          targetMode: rel['@_TargetMode']
        };
        
        // Store in the maps
        byId.set(relationship.id, relationship);
        
        // Store by type
        let typeRelationships = byType.get(relationship.type);
        if (!typeRelationships) {
          typeRelationships = [];
          byType.set(relationship.type, typeRelationships);
        }
        typeRelationships.push(relationship);
        
        all.push(relationship);
      }
    }
    
    return {
      byId,
      byType,
      all
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error parsing _rels/.rels: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Gets the start part path from the relationship map
 * @param relationshipMap Relationship map from getRelationships()
 */
export function getStartPartPath(relationshipMap: RelationshipMap): string {
  const startPartRels = relationshipMap.byType.get(RELATIONSHIP_TYPES.START_PART);
  if (!startPartRels || startPartRels.length === 0) {
    throw new Error('Missing StartPart relationship for 3D Model');
  }
  
  // We can safely use non-null assertion since we've verified the array has elements
  let target = startPartRels[0]!.target;
  
  // Normalize the path
  if (!target.startsWith('/')) {
    target = `/${target}`;
  }
  
  return target;
}

/**
 * Gets all relationships of a specific type
 * @param relationshipMap Relationship map from getRelationships()
 * @param type Relationship type to find
 */
export function getRelationshipsByType(relationshipMap: RelationshipMap, type: string): Relationship[] {
  return relationshipMap.byType.get(type) || [];
} 