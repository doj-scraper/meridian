import { runAgent, addEventListener } from "../src/lib/agent/agent";
import { AgentConfig } from "../src/lib/agent/types";
import { db } from "../src/lib/db";

async function main() {
  console.log("Setting up a basic agent run...");

  // 1. Create a dummy agent in the database to associate the run with
  const agent = await db.agent.create({
    data: {
      name: "Simple Q&A Agent",
      goal: "Answer basic questions",
      tools: "search,write",
      maxSteps: 5,
    },
  });

  // 2. Create an agent run record
  const run = await db.agentRun.create({
    data: {
      agentId: agent.id,
      status: "running",
    },
  });

  // 3. Define the configuration for execution
  const config: AgentConfig = {
    id: agent.id,
    name: agent.name,
    goal: "What is the capital of France?",
    personality: "helpful assistant",
    tools: ["search", "write"],
    memory: {
      shortTerm: true,
      longTerm: false,
    },
    loop: {
      maxSteps: 5,
      autoRun: true,
    },
    outputs: {
      format: "text",
    },
    role: "general",
    model: "gemini-2.5-pro",
    orchestrationMode: "single",
  };

  // 4. Register event listener to stream thinking/actions
  addEventListener(run.id, (event) => {
    console.log(`[Event: ${event.type}] ${event.message || ""}`);
    if (event.data) {
      console.log("Data:", JSON.stringify(event.data, null, 2));
    }
  });

  try {
    // 5. Execute the agent run
    const result = await runAgent(run.id, config);
    console.log("\nRun finished successfully!");
    console.log("Result:", result);
  } catch (error) {
    console.error("Run failed:", error);
  } finally {
    // Cleanup test records
    await db.agentRun.delete({ where: { id: run.id } }).catch(() => {});
    await db.agent.delete({ where: { id: agent.id } }).catch(() => {});
    await db.$disconnect();
  }
}

main().catch(console.error);
