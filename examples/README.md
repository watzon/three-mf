# Examples

This directory contains runnable examples demonstrating usage of the `three-mf` library.

## Basic Usage

`basic-usage.ts` shows how to parse a standard 3MF file and output its JSON structure.

Usage:

```bash
bun run examples/basic-usage.ts path/to/model.3mf
```

## Production Extension Usage

`production-usage.ts` shows how to parse and serialize the 3MF Production Extension attributes, generate OPC `.rels` relationships, and generate new ST_UUID strings.

Usage:

```bash
bun run examples/production-usage.ts path/to/production-model.3mf
```

### Mesh Inspector

`mesh-inspector.ts` inspects all meshes in the root model (including flattened component hierarchies) and any referenced OPC part relationships, reporting vertex and triangle counts and bounding boxes.

Usage:

```bash
bun run examples/mesh-inspector.ts path/to/model.3mf
```

### Component Flattener

`component-flatten.ts` reads a 3MF file and flattens the component hierarchy for a specific object ID, outputting the merged mesh as JSON.

Usage:

```bash
bun run examples/component-flatten.ts path/to/model.3mf <object-id>
```

### Validation Report

`validate-report.ts` validates mesh integrity, component references, and build items, outputting any issues or confirming a successful validation.

Usage:

```bash
bun run examples/validate-report.ts path/to/model.3mf
```

### STL to 3MF Converter

`stl-to-3mf.ts` reads an ASCII or binary STL file and wraps it into a minimal 3MF package ready for printing or further processing.

Usage:

```bash
bun run examples/stl-to-3mf.ts path/to/input.stl path/to/output.3mf
```

Place your sample files in a convenient directory and reference them when running these examples.

## Materials & Properties Extension Usage

`materials-extension-usage.ts` shows how to parse 3MF Materials & Properties Extension resources from a 3MF file.

Usage:

```bash
bun run examples/materials-extension-usage.ts path/to/model-with-extension.3mf
``` 