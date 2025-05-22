---
id: 21
title: 'Builder Helpers for Materials & Properties Extension'
status: completed
priority: medium
feature: 'Materials and Properties Extension'
dependencies:
  - 20
assigned_agent: null
created_at: "2025-05-22T18:15:00Z"
started_at: null
completed_at: "2025-05-22T18:15:00Z"
error_log: null
---

## Description

Implement XML builder functions for extension elements in `src/builder.ts`.

## Details

- Added helper functions in `src/builder.ts` for texture2dToXml, texture2dGroupToXml, colorGroupToXml, compositeMaterialsToXml, multiPropertiesToXml, and display-properties builders.
- Preserved unknown extra properties and exported all builder functions.
- Added corresponding unit tests in `test/materials-extension-builder.test.ts`.

## Test Strategy

Run `bun test` to confirm all builder tests pass. 