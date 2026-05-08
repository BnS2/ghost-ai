/**
 * Project identifier utilities.
 *
 * - `generateSlug`   — deterministic, human-readable slug from a project name.
 * - `generateSuffix` — cryptographically random alphanumeric suffix.
 */

const SLUG_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";

/**
 * Generate a cryptographically random alphanumeric suffix.
 *
 * Uses `crypto.getRandomValues` (CSPRNG) — available in all modern browsers
 * and Node ≥ 19 / Next.js server components.
 *
 * @param length Number of characters (default 4 → 36⁴ ≈ 1.68 M combinations).
 */
export function generateSuffix(length = 4): string {
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values, (v) => SLUG_ALPHABET[v % SLUG_ALPHABET.length]).join("");
}

/**
 * Derive a URL-safe slug from a human-readable project name.
 *
 * 1. NFKD-normalize → strip diacritics.
 * 2. Lowercase → collapse non-alphanumeric runs to hyphens.
 * 3. Trim leading/trailing hyphens.
 * 4. Fallback: hex-encode codepoints for purely non-Latin names (CJK, emoji, etc.).
 */
export function generateSlug(name: string): string {
  const slug = name
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (slug) return slug;

  // Fallback for purely non-Latin names (e.g. CJK): hex codepoints
  return Array.from(name)
    .map((c) => (c.codePointAt(0) ?? 0).toString(16))
    .join("-");
}
