#!/usr/bin/env bun
import { openArchive, getPrimaryModelPath } from '../src/opc';
import { parseResourcesFromXml } from '../src/resources';

async function main() {
  const [, , inputPath] = process.argv;
  if (!inputPath) {
    console.error('Usage: bun run examples/materials-extension-usage.ts <path-to-3mf>');
    process.exit(1);
  }

  // 1. Open the 3MF archive
  const zip = await openArchive(inputPath);
  const modelPath = await getPrimaryModelPath(zip);

  // Normalize path for JSZip
  const entryName = modelPath.startsWith('/') ? modelPath.slice(1) : modelPath;
  const fileEntry = zip.file(entryName) ?? zip.file(modelPath);
  if (!fileEntry) {
    console.error(`Model part not found: ${modelPath}`);
    process.exit(1);
  }

  // 2. Read model XML text
  const xmlText = await fileEntry.async('text');

  // 3. Parse resources (including extension elements)
  const resources = parseResourcesFromXml(xmlText);

  // 4. Log extension resources
  console.log('Textures:', Array.from(resources.textures.values()));
  console.log('Texture2DGroups:', Array.from(resources.texture2DGroups.values()));
  console.log('ColorGroups:', Array.from(resources.colorGroups.values()));
  console.log('CompositeMaterials:', Array.from(resources.compositeMaterials.values()));
  console.log('MultiProperties:', Array.from(resources.multiProperties.values()));
  console.log('DisplayProperties:', Array.from(resources.displayProperties.values()));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
}); 