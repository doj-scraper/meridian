# Meridian Project — Phased Remediation Plan

**Created:** 2026-06-16T04:41 PST  
**Current Commit:** `aa935e9` (WIP: Stage pending changes)  
**Estimated Total Time:** 3-4 weeks (1 FTE)  
**Priority:** Critical path first, then stabilization, then enhancement

---

## Phase 0: Emergency Fixes (Day 1) ⚠️ CRITICAL

**Goal:** Restore git integrity and build capability  
**Time Estimate:** 4-6 hours  
**Blockers Resolved:** Build failure, git corruption, directory duplication

### Tasks

#### 0.1: Fix Git Directory Corruption ⚠️
**Issue:** `meridianruntime` tracked as submodule (160000 mode) but isn't one; empty `meridianRuntime/` directory exists

```bash
# Remove git-tracked meridianruntime (submodule entry)
git rm --cached meridianruntime

# Remove empty directory
rm -rf meridianRuntime

# Add to gitignore
echo "" >> .gitignore
echo "# Meridian Runtime scratch directory" >> .gitignore
echo "meridianruntime/" >> .gitignore
echo "meridianRuntime/" >> .gitignore

# Commit fix
git add .gitignore
git commit -m "fix: remove meridianruntime git corruption"
```

**Verification:**
```bash
git status  # Should be clean except for modified submodule
git ls-files | grep -i meridianruntime  # Should only show src/components/meridian files
```

---

#### 0.2: Fix Submodule Issue
**Issue:** `upload/devAgenticPipeline/devAgenticPipeline` has modified content

```bash
# Option A: Commit submodule changes (if intentional)
cd upload/devAgenticPipeline/devAgenticPipeline
git add -A
git commit -m "Update devAgenticPipeline submodule"
cd ../../..
git add upload/devAgenticPipeline/devAgenticPipeline
git commit -m "chore: update devAgenticPipeline submodule reference"

# Option B: Remove submodule (if not needed)
git rm upload/devAgenticPipeline/devAgenticPipeline
rm -rf upload/devAgenticPipeline/devAgenticPipeline
git commit -m "chore: remove devAgenticPipeline submodule"
```

**Verification:**
```bash
git status  # Should be clean
git submodule status  # Should show clean or empty
```

---

#### 0.3: Fix Workspace Root Detection
**Issue:** Next.js warns about multiple lockfiles causing workspace root confusion

**File:** `next.config.ts`
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: __dirname,  // Explicitly set workspace root
  },
};

export default nextConfig;
```

**Verification:**
```bash
bun run build 2>&1 | grep -i "workspace"  # Warning should disappear
```

---

#### 0.4: Fix Build Memory/Timeout Issue
**Issue:** Build exits with code 143 (SIGTERM)

**Check system resources:**
```bash
# Check available memory
free -h

# Check Node.js memory limit
node -e "console.log(v8.getHeapStatistics().heap_size_limit / (1024 * 1024), 'MB')"
```

**File:** `package.json` (update build script)
```json
{
  "scripts": {
    "build": "NODE_OPTIONS='--max-old-space-size=4096' next build && cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/"
  }
}
```

**Alternative:** If memory is not the issue, check for build hangs
```bash
# Build with verbose logging
NODE_OPTIONS='--max-old-space-size=4096' bun run build --debug
```

**Verification:**
```bash
bun run build  # Should complete successfully
ls -la .next/standalone  # Should contain server.js
```

---

#### 0.5: Fix ESLint Configuration
**Issue:** `eslint-config-next` not found

**File:** `eslint.config.mjs`
```javascript
import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      "no-unused-vars": "warn",
      "no-console": "off",
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
  },
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "build/**",
      ".vercel/**",
      "*.config.js",
      "*.config.ts",
    ],
  },
];
```

**Verification:**
```bash
bun run lint  # Should complete without module errors
```

---

### Phase 0 Success Criteria
- ✅ Git status clean (no submodule issues)
- ✅ `bun run build` succeeds
- ✅ `bun run lint` succeeds
- ✅ No workspace root warnings

---

## Phase 1: Code Cleanup (Day 2) 🧹

**Goal:** Remove dead code, sync database, document environment  
**Time Estimate:** 6-8 hours  
**Dependencies:** Phase 0 complete

### Tasks

#### 1.1: Remove Legacy Component Files
**Issue:** Duplicate components in `src/components/` root

```bash
# Verify newer versions exist
ls -la src/components/agent/agent-canvas.tsx
ls -la src/components/agent/agent-inspector.tsx
ls -la src/components/agent/agent-node.tsx
ls -la src/components/agent/agent-run-view.tsx
ls -la src/components/agent/agent-sidebar.tsx

# Remove legacy files
rm src/components/agent-canvas.tsx
rm src/components/agent-inspector.tsx
rm src/components/agent-node.tsx
rm src/components/agent-run-view.tsx
rm src/components/agent-sidebar.tsx

# Commit
git add -A
git commit -m "chore: remove duplicate legacy component files"
```

**Verification:**
```bash
find src/components -maxdepth 1 -name "agent-*.tsx"  # Should be empty
bun run build  # Should succeed
```

---

#### 1.2: Sync Prisma Database
**Issue:** Schema defined but not pushed to database

```bash
# Generate Prisma client
bun run db:generate

# Push schema to database (creates tables if missing)
bun run db:push

# Verify database
sqlite3 db/custom.db ".tables"  # Should show all 16 models
```

**Verification:**
```bash
bun run db:generate  # Should report no changes
sqlite3 db/custom.db "SELECT name FROM sqlite_master WHERE type='table';"
```

---

#### 1.3: Create Environment Template
**Issue:** No `.env.example` for required variables

**File:** `.env.example`
```bash
# Meridian / Agent Studio OS Environment Variables

# Database
DATABASE_URL="file:./db/custom.db"

# AI SDK (z-ai-web-dev-sdk)
# Get API key from your AI provider
Z_AI_API_KEY="your-api-key-here"

# NextAuth.js (when enabled)
# NEXTAUTH_URL="http://localhost:3000"
# NEXTAUTH_SECRET="generate-with: openssl rand -base64 32"

# LLM Provider Endpoints (optional overrides)
# OPENAI_API_KEY=""
# ANTHROPIC_API_KEY=""

# Application Config
NODE_ENV="development"
PORT="3000"

# Hermes Kernel Config
HERMES_MAX_EVENTS="10000"
HERMES_CHECKPOINT_INTERVAL="100"

# Agent Execution Limits
MAX_CONCURRENT_RUNS="5"
AGENT_MAX_STEPS="20"
AGENT_TIMEOUT_MS="300000"
```

**Verification:**
```bash
cp .env.example .env.test
bun run dev  # Should start without missing env errors
```

---

#### 1.4: Document API Routes
**Issue:** API reference exists in README but not comprehensive

**File:** `API_REFERENCE.md`
```markdown
# Meridian API Reference

> Complete REST API documentation for Agent Studio OS

---

## Base URL
- Development: `http://localhost:3000/api`
- Production: `https://your-domain.com/api`

## Authentication
⚠️ Currently: No authentication (all routes public)  
🔜 Planned: NextAuth.js session-based auth

---

## Agent Management

### POST /api/agent/create
Create a new agent with configuration.

**Request Body:**
\`\`\`json
{
  "name": "Research Agent",
  "goal": "Research quantum computing topics",
  "personality": "analytical and thorough",
  "tools": ["search", "write", "browser"],
  "role": "researcher",
  "model": "gemini-2.5-pro",
  "maxSteps": 10
}
\`\`\`

**Response:** `200 OK`
\`\`\`json
{
  "id": "cm1x2y3z4",
  "name": "Research Agent",
  "goal": "Research quantum computing topics",
  "status": "idle",
  "createdAt": "2026-06-16T04:00:00.000Z"
}
\`\`\`

[Continue for all 49 endpoints...]
```

*Note: Full API_REFERENCE.md creation deferred to Phase 3 (documentation pass)*

---

### Phase 1 Success Criteria
- ✅ No legacy component files remain
- ✅ Database schema synchronized
- ✅ `.env.example` exists with all required variables
- ✅ Build and tests pass (when tests added)

---

## Phase 2: Meridian Runtime UI Decision (Day 3) 🤔

**Goal:** Resolve orphaned Meridian UI (~40% of a major module)  
**Time Estimate:** 4-6 hours  
**Dependencies:** Phase 0, Phase 1 complete

### Decision Matrix

| Option | Effort | Pros | Cons | Recommendation |
|--------|--------|------|------|----------------|
| **A: Integrate** | 3-5 days | Leverages existing work, innovative UI | High complexity, delays production | ⚠️ Only if UI is core differentiator |
| **B: Separate Route** | 1-2 days | Preserves work, allows parallel dev | Dual UI maintenance burden | ✅ **Recommended** |
| **C: Remove** | 2-4 hours | Clean codebase, focus on agent canvas | Loses 40% of module work | ❌ Only if Meridian UI abandoned |

### Recommended Path: Option B (Separate Route)

#### 2.1: Create Meridian Route
**File:** `src/app/meridian/page.tsx`
```typescript
import { MeridianShell } from '@/components/meridian/meridian-shell';

export default function MeridianPage() {
  return <MeridianShell />;
}
```

**File:** `src/app/meridian/layout.tsx`
```typescript
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Meridian Runtime | Agent Studio OS',
  description: 'Event-driven command center for agentic workflows',
};

export default function MeridianLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
```

---

#### 2.2: Add Navigation Between UIs
**File:** `src/components/agent/agent-studio.tsx` (add nav button)
```typescript
// Add to header
<Button
  variant="outline"
  size="sm"
  onClick={() => router.push('/meridian')}
>
  <Zap className="h-4 w-4 mr-2" />
  Switch to Meridian Runtime
</Button>
```

**File:** `src/components/meridian/menu-bar.tsx` (add nav button)
```typescript
// Add to File menu
<MenubarItem onClick={() => router.push('/')}>
  Switch to Agent Canvas
</MenubarItem>
```

---

#### 2.3: Wire Meridian Widgets to Real Data
**Example:** `src/components/meridian/widgets/agents-widget.tsx`

**Current:** Mock data
```typescript
const mockAgents = [
  { id: '1', name: 'Planner', status: 'active', role: 'planner' },
  // ...
];
```

**Updated:** Real API data
```typescript
import { useAgentStore } from '@/store/agent-store';

export function AgentsWidget() {
  const { agents, fetchAgents } = useAgentStore();
  
  useEffect(() => {
    fetchAgents();
  }, []);

  return (
    <WidgetContainer title="Agents" icon={<Bot />}>
      {agents.map((agent) => (
        <AgentRow key={agent.id} agent={agent} />
      ))}
    </WidgetContainer>
  );
}
```

**Repeat for all 18 widgets** (Memory, Timeline, Workflow, etc.)

---

### Phase 2 Success Criteria
- ✅ `/meridian` route accessible
- ✅ Navigation between UIs functional
- ✅ At least 5 core widgets wired to real data (Agents, Memory, Timeline, Workflow, Inference)
- ✅ Starfield background renders smoothly
- ✅ Widget view modes functional (container/expanded/floating/fullscreen)

---

## Phase 3: Testing Foundation (Days 4-5) 🧪

**Goal:** Add critical path tests to prevent regressions  
**Time Estimate:** 12-16 hours  
**Dependencies:** Phase 0, Phase 1 complete

### Tasks

#### 3.1: Setup Testing Infrastructure
**Install dependencies:**
```bash
bun add -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom happy-dom
```

**File:** `vitest.config.ts`
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**File:** `test/setup.ts`
```typescript
import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
```

**File:** `package.json` (add script)
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

---

#### 3.2: Test Hermes Kernel Invariants
**File:** `src/lib/hermes/__tests__/kernel.test.ts`
```typescript
import { describe, it, expect } from 'vitest';
import { createGenesisEvent } from '../event-dsl/constructors';
import { initializeKernel } from '../kernel-spine/kernel';

describe('Hermes Kernel Invariants', () => {
  it('should enforce kernel inversion: action → event → state', () => {
    const genesis = createGenesisEvent('test-run');
    const kernel = initializeKernel({ runId: 'test-run' });
    
    // Propose action
    const proposal = { type: 'DECISION', action: 'plan_step' };
    
    // Kernel should emit event, not mutate state directly
    const events = kernel.processProposal(proposal);
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('DECISION');
  });

  it('should maintain causal ordering', () => {
    const kernel = initializeKernel({ runId: 'test-run' });
    const eventA = kernel.emit({ type: 'MODEL', data: 'A' });
    const eventB = kernel.emit({ type: 'MODEL', data: 'B', parents: [eventA.id] });
    
    const graph = kernel.getGraph();
    expect(graph.getParents(eventB.id)).toContain(eventA.id);
  });

  it('should derive same state from same event log', () => {
    const events = [/* event log */];
    const state1 = reduceEvents(events);
    const state2 = reduceEvents(events);
    
    expect(state1).toEqual(state2);
  });
});
```

---

#### 3.3: Test Agent Orchestration Modes
**File:** `src/lib/agent/__tests__/orchestrator.test.ts`
```typescript
import { describe, it, expect, vi } from 'vitest';
import { getOrchestrator } from '../orchestrator';

describe('Agent Orchestration', () => {
  it('should run single-agent mode', async () => {
    const orchestrator = getOrchestrator();
    const teamConfig = {
      mode: 'single',
      agents: [{ id: 'agent-1', goal: 'test' }],
    };
    
    const runId = await orchestrator.run(teamConfig);
    expect(runId).toBeDefined();
  });

  it('should run sequential mode with handoffs', async () => {
    const orchestrator = getOrchestrator();
    const teamConfig = {
      mode: 'sequential',
      agents: [
        { id: 'agent-1', goal: 'step1' },
        { id: 'agent-2', goal: 'step2' },
      ],
    };
    
    const events = [];
    orchestrator.on('handoff', (e) => events.push(e));
    
    await orchestrator.run(teamConfig);
    expect(events).toHaveLength(1);  // One handoff between 2 agents
  });
});
```

---

#### 3.4: Test Policy Engine
**File:** `src/lib/agent/__tests__/policy.test.ts`
```typescript
import { describe, it, expect } from 'vitest';
import { getPolicyEngine } from '../policy';

describe('Policy Engine', () => {
  it('should block high-risk tools by default', async () => {
    const engine = getPolicyEngine();
    const result = await engine.check({
      tool: 'execute_code',
      role: 'general',
      riskLevel: 'high',
    });
    
    expect(result.action).toBe('ask_user');
  });

  it('should allow low-risk tools', async () => {
    const engine = getPolicyEngine();
    const result = await engine.check({
      tool: 'web_search',
      role: 'researcher',
      riskLevel: 'low',
    });
    
    expect(result.action).toBe('allow');
  });
});
```

---

#### 3.5: Test API Routes (Smoke Tests)
**File:** `src/app/api/__tests__/agent.test.ts`
```typescript
import { describe, it, expect } from 'vitest';
import { POST as createAgent } from '../agent/create/route';
import { GET as listAgents } from '../agent/list/route';

describe('Agent API', () => {
  it('POST /api/agent/create should create agent', async () => {
    const request = new Request('http://localhost:3000/api/agent/create', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Agent',
        goal: 'Test goal',
      }),
    });
    
    const response = await createAgent(request);
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.id).toBeDefined();
    expect(data.name).toBe('Test Agent');
  });

  it('GET /api/agent/list should return agents', async () => {
    const request = new Request('http://localhost:3000/api/agent/list');
    const response = await listAgents(request);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });
});
```

---

### Phase 3 Success Criteria
- ✅ Vitest configured and running
- ✅ 15+ tests covering critical paths
- ✅ All tests passing
- ✅ Test coverage >50% on `lib/hermes/` and `lib/agent/`

---

## Phase 4: Security Hardening (Days 6-7) 🔒

**Goal:** Add authentication, rate limiting, input validation  
**Time Estimate:** 12-16 hours  
**Dependencies:** Phase 0, Phase 1 complete

### Tasks

#### 4.1: Activate NextAuth.js
**File:** `src/app/api/auth/[...nextauth]/route.ts`
```typescript
import NextAuth from 'next-auth';
import GithubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';

const handler = NextAuth({
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // TODO: Replace with real user validation
        if (credentials?.username === 'admin' && credentials?.password === 'admin') {
          return { id: '1', name: 'Admin', email: 'admin@meridian.local' };
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
  },
});

export { handler as GET, handler as POST };
```

**File:** `src/middleware.ts`
```typescript
import { withAuth } from 'next-auth/middleware';

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
});

export const config = {
  matcher: ['/api/:path*', '/meridian/:path*'],
};
```

**Update `.env.example`:**
```bash
# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
GITHUB_ID="your-github-oauth-app-id"
GITHUB_SECRET="your-github-oauth-app-secret"
```

---

#### 4.2: Add Rate Limiting
**Install:**
```bash
bun add @upstash/ratelimit @upstash/redis
```

**File:** `src/lib/rate-limit.ts`
```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export const ratelimit = {
  agent: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'),  // 10 requests per minute
  }),
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),  // 100 requests per minute
  }),
};
```

**Apply to API routes (example):**
```typescript
// src/app/api/agent/create/route.ts
import { ratelimit } from '@/lib/rate-limit';

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ?? 'anonymous';
  const { success } = await ratelimit.agent.limit(ip);
  
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  
  // ... rest of handler
}
```

---

#### 4.3: Add Input Validation Middleware
**File:** `src/lib/validation.ts`
```typescript
import { z } from 'zod';
import { NextResponse } from 'next/server';

export function validateBody<T extends z.ZodType>(schema: T) {
  return async (req: Request): Promise<z.infer<T> | Response> => {
    try {
      const body = await req.json();
      return schema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation failed', details: error.errors },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }
  };
}

// Example usage in route
import { validateBody } from '@/lib/validation';

const createAgentSchema = z.object({
  name: z.string().min(1).max(100),
  goal: z.string().min(1).max(1000),
  tools: z.array(z.enum(['search', 'write', 'code', 'browser', 'finish'])).optional(),
});

export async function POST(req: Request) {
  const validatedBody = await validateBody(createAgentSchema)(req);
  if (validatedBody instanceof Response) return validatedBody;
  
  // Continue with validated data
}
```

---

#### 4.4: Add CORS Configuration
**File:** `src/middleware.ts` (extend)
```typescript
export function middleware(request: Request) {
  const response = NextResponse.next();
  
  // CORS headers
  response.headers.set('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS || 'http://localhost:3000');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return response;
}
```

---

### Phase 4 Success Criteria
- ✅ NextAuth.js functional (login/logout works)
- ✅ Protected routes require authentication
- ✅ Rate limiting active on all API routes
- ✅ Input validation on all POST/PUT endpoints
- ✅ CORS configured correctly

---

## Phase 5: Production Readiness (Days 8-10) 🚀

**Goal:** Dockerize, add monitoring, health checks, CI/CD  
**Time Estimate:** 18-24 hours  
**Dependencies:** Phase 0-4 complete

### Tasks

#### 5.1: Create Dockerfile
**File:** `Dockerfile`
```dockerfile
FROM oven/bun:1 AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run db:generate
RUN bun run build

# Production
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/db ./db
COPY --from=builder /app/prisma ./prisma

USER nextjs
EXPOSE 3000
ENV PORT=3000

CMD ["bun", "server.js"]
```

**File:** `docker-compose.yml`
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=file:./db/custom.db
      - Z_AI_API_KEY=${Z_AI_API_KEY}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=http://localhost:3000
    volumes:
      - ./db:/app/db
    restart: unless-stopped

  postgres:  # Optional: PostgreSQL migration
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: meridian
      POSTGRES_PASSWORD: meridian
      POSTGRES_DB: meridian
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

---

#### 5.2: Add Health Check Endpoint
**File:** `src/app/api/health/route.ts`
```typescript
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Check database connection
    await db.$queryRaw`SELECT 1`;
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Database connection failed',
      },
      { status: 503 }
    );
  }
}
```

---

#### 5.3: Add GitHub Actions CI/CD
**File:** `.github/workflows/ci.yml`
```yaml
name: CI

on:
  push:
    branches: [Main, develop]
  pull_request:
    branches: [Main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run lint

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run db:generate
      - run: bun run test

  build:
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run db:generate
      - run: bun run build
      - uses: actions/upload-artifact@v4
        with:
          name: build
          path: .next/standalone
```

---

#### 5.4: Add Logging and Monitoring
**File:** `src/lib/logger.ts`
```typescript
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV === 'development'
      ? { target: 'pino-pretty' }
      : undefined,
});

export function logRequest(req: Request, duration: number, status: number) {
  logger.info({
    method: req.method,
    url: req.url,
    status,
    duration,
    ip: req.headers.get('x-forwarded-for'),
  });
}
```

**Apply to API routes:**
```typescript
export async function POST(req: Request) {
  const start = Date.now();
  try {
    // ... handler logic
    const response = NextResponse.json(result);
    logRequest(req, Date.now() - start, 200);
    return response;
  } catch (error) {
    logger.error({ error, url: req.url }, 'Request failed');
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

---

### Phase 5 Success Criteria
- ✅ Docker build succeeds
- ✅ `docker-compose up` runs application
- ✅ Health check endpoint returns 200
- ✅ CI pipeline passes (lint, test, build)
- ✅ Logging functional in all API routes

---

## Phase 6: Database Migration (Days 11-12) 🗄️

**Goal:** Migrate from SQLite to PostgreSQL for production  
**Time Estimate:** 10-14 hours  
**Dependencies:** Phase 5 complete

### Tasks

#### 6.1: Update Prisma Schema for PostgreSQL
**File:** `prisma/schema.prisma`
```prisma
datasource db {
  provider = "postgresql"  // Changed from sqlite
  url      = env("DATABASE_URL")
}

// Remove sqlite-specific types
model Agent {
  // Change: DateTime @default(now()) works in both
  createdAt DateTime @default(now())
  // Add indexes for performance
  @@index([status, createdAt])
}
```

---

#### 6.2: Create Migration Script
**File:** `scripts/migrate-to-postgres.ts`
```typescript
import { PrismaClient as SQLiteClient } from '@prisma/client';
import { PrismaClient as PostgresClient } from '@prisma/client';

const sqlite = new SQLiteClient({ datasourceUrl: 'file:./db/custom.db' });
const postgres = new PostgresClient({ datasourceUrl: process.env.POSTGRES_URL });

async function migrate() {
  console.log('Starting migration...');
  
  // Migrate agents
  const agents = await sqlite.agent.findMany();
  for (const agent of agents) {
    await postgres.agent.create({ data: agent });
  }
  console.log(`Migrated ${agents.length} agents`);
  
  // Migrate runs
  const runs = await sqlite.agentRun.findMany();
  for (const run of runs) {
    await postgres.agentRun.create({ data: run });
  }
  console.log(`Migrated ${runs.length} runs`);
  
  // ... repeat for all models
  
  console.log('Migration complete');
}

migrate().finally(() => {
  sqlite.$disconnect();
  postgres.$disconnect();
});
```

---

#### 6.3: Update Environment for Postgres
**Update `.env`:**
```bash
# Development (SQLite)
DATABASE_URL="file:./db/custom.db"

# Production (PostgreSQL)
# DATABASE_URL="postgresql://user:password@localhost:5432/meridian"
```

---

### Phase 6 Success Criteria
- ✅ Prisma schema compatible with PostgreSQL
- ✅ Migration script successfully transfers data
- ✅ Application works with PostgreSQL
- ✅ Database indexes added for performance

---

## Phase 7: Documentation & Polish (Days 13-14) 📚

**Goal:** Complete documentation, examples, deployment guide  
**Time Estimate:** 12-16 hours  
**Dependencies:** Phase 0-6 complete

### Tasks

#### 7.1: Complete API Reference
**File:** `API_REFERENCE.md` (complete all 49 endpoints)
- Document request/response schemas
- Add example curl commands
- Include error responses
- Add rate limit info

---

#### 7.2: Create Deployment Guide
**File:** `DEPLOYMENT.md`
```markdown
# Meridian Deployment Guide

## Prerequisites
- Docker 24+
- PostgreSQL 16+
- 2GB RAM minimum
- Valid API keys for AI providers

## Production Deployment

### 1. Clone Repository
\`\`\`bash
git clone https://github.com/doj-scraper/meridian.git
cd meridian
\`\`\`

### 2. Configure Environment
\`\`\`bash
cp .env.example .env
# Edit .env with production values
\`\`\`

### 3. Build Docker Image
\`\`\`bash
docker build -t meridian:latest .
\`\`\`

### 4. Run Migrations
\`\`\`bash
docker run --env-file .env meridian:latest bun run db:migrate
\`\`\`

### 5. Start Application
\`\`\`bash
docker-compose up -d
\`\`\`

### 6. Verify Health
\`\`\`bash
curl http://localhost:3000/api/health
\`\`\`
```

---

#### 7.3: Create Contributing Guide
**File:** `CONTRIBUTING.md`
```markdown
# Contributing to Meridian

## Development Setup
1. Install Bun: `curl -fsSL https://bun.sh/install | bash`
2. Clone repo: `git clone ...`
3. Install deps: `bun install`
4. Setup DB: `bun run db:push`
5. Start dev: `bun run dev`

## Code Standards
- TypeScript strict mode
- ESLint rules enforced
- Prettier for formatting
- All PRs require tests

## Testing
\`\`\`bash
bun run test           # Run tests
bun run test:coverage  # Coverage report
\`\`\`

## Pull Request Process
1. Fork the repository
2. Create feature branch: `git checkout -b feature/my-feature`
3. Write tests for new features
4. Ensure all tests pass
5. Submit PR with clear description
```

---

#### 7.4: Add Examples
**File:** `examples/01-basic-agent.ts`
```typescript
/**
 * Example: Create and run a basic research agent
 */

async function basicAgentExample() {
  // Create agent
  const agent = await fetch('http://localhost:3000/api/agent/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Research Agent',
      goal: 'Research quantum computing trends in 2026',
      tools: ['search', 'write', 'browser'],
      role: 'researcher',
      maxSteps: 10,
    }),
  }).then(r => r.json());

  console.log('Created agent:', agent.id);

  // Run agent
  const run = await fetch('http://localhost:3000/api/agent/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentId: agent.id }),
  }).then(r => r.json());

  console.log('Started run:', run.runId);

  // Stream results
  const eventSource = new EventSource(
    `http://localhost:3000/api/agent/stream?runId=${run.runId}`
  );

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log(`[${data.type}]`, data.message);
  };
}
```

**Add 5-10 more examples for:**
- Multi-agent orchestration
- Policy configuration
- Memory usage
- Hermes query algebra
- Meridian UI integration

---

### Phase 7 Success Criteria
- ✅ API_REFERENCE.md complete (all 49 endpoints)
- ✅ DEPLOYMENT.md with step-by-step guide
- ✅ CONTRIBUTING.md with development setup
- ✅ 10+ working examples in `examples/` directory
- ✅ README.md updated with badges (build status, coverage)

---

## Phase 8: Load Testing & Optimization (Days 15-17) ⚡

**Goal:** Validate performance under load, optimize bottlenecks  
**Time Estimate:** 18-24 hours  
**Dependencies:** Phase 0-7 complete

### Tasks

#### 8.1: Setup Load Testing
**Install:**
```bash
bun add -D autocannon
```

**File:** `scripts/load-test.ts`
```typescript
import autocannon from 'autocannon';

async function loadTest() {
  const result = await autocannon({
    url: 'http://localhost:3000/api/agent/list',
    connections: 100,
    duration: 30,
    pipelining: 1,
  });

  console.log('Requests/sec:', result.requests.mean);
  console.log('Latency (ms):', result.latency.mean);
  console.log('Errors:', result.errors);
}

loadTest();
```

**Run load tests:**
```bash
bun scripts/load-test.ts
```

---

#### 8.2: Profile Hermes Kernel Performance
**File:** `src/lib/hermes/__tests__/performance.test.ts`
```typescript
import { performance } from 'perf_hooks';
import { initializeKernel } from '../kernel-spine/kernel';

describe('Hermes Performance', () => {
  it('should handle 1000 events in <1 second', () => {
    const kernel = initializeKernel({ runId: 'perf-test' });
    
    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      kernel.emit({ type: 'TELEMETRY', data: { index: i } });
    }
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(1000);  // <1s for 1000 events
  });

  it('should compute frontier in <100ms for 500-event graph', () => {
    const kernel = initializeKernel({ runId: 'frontier-test' });
    
    // Build 500-event graph
    for (let i = 0; i < 500; i++) {
      kernel.emit({ type: 'MODEL', data: { step: i } });
    }
    
    const start = performance.now();
    const frontier = kernel.computeFrontier();
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(100);  // <100ms
    expect(frontier.length).toBeGreaterThan(0);
  });
});
```

---

#### 8.3: Optimize Database Queries
**Add connection pooling:**
```typescript
// src/lib/db.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Connection pooling for production
    ...(process.env.NODE_ENV === 'production' && {
      datasources: {
        db: {
          url: `${process.env.DATABASE_URL}?connection_limit=10&pool_timeout=20`,
        },
      },
    }),
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
```

---

#### 8.4: Add Caching Layer
**File:** `src/lib/cache.ts`
```typescript
import { LRUCache } from 'lru-cache';

const cache = new LRUCache<string, any>({
  max: 500,
  ttl: 1000 * 60 * 5,  // 5 minutes
});

export function cacheGet<T>(key: string): T | undefined {
  return cache.get(key) as T;
}

export function cacheSet<T>(key: string, value: T): void {
  cache.set(key, value);
}

export function cacheClear(): void {
  cache.clear();
}
```

**Apply to expensive queries:**
```typescript
// src/app/api/agent/list/route.ts
import { cacheGet, cacheSet } from '@/lib/cache';

export async function GET() {
  const cacheKey = 'agents:list';
  const cached = cacheGet(cacheKey);
  if (cached) return NextResponse.json(cached);
  
  const agents = await db.agent.findMany();
  cacheSet(cacheKey, agents);
  return NextResponse.json(agents);
}
```

---

### Phase 8 Success Criteria
- ✅ Load test: 100+ req/sec sustained for 30 seconds
- ✅ Hermes kernel: 1000 events/sec
- ✅ Frontier computation: <100ms for 500-event graphs
- ✅ Average API latency: <50ms (P50), <200ms (P99)
- ✅ No memory leaks under sustained load

---

## Summary Timeline

| Phase | Duration | Critical Path | Can Parallelize |
|-------|----------|---------------|-----------------|
| **Phase 0: Emergency Fixes** | 4-6 hrs | ✅ Yes | ❌ |
| **Phase 1: Code Cleanup** | 6-8 hrs | ✅ Yes | ❌ |
| **Phase 2: Meridian UI Decision** | 4-6 hrs | ⚠️ Depends on decision | ❌ |
| **Phase 3: Testing Foundation** | 12-16 hrs | ✅ Yes | ✅ Can start after Phase 1 |
| **Phase 4: Security Hardening** | 12-16 hrs | ✅ Yes | ✅ Can start after Phase 1 |
| **Phase 5: Production Readiness** | 18-24 hrs | ✅ Yes | ✅ Can start after Phase 4 |
| **Phase 6: Database Migration** | 10-14 hrs | ⚠️ Optional for now | ✅ Can defer |
| **Phase 7: Documentation** | 12-16 hrs | ❌ Not blocking | ✅ Can parallelize |
| **Phase 8: Load Testing** | 18-24 hrs | ⚠️ Pre-production | ✅ After Phase 5 |

**Total Sequential Time:** ~20-25 days (1 FTE)  
**With Parallelization:** ~12-15 days (2 FTEs)  
**Critical Path Only:** ~8-10 days (Phases 0, 1, 3, 4, 5)

---

## Execution Priority Matrix

### 🔴 MUST DO (Blocks Production)
- Phase 0: Emergency Fixes
- Phase 1: Code Cleanup
- Phase 3: Testing Foundation
- Phase 4: Security Hardening
- Phase 5: Production Readiness

### 🟡 SHOULD DO (Production-Adjacent)
- Phase 2: Meridian UI Decision (resolve before v1.0)
- Phase 6: Database Migration (before scaling)
- Phase 8: Load Testing (before production launch)

### 🟢 NICE TO HAVE (Polish)
- Phase 7: Documentation (can be ongoing)
- Additional examples
- Advanced monitoring

---

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Build still fails after Phase 0 | Medium | High | Allocate 1 day buffer for debugging |
| Meridian UI integration takes longer | High | Medium | Start Phase 2 decision early |
| Load testing reveals bottlenecks | High | High | Phase 8 buffer time allocated |
| PostgreSQL migration breaks features | Medium | High | Test on staging first, rollback plan |
| Auth breaks existing API clients | Low | Medium | Feature flag auth during transition |

---

## Success Metrics

**Phase 0 Complete:**
- ✅ Build succeeds
- ✅ Git clean status
- ✅ Lint passes

**Production Ready (Phases 0-5):**
- ✅ All tests passing
- ✅ Auth functional
- ✅ Docker deployable
- ✅ Health check returns 200
- ✅ CI pipeline green

**v1.0 Launch Ready (All Phases):**
- ✅ Load test: 100+ req/sec
- ✅ Documentation complete
- ✅ PostgreSQL migrated
- ✅ Monitoring active
- ✅ Zero critical issues

---

## Post-Launch Roadmap (Phase 9+)

**Phase 9: Monitoring & Observability** (Week 4)
- Add OpenTelemetry instrumentation
- Setup Grafana dashboards
- Configure alerting (PagerDuty/Slack)

**Phase 10: Advanced Features** (Week 5-6)
- Workflow Studio module
- Agent marketplace
- Plugin system

**Phase 11: Scale & Optimize** (Ongoing)
- Multi-region deployment
- Redis caching layer
- Event streaming (Kafka/NATS)

---

**End of Remediation Plan**

*Execute phases sequentially or parallelize where noted. Adjust timeline based on team size and priorities.*
