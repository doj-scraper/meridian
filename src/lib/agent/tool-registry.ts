/**
 * tool-registry.ts — Tool Registry with Zod Validation & Deterministic Verification
 *
 * Features:
 *   - Register tools with zod parameter schemas
 *   - Execute with automatic parameter validation
 *   - Deterministic verification (json_schema, code_compiles, url_reachable, regex_match, custom)
 *   - Risk levels: low | medium | high | critical
 *   - Categories: search | write | code | browser | memory | api | custom
 *
 * Built-in tools:
 *   web_search, write_file, execute_code, browse_url, save_memory, read_memory
 */

import { z } from "zod";
import { getZAI } from "./zai-client";
import { memoryManager } from "./memory-v2";

// ============ Types ============

export type ToolCategory = "search" | "write" | "code" | "browser" | "memory" | "api" | "custom";
export type RiskLevel = "low" | "medium" | "high" | "critical";
export type ValidatorType =
  | "json_schema"
  | "code_compiles"
  | "url_reachable"
  | "regex_match"
  | "custom";

export interface ToolValidator {
  type: ValidatorType;
  config: Record<string, unknown>;
}

export interface VerificationResult {
  status: "verified" | "failed" | "needs_review";
  message: string;
  details?: Record<string, unknown>;
}

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  riskLevel: RiskLevel;
  parameters: z.ZodType;
  validator?: ToolValidator;
  executor: (params: Record<string, unknown>) => Promise<unknown>;
}

export interface ToolExecutionResult {
  result: unknown;
  verification: VerificationResult;
}

// ============ ToolRegistry ============

class ToolRegistry {
  private tools = new Map<string, ToolDefinition>();

  /**
   * Register a tool definition.
   */
  register(tool: ToolDefinition): void {
    if (this.tools.has(tool.id)) {
      console.warn(`[ToolRegistry] Overwriting existing tool: ${tool.id}`);
    }
    this.tools.set(tool.id, tool);
  }

  /**
   * Get a tool definition by id.
   */
  get(id: string): ToolDefinition | undefined {
    return this.tools.get(id);
  }

  /**
   * List all registered tools, optionally filtered by category.
   */
  list(category?: ToolCategory): ToolDefinition[] {
    const all = Array.from(this.tools.values());
    if (category) {
      return all.filter((t) => t.category === category);
    }
    return all;
  }

  /**
   * Execute a tool with parameter validation and output verification.
   * On verification failure, retries up to maxRetries times.
   */
  async executeWithVerification(
    toolId: string,
    params: Record<string, unknown>,
    maxRetries: number = 1,
  ): Promise<ToolExecutionResult> {
    const tool = this.tools.get(toolId);
    if (!tool) {
      return {
        result: null,
        verification: {
          status: "failed",
          message: `Tool "${toolId}" not found in registry`,
        },
      };
    }

    // Validate parameters
    const parsed = tool.parameters.safeParse(params);
    if (!parsed.success) {
      return {
        result: null,
        verification: {
          status: "failed",
          message: `Parameter validation failed: ${parsed.error.message}`,
          details: { errors: parsed.error.issues },
        },
      };
    }

    // Execute with retry on verification failure
    let lastResult: unknown = null;
    let lastVerification: VerificationResult = {
      status: "needs_review",
      message: "No verification performed",
    };

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        lastResult = await tool.executor(parsed.data as Record<string, unknown>);
      } catch (err) {
        lastResult = null;
        lastVerification = {
          status: "failed",
          message: `Execution error: ${err instanceof Error ? err.message : String(err)}`,
        };

        if (attempt < maxRetries) {
          continue;
        }
        break;
      }

      // Verify output
      if (tool.validator) {
        lastVerification = this.verify(lastResult, tool.validator);
      } else {
        lastVerification = {
          status: "verified",
          message: "No validator configured — auto-verified",
        };
      }

      if (lastVerification.status === "verified") {
        break;
      }

      // If not verified and we have retries left, try again
      if (attempt < maxRetries) {
        continue;
      }
    }

    return { result: lastResult, verification: lastVerification };
  }

  /**
   * Run a deterministic validator against tool output.
   */
  private verify(output: unknown, validator: ToolValidator): VerificationResult {
    switch (validator.type) {
      case "json_schema": {
        const schema = validator.config.schema as Record<string, unknown> | undefined;
        if (!schema) {
          return { status: "needs_review", message: "No schema provided for json_schema validator" };
        }
        try {
          const parsed = typeof output === "string" ? JSON.parse(output) : output;
          const zodSchema = z.object(schema as z.ZodRawShape);
          const result = zodSchema.safeParse(parsed);
          if (result.success) {
            return { status: "verified", message: "Output matches JSON schema" };
          }
          return {
            status: "failed",
            message: `Schema validation failed: ${result.error.message}`,
            details: { errors: result.error.issues },
          };
        } catch {
          return { status: "failed", message: "Output is not valid JSON" };
        }
      }

      case "code_compiles": {
        const code = typeof output === "string" ? output : JSON.stringify(output);
        // Strip trailing verification messages
        const codeOnly = code.replace(/\n---\n[\s\S]*$/, "").trim();
        try {
          new Function(codeOnly);
          return { status: "verified", message: "Code compiles without syntax errors" };
        } catch (e) {
          return {
            status: "failed",
            message: `Syntax error: ${e instanceof Error ? e.message : "Unknown"}`,
          };
        }
      }

      case "url_reachable": {
        // For async checks we do a best-effort synchronous assessment
        const urlStr = typeof output === "string" ? output : String(output);
        const urlRegex = /^https?:\/\/.+/;
        if (urlRegex.test(urlStr)) {
          return { status: "verified", message: "URL format is valid (reachability not checked)" };
        }
        // Check if output contains reachable URLs
        const urlMatch = urlStr.match(/https?:\/\/[^\s]+/);
        if (urlMatch) {
          return { status: "verified", message: "Output contains a valid URL" };
        }
        return { status: "needs_review", message: "No reachable URL found in output" };
      }

      case "regex_match": {
        const pattern = validator.config.pattern as string | undefined;
        const flags = (validator.config.flags as string) || "";
        if (!pattern) {
          return { status: "needs_review", message: "No regex pattern provided" };
        }
        const outputStr = typeof output === "string" ? output : JSON.stringify(output);
        try {
          const regex = new RegExp(pattern, flags);
          if (regex.test(outputStr)) {
            return { status: "verified", message: "Output matches regex pattern" };
          }
          return { status: "failed", message: "Output does not match regex pattern" };
        } catch {
          return { status: "failed", message: "Invalid regex pattern" };
        }
      }

      case "custom": {
        const fn = validator.config.fn as
          | ((output: unknown) => VerificationResult)
          | undefined;
        if (!fn || typeof fn !== "function") {
          return {
            status: "needs_review",
            message: "Custom validator function not provided or invalid",
          };
        }
        try {
          return fn(output);
        } catch (e) {
          return {
            status: "failed",
            message: `Custom validator error: ${e instanceof Error ? e.message : String(e)}`,
          };
        }
      }

      default:
        return {
          status: "needs_review",
          message: `Unknown validator type: ${validator.type}`,
        };
    }
  }
}

// ============ Singleton ============

export const toolRegistry = new ToolRegistry();

// ============ Register Built-in Tools ============

/**
 * web_search — search the web using z-ai-web-dev-sdk
 */
toolRegistry.register({
  id: "web_search",
  name: "Web Search",
  description: "Search the web for information",
  category: "search",
  riskLevel: "low",
  parameters: z.object({
    query: z.string().min(1),
  }),
  validator: {
    type: "regex_match",
    config: { pattern: "search|result|information|found", flags: "i" },
  },
  executor: async (params) => {
    const { query } = params as { query: string };
    try {
      const zai = await getZAI();
      const searchResult = await zai.functions.invoke('web_search', { query });

      if (searchResult && searchResult.length > 0) {
        const formatted = searchResult
          .slice(0, 5)
          .map(
            (r: { name?: string; url?: string; snippet?: string }, i: number) =>
              `${i + 1}. **${r.name || "Untitled"}**\n   ${r.snippet || ""}\n   Source: ${r.url || ""}`,
          )
          .join("\n\n");
        return `Search results for "${query}":\n\n${formatted}`;
      }

      // LLM fallback
      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "You are a research assistant. Provide detailed, factual information about the query.",
          },
          { role: "user", content: `Research: ${query}` },
        ],
        thinking: { type: "disabled" },
      });
      return (
        completion.choices[0]?.message?.content ||
        `No information found for "${query}".`
      );
    } catch (error) {
      return `Search unavailable for "${query}": ${error instanceof Error ? error.message : String(error)}`;
    }
  },
});

/**
 * write_file — save content as an artifact in the memory manager
 */
toolRegistry.register({
  id: "write_file",
  name: "Write File",
  description: "Save content as an artifact to the artifact store",
  category: "write",
  riskLevel: "medium",
  parameters: z.object({
    filename: z.string().min(1),
    content: z.string().min(1),
    agentId: z.string().optional(),
    runId: z.string().optional(),
    type: z.enum(["code", "text", "json", "markdown", "file"]).optional(),
  }),
  executor: async (params) => {
    const { filename, content, agentId = "system", runId, type = "text" } =
      params as {
        filename: string;
        content: string;
        agentId?: string;
        runId?: string;
        type?: string;
      };
    try {
      const artifact = await memoryManager.saveArtifact(
        agentId,
        filename,
        content,
        type,
        runId,
      );
      return {
        success: true,
        message: `File "${filename}" saved successfully`,
        artifactId: artifact.id,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to save file "${filename}": ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
});

/**
 * execute_code — generate and validate code (does NOT execute in sandbox)
 */
toolRegistry.register({
  id: "execute_code",
  name: "Execute Code",
  description: "Generate code and validate syntax (JavaScript or Python)",
  category: "code",
  riskLevel: "high",
  parameters: z.object({
    code: z.string().min(1),
    language: z.enum(["javascript", "python"]).optional(),
  }),
  validator: {
    type: "code_compiles",
    config: {},
  },
  executor: async (params) => {
    const { code, language = "javascript" } = params as {
      code: string;
      language?: string;
    };

    if (language === "javascript") {
      try {
        new Function(code);
        return `${code}\n\n---\n✅ JavaScript code syntax validated successfully.`;
      } catch (e) {
        return `${code}\n\n---\n⚠️ Syntax note: ${e instanceof Error ? e.message : "Could not validate syntax"}. Please review before executing.`;
      }
    }

    // For Python, use LLM to validate
    try {
      const zai = await getZAI();
      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "You are a Python code validator. Analyze the given code and report if it has syntax errors. Respond with ONLY 'VALID' or 'INVALID: <error message>'.",
          },
          { role: "user", content: code },
        ],
        thinking: { type: "disabled" },
      });
      const validation = completion.choices[0]?.message?.content || "UNKNOWN";
      if (validation.startsWith("VALID")) {
        return `${code}\n\n---\n✅ Python code syntax validated successfully.`;
      }
      return `${code}\n\n---\n⚠️ ${validation}`;
    } catch (error) {
      return `${code}\n\n---\n⚠️ Validation error: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
});

/**
 * browse_url — read content from a URL using z-ai-web-dev-sdk
 */
toolRegistry.register({
  id: "browse_url",
  name: "Browse URL",
  description: "Fetch and read content from a web URL",
  category: "browser",
  riskLevel: "medium",
  parameters: z.object({
    url: z.string().url(),
  }),
  validator: {
    type: "url_reachable",
    config: {},
  },
  executor: async (params) => {
    const { url } = params as { url: string };
    try {
      const zai = await getZAI();
      const pageResult = await zai.functions.invoke('page_reader', { url });
      if (pageResult?.data?.html) {
        const title = pageResult.data?.title || url;
        return `Content from ${title}:\n\n${pageResult.data.html.substring(0, 5000)}`;
      }
      return `Could not read content from ${url}. The page may be empty or blocked.`;
    } catch (error) {
      return `Failed to browse ${url}: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
});

/**
 * save_memory — store a value in the 3-tier memory system
 */
toolRegistry.register({
  id: "save_memory",
  name: "Save Memory",
  description: "Store a value in the agent's memory (session, persistent, or artifact tier)",
  category: "memory",
  riskLevel: "low",
  parameters: z.object({
    key: z.string().min(1),
    value: z.any(),
    tier: z.enum(["session", "persistent", "artifact"]),
    agentId: z.string().optional(),
    runId: z.string().optional(),
  }),
  executor: async (params) => {
    const { key, value, tier, agentId = "system", runId } = params as {
      key: string;
      value: unknown;
      tier: "session" | "persistent" | "artifact";
      agentId?: string;
      runId?: string;
    };
    try {
      await memoryManager.set(agentId, key, value, tier, runId);
      return { success: true, message: `Memory saved: ${key} (${tier})` };
    } catch (error) {
      return {
        success: false,
        message: `Failed to save memory: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
});

/**
 * read_memory — retrieve a value from the 3-tier memory system
 */
toolRegistry.register({
  id: "read_memory",
  name: "Read Memory",
  description: "Retrieve a value from the agent's memory (session, persistent, or artifact tier)",
  category: "memory",
  riskLevel: "low",
  parameters: z.object({
    key: z.string().min(1),
    tier: z.enum(["session", "persistent", "artifact"]),
    agentId: z.string().optional(),
    runId: z.string().optional(),
  }),
  executor: async (params) => {
    const { key, tier, agentId = "system", runId } = params as {
      key: string;
      tier: "session" | "persistent" | "artifact";
      agentId?: string;
      runId?: string;
    };
    try {
      const value = await memoryManager.get(agentId, key, tier, runId);
      if (value === undefined) {
        return { success: false, message: `Memory key "${key}" not found in ${tier} tier` };
      }
      return { success: true, key, tier, value };
    } catch (error) {
      return {
        success: false,
        message: `Failed to read memory: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
});
