import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, MessageCircle, CheckCircle, Clock, ChevronUp, Send, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { StudyGroup } from '@/hooks/useStudyGroups';
import { useGroupQuestions, useQuestionAnswers, Question } from '@/hooks/useGroupQuestions';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

interface GroupQAProps {
  group: StudyGroup;
  onBack: () => void;
}

export function GroupQA({ group, onBack }: GroupQAProps) {
  const [showAskForm, setShowAskForm] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const { questions, loading, askQuestion, markResolved, deleteQuestion } = useGroupQuestions(group.id);
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleAsk = async () => {
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);
    const result = await askQuestion(title.trim(), content.trim());
    if (result) {
      setTitle('');
      setContent('');
      setShowAskForm(false);
    }
    setSubmitting(false);
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (selectedQuestion) {
    return (
      <QuestionDetail
        question={selectedQuestion}
        onBack={() => setSelectedQuestion(null)}
        onResolved={(resolved) => markResolved(selectedQuestion.id, resolved)}
        onDelete={() => {
          deleteQuestion(selectedQuestion.id);
          setSelectedQuestion(null);
        }}
        isOwner={selectedQuestion.user_id === user?.id}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-full bg-background"
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-card">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="font-semibold">{group.name} - Q&A</h2>
          <p className="text-xs text-muted-foreground">Ask doubts, help your peers</p>
        </div>
        <Button onClick={() => setShowAskForm(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Ask
        </Button>
      </div>

      {/* Ask Question Form */}
      <AnimatePresence>
        {showAskForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b bg-muted/30 overflow-hidden"
          >
            <div className="p-4 space-y-3">
              <Input
                placeholder="What's your question? (title)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <Textarea
                placeholder="Describe your doubt in detail..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={3}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setShowAskForm(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleAsk} disabled={submitting || !title.trim() || !content.trim()}>
                  {submitting ? 'Posting...' : 'Post Question'}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Questions List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No questions yet</p>
            <p className="text-sm">Be the first to ask a doubt!</p>
          </div>
        ) : (
          <div className="divide-y">
            {questions.map((question) => (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 hover:bg-muted/30 cursor-pointer transition-colors"
                onClick={() => setSelectedQuestion(question)}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={question.profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {getInitials(question.profile?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-sm truncate">{question.title}</h3>
                      {question.is_resolved ? (
                        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Resolved
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                          <Clock className="h-3 w-3 mr-1" />
                          Open
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{question.content}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>{question.profile?.full_name || 'Anonymous'}</span>
                      <span>•</span>
                      <span>{formatDistanceToNow(new Date(question.created_at), { addSuffix: true })}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        {question.answer_count} answers
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

interface QuestionDetailProps {
  question: Question;
  onBack: () => void;
  onResolved: (resolved: boolean) => void;
  onDelete: () => void;
  isOwner: boolean;
}

function QuestionDetail({ question, onBack, onResolved, onDelete, isOwner }: QuestionDetailProps) {
  const { answers, loading, postAnswer, toggleUpvote, acceptAnswer } = useQuestionAnswers(question.id);
  const { user } = useAuth();
  const [newAnswer, setNewAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handlePost = async () => {
    if (!newAnswer.trim()) return;
    setSubmitting(true);
    const result = await postAnswer(newAnswer.trim());
    if (result) {
      setNewAnswer('');
    }
    setSubmitting(false);
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col h-full bg-background"
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-card">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="font-semibold text-sm">Question</h2>
        </div>
        {isOwner && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onResolved(!question.is_resolved)}
            >
              {question.is_resolved ? 'Reopen' : 'Mark Resolved'}
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        )}
      </div>

      {/* Question Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 border-b bg-muted/20">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={question.profile?.avatar_url || undefined} />
              <AvatarFallback>{getInitials(question.profile?.full_name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">{question.profile?.full_name || 'Anonymous'}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(question.created_at), { addSuffix: true })}
                </span>
              </div>
              <h3 className="font-semibold mb-2">{question.title}</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{question.content}</p>
            </div>
          </div>
        </div>

        {/* Answers */}
        <div className="p-4">
          <h4 className="font-medium mb-4">{answers.length} Answers</h4>
          
          {loading ? (
            <div className="flex items-center justify-center h-20">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : answers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No answers yet. Be the first to help!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {answers.map((answer) => (
                <motion.div
                  key={answer.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-lg border ${answer.is_accepted ? 'border-green-200 bg-green-50/50' : 'bg-card'}`}
                >
                  <div className="flex gap-3">
                    {/* Upvote */}
                    <div className="flex flex-col items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 ${answer.has_upvoted ? 'text-primary' : ''}`}
                        onClick={() => toggleUpvote(answer.id, answer.has_upvoted || false)}
                      >
                        <ChevronUp className="h-5 w-5" />
                      </Button>
                      <span className="text-sm font-medium">{answer.upvotes}</span>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={answer.profile?.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {getInitials(answer.profile?.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{answer.profile?.full_name || 'Anonymous'}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(answer.created_at), { addSuffix: true })}
                        </span>
                        {answer.is_accepted && (
                          <Badge className="bg-green-500">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Accepted
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{answer.content}</p>
                      
                      {isOwner && !answer.is_accepted && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => acceptAnswer(answer.id)}
                        >
                          Accept Answer
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Answer Input */}
      <div className="p-4 border-t bg-card">
        <div className="flex gap-2">
          <Textarea
            placeholder="Write your answer..."
            value={newAnswer}
            onChange={(e) => setNewAnswer(e.target.value)}
            rows={2}
            className="flex-1"
          />
          <Button onClick={handlePost} disabled={submitting || !newAnswer.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
