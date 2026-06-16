import { NextRequest, NextResponse } from 'next/server';
import { policyEngine } from '@/lib/agent/policy';
import type { PolicyAction, PolicyCondition } from '@/lib/agent/policy';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, condition, action, priority, enabled } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      );
    }

    if (!action || !['allow', 'block', 'ask_user', 'shadow'].includes(action)) {
      return NextResponse.json(
        { error: 'action must be one of: allow, block, ask_user, shadow' },
        { status: 400 }
      );
    }

    if (!condition || typeof condition !== 'object') {
      return NextResponse.json(
        { error: 'condition is required and must be an object' },
        { status: 400 }
      );
    }

    const policy = await policyEngine.createPolicy({
      name,
      description,
      condition: condition as PolicyCondition,
      action: action as PolicyAction,
      priority,
      enabled,
    });

    return NextResponse.json({ policy }, { status: 201 });
  } catch (error) {
    console.error('Failed to create policy:', error);
    const message = error instanceof Error ? error.message : 'Failed to create policy';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
