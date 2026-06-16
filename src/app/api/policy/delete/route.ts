import { NextRequest, NextResponse } from 'next/server';
import { policyEngine } from '@/lib/agent/policy';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'id query parameter is required' },
        { status: 400 }
      );
    }

    await policyEngine.deletePolicy(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete policy:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete policy';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
