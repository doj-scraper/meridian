# Task 6 - Phase 3 Backend Engine Files

## Summary
Created the Phase 3 backend engine files: Policy Engine, Metrics Collector, System State Manager, and all governance API routes.

## Files Created

### Core Libraries
1. **`src/lib/agent/policy.ts`** - Policy engine with:
   - `PolicyEngine.check()` - Evaluates tool calls against policies in priority order
   - `PolicyEngine.createPolicy()` / `listPolicies()` / `updatePolicy()` / `deletePolicy()` - CRUD operations
   - `PolicyEngine.requestApproval()` / `respondApproval()` / `listPendingApprovals()` - Approval workflow
   - `PolicyEngine.seedDefaults()` - Seeds default policies on first run
   - `getToolRiskLevel()` helper function
   - `DEFAULT_POLICIES` array with 3 default rules
   - Policy condition matching (tools, roles, riskLevels, agents with wildcard support)
   - Audit logging for policy checks and approvals

2. **`src/lib/agent/metrics.ts`** - Metrics collector with:
   - `MetricsCollector.recordEvent()` - Record timeline events
   - `MetricsCollector.getRunMetrics()` - Per-run aggregated metrics (tokens, latency, tool usage, errors, reflections, policy checks, approvals)
   - `MetricsCollector.getSystemMetrics()` - System-wide metrics (run counts, agent counts, token totals, avg latency, error rate, tool distribution)
   - `MetricsCollector.getRunTimeline()` - Timeline events for a run
   - `MetricsCollector.getAuditLog()` - Filtered audit log entries

3. **`src/lib/agent/system-state.ts`** - System state manager with:
   - `SystemStateManager.getStatus()` - Computes live system status from DB
   - `SystemStateManager.setState()` - Explicitly set system state
   - `SystemStateManager.subscribe()` / unsubscribe for state change listeners
   - State derivation logic (idle, running, waiting_approval)

### API Routes
4. **`src/app/api/policy/list/route.ts`** - GET: list all policy rules
5. **`src/app/api/policy/create/route.ts`** - POST: create a policy rule
6. **`src/app/api/policy/update/route.ts`** - PATCH: update a policy rule
7. **`src/app/api/policy/delete/route.ts`** - DELETE: delete a policy rule
8. **`src/app/api/approval/list/route.ts`** - GET: list pending approval requests
9. **`src/app/api/approval/respond/route.ts`** - POST: respond to an approval
10. **`src/app/api/audit/list/route.ts`** - GET: list audit log entries (with filters)
11. **`src/app/api/metrics/system/route.ts`** - GET: system-wide metrics
12. **`src/app/api/metrics/run/route.ts`** - GET: run-specific metrics
13. **`src/app/api/timeline/route.ts`** - GET: timeline events for a run

## Testing Results
- `bun run lint` passes cleanly (0 errors)
- Policy list/create/tested successfully
- Audit log, system metrics, approval list endpoints verified working
- Server restarted successfully after Prisma client regeneration

## Notes
- Re-uses existing types from `src/lib/agent/types.ts` (RiskLevel, PolicyAction, SystemState)
- Policy engine logs all policy checks and approval actions to AuditLog
- System state manager derives state from live DB data with explicit override support
- Fixed incorrect `event.action` reference in metrics.ts (TimelineEvent has `type`, not `action`)
