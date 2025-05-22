#!/usr/bin/env bun
import { openArchive, getPrimaryModelPath } from '../src/opc';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import { parseProductionExtensions } from '../src/production-extension/parser';
import { serializeProductionExtensions, generatePartRels } from '../src/production-extension/serializer';
import { generateUUID } from '../src/production-extension/uuid';

async function main() {
  const [, , filePath] = process.argv;
  if (!filePath) {
    console.error('Usage: bun run examples/production-usage.ts <path-to-3mf>');
    process.exit(1);
  }

  // 1. Open the 3MF archive
  const zip = await openArchive(filePath);
  const modelPath = await getPrimaryModelPath(zip);
  // JSZip stores paths without leading slash
  const normalizedPath = modelPath.startsWith('/') ? modelPath.slice(1) : modelPath;
  const fileEntry = zip.file(normalizedPath) ?? zip.file(modelPath);
  const rawXml = fileEntry ? await fileEntry.async('text') : undefined;
  if (!rawXml) {
    console.error(`Model part not found: ${modelPath}`);
    process.exit(1);
  }

  // 2. Parse XML into object
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
  const xmlObj: any = parser.parse(rawXml);

  // 3. Extract production extension attributes
  parseProductionExtensions(xmlObj);

  // 4. Serialize back with extension attributes
  serializeProductionExtensions(xmlObj);
  const builder = new XMLBuilder({ ignoreAttributes: false, attributeNamePrefix: '@_' });
  const updatedXml = builder.build(xmlObj);

  console.log('Serialized XML with Production Extension:');
  console.log(updatedXml);

  // 5. Generate part relationships
  const rels = generatePartRels(xmlObj);
  console.log('\nGenerated .rels entries:');
  console.log(JSON.stringify(rels, null, 2));

  // 6. Generate a new production UUID
  console.log('\nGenerated new ST_UUID:', generateUUID());
}

main().catch(err => {
  console.error(err);
  process.exit(1);
}); 