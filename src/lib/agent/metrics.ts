import { db } from '@/lib/db';

export interface RunMetrics {
  runId: string;
  totalTokens: number;
  totalLatencyMs: number;
  stepCount: number;
  toolUsage: Record<string, number>;
  errorCount: number;
  reflectionIterations: number;
  policyChecks: number;
  approvalRequests: number;
}

export interface SystemMetrics {
  totalRuns: number;
  completedRuns: number;
  failedRuns: number;
  activeRuns: number;
  totalAgents: number;
  totalTokensUsed: number;
  avgLatencyMs: number;
  avgStepsPerRun: number;
  toolUsageDistribution: Record<string, number>;
  errorRate: number;
}

export class MetricsCollector {
  /**
   * Record a timeline event for a run.
   */
  async recordEvent(
    runId: string,
    type: string,
    metadata?: Record<string, unknown>,
    durationMs?: number,
    tokenCount?: number,
    error?: string
  ): Promise<void> {
    await db.timelineEvent.create({
      data: {
        runId,
        type,
        durationMs: durationMs ?? null,
        tokenCount: tokenCount ?? null,
        metadata: JSON.stringify(metadata ?? {}),
        error: error ?? null,
      },
    });
  }

  /**
   * Get aggregated metrics for a specific run.
   */
  async getRunMetrics(runId: string): Promise<RunMetrics> {
    // Get all timeline events for this run
    const events = await db.timelineEvent.findMany({
      where: { runId },
    });

    // Get steps for this run
    const steps = await db.step.findMany({
      where: { runId },
    });

    // Get reflection iterations
    const reflections = await db.reflectionIteration.findMany({
      where: { runId },
    });

    // Calculate totals from timeline events
    let totalTokens = 0;
    let totalLatencyMs = 0;
    let errorCount = 0;
    let policyChecks = 0;
    let approvalRequests = 0;
    const toolUsage: Record<string, number> = {};

    for (const event of events) {
      if (event.tokenCount) totalTokens += event.tokenCount;
      if (event.durationMs) totalLatencyMs += event.durationMs;
      if (event.type === 'error') errorCount++;
      if (event.type === 'policy_check') policyChecks++;
      if (event.type === 'approval_request') approvalRequests++;

      // Track tool usage from tool_execution events
      if (event.type === 'tool_execution') {
        try {
          const meta = JSON.parse(event.metadata) as Record<string, unknown>;
          const tool = meta.tool as string | undefined;
          if (tool) {
            toolUsage[tool] = (toolUsage[tool] || 0) + 1;
          }
        } catch {
          // ignore parse errors
        }
      }
    }

    // Also count tool usage from steps
    for (const step of steps) {
      toolUsage[step.tool] = (toolUsage[step.tool] || 0) + 1;
      if (step.tokenCount) totalTokens += step.tokenCount;
      if (step.latencyMs) totalLatencyMs += step.latencyMs;
    }

    return {
      runId,
      totalTokens,
      totalLatencyMs,
      stepCount: steps.length,
      toolUsage,
      errorCount,
      reflectionIterations: reflections.length,
      policyChecks,
      approvalRequests,
    };
  }

  /**
   * Get system-wide aggregated metrics.
   */
  async getSystemMetrics(): Promise<SystemMetrics> {
    // Run counts
    const [totalRuns, completedRuns, failedRuns, activeRuns] = await Promise.all([
      db.agentRun.count(),
      db.agentRun.count({ where: { status: 'completed' } }),
      db.agentRun.count({ where: { status: 'failed' } }),
      db.agentRun.count({ where: { status: 'running' } }),
    ]);

    // Agent count
    const totalAgents = await db.agent.count();

    // Calculate token totals and latency from steps
    const steps = await db.step.findMany({
      select: { tokenCount: true, latencyMs: true, tool: true },
    });

    let totalTokensUsed = 0;
    let totalLatencyMs = 0;
    const toolUsageDistribution: Record<string, number> = {};

    for (const step of steps) {
      if (step.tokenCount) totalTokensUsed += step.tokenCount;
      if (step.latencyMs) totalLatencyMs += step.latencyMs;
      toolUsageDistribution[step.tool] = (toolUsageDistribution[step.tool] || 0) + 1;
    }

    // Also add from timeline events
    const timelineEvents = await db.timelineEvent.findMany({
      select: { tokenCount: true, durationMs: true, type: true, metadata: true },
    });

    for (const event of timelineEvents) {
      if (event.tokenCount) totalTokensUsed += event.tokenCount;
      if (event.durationMs) totalLatencyMs += event.durationMs;
    }

    // Average latency per completed run
    const completedRunCount = completedRuns || 1;
    const avgLatencyMs = completedRuns > 0 ? Math.round(totalLatencyMs / completedRunCount) : 0;

    // Average steps per run
    const avgStepsPerRun = totalRuns > 0 ? Math.round(steps.length / totalRuns * 10) / 10 : 0;

    // Error rate
    const errorRate = totalRuns > 0 ? Math.round((failedRuns / totalRuns) * 1000) / 10 : 0;

    return {
      totalRuns,
      completedRuns,
      failedRuns,
      activeRuns,
      totalAgents,
      totalTokensUsed,
      avgLatencyMs,
      avgStepsPerRun,
      toolUsageDistribution,
      errorRate,
    };
  }

  /**
   * Get recent timeline events for a specific run.
   */
  async getRunTimeline(runId: string) {
    return db.timelineEvent.findMany({
      where: { runId },
      orderBy: { timestamp: 'asc' },
    });
  }

  /**
   * Get audit log entries with optional filters.
   */
  async getAuditLog(filters?: {
    agentId?: string;
    runId?: string;
    action?: string;
    limit?: number;
  }) {
    const where: Record<string, unknown> = {};

    if (filters?.agentId) where.agentId = filters.agentId;
    if (filters?.runId) where.runId = filters.runId;
    if (filters?.action) where.action = filters.action;

    return db.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: filters?.limit ?? 100,
    });
  }
}

export const metricsCollector = new MetricsCollector();
