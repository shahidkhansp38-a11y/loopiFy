import { useMemo } from 'react';
import { useStreak } from '@/hooks/useStreak';

const WEEKS = 12;
const DAYS = WEEKS * 7;

function intensity(mins: number, cards: number, subs: number): number {
  const score = mins / 30 + cards / 30 + subs * 0.5;
  if (score >= 1.5) return 4;
  if (score >= 1) return 3;
  if (score >= 0.5) return 2;
  if (score > 0) return 1;
  return 0;
}

const SHADES = [
  'bg-muted',
  'bg-primary/20',
  'bg-primary/40',
  'bg-primary/70',
  'bg-primary',
];

export function StreakHeatmap() {
  const { history, streak } = useStreak();

  const days = useMemo(() => {
    const map = new Map<string, { m: number; c: number; s: number }>();
    history.forEach((h) => map.set(h.activity_date, { m: h.minutes_studied, c: h.cards_reviewed, s: h.assignments_submitted }));

    const out: Array<{ date: string; level: number }> = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = DAYS - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const v = map.get(iso);
      out.push({ date: iso, level: v ? intensity(v.m, v.c, v.s) : 0 });
    }
    return out;
  }, [history]);

  // group into columns of 7 days each
  const cols: Array<Array<{ date: string; level: number }>> = [];
  for (let i = 0; i < days.length; i += 7) cols.push(days.slice(i, i + 7));

  return (
    <div className="p-4 rounded-2xl bg-card border border-border/50 loopify-card-shadow">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-muted-foreground">Last 12 weeks</p>
          <p className="font-semibold text-foreground">
            🔥 {streak?.current_streak ?? 0}-day streak · longest {streak?.longest_streak ?? 0}
          </p>
        </div>
      </div>
      <div className="flex gap-1 overflow-x-auto">
        {cols.map((col, i) => (
          <div key={i} className="flex flex-col gap-1">
            {col.map((d) => (
              <div
                key={d.date}
                title={`${d.date}`}
                className={`w-3 h-3 rounded-sm ${SHADES[d.level]}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
        <span>Less</span>
        {SHADES.map((s, i) => <div key={i} className={`w-3 h-3 rounded-sm ${s}`} />)}
        <span>More</span>
      </div>
    </div>
  );
}
