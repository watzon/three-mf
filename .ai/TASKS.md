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