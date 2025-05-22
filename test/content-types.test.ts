import { test, expect, describe, beforeAll, afterAll } from 'bun:test';
import { getContentTypeMap, getContentType } from '../src/content-types';
import JSZip from 'jszip';
import { promises as fs } from 'fs';
import { join } from 'path';

// Create temp directory for test files
const TEST_DIR = join(process.cwd(), 'test-files');

// Helper to create test files with specific content
async function createTestFile(filename: string, contentTypesXml?: string): Promise<string> {
  const zip = new JSZip();
  
  // Add Content_Types.xml if provided
  if (contentTypesXml) {
    zip.file('[Content_Types].xml', contentTypesXml);
  }
  
  // Add some dummy parts
  zip.file('part1.xml', '<dummy></dummy>');
  zip.file('part2.model', '<model></model>');
  zip.file('3D/3dmodel.model', '<model></model>');
  
  // Generate the zip file
  const content = await zip.generateAsync({ type: 'nodebuffer' });
  const filePath = join(TEST_DIR, filename);
  await fs.writeFile(filePath, content);
  
  return filePath;
}

// Valid Content_Types.xml sample
const validContentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
  <Default Extension="xml" ContentType="application/xml" />
  <Override PartName="/3D/3dmodel.model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`;

// Malformed Content_Types.xml sample - missing Default attributes
const malformedContentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" />
  <Default ContentType="application/xml" />
</Types>`;

// Empty Content_Types.xml sample
const emptyContentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
</Types>`;

describe('Content Types Module Tests', () => {
  // Files to be created for testing
  let validFilePath: string;
  let malformedFilePath: string;
  let emptyTypesFilePath: string;
  let missingTypesFilePath: string;
  
  // Set up test files before running tests
  beforeAll(async () => {
    // Ensure test directory exists
    await fs.mkdir(TEST_DIR, { recursive: true });
    
    // Create test files
    validFilePath = await createTestFile('valid-content-types.3mf', validContentTypes);
    malformedFilePath = await createTestFile('malformed-content-types.3mf', malformedContentTypes);
    emptyTypesFilePath = await createTestFile('empty-content-types.3mf', emptyContentTypes);
    missingTypesFilePath = await createTestFile('missing-content-types.3mf');
  });
  
  // Clean up test files after tests
  afterAll(async () => {
    try {
      await fs.unlink(validFilePath);
      await fs.unlink(malformedFilePath);
      await fs.unlink(emptyTypesFilePath);
      await fs.unlink(missingTypesFilePath);
    } catch (error) {
      console.error('Error cleaning up test files:', error);
    }
  });
  
  test('getContentTypeMap should parse valid content types correctly', async () => {
    const zip = new JSZip();
    await zip.loadAsync(await fs.readFile(validFilePath));
    
    const contentTypeMap = await getContentTypeMap(zip);
    
    // Check default types
    expect(contentTypeMap.defaults.size).toBe(3);
    expect(contentTypeMap.defaults.get('rels')).toBe('application/vnd.openxmlformats-package.relationships+xml');
    expect(contentTypeMap.defaults.get('model')).toBe('application/vnd.ms-package.3dmanufacturing-3dmodel+xml');
    expect(contentTypeMap.defaults.get('xml')).toBe('application/xml');
    
    // Check override types
    expect(contentTypeMap.overrides.size).toBe(1);
    expect(contentTypeMap.overrides.get('/3D/3dmodel.model')).toBe('application/vnd.ms-package.3dmanufacturing-3dmodel+xml');
    
    // Check all items
    expect(contentTypeMap.allItems.length).toBe(4);
  });
  
  test('getContentType should return the correct content type for a part', async () => {
    const zip = new JSZip();
    await zip.loadAsync(await fs.readFile(validFilePath));
    
    const contentTypeMap = await getContentTypeMap(zip);
    
    // Check a part with an extension default
    expect(getContentType(contentTypeMap, 'part2.model')).toBe('application/vnd.ms-package.3dmanufacturing-3dmodel+xml');
    
    // Check a part with an override
    expect(getContentType(contentTypeMap, '/3D/3dmodel.model')).toBe('application/vnd.ms-package.3dmanufacturing-3dmodel+xml');
    
    // Check a part with unknown extension
    expect(getContentType(contentTypeMap, 'unknown.xyz')).toBeNull();
  });
  
  test('getContentTypeMap should handle empty Types element', async () => {
    const zip = new JSZip();
    await zip.loadAsync(await fs.readFile(emptyTypesFilePath));
    
    const contentTypeMap = await getContentTypeMap(zip);
    
    expect(contentTypeMap.defaults.size).toBe(0);
    expect(contentTypeMap.overrides.size).toBe(0);
    expect(contentTypeMap.allItems.length).toBe(0);
  });
  
  test('getContentTypeMap should throw for missing Types file', async () => {
    const zip = new JSZip();
    await zip.loadAsync(await fs.readFile(missingTypesFilePath));
    
    await expect(getContentTypeMap(zip)).rejects.toThrow('Missing [Content_Types].xml');
  });
  
  test('getContentTypeMap should throw for malformed Types file', async () => {
    const zip = new JSZip();
    await zip.loadAsync(await fs.readFile(malformedFilePath));
    
    await expect(getContentTypeMap(zip)).rejects.toThrow('Invalid [Content_Types].xml');
  });
}); 