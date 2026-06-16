import { getZAI } from "./zai-client";
import { AgentAction, AgentTool, MemoryEntry, ActionSchema, BuildAgentSchema } from "./types";

// ============ Action Planning ============

export async function plan(
  goal: string,
  context: MemoryEntry[],
  tools: AgentTool[],
  personality: string = "helpful assistant"
): Promise<AgentAction> {
  const zai = await getZAI();

  const toolList = tools.join(", ");

  // Truncate context to prevent token overflow
  const truncatedContext = context.length > 10
    ? [
        ...context.slice(0, 5).map(h => ({ step: h.step, tool: h.action.tool, input: h.action.input.substring(0, 100), result: h.result.substring(0, 100) })),
        { note: `... ${context.length - 10} steps omitted ...` },
        ...context.slice(-5).map(h => ({ step: h.step, tool: h.action.tool, input: h.action.input.substring(0, 100), result: h.result.substring(0, 100) })),
      ]
    : context.map(h => ({ step: h.step, tool: h.action.tool, input: h.action.input.substring(0, 200), result: h.result.substring(0, 200) }));

  const prompt = `You are an autonomous AI agent with the following personality: ${personality}

Goal: ${goal}

Available tools: ${toolList}

Context (what you've done so far):
${truncatedContext.length > 0 ? JSON.stringify(truncatedContext, null, 2) : "No actions taken yet."}

Decide the NEXT action to accomplish the goal.

IMPORTANT RULES:
- Choose ONE tool and provide a clear, specific input
- If the goal is already accomplished, use "finish" with a summary
- Be strategic - think about what information or action would best advance the goal
- Each action should build on previous results

Respond ONLY with valid JSON in this exact format:
{"tool": "search|write|code|browser|finish", "input": "what to do"}`;

  try {
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "system", content: "You are an AI agent planner. You always respond with valid JSON only. No markdown, no explanation, just JSON." },
        { role: "user", content: prompt },
      ],
      thinking: { type: "disabled" },
    });

    const content = completion.choices[0]?.message?.content || "";

    // FIX C05: Multi-strategy JSON extraction with zod validation
    return extractAction(content, tools);
  } catch (error) {
    console.error("Planner error:", error);
    return { tool: "finish", input: "Unable to plan next action due to an error." };
  }
}

// Robust action extraction from LLM output
function extractAction(content: string, availableTools: AgentTool[]): AgentAction {
  // Strategy 1: Direct JSON parse
  try {
    const parsed = JSON.parse(content.trim());
    const validated = ActionSchema.safeParse(parsed);
    if (validated.success) {
      return validated.data;
    }
  } catch {}

  // Strategy 2: Extract from markdown code block
  const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      const parsed = JSON.parse(codeBlockMatch[1].trim());
      const validated = ActionSchema.safeParse(parsed);
      if (validated.success) {
        return validated.data;
      }
    } catch {}
  }

  // Strategy 3: Find last JSON object (greedy, handles nested)
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      const validated = ActionSchema.safeParse(parsed);
      if (validated.success) {
        return validated.data;
      }
    } catch {}
  }

  // Strategy 4: Try to infer action from text
  const toolMention = availableTools.find(tool =>
    content.toLowerCase().includes(`"${tool}"`) ||
    content.toLowerCase().includes(`'${tool}'`) ||
    content.toLowerCase().includes(`tool: ${tool}`)
  );
  if (toolMention) {
    return { tool: toolMention, input: content.substring(0, 500) };
  }

  // Fallback: finish with available info
  return { tool: "finish", input: "Could not parse a valid action from the LLM response. Completing with available information." };
}

// ============ Builder Agent ============

export async function buildAgent(userInput: string): Promise<{
  name: string;
  goal: string;
  personality: string;
  tools: AgentTool[];
  memory: { shortTerm: boolean; longTerm: boolean };
  loop: { maxSteps: number; autoRun: boolean };
  outputs: { format: "text" | "json" | "markdown" };
}> {
  const zai = await getZAI();

  const prompt = `You are an AI Agent Architect. Your job is to DESIGN an AI agent configuration based on user intent.

User request: "${userInput}"

Analyze what the user wants and design the perfect agent. Ask yourself:
- What is the primary goal?
- What tools are needed? (search, write, code, browser)
- Does it need short-term and/or long-term memory?
- How many steps might it need?
- Should it run automatically?
- What personality would work best?
- What output format is most useful?

Respond ONLY with valid JSON:
{
  "name": "short descriptive name",
  "goal": "clear, specific goal statement",
  "personality": "personality description",
  "tools": ["search", "write", "code", "browser"],
  "memory": {
    "shortTerm": true,
    "longTerm": false
  },
  "loop": {
    "maxSteps": 5,
    "autoRun": true
  },
  "outputs": {
    "format": "markdown"
  }
}`;

  // Fallback config
  const fallbackConfig = {
    name: "Custom Agent",
    goal: userInput,
    personality: "helpful assistant",
    tools: ["search", "write"] as AgentTool[],
    memory: { shortTerm: true, longTerm: false },
    loop: { maxSteps: 5, autoRun: true },
    outputs: { format: "markdown" as const },
  };

  try {
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "system", content: "You are an AI Agent Architect. You design agent configurations. Always respond with valid JSON only. No markdown, no explanation." },
        { role: "user", content: prompt },
      ],
      thinking: { type: "disabled" },
    });

    const content = completion.choices[0]?.message?.content || "";

    // FIX C05 + C12: Multi-strategy extraction with zod validation
    // Strategy 1: Direct parse
    try {
      const parsed = JSON.parse(content.trim());
      const validated = BuildAgentSchema.safeParse(parsed);
      if (validated.success) {
        return validated.data;
      }
    } catch {}

    // Strategy 2: Code block extraction
    const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      try {
        const parsed = JSON.parse(codeBlockMatch[1].trim());
        const validated = BuildAgentSchema.safeParse(parsed);
        if (validated.success) {
          return validated.data;
        }
      } catch {}
    }

    // Strategy 3: Greedy JSON extraction
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        const validated = BuildAgentSchema.safeParse(parsed);
        if (validated.success) {
          return validated.data;
        }
      } catch {}
    }

    return fallbackConfig;
  } catch (error) {
    console.error("Builder error:", error);
    return fallbackConfig;
  }
}
