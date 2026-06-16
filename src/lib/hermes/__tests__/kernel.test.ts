import { describe, it, expect, vi } from 'vitest';
import { createRunId, createAgentId } from '../event-dsl/constructors';
import { getKernel } from '../kernel-spine/kernel';
import { getEventStore } from '../kernel-spine/event-store';
import { reduceEvents, computeStateHash } from '../kernel-spine/reducer';
import type { IAgentProposer, ProposerConfig, ProposerContext } from '../kernel-spine/proposer';
import type { AgentProposal, ToolAction } from '../kernel-spine/types';

vi.mock('@/lib/agent/tools', () => ({
  execute: vi.fn().mockResolvedValue('mock search results'),
}));

class MockProposer implements IAgentProposer {
  readonly config: ProposerConfig;
  private proposalIndex = 0;
  private proposals: Partial<AgentProposal>[];

  constructor(config: ProposerConfig, proposals: Partial<AgentProposal>[]) {
    this.config = config;
    this.proposals = proposals;
  }

  async propose(context: ProposerContext): Promise<AgentProposal> {
    const prop = this.proposals[this.proposalIndex % this.proposals.length];
    this.proposalIndex++;
    return {
      agentId: this.config.agentId,
      actionType: prop.actionType ?? "use_tool",
      action: prop.action ?? ({ type: "use_tool", tool: "search", input: "test" } as ToolAction),
      justification: prop.justification ?? "mock reasoning",
      parentEventIds: Array.from(context.visitedEventIds).map(id => id as any),
      confidence: prop.confidence ?? 1.0,
      priority: prop.priority ?? 0,
    };
  }
}

describe('Hermes Kernel Invariants', () => {
  it('should enforce kernel inversion: action → event → state', async () => {
    const kernel = getKernel();
    const runId = createRunId('test-run-inversion-' + Date.now());
    const config = {
      runId,
      goal: 'Find information about quantum computing',
      maxTransitions: 2,
      maxConcurrency: 1,
      autoAdvance: true,
      transitionDelayMs: 0,
      checkpointInterval: 10,
    };

    const genesisEventId = await kernel.initializeRun(config);
    expect(genesisEventId).toBeDefined();

    const agentId = createAgentId('mock-agent-1');
    const proposer = new MockProposer(
      {
        agentId,
        name: "Mock Agent",
        role: "general",
        tools: ["search"],
        personality: "helpful",
        goal: config.goal,
        maxProposals: 2,
      },
      [
        {
          actionType: "use_tool",
          action: { type: "use_tool", tool: "search", input: "quantum computing basics" },
        },
        {
          actionType: "finish",
          action: { type: "finish", result: "Quantum computing uses qubits." },
        }
      ]
    );

    kernel.registerProposer(runId, proposer);

    const initialTransitionCount = kernel.getState(runId)?.metadata.totalTransitions ?? 0;
    
    // Execute run loop
    await kernel.run(runId);

    const finalState = kernel.getState(runId);
    expect(finalState).toBeDefined();
    
    const runState = finalState?.runs.get(String(runId));
    expect(runState).toBeDefined();
    expect(runState?.status).toBe('completed');
  });

  it('should maintain causal ordering in the event store', async () => {
    const kernel = getKernel();
    const store = getEventStore();
    const runId = createRunId('test-run-causal-' + Date.now());
    const config = {
      runId,
      goal: 'Causal ordering goal',
      maxTransitions: 1,
      maxConcurrency: 1,
      autoAdvance: true,
      transitionDelayMs: 0,
      checkpointInterval: 10,
    };

    await kernel.initializeRun(config);
    const agentId = createAgentId('mock-agent-causal');
    const proposer = new MockProposer(
      {
        agentId,
        name: "Causal Agent",
        role: "general",
        tools: ["search"],
        personality: "logical",
        goal: config.goal,
        maxProposals: 1,
      },
      [
        {
          actionType: "finish",
          action: { type: "finish", result: "done" },
        }
      ]
    );

    kernel.registerProposer(runId, proposer);
    await kernel.run(runId);

    const events = await store.getByRunId(String(runId));
    expect(events.length).toBeGreaterThan(1);

    // Verify each event's parents have a lower causal depth
    for (const event of events) {
      if (event.parentEventIds.length > 0) {
        for (const parentId of event.parentEventIds) {
          const parent = await store.get(String(parentId));
          expect(parent).toBeDefined();
          if (parent) {
            expect(event.causalDepth).toBeGreaterThan(parent.causalDepth);
          }
        }
      }
    }
  });

  it('should derive same state from same event log (determinism)', async () => {
    const kernel = getKernel();
    const store = getEventStore();
    const runId = createRunId('test-run-determinism-' + Date.now());
    const config = {
      runId,
      goal: 'Determinism goal',
      maxTransitions: 1,
      maxConcurrency: 1,
      autoAdvance: true,
      transitionDelayMs: 0,
      checkpointInterval: 10,
    };

    await kernel.initializeRun(config);
    const agentId = createAgentId('mock-agent-determinism');
    const proposer = new MockProposer(
      {
        agentId,
        name: "Determinism Agent",
        role: "general",
        tools: ["search"],
        personality: "strict",
        goal: config.goal,
        maxProposals: 1,
      },
      [
        {
          actionType: "finish",
          action: { type: "finish", result: "finished deterministically" },
        }
      ]
    );

    kernel.registerProposer(runId, proposer);
    await kernel.run(runId);

    const events = await store.getByRunId(String(runId));
    expect(events.length).toBeGreaterThan(1);

    // Derive state twice from the same log
    const state1 = reduceEvents(events);
    const state2 = reduceEvents(events);

    const hash1 = computeStateHash(state1);
    const hash2 = computeStateHash(state2);

    expect(hash1).toBe(hash2);
    expect(state1.metadata.totalEvents).toBe(state2.metadata.totalEvents);
  });
});
