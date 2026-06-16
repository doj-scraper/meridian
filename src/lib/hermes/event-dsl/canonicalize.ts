/**
 * @hermes/event-dsl — JCS Canonicalization (RFC 8785)
 *
 * JSON Canonicalization Scheme implementation for deterministic
 * event serialization. Required for:
 *   - Content hash computation (SHA-256 input)
 *   - Tie-breaking in frontier solver
 *   - Cross-system event verification
 *   - Ed25519 signature payloads
 *
 * JCS ensures that semantically identical JSON documents produce
 * identical byte sequences, regardless of whitespace, key ordering,
 * or number formatting differences.
 *
 * Simplified implementation following RFC 8785:
 * 1. Remove whitespace
 * 2. Sort object keys lexicographically (ES2019+ guarantees)
 * 3. Normalize number formatting
 */

// ═══════════════════════════════════════════════════════════════
// Canonical Serialization
// ═══════════════════════════════════════════════════════════════

/**
 * Canonicalize a JSON-compatible value according to JCS (RFC 8785).
 *
 * This produces a deterministic byte-precise serialization:
 * - Object keys are sorted lexicographically
 * - No whitespace
 * - Numbers are normalized (no trailing zeros, scientific notation for large)
 * - Strings are UTF-8 encoded with proper escaping
 *
 * @param value - Any JSON-compatible value
 * @returns Deterministic JSON string
 */
export function canonicalize(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "null";

  switch (typeof value) {
    case "string":
      return serializeString(value);
    case "number":
      return serializeNumber(value);
    case "boolean":
      return value ? "true" : "false";
    case "object":
      if (Array.isArray(value)) {
        return serializeArray(value);
      }
      return serializeObject(value as Record<string, unknown>);
    default:
      throw new Error(`JCS: Cannot canonicalize type: ${typeof value}`);
  }
}

// ═══════════════════════════════════════════════════════════════
// Primitive Serializers
// ═══════════════════════════════════════════════════════════════

/**
 * Serialize a string with proper JSON escaping.
 */
function serializeString(value: string): string {
  const escaped = value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t")
    .replace(/[\b]/g, "\\b")
    .replace(/\f/g, "\\f");
  return `"${escaped}"`;
}

/**
 * Serialize a number following JCS number formatting rules.
 *
 * JCS Number Formatting (RFC 8785, Section 3.2.4.2):
 * - Integer values: no decimal point (e.g., 42, not 42.0)
 * - Non-integer values: minimal decimal representation
 * - No trailing zeros after decimal point
 * - No leading plus sign
 * - Scientific notation for very large/small numbers
 */
function serializeNumber(value: number): string {
  // Special values
  if (Number.isNaN(value)) {
    throw new Error("JCS: NaN is not a valid JSON value");
  }
  if (!Number.isFinite(value)) {
    throw new Error("JCS: Infinity is not a valid JSON value");
  }

  // Check if it's an integer
  if (Number.isInteger(value) && Math.abs(value) < 1e21) {
    return value.toString(10);
  }

  // Non-integer: use toISOString-style formatting for determinism
  // Remove trailing zeros from decimal representation
  const str = value.toString(10);

  // Handle scientific notation
  if (str.includes("e") || str.includes("E")) {
    return normalizeScientific(str);
  }

  // Remove trailing zeros after decimal point
  if (str.includes(".")) {
    return str.replace(/\.?0+$/, "");
  }

  return str;
}

/**
 * Normalize scientific notation to a consistent format.
 */
function normalizeScientific(str: string): string {
  // Convert to uppercase 'E'
  const normalized = str.replace("e", "E");

  // Parse mantissa and exponent
  const match = normalized.match(/^(-?\d+\.?\d*)E([+-]?\d+)$/);
  if (!match) return str;

  const mantissa = match[1];
  const exponent = parseInt(match[2], 10);

  // Remove trailing zeros from mantissa
  const cleanMantissa = mantissa.includes(".")
    ? mantissa.replace(/\.?0+$/, "")
    : mantissa;

  // Reconstruct with normalized exponent
  const expStr = exponent >= 0 ? `+${exponent}` : `${exponent}`;
  return `${cleanMantissa}E${expStr}`;
}

/**
 * Serialize an array.
 */
function serializeArray(value: unknown[]): string {
  const elements = value.map((item) => canonicalize(item));
  return `[${elements.join(",")}]`;
}

/**
 * Serialize an object with keys sorted lexicographically.
 * This is the core of JCS — deterministic key ordering.
 */
function serializeObject(value: Record<string, unknown>): string {
  const keys = Object.keys(value).sort();
  const pairs = keys.map((key) => `${canonicalize(key)}:${canonicalize(value[key])}`);
  return `{${pairs.join(",")}}`;
}

// ═══════════════════════════════════════════════════════════════
// Event-Specific Canonicalization
// ═══════════════════════════════════════════════════════════════

/**
 * Canonicalize an event for content hashing.
 *
 * The content hash is computed over the event EXCLUDING the
 * contentHash field itself (which would be circular).
 * The topologicalRank is also excluded (assigned later by CCL).
 * The signature is excluded (computed over the hash).
 */
export function canonicalizeForHash(event: Record<string, unknown>): string {
  const { contentHash, topologicalRank, signature, ...rest } = event as Record<string, unknown>;
  void contentHash; // Explicitly excluded
  void topologicalRank; // Assigned later
  void signature; // Computed over hash
  return canonicalize(rest);
}

/**
 * Canonicalize an event for signature computation.
 * Includes the content hash but excludes the signature itself.
 */
export function canonicalizeForSignature(event: Record<string, unknown>): string {
  const { signature, ...rest } = event as Record<string, unknown>;
  void signature; // Explicitly excluded
  return canonicalize(rest);
}

/**
 * Canonicalize an event for tie-breaking in frontier solver.
 * Uses the full event including all fields.
 */
export function canonicalizeForTieBreak(event: Record<string, unknown>): string {
  return canonicalize(event);
}
