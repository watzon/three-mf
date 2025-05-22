# three-mf

A comprehensive TypeScript library for parsing and working with 3D Manufacturing Format (3MF) files.

Key features:
- Open and inspect OPC/ZIP-based `.3mf` archives
- Parse `[Content_Types].xml` and `_rels/.rels` relationships
- Extract and validate the `<model>` element
- Read `<resources>`: base materials and object definitions
- Handle `<mesh>`: vertices, triangles, manifold and orientation checks
- Compose objects via `<components>` and build instructions
- Parse `<build>` items and link them to resources
- In-memory API with `ThreeMFDocument` for JSON serialization/round-trip
- Rich error reporting (`ValidationError`, `ParseError`) and spec warnings (`WarningLogger`)
- CI-ready with `bun test` and GitHub Actions

## Installation

```bash
bun install
```

## Usage

```ts
import { openArchive, getPrimaryModelPath, getModel } from './src/opc';
import { parseResourcesFromXml } from './src/resources';
import { parseBuildFromXml } from './src/build';
import { ThreeMFDocument } from './src/document';

async function example(filePath: string) {
  // 1. Open 3MF archive
  const zip = await openArchive(filePath);
  const modelPath = await getPrimaryModelPath(zip);

  // 2. Parse the <model> element
  const model = await getModel(zip, modelPath);
  const xmlText = await zip.file(modelPath)!.async('text');

  // 3. Extract resources and build items
  const resources = parseResourcesFromXml(xmlText);
  const buildItems = parseBuildFromXml(xmlText, resources);

  // 4. Work with in-memory document
  const document = new ThreeMFDocument(model, resources, buildItems);
  console.log(JSON.stringify(document.toJSON(), null, 2));
}
```

## API Reference

### OPC Utilities (src/opc.ts)
- **openArchive**(pathOrBuffer: string | Buffer | Uint8Array): Promise<JSZip>
- **getPrimaryModelPath**(zip: JSZip): Promise<string>

### Content Types (src/content-types.ts)
- **getContentTypeMap**(zip: JSZip): Promise<ContentTypeMap>
- **getContentType**(map: ContentTypeMap, partPath: string): string | null

### Relationships (src/relationships.ts)
- **getRelationships**(zip: JSZip): Promise<RelationshipMap>
- **getStartPartPath**(relationships: RelationshipMap): string
- **getRelationshipsByType**(relationships: RelationshipMap, type: string): Relationship[]

### Model Parsing (src/model.ts)
- **parseModel**(content: string): Model
- **getModel**(zip: JSZip, modelPath: string): Promise<Model>

### Resources (src/resources.ts)
- **parseResourcesFromXml**(content: string): Resources
- **parseResources**(modelXml: any): Resources

### Build Parsing (src/build.ts)
- **parseBuildFromXml**(content: string, resources: Resources): BuildItem[]

### Document (src/document.ts)
- **ThreeMFDocument**(model: Model, resources: Resources, build: BuildItem[])
- **toJSON**(): DocumentJSON
- **fromJSON**(json: DocumentJSON): ThreeMFDocument

### Mesh (src/mesh.ts)
- **parseMesh**(element: any): Mesh
- **validateMesh**(mesh: Mesh, type: string): Mesh

### Components (src/components.ts)
- **flattenComponentHierarchy**(id: number, objects: Map<number, ObjectResource>): Mesh
- **validateAllComponentReferences**(objects: Map<number, ObjectResource>): void

### Builders (src/builder.ts)
- **meshToXml**(mesh: Mesh)
- **objectWithMesh**(id: number, mesh: Mesh, attrs?): ObjectElement
- **buildItemXml**(objectId: number, attrs?): BuildItemElement

### Packager (src/packager.ts)
- **create3MFArchive**(xmlObj: ThreeMFXml, modelFilePath?: string): JSZip

### Production Extension (src/production-extension)
- **parseProductionExtensions**(xmlObj: any): void
- **serializeProductionExtensions**(xmlObj: any): void
- **generatePartRels**(xmlObj: any): any[]
- **generateUUID**(): string

## Builders and Packaging Utilities

This library provides high-level helpers to build 3MF XML structures and package them without manual XML or ZIP boilerplate.

```ts
import type { ThreeMFXml } from './src/builder';
import { objectWithMesh, buildItemXml } from './src/builder';
import { create3MFArchive } from './src/packager';
import type { Mesh } from './src/mesh';

// Given a Mesh object (from parseMesh or custom geometry)
const mesh: Mesh = /* ... */;

// 1. Build object and build-item XML elements
const objElement = objectWithMesh(1, mesh);
const itemElement = buildItemXml(1 /* object ID */, { '@_partnumber': 'baseplate' });

// 2. Assemble the top-level ThreeMFXml structure
const xmlObj: ThreeMFXml = {
  model: {
    '@_unit': 'millimeter',
    '@_xmlns': 'http://schemas.microsoft.com/3dmanufacturing/core/2015/02',
    resources: { object: objElement },
    build:     { item:  itemElement }
  }
};

// 3. Create the .3mf package and write it out
const zip = create3MFArchive(xmlObj);
const buffer = await zip.generateAsync({ type: 'nodebuffer' });
await Deno.writeFile('output.3mf', buffer);
```

## Examples

For runnable examples and usage details, see [examples/README.md](./examples/README.md).

## Contributing

We use a file-based task system in `.ai/tasks/`. New features and bug fixes should follow existing patterns:
1. Pick an open task in `.ai/TASKS.md` and update its status when done.
2. Ensure all new code is covered by unit tests.
3. Submit a pull request—CI will run automatically.

## License

MIT
