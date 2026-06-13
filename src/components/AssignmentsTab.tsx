import { useState } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Plus, Trash2, CheckCircle2, Clock, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useAssignments, Assignment } from '@/hooks/useAssignments';
import { AddAssignmentDialog } from './AddAssignmentDialog';
import { SubmitAssignmentDialog } from './SubmitAssignmentDialog';
import { GradeSubmissionsPanel } from './GradeSubmissionsPanel';

interface Props {
  groupId: string;
  isAdmin: boolean;
}

export function AssignmentsTab({ groupId, isAdmin }: Props) {
  const { assignments, mySubmissions, loading, createAssignment, deleteAssignment, submit } = useAssignments(groupId);
  const [addOpen, setAddOpen] = useState(false);
  const [submitFor, setSubmitFor] = useState<Assignment | null>(null);
  const [expandedAdmin, setExpandedAdmin] = useState<string | null>(null);

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground text-sm">Loading…</div>;
  }

  return (
    <div className="space-y-4">
      {isAdmin && (
        <Button onClick={() => setAddOpen(true)} className="w-full loopify-gradient h-12 rounded-xl">
          <Plus className="w-4 h-4 mr-2" />
          New assignment
        </Button>
      )}

      {assignments.length === 0 ? (
        <div className="text-center py-12">
          <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No assignments yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((a, i) => {
            const mine = mySubmissions[a.id];
            const overdue = a.due_at && isPast(new Date(a.due_at)) && !mine;
            const graded = mine?.grade !== null && mine?.grade !== undefined;
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="p-4 rounded-2xl bg-card border border-border/50 loopify-card-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <ClipboardList className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-foreground">{a.title}</h3>
                      <span className="text-xs text-muted-foreground flex-shrink-0">{a.max_points} pts</span>
                    </div>
                    {a.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{a.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                      {a.due_at && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${
                          overdue ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'
                        }`}>
                          {overdue ? <AlertCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          Due {format(new Date(a.due_at), 'MMM d, p')}
                        </span>
                      )}
                      {mine && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          <CheckCircle2 className="w-3 h-3" />
                          {graded ? `Graded ${mine.grade}/${a.max_points}` : 'Submitted'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                  {!isAdmin && (
                    <Button
                      size="sm"
                      variant={mine ? 'outline' : 'default'}
                      className={mine ? '' : 'loopify-gradient'}
                      onClick={() => setSubmitFor(a)}
                    >
                      {mine ? (graded ? 'View grade' : 'View submission') : 'Submit'}
                    </Button>
                  )}
                  {isAdmin && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setExpandedAdmin(expandedAdmin === a.id ? null : a.id)}
                      >
                        {expandedAdmin === a.id ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                        Submissions
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive ml-auto"
                        onClick={() => {
                          if (confirm('Delete this assignment? All submissions will be removed.')) {
                            deleteAssignment(a.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>

                {isAdmin && expandedAdmin === a.id && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <GradeSubmissionsPanel assignmentId={a.id} maxPoints={a.max_points} />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      <AddAssignmentDialog isOpen={addOpen} onClose={() => setAddOpen(false)} onCreate={createAssignment} />
      {submitFor && (
        <SubmitAssignmentDialog
          isOpen={!!submitFor}
          onClose={() => setSubmitFor(null)}
          existing={mySubmissions[submitFor.id]}
          onSubmit={(content, fileUrl) => submit(submitFor.id, content, fileUrl)}
        />
      )}
    </div>
  );
}
