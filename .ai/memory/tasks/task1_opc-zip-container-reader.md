---
id: 1
title: 'OPC/ZIP Container Reader'
status: completed
priority: critical
feature: 'Core Parser'
dependencies: []
assigned_agent: null
created_at: "2025-05-21T18:59:28Z"
started_at: null
completed_at: null
error_log: null
---

## Description

Implement a module to read and extract parts from a `.3mf` ZIP archive, locate the primary 3D Model part via `[Content_Types].xml` and `_rels/.rels`.

## Details

- Open `.3mf` as ZIP (Deflate or Stored)
- Parse `[Content_Types].xml` for part-type mappings
- Read `_rels/.rels` to find the StartPart relationship for the 3D Model part
- Provide clear APIs: `openArchive()`, `getPrimaryModelPath()`
- Handle missing or malformed ZIP entries with errors

## Test Strategy

- Valid `.3mf` zip with correct structure → expect success
- Missing `[Content_Types].xml` → expect specific error
- Missing StartPart relationship → expect specific error 