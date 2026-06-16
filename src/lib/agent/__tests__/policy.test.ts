import { describe, it, expect, beforeAll } from 'vitest';
import { policyEngine } from '../policy';
import { db } from '@/lib/db';

describe('Policy Engine', () => {
  beforeAll(async () => {
    // Clean existing test policies to ensure clean state
    await db.policyRule.deleteMany({});
    await db.auditLog.deleteMany({});
    
    // Seed defaults
    await policyEngine.seedDefaults();
  });

  it('should block or require approval for high-risk tools', async () => {
    const result = await policyEngine.check(
      'code',
      'general',
      'high',
      'test-agent'
    );

    expect(result.allowed).toBe(false);
    expect(result.action).toBe('ask_user');
    expect(result.requiresApproval).toBe(true);
    expect(result.matchedPolicies.some(p => p.name.includes('Require approval'))).toBe(true);
  });

  it('should block code execution for reviewers', async () => {
    const result = await policyEngine.check(
      'code',
      'reviewer',
      'high',
      'test-agent'
    );

    expect(result.allowed).toBe(false);
    expect(result.action).toBe('block');
    expect(result.matchedPolicies.some(p => p.name.includes('Block code execution'))).toBe(true);
  });

  it('should allow low-risk tools', async () => {
    const result = await policyEngine.check(
      'search',
      'general',
      'low',
      'test-agent'
    );

    expect(result.allowed).toBe(true);
    expect(result.action).toBe('allow');
    expect(result.requiresApproval).toBe(false);
  });

  it('should handle shadow mode policy action correctly', async () => {
    // Create a shadow policy for search
    await policyEngine.createPolicy({
      name: 'Shadow mode for searches',
      condition: { tools: ['search'] },
      action: 'shadow',
      priority: 150,
      enabled: true,
    });

    const result = await policyEngine.check(
      'search',
      'general',
      'low',
      'test-agent-shadow'
    );

    expect(result.allowed).toBe(true);
    expect(result.action).toBe('shadow');
    expect(result.requiresApproval).toBe(false);
    expect(result.matchedPolicies.some(p => p.name === 'Shadow mode for searches')).toBe(true);
  });

  it('should default to allow when no policy matches', async () => {
    // Check an action that matches no policies
    const result = await policyEngine.check(
      'custom-tool-no-match',
      'custom-role',
      'low',
      'custom-agent'
    );

    expect(result.allowed).toBe(true);
    expect(result.action).toBe('allow');
    expect(result.matchedPolicies).toHaveLength(0);
  });
});
