import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a new RFC4122-compliant UUID (ST_UUID format).
 * @returns A lowercase UUID string matching [a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}
 */
export function generateUUID(): string {
  return uuidv4();
} 