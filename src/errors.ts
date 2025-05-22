export interface ErrorContext {
  element: string;
  attribute?: string;
  path?: string;
  line?: number;
  column?: number;
}

/**
 * Base error for parsing issues
 */
export class ParseError extends Error {
  context?: ErrorContext;
  constructor(message: string, context?: ErrorContext) {
    super(message);
    this.name = 'ParseError';
    this.context = context;
  }
}

/**
 * Error for MUST rule violations
 */
export class ValidationError extends Error {
  context?: ErrorContext;
  constructor(message: string, context?: ErrorContext) {
    super(message);
    this.name = 'ValidationError';
    this.context = context;
  }
}

/**
 * Warning for SHOULD rule compliance
 */
export class SpecWarning {
  message: string;
  context?: ErrorContext;
  constructor(message: string, context?: ErrorContext) {
    this.message = message;
    this.context = context;
  }
}

/**
 * Logger for collecting specification warnings
 */
export class WarningLogger {
  private static _warnings: SpecWarning[] = [];

  /**
   * Log a new warning
   */
  static warn(message: string, context?: ErrorContext) {
    this._warnings.push(new SpecWarning(message, context));
  }

  /**
   * Retrieve all logged warnings
   */
  static get warnings(): SpecWarning[] {
    return [...this._warnings];
  }

  /**
   * Clear logged warnings
   */
  static clear() {
    this._warnings = [];
  }
} 