# Meridian Remediation — Quick Start Checklist

**Use this checklist to track progress through the remediation plan.**

---

## Phase 0: Emergency Fixes (Day 1) ⚠️

- [x] **0.1:** Fix git directory corruption
  - [x] `git rm --cached meridianruntime`
  - [x] `rm -rf meridianRuntime`
  - [x] Add to `.gitignore`
  - [x] Commit changes
  - [x] Verify: `git status` clean

- [x] **0.2:** Fix submodule issue
  - [x] Choose: commit or remove `upload/devAgenticPipeline/devAgenticPipeline`
  - [x] Execute chosen option
  - [x] Verify: `git submodule status` clean

- [x] **0.3:** Fix workspace root detection
  - [x] Update `next.config.ts` with `turbopack.root`
  - [x] Verify: no workspace warnings

- [x] **0.4:** Fix build memory/timeout
  - [x] Update `package.json` build script with `NODE_OPTIONS`
  - [x] Test: `bun run build` succeeds
  - [x] Verify: `.next/standalone/server.js` exists

- [x] **0.5:** Fix ESLint configuration
  - [x] Update `eslint.config.mjs` to flat config
  - [x] Test: `bun run lint` succeeds

✅ **Phase 0 Complete:** Build works, git clean, lint passes

---

## Phase 1: Code Cleanup (Day 2) 🧹

- [x] **1.1:** Remove legacy component files
  - [x] Delete 5 duplicate files from `src/components/`
  - [x] Verify: `bun run build` still succeeds

- [x] **1.2:** Sync Prisma database
  - [x] Run: `bun run db:generate`
  - [x] Run: `bun run db:push`
  - [x] Verify: `sqlite3 db/custom.db ".tables"` shows all models

- [x] **1.3:** Create environment template
  - [x] Create `.env.example` with all required variables
  - [x] Verify: can copy to `.env.test` and app starts

- [x] **1.4:** Document API routes (optional)
  - [x] Start `API_REFERENCE.md` (complete in Phase 7)

✅ **Phase 1 Complete:** Clean codebase, database synced

---

## Phase 2: Meridian UI Decision (Day 3) 🤔

- [x] **Decision Made:**
  - [ ] Option A: Full integration (3-5 days)
  - [x] Option B: Separate `/meridian` route (1-2 days) ← Recommended
  - [ ] Option C: Remove Meridian UI (2-4 hours)

**If Option B chosen:**
- [x] **2.1:** Create `src/app/meridian/page.tsx`
- [x] **2.2:** Add navigation buttons between UIs
- [x] **2.3:** Wire 5 core widgets to real data
  - [x] Agents widget
  - [x] Memory widget
  - [x] Timeline widget
  - [x] Workflow widget
  - [x] Inference widget

✅ **Phase 2 Complete:** Meridian UI accessible and functional

---

## Phase 3: Testing Foundation (Days 4-5) 🧪

- [x] **3.1:** Setup testing infrastructure
  - [x] Install: `bun add -D vitest @vitest/ui @testing-library/react`
  - [x] Create: `vitest.config.ts`
  - [x] Create: `test/setup.ts`
  - [x] Add test script to `package.json`

- [x] **3.2:** Test Hermes kernel invariants
  - [x] 3 tests: kernel inversion, causal ordering, determinism

- [x] **3.3:** Test orchestration modes
  - [x] 2 tests: single-agent, sequential handoffs

- [x] **3.4:** Test policy engine
  - [x] 2 tests: block high-risk, allow low-risk

- [x] **3.5:** Test API routes (smoke tests)
  - [x] 2 tests: create agent, list agents

- [x] Verify: `bun run test` passes (15+ tests)

✅ **Phase 3 Complete:** Test suite passing with >50% coverage

---

## Phase 4: Security Hardening (Days 6-7) 🔒

- [ ] **4.1:** Activate NextAuth.js
  - [ ] Create `src/app/api/auth/[...nextauth]/route.ts`
  - [ ] Create `src/middleware.ts` for protected routes
  - [ ] Add auth env vars to `.env.example`
  - [ ] Test: login/logout works

- [ ] **4.2:** Add rate limiting
  - [ ] Install: `bun add @upstash/ratelimit @upstash/redis`
  - [ ] Create: `src/lib/rate-limit.ts`
  - [ ] Apply to 5 high-traffic routes
  - [ ] Test: rate limit triggers

- [ ] **4.3:** Add input validation
  - [ ] Create: `src/lib/validation.ts`
  - [ ] Apply to all POST/PUT routes
  - [ ] Test: validation rejects bad input

- [ ] **4.4:** Add CORS configuration
  - [ ] Update `src/middleware.ts` with CORS headers
  - [ ] Test: CORS headers present

✅ **Phase 4 Complete:** Auth active, rate limits enforced, validation working

---

## Phase 5: Production Readiness (Days 8-10) 🚀

- [ ] **5.1:** Create Dockerfile
  - [ ] Create: `Dockerfile` with multi-stage build
  - [ ] Create: `docker-compose.yml`
  - [ ] Test: `docker build -t meridian .` succeeds
  - [ ] Test: `docker-compose up` runs app

- [ ] **5.2:** Add health check endpoint
  - [ ] Create: `src/app/api/health/route.ts`
  - [ ] Test: `curl localhost:3000/api/health` returns 200

- [ ] **5.3:** Add GitHub Actions CI/CD
  - [ ] Create: `.github/workflows/ci.yml`
  - [ ] Push to GitHub
  - [ ] Verify: CI pipeline passes

- [ ] **5.4:** Add logging and monitoring
  - [ ] Install: `bun add pino`
  - [ ] Create: `src/lib/logger.ts`
  - [ ] Apply to 5 critical routes
  - [ ] Verify: logs appear in console

✅ **Phase 5 Complete:** Docker works, CI passes, monitoring active

---

## Phase 6: Database Migration (Days 11-12) 🗄️ (Optional)

- [ ] **6.1:** Update Prisma schema for PostgreSQL
  - [ ] Change provider to `postgresql`
  - [ ] Add indexes for performance

- [ ] **6.2:** Create migration script
  - [ ] Create: `scripts/migrate-to-postgres.ts`
  - [ ] Test on staging data

- [ ] **6.3:** Update environment for Postgres
  - [ ] Add `POSTGRES_URL` to `.env.example`

- [ ] Test: application works with PostgreSQL

✅ **Phase 6 Complete:** PostgreSQL migration successful

---

## Phase 7: Documentation & Polish (Days 13-14) 📚

- [ ] **7.1:** Complete API reference
  - [ ] Document all 49 endpoints in `API_REFERENCE.md`
  - [ ] Add example curl commands

- [ ] **7.2:** Create deployment guide
  - [ ] Create: `DEPLOYMENT.md`
  - [ ] Step-by-step production deployment

- [ ] **7.3:** Create contributing guide
  - [ ] Create: `CONTRIBUTING.md`
  - [ ] Development setup instructions

- [ ] **7.4:** Add examples
  - [ ] Create: `examples/01-basic-agent.ts`
  - [ ] Create: 5-10 more examples

✅ **Phase 7 Complete:** Documentation comprehensive

---

## Phase 8: Load Testing & Optimization (Days 15-17) ⚡

- [ ] **8.1:** Setup load testing
  - [ ] Install: `bun add -D autocannon`
  - [ ] Create: `scripts/load-test.ts`
  - [ ] Run load test

- [ ] **8.2:** Profile Hermes kernel
  - [ ] Create: performance tests
  - [ ] Verify: 1000 events/sec

- [ ] **8.3:** Optimize database queries
  - [ ] Add connection pooling
  - [ ] Add indexes

- [ ] **8.4:** Add caching layer
  - [ ] Install: `bun add lru-cache`
  - [ ] Create: `src/lib/cache.ts`
  - [ ] Apply to expensive queries

- [ ] Verify: 100+ req/sec sustained, <50ms P50 latency

✅ **Phase 8 Complete:** Performance optimized

---

## Production Launch Checklist ✈️

### Pre-Launch
- [ ] All tests passing
- [ ] Build succeeds
- [ ] Docker image tested
- [ ] Health check works
- [ ] CI pipeline green
- [ ] Auth functional
- [ ] Rate limiting active
- [ ] Documentation complete

### Launch Day
- [ ] Deploy to production
- [ ] Verify health check
- [ ] Monitor logs
- [ ] Test critical user flows
- [ ] Setup alerts

### Post-Launch (First Week)
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Gather user feedback
- [ ] Fix critical bugs

---

## Quick Commands Reference

```bash
# Phase 0
git status
bun run build
bun run lint

# Phase 1
bun run db:push
bun run db:generate

# Phase 3
bun run test
bun run test:coverage

# Phase 5
docker build -t meridian .
docker-compose up
curl localhost:3000/api/health

# Phase 8
bun scripts/load-test.ts
```

---

**Track Progress:**
- Phase 0: ✅ Emergency Fixes
- Phase 1: ✅ Code Cleanup
- Phase 2: ✅ Meridian UI Decision
- Phase 3: ✅ Testing Foundation
- Phase 4: ⬜ Security Hardening
- Phase 5: ⬜ Production Readiness
- Phase 6: ⬜ Database Migration (Optional)
- Phase 7: ⬜ Documentation
- Phase 8: ⬜ Load Testing

Replace ⬜ with ✅ as you complete each phase.
