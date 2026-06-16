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
```json
{
  "name": "Research Agent",
  "goal": "Research quantum computing topics",
  "personality": "analytical and thorough",
  "tools": ["search", "write", "browser"],
  "role": "researcher",
  "model": "gemini-2.5-pro",
  "maxSteps": 10
}
```

**Response:** `200 OK`
```json
{
  "id": "cm1x2y3z4",
  "name": "Research Agent",
  "goal": "Research quantum computing topics",
  "status": "idle",
  "createdAt": "2026-06-16T04:00:00.000Z"
}
```
