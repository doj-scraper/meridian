/**
 * memory-v2.ts — 3-Tier Memory Manager
 *
 * Tiers:
 *   1. session    — in-memory, run-scoped, auto-cleared when a run ends
 *   2. persistent — DB-backed via AgentMemory model, survives restarts
 *   3. artifact   — DB-backed via Artifact model, versioned content blobs
 *
 * Uses the shared Prisma client from @/lib/db.
 */

import { db } from "@/lib/db";

// ============ Types ============

export type MemoryTier = "session" | "persistent" | "artifact";

export interface MemoryValue {
  value: unknown;
  runId?: string;
  createdAt: number;
}

export interface ArtifactData {
  id: string;
  agentId: string;
  runId: string | null;
  name: string;
  type: string;
  content: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

// ============ Session Store ============

/**
 * In-memory session store keyed by `${agentId}:${runId}:${key}`.
 * Entries are scoped to a single run and auto-cleaned when the run ends.
 */
const sessionStore = new Map<string, MemoryValue>();

function sessionKey(agentId: string, key: string, runId?: string): string {
  return `${agentId}:${runId ?? "__global__"}:${key}`;
}

// ============ MemoryManager ============

class MemoryManager {
  // ──────── get ────────

  /**
   * Retrieve a value from the specified tier.
   * - session:    looks up in-memory store
   * - persistent: queries AgentMemory table
   * - artifact:   queries Artifact table (returns the artifact content)
   */
  async get(
    agentId: string,
    key: string,
    tier: MemoryTier,
    runId?: string,
  ): Promise<unknown> {
    switch (tier) {
      case "session": {
        const sk = sessionKey(agentId, key, runId);
        const entry = sessionStore.get(sk);
        if (!entry) return undefined;
        // honour expiry
        if (entry.createdAt && Date.now() - entry.createdAt > 24 * 60 * 60 * 1000) {
          sessionStore.delete(sk);
          return undefined;
        }
        return entry.value;
      }

      case "persistent": {
        const row = await db.agentMemory.findUnique({
          where: { agentId_key_tier: { agentId, key, tier: "persistent" } },
        });
        if (!row) return undefined;
        // check expiry
        if (row.expiresAt && row.expiresAt < new Date()) {
          await db.agentMemory.delete({ where: { id: row.id } });
          return undefined;
        }
        try {
          return JSON.parse(row.value);
        } catch {
          return row.value;
        }
      }

      case "artifact": {
        const artifact = await db.artifact.findUnique({
          where: { agentId_name: { agentId, name: key } },
        });
        if (!artifact) return undefined;
        try {
          return {
            id: artifact.id,
            name: artifact.name,
            type: artifact.type,
            content: artifact.content,
            metadata: artifact.metadata ? JSON.parse(artifact.metadata) : null,
            runId: artifact.runId,
            createdAt: artifact.createdAt,
          };
        } catch {
          return artifact.content;
        }
      }

      default:
        throw new Error(`Unknown memory tier: ${tier}`);
    }
  }

  // ──────── set ────────

  /**
   * Write a value into the specified tier.
   * - session:    stored in-memory, run-scoped
   * - persistent: upserted into AgentMemory table
   * - artifact:   upserted into Artifact table
   */
  async set(
    agentId: string,
    key: string,
    value: unknown,
    tier: MemoryTier,
    runId?: string,
  ): Promise<void> {
    switch (tier) {
      case "session": {
        const sk = sessionKey(agentId, key, runId);
        sessionStore.set(sk, { value, runId, createdAt: Date.now() });
        break;
      }

      case "persistent": {
        const jsonValue = JSON.stringify(value);
        await db.agentMemory.upsert({
          where: { agentId_key_tier: { agentId, key, tier: "persistent" } },
          update: { value: jsonValue, updatedAt: new Date() },
          create: {
            agentId,
            key,
            tier: "persistent",
            value: jsonValue,
          },
        });
        break;
      }

      case "artifact": {
        // For artifact tier, key = artifact name, value = content string
        const content = typeof value === "string" ? value : JSON.stringify(value);
        await db.artifact.upsert({
          where: { agentId_name: { agentId, name: key } },
          update: { content, type: "json", metadata: null },
          create: {
            agentId,
            name: key,
            type: "json",
            content,
            runId: runId ?? null,
          },
        });
        break;
      }

      default:
        throw new Error(`Unknown memory tier: ${tier}`);
    }
  }

  // ──────── delete ────────

  /**
   * Remove an entry from the specified tier.
   */
  async delete(
    agentId: string,
    key: string,
    tier: MemoryTier,
  ): Promise<boolean> {
    switch (tier) {
      case "session": {
        // Delete all session entries matching agentId+key across all runIds
        let deleted = false;
        for (const sk of sessionStore.keys()) {
          const parts = sk.split(":");
          const aId = parts[0];
          // const rId = parts[1]; // skip runId
          const k = parts.slice(2).join(":");
          if (aId === agentId && k === key) {
            sessionStore.delete(sk);
            deleted = true;
          }
        }
        return deleted;
      }

      case "persistent": {
        try {
          await db.agentMemory.delete({
            where: { agentId_key_tier: { agentId, key, tier: "persistent" } },
          });
          return true;
        } catch {
          return false;
        }
      }

      case "artifact": {
        try {
          await db.artifact.delete({
            where: { agentId_name: { agentId, name: key } },
          });
          return true;
        } catch {
          return false;
        }
      }

      default:
        throw new Error(`Unknown memory tier: ${tier}`);
    }
  }

  // ──────── list ────────

  /**
   * List all entries in a tier for a given agent.
   * Returns an array of { key, value, ... } objects.
   */
  async list(
    agentId: string,
    tier: MemoryTier,
  ): Promise<Array<{ key: string; value: unknown; createdAt?: Date | number }>> {
    switch (tier) {
      case "session": {
        const results: Array<{ key: string; value: unknown; createdAt?: number }> = [];
        for (const [sk, entry] of sessionStore.entries()) {
          const parts = sk.split(":");
          if (parts[0] === agentId) {
            const k = parts.slice(2).join(":");
            results.push({ key: k, value: entry.value, createdAt: entry.createdAt });
          }
        }
        return results;
      }

      case "persistent": {
        const rows = await db.agentMemory.findMany({
          where: { agentId, tier: "persistent" },
          orderBy: { createdAt: "desc" },
        });
        return rows.map((r) => ({
          key: r.key,
          value: safeJsonParse(r.value),
          createdAt: r.createdAt,
        }));
      }

      case "artifact": {
        const artifacts = await db.artifact.findMany({
          where: { agentId },
          orderBy: { createdAt: "desc" },
        });
        return artifacts.map((a) => ({
          key: a.name,
          value: {
            id: a.id,
            type: a.type,
            content: a.content,
            metadata: a.metadata ? safeJsonParse(a.metadata) : null,
            runId: a.runId,
          },
          createdAt: a.createdAt,
        }));
      }

      default:
        throw new Error(`Unknown memory tier: ${tier}`);
    }
  }

  // ──────── clearSession ────────

  /**
   * Clear all session-scoped memory for a specific run.
   * Called automatically when a run completes or is stopped.
   */
  clearSession(runId: string): number {
    let cleared = 0;
    for (const [sk, entry] of sessionStore.entries()) {
      if (entry.runId === runId) {
        sessionStore.delete(sk);
        cleared++;
      }
    }
    return cleared;
  }

  // ──────── Artifact-specific methods ────────

  /**
   * List all artifacts for an agent.
   */
  async listArtifacts(agentId: string): Promise<ArtifactData[]> {
    const artifacts = await db.artifact.findMany({
      where: { agentId },
      orderBy: { createdAt: "desc" },
    });
    return artifacts.map((a) => ({
      id: a.id,
      agentId: a.agentId,
      runId: a.runId,
      name: a.name,
      type: a.type,
      content: a.content,
      metadata: a.metadata ? (safeJsonParse(a.metadata) as Record<string, unknown> | null) : null,
      createdAt: a.createdAt,
    }));
  }

  /**
   * Get a specific artifact by agentId + name.
   */
  async getArtifact(agentId: string, name: string): Promise<ArtifactData | null> {
    const artifact = await db.artifact.findUnique({
      where: { agentId_name: { agentId, name } },
    });
    if (!artifact) return null;
    return {
      id: artifact.id,
      agentId: artifact.agentId,
      runId: artifact.runId,
      name: artifact.name,
      type: artifact.type,
      content: artifact.content,
      metadata: artifact.metadata ? (safeJsonParse(artifact.metadata) as Record<string, unknown> | null) : null,
      createdAt: artifact.createdAt,
    };
  }

  /**
   * Save or update an artifact.
   * If an artifact with the same agentId+name exists, it is updated.
   */
  async saveArtifact(
    agentId: string,
    name: string,
    content: string,
    type: string = "text",
    runId?: string,
    metadata?: Record<string, unknown>,
  ): Promise<ArtifactData> {
    const artifact = await db.artifact.upsert({
      where: { agentId_name: { agentId, name } },
      update: {
        content,
        type,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
      create: {
        agentId,
        name,
        type,
        content,
        runId: runId ?? null,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });

    return {
      id: artifact.id,
      agentId: artifact.agentId,
      runId: artifact.runId,
      name: artifact.name,
      type: artifact.type,
      content: artifact.content,
      metadata: artifact.metadata ? (safeJsonParse(artifact.metadata) as Record<string, unknown> | null) : null,
      createdAt: artifact.createdAt,
    };
  }
}

// ============ Helpers ============

function safeJsonParse(str: string): unknown {
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
}

// ============ Singleton ============

export const memoryManager = new MemoryManager();
