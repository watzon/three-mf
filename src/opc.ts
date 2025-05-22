import { promises as fs } from 'fs';
import JSZip from 'jszip';
import { getContentTypeMap } from './content-types';
import { getRelationships, getStartPartPath } from './relationships';

/**
 * Opens a .3mf archive and returns a JSZip instance.
 * @param pathOrBuffer File path or buffer of the .3mf archive.
 */
export async function openArchive(pathOrBuffer: string | Buffer | Uint8Array): Promise<JSZip> {
  let data: Uint8Array;
  if (typeof pathOrBuffer === 'string') {
    const buffer = await fs.readFile(pathOrBuffer);
    data = buffer;
  } else if (pathOrBuffer instanceof Uint8Array) {
    data = pathOrBuffer;
  } else {
    data = new Uint8Array(pathOrBuffer);
  }
  return await JSZip.loadAsync(data);
}

/**
 * Finds the primary 3D Model part path in the archive.
 * @param zip JSZip instance of the opened archive
 */
export async function getPrimaryModelPath(zip: JSZip): Promise<string> {
  // Get the content types to verify existence of [Content_Types].xml
  await getContentTypeMap(zip);
  
  // Get relationships and find StartPart
  const relationships = await getRelationships(zip);
  return getStartPartPath(relationships);
} 