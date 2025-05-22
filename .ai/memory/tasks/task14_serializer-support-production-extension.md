---
id: 14
title: 'Serializer Support for Production Extension'
status: completed
priority: high
feature: '3MF Production Extension'
dependencies:
  - 13
  - 15
assigned_agent: null
created_at: "2025-05-22T03:43:41Z"
started_at: null
completed_at: "2025-05-22T04:15:26Z"
error_log: null
---

## Description

Extend serialization logic to write `path` and `UUID` attributes and generate `.rels` files for referenced model parts.

## Details

- Update XML serializer to include `path` and `p:UUID` attributes in `<build>`, `<item>`, `<component>`, and `<object>` elements.
- Implement generation of part relationship files (`.rels`) for non-root model references.
- Ensure output remains compatible with core 3MF when production extension attributes are absent.

## Test Strategy

- Serialize a model with production extension attributes and compare XML output to specification samples.
- Validate generated `.rels` files reference correct targets. 