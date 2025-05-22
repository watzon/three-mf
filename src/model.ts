import JSZip from 'jszip';
import { XMLParser } from 'fast-xml-parser';
import { ValidationError } from './errors';

/**
 * Supported unit types in 3MF
 */
export enum Unit {
  Micron = 'micron',
  Millimeter = 'millimeter',
  Centimeter = 'centimeter',
  Inch = 'inch',
  Foot = 'foot',
  Meter = 'meter'
}

/**
 * Interface representing the model element and its attributes
 */
export interface Model {
  unit: Unit;
  language?: string;
  requiredExtensions?: string[];
  recommendedExtensions?: string[];
  resources?: any; // To be expanded in future tasks
  build?: any; // To be expanded in future tasks
  metadata?: any[]; // To be expanded in future tasks
}

/**
 * Error thrown when model parsing or validation fails
 */
export class ModelParseError extends ValidationError {
  constructor(message: string) {
    super(message);
    this.name = 'ModelParseError';
  }
}

/**
 * Parses the model XML content
 * @param modelXmlContent The XML content of the 3D model part
 * @returns Parsed Model object
 * @throws ModelParseError if parsing fails or validation errors occur
 */
export function parseModel(modelXmlContent: string): Model {
  // Parse XML with preserving attributes
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    isArray: (name: string) => name === 'metadata'
  });

  try {
    const xmlObj = parser.parse(modelXmlContent);
    
    // Look for model element - should be exactly one
    if (!xmlObj.model) {
      throw new ModelParseError('No <model> element found in 3D Model part');
    }
    
    // If there's a root element containing multiple models
    if (Array.isArray(xmlObj.model)) {
      throw new ModelParseError('Multiple <model> elements found in 3D Model part, only one is allowed');
    }
    
    const modelElement = xmlObj.model;
    
    // Check for nested model elements which is invalid
    if (modelElement.model) {
      throw new ModelParseError('Multiple <model> elements found in 3D Model part, only one is allowed');
    }
    
    // Extract attributes
    const unitValue = modelElement['@_unit'] || Unit.Millimeter; // Default is millimeter
    
    if (!Object.values(Unit).includes(unitValue as Unit)) {
      throw new ModelParseError(`Invalid unit value: ${unitValue}`);
    }

    // Create model object
    const model: Model = {
      unit: unitValue as Unit,
      language: modelElement['@_xml:lang'],
    };
    
    // Process extensions
    if (modelElement['@_requiredextensions']) {
      model.requiredExtensions = modelElement['@_requiredextensions'].split(/\s+/).filter(Boolean);
    }
    
    if (modelElement['@_recommendedextensions']) {
      model.recommendedExtensions = modelElement['@_recommendedextensions'].split(/\s+/).filter(Boolean);
    }
    
    return model;
  } catch (error) {
    if (error instanceof ModelParseError) {
      throw error;
    }
    throw new ModelParseError(`Failed to parse model XML: ${(error as Error).message}`);
  }
}

/**
 * Gets the model object from a 3MF archive
 * @param zip JSZip instance of the opened archive
 * @param modelPath Path to the 3D model part within the archive
 * @returns Promise resolving to the parsed Model object
 */
export async function getModel(zip: JSZip, modelPath: string): Promise<Model> {
  // Get model content, normalize leading slash if needed
  const normalizedPath = modelPath.startsWith('/') ? modelPath.slice(1) : modelPath;
  const modelFile = zip.file(normalizedPath) ?? zip.file(modelPath);
  if (!modelFile) {
    throw new ModelParseError(`Model file not found at path: ${modelPath}`);
  }
  
  const modelContent = await modelFile.async('text');
  return parseModel(modelContent);
} 