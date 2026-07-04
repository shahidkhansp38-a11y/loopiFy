import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listMyGroups from "./tools/list-my-groups";
import listGroupLectures from "./tools/list-group-lectures";
import listMyAssignments from "./tools/list-my-assignments";
import listMyFlashcardDecks from "./tools/list-my-flashcard-decks";
import getMyStreak from "./tools/get-my-streak";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "loopify-mcp",
  title: "LoopiFy",
  version: "0.1.0",
  instructions:
    "Tools for LoopiFy, a peer study app. Use these to read the signed-in student's groups, lectures, assignments, flashcard decks, and learning streak. All tools are read-only and scoped to the authenticated user.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listMyGroups,
    listGroupLectures,
    listMyAssignments,
    listMyFlashcardDecks,
    getMyStreak,
  ],
});
