---
id: 22
title: 'Packager Support for Extension Resources'
status: completed
priority: medium
feature: 'Materials and Properties Extension'
dependencies:
  - 21
assigned_agent: null
created_at: "2025-05-22T18:20:00Z"
started_at: "2025-05-22T21:26:29Z"
completed_at: "2025-05-22T21:44:49Z"
error_log: null
---

## Description

Extend the 3MF archive packager to include materials & properties extension resources and texture data.

## Details

- Update `create3MFArchive` in `src/packager.ts` to:
  - Include extension XML parts (e.g., additional parts under `3D/` for texture2d, colorgroup, etc.)
  - Add necessary relationships in `.rels` files for extension parts and texture targets.
  - Include binary texture files in the ZIP archive.
- Ensure content types are updated in `[Content_Types].xml` for new part extensions.

## Test Strategy

- Write integration tests to generate a 3MF archive containing sample extension resources.
- Validate archive entries and relationships via `bun test`. 