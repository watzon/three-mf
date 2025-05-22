#!/usr/bin/env bun
import { openArchive, getPrimaryModelPath } from '../src/opc';
import { parseResourcesFromXml } from '../src/resources';
import { flattenComponentHierarchy } from '../src/components';
import { Matrix3D } from '../src/components';

async function main() {
  const [, , filePath, idArg] = process.argv;
  if (!filePath || !idArg) {
    console.error('Usage: bun run examples/component-flatten.ts <path-to-3mf> <object-id>');
    process.exit(1);
  }
  const objectId = parseInt(idArg, 10);
  if (isNaN(objectId)) {
    console.error('Invalid object ID:', idArg);
    process.exit(1);
  }

  // Open archive and read XML
  const zip = await openArchive(filePath);
  const modelPath = await getPrimaryModelPath(zip);
  const normPath = modelPath.startsWith('/') ? modelPath.slice(1) : modelPath;
  const entry = zip.file(normPath) ?? zip.file(modelPath);
  const xmlText = entry ? await entry.async('text') : undefined;
  if (!xmlText) {
    console.error(`Model part not found: ${modelPath}`);
    process.exit(1);
  }

  // Parse resources
  const resources = parseResourcesFromXml(xmlText);

  // Flatten hierarchy for specified object
  try {
    const mesh = flattenComponentHierarchy(objectId, resources.objects);
    console.log(`Flattened mesh for object ${objectId}:`);
    console.log(JSON.stringify(mesh, null, 2));
  } catch (err) {
    console.error('Error flattening components:', err);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
}); 