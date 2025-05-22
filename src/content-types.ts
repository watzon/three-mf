import { XMLParser } from 'fast-xml-parser';
import JSZip from 'jszip';

/**
 * Represents a content type mapping
 */
export interface ContentTypeInfo {
  extension?: string;   // For Default elements
  partName?: string;    // For Override elements
  contentType: string;
}

/**
 * Maps content types to extensions and part paths
 */
export interface ContentTypeMap {
  defaults: Map<string, string>; // extension -> contentType
  overrides: Map<string, string>; // partName -> contentType
  allItems: ContentTypeInfo[];
}

/**
 * Parses [Content_Types].xml to build a map of content types
 * @param zip JSZip instance of the opened archive
 */
export async function getContentTypeMap(zip: JSZip): Promise<ContentTypeMap> {
  // Get the [Content_Types].xml file
  const contentTypesFile = zip.file('[Content_Types].xml');
  if (!contentTypesFile) {
    throw new Error('Missing [Content_Types].xml');
  }
  
  // Parse the content types XML
  const contentTypesXml = await contentTypesFile.async('text');
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    isArray: (name) => name === 'Default' || name === 'Override'
  });
  
  try {
    const parsed = parser.parse(contentTypesXml);
    if (!parsed.Types) {
      throw new Error('Invalid [Content_Types].xml: Missing Types element');
    }
    
    const defaults = new Map<string, string>();
    const overrides = new Map<string, string>();
    const allItems: ContentTypeInfo[] = [];
    
    // Process Default elements (extension -> contentType)
    if (parsed.Types.Default) {
      for (const def of parsed.Types.Default) {
        if (!def['@_Extension'] || !def['@_ContentType']) {
          throw new Error('Invalid [Content_Types].xml: Default element missing required attributes');
        }
        
        const extension = def['@_Extension'];
        const contentType = def['@_ContentType'];
        
        // Store in the maps
        defaults.set(extension, contentType);
        allItems.push({
          extension,
          contentType
        });
      }
    }
    
    // Process Override elements (partName -> contentType)
    if (parsed.Types.Override) {
      for (const override of parsed.Types.Override) {
        if (!override['@_PartName'] || !override['@_ContentType']) {
          throw new Error('Invalid [Content_Types].xml: Override element missing required attributes');
        }
        
        const partName = override['@_PartName'];
        const contentType = override['@_ContentType'];
        
        // Store in the maps
        overrides.set(partName, contentType);
        allItems.push({
          partName,
          contentType
        });
      }
    }
    
    return {
      defaults,
      overrides,
      allItems
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error parsing [Content_Types].xml: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Gets the content type for a given part path
 * @param contentTypeMap Content type map from getContentTypeMap()
 * @param partPath Path of the part to look up
 */
export function getContentType(contentTypeMap: ContentTypeMap, partPath: string): string | null {
  // First check for a direct override match
  if (contentTypeMap.overrides.has(partPath)) {
    return contentTypeMap.overrides.get(partPath) ?? null;
  }
  
  // Check if there's a default for the extension
  const extension = partPath.split('.').pop();
  if (extension && contentTypeMap.defaults.has(extension)) {
    return contentTypeMap.defaults.get(extension) ?? null;
  }
  
  return null;
} 