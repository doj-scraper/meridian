# Meridian Documentation

This directory contains comprehensive documentation for the Meridian Agent Studio OS platform.

---

## 📊 Assessment & Analysis Documents

### MERIDIAN_ASSESSMENT.html
**Interactive Technical Assessment Dashboard**
- Neo-brutalist dark design with live metrics
- System maturity score: 92.0%
- 5-module breakdown with LOC counts
- API coverage matrix (49 endpoints)
- Development roadmap Q3-Q4 2026
- **Purpose:** Executive overview and technical deep-dive
- **View:** Open in browser (requires ELK.js CDN)

### MERIDIAN_CASE_STUDY.html
**Academic Research Paper**
- ~1085 lines of scholarly text
- Formatted as PhD-level computer science paper
- Complete with abstract, methodology, evaluation, and references
- Focus: Event-driven substrate for multi-agent orchestration
- Suitable for: Academic publication, conference submission, investor pitch
- **Purpose:** Position Meridian as first-of-its-kind system
- **View:** Open in browser (optimized for reading/printing)

### MERIDIAN_DIAGRAMS_EXTENDED.html
**Architecture Diagram Reference**
- 5 interactive diagrams using ELK.js layout engine:
  1. Agent Execution State Machine
  2. Hermes Causal DAG Architecture
  3. Policy Engine Decision Flow
  4. 3-Tier Memory Architecture
  5. Multi-Provider Router Flow
- **Purpose:** Visual reference for architecture discussions
- **Referenced by:** Both assessment and case study documents

---

## 📚 Core Documentation

### API_REFERENCE.md
Complete API documentation for all 49 endpoints across 14 route groups:
- Agent Management (11 endpoints)
- Team Orchestration (8 endpoints)
- Template Management (5 endpoints)
- Policy & Governance (4 endpoints)
- Hermes DAG (3 endpoints)
- Memory Operations (3 endpoints)
- Artifacts (2 endpoints)
- Metrics (2 endpoints)
- Timeline (1 endpoint)
- Audit Log (1 endpoint)
- Tools Registry (1 endpoint)
- Triggers (5 endpoints)
- Task Graphs (5 endpoints)
- Providers (1 endpoint)

### DIRECTORY_STRUCTURE.md
Complete project organization guide:
- Root level file inventory
- Module structure
- Documentation hierarchy
- What was moved where during cleanup

---

## 🚀 Deployment Guides

### deployment/DEPLOY_NOW.md
Quick-start deployment guide:
- Environment setup
- Database initialization
- Build process
- Deployment options (Vercel, Docker, Kubernetes)

### deployment/VERCEL_DEPLOYMENT.md
Comprehensive Vercel deployment guide:
- Step-by-step instructions
- Environment variable configuration
- Domain setup
- Troubleshooting

### deployment/PRE_DEPLOYMENT_CHECKLIST.md
Complete pre-deployment verification:
- 47-item checklist across 8 categories
- Environment validation
- Security review
- Performance optimization

### deployment/ROUTER_INTEGRATED.md
LLM Router integration guide:
- ε-Greedy Q-learning configuration
- Provider setup
- Circuit breaker tuning
- Monitoring and telemetry

### deployment/Z_AI_REMOVED.md
Migration notes from z-ai-web-dev-sdk to multi-provider architecture

---

## 📖 System Documentation

### CONTRIBUTING.md
Contribution guidelines for developers

### CASESTUDY.md
Original case study notes (historical reference)

### MERIDIAN_RUNTIME.md
Runtime system documentation

### worklog.md
Development history and change log

---

## 🖼️ Images

### images/
Visual assets for documentation:
- `meridian-v2.png` - Main system diagram
- `meridian-float.png` - Floating UI mockup
- `meridian-refined.png` - Refined design
- `meridian-initial.png` - Initial concept
- `meridian-expanded.png` - Expanded architecture
- `hermes-verification.png` - Hermes DAG visualization
- `agent-studio-hero.png` - Hero image

---

## 🎯 Quick Start

**For Developers:**
1. Read `../README.md` for project overview
2. Check `deployment/DEPLOY_NOW.md` for setup
3. Reference `API_REFERENCE.md` while coding

**For Executives/Investors:**
1. Open `MERIDIAN_ASSESSMENT.html` in browser
2. Review metrics and roadmap
3. Read `MERIDIAN_CASE_STUDY.html` for technical depth

**For Researchers/Academics:**
1. Read `MERIDIAN_CASE_STUDY.html`
2. Reference `MERIDIAN_DIAGRAMS_EXTENDED.html` for architecture
3. Cite as novel event-driven substrate for multi-agent systems

**For DevOps/SRE:**
1. Check `deployment/PRE_DEPLOYMENT_CHECKLIST.md`
2. Follow `deployment/VERCEL_DEPLOYMENT.md` or Docker guide
3. Configure monitoring per `deployment/ROUTER_INTEGRATED.md`

---

## 📝 Document Formats

- **`.html`** - Interactive browser documents with styling
- **`.md`** - Markdown text documents (GitHub-compatible)
- **`.png`** - Image assets

All HTML documents use the same neo-brutalist design system:
- Dark theme (#05070a / #0f141b backgrounds)
- Amber (#ffd60a) and cyan (#00d1ff) accents
- IBM Plex Mono font
- Hard shadows, no border-radius
- Scanline overlay + data grid background

---

## 🔗 External Dependencies

HTML documents require CDN access:
- **ELK.js** (v0.9.3) - Graph layout engine for diagrams
- **Google Fonts** - IBM Plex Mono, Barlow, Crimson Pro

All documents work offline except for font rendering and diagram layout.

---

**Last Updated:** June 16, 2026  
**Documentation Version:** 1.0.0  
**Platform Version:** Meridian Agent Studio OS (92% maturity)
