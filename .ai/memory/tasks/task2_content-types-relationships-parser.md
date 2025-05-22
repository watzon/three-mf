---
id: 2
title: 'Content Types & Relationships Parser'
status: completed
priority: critical
feature: 'Core Parser'
dependencies:
  - 1
assigned_agent: null
created_at: "2025-05-21T18:59:28Z"
started_at: null
completed_at: null
error_log: null
---

## Description

Validate and map part types from `[Content_Types].xml`, then parse `_rels/.rels` to establish the StartPart relationship.

## Details

- Read and parse `[Content_Types].xml` to build a map of content types → part paths
- Read `_rels/.rels` to extract package-level relationships
- Identify the StartPart for the 3D Model part
- Expose functions like `getContentTypeMap()` and `getStartPartPath()`
- Handle missing or malformed XML gracefully

## Test Strategy

- Valid `.3mf` zip with standard parts → expect correct maps
- Malformed `[Content_Types].xml` → expect parse error
- Missing StartPart relationship → expect specific error 