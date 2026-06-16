import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getOrchestrator } from '../orchestrator';
import type { TeamConfig } from '../orchestrator';
import type { AgentConfig } from '../types';
import { plan } from '../planner';
import { execute } from '../tools';
import { evaluate } from '../evaluator';
import { getZAI } from '../zai-client';

vi.mock('../planner', () => ({
  plan: vi.fn(),
}));

vi.mock('../tools', () => ({
  execute: vi.fn(),
}));

vi.mock('../evaluator', () => ({
  evaluate: vi.fn(),
}));

vi.mock('../zai-client', () => ({
  getZAI: vi.fn(),
}));

describe('Agent Orchestrator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const agent1: AgentConfig = {
    id: "agent-1",
    name: "Agent One",
    goal: "First step",
    tools: ["search", "finish"],
    memory: { shortTerm: true, longTerm: false },
    loop: { maxSteps: 1, autoRun: true },
    outputs: { format: "text" },
    role: "general",
    orchestrationMode: "single",
  };

  const agent2: AgentConfig = {
    id: "agent-2",
    name: "Agent Two",
    goal: "Second step",
    tools: ["write", "finish"],
    memory: { shortTerm: true, longTerm: false },
    loop: { maxSteps: 1, autoRun: true },
    outputs: { format: "text" },
    role: "general",
    orchestrationMode: "single",
  };

  it('should run single-agent mode successfully', async () => {
    const orchestrator = getOrchestrator();

    const team: TeamConfig = {
      id: "team-single",
      name: "Single Agent Team",
      mode: "single",
      agents: [agent1],
      termination: { type: "max_steps", value: 5 },
    };

    vi.mocked(plan).mockResolvedValueOnce({ tool: "finish", input: "final output" });
    vi.mocked(execute).mockResolvedValueOnce("finished");
    vi.mocked(evaluate).mockResolvedValue(true);

    const result = await orchestrator.run(team, "input query", "run-single-test");

    expect(result.output).toBe("final output");
    expect(result.mode).toBe("single");
    expect(result.agentResults[agent1.name]).toBe("final output");
  });

  it('should run sequential mode with handoffs successfully', async () => {
    const orchestrator = getOrchestrator();

    const team: TeamConfig = {
      id: "team-sequential",
      name: "Sequential Team",
      mode: "sequential",
      agents: [agent1, agent2],
      termination: { type: "max_steps", value: 5 },
    };

    vi.mocked(plan)
      .mockResolvedValueOnce({ tool: "finish", input: "output from agent one" })
      .mockResolvedValueOnce({ tool: "finish", input: "output from agent two" });

    vi.mocked(execute)
      .mockResolvedValueOnce("finished agent one")
      .mockResolvedValueOnce("finished agent two");

    vi.mocked(evaluate).mockResolvedValue(true);

    const result = await orchestrator.run(team, "start query", "run-sequential-test");

    expect(result.output).toBe("output from agent two");
    expect(result.mode).toBe("sequential");
    expect(result.agentResults[agent1.name]).toBe("output from agent one");
    expect(result.agentResults[agent2.name]).toBe("output from agent two");
  });

  it('should run parallel mode successfully', async () => {
    const orchestrator = getOrchestrator();

    const team: TeamConfig = {
      id: "team-parallel",
      name: "Parallel Team",
      mode: "parallel",
      agents: [agent1, agent2],
      termination: { type: "max_steps", value: 5 },
    };

    vi.mocked(plan)
      .mockResolvedValueOnce({ tool: "finish", input: "parallel output 1" })
      .mockResolvedValueOnce({ tool: "finish", input: "parallel output 2" });

    vi.mocked(execute)
      .mockResolvedValueOnce("finished 1")
      .mockResolvedValueOnce("finished 2");

    vi.mocked(evaluate).mockResolvedValue(true);

    const result = await orchestrator.run(team, "parallel query", "run-parallel-test");

    expect(result.mode).toBe("parallel");
    expect(result.agentResults[agent1.name]).toBe("parallel output 1");
    expect(result.agentResults[agent2.name]).toBe("parallel output 2");
    expect(result.output).toContain("## Agent One\nparallel output 1");
    expect(result.output).toContain("## Agent Two\nparallel output 2");
  });

  it('should run group chat mode successfully', async () => {
    const orchestrator = getOrchestrator();

    const team: TeamConfig = {
      id: "team-group",
      name: "Group Team",
      mode: "group",
      agents: [agent1, agent2],
      termination: { type: "max_messages", value: 2 },
    };

    vi.mocked(plan)
      .mockResolvedValueOnce({ tool: "finish", input: "hello from agent 1" })
      .mockResolvedValueOnce({ tool: "finish", input: "hello from agent 2" });

    vi.mocked(execute)
      .mockResolvedValueOnce("spoken 1")
      .mockResolvedValueOnce("spoken 2");

    const result = await orchestrator.run(team, "group chat input", "run-group-test");

    expect(result.mode).toBe("group");
    expect(result.agentResults[agent1.name]).toBe("spoken 1");
    expect(result.agentResults[agent2.name]).toBe("spoken 2");
    expect(result.output).toBe("spoken 2");
  });
});
