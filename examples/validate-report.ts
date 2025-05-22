#!/usr/bin/env bun
import { openArchive, getPrimaryModelPath } from '../src/opc';
import { getModel } from '../src/model';
import { parseResourcesFromXml } from '../src/resources';
import { parseBuildFromXml } from '../src/build';
import { validateAllComponentReferences } from '../src/components';

async function main() {
  const [, , filePath] = process.argv;
  if (!filePath) {
    console.error('Usage: bun run examples/validate-report.ts <path-to-3mf>');
    process.exit(1);
  }

  const issues: string[] = [];

  // Open and parse
  let zip; let model; let resources; let buildItems;
  try {
    zip = await openArchive(filePath);
  } catch (err) {
    issues.push(`Archive error: ${err}`);
  }
  if (zip) {
    let modelPath!: string;
    let xmlText!: string;
    try {
      modelPath = await getPrimaryModelPath(zip);
      const normalized = modelPath.startsWith('/') ? modelPath.slice(1) : modelPath;
      const entry = zip.file(normalized) ?? zip.file(modelPath);
      const txt = entry ? await entry.async('text') : undefined;
      if (!txt) throw new Error(`Model part not found: ${modelPath}`);
      xmlText = txt;
    } catch (err) {
      issues.push(`Model part error: ${err}`);
    }

    if (xmlText && zip) {
      try {
        model = await getModel(zip, modelPath);
      } catch (err) {
        issues.push(`Model parse error: ${err}`);
      }
      try {
        resources = parseResourcesFromXml(xmlText);
      } catch (err) {
        issues.push(`Resources parse error: ${err}`);
      }
      if (resources) {
        try {
          validateAllComponentReferences(resources.objects);
        } catch (err) {
          issues.push(`Component validation error: ${err}`);
        }
      }
      if (resources) {
        try {
          buildItems = parseBuildFromXml(xmlText, resources);
        } catch (err) {
          issues.push(`Build parse error: ${err}`);
        }
      }
    }
  }

  // Report
  if (issues.length === 0) {
    console.log('No issues found. 3MF file validates successfully.');
  } else {
    console.log('Validation report:');
    for (const issue of issues) console.log('- ' + issue);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
}); 