# Feature: Materials and Properties Extension

## Overview
Add support for the 3MF Materials and Properties Extension (version 1.2.1) to parse, represent, serialize, and package new resource types and display properties as defined in the extension specification.

## Motivation
Another project requires materials extension support for realistic rendering and property handling. This feature completes the roadmap for the Materials and Properties Extension and expands the library's capabilities.

## Scope
- Parsing `<colorgroup>`, `<color>`, `<texture2d>`, `<tex2coord>`, `<texture2dgroup>`, `<compositematerials>`, `<composite>`, `<multiproperties>`, `<multi>`, and display properties elements: `<pbspeculardisplayproperties>`, `<pbmetallicdisplayproperties>`, `<pbspeculartexturedisplayproperties>`, `<pbmetallictexturedisplayproperties>`, `<translucentdisplayproperties>`, `<translucent>`.
- Defining TypeScript interfaces for all extension elements.
- Extending XML parsing functions (`parseResourcesFromXml` and related) to include extension resources.
- Integrating extension resources into `ThreeMFDocument` and JSON output.
- Implementing builder helper functions for extension elements in `src/builder.ts`.
- Extending `create3MFArchive` to include extension parts and relationships (e.g., texture data).
- Writing unit tests and examples to validate and demonstrate the new functionality.

## Requirements & Deliverables
- Data model definitions for all extension resource types.
- XML parsing support for extension elements.
- Document integration and serialization to JSON for extension resources.
- Builder functions for generating extension XML.
- Packaging support for extension files and texture parts.
- Unit tests covering parsing, building, and packaging.
- Updated API documentation and usage examples.

## Acceptance Criteria
- Library can parse and round-trip extension elements without errors.
- `ThreeMFDocument.toJSON()` includes extension resources accurately.
- Builder functions generate valid extension XML elements.
- Generated archives contain correct extension parts and relationships.
- All new code is covered by unit tests.
- Documentation and examples demonstrate extension usage clearly.

## Timeline & Milestones
1. Define data models (Task 18)
2. Implement parser support (Task 19)
3. Integrate into document and JSON output (Task 20)
4. Implement builder helpers (Task 21)
5. Extend packager (Task 22)
6. Write unit tests (Task 23)
7. Update documentation and examples (Task 24) 