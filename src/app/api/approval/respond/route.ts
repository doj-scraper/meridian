import { NextRequest, NextResponse } from 'next/server';
import { policyEngine } from '@/lib/agent/policy';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, approved, respondedBy, reason } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    if (typeof approved !== 'boolean') {
      return NextResponse.json(
        { error: 'approved (boolean) is required' },
        { status: 400 }
      );
    }

    if (!respondedBy || typeof respondedBy !== 'string') {
      return NextResponse.json(
        { error: 'respondedBy is required' },
        { status: 400 }
      );
    }

    const approval = await policyEngine.respondApproval(
      id,
      approved,
      respondedBy,
      reason
    );

    return NextResponse.json({ approval });
  } catch (error) {
    console.error('Failed to respond to approval:', error);
    const message = error instanceof Error ? error.message : 'Failed to respond to approval';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
