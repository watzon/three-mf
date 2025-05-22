import { test, expect, describe, beforeAll, afterAll } from 'bun:test';
import { openArchive, getPrimaryModelPath } from '../src/opc';
import JSZip from 'jszip';
import { promises as fs } from 'fs';
import { join } from 'path';

// Create temp directory for test files
const TEST_DIR = join(process.cwd(), 'test-files');

// Helper to create test 3MF files
async function createTestFile(filename: string, contentTypesXml?: string, relsXml?: string): Promise<string> {
  const zip = new JSZip();
  
  // Add Content_Types.xml if provided
  if (contentTypesXml) {
    zip.file('[Content_Types].xml', contentTypesXml);
  }
  
  // Add _rels/.rels if provided
  if (relsXml) {
    zip.folder('_rels');
    zip.file('_rels/.rels', relsXml);
  }
  
  // Add a dummy 3D model part
  zip.file('3D/3dmodel.model', '<model></model>');
  
  // Generate the zip file
  const content = await zip.generateAsync({ type: 'nodebuffer' });
  const filePath = join(TEST_DIR, filename);
  await fs.writeFile(filePath, content);
  
  return filePath;
}

// Sample content for test files
const validContentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`;

const validRels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" 
    Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`;

const invalidRels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" 
    Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/thumbnail" />
</Relationships>`;

describe('OPC Module Tests', () => {
  // Files to be created for testing
  let validFilePath: string;
  let missingContentTypesFilePath: string;
  let missingStartPartFilePath: string;
  
  // Set up test files before running tests
  beforeAll(async () => {
    // Ensure test directory exists
    await fs.mkdir(TEST_DIR, { recursive: true });
    
    // Create test files
    validFilePath = await createTestFile('valid.3mf', validContentTypes, validRels);
    missingContentTypesFilePath = await createTestFile('missing-content-types.3mf', undefined, validRels);
    missingStartPartFilePath = await createTestFile('missing-start-part.3mf', validContentTypes, invalidRels);
  });
  
  // Clean up test files after tests
  afterAll(async () => {
    try {
      await fs.unlink(validFilePath);
      await fs.unlink(missingContentTypesFilePath);
      await fs.unlink(missingStartPartFilePath);
    } catch (error) {
      console.error('Error cleaning up test files:', error);
    }
  });
  
  test('openArchive should open a valid .3mf file', async () => {
    const zip = await openArchive(validFilePath);
    expect(zip).toBeDefined();
    expect(Object.keys(zip.files).length).toBeGreaterThan(0);
    expect(zip.files['3D/3dmodel.model']).toBeDefined();
  });
  
  test('getPrimaryModelPath should find the primary 3D model path', async () => {
    const zip = await openArchive(validFilePath);
    const path = await getPrimaryModelPath(zip);
    expect(path).toBe('/3D/3dmodel.model');
  });
  
  test('openArchive should work with file buffers', async () => {
    const buffer = await fs.readFile(validFilePath);
    const zip = await openArchive(buffer);
    expect(zip).toBeDefined();
    expect(Object.keys(zip.files).length).toBeGreaterThan(0);
  });
  
  test('should throw error if [Content_Types].xml is missing', async () => {
    const zip = await openArchive(missingContentTypesFilePath);
    await expect(getPrimaryModelPath(zip)).rejects.toThrow('Missing [Content_Types].xml');
  });
  
  test('should throw error if StartPart relationship is missing', async () => {
    const zip = await openArchive(missingStartPartFilePath);
    await expect(getPrimaryModelPath(zip)).rejects.toThrow('Missing StartPart relationship for 3D Model');
  });
}); 