---
id: 24
title: 'Documentation & Examples for Extension Usage'
status: completed
priority: low
feature: 'Materials and Properties Extension'
dependencies:
  - 23
assigned_agent: null
created_at: "2025-05-22T18:30:00Z"
started_at: null
completed_at: "2025-05-22T22:16:12Z"
error_log: null
---

## Description

Update README, API reference, and usage examples to demonstrate materials & properties extension support.

## Details

- Add a section in `README.md` describing the extension and how to enable it.
- Provide code snippets showing parsing extension resources and using builder helpers.
- Update API docs to include new types and builder functions.
- Create an example script or sample 3MF file showcasing extension round-trip.

## Test Strategy

- Manually verify rendered documentation.
- Include example scripts in integration tests if possible,
  and run them via `bun run`. 