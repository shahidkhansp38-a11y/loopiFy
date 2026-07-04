// Ambient declaration for MCP tool files that run in the emitted Deno function.
export {};

declare global {
  const process: { env: Record<string, string | undefined> };
}
