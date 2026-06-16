import { NextRequest, NextResponse } from 'next/server';
import { metricsCollector } from '@/lib/agent/metrics';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const filters: Record<string, string | number> = {};
    const agentId = searchParams.get('agentId');
    const runId = searchParams.get('runId');
    const action = searchParams.get('action');
    const limitStr = searchParams.get('limit');

    if (agentId) filters.agentId = agentId;
    if (runId) filters.runId = runId;
    if (action) filters.action = action;
    if (limitStr) {
      const limit = parseInt(limitStr, 10);
      if (!isNaN(limit) && limit > 0) filters.limit = limit;
    }

    const entries = await metricsCollector.getAuditLog(
      Object.keys(filters).length > 0 ? filters : undefined
    );

    return NextResponse.json({ entries });
  } catch (error) {
    console.error('Failed to list audit log:', error);
    return NextResponse.json(
      { error: 'Failed to list audit log' },
      { status: 500 }
    );
  }
}
