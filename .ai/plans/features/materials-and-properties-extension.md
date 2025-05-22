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

## Task 19: XML Parsing for Materials & Properties Extension

### Objective
Extend the XML parsing pipeline to detect and parse all materials and properties extension elements according to the 3MF Materials Extension Specification (v1.2.1).

### Scope
- Identify and parse the following elements and attributes within `<resources>`:
  - `<texture2d>`: id, path, contenttype, tilestyleu, tilestylev, filter, any other attributes
  - `<texture2dgroup>`: id, texid, displaypropertiesid, child `<tex2coord>` elements (u, v)
  - `<colorgroup>`: id, displaypropertiesid, child `<color>` elements (color)
  - `<compositematerials>`: id, matid, matindices, displaypropertiesid, child `<composite>` elements (values)
  - `<multiproperties>`: id, pids, blendmethods, child `<multi>` elements (pindices)
- Detect and parse all display properties groups under the materials namespace:
  - `<pbspeculardisplayproperties>` (id, child `<pbspecular>`: name, specularcolor, glossiness)
  - `<pbmetallicdisplayproperties>` (id, child `<pbmetallic>`: name, metallicness, roughness)
  - `<pbspeculartexturedisplayproperties>` (id, name, speculartextureid, glossinesstextureid, diffusefactor, specularfactor, glossinessfactor)
  - `<pbmetallictexturedisplayproperties>` (id, name, metallictextureid, roughnesstextureid, metallicfactor, roughnessfactor)
  - `<translucentdisplayproperties>` (id, child `<translucent>`: name, attenuation, refractiveindex, roughness)

### Implementation Steps
1. Create a new parser module `src/materials-extension/parser.ts`:
   - Implement individual parse functions for each element type:
     - `parseTexture2D(element: any): Texture2D`
     - `parseTexture2DGroup(element: any): Texture2DGroup`
     - `parseColorGroup(element: any): ColorGroup`
     - `parseCompositeMaterials(element: any): CompositeMaterials`
     - `parseMultiProperties(element: any): MultiProperties`
     - `parseDisplayProperties(xmlObj: any): DisplayPropertiesContainer` (handles all pbspecular*, pbmetallic*, etc.)
2. Define an extension-parsing entrypoint `parseMaterialsExtensions(xmlObj: any): MaterialsExtensionResources` that:
   - Checks for the materials namespace declaration (`xmlns:m`)
   - Iterates through `<resources>` to collect all extension elements
   - Returns a cohesive object containing maps/lists of parsed extension resources
3. Extend the `Resources` interface (in `src/resources.ts`) to include:
   - `textures: Map<ResourceID, Texture2D>`
   - `texture2DGroups: Map<ResourceID, Texture2DGroup>`
   - `colorGroups: Map<ResourceID, ColorGroup>`
   - `compositeMaterials: Map<ResourceID, CompositeMaterials>`
   - `multiProperties: Map<ResourceID, MultiProperties>`
   - `displayProperties: Consolidated display properties by group ID`
4. Modify `parseResourcesFromXml` (and `parseResources`) to:
   - Invoke `parseMaterialsExtensions(xmlObj)` after `parseProductionExtensions`
   - Integrate returned extension resources into the `Resources` object
5. Add robust validation and error reporting using `ResourcesParseError`:
   - Required attributes missing
   - Duplicate resource IDs
   - Invalid enum or numeric values
6. Write unit tests in `test/` covering:
   - Each individual element parser with minimal and full-attribute cases
   - Combined `<resources>` with multiple extension elements
   - Failure cases (missing required attributes, invalid values)
   - Sample 3MF files from the specification appendices

### Acceptance Criteria
- All specified extension elements are parsed into appropriate in-memory structures matching the TypeScript types
- The parser tolerates unknown attributes via the `[key: string]: any` catch-all
- Errors thrown for missing required attributes or invalid values
- Unit tests cover 100% of the new parser code
- Integration with `ThreeMFDocument.toJSON()` will be addressed in Task 20 

## Task 20: Document Integration & JSON Serialization for Extension

### Objective
Integrate parsed materials & properties extension resources into the in-memory document model and ensure they are included in JSON serialization and deserialization.

### Scope
- Extend the `DocumentJSON` structure to include arrays for:
  - `textures`
  - `texture2DGroups`
  - `colorGroups`
  - `compositeMaterials`
  - `multiProperties`
  - All display properties groups (`pbspeculardisplayproperties`, `pbmetallicdisplayproperties`, `pbspeculartexturedisplayproperties`, `pbmetallictexturedisplayproperties`, `translucentdisplayproperties`)
- Update `ThreeMFDocument.toJSON()` to map each extension resource map into its corresponding JSON array
- Update `ThreeMFDocument.fromJSON()` to rebuild extension resource maps from the JSON arrays

### Implementation Steps
1. In `src/document.ts`, update the `DocumentJSON` interface:
   - Add properties under `resources` for each extension resource array, typed to match the extension DTOs
2. Modify the `toJSON()` method:
   - After serializing base materials and objects, include:
     ```ts
     const textures = Array.from(this.resources.textures.values());
     const texture2DGroups = Array.from(this.resources.texture2DGroups.values());
     // similarly for colorGroups, compositeMaterials, multiProperties
     const displayProperties = Array.from(this.resources.displayProperties.values());
     ```
   - Return these arrays in the top-level JSON `resources` object
3. Modify the `fromJSON()` static method:
   - Read each extension array from `json.resources`
   - Build new Maps for each resource type and assign to `resources`
4. Add unit and integration tests in `test/document-extension.test.ts`:
   - Create a `ThreeMFDocument` instance with dummy extension resources
   - Verify `toJSON()` includes the extension arrays
   - Verify `fromJSON()` reconstructs a `ThreeMFDocument` with matching extension maps
   - Round-trip JSON → object → JSON yields identical extension data

### Acceptance Criteria
- `DocumentJSON` type reflects all extension resource arrays
- `toJSON()` output includes accurate extension data
- `fromJSON()` correctly rebuilds extension maps
- Round-trip tests for extension resources pass in 100% of cases 