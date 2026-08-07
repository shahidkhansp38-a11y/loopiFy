import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type SearchResultType = 'group' | 'lecture' | 'resource' | 'deck' | 'assignment';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string | null;
  route: string;
}

const PER_TYPE_LIMIT = 5;
const RECENTS_KEY = 'loopify_recent_searches';

/** Strip characters that break PostgREST `or()` filter syntax. */
const sanitize = (q: string) => q.replace(/[,()%*\\]/g, ' ').trim();

export function getRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((x) => typeof x === 'string').slice(0, 5) : [];
  } catch {
    return [];
  }
}

export function pushRecentSearch(term: string) {
  const t = term.trim();
  if (!t) return;
  try {
    const next = [t, ...getRecentSearches().filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, 5);
    localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

/** Prefix matches first, then alphabetical. */
function rank(results: SearchResult[], q: string) {
  const lower = q.toLowerCase();
  return [...results].sort((a, b) => {
    const ap = a.title.toLowerCase().startsWith(lower) ? 0 : 1;
    const bp = b.title.toLowerCase().startsWith(lower) ? 0 : 1;
    if (ap !== bp) return ap - bp;
    return a.title.localeCompare(b.title);
  });
}

export function useGlobalSearch(query: string, enabled: boolean) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    const raw = sanitize(query);
    if (!enabled || raw.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const id = ++requestId.current;
    setLoading(true);

    const timeout = setTimeout(async () => {
      const like = `%${raw}%`;

      const [groups, lectures, resources, decks, assignments] = await Promise.all([
        supabase
          .from('study_groups')
          .select('id, name, subject')
          .or(`name.ilike.${like},subject.ilike.${like}`)
          .limit(PER_TYPE_LIMIT),
        supabase
          .from('lectures')
          .select('id, title, description, group_id')
          .or(`title.ilike.${like},description.ilike.${like}`)
          .limit(PER_TYPE_LIMIT),
        supabase
          .from('resources')
          .select('id, title, subject, semester')
          .or(`title.ilike.${like},subject.ilike.${like}`)
          .limit(PER_TYPE_LIMIT),
        supabase
          .from('flashcard_decks')
          .select('id, title, description, group_id')
          .or(`title.ilike.${like},description.ilike.${like}`)
          .limit(PER_TYPE_LIMIT),
        supabase
          .from('assignments')
          .select('id, title, description, group_id')
          .or(`title.ilike.${like},description.ilike.${like}`)
          .limit(PER_TYPE_LIMIT),
      ]);

      if (id !== requestId.current) return; // stale

      const out: SearchResult[] = [
        ...rank(
          (groups.data ?? []).map((g) => ({
            id: g.id,
            type: 'group' as const,
            title: g.name,
            subtitle: g.subject,
            route: `/learning/${g.id}`,
          })),
          raw,
        ),
        ...rank(
          (lectures.data ?? []).map((l) => ({
            id: l.id,
            type: 'lecture' as const,
            title: l.title,
            subtitle: l.description,
            route: `/learning/${l.group_id}?tab=lectures&lecture=${l.id}`,
          })),
          raw,
        ),
        ...rank(
          (resources.data ?? []).map((r) => ({
            id: r.id,
            type: 'resource' as const,
            title: r.title,
            subtitle: `${r.subject} · Sem ${r.semester}`,
            route: `/resources?sem=${r.semester}&id=${r.id}`,
          })),
          raw,
        ),
        ...rank(
          (decks.data ?? []).map((d) => ({
            id: d.id,
            type: 'deck' as const,
            title: d.title,
            subtitle: d.description,
            route: d.group_id ? `/learning/${d.group_id}?tab=cards` : '/flashcards',
          })),
          raw,
        ),
        ...rank(
          (assignments.data ?? []).map((a) => ({
            id: a.id,
            type: 'assignment' as const,
            title: a.title,
            subtitle: a.description,
            route: `/learning/${a.group_id}?tab=assignments`,
          })),
          raw,
        ),
      ];

      setResults(out);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, enabled]);

  return { results, loading };
}
