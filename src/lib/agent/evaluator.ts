import { getZAI } from "./zai-client";
import { MemoryEntry } from "./types";

export async function evaluate(
  goal: string,
  history: MemoryEntry[]
): Promise<boolean> {
  // If the last action was "finish", we're done
  if (history.length > 0) {
    const lastAction = history[history.length - 1];
    if (lastAction.action.tool === "finish") {
      return true;
    }
  }

  // If we have substantial history, use LLM to evaluate
  if (history.length >= 2) {
    const zai = await getZAI();

    const prompt = `You are evaluating whether an AI agent has completed its goal.

Goal: ${goal}

Agent History:
${JSON.stringify(
  history.map((h) => ({
    step: h.step,
    tool: h.action.tool,
    input: h.action.input,
    result: h.result.substring(0, 200),
  })),
  null,
  2
)}

Has the goal been accomplished? Consider:
- Has sufficient information been gathered?
- Has the required content been generated?
- Are there clear next steps, or does it seem complete?

Respond with ONLY "true" or "false".`;

    try {
      const completion = await zai.chat.completions.create({
        messages: [
          { role: "system", content: "You evaluate if AI agent goals are complete. Respond with only true or false." },
          { role: "user", content: prompt },
        ],
        thinking: { type: "disabled" },
      });

      const content = completion.choices[0]?.message?.content?.toLowerCase().trim() || "";
      // FIX C11: Strict boolean matching — don't match "untrue", "not true", etc.
      return /^(true|yes|1)$/i.test(content);
    } catch (error) {
      console.error("Evaluator error:", error);
      return false;
    }
  }

  return false;
}
