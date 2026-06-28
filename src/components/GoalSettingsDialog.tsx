import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Flame, Trophy, Clock, Layers } from 'lucide-react';
import { useStreak } from '@/hooks/useStreak';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function GoalSettingsDialog({ open, onOpenChange }: Props) {
  const { streak, goal, today, updateGoal } = useStreak();
  const [mins, setMins] = useState(goal.daily_minutes_goal);
  const [cards, setCards] = useState(goal.daily_cards_goal);

  useEffect(() => {
    setMins(goal.daily_minutes_goal);
    setCards(goal.daily_cards_goal);
  }, [goal]);

  const save = async () => {
    await updateGoal({ daily_minutes_goal: mins, daily_cards_goal: cards });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>Daily goals & streak</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-card border border-border/50 flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <div>
              <p className="text-xs text-muted-foreground">Current streak</p>
              <p className="font-bold text-foreground">{streak?.current_streak ?? 0} days</p>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-card border border-border/50 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Longest</p>
              <p className="font-bold text-foreground">{streak?.longest_streak ?? 0} days</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <Label className="flex items-center gap-2"><Clock className="w-4 h-4" /> Minutes per day</Label>
            <Input type="number" min={5} max={240} value={mins} onChange={(e) => setMins(Number(e.target.value))} />
            <p className="text-xs text-muted-foreground mt-1">Today: {today?.minutes_studied ?? 0} min</p>
          </div>
          <div>
            <Label className="flex items-center gap-2"><Layers className="w-4 h-4" /> Cards per day</Label>
            <Input type="number" min={5} max={500} value={cards} onChange={(e) => setCards(Number(e.target.value))} />
            <p className="text-xs text-muted-foreground mt-1">Today: {today?.cards_reviewed ?? 0} cards</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Hit either goal — or submit one assignment — to keep your streak going.
            You earn a streak freeze every 7 days, which covers one missed day automatically.
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="loopify-gradient" onClick={save}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
