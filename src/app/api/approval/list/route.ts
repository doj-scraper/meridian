import { NextResponse } from 'next/server';
import { policyEngine } from '@/lib/agent/policy';

export async function GET() {
  try {
    const approvals = await policyEngine.listPendingApprovals();
    return NextResponse.json({ approvals });
  } catch (error) {
    console.error('Failed to list pending approvals:', error);
    return NextResponse.json(
      { error: 'Failed to list pending approvals' },
      { status: 500 }
    );
  }
}
