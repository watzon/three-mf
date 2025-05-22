#!/usr/bin/env bun
import { openArchive, getPrimaryModelPath } from '../src/opc';
import { getModel } from '../src/model';
import { parseResourcesFromXml } from '../src/resources';
import { parseBuildFromXml } from '../src/build';
import { ThreeMFDocument } from '../src/document';

async function main() {
  const [, , filePath] = process.argv;
  if (!filePath) {
    console.error('Usage: bun run examples/basic-usage.ts <path-to-3mf>');
    process.exit(1);
  }

  // 1. Open the 3MF archive
  const zip = await openArchive(filePath);

  // 2. Find and read the primary model part
  const modelPath = await getPrimaryModelPath(zip);
  // JSZip stores paths without a leading slash
  const normalizedPath = modelPath.startsWith('/') ? modelPath.slice(1) : modelPath;
  const fileEntry = zip.file(normalizedPath) ?? zip.file(modelPath);
  const xmlText = fileEntry ? await fileEntry.async('text') : undefined;
  if (!xmlText) {
    console.error(`Model part not found: ${modelPath}`);
    process.exit(1);
  }

  // 3. Parse model, resources, and build items
  const model = await getModel(zip, modelPath);
  const resources = parseResourcesFromXml(xmlText);
  const buildItems = parseBuildFromXml(xmlText, resources);

  // 4. Combine into a document and print JSON
  const document = new ThreeMFDocument(model, resources, buildItems);
  console.log(JSON.stringify(document.toJSON(), null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
}); 