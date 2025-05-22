# Changelog

All notable changes to this project are documented in this file.

## [Unreleased] - 2025-05-22

### Added
- Support for 3MF Production Extension: parsing and serialization of `path` and `UUID` attributes on `<build>`, `<item>`, `<component>`, and `<object>` elements; OPC `.rels` file generation via `generatePartRels()`; and the `generateUUID()` utility. See [3MF Production Extension specification](3MF%20Production%20Extension.md). 