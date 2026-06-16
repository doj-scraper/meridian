import { describe, it, expect, beforeAll } from 'vitest';
import { POST as createAgent } from '../agent/create/route';
import { GET as listAgents } from '../agent/list/route';
import { db } from '@/lib/db';

describe('Agent API Smoke Tests', () => {
  beforeAll(async () => {
    // Clear agents created in previous test runs to have a clean environment
    await db.agent.deleteMany({});
  });

  it('POST /api/agent/create should create a new agent in the database', async () => {
    const request = new Request('http://localhost:3000/api/agent/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Agent API',
        goal: 'To verify that the creation endpoint works',
        role: 'executor',
        tools: ['search', 'write'],
      }),
    });

    const response = await createAgent(request as any);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.id).toBeDefined();
    expect(data.name).toBe('Test Agent API');
    expect(data.goal).toBe('To verify that the creation endpoint works');
    expect(data.role).toBe('executor');
    expect(data.tools).toEqual(['search', 'write']);
  });

  it('POST /api/agent/create should reject requests without name', async () => {
    const request = new Request('http://localhost:3000/api/agent/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        goal: 'Goal without name',
      }),
    });

    const response = await createAgent(request as any);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe('Name and goal are required');
  });

  it('POST /api/agent/create should reject requests without goal', async () => {
    const request = new Request('http://localhost:3000/api/agent/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Agent without goal',
      }),
    });

    const response = await createAgent(request as any);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe('Name and goal are required');
  });

  it('GET /api/agent/list should return a list of agents', async () => {
    const response = await listAgents();
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0].name).toBe('Test Agent API');
  });
});
