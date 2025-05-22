---
id: 20
title: 'Document Integration & JSON Serialization for Extension'
status: completed
priority: high
feature: 'Materials and Properties Extension'
dependencies:
  - 19
assigned_agent: null
created_at: "2025-05-22T18:05:00Z"
started_at: null
completed_at: "2025-05-22T18:10:00Z"
error_log: null
---

## Description

Integrate extension resources into `ThreeMFDocument` and include them in JSON output.

## Details

- Updated `src/document.ts` and `DocumentJSON` to include arrays for textures, texture2DGroups, colorGroups, compositeMaterials, multiProperties, and displayProperties.
- Enhanced `ThreeMFDocument.toJSON()` and `ThreeMFDocument.fromJSON()` to handle extension maps.
- Added integration tests in `test/document-extension.test.ts` and updated `test/document.test.ts` to handle missing extension data.

## Test Strategy

Run `bun test` to confirm document extension tests pass. 