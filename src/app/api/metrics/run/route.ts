import { NextRequest, NextResponse } from 'next/server';
import { metricsCollector } from '@/lib/agent/metrics';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const runId = searchParams.get('runId');

    if (!runId) {
      return NextResponse.json(
        { error: 'runId query parameter is required' },
        { status: 400 }
      );
    }

    const metrics = await metricsCollector.getRunMetrics(runId);
    return NextResponse.json({ metrics });
  } catch (error) {
    console.error('Failed to get run metrics:', error);
    return NextResponse.json(
      { error: 'Failed to get run metrics' },
      { status: 500 }
    );
  }
}
