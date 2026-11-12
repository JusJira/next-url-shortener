export const MAX_URL_LENGTH = 2048;

/**
 * Only http(s) destinations are allowed. Without this, values such as
 * `javascript:` or `data:` URLs would pass `z.string().url()` and end up in a
 * redirect Location header.
 */
export function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}
