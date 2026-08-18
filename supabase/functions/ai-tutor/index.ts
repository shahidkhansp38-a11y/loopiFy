import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const unauthorized = () => json({ error: "Unauthorized" }, 401);
const badRequest = (msg: string) => json({ error: msg }, 400);

// Request limits (kept simple; per-user rate limiting comes later).
const MAX_MESSAGES = 40;
const MAX_MESSAGE_CHARS = 4000;
const MAX_TOTAL_CHARS = 24000;

const SYSTEM_PROMPT = `You are LoopiFy's AI Learning Assistant - a friendly, encouraging, and knowledgeable tutor. 🎓

Your personality:
- Warm, patient, and supportive
- Use emojis sparingly to add friendliness
- Break down complex topics into digestible parts
- Give concrete examples and analogies
- Encourage curiosity and questions

Your capabilities:
- Explain any academic subject (math, science, history, literature, etc.)
- Help with programming and coding questions
- Provide study tips and learning strategies
- Create practice problems when asked
- Summarize complex content

Guidelines:
- Keep responses concise but thorough
- Use bullet points and numbered lists for clarity
- Ask follow-up questions to ensure understanding
- Celebrate progress and effort
- If you don't know something, be honest about it`;

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

function validateMessages(input: unknown): { messages: ChatMessage[] } | { error: string } {
  if (typeof input !== "object" || input === null) return { error: "Invalid request body" };
  const raw = (input as { messages?: unknown }).messages;
  if (!Array.isArray(raw) || raw.length === 0) return { error: "messages must be a non-empty array" };
  if (raw.length > MAX_MESSAGES) return { error: "Too many messages in this request" };

  const messages: ChatMessage[] = [];
  let total = 0;
  for (const m of raw) {
    if (typeof m !== "object" || m === null) return { error: "Invalid message entry" };
    const { role, content } = m as { role?: unknown; content?: unknown };
    if (role !== "user" && role !== "assistant") return { error: "Invalid message role" };
    if (typeof content !== "string") return { error: "Message content must be a string" };
    const trimmed = content.trim();
    if (!trimmed) return { error: "Message content cannot be empty" };
    if (trimmed.length > MAX_MESSAGE_CHARS) return { error: "Message is too long" };
    total += trimmed.length;
    if (total > MAX_TOTAL_CHARS) return { error: "Conversation payload is too large" };
    messages.push({ role, content: trimmed });
  }
  if (!messages.some((m) => m.role === "user")) return { error: "A user message is required" };
  return { messages };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    // ---- 1. Authentication (must happen before any AI gateway call) ----
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return unauthorized();
    const token = authHeader.slice("Bearer ".length).trim();
    if (!token) return unauthorized();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } },
    );

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    const authedUser = userData?.user;
    if (userError || !authedUser?.id) {
      console.warn("ai-tutor: rejected unauthenticated request");
      return unauthorized();
    }
    // Source of truth for identity. Any client-supplied user_id is ignored.
    const userId = authedUser.id;

    // ---- 2. Payload size guard ----
    const contentLength = Number(req.headers.get("content-length") ?? "0");
    if (contentLength && contentLength > 200_000) {
      return badRequest("Request payload is too large");
    }

    // ---- 3. Input validation ----
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return badRequest("Invalid JSON body");
    }
    const validated = validateMessages(body);
    if ("error" in validated) return badRequest(validated.error);

    // ---- 4. Only now call the paid AI gateway ----
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("ai-tutor: AI gateway key missing");
      return json({ error: "AI service temporarily unavailable" }, 503);
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...validated.messages],
        stream: true,
        user: userId,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return json({ error: "Rate limit exceeded. Please try again in a moment." }, 429);
      }
      if (response.status === 402) {
        return json({ error: "AI credits exhausted. Please add funds to continue." }, 402);
      }
      const errorText = await response.text();
      console.error("ai-tutor: gateway error", response.status, errorText);
      return json({ error: "AI service temporarily unavailable" }, 502);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("ai-tutor: unexpected error", error);
    return json({ error: "AI service temporarily unavailable" }, 500);
  }
});
