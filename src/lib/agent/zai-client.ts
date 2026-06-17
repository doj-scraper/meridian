/**
 * AI Client with Multi-Provider Router
 * 
 * Integrates the multi-provider LLM router for intelligent provider selection,
 * automatic failover, and cost optimization.
 * 
 * Uses zero-dependency native fetch to communicate with OpenRouter and direct provider APIs.
 */

import { routeAndExecute, toggleProvider, type TaskContext, type ProviderResponse } from './llm-router';

interface MockChatCompletion {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface MockAIClient {
  chat: {
    completions: {
      create: (params: any) => Promise<MockChatCompletion>;
    };
  };
  functions: {
    invoke: (functionName: string, params: any) => Promise<any>;
  };
}

let aiInstance: MockAIClient | null = null;

/**
 * Execute LLM call via router
 */
async function executeProviderCall(
  providerId: string,
  prompt: string,
  messages?: any[]
): Promise<ProviderResponse> {
  const finalMessages = messages && messages.length > 0
    ? messages
    : [{ role: 'user', content: prompt }];

  let apiKey = '';
  let url = '';
  let model = '';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  let requestBody: any = {};

  if (providerId === 'openai') {
    if (process.env.OPENAI_API_KEY) {
      apiKey = process.env.OPENAI_API_KEY;
      url = 'https://api.openai.com/v1/chat/completions';
      model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
      headers['Authorization'] = `Bearer ${apiKey}`;
    } else if (process.env.OPENROUTER_API_KEY) {
      apiKey = process.env.OPENROUTER_API_KEY;
      url = 'https://openrouter.ai/api/v1/chat/completions';
      model = process.env.OPENROUTER_OPENAI_MODEL || 'openai/gpt-4o-mini';
      headers['Authorization'] = `Bearer ${apiKey}`;
      headers['HTTP-Referer'] = process.env.SITE_URL || 'http://localhost:3000';
      headers['X-Title'] = 'Meridian Runtime';
    }
  } else if (providerId === 'anthropic') {
    if (process.env.ANTHROPIC_API_KEY) {
      apiKey = process.env.ANTHROPIC_API_KEY;
      url = 'https://api.anthropic.com/v1/messages';
      model = process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-latest';
      headers['x-api-key'] = apiKey;
      headers['anthropic-version'] = '2023-06-01';
    } else if (process.env.OPENROUTER_API_KEY) {
      apiKey = process.env.OPENROUTER_API_KEY;
      url = 'https://openrouter.ai/api/v1/chat/completions';
      model = process.env.OPENROUTER_ANTHROPIC_MODEL || 'anthropic/claude-3-haiku';
      headers['Authorization'] = `Bearer ${apiKey}`;
      headers['HTTP-Referer'] = process.env.SITE_URL || 'http://localhost:3000';
      headers['X-Title'] = 'Meridian Runtime';
    }
  } else if (providerId === 'google') {
    const gKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_AI_API_KEY;
    if (gKey) {
      apiKey = gKey;
      url = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
      model = process.env.GOOGLE_MODEL || 'gemini-2.0-flash';
      headers['Authorization'] = `Bearer ${apiKey}`;
    } else if (process.env.OPENROUTER_API_KEY) {
      apiKey = process.env.OPENROUTER_API_KEY;
      url = 'https://openrouter.ai/api/v1/chat/completions';
      model = process.env.OPENROUTER_GOOGLE_MODEL || 'google/gemini-2.5-flash';
      headers['Authorization'] = `Bearer ${apiKey}`;
      headers['HTTP-Referer'] = process.env.SITE_URL || 'http://localhost:3000';
      headers['X-Title'] = 'Meridian Runtime';
    }
  } else if (providerId === 'openrouter') {
    if (process.env.OPENROUTER_API_KEY) {
      apiKey = process.env.OPENROUTER_API_KEY;
      url = 'https://openrouter.ai/api/v1/chat/completions';
      model = process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash';
      headers['Authorization'] = `Bearer ${apiKey}`;
      headers['HTTP-Referer'] = process.env.SITE_URL || 'http://localhost:3000';
      headers['X-Title'] = 'Meridian Runtime';
    }
  }

  if (!apiKey || !url) {
    console.warn(`[ZAI Client] Provider ${providerId} config missing API key. Falling back to mock response.`);
    return {
      output: JSON.stringify({
        tool: "finish",
        input: { output: `Provider ${providerId} config missing API key. Configure it in .env` },
        reasoning: "Missing credentials"
      }),
      provider: providerId,
      cost: 0,
      latency: 0,
      success: false,
      usage: { prompt_tokens: 0, completion_tokens: 0 }
    };
  }

  const startTime = Date.now();

  try {
    let responseData: any = null;

    if (providerId === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
      const systemMsg = finalMessages.find(m => m.role === 'system')?.content || '';
      const userMsgs = finalMessages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content
        }));

      requestBody = {
        model,
        max_tokens: 4096,
        messages: userMsgs,
      };
      if (systemMsg) {
        requestBody.system = systemMsg;
      }
    } else {
      requestBody = {
        model,
        messages: finalMessages.map(m => ({
          role: m.role,
          content: m.content
        }))
      };
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errText}`);
    }

    responseData = await res.json();

    let output = '';
    let prompt_tokens = 0;
    let completion_tokens = 0;

    if (providerId === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
      output = responseData.content?.[0]?.text || '';
      prompt_tokens = responseData.usage?.input_tokens || 0;
      completion_tokens = responseData.usage?.output_tokens || 0;
    } else {
      output = responseData.choices?.[0]?.message?.content || '';
      prompt_tokens = responseData.usage?.prompt_tokens || 0;
      completion_tokens = responseData.usage?.completion_tokens || 0;
    }

    const latency = Date.now() - startTime;
    const inputCostRate = providerId === 'openrouter' ? 0.07 : 0.5;
    const outputCostRate = providerId === 'openrouter' ? 0.07 : 1.5; 
    const cost = ((prompt_tokens * inputCostRate) + (completion_tokens * outputCostRate)) / 1_000_000;

    return {
      output,
      provider: providerId,
      cost,
      latency,
      success: true,
      usage: { prompt_tokens, completion_tokens }
    };

  } catch (error) {
    console.error(`[ZAI Client] Error calling provider ${providerId}:`, error);
    return {
      output: JSON.stringify({
        tool: "finish",
        input: { output: `Error calling provider ${providerId}: ${error instanceof Error ? error.message : String(error)}` },
        reasoning: "API call failed"
      }),
      provider: providerId,
      cost: 0,
      latency: Date.now() - startTime,
      success: false,
      usage: { prompt_tokens: 0, completion_tokens: 0 }
    };
  }
}

export async function getZAI(): Promise<MockAIClient> {
  if (aiInstance) return aiInstance;

  // Initialize router - dynamically enable configured providers
  if (process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY) {
    toggleProvider('openai', true);
  }
  if (process.env.ANTHROPIC_API_KEY || process.env.OPENROUTER_API_KEY) {
    toggleProvider('anthropic', true);
  }
  if (process.env.GOOGLE_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.OPENROUTER_API_KEY) {
    toggleProvider('google', true);
  }
  if (process.env.OPENROUTER_API_KEY) {
    toggleProvider('openrouter', true);
  }

  aiInstance = {
    chat: {
      completions: {
        create: async (params: any): Promise<MockChatCompletion> => {
          const taskContext: TaskContext = {
            type: params.temperature > 0.8 ? 'creative' : 'reasoning',
            complexity: params.messages.length > 3 ? 0.7 : 0.3
          };
          
          const prompt = params.messages
            .map((m: any) => `${m.role}: ${m.content}`)
            .join('\n');
          
          try {
            const result = await routeAndExecute(prompt, taskContext, executeProviderCall, params.messages);
            
            return {
              choices: [{
                message: {
                  content: result.output
                }
              }]
            };
          } catch (error) {
            console.error('[ZAI Client] Router execution failed:', error);
            return {
              choices: [{
                message: {
                  content: JSON.stringify({
                    tool: "finish",
                    input: { output: "Router failed - please configure at least one LLM provider" },
                    reasoning: "No providers available"
                  })
                }
              }]
            };
          }
        }
      }
    },
    functions: {
      invoke: async (functionName: string, params: any): Promise<any> => {
        if (functionName === 'web_search') {
          return [
            {
              name: "Meridian Runtime Documentation",
              url: "https://github.com/doj-scraper/meridian",
              snippet: "Meridian is a lightweight autonomous agent runtime built with Next.js and SQLite. It features an RL-based multi-provider LLM router and a robust tool execution sandbox."
            },
            {
              name: "OpenRouter API Reference",
              url: "https://openrouter.ai/docs",
              snippet: "OpenRouter is a unified interface for LLMs. It supports OpenAI-compatible payloads and provides access to Gemini, Claude, Llama, and other top-tier models with fallback support."
            }
          ];
        }

        if (functionName === 'page_reader') {
          return {
            data: {
              title: "Read Page Sim",
              html: `This is simulated reader content for the URL: ${params.url}. In a production environment with z-ai-web-dev-sdk, this retrieves full page text and structured DOM components.`
            }
          };
        }
        
        return { error: "Mock function - not implemented" };
      }
    }
  };

  return aiInstance;
}

// Export router functions for management
export { toggleProvider, getProviderStatus, resetCircuitBreaker, getQTableSnapshot } from './llm-router';
