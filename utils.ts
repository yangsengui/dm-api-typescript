import { DEFAULT_BUFFER_SIZE } from './constants.js';

export function parseJson<T>(value: string | null): T | null {
  if (!value) {
    return null;
  }
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function allocBuffer(size: number, fallback: number = DEFAULT_BUFFER_SIZE): Buffer {
  const normalized = Number.isFinite(size) ? Math.floor(size) : fallback;
  return Buffer.alloc(Math.max(1, normalized));
}

export function readCString(buffer: Buffer): string {
  const end = buffer.indexOf(0);
  return buffer.toString('utf8', 0, end >= 0 ? end : undefined);
}
