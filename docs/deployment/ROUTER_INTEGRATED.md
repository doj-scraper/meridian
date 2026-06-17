# Multi-Provider LLM Router

## ✅ Integrated

Your multi-provider LLM router (adapted from the deepseek implementation) has been successfully integrated into the Meridian project.

---

## Features

- **ε-Greedy Q-Learning** - Intelligent provider selection based on learned performance
- **Circuit Breaker Pattern** - Automatic failover when providers fail
- **Cost Optimization** - Routes to most cost-effective provider
- **Automatic Learning** - Improves routing decisions over time
- **Telemetry** - Tracks provider performance, latency, and costs

---

## Architecture

```
User Request
    ↓
getZAI() → routeAndExecute()
              ↓
         ┌────┴────┐
         │ Router  │ (ε-Greedy Q-learning)
         └────┬────┘
              ↓
    ┌─────────┼─────────┐
    │         │         │
 OpenAI  Anthropic  Google
    │         │         │
    └─────────┼─────────┘
              ↓
         Response
              ↓
      Q-Value Update
```

---

## Files Added

1. **`src/lib/agent/llm-router.ts`** - Core router implementation
   - Provider selection logic
   - Q-learning algorithm  
   - Circuit breaker
   - Reward calculation

2. **`src/lib/agent/zai-client.ts`** - Updated with router integration
   - Routes all LLM calls through router
   - Automatic task context detection
   - Fallback handling

---

## Configuration

### 1. Install LLM Provider SDKs

```bash
# Choose one or more:
bun add openai                      # OpenAI
bun add @anthropic-ai/sdk          # Anthropic Claude
bun add @google/generative-ai      # Google Gemini
```

### 2. Set Environment Variables

```bash
# .env
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
GOOGLE_AI_API_KEY=your-google-key
```

### 3. Implement Provider Calls

Edit `src/lib/agent/zai-client.ts`, function `executeProviderCall()`:

```typescript
async function executeProviderCall(providerId: string, prompt: string): Promise<ProviderResponse> {
  if (providerId === 'openai') {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }]
    });
    return {
      output: response.choices[0].message.content || '',
      provider: providerId,
      cost: 0, // Calculate using token usage
      latency: 0, // Will be set by caller
      success: true,
      usage: {
        prompt_tokens: response.usage?.prompt_tokens || 0,
        completion_tokens: response.usage?.completion_tokens || 0
      }
    };
  }
  
  // Add other providers...
}
```

### 4. Enable Providers

In `src/lib/agent/zai-client.ts`, `getZAI()` function:

```typescript
// Enable your providers
toggleProvider('openai', true);
toggleProvider('anthropic', true);
toggleProvider('google', true);
```

---

## Usage

The router is **automatically used** for all LLM calls:

```typescript
import { getZAI } from '@/lib/agent/zai-client';

const zai = await getZAI();

// This call is automatically routed
const response = await zai.chat.completions.create({
  model: "gpt-4o", // Model hint (router decides actual provider)
  messages: [
    { role: "user", content: "Explain quantum computing" }
  ],
  temperature: 0.7
});
```

The router:
1. Analyzes task context (type, complexity)
2. Checks circuit breakers
3. Selects best provider via Q-learning
4. Executes call
5. Updates Q-values based on performance
6. Returns response

---

## Router Behavior

### Task Type Detection

```typescript
// Determined automatically from params:
{
  type: 'reasoning',  // temperature <= 0.8
  type: 'creative',   // temperature > 0.8
  complexity: 0.3     // Short conversations
  complexity: 0.7     // Long conversations
}
```

### Provider Selection

1. **90% Exploitation** - Choose provider with highest Q-value
2. **10% Exploration** - Try random provider to discover better options
3. **Circuit Breaker** - Skip providers with 5+ consecutive failures
4. **Fallback** - Use first available if all fail

### Learning

After each request:
- **Success**: Positive reward based on speed + cost
- **Failure**: -10 penalty
- Q-value updated: `Q_new = Q_old + α * (reward - Q_old)`
- α (learning rate) = 0.1

---

## Monitoring

### Check Provider Status

```typescript
import { getProviderStatus } from '@/lib/agent/zai-client';

const status = getProviderStatus();
// [
//   { id: 'openai', enabled: true, qValue: 5.2, circuitOpen: false },
//   { id: 'anthropic', enabled: true, qValue: 4.8, circuitOpen: false },
//   { id: 'google', enabled: true, qValue: 6.1, circuitOpen: false }
// ]
```

### View Q-Table

```typescript
import { getQTableSnapshot } from '@/lib/agent/zai-client';

const qtable = getQTableSnapshot();
// Map {
//   'reasoning|low|openai' => 5.2,
//   'reasoning|med|anthropic' => 4.8,
//   'creative|high|google' => 6.1,
//   ...
// }
```

### Reset Circuit Breaker

```typescript
import { resetCircuitBreaker } from '@/lib/agent/zai-client';

resetCircuitBreaker('openai'); // Manually reset after provider recovery
```

---

## Circuit Breaker

### Thresholds

- **Failure Threshold**: 5 consecutive failures
- **Timeout**: 60 seconds (auto-reset after timeout)
- **States**: `closed` (healthy), `open` (failing), `half-open` (testing)

### Behavior

```
closed ──5 failures──> open ──60s timeout──> half-open ──success──> closed
                         │                       │
                         └───────────────────────┴──failure──> open
```

---

## Cost Tracking

Default cost per million tokens:

| Provider | Input | Output |
|----------|-------|--------|
| OpenAI | $10 | $30 |
| Anthropic | $8 | $24 |
| Google | $5 | $15 |

Update costs in `src/lib/agent/llm-router.ts`, `DEFAULT_PROVIDERS` array.

---

## Production Considerations

### Current Implementation (In-Memory)

- Q-table: `Map<string, number>`
- Circuit breakers: `Map<string, CircuitState>`
- **Limitation**: Resets on server restart

### Recommended Upgrade

Replace in-memory storage with persistent store:

```typescript
// Option 1: Redis
import { redis } from '@/lib/db/redis';

async function getQValue(key: string): Promise<number> {
  const val = await redis.hget('q_table', key);
  return val ? parseFloat(val) : 0;
}

// Option 2: Database
const qValue = await db.qTable.findUnique({ where: { key } });
```

---

## API Endpoints (Optional)

Add these routes to expose router management:

```typescript
// src/app/api/router/status/route.ts
import { getProviderStatus } from '@/lib/agent/zai-client';

export async function GET() {
  return Response.json(getProviderStatus());
}

// src/app/api/router/toggle/route.ts
import { toggleProvider } from '@/lib/agent/zai-client';

export async function POST(req: Request) {
  const { provider, enabled } = await req.json();
  toggleProvider(provider, enabled);
  return Response.json({ success: true });
}

// src/app/api/router/qtable/route.ts
import { getQTableSnapshot } from '@/lib/agent/zai-client';

export async function GET() {
  const qtable = getQTableSnapshot();
  return Response.json(Object.fromEntries(qtable));
}
```

---

## Example: Full Integration

```typescript
// src/lib/agent/zai-client.ts

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { routeAndExecute, toggleProvider, type ProviderResponse } from './llm-router';

async function executeProviderCall(providerId: string, prompt: string): Promise<ProviderResponse> {
  const startTime = Date.now();
  
  try {
    if (providerId === 'openai') {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }]
      });
      return {
        output: response.choices[0].message.content || '',
        provider: providerId,
        cost: calculateCost(providerId, response.usage),
        latency: Date.now() - startTime,
        success: true,
        usage: response.usage
      };
    }
    
    if (providerId === 'anthropic') {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }]
      });
      return {
        output: response.content[0].type === 'text' ? response.content[0].text : '',
        provider: providerId,
        cost: calculateCost(providerId, response.usage),
        latency: Date.now() - startTime,
        success: true,
        usage: response.usage
      };
    }
    
    if (providerId === 'google') {
      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      const result = await model.generateContent(prompt);
      return {
        output: result.response.text(),
        provider: providerId,
        cost: 0, // Calculate from token usage
        latency: Date.now() - startTime,
        success: true,
        usage: { prompt_tokens: 0, completion_tokens: 0 } // Extract from response
      };
    }
    
    throw new Error(`Unknown provider: ${providerId}`);
  } catch (error) {
    return {
      output: '',
      provider: providerId,
      cost: 0,
      latency: Date.now() - startTime,
      success: false,
      usage: { prompt_tokens: 0, completion_tokens: 0 }
    };
  }
}

export async function getZAI() {
  // Enable providers
  toggleProvider('openai', Boolean(process.env.OPENAI_API_KEY));
  toggleProvider('anthropic', Boolean(process.env.ANTHROPIC_API_KEY));
  toggleProvider('google', Boolean(process.env.GOOGLE_AI_API_KEY));
  
  // ... rest of implementation
}
```

---

## Next Steps

1. **Install provider SDKs** you want to use
2. **Set API keys** in environment variables
3. **Implement `executeProviderCall()`** with real API calls
4. **Enable providers** in `getZAI()`
5. **Test routing** - router will automatically learn optimal selection
6. **Monitor Q-values** to see learning progress
7. **Upgrade to persistent storage** for production (Redis/DB)

---

**Status:** ✅ **Multi-provider router integrated and ready for provider implementation**

The router will automatically:
- Route requests to the best-performing provider
- Handle failures with circuit breakers
- Learn optimal routing over time
- Optimize for cost and performance
