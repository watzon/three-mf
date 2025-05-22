---
id: 9
title: 'Error Reporting & Conformance'
status: completed
priority: high
feature: 'Core Parser'
dependencies:
  - 3
  - 5
assigned_agent: null
created_at: "2025-05-21T18:59:28Z"
started_at: null
completed_at: "2025-05-22T12:20:00Z"
error_log: null
---

## Description

Implement validation for specification MUST rules (errors) and SHOULD rules (warnings), providing rich error types with context and location.

## Details

- Define error classes for:
  - `ParseError`, `ValidationError`, `Warning` types
- Enforce MUST rules: throw errors on violations
- Enforce SHOULD rules: log warnings without throwing
- Include metadata (element, attribute, file path, line/column if possible)

## Test Strategy

- Create 3MF samples violating MUST rules → expect thrown `ValidationError`
- Samples violating SHOULD rules → expect logged `Warning` but continue
- Verify error messages contain correct context 