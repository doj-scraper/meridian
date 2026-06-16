import ZAI from "z-ai-web-dev-sdk";

// Shared ZAI client singleton — eliminates the race condition where
// concurrent calls to ZAI.create() could produce multiple instances.
// Uses a promise-based lock: the first caller initiates creation,
// subsequent callers await the same promise.

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;
let zaiPromise: Promise<Awaited<ReturnType<typeof ZAI.create>>> | null = null;

export async function getZAI(): Promise<Awaited<ReturnType<typeof ZAI.create>>> {
  if (zaiInstance) return zaiInstance;
  if (zaiPromise) return zaiPromise;

  zaiPromise = ZAI.create().then((instance) => {
    zaiInstance = instance;
    return instance;
  });

  return zaiPromise;
}
