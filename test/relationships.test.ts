import { test, expect, describe, beforeAll, afterAll } from 'bun:test';
import { getRelationships, getStartPartPath, getRelationshipsByType, RELATIONSHIP_TYPES } from '../src/relationships';
import JSZip from 'jszip';
import { promises as fs } from 'fs';
import { join } from 'path';

// Create temp directory for test files
const TEST_DIR = join(process.cwd(), 'test-files');

// Helper to create test files with specific content
async function createTestFile(filename: string, relsXml?: string): Promise<string> {
  const zip = new JSZip();
  
  // Add _rels/.rels if provided
  if (relsXml) {
    zip.folder('_rels');
    zip.file('_rels/.rels', relsXml);
  }
  
  // Add some dummy parts
  zip.file('3D/3dmodel.model', '<model></model>');
  zip.file('Metadata/thumbnail.png', 'dummy-image-data');
  
  // Generate the zip file
  const content = await zip.generateAsync({ type: 'nodebuffer' });
  const filePath = join(TEST_DIR, filename);
  await fs.writeFile(filePath, content);
  
  return filePath;
}

// Valid relationships sample
const validRels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" Target="/3D/3dmodel.model" />
  <Relationship Id="rel1" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/thumbnail" Target="/Metadata/thumbnail.png" />
  <Relationship Id="rel2" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" Target="alternate.model" />
</Relationships>`;

// Malformed relationships sample - missing attributes
const malformedRels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
  <Relationship Target="/Metadata/thumbnail.png" />
</Relationships>`;

// Empty relationships sample
const emptyRels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`;

// Missing StartPart relationship
const missingStartPartRels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rel0" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/thumbnail" Target="/Metadata/thumbnail.png" />
</Relationships>`;

describe('Relationships Module Tests', () => {
  // Files to be created for testing
  let validFilePath: string;
  let malformedFilePath: string;
  let emptyRelsFilePath: string;
  let missingStartPartFilePath: string;
  let missingRelsFilePath: string;
  
  // Set up test files before running tests
  beforeAll(async () => {
    // Ensure test directory exists
    await fs.mkdir(TEST_DIR, { recursive: true });
    
    // Create test files
    validFilePath = await createTestFile('valid-rels.3mf', validRels);
    malformedFilePath = await createTestFile('malformed-rels.3mf', malformedRels);
    emptyRelsFilePath = await createTestFile('empty-rels.3mf', emptyRels);
    missingStartPartFilePath = await createTestFile('missing-start-part.3mf', missingStartPartRels);
    missingRelsFilePath = await createTestFile('missing-rels.3mf');
  });
  
  // Clean up test files after tests
  afterAll(async () => {
    try {
      await fs.unlink(validFilePath);
      await fs.unlink(malformedFilePath);
      await fs.unlink(emptyRelsFilePath);
      await fs.unlink(missingStartPartFilePath);
      await fs.unlink(missingRelsFilePath);
    } catch (error) {
      console.error('Error cleaning up test files:', error);
    }
  });
  
  test('getRelationships should parse valid relationships correctly', async () => {
    const zip = new JSZip();
    await zip.loadAsync(await fs.readFile(validFilePath));
    
    const relationships = await getRelationships(zip);
    
    // Check the maps are correctly populated
    expect(relationships.byId.size).toBe(3);
    expect(relationships.byType.size).toBe(2);
    expect(relationships.all.length).toBe(3);
    
    // Check specific relationships
    const rel0 = relationships.byId.get('rel0');
    expect(rel0).toBeDefined();
    expect(rel0?.type).toBe(RELATIONSHIP_TYPES.START_PART);
    expect(rel0?.target).toBe('/3D/3dmodel.model');
    
    // Check relationships by type
    const startPartRels = relationships.byType.get(RELATIONSHIP_TYPES.START_PART) || [];
    expect(startPartRels.length).toBe(2);
    
    const thumbnailRels = relationships.byType.get(RELATIONSHIP_TYPES.THUMBNAIL) || [];
    expect(thumbnailRels.length).toBe(1);
    expect(thumbnailRels.length).toBeGreaterThan(0);
    expect(thumbnailRels[0]!.target).toBe('/Metadata/thumbnail.png');
  });
  
  test('getStartPartPath should return the correct start part path', async () => {
    const zip = new JSZip();
    await zip.loadAsync(await fs.readFile(validFilePath));
    
    const relationships = await getRelationships(zip);
    const startPartPath = getStartPartPath(relationships);
    
    // The first one is used when multiple are present
    expect(startPartPath).toBe('/3D/3dmodel.model');
  });
  
  test('getRelationshipsByType should return relationships of a specific type', async () => {
    const zip = new JSZip();
    await zip.loadAsync(await fs.readFile(validFilePath));
    
    const relationships = await getRelationships(zip);
    
    // Check for existing type
    const startPartRels = getRelationshipsByType(relationships, RELATIONSHIP_TYPES.START_PART);
    expect(startPartRels.length).toBe(2);
    
    // Check for non-existing type
    const printTicketRels = getRelationshipsByType(relationships, RELATIONSHIP_TYPES.PRINT_TICKET);
    expect(printTicketRels.length).toBe(0);
  });
  
  test('getRelationships should handle empty Relationships element', async () => {
    const zip = new JSZip();
    await zip.loadAsync(await fs.readFile(emptyRelsFilePath));
    
    const relationships = await getRelationships(zip);
    
    expect(relationships.byId.size).toBe(0);
    expect(relationships.byType.size).toBe(0);
    expect(relationships.all.length).toBe(0);
  });
  
  test('getRelationships should throw for missing _rels/.rels file', async () => {
    const zip = new JSZip();
    await zip.loadAsync(await fs.readFile(missingRelsFilePath));
    
    await expect(getRelationships(zip)).rejects.toThrow('Missing root relationships file');
  });
  
  test('getRelationships should throw for malformed rels file', async () => {
    const zip = new JSZip();
    await zip.loadAsync(await fs.readFile(malformedFilePath));
    
    await expect(getRelationships(zip)).rejects.toThrow('Invalid _rels/.rels');
  });
  
  test('getStartPartPath should throw if no StartPart relationship exists', async () => {
    const zip = new JSZip();
    await zip.loadAsync(await fs.readFile(missingStartPartFilePath));
    
    const relationships = await getRelationships(zip);
    expect(() => getStartPartPath(relationships)).toThrow('Missing StartPart relationship');
  });
}); 