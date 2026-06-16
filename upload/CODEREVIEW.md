# CODEREVIEW.md AGENTIC OS V2 — FEATURE SPEC (DEV-READY)

## 🎯 Executive Summary

**Transformation**: From single-agent task orchestration UI → Multi-agent autonomous runtime OS

**Impact**: Agent Studio OS evolves from a "task runner" into a full "agent operating system" capable of managing complex, multi-agent workflows with reflection, parallel execution, approval systems, and enterprise-grade observability.

**Scope**: 10 major features spanning architecture, execution engine, safety, and observability.

---

## 📊 Current State Analysis

### ✅ V1 Strengths (Foundation)
- **Architecture**: Clean layered design (Presentation → API → Engine → Data)
- **Execution**: Step-based safety model with kill switches and max steps
- **Real-time**: SSE streaming for live execution updates
- **UI/UX**: Professional dark theme with React Flow canvas
- **Safety**: Kill switch, step limits, auto/manual modes

### ❌ V1 Gaps (vs V2 Requirements)
- **Execution**: Single-agent only, sequential execution only
- **Quality**: No self-improvement or reflection loops
- **Composition**: No agent roles, permissions, or specialization
- **Memory**: Single-tier in-memory only (resets on restart)
- **Reliability**: No tool verification or approval systems
- **Observability**: Basic event streaming, no comprehensive timeline
- **Performance**: No parallel execution or async processing
- **Planning**: No structured task graphs or orchestration modes

### 🎯 Gap Analysis Matrix

| V2 Feature | V1 Status | Implementation Complexity | Impact |
|------------|-----------|---------------------------|--------|
| Orchestration Modes | ❌ Missing | Medium | High |
| Reflection Loops | ❌ Missing | High | High |
| Agent Roles | ❌ Missing | Medium | High |
| 3-Tier Memory | ❌ Basic | Medium | Medium |
| Tool Verification | ❌ Missing | Medium | High |
| Approval System | ❌ Missing | Low | High |
| Observability Timeline | ❌ Basic | Low | Medium |
| Parallel Engine | ❌ Missing | High | High |
| Task Graphs | ❌ Missing | High | High |
| System States | ❌ Basic | Low | Medium |

---

## 🚀 V2 Feature Implementation Plans

### 1. 🎭 Orchestration Mode Engine

**Goal**: Support multiple execution patterns beyond single-agent sequential

#### Current State
- Single agent execution loop in `agent.ts`
- Hard-coded sequential execution in `runAgent()`
- No support for multi-agent coordination

#### Implementation Plan

**Database Changes**:
```prisma
model AgentRun {
  // ... existing fields
  mode: OrchestrationMode @default("sequential")
  orchestrationData: String? // JSON for mode-specific config
}

enum OrchestrationMode {
  SEQUENTIAL
  GROUP
  HIERARCHICAL
  PARALLEL
}
```

**Type Extensions** (`types.ts`):
```typescript
export type OrchestrationMode = "sequential" | "group" | "hierarchical" | "parallel";

export type AgentConfig = {
  // ... existing fields
  orchestration?: {
    mode: OrchestrationMode;
    maxConcurrency?: number;
    managerAgentId?: string; // for hierarchical
    sharedContext?: boolean; // for group
  };
};
```

**Engine Changes** (`agent.ts`):
```typescript
export async function runOrchestration(
  runId: string,
  agentConfigs: AgentConfig[],
  mode: OrchestrationMode
): Promise<void> {
  switch (mode) {
    case "sequential":
      return runSequential(runId, agentConfigs);
    case "parallel":
      return runParallel(runId, agentConfigs);
    case "group":
      return runGroup(runId, agentConfigs);
    case "hierarchical":
      return runHierarchical(runId, agentConfigs);
  }
}
```

**API Extensions**:
- `POST /api/orchestration/start` - Start multi-agent orchestration
- `GET /api/orchestration/status` - Get orchestration status
- `POST /api/orchestration/stop` - Stop orchestration

**UI Changes**:
- New "Orchestration Mode" dropdown in agent inspector
- Multi-agent canvas with connection arrows showing execution flow
- Real-time status indicators for each agent in orchestration

#### Files to Modify
- `prisma/schema.prisma` - Add orchestration fields
- `src/lib/agent/types.ts` - Extend types
- `src/lib/agent/agent.ts` - Add orchestration logic
- `src/app/api/orchestration/` - New API routes
- `src/components/agent/agent-inspector.tsx` - Add mode selector
- `src/components/agent/agent-canvas.tsx` - Multi-agent visualization

#### Testing Requirements
- Sequential mode maintains backward compatibility
- Parallel mode executes agents simultaneously
- Group mode shares memory between agents
- Hierarchical mode routes tasks through manager

---

### 2. 🔄 Reflection Loop System

**Goal**: Automatic output quality improvement through self-critique

#### Current State
- Single-pass execution (Plan → Execute → Evaluate → Done)
- No self-improvement or iteration loops
- Fixed output quality

#### Implementation Plan

**Database Changes**:
```prisma
model AgentRun {
  // ... existing fields
  reflectionEnabled: Boolean @default(false)
  maxIterations: Int @default(3)
  iterations: Iteration[]
}

model Iteration {
  id: String @id @default(cuid())
  runId: String
  iterationNum: Int
  output: String
  feedback: String?
  approved: Boolean @default(false)
  createdAt: DateTime @default(now())
}
```

**Type Extensions**:
```typescript
export type AgentConfig = {
  // ... existing fields
  reflection?: {
    enabled: boolean;
    maxIterations: number;
    approvalKeyword: string;
  };
};

export type ReflectionEvent = {
  type: "iteration_start" | "critique" | "iteration_complete";
  iteration: number;
  output: string;
  feedback?: string;
};
```

**Engine Changes** (`agent.ts`):
```typescript
export async function runWithReflection(
  runId: string,
  config: AgentConfig
): Promise<void> {
  let iteration = 0;
  let currentOutput = "";
  
  while (iteration < config.reflection.maxIterations) {
    // Generate output
    currentOutput = await generateOutput(runId, config, iteration);
    
    // Self-critique
    const critique = await critiqueOutput(currentOutput, config);
    
    // Check for approval
    if (critique.includes(config.reflection.approvalKeyword)) {
      await saveApprovedOutput(runId, currentOutput, iteration);
      break;
    }
    
    // Iterate
    iteration++;
    await saveIteration(runId, iteration, currentOutput, critique);
  }
}
```

**New Module** (`src/lib/agent/reflection.ts`):
```typescript
export async function critiqueOutput(output: string, config: AgentConfig): Promise<string> {
  // Use LLM to critique the output
  const prompt = `Critique this output for quality and completeness: ${output}`;
  const critique = await callLLM(prompt);
  return critique;
}
```

**UI Changes**:
- "Self-Improve Output" toggle in agent inspector
- Live iteration counter and progress bar
- Iteration history panel showing each attempt and critique
- Approve/Reject buttons for manual oversight

#### Files to Create/Modify
- `prisma/schema.prisma` - Add reflection/iteration models
- `src/lib/agent/types.ts` - Add reflection types
- `src/lib/agent/reflection.ts` - New reflection module
- `src/lib/agent/agent.ts` - Integrate reflection loop
- `src/components/agent/reflection-panel.tsx` - New UI component
- `src/app/api/reflection/` - Reflection-specific API routes

#### Testing Requirements
- Reflection loop terminates on approval keyword
- Max iterations respected
- Iteration history properly saved
- UI shows real-time iteration progress

---

### 3. 👥 Agent Role System

**Goal**: Specialized, composable agents with permissions

#### Current State
- All agents are general-purpose
- No specialization or permission system
- Homogeneous agent capabilities

#### Implementation Plan

**Database Changes**:
```prisma
model Agent {
  // ... existing fields
  role: AgentRole @default(GENERAL)
  permissions: String @default("read,write") // comma-separated
  specialization: String? // role-specific config JSON
}

enum AgentRole {
  GENERAL
  PLANNER
  RESEARCHER
  EXECUTOR
  CRITIC
  REVIEWER
}
```

**Type Extensions**:
```typescript
export type AgentRole = "general" | "planner" | "researcher" | "executor" | "critic" | "reviewer";

export type AgentPermissions = ("read" | "write" | "execute" | "network" | "filesystem")[];

export type AgentConfig = {
  // ... existing fields
  role?: AgentRole;
  permissions?: AgentPermissions;
  specialization?: Record<string, any>;
};
```

**Role Behaviors** (`src/lib/agent/roles.ts`):
```typescript
export const roleDefinitions = {
  planner: {
    personality: "strategic and organized",
    tools: ["search", "write"],
    promptModifier: "Focus on creating detailed execution plans",
    color: "#7C3AED" // purple
  },
  researcher: {
    personality: "thorough and analytical", 
    tools: ["search", "browser"],
    promptModifier: "Gather comprehensive information",
    color: "#22C55E" // green
  },
  executor: {
    personality: "efficient and precise",
    tools: ["code", "write"],
    promptModifier: "Execute tasks with high accuracy",
    color: "#3B82F6" // blue
  },
  critic: {
    personality: "objective and constructive",
    tools: ["write"],
    promptModifier: "Provide detailed critique and suggestions",
    color: "#F59E0B" // amber
  },
  reviewer: {
    personality: "meticulous and quality-focused",
    tools: ["search", "write"],
    promptModifier: "Review work for completeness and accuracy",
    color: "#EF4444" // red
  }
};
```

**UI Changes**:
- Role selection dropdown with color-coded badges
- Permission checkboxes in agent inspector
- Role-specific configuration panels
- Visual role indicators on canvas nodes

#### Files to Create/Modify
- `prisma/schema.prisma` - Add role and permission fields
- `src/lib/agent/types.ts` - Add role types
- `src/lib/agent/roles.ts` - Role definitions and behaviors
- `src/lib/agent/planner.ts` - Role-aware planning
- `src/components/agent/role-badge.tsx` - Visual role indicators
- `src/components/agent/agent-inspector.tsx` - Role configuration

#### Testing Requirements
- Role behaviors modify agent personality and tool selection
- Permissions restrict available actions
- UI shows role-specific styling and options

---

### 4. 🧠 Memory Layer (3-tier)

**Goal**: Structured context management across sessions

#### Current State
- Single in-memory store per run
- No persistence across runs
- No artifact management

#### Implementation Plan

**Database Changes**:
```prisma
model AgentMemory {
  id: String @id @default(cuid())
  agentId: String
  type: MemoryType
  key: String
  value: String // JSON
  expiresAt: DateTime?
  createdAt: DateTime @default(now())
  updatedAt: DateTime @updatedAt
}

model MemoryArtifact {
  id: String @id @default(cuid())
  runId: String
  name: String
  type: String // "file", "data", "result"
  content: String
  metadata: String? // JSON
  createdAt: DateTime @default(now())
}

enum MemoryType {
  SESSION
  PERSISTENT  
  ARTIFACT
}
```

**Type Extensions**:
```typescript
export type MemoryTier = "session" | "persistent" | "artifacts";

export type MemoryEntry = {
  id: string;
  type: MemoryTier;
  key: string;
  value: any;
  expiresAt?: Date;
  metadata?: Record<string, any>;
};
```

**Enhanced Memory Module** (`src/lib/agent/memory.ts`):
```typescript
export class MemoryManager {
  private sessionMemory = new Map<string, any>();
  private persistentCache = new Map<string, any>();
  
  async get(key: string, tier: MemoryTier): Promise<any> {
    switch (tier) {
      case "session":
        return this.sessionMemory.get(key);
      case "persistent":
        return await this.loadPersistent(key);
      case "artifacts":
        return await this.loadArtifact(key);
    }
  }
  
  async set(key: string, value: any, tier: MemoryTier): Promise<void> {
    switch (tier) {
      case "session":
        this.sessionMemory.set(key, value);
        break;
      case "persistent":
        await this.savePersistent(key, value);
        break;
      case "artifacts":
        await this.saveArtifact(key, value);
        break;
    }
  }
}
```

**UI Changes**:
- "Memory Inspector" panel showing all three tiers
- Session memory: current run context
- Persistent memory: cross-run knowledge
- Artifacts: generated files and outputs
- Memory browser with search and filtering

#### Files to Create/Modify
- `prisma/schema.prisma` - Memory and artifact models
- `src/lib/agent/types.ts` - Memory types
- `src/lib/agent/memory.ts` - Enhanced memory management
- `src/components/agent/memory-inspector.tsx` - New UI panel
- `src/app/api/memory/` - Memory management API

#### Testing Requirements
- Session memory resets between runs
- Persistent memory survives restarts
- Artifacts properly stored and retrievable
- Memory inspector shows correct data

---

### 5. 🔍 Tool + Verification Layer

**Goal**: Reliable execution with validation

#### Current State
- Tools return unverified results
- No quality checks or validation
- Trust-based execution

#### Implementation Plan

**Type Extensions**:
```typescript
export type ToolConfig = {
  name: string;
  validator?: (output: any) => ValidationResult;
  retryOnFailure?: boolean;
  maxRetries?: number;
};

export type ValidationResult = {
  valid: boolean;
  score?: number;
  feedback?: string;
  suggestions?: string[];
};

export type AgentConfig = {
  // ... existing fields
  toolConfig?: Record<string, ToolConfig>;
};
```

**Verification Module** (`src/lib/agent/verification.ts`):
```typescript
export async function executeWithVerification(
  tool: string,
  input: any,
  config: ToolConfig
): Promise<{ result: any; validation: ValidationResult }> {
  let result;
  let attempts = 0;
  
  do {
    result = await executeTool(tool, input);
    const validation = await validateResult(result, config.validator);
    
    if (validation.valid) {
      return { result, validation };
    }
    
    attempts++;
  } while (config.retryOnFailure && attempts < config.maxRetries);
  
  return { result, validation: { valid: false, feedback: "Max retries exceeded" } };
}

async function validateResult(result: any, validator?: Function): Promise<ValidationResult> {
  if (!validator) return { valid: true };
  
  try {
    return await validator(result);
  } catch (error) {
    return { valid: false, feedback: `Validation error: ${error.message}` };
  }
}
```

**Built-in Validators**:
```typescript
export const validators = {
  jsonSchema: (schema: any) => (result: any) => {
    // Validate against JSON schema
    return validateJsonSchema(result, schema);
  },
  
  codeExecution: (testCommand: string) => async (result: string) => {
    // Execute code and check for errors
    const success = await runCodeTest(result, testCommand);
    return { valid: success, feedback: success ? "Code executes successfully" : "Code execution failed" };
  },
  
  apiResponse: (expectedStatus: number) => (result: any) => {
    // Check API response structure
    return result.status === expectedStatus;
  }
};
```

**UI Changes**:
- Status indicators: ✅ Verified, ❌ Failed, ⚠ Needs Review
- Validation feedback display
- Retry controls for failed validations
- Validation configuration panel

#### Files to Create/Modify
- `src/lib/agent/types.ts` - Tool verification types
- `src/lib/agent/verification.ts` - Validation logic
- `src/lib/agent/tools.ts` - Integrate verification
- `src/components/agent/validation-status.tsx` - Status indicators
- `src/components/agent/tool-config.tsx` - Validation configuration

#### Testing Requirements
- Validators correctly assess tool outputs
- Failed validations trigger retries
- UI shows validation status clearly
- Manual review option works

---

### 6. 🛡️ Policy + Approval System

**Goal**: Prevent unsafe actions through governance

#### Current State
- No risk assessment or approval workflows
- All actions execute immediately
- No governance controls

#### Implementation Plan

**Database Changes**:
```prisma
model Policy {
  id: String @id @default(cuid())
  name: String
  description: String
  riskLevel: RiskLevel
  requiresApproval: Boolean @default(false)
  conditions: String // JSON conditions
  actions: String // JSON actions
  createdAt: DateTime @default(now())
}

model Approval {
  id: String @id @default(cuid())
  runId: String
  policyId: String
  status: ApprovalStatus @default(PENDING)
  requestedBy: String? // user ID
  approvedBy: String?
  reason: String?
  createdAt: DateTime @default(now())
}

enum RiskLevel {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum ApprovalStatus {
  PENDING
  APPROVED
  REJECTED
  EXPIRED
}
```

**Type Extensions**:
```typescript
export type RiskLevel = "low" | "medium" | "high" | "critical";

export type Policy = {
  id: string;
  name: string;
  riskLevel: RiskLevel;
  requiresApproval: boolean;
  conditions: PolicyCondition[];
  actions: PolicyAction[];
};

export type ApprovalRequest = {
  id: string;
  runId: string;
  policyId: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
};
```

**Policy Engine** (`src/lib/agent/policy.ts`):
```typescript
export class PolicyEngine {
  async checkPolicies(action: AgentAction, context: any): Promise<PolicyCheck[]> {
    const policies = await this.getActivePolicies();
    const checks: PolicyCheck[] = [];
    
    for (const policy of policies) {
      const triggered = await this.evaluateConditions(policy.conditions, action, context);
      if (triggered) {
        checks.push({
          policy,
          triggered: true,
          requiresApproval: policy.requiresApproval,
          riskLevel: policy.riskLevel
        });
      }
    }
    
    return checks;
  }
  
  async requestApproval(runId: string, policyChecks: PolicyCheck[]): Promise<void> {
    for (const check of policyChecks) {
      if (check.requiresApproval) {
        await this.createApprovalRequest(runId, check.policy);
        await this.pauseExecution(runId);
      }
    }
  }
}
```

**UI Changes**:
- "Approval Required" modal with policy details
- Policy dashboard showing active policies and approval queue
- Risk level indicators (color-coded)
- Approve/Reject buttons with reason fields

#### Files to Create/Modify
- `prisma/schema.prisma` - Policy and approval models
- `src/lib/agent/types.ts` - Policy types
- `src/lib/agent/policy.ts` - Policy engine
- `src/components/agent/approval-modal.tsx` - Approval UI
- `src/components/agent/policy-dashboard.tsx` - Policy management
- `src/app/api/policy/` - Policy management API

#### Testing Requirements
- High-risk actions trigger approval requests
- Execution pauses for pending approvals
- UI shows approval status clearly
- Policy conditions evaluate correctly

---

### 7. 📊 Observability Timeline

**Goal**: Debug and trust through comprehensive tracking

#### Current State
- Basic SSE events (thinking, plan, action, result, done)
- No latency tracking, token counting, or failure analysis
- Limited debugging capabilities

#### Implementation Plan

**Database Changes**:
```prisma
model TimelineEvent {
  id: String @id @default(cuid())
  runId: String
  stepId: String?
  type: EventType
  timestamp: DateTime @default(now())
  duration: Int? // milliseconds
  tokens: Int? // LLM tokens used
  metadata: String // JSON
  error: String?
}

model RunMetrics {
  id: String @id @default(cuid())
  runId: String
  totalSteps: Int
  totalDuration: Int
  totalTokens: Int
  successRate: Float
  failureCount: Int
  createdAt: DateTime @default(now())
}

enum EventType {
  RUN_START
  STEP_START
  LLM_CALL
  TOOL_EXECUTION
  VALIDATION
  APPROVAL_REQUEST
  ERROR
  STEP_COMPLETE
  RUN_COMPLETE
}
```

**Metrics Collector** (`src/lib/agent/metrics.ts`):
```typescript
export class MetricsCollector {
  private events: TimelineEvent[] = [];
  
  async recordEvent(
    runId: string,
    type: EventType,
    metadata: any,
    duration?: number,
    tokens?: number
  ): Promise<void> {
    const event: TimelineEvent = {
      id: generateId(),
      runId,
      type,
      timestamp: new Date(),
      duration,
      tokens,
      metadata: JSON.stringify(metadata)
    };
    
    this.events.push(event);
    await this.persistEvent(event);
  }
  
  async getRunMetrics(runId: string): Promise<RunMetrics> {
    const events = await this.getEventsForRun(runId);
    return this.calculateMetrics(events);
  }
}
```

**UI Changes**:
- Timeline component showing events chronologically
- Performance metrics dashboard (latency, tokens, success rate)
- Event details with expandable metadata
- Filter and search capabilities
- CI/CD-style pipeline visualization

#### Files to Create/Modify
- `prisma/schema.prisma` - Timeline and metrics models
- `src/lib/agent/metrics.ts` - Metrics collection
- `src/lib/agent/agent.ts` - Integrate metrics recording
- `src/components/agent/timeline.tsx` - Timeline visualization
- `src/components/agent/metrics-dashboard.tsx` - Performance dashboard
- `src/app/api/metrics/` - Metrics API

#### Testing Requirements
- All events properly recorded with timing
- Token usage accurately tracked
- Timeline shows correct event sequence
- Performance metrics calculate correctly

---

### 8. ⚡ Parallel + Async Engine

**Goal**: Speed and autonomy through concurrent execution

#### Current State
- Sequential step execution with 500ms delays
- No concurrent processing
- Synchronous execution model

#### Implementation Plan

**Engine Changes** (`agent.ts`):
```typescript
export async function runParallelOrchestration(
  runId: string,
  agentConfigs: AgentConfig[],
  maxConcurrency: number = 3
): Promise<void> {
  const semaphore = new Semaphore(maxConcurrency);
  const promises: Promise<void>[] = [];
  
  for (const config of agentConfigs) {
    promises.push(
      semaphore.acquire().then(async (release) => {
        try {
          await runAgent(`${runId}-${config.id}`, config);
        } finally {
          release();
        }
      })
    );
  }
  
  await Promise.allSettled(promises);
}
```

**Async Task System** (`src/lib/agent/async.ts`):
```typescript
export class AsyncTaskManager {
  private queue: Task[] = [];
  private workers: Worker[] = [];
  
  async enqueueTask(task: Task): Promise<string> {
    const taskId = generateId();
    this.queue.push({ ...task, id: taskId });
    await this.processQueue();
    return taskId;
  }
  
  private async processQueue(): Promise<void> {
    while (this.queue.length > 0 && this.workers.length < this.maxWorkers) {
      const task = this.queue.shift();
      if (task) {
        const worker = this.createWorker(task);
        this.workers.push(worker);
        
        worker.promise.finally(() => {
          this.workers = this.workers.filter(w => w !== worker);
          this.processQueue(); // Process next task
        });
      }
    }
  }
}
```

**Configuration**:
```typescript
export type AsyncConfig = {
  enabled: boolean;
  maxConcurrency: number;
  queueSize: number;
  timeout: number;
};
```

**UI Changes**:
- Concurrency controls in agent inspector
- Parallel execution visualization
- Queue status indicators
- Worker utilization metrics

#### Files to Create/Modify
- `src/lib/agent/async.ts` - Async task management
- `src/lib/agent/agent.ts` - Parallel execution logic
- `src/lib/agent/types.ts` - Async configuration types
- `src/components/agent/concurrency-controls.tsx` - UI controls
- `src/components/agent/parallel-view.tsx` - Parallel execution visualization

#### Testing Requirements
- Parallel execution respects max concurrency
- Failed tasks don't block others
- Async queue processes tasks correctly
- UI shows concurrent execution status

---

### 9. 🗺️ Planner → Task Graph System

**Goal**: Structured execution through task decomposition

#### Current State
- Single-step planning per execution cycle
- No multi-step task breakdown
- Reactive planning only

#### Implementation Plan

**Database Changes**:
```prisma
model TaskGraph {
  id: String @id @default(cuid())
  runId: String
  rootTaskId: String
  status: GraphStatus
  createdAt: DateTime @default(now())
  tasks: Task[]
}

model Task {
  id: String @id @default(cuid())
  graphId: String
  parentTaskId: String?
  title: String
  description: String
  assignedAgentId: String?
  status: TaskStatus
  dependencies: String // JSON array of task IDs
  result: String?
  createdAt: DateTime @default(now())
  updatedAt: DateTime @updatedAt
}

enum GraphStatus {
  PLANNING
  EXECUTING
  COMPLETED
  FAILED
}

enum TaskStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  FAILED
  BLOCKED
}
```

**Task Graph Engine** (`src/lib/agent/task-graph.ts`):
```typescript
export class TaskGraph {
  private tasks = new Map<string, Task>();
  private dependencies = new Map<string, string[]>();
  
  async createFromGoal(goal: string): Promise<TaskGraph> {
    const plan = await this.generateTaskPlan(goal);
    return this.buildGraph(plan);
  }
  
  async execute(): Promise<void> {
    const executableTasks = this.getExecutableTasks();
    
    for (const taskId of executableTasks) {
      await this.executeTask(taskId);
      await this.updateDependencies(taskId);
    }
  }
  
  private getExecutableTasks(): string[] {
    return Array.from(this.tasks.values())
      .filter(task => 
        task.status === 'PENDING' && 
        this.areDependenciesMet(task.id)
      )
      .map(task => task.id);
  }
}
```

**UI Changes**:
- Task graph visualization (like a project management Gantt chart)
- Task assignment interface
- Dependency arrows between tasks
- Task status indicators and progress tracking

#### Files to Create/Modify
- `prisma/schema.prisma` - Task graph models
- `src/lib/agent/task-graph.ts` - Graph management
- `src/lib/agent/planner.ts` - Task decomposition
- `src/components/agent/task-graph.tsx` - Graph visualization
- `src/components/agent/task-assignment.tsx` - Assignment interface
- `src/app/api/task-graph/` - Graph management API

#### Testing Requirements
- Task dependencies respected
- Parallel execution of independent tasks
- Graph completion triggers next phase
- UI shows task relationships clearly

---

### 10. 🎮 System State Manager

**Goal**: Animated boot UI connecting to agent runtime state

#### Current State
- Basic run status (pending, running, completed, failed)
- No system-wide state management
- Limited state visualization

#### Implementation Plan

**System States**:
```typescript
export type SystemState = 
  | "idle"
  | "planning"
  | "running"
  | "waiting_approval"
  | "error"
  | "completed"
  | "maintenance";

export type SystemStatus = {
  state: SystemState;
  activeRuns: number;
  pendingApprovals: number;
  systemLoad: number;
  lastActivity: Date;
};
```

**State Manager** (`src/lib/agent/system-state.ts`):
```typescript
export class SystemStateManager {
  private currentState: SystemState = "idle";
  private listeners: StateListener[] = [];
  
  async transitionTo(newState: SystemState, metadata?: any): Promise<void> {
    const oldState = this.currentState;
    this.currentState = newState;
    
    await this.notifyListeners(oldState, newState, metadata);
    await this.updatePersistentState(newState);
  }
  
  getCurrentState(): SystemState {
    return this.currentState;
  }
  
  async getSystemStatus(): Promise<SystemStatus> {
    return {
      state: this.currentState,
      activeRuns: await this.countActiveRuns(),
      pendingApprovals: await this.countPendingApprovals(),
      systemLoad: await this.calculateLoad(),
      lastActivity: await this.getLastActivity()
    };
  }
}
```

**Boot UI Integration**:
```typescript
// Animated logo that reflects system state
export function SystemStateIndicator({ state }: { state: SystemState }) {
  const animations = {
    idle: "pulse",
    running: "spin",
    error: "shake",
    completed: "bounce"
  };
  
  return (
    <motion.div
      animate={animations[state]}
      className="system-indicator"
    >
      <SystemIcon state={state} />
    </motion.div>
  );
}
```

**UI Changes**:
- Animated system state indicator in header
- State-aware color schemes and animations
- System status dashboard
- State transition notifications

#### Files to Create/Modify
- `src/lib/agent/system-state.ts` - State management
- `src/lib/agent/types.ts` - System state types
- `src/components/ui/system-indicator.tsx` - Animated indicator
- `src/components/agent/system-dashboard.tsx` - Status dashboard
- `src/store/system-store.ts` - Global state management

#### Testing Requirements
- State transitions work correctly
- UI animations match system state
- State persistence survives restarts
- Real-time state updates

---

## 📋 Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
**Priority**: High-impact, low-risk features
1. **System State Manager** - Animated boot UI
2. **Observability Timeline** - Debug capabilities  
3. **Policy + Approval System** - Safety layer
4. **Agent Role System** - Specialization

### Phase 2: Core Features (Week 3-4)
**Priority**: Medium complexity, high value
1. **Memory Layer (3-tier)** - Context management
2. **Tool + Verification Layer** - Reliability
3. **Orchestration Mode Engine** - Multi-agent support

### Phase 3: Advanced Execution (Week 5-6)
**Priority**: Complex, transformative features
1. **Parallel + Async Engine** - Performance
2. **Planner → Task Graph System** - Structured planning
3. **Reflection Loop System** - Quality improvement

### Phase 4: Polish & Testing (Week 7-8)
**Priority**: Integration and validation
- End-to-end testing of all features
- UI/UX polish and consistency
- Performance optimization
- Documentation updates

---

## 🔬 Risk Assessment

### High Risk
- **Parallel Engine**: Race conditions, deadlocks
- **Reflection Loops**: Infinite iteration potential
- **Task Graphs**: Complex dependency management

### Medium Risk  
- **Memory Layer**: Data consistency across tiers
- **Verification Layer**: False positives/negatives
- **Orchestration Modes**: Coordination complexity

### Low Risk
- **System State Manager**: UI-only changes
- **Observability Timeline**: Additive feature
- **Agent Roles**: Configuration changes

### Mitigation Strategies
- **Testing**: Comprehensive unit and integration tests
- **Gradual Rollout**: Feature flags for new capabilities
- **Monitoring**: Extensive logging and metrics
- **Fallbacks**: Graceful degradation for failures

---

## 📊 Resource Estimates

### Development Effort
- **Foundation Phase**: 40 hours (2 developers × 1 week)
- **Core Features**: 60 hours (2 developers × 1.5 weeks)  
- **Advanced Execution**: 80 hours (2 developers × 2 weeks)
- **Polish & Testing**: 40 hours (2 developers × 1 week)
- **Total**: 220 hours / ~2 months with 2 developers

### Infrastructure Requirements
- **Database**: Add 6-8 new tables
- **API**: 12-15 new endpoints
- **UI**: 8-10 new components
- **Testing**: 50+ new test cases

### Dependencies
- **New Packages**: None (all use existing stack)
- **Breaking Changes**: Minimal (additive features)
- **Migration**: Database schema updates only

---

## 🧪 Success Metrics

### Technical Metrics
- **Performance**: <500ms state transitions, <2s graph rendering
- **Reliability**: 99.9% uptime, <0.1% race conditions
- **Scalability**: Support 10+ concurrent orchestrations

### User Experience Metrics
- **Usability**: >90% task completion rate
- **Trust**: <5% approval overrides, >95% validation accuracy
- **Efficiency**: 3x faster execution with parallel processing

### Business Impact
- **Adoption**: 80% of users enable advanced features
- **Satisfaction**: >4.5/5 user satisfaction score
- **Capability**: Support for 10x more complex workflows

---

## 🚀 Migration Strategy

### Backward Compatibility
- All existing single-agent workflows continue to work
- New features are opt-in via configuration
- API versioning maintains compatibility

### Data Migration
- Existing agents get default configurations
- Run history remains accessible
- Gradual migration of memory to new tiers

### User Communication
- Feature announcements with tutorials
- Gradual rollout with feature flags
- Comprehensive documentation updates

---

## 🎯 Next Steps

1. **Immediate**: Create implementation tickets for Phase 1 features
2. **Week 1**: Begin with System State Manager and Observability Timeline
3. **Week 2**: Add Policy/Approval System and Agent Roles
4. **Testing**: Set up comprehensive test suite
5. **Documentation**: Update README and user guides

This V2 specification transforms Agent Studio OS from a single-agent task runner into a full autonomous agent operating system capable of managing complex, multi-agent workflows with enterprise-grade safety, observability, and performance.

The result: **From orchestration UI → Agent Runtime OS**.
