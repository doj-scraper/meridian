# Directory Structure

## Root Level (Essential Files Only)

```
meridian/
├── README.md                    # Project overview
├── AGENTS.md                    # Agent system reference
├── ARCHITECTURE.md              # System architecture
├── package.json                 # Dependencies
├── tsconfig.json               # TypeScript config
├── next.config.ts              # Next.js config
├── tailwind.config.ts          # Tailwind CSS config
├── eslint.config.mjs           # ESLint config
├── vitest.config.ts            # Test config
├── postcss.config.mjs          # PostCSS config
├── components.json             # shadcn/ui config
├── vercel.json                 # Vercel deployment config
├── Dockerfile                  # Docker image
├── docker-compose.yml          # Docker compose
├── Caddyfile                   # Caddy reverse proxy
├── .env.example               # Environment template
├── .gitignore                 # Git ignore rules
└── .nvmrc                     # Node version
```

## Source Code

```
src/
├── app/                        # Next.js app router pages
├── components/                 # React components
├── lib/                        # Core logic
│   └── agent/                 # Agent system
│       ├── llm-router.ts      # Multi-provider LLM router
│       └── zai-client.ts      # AI client with router
├── store/                      # State management
└── hooks/                      # React hooks
```

## Documentation

```
docs/
├── API_REFERENCE.md            # Complete API documentation (49 endpoints)
├── CONTRIBUTING.md             # Contribution guidelines
├── CASESTUDY.md               # Case study documentation
├── MERIDIAN_RUNTIME.md        # Runtime system docs
├── worklog.md                 # Development log
│
├── deployment/                 # Deployment guides
│   ├── DEPLOY_NOW.md          # Quick deployment guide
│   ├── VERCEL_DEPLOYMENT.md   # Vercel detailed guide
│   ├── PRE_DEPLOYMENT_CHECKLIST.md
│   ├── DEPLOYMENT.md
│   ├── Z_AI_REMOVED.md        # Z-AI removal notes
│   └── ROUTER_INTEGRATED.md   # Router integration guide
│
└── images/                     # Documentation images
    ├── meridian-v2.png
    ├── meridian-float.png
    ├── meridian-refined.png
    ├── meridian-initial.png
    ├── meridian-expanded.png
    └── hermes-verification.png
```

## Deprecated Files (Preserved)

```
DEPRECATED/
├── V2_ENTERPRISE_UPGRADE_PLAN.md
├── V2_UPGRADE_PLAN.md
├── REMEDIATION_PLAN.md
├── MERIDIAN_RUNTIME_PLAN.md
├── HERMES_UI_REALIGNMENT_PLAN.md
├── CHECKLIST.md
├── tool-results/              # AI tool execution logs
├── agent-ctx/                 # Agent context files
├── upload/                    # Uploaded files
├── download/                  # Downloaded files
├── New Folder/                # Temp HTML files
└── *.log                      # Development logs
```

## Infrastructure

```
prisma/
└── schema.prisma              # Database schema

db/
└── custom.db                  # SQLite database

test/
├── setup.ts                   # Test setup
└── api/                       # API tests
    ├── agent.test.ts
    ├── team.test.ts
    └── validation.test.ts

examples/
├── 01-basic-agent.ts
└── websocket/

.github/
└── workflows/                 # CI/CD pipelines

.zscripts/                     # Build scripts
├── dev.sh
├── build.sh
└── start.sh
```

## Key Changes

### ✅ Organized
- Essential config files at root
- Documentation in `docs/`
- Old plans in `DEPRECATED/` (preserved, not deleted)
- Deployment guides in `docs/deployment/`
- Images in `docs/images/`

### ✅ Top-Level Documents
Only these 3 docs remain at root as requested:
- `README.md` - Project overview
- `AGENTS.md` - Agent system reference  
- `ARCHITECTURE.md` - System architecture

### ✅ Preserved
All files moved to `DEPRECATED/`, **nothing deleted**:
- Old upgrade plans
- Tool execution logs
- Agent context files
- Upload/download folders
- Development logs

## Navigation

### For New Developers
1. Start with `README.md`
2. Read `ARCHITECTURE.md` for system design
3. Read `AGENTS.md` for agent system details
4. Check `docs/API_REFERENCE.md` for API endpoints

### For Deployment
1. `docs/deployment/DEPLOY_NOW.md` - Quick start
2. `docs/deployment/VERCEL_DEPLOYMENT.md` - Detailed guide
3. `docs/deployment/PRE_DEPLOYMENT_CHECKLIST.md` - Checklist

### For Historical Context
1. `DEPRECATED/REMEDIATION_PLAN.md` - Original cleanup plan
2. `DEPRECATED/V2_UPGRADE_PLAN.md` - V2 upgrade notes
3. `docs/worklog.md` - Development history

---

**Status:** ✅ Directory cleaned and organized. All files preserved in `DEPRECATED/`.
