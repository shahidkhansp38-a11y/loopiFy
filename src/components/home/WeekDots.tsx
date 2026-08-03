interface Props {
  /** ISO dates (YYYY-MM-DD) that had activity */
  activeDates: Set<string>;
}

const LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function WeekDots({ activeDates }: Props) {
  const today = new Date();
  const dayIdx = (today.getDay() + 6) % 7; // Monday-first
  const monday = new Date(today);
  monday.setDate(today.getDate() - dayIdx);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`;
    return { iso, isToday: i === dayIdx, active: activeDates.has(iso), label: LABELS[i] };
  });

  return (
    <div className="flex items-center justify-between gap-1.5">
      {days.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
          <span className="text-[9px] font-semibold uppercase text-white/60">{d.label}</span>
          <div
            className={`w-full h-1.5 rounded-full transition-all ${
              d.active
                ? 'bg-white shadow-[0_0_10px_hsl(0_0%_100%/0.6)]'
                : d.isToday
                ? 'bg-white/45'
                : 'bg-white/20'
            }`}
          />
        </div>
      ))}
    </div>
  );
}
