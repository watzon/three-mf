#!/usr/bin/env bun
import { openArchive, getPrimaryModelPath } from '../src/opc';
import { parseResourcesFromXml } from '../src/resources';
import { XMLParser } from 'fast-xml-parser';
import { parseProductionExtensions } from '../src/production-extension/parser';
import { flattenComponentHierarchy } from '../src/components';

async function main() {
  const [, , filePath] = process.argv;
  if (!filePath) {
    console.error('Usage: bun run examples/mesh-inspector.ts <path-to-3mf>');
    process.exit(1);
  }

  // Open archive and extract XML
  const zip = await openArchive(filePath);
  const modelPath = await getPrimaryModelPath(zip);
  const normalizedPath = modelPath.startsWith('/') ? modelPath.slice(1) : modelPath;
  const fileEntry = zip.file(normalizedPath) ?? zip.file(modelPath);
  const xmlText = fileEntry ? await fileEntry.async('text') : undefined;
  if (!xmlText) {
    console.error(`Model part not found: ${modelPath}`);
    process.exit(1);
  }

  // Parse production extension attributes and resources
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
  const xmlObj: any = parser.parse(xmlText);
  parseProductionExtensions(xmlObj);
  const resources = parseResourcesFromXml(xmlText);

  // Debug: list parsed resources objects
  console.log('Parsed resources for root model, objects:');
  console.log(Array.from(resources.objects.values()).map(o => ({ id: o.id, hasMesh: o.hasMesh, hasComponents: o.hasComponents })));

  // Inspect meshes in root model
  console.log('*** Root Model Meshes ***');
  for (const obj of resources.objects.values()) {
    console.log(`\nObject ID: ${obj.id} (type: ${obj.type})`);
    let mesh = obj.mesh;
    if (!mesh && obj.hasComponents) {
      try {
        mesh = flattenComponentHierarchy(obj.id, resources.objects);
      } catch (err) {
        console.warn(`Error flattening components for object ${obj.id}: ${err}`);
      }
    }
    if (mesh) {
      const vCount = mesh.vertices.length;
      const tCount = mesh.triangles.length;
      // Compute bounding box
      let minX = Infinity, minY = Infinity, minZ = Infinity;
      let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
      for (const v of mesh.vertices) {
        minX = Math.min(minX, v.x);
        minY = Math.min(minY, v.y);
        minZ = Math.min(minZ, v.z);
        maxX = Math.max(maxX, v.x);
        maxY = Math.max(maxY, v.y);
        maxZ = Math.max(maxZ, v.z);
      }
      console.log(`Vertices: ${vCount}, Triangles: ${tCount}`);
      console.log(`Bounds: X[${minX},${maxX}], Y[${minY},${maxY}], Z[${minZ},${maxZ}]`);
      console.log(`Manifold: ${mesh.isManifold}, Consistent Orientation: ${mesh.hasConsistentOrientation}`);
    } else {
      console.log('No mesh for this object.');
    }
  }

  // Inspect meshes from referenced model parts (production extension)
  // Also inspect parts referenced in the model part .rels file (OPC relationships)
  const partDir = normalizedPath.substring(0, normalizedPath.lastIndexOf('/') + 1);
  const partBase = normalizedPath.substring(normalizedPath.lastIndexOf('/') + 1);
  const relsPath = `${partDir}_rels/${partBase}.rels`;
  console.log(`Looking for part .rels at: ${relsPath} or _rels/${partBase}.rels`);
  const relsEntry = zip.file(relsPath) ?? zip.file(`_rels/${partBase}.rels`);
  console.log(`.rels found: ${Boolean(relsEntry)}`);
  if (relsEntry) {
    console.log('\n*** OPC .rels Referenced Parts Meshes ***');
    const relsXml = await relsEntry.async('text');
    const relsObj: any = parser.parse(relsXml);
    const rels = relsObj.Relationships && relsObj.Relationships.Relationship
      ? (Array.isArray(relsObj.Relationships.Relationship)
         ? relsObj.Relationships.Relationship
         : [relsObj.Relationships.Relationship])
      : [];
    for (const rel of rels) {
      const target = rel['@_Target'];
      console.log(`Found relationship to part: ${target}`);
      const targetPath = target.startsWith('/') ? target.slice(1) : target;
      console.log(`Normalized target path: ${targetPath}`);
      const entry = zip.file(targetPath);
      if (!entry) {
        console.warn(`Part not found: ${target}`);
        continue;
      }
      const partText = await entry.async('text');
      // Parse that model part
      const partXml: any = parser.parse(partText);
      let childResources;
      try {
        childResources = parseResourcesFromXml(partText);
      } catch (err) {
        console.warn(`Skipping part ${targetPath}: ${err}`);
        continue;
      }
      for (const obj of childResources.objects.values()) {
        console.log(`Child resources object: id=${obj.id}, hasMesh=${obj.mesh != null}, hasComponents=${obj.hasComponents}`);
        console.log(`\nPart Object ID: ${obj.id} (type: ${obj.type}) from ${targetPath}`);
        let mesh = obj.mesh;
        if (!mesh && obj.hasComponents) {
          try { mesh = flattenComponentHierarchy(obj.id, childResources.objects); } catch {};
        }
        if (mesh) {
          console.log(`Vertices: ${mesh.vertices.length}, Triangles: ${mesh.triangles.length}`);
        } else {
          console.log('No mesh for this part object.');
        }
      }
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
}); 