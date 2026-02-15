import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, BookOpen, FileText, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

interface CreateGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, description: string, subject: string, isPublic: boolean, maxMembers?: number) => Promise<any>;
}

const MEMBER_LIMITS = [6, 10, 15, 25, 50];

export function CreateGroupDialog({ isOpen, onClose, onCreate }: CreateGroupDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [maxMembers, setMaxMembers] = useState(6);
  const [showLimitOptions, setShowLimitOptions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    const result = await onCreate(name, description, subject, isPublic, maxMembers);
    setIsLoading(false);

    if (result) {
      setName('');
      setDescription('');
      setSubject('');
      setIsPublic(true);
      setMaxMembers(6);
      setShowLimitOptions(false);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-md mx-auto"
          >
            <div className="bg-card rounded-3xl p-6 loopify-card-shadow border border-border/50 max-h-[85vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl loopify-gradient flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Create Study Group</h2>
                    <p className="text-sm text-muted-foreground">Start learning together</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">Group Name</label>
                  <div className="relative">
                    <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., React Developers"
                      className="pl-12 h-12 rounded-xl border-2"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">Subject</label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                    <Input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g., Web Development"
                      className="pl-12 h-12 rounded-xl border-2"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">Description</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell others what your group is about..."
                    className="rounded-xl border-2 min-h-[100px] resize-none"
                  />
                </div>

                {/* Member Limit */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground">Member Limit</label>
                    <button
                      type="button"
                      onClick={() => setShowLimitOptions(!showLimitOptions)}
                      className="text-xs text-primary flex items-center gap-1 hover:underline"
                    >
                      {showLimitOptions ? 'Hide options' : 'Expand limit'}
                      {showLimitOptions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(showLimitOptions ? MEMBER_LIMITS : MEMBER_LIMITS.slice(0, 1)).map((limit) => (
                      <button
                        key={limit}
                        type="button"
                        onClick={() => setMaxMembers(limit)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                          maxMembers === limit
                            ? 'loopify-gradient text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {limit} members
                      </button>
                    ))}
                    {showLimitOptions && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={2}
                          max={100}
                          value={!MEMBER_LIMITS.includes(maxMembers) ? maxMembers : ''}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (val >= 2 && val <= 100) setMaxMembers(val);
                          }}
                          placeholder="Custom"
                          className="w-24 h-10 rounded-xl border-2 text-sm"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                  <div>
                    <p className="font-medium text-foreground">Public Group</p>
                    <p className="text-sm text-muted-foreground">Anyone can join this group</p>
                  </div>
                  <Switch
                    checked={isPublic}
                    onCheckedChange={setIsPublic}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !name.trim()}
                  className="w-full h-12 rounded-xl text-base font-semibold loopify-gradient hover:opacity-90 loopify-shadow"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Create Group'
                  )}
                </Button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}