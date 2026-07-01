# Changelog

All notable changes to this project are documented in this file.

## [1.1.2] - 2026-07-01

### Fixed
- npm publish pipeline: build scripts use `npm run` so TypeScript compiles without Bun on PATH.
- Add `@types/node` for reliable `fs`/`Buffer` types during publish builds.

## [1.1.1] - 2026-07-01

### Fixed
- Emit Node-compatible ESM with explicit `.js` relative imports (`NodeNext` build).

### Changed
- Exclude the development OPC harness (`src/test.ts`) from published builds.
- Run `bun run build` in CI before tests.
- Package `exports` now expose ESM `import` only (removed misleading `require` condition).

### Added
- MIT `LICENSE` file and npm metadata (`description`, `repository`, `keywords`, `sideEffects`).
- Root exports for `builder` and `packager`; subpath exports for `production-extension` and `materials-extension`.

## [1.1.0] - 2025-05-22

### Added
- Support for 3MF Materials & Properties Extension (v1.2.1):
  - TypeScript data models in `src/materials-extension/types.ts`.
  - Parser functions in `src/materials-extension/parser.ts` for `<texture2d>`, `<texture2dgroup>`, `<colorgroup>`, `<compositematerials>`, `<multiproperties>`, and display properties elements (`pbspeculardisplayproperties`, `pbmetallicdisplayproperties`, `pbspeculartexturedisplayproperties`, `pbmetallictexturedisplayproperties`, `translucentdisplayproperties`).
  - Builder helper functions in `src/builder.ts` (`texture2dToXml()`, `texture2dGroupToXml()`, `colorGroupToXml()`, `compositeMaterialsToXml()`, `multiPropertiesToXml()`, `pbSpecularDisplayPropertiesToXml()`, `pbMetallicDisplayPropertiesToXml()`, `pbSpecularTextureDisplayPropertiesToXml()`, `pbMetallicTextureDisplayPropertiesToXml()`, `translucentDisplayPropertiesToXml()`).
  - Packager enhancements in `src/packager.ts` to include binary textures, relationships, and updated content types for extension resources.
  - Unit and integration tests (`test/materials-extension-parser.test.ts`, `test/materials-extension-builder.test.ts`, `test/packager-extension.test.ts`) achieving 100% coverage of extension code.
  - Documentation and examples in `README.md` and `examples/materials-extension-usage.ts` illustrating extension usage.

## [1.0.0] - 2025-05-22

### Added
- Support for 3MF Production Extension: parsing and serialization of `path` and `UUID` attributes on `<build>`, `<item>`, `<component>`, and `<object>` elements; OPC `.rels` file generation via `generatePartRels()`; and the `generateUUID()` utility. See [3MF Production Extension specification](3MF%20Production%20Extension.md). 