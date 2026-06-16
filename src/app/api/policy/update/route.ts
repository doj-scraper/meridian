import { NextRequest, NextResponse } from 'next/server';
import { policyEngine } from '@/lib/agent/policy';
import type { PolicyAction, PolicyCondition } from '@/lib/agent/policy';

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    // Validate action if provided
    if (updates.action && !['allow', 'block', 'ask_user', 'shadow'].includes(updates.action)) {
      return NextResponse.json(
        { error: 'action must be one of: allow, block, ask_user, shadow' },
        { status: 400 }
      );
    }

    // Serialize condition if provided
    const preparedUpdates: Record<string, unknown> = { ...updates };
    if (updates.condition) {
      preparedUpdates.condition = updates.condition as PolicyCondition;
    }
    if (updates.action) {
      preparedUpdates.action = updates.action as PolicyAction;
    }

    const policy = await policyEngine.updatePolicy(id, preparedUpdates);
    return NextResponse.json({ policy });
  } catch (error) {
    console.error('Failed to update policy:', error);
    const message = error instanceof Error ? error.message : 'Failed to update policy';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
