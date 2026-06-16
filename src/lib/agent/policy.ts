import { db } from '@/lib/db';
import type { RiskLevel, PolicyAction } from './types';

export type { RiskLevel, PolicyAction };

export interface PolicyCondition {
  tools?: string[];
  roles?: string[];
  riskLevels?: RiskLevel[];
  agents?: string[];
}

export interface PolicyCheckResult {
  allowed: boolean;
  action: PolicyAction;
  matchedPolicies: {
    id: string;
    name: string;
    action: PolicyAction;
  }[];
  requiresApproval: boolean;
}

interface CreatePolicyInput {
  name: string;
  description?: string;
  condition: PolicyCondition;
  action: PolicyAction;
  priority?: number;
  enabled?: boolean;
}

const VALID_ACTIONS: PolicyAction[] = ['allow', 'block', 'ask_user', 'shadow'];
const VALID_RISK_LEVELS: RiskLevel[] = ['low', 'medium', 'high', 'critical'];

export class PolicyEngine {
  /**
   * Check if a tool call is allowed based on active policies.
   * Policies are evaluated in priority order (highest first).
   * Default: allow if no policy matches.
   */
  async check(
    tool: string,
    role: string,
    riskLevel: RiskLevel,
    agentId: string
  ): Promise<PolicyCheckResult> {
    const policies = await db.policyRule.findMany({
      where: { enabled: true },
      orderBy: { priority: 'desc' },
    });

    const matchedPolicies: PolicyCheckResult['matchedPolicies'] = [];
    let finalAction: PolicyAction = 'allow';

    for (const policy of policies) {
      let condition: PolicyCondition;
      try {
        condition = JSON.parse(policy.condition) as PolicyCondition;
      } catch {
        continue;
      }

      if (this.matchesCondition(condition, tool, role, riskLevel, agentId)) {
        matchedPolicies.push({
          id: policy.id,
          name: policy.name,
          action: policy.action as PolicyAction,
        });

        // First matching policy determines the action (priority order)
        if (matchedPolicies.length === 1) {
          finalAction = policy.action as PolicyAction;
        }
      }
    }

    const allowed = finalAction === 'allow' || finalAction === 'shadow';
    const requiresApproval = finalAction === 'ask_user';

    // Log policy check to audit log
    await db.auditLog.create({
      data: {
        agentId,
        action: 'policy_check',
        details: JSON.stringify({
          tool,
          role,
          riskLevel,
          matchedPolicies: matchedPolicies.map((p) => p.name),
          finalAction,
        }),
        outcome: requiresApproval ? 'pending' : allowed ? 'allowed' : 'blocked',
        riskLevel,
      },
    });

    return {
      allowed,
      action: finalAction,
      matchedPolicies,
      requiresApproval,
    };
  }

  /**
   * Evaluate whether a condition matches the given context.
   */
  private matchesCondition(
    condition: PolicyCondition,
    tool: string,
    role: string,
    riskLevel: RiskLevel,
    agentId: string
  ): boolean {
    // If tools specified, tool must be in the list
    if (condition.tools && condition.tools.length > 0) {
      if (!condition.tools.includes(tool)) return false;
    }

    // If roles specified, role must be in the list
    if (condition.roles && condition.roles.length > 0) {
      if (!condition.roles.includes(role)) return false;
    }

    // If riskLevels specified, riskLevel must be in the list
    if (condition.riskLevels && condition.riskLevels.length > 0) {
      if (!condition.riskLevels.includes(riskLevel)) return false;
    }

    // If agents specified, agentId must be in the list (or "*" matches all)
    if (condition.agents && condition.agents.length > 0) {
      if (!condition.agents.includes(agentId) && !condition.agents.includes('*'))
        return false;
    }

    return true;
  }

  /**
   * Create a new policy rule.
   */
  async createPolicy(input: CreatePolicyInput) {
    const { name, description, condition, action, priority, enabled } = input;

    if (!VALID_ACTIONS.includes(action)) {
      throw new Error(`Invalid action: ${action}. Must be one of: ${VALID_ACTIONS.join(', ')}`);
    }

    return db.policyRule.create({
      data: {
        name,
        description: description ?? null,
        condition: JSON.stringify(condition),
        action,
        priority: priority ?? 0,
        enabled: enabled ?? true,
      },
    });
  }

  /**
   * List all policy rules, ordered by priority descending.
   */
  async listPolicies() {
    return db.policyRule.findMany({
      orderBy: { priority: 'desc' },
    });
  }

  /**
   * Update a policy rule.
   */
  async updatePolicy(id: string, updates: Partial<CreatePolicyInput & { enabled?: boolean }>) {
    const data: Record<string, unknown> = {};

    if (updates.name !== undefined) data.name = updates.name;
    if (updates.description !== undefined) data.description = updates.description;
    if (updates.condition !== undefined) data.condition = JSON.stringify(updates.condition);
    if (updates.action !== undefined) {
      if (!VALID_ACTIONS.includes(updates.action)) {
        throw new Error(`Invalid action: ${updates.action}`);
      }
      data.action = updates.action;
    }
    if (updates.priority !== undefined) data.priority = updates.priority;
    if (updates.enabled !== undefined) data.enabled = updates.enabled;

    return db.policyRule.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a policy rule.
   */
  async deletePolicy(id: string): Promise<void> {
    await db.policyRule.delete({ where: { id } });
  }

  /**
   * Create an approval request for a tool call that requires human approval.
   */
  async requestApproval(
    agentId: string,
    tool: string,
    input: string,
    riskLevel: RiskLevel,
    runId?: string
  ) {
    if (!VALID_RISK_LEVELS.includes(riskLevel)) {
      throw new Error(`Invalid risk level: ${riskLevel}`);
    }

    const request = await db.approvalRequest.create({
      data: {
        agentId,
        runId: runId ?? null,
        tool,
        input,
        riskLevel,
        status: 'pending',
      },
    });

    // Log the approval request
    await db.auditLog.create({
      data: {
        agentId,
        runId: runId ?? null,
        action: 'approval',
        details: JSON.stringify({
          approvalId: request.id,
          tool,
          riskLevel,
        }),
        outcome: 'pending',
        riskLevel,
      },
    });

    return request;
  }

  /**
   * Respond to an approval request (approve or deny).
   */
  async respondApproval(
    id: string,
    approved: boolean,
    respondedBy: string,
    reason?: string
  ) {
    const existing = await db.approvalRequest.findUnique({ where: { id } });
    if (!existing) {
      throw new Error(`Approval request ${id} not found`);
    }
    if (existing.status !== 'pending') {
      throw new Error(`Approval request ${id} is already ${existing.status}`);
    }

    const status = approved ? 'approved' : 'denied';
    const request = await db.approvalRequest.update({
      where: { id },
      data: {
        status,
        respondedAt: new Date(),
        respondedBy,
        reason: reason ?? null,
      },
    });

    // Log the approval response
    await db.auditLog.create({
      data: {
        agentId: existing.agentId,
        runId: existing.runId ?? null,
        action: 'approval',
        details: JSON.stringify({
          approvalId: id,
          approved,
          respondedBy,
          reason: reason ?? null,
        }),
        outcome: approved ? 'approved' : 'denied',
        riskLevel: existing.riskLevel as RiskLevel | undefined,
      },
    });

    return request;
  }

  /**
   * List all pending approval requests.
   */
  async listPendingApprovals() {
    return db.approvalRequest.findMany({
      where: { status: 'pending' },
      orderBy: { requestedAt: 'desc' },
    });
  }

  /**
   * Seed default policies if none exist.
   */
  async seedDefaults(): Promise<void> {
    const count = await db.policyRule.count();
    if (count > 0) return;

    for (const policy of DEFAULT_POLICIES) {
      await this.createPolicy(policy);
    }
  }
}

// Singleton
export const policyEngine = new PolicyEngine();

/**
 * Determine the risk level for a given tool.
 */
export function getToolRiskLevel(tool: string): RiskLevel {
  const riskMap: Record<string, RiskLevel> = {
    search: 'low',
    write: 'medium',
    code: 'high',
    browser: 'medium',
    finish: 'low',
  };
  return riskMap[tool] || 'medium';
}

/**
 * Default policies that should be seeded on first run.
 */
export const DEFAULT_POLICIES: CreatePolicyInput[] = [
  {
    name: 'Block code execution for reviewers',
    condition: { tools: ['code'], roles: ['reviewer'] },
    action: 'block',
    priority: 100,
    enabled: true,
  },
  {
    name: 'Require approval for high-risk tools',
    condition: { riskLevels: ['high', 'critical'] },
    action: 'ask_user',
    priority: 50,
    enabled: true,
  },
  {
    name: 'Shadow mode for new agents',
    condition: { agents: ['*'] },
    action: 'shadow',
    priority: 10,
    enabled: false,
  },
];
