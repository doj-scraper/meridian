/**
 * @hermes/kernel-spine — Append-Only Event Store
 *
 * The event store is the persistent truth of the Hermes system.
 * Every HermesEvent is appended here and can never be modified.
 *
 * The store provides:
 * - In-memory indexing for fast queries
 * - Persistence via Prisma (HermesEvent model)
 * - Causal ordering via topological sort
 * - Event existence checks for parent validation
 *
 * KEY INVARIANT: Events are APPEND-ONLY. No update or delete operations
 * exist. The event log is the immutable truth of the system.
 */

import { db } from "@/lib/db";
import type { HermesEvent } from "../event-dsl/types";
import type { IEventStore } from "./types";

// ═══════════════════════════════════════════════════════════════
// In-Memory Event Store (with DB persistence)
// ═══════════════════════════════════════════════════════════════

/**
 * Append-only event store with in-memory indexing and DB persistence.
 *
 * The in-memory indexes provide O(1) lookups for:
 * - Event by ID
 * - Events by runId
 * - Events by causal depth
 *
 * The DB provides durability across restarts.
 */
export class EventStore implements IEventStore {
  // Primary indexes
  private readonly byId = new Map<string, HermesEvent>();
  private readonly byRunId = new Map<string, HermesEvent[]>();
  private readonly byDepth = new Map<string, Map<number, HermesEvent[]>>(); // runId → depth → events

  // Track which events have been persisted to DB
  private readonly persisted = new Set<string>();

  async append(event: HermesEvent): Promise<void> {
    const eventId = String(event.eventId);
    const runId = String(event.runId);

    // Prevent duplicate events
    if (this.byId.has(eventId)) {
      throw new Error(`Event ${eventId} already exists in the store. Events are append-only.`);
    }

    // Index by ID
    this.byId.set(eventId, event);

    // Index by runId
    if (!this.byRunId.has(runId)) {
      this.byRunId.set(runId, []);
    }
    this.byRunId.get(runId)!.push(event);

    // Index by depth
    if (!this.byDepth.has(runId)) {
      this.byDepth.set(runId, new Map());
    }
    const depthMap = this.byDepth.get(runId)!;
    const depth = event.causalDepth;
    if (!depthMap.has(depth)) {
      depthMap.set(depth, []);
    }
    depthMap.get(depth)!.push(event);

    // Persist to database
    await this.persistEvent(event);
  }

  async get(eventId: string): Promise<HermesEvent | null> {
    return this.byId.get(eventId) ?? null;
  }

  /** Synchronous accessor for kernel internal use */
  getSync(eventId: string): HermesEvent | null {
    return this.byId.get(eventId) ?? null;
  }

  async getByRunId(runId: string): Promise<HermesEvent[]> {
    return this.byRunId.get(runId) ?? [];
  }

  /** Synchronous accessor for kernel internal use */
  getByRunIdSync(runId: string): HermesEvent[] {
    return this.byRunId.get(runId) ?? [];
  }

  async getByDepth(runId: string, depth: number): Promise<HermesEvent[]> {
    return this.byDepth.get(runId)?.get(depth) ?? [];
  }

  async count(runId: string): Promise<number> {
    return this.byRunId.get(runId)?.length ?? 0;
  }

  async getCausalOrder(runId: string): Promise<HermesEvent[]> {
    const events = this.byRunId.get(runId) ?? [];
    // Topological sort by causal depth, then by timestamp for determinism
    return [...events].sort((a, b) => {
      if (a.causalDepth !== b.causalDepth) return a.causalDepth - b.causalDepth;
      return a.timestamp - b.timestamp;
    });
  }

  async has(eventId: string): Promise<boolean> {
    return this.byId.has(eventId);
  }

  async getEventIds(runId: string): Promise<Set<string>> {
    const events = this.byRunId.get(runId) ?? [];
    return new Set(events.map((e) => String(e.eventId)));
  }

  // ═══════════════════════════════════════════════════════════════
  // DB Persistence
  // ═══════════════════════════════════════════════════════════════

  private async persistEvent(event: HermesEvent): Promise<void> {
    const eventId = String(event.eventId);
    if (this.persisted.has(eventId)) return;

    try {
      await db.hermesEvent.upsert({
        where: { id: eventId },
        create: {
          id: eventId,
          runId: String(event.runId),
          eventType: String(event.eventType),
          parentEventIds: JSON.stringify(event.parentEventIds.map(String)),
          causalDepth: event.causalDepth,
          topologicalRank: event.topologicalRank,
          payload: JSON.stringify(event.payload),
          contentHash: String(event.contentHash),
          agentId: event.agentId ? String(event.agentId) : null,
          branch: event.branch ?? null,
          timestamp: new Date(event.timestamp),
        },
        update: {}, // Never update — append only
      });

      this.persisted.add(eventId);
    } catch (error) {
      // DB persistence failure is non-fatal — the in-memory store
      // is the primary truth. DB is for durability.
      console.error(`Failed to persist event ${eventId}:`, error);
    }
  }

  /**
   * Load events from the database into the in-memory store.
   * Used on startup to restore state.
   */
  async loadFromDb(runId: string): Promise<number> {
    try {
      const dbEvents = await db.hermesEvent.findMany({
        where: { runId },
        orderBy: { causalDepth: "asc" },
      });

      for (const dbEvent of dbEvents) {
        if (this.byId.has(dbEvent.id)) continue;

        const event: HermesEvent = {
          eventId: dbEvent.id as unknown as HermesEvent["eventId"],
          eventType: dbEvent.eventType as HermesEvent["eventType"],
          parentEventIds: JSON.parse(dbEvent.parentEventIds) as HermesEvent["parentEventIds"],
          causalDepth: dbEvent.causalDepth,
          topologicalRank: dbEvent.topologicalRank,
          payload: JSON.parse(dbEvent.payload) as Record<string, unknown>,
          contentHash: dbEvent.contentHash as unknown as HermesEvent["contentHash"],
          runId: dbEvent.runId as unknown as HermesEvent["runId"],
          agentId: dbEvent.agentId ? (dbEvent.agentId as unknown as HermesEvent["agentId"]) : undefined,
          branch: dbEvent.branch ?? undefined,
          timestamp: dbEvent.timestamp.getTime(),
        };

        // Add to in-memory store (without re-persisting to DB)
        this.byId.set(dbEvent.id, event);

        if (!this.byRunId.has(runId)) {
          this.byRunId.set(runId, []);
        }
        this.byRunId.get(runId)!.push(event);

        if (!this.byDepth.has(runId)) {
          this.byDepth.set(runId, new Map());
        }
        const depthMap = this.byDepth.get(runId)!;
        if (!depthMap.has(event.causalDepth)) {
          depthMap.set(event.causalDepth, []);
        }
        depthMap.get(event.causalDepth)!.push(event);

        this.persisted.add(dbEvent.id);
      }

      return dbEvents.length;
    } catch (error) {
      console.error(`Failed to load events for run ${runId}:`, error);
      return 0;
    }
  }

  /**
   * Clear the in-memory store for a specific run.
   * Used for cleanup after run completion.
   */
  clearRun(runId: string): void {
    const events = this.byRunId.get(runId) ?? [];
    for (const event of events) {
      this.byId.delete(String(event.eventId));
      this.persisted.delete(String(event.eventId));
    }
    this.byRunId.delete(runId);
    this.byDepth.delete(runId);
  }
}

// ═══════════════════════════════════════════════════════════════
// Singleton Event Store
// ═══════════════════════════════════════════════════════════════

let storeInstance: EventStore | null = null;

export function getEventStore(): EventStore {
  if (!storeInstance) {
    storeInstance = new EventStore();
  }
  return storeInstance;
}
