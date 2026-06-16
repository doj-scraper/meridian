import { NextRequest, NextResponse } from 'next/server';
import { metricsCollector } from '@/lib/agent/metrics';
import { db } from '@/lib/db';
import { logger, logRequest } from '@/lib/logger';

import { ratelimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  const start = Date.now();
  const ip = request.headers.get("x-forwarded-for") || "anonymous";
  const limitResult = await ratelimit.api.limit(`timeline-${ip}`);
  if (!limitResult.success) {
    const res = NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
    logRequest(request, Date.now() - start, 429);
    return res;
  }

  try {
    const { searchParams } = new URL(request.url);
    const runId = searchParams.get('runId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    if (runId) {
      // Specific run timeline
      const events = await metricsCollector.getRunTimeline(runId);
      const res = NextResponse.json({ events });
      logRequest(request, Date.now() - start, 200);
      return res;
    } else {
      // Recent timeline events across all runs
      const events = await db.timelineEvent.findMany({
        orderBy: { timestamp: 'desc' },
        take: limit,
      });
      const res = NextResponse.json({ events });
      logRequest(request, Date.now() - start, 200);
      return res;
    }
  } catch (error) {
    logger.error({ error, url: request.url }, 'Failed to get timeline');
    const res = NextResponse.json(
      { error: 'Failed to get timeline' },
      { status: 500 }
    );
    logRequest(request, Date.now() - start, 500);
    return res;
  }
}
