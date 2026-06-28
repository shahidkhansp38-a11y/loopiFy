// SuperMemo-2 spaced repetition algorithm.
// Quality: 0=Again, 3=Hard, 4=Good, 5=Easy
export type Rating = 'again' | 'hard' | 'good' | 'easy';

export interface SM2State {
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  due_at: string; // ISO
}

const QUALITY: Record<Rating, number> = { again: 0, hard: 3, good: 4, easy: 5 };

export function applySM2(prev: SM2State, rating: Rating, now: Date = new Date()): SM2State {
  const q = QUALITY[rating];
  let { ease_factor, interval_days, repetitions } = prev;

  if (q < 3) {
    repetitions = 0;
    interval_days = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) interval_days = 1;
    else if (repetitions === 2) interval_days = 6;
    else interval_days = Math.round(interval_days * ease_factor);
  }

  ease_factor = Math.max(1.3, ease_factor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));

  const due = new Date(now);
  due.setDate(due.getDate() + interval_days);

  return {
    ease_factor: Number(ease_factor.toFixed(2)),
    interval_days,
    repetitions,
    due_at: due.toISOString(),
  };
}

export const INITIAL_SM2: SM2State = {
  ease_factor: 2.5,
  interval_days: 0,
  repetitions: 0,
  due_at: new Date().toISOString(),
};
