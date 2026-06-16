import { NextResponse } from 'next/server';
import { policyEngine } from '@/lib/agent/policy';

export async function GET() {
  try {
    const policies = await policyEngine.listPolicies();
    return NextResponse.json({ policies });
  } catch (error) {
    console.error('Failed to list policies:', error);
    return NextResponse.json(
      { error: 'Failed to list policies' },
      { status: 500 }
    );
  }
}
