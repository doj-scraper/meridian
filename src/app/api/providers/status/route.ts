import { NextResponse } from 'next/server';

/**
 * GET /api/providers/status
 * 
 * Returns LLM provider connection status based on environment variables.
 */
export async function GET() {
  const hasOpenRouter = !!process.env.OPENROUTER_API_KEY;

  const providers = [
    {
      id: 'openai',
      name: 'OpenAI',
      status: (process.env.OPENAI_API_KEY || hasOpenRouter) ? 'connected' : 'disconnected',
      activeModel: process.env.OPENAI_MODEL || (hasOpenRouter ? 'gpt-4o-mini (or)' : 'gpt-4o'),
    },
    {
      id: 'anthropic',
      name: 'Anthropic',
      status: (process.env.ANTHROPIC_API_KEY || hasOpenRouter) ? 'connected' : 'disconnected',
      activeModel: process.env.ANTHROPIC_MODEL || (hasOpenRouter ? 'claude-3-haiku (or)' : 'claude-3.5-sonnet'),
    },
    {
      id: 'google',
      name: 'Google AI',
      status: (process.env.GOOGLE_API_KEY || process.env.GOOGLE_AI_API_KEY || hasOpenRouter) ? 'connected' : 'disconnected',
      activeModel: process.env.GOOGLE_MODEL || (hasOpenRouter ? 'gemini-2.5-flash (or)' : 'gemini-2.0-flash'),
    },
    {
      id: 'openrouter',
      name: 'OpenRouter',
      status: hasOpenRouter ? 'connected' : 'disconnected',
      activeModel: process.env.OPENROUTER_MODEL || 'gemini-2.5-flash',
    },
  ];

  return NextResponse.json({ providers });
}
