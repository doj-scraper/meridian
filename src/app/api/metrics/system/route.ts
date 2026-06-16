import { NextResponse } from 'next/server';
import { metricsCollector } from '@/lib/agent/metrics';

export async function GET() {
  try {
    const metrics = await metricsCollector.getSystemMetrics();
    return NextResponse.json({ metrics });
  } catch (error) {
    console.error('Failed to get system metrics:', error);
    return NextResponse.json(
      { error: 'Failed to get system metrics' },
      { status: 500 }
    );
  }
}
