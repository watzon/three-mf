import { expect, test, describe } from 'bun:test';
import { ParseError, ValidationError, SpecWarning, WarningLogger } from '../src/errors';
import type { ErrorContext } from '../src/errors';

describe('Error Reporting & Conformance', () => {
  test('ParseError stores message and context', () => {
    const ctx: ErrorContext = { element: 'model', attribute: 'unit', path: '/3dmodel.model', line: 10, column: 5 };
    const err = new ParseError('Failed to parse', ctx);
    expect(err).toBeInstanceOf(ParseError);
    expect(err.name).toBe('ParseError');
    expect(err.message).toBe('Failed to parse');
    expect(err.context).toEqual(ctx);
  });

  test('ValidationError stores message and context', () => {
    const ctx: ErrorContext = { element: 'triangle', attribute: 'v1' };
    const err = new ValidationError('Invalid triangle index', ctx);
    expect(err).toBeInstanceOf(ValidationError);
    expect(err.name).toBe('ValidationError');
    expect(err.message).toBe('Invalid triangle index');
    expect(err.context).toEqual(ctx);
  });

  test('SpecWarning stores message and context', () => {
    const ctx: ErrorContext = { element: 'model', attribute: 'recommendedextensions' };
    const warn = new SpecWarning('Unsupported optional extension', ctx);
    expect(warn).toBeInstanceOf(SpecWarning);
    expect(warn.message).toBe('Unsupported optional extension');
    expect(warn.context).toEqual(ctx);
  });

  test('WarningLogger collects and clears warnings', () => {
    WarningLogger.clear();
    const ctx1: ErrorContext = { element: 'resources', attribute: 'baseMaterials' };
    WarningLogger.warn('Optional resources missing', ctx1);
    WarningLogger.warn('Another warning');

    const all = WarningLogger.warnings;
    expect(all.length).toBe(2);
    const w0 = all[0]!;
    const w1 = all[1]!;
    expect(w0).toBeInstanceOf(SpecWarning);
    expect(w0.message).toBe('Optional resources missing');
    expect(w0.context).toEqual(ctx1);
    expect(w1.message).toBe('Another warning');
    expect(w1.context).toBeUndefined();

    WarningLogger.clear();
    expect(WarningLogger.warnings.length).toBe(0);
  });
}); 