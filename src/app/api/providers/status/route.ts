import { NextResponse } from 'next/server';

/**
 * GET /api/providers/status
 * 
 * Returns LLM provider connection status based on environment variables.
 */
export async function GET() {
  const providers = [
    {
      id: 'openai',
      name: 'OpenAI',
      status: process.env.OPENAI_API_KEY ? 'connected' : 'disconnected',
      activeModel: 'gpt-4o',
    },
    {
      id: 'anthropic',
      name: 'Anthropic',
      status: process.env.ANTHROPIC_API_KEY ? 'connected' : 'disconnected',
      activeModel: 'claude-3.5-sonnet',
    },
    {
      id: 'google',
      name: 'Google AI',
      status: process.env.GOOGLE_API_KEY ? 'connected' : 'disconnected',
      activeModel: 'gemini-2.0-flash',
    },
  ];

  return NextResponse.json({ providers });
}
