import { useState } from 'react';
import { Loader2, CheckCircle2, FileText, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAssignmentSubmissions } from '@/hooks/useAssignments';
import { format } from 'date-fns';

interface Props {
  assignmentId: string;
  maxPoints: number;
}

export function GradeSubmissionsPanel({ assignmentId, maxPoints }: Props) {
  const { submissions, loading, grade } = useAssignmentSubmissions(assignmentId);
  const [openId, setOpenId] = useState<string | null>(null);
  const [gradeVal, setGradeVal] = useState<number>(0);
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);

  if (loading) return <Loader2 className="w-5 h-5 animate-spin text-primary" />;
  if (submissions.length === 0)
    return <p className="text-sm text-muted-foreground text-center py-6">No submissions yet</p>;

  const startGrading = (id: string, currentGrade: number | null, currentFeedback: string | null) => {
    setOpenId(id);
    setGradeVal(currentGrade ?? 0);
    setFeedback(currentFeedback ?? '');
  };

  const save = async (id: string) => {
    setBusy(true);
    await grade(id, gradeVal, feedback);
    setBusy(false);
    setOpenId(null);
  };

  return (
    <div className="space-y-2">
      {submissions.map((s) => (
        <div key={s.id} className="p-3 rounded-xl bg-card border border-border/50">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="font-medium text-foreground truncate">
                  {s.profile?.full_name || s.user_id.slice(0, 8)}
                </span>
                {s.grade !== null && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3 inline mr-1" />
                    {s.grade}/{maxPoints}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {format(new Date(s.submitted_at), 'PP p')}
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => startGrading(s.id, s.grade, s.feedback)}>
              {s.grade !== null ? 'Edit grade' : 'Grade'}
            </Button>
          </div>

          {s.content && (
            <p className="text-sm text-foreground mt-2 whitespace-pre-wrap line-clamp-4">{s.content}</p>
          )}
          {s.file_url && (
            <a
              href={s.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary inline-flex items-center gap-1 mt-2"
            >
              <ExternalLink className="w-3 h-3" />
              Attachment
            </a>
          )}

          {openId === s.id && (
            <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
              <div className="grid grid-cols-2 gap-2 items-end">
                <div className="space-y-1.5">
                  <Label htmlFor={`g-${s.id}`}>Grade (max {maxPoints})</Label>
                  <Input
                    id={`g-${s.id}`}
                    type="number"
                    min={0}
                    max={maxPoints}
                    value={gradeVal}
                    onChange={(e) => setGradeVal(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <Button className="loopify-gradient h-10" onClick={() => save(s.id)} disabled={busy}>
                  Save grade
                </Button>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`f-${s.id}`}>Feedback</Label>
                <Textarea
                  id={`f-${s.id}`}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={3}
                  maxLength={1000}
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
