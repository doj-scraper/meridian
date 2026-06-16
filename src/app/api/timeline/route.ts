import { NextRequest, NextResponse } from 'next/server';
import { metricsCollector } from '@/lib/agent/metrics';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const runId = searchParams.get('runId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    if (runId) {
      // Specific run timeline
      const events = await metricsCollector.getRunTimeline(runId);
      return NextResponse.json({ events });
    } else {
      // Recent timeline events across all runs
      const events = await db.timelineEvent.findMany({
        orderBy: { timestamp: 'desc' },
        take: limit,
      });
      return NextResponse.json({ events });
    }
  } catch (error) {
    console.error('Failed to get timeline:', error);
    return NextResponse.json(
      { error: 'Failed to get timeline' },
      { status: 500 }
    );
  }
}
