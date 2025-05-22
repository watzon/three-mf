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

## Testing

Run the complete test suite with:

```bash
bun test
```

All modules are covered by unit tests. Tests are configured in GitHub Actions to run on pull requests and pushes to `main`.

## Contributing

We use a file-based task system in `.ai/tasks/`. New features and bug fixes should follow existing patterns:
1. Pick an open task in `.ai/TASKS.md` and update its status when done.
2. Ensure all new code is covered by unit tests.
3. Submit a pull request—CI will run automatically.

## License

MIT
