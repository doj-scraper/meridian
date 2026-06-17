/**
 * Multi-Provider LLM Router
 * 
 * Features:
 * - ε-Greedy Q-learning for provider selection
 * - Circuit breaker pattern for fault tolerance
 * - Automatic failover
 * - Cost optimization
 * - Telemetry tracking
 * 
 * Adapted from deepseek agentRouterDS implementation
 */

export interface Provider {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  costPerMillion: { input: number; output: number };
}

export interface TaskContext {
  type: 'reasoning' | 'fast-tool' | 'code' | 'creative';
  complexity: number; // 0-1 scale
}

export interface ProviderResponse {
  output: string;
  provider: string;
  cost: number;
  latency: number;
  success: boolean;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

// Default providers configuration
const DEFAULT_PROVIDERS: Provider[] = [
  {
    id: 'openai',
    name: 'OpenAI GPT-4',
    enabled: false,
    priority: 1,
    costPerMillion: { input: 10, output: 30 }
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    enabled: false,
    priority: 2,
    costPerMillion: { input: 8, output: 24 }
  },
  {
    id: 'google',
    name: 'Google Gemini',
    enabled: false,
    priority: 3,
    costPerMillion: { input: 5, output: 15 }
  }
];

// Q-Learning configuration
const EXPLORATION_RATE = 0.1; // ε-Greedy exploration rate
const LEARNING_RATE = 0.1; // α for Q-value updates

// Circuit breaker thresholds
const FAILURE_THRESHOLD = 5;
const CIRCUIT_TIMEOUT_MS = 60000; // 1 minute

// In-memory storage (replace with Redis/DB in production)
const qTable = new Map<string, number>(); // State-action Q-values
const circuitBreakers = new Map<string, { failures: number; lastFailure: number; open: boolean }>();

/**
 * Generate state-action key for Q-table lookup
 */
function stateActionKey(taskType: string, complexity: number, providerId: string): string {
  const bucket = complexity < 0.3 ? 'low' : complexity < 0.7 ? 'med' : 'high';
  return `${taskType}|${bucket}|${providerId}`;
}

/**
 * Get Q-value for state-action pair
 */
function getQValue(taskType: string, complexity: number, providerId: string): number {
  const key = stateActionKey(taskType, complexity, providerId);
  return qTable.get(key) || 0;
}

/**
 * Update Q-value based on reward
 */
function updateQValue(taskType: string, complexity: number, providerId: string, reward: number): void {
  const key = stateActionKey(taskType, complexity, providerId);
  const currentQ = getQValue(taskType, complexity, providerId);
  const newQ = currentQ + LEARNING_RATE * (reward - currentQ);
  qTable.set(key, newQ);
}

/**
 * Check if provider's circuit breaker is open
 */
function isCircuitOpen(providerId: string): boolean {
  const breaker = circuitBreakers.get(providerId);
  if (!breaker || !breaker.open) return false;
  
  // Auto-reset after timeout
  if (Date.now() - breaker.lastFailure > CIRCUIT_TIMEOUT_MS) {
    breaker.open = false;
    breaker.failures = 0;
    return false;
  }
  
  return true;
}

/**
 * Record provider failure
 */
function recordFailure(providerId: string): void {
  const breaker = circuitBreakers.get(providerId) || { failures: 0, lastFailure: 0, open: false };
  breaker.failures++;
  breaker.lastFailure = Date.now();
  
  if (breaker.failures >= FAILURE_THRESHOLD) {
    breaker.open = true;
    console.warn(`[Router] Circuit breaker OPEN for provider: ${providerId}`);
  }
  
  circuitBreakers.set(providerId, breaker);
}

/**
 * Record provider success
 */
function recordSuccess(providerId: string): void {
  const breaker = circuitBreakers.get(providerId);
  if (breaker) {
    breaker.failures = 0;
    breaker.open = false;
  }
}

/**
 * Get available providers (enabled + circuit closed)
 */
function getAvailableProviders(): Provider[] {
  return DEFAULT_PROVIDERS
    .filter(p => p.enabled && !isCircuitOpen(p.id))
    .sort((a, b) => a.priority - b.priority);
}

/**
 * Select provider using ε-Greedy Q-learning
 */
function selectProvider(taskContext: TaskContext): { provider: Provider; method: string } {
  const available = getAvailableProviders();
  
  if (available.length === 0) {
    throw new Error('No providers available');
  }
  
  // ε-Greedy exploration
  if (Math.random() < EXPLORATION_RATE) {
    const randomProvider = available[Math.floor(Math.random() * available.length)];
    return { provider: randomProvider, method: 'exploration' };
  }
  
  // Exploitation: choose best Q-value
  let bestProvider = available[0];
  let bestQ = -Infinity;
  
  for (const provider of available) {
    const q = getQValue(taskContext.type, taskContext.complexity, provider.id);
    if (q > bestQ) {
      bestQ = q;
      bestProvider = provider;
    }
  }
  
  return { provider: bestProvider, method: 'q_policy' };
}

/**
 * Calculate cost for provider usage
 */
function calculateCost(provider: Provider, usage: { prompt_tokens: number; completion_tokens: number }): number {
  return (
    (usage.prompt_tokens / 1_000_000) * provider.costPerMillion.input +
    (usage.completion_tokens / 1_000_000) * provider.costPerMillion.output
  );
}

/**
 * Calculate reward signal for Q-learning
 * Factors: success, latency, cost
 */
function calculateReward(result: ProviderResponse): number {
  if (!result.success) return -10; // Heavy penalty for failure
  
  let reward = 10; // Base success reward
  
  // Latency penalty (prefer < 2s responses)
  if (result.latency > 2000) {
    reward -= (result.latency - 2000) / 1000;
  }
  
  // Cost penalty
  reward -= result.cost * 10; // Scale cost to reasonable range
  
  return Math.max(reward, -10);
}

/**
 * Main routing and execution function
 */
export async function routeAndExecute(
  prompt: string,
  taskContext: TaskContext,
  executeCall: (providerId: string, prompt: string) => Promise<ProviderResponse>
): Promise<ProviderResponse> {
  const startTime = Date.now();
  
  try {
    // Select provider
    const { provider, method } = selectProvider(taskContext);
    console.log(`[Router] Selected ${provider.id} via ${method}`);
    
    // Execute
    const result = await executeCall(provider.id, prompt);
    result.latency = Date.now() - startTime;
    
    // Update learning
    if (result.success) {
      recordSuccess(provider.id);
      const reward = calculateReward(result);
      updateQValue(taskContext.type, taskContext.complexity, provider.id, reward);
      console.log(`[Router] Success: ${provider.id}, reward: ${reward.toFixed(2)}`);
    } else {
      recordFailure(provider.id);
      updateQValue(taskContext.type, taskContext.complexity, provider.id, -10);
      console.warn(`[Router] Failure: ${provider.id}`);
    }
    
    return result;
  } catch (error) {
    console.error('[Router] Execution error:', error);
    throw error;
  }
}

/**
 * Get provider status for debugging
 */
export function getProviderStatus(): Array<{ id: string; enabled: boolean; qValue: number; circuitOpen: boolean }> {
  return DEFAULT_PROVIDERS.map(p => ({
    id: p.id,
    enabled: p.enabled,
    qValue: getQValue('reasoning', 0.5, p.id), // Sample Q-value
    circuitOpen: isCircuitOpen(p.id)
  }));
}

/**
 * Enable/disable provider
 */
export function toggleProvider(providerId: string, enabled: boolean): void {
  const provider = DEFAULT_PROVIDERS.find(p => p.id === providerId);
  if (provider) {
    provider.enabled = enabled;
    console.log(`[Router] Provider ${providerId} ${enabled ? 'enabled' : 'disabled'}`);
  }
}

/**
 * Reset circuit breaker for provider
 */
export function resetCircuitBreaker(providerId: string): void {
  circuitBreakers.delete(providerId);
  console.log(`[Router] Circuit breaker reset for ${providerId}`);
}

/**
 * Get Q-table snapshot for visualization
 */
export function getQTableSnapshot(): Map<string, number> {
  return new Map(qTable);
}
