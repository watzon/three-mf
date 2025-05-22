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

## Development

### Installing dependencies

```bash
bun install
```

### Running tests

```bash
bun test --watch
```

### Building

```bash
bun run build
```

### Building in watch mode

```bash
bun run build --watch
```

## Deployment

After building, publish the package to npm:

```bash
bun run build
npm publish
```

## Roadmap

Implementations status of 3MF spec (see [3MF specification](https://3mf.io/spec/)):

- [x] [Core 3MF Mesh Specification (Core spec)](specs/3MF%20Core%20Specification.md)
- [x] [Production Extension](specs/3MF%20Production%20Extension.md)
- [x] [Materials and Properties Extension](specs/3MF%20Materials%20Extension.md)
- [ ] [Slice Extension](specs/3MF%20Slice%20Extension.md)
- [ ] [Beam Lattice Extension](specs/3MF%20Beam%20Lattice%20Extension.md)
- [ ] [Boolean Operations Extension](specs/3MF%20Boolean%20operations.md)
- [ ] [Displacement Extension](specs/3MF%20Displacement%20Extension.md)
- [ ] [Secure Content Extension](specs/3MF%20Secure%20Content.md)
- [ ] [Volumetric Extension](specs/3MF%20Volumetric%20Extension.md)

## Usage

```ts
import {
  openArchive,
  getPrimaryModelPath,
  getModel,
  parseResourcesFromXml,
  parseBuildFromXml,
  ThreeMFDocument
} from 'three-mf';

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
- **texture2dToXml**(tex: Texture2D): any — Build `<texture2d>` elements for the Materials & Properties Extension.
- **texture2dGroupToXml**(grp: Texture2DGroup): any — Build `<texture2dgroup>` elements.
- **colorGroupToXml**(grp: ColorGroup): any — Build `<colorgroup>` elements.
- **compositeMaterialsToXml**(grp: CompositeMaterials): any — Build `<compositematerials>` elements.
- **multiPropertiesToXml**(mp: MultiProperties): any — Build `<multiproperties>` elements.
- **pbSpecularDisplayPropertiesToXml**(dp: PBSpecularDisplayProperties): any — Build `<pbspeculardisplayproperties>` elements.
- **pbMetallicDisplayPropertiesToXml**(dp: PBMetallicDisplayProperties): any — Build `<pbmetallicdisplayproperties>` elements.
- **pbSpecularTextureDisplayPropertiesToXml**(dp: PBSpecularTextureDisplayProperties): any — Build `<pbspeculartexturedisplayproperties>` elements.
- **pbMetallicTextureDisplayPropertiesToXml**(dp: PBMetallicTextureDisplayProperties): any — Build `<pbmetallictexturedisplayproperties>` elements.
- **translucentDisplayPropertiesToXml**(dp: TranslucentDisplayProperties): any — Build `<translucentdisplayproperties>` elements.

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

We welcome contributions! Please follow these steps to contribute to three-mf:

1. Fork the repository and clone your fork locally.
2. Create a feature branch: `git checkout -b feature/your-feature`.
3. Install dependencies: `bun install`.
4. Implement your changes.
5. Add or update tests under the `test/` directory to cover your changes.
6. Ensure all tests pass: `bun test`.
7. Commit your changes with a descriptive message: `git commit -m 'feat: describe your change'`.
8. Push to your branch: `git push origin feature/your-feature`.
9. Open a pull request against the `main` branch with a clear description of your changes.

For bug reports or feature requests, please open an issue.

## License

MIT
