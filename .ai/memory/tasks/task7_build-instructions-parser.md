---
id: 7
title: 'Build Instructions Parser'
status: completed
priority: medium
feature: 'Core Parser'
dependencies:
  - 4
assigned_agent: null
created_at: "2025-05-21T18:59:28Z"
started_at: null
completed_at: "2025-05-22T12:00:00Z"
error_log: null
---

## Description

Parse the `<build>` section to extract `<item>` definitions with `objectid`, `transform`, and `partnumber`, and link them to parsed resources.

## Details

- Parse `<item>` elements from `<build>`
- Capture attributes:
  - `objectid` → reference to object resource
  - `transform` → placement transform matrix
  - `partnumber` → optional identifier
- Validate that referenced objects exist
- Build an ordered list of build items for later processing

## Test Strategy

- Build XML with valid items → expect correct list
- Item referencing missing object → expect error
- Items with and without `partnumber` → verify optional handling 