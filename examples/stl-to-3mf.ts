#!/usr/bin/env bun
import { readFile, writeFile } from 'fs/promises';
import * as stl from 'stl';
import { create3MFArchive } from '../src/packager';
import type { Mesh } from '../src/mesh';
import { objectWithMesh, buildItemXml } from '../src/builder';
import type { ThreeMFXml } from '../src/builder';

async function main() {
  const [, , inputPath, outputPath] = process.argv;
  if (!inputPath || !outputPath) {
    console.error('Usage: bun run examples/stl-to-3mf.ts <input.stl> <output.3mf>');
    process.exit(1);
  }

  // Read STL file
  const data = await readFile(inputPath);

  // Parse STL to object with facets
  const stlObj = stl.toObject(data);

  // Convert STL facets into a Mesh object
  const mesh: Mesh = {
    vertices: stlObj.facets.flatMap((facet: any) =>
      facet.verts.map((v: number[]) => ({ x: v[0], y: v[1], z: v[2] }))
    ),
    triangles: stlObj.facets.map((_: any, i: number) => ({ v1: 3 * i, v2: 3 * i + 1, v3: 3 * i + 2 }))
  };

  // Construct the XML object for the 3MF model using builder utilities
  const xmlObj: ThreeMFXml = {
    model: {
      '@_unit': 'millimeter',
      '@_xmlns': 'http://schemas.microsoft.com/3dmanufacturing/core/2015/02',
      resources: {
        object: objectWithMesh(1, mesh)
      },
      build: {
        item: buildItemXml(1)
      }
    }
  };

  // Pack XML into a 3MF using our packager utility
  const zip = create3MFArchive(xmlObj);
  const content = await zip.generateAsync({ type: 'nodebuffer' });
  await writeFile(outputPath, content);
  console.log(`Wrote 3MF file: ${outputPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
}); 