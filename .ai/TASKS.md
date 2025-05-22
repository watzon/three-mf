# Project Tasks

- [x] **ID 1: OPC/ZIP Container Reader** (Priority: critical)
> Open a `.3mf` ZIP archive, parse `[Content_Types].xml`, and locate the primary 3D Model part via `_rels/.rels`.

- [x] **ID 2: Content Types & Relationships Parser** (Priority: critical)
> Validate and map part types from `[Content_Types].xml`, then parse `_rels/.rels` to establish the StartPart.

- [x] **ID 3: 3D Model XML Parser** (Priority: high)
> Parse the `<model>` element, including `unit`, `xml:lang`, and extension attributes; enforce exactly one `<model>` element.

- [x] **ID 4: Resources Parser** (Priority: high)
> Extract `<basematerials>` and `<object>` definitions, mapping IDs and verifying uniqueness.

- [x] **ID 5: Mesh Data Structures** (Priority: critical)
> Parse `<mesh>` into vertices and triangles arrays; enforce manifold and orientation rules.

- [x] **ID 6: Component Composition** (Priority: high)
> Implement `<components>` handling to compose objects via `objectid` and `transform`.

- [x] **ID 7: Build Instructions Parser** (Priority: medium)
> Parse `<build>` items with `objectid`, `transform`, and link to parsed resources.

- [x] **ID 8: In-Memory API Definition** (Priority: medium)
> Design TS interfaces/classes for Model, Resources, Mesh, and Build; include serialization hooks.

- [x] **ID 9: Error Reporting & Conformance** (Priority: high)
> Implement validation for MUST rules (errors) and SHOULD rules (warnings) with rich error types.

- [x] **ID 10: CI & Test Setup** (Priority: medium)
> Configure `bun test`, add initial unit tests for earlier modules, and set up GitHub Actions.

- [x] **ID 11: Production Extension Code Scaffolding** (Priority: critical)
> Set up the initial code structure and register the production extension namespace constants and file modules.

- [x] **ID 12: Parser Support for Production Extension Attributes** (Priority: high)
> Extend XML parser to read `path` and `p:UUID` attributes in `<build>`, `<item>`, `<component>`, and `<object>` elements.

- [x] **ID 13: Data Model Extension for Production Attributes** (Priority: high)
> Extend internal data structures to include `path` and `UUID` fields for models, items, components, and builds.

- [x] **ID 14: Serializer Support for Production Extension** (Priority: high)
> Extend serialization logic to write `path` and `UUID` attributes and generate `.rels` files for referenced model parts.

- [x] **ID 15: UUID Utility for Production Extension** (Priority: medium)
> Implement GUID generation utility to produce valid ST_UUID strings for build, items, objects, and components.

- [x] **ID 16: Tests for Production Extension** (Priority: medium)
> Write unit and integration tests for parsing, data model, and serialization of production extension features.

- [x] **ID 17: Documentation for Production Extension** (Priority: low)
> Update project documentation with usage examples and reference to the Production Extension specification.

- [ ] **ID 18: Data Models for Materials & Properties Extension** (Priority: high)
> Define TypeScript interfaces and types for the 3MF Materials and Properties Extension elements.

- [ ] **ID 19: XML Parsing for Materials & Properties Extension** (Priority: high)
> Extend `parseResourcesFromXml` and related functions to parse all extension elements.

- [ ] **ID 20: Document Integration & JSON Serialization for Extension** (Priority: high)
> Integrate extension resources into `ThreeMFDocument` and include them in JSON output.

- [ ] **ID 21: Builder Helpers for Materials & Properties Extension** (Priority: medium)
> Implement XML builder functions for extension elements in `src/builder.ts`.

- [ ] **ID 22: Packager Support for Extension Resources** (Priority: medium)
> Extend `create3MFArchive` and relationships to include extension parts and texture data.

- [ ] **ID 23: Unit Tests for Materials & Properties Extension** (Priority: medium)
> Write unit tests covering parsing, building, and packaging of extension elements.

- [ ] **ID 24: Documentation & Examples for Extension Usage** (Priority: low)
> Update README, API reference, and examples to demonstrate materials and properties extension.