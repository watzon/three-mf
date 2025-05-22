import { XMLParser } from 'fast-xml-parser';
import type { Resources, ObjectResource } from './resources';
import { Matrix3D } from './components';
import { ValidationError } from './errors';

/**
 * Represents a build item linking an object resource with a transform and optional part number
 */
export interface BuildItem {
  objectId: number;
  object: ObjectResource;
  transform: Matrix3D;
  partnumber?: string;
}

/**
 * Error thrown when build parsing fails
 */
export class BuildParseError extends ValidationError {
  constructor(message: string) {
    super(message);
    this.name = 'BuildParseError';
  }
}

/**
 * Parse build instructions from parsed XML object and resources
 * @param modelXml Parsed XML object from fast-xml-parser
 * @param resources Resources object returned by parseResources()
 * @returns Array of BuildItem preserving order
 * @throws BuildParseError when parsing fails or validation errors occur
 */
export function parseBuild(modelXml: any, resources: Resources): BuildItem[] {
  try {
    if (!modelXml.model || !modelXml.model.build) {
      return [];
    }
    const buildElement = modelXml.model.build;
    if (!buildElement.item) {
      return [];
    }
    const items = Array.isArray(buildElement.item) ? buildElement.item : [buildElement.item];
    const buildItems: BuildItem[] = [];
    for (const item of items) {
      if (item['@_objectid'] === undefined) {
        throw new BuildParseError('Build item missing required objectid attribute');
      }
      const objectId = parseInt(item['@_objectid'], 10);
      if (isNaN(objectId)) {
        throw new BuildParseError(`Invalid objectid value: ${item['@_objectid']}`);
      }
      const objectResource = resources.objects.get(objectId);
      if (!objectResource) {
        throw new BuildParseError(`Build item references missing object resource with id ${objectId}`);
      }
      let transform: Matrix3D;
      try {
        transform = Matrix3D.fromString(item['@_transform']);
      } catch (err) {
        throw new BuildParseError(
          `Invalid transform for build item with objectid ${objectId}: ${(err as Error).message}`
        );
      }
      const partnumber = item['@_partnumber'];
      buildItems.push({ objectId, object: objectResource, transform, partnumber });
    }
    return buildItems;
  } catch (error) {
    if (error instanceof BuildParseError) {
      throw error;
    }
    throw new BuildParseError(`Failed to parse build instructions: ${(error as Error).message}`);
  }
}

/**
 * Parse build instructions from XML content and resources
 * @param modelXmlContent XML content string of the 3D model part
 * @param resources Resources object returned by parseResourcesFromXml()
 * @returns Array of BuildItem preserving order
 * @throws BuildParseError when parsing fails or validation errors occur
 */
export function parseBuildFromXml(
  modelXmlContent: string,
  resources: Resources
): BuildItem[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    isArray: (name: string) => name === 'item'
  });
  try {
    const xmlObj = parser.parse(modelXmlContent);
    return parseBuild(xmlObj, resources);
  } catch (error) {
    if (error instanceof BuildParseError) {
      throw error;
    }
    throw new BuildParseError(`Failed to parse build XML: ${(error as Error).message}`);
  }
} 