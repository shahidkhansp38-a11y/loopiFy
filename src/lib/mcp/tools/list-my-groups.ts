import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_my_groups",
  title: "List my study groups",
  description:
    "List LoopiFy study groups the signed-in user belongs to (both peer study groups and learning groups).",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const sb = supabaseForUser(ctx);
    const userId = ctx.getUserId();

    const [studyRes, learningRes] = await Promise.all([
      sb
        .from("group_members")
        .select("group_id, study_groups(id, name, description, subject, created_at)")
        .eq("user_id", userId),
      sb
        .from("group_learning_members")
        .select("group_id, study_groups(id, name, description, subject, created_at)")
        .eq("user_id", userId),
    ]);

    if (studyRes.error) {
      return { content: [{ type: "text", text: studyRes.error.message }], isError: true };
    }
    if (learningRes.error) {
      return { content: [{ type: "text", text: learningRes.error.message }], isError: true };
    }

    const rows = [
      ...(studyRes.data ?? []).map((r: any) => ({ kind: "study", ...r.study_groups })),
      ...(learningRes.data ?? []).map((r: any) => ({ kind: "learning", ...r.study_groups })),
    ].filter((r) => r && r.id);

    return {
      content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
      structuredContent: { groups: rows },
    };
  },
});
