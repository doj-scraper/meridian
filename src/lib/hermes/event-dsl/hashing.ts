/**
 * @hermes/event-dsl — Cryptographic Hashing
 *
 * SHA-256 content hashing for Hermes events.
 * Used for:
 *   - Event content integrity verification
 *   - Deterministic tie-breaking in frontier solver
 *   - Ed25519 signature payloads
 *
 * Hash computation follows the Hermes protocol:
 *   hash = SHA-256(JCS-canonicalize(event \ {contentHash, topologicalRank, signature}))
 *
 * The hash is branded as BrandedContentHash to prevent forgery
 * or use of unverified hash values.
 */

import { createHash } from "crypto";
import { brandContentHash, type BrandedContentHash } from "../test-harness/brands";
import { canonicalizeForHash } from "./canonicalize";

// ═══════════════════════════════════════════════════════════════
// SHA-256 Hashing
// ═══════════════════════════════════════════════════════════════

/**
 * Compute the SHA-256 content hash of a HermesEvent.
 *
 * The hash is computed over the JCS-canonicalized event with
 * contentHash, topologicalRank, and signature fields excluded.
 *
 * @param event - The event object (before hash assignment)
 * @returns Branded SHA-256 hex digest
 */
export function computeContentHash(
  event: Record<string, unknown>
): BrandedContentHash {
  const canonical = canonicalizeForHash(event);
  const digest = createHash("sha256").update(canonical, "utf8").digest("hex");
  return brandContentHash(digest);
}

/**
 * Compute SHA-256 hash of an arbitrary string for tie-breaking.
 * Used by the frontier solver when multiple events have equal priority.
 *
 * Tie-breaking hash is computed over the full JCS-canonicalized event,
 * ensuring deterministic ordering that never affects frontier membership.
 */
export function computeTieBreakHash(
  event: Record<string, unknown>
): string {
  const canonical = canonicalizeForHash(event);
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}

/**
 * Verify that an event's content hash matches its computed hash.
 * Returns true if the event is integrity-verified.
 */
export function verifyContentHash(
  event: Record<string, unknown> & { contentHash: string }
): boolean {
  const computed = computeContentHash(event);
  return computed === event.contentHash;
}

/**
 * Compute SHA-256 of an arbitrary value for general use.
 */
export function sha256(data: string): string {
  return createHash("sha256").update(data, "utf8").digest("hex");
}

/**
 * Compute a deterministic event ID from content hash and run context.
 * This provides a secondary verification path for event identity.
 */
export function deriveEventFingerprint(
  contentHash: BrandedContentHash,
  runId: string,
  causalDepth: number
): string {
  return sha256(`${contentHash}:${runId}:${causalDepth}`);
}
