import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Loader2, Users, MessageCircle, HelpCircle, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/useAuth';
import { StudyGroup } from '@/hooks/useStudyGroups';
import { GroupQA } from '@/components/GroupQA';
import { format } from 'date-fns';

interface GroupChatProps {
  group: StudyGroup;
  onBack: () => void;
  onUpdateLimit?: (groupId: string, newLimit: number) => Promise<boolean>;
  onUpdateDetails?: (groupId: string, updates: { name?: string; subject?: string }) => Promise<boolean>;
}

type Tab = 'chat' | 'qa';

const MEMBER_LIMITS = [6, 10, 15, 25, 50];

export function GroupChat({ group, onBack, onUpdateLimit, onUpdateDetails }: GroupChatProps) {
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [showSettings, setShowSettings] = useState(false);
  const [newLimit, setNewLimit] = useState(group.max_members || 6);
  const [newName, setNewName] = useState(group.name);
  const [newSubject, setNewSubject] = useState(group.subject || '');
  const [savingDetails, setSavingDetails] = useState(false);
  const [updatingLimit, setUpdatingLimit] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const { messages, loading, sendMessage } = useMessages(group.id);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const success = await sendMessage(newMessage);
    if (success) {
      setNewMessage('');
    }
    setSending(false);
  };

  const isOwner = user?.id === group.created_by;

  const handleUpdateLimit = async () => {
    if (!onUpdateLimit || newLimit < 2 || newLimit > 100) return;
    setUpdatingLimit(true);
    await onUpdateLimit(group.id, newLimit);
    setUpdatingLimit(false);
  };

  const detailsChanged =
    newName.trim() !== group.name || newSubject.trim() !== (group.subject || '');

  const handleUpdateDetails = async () => {
    if (!onUpdateDetails || !detailsChanged || !newName.trim()) return;
    setSavingDetails(true);
    await onUpdateDetails(group.id, { name: newName, subject: newSubject });
    setSavingDetails(false);
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Render Q&A tab
  if (activeTab === 'qa') {
    return (
      <div className="flex flex-col h-screen bg-background">
        {/* Tab Selector */}
        <div className="flex border-b bg-card">
        <button
          onClick={() => setActiveTab('chat')}
          className="flex-1 py-3 px-4 flex items-center justify-center gap-2 font-medium transition-colors border-b-2 border-transparent text-muted-foreground hover:text-foreground"
        >
          <MessageCircle className="h-4 w-4" />
          Chat
        </button>
        <button
          onClick={() => setActiveTab('qa')}
          className="flex-1 py-3 px-4 flex items-center justify-center gap-2 font-medium transition-colors border-b-2 border-primary text-primary"
        >
            <HelpCircle className="h-4 w-4" />
            Q&A
          </button>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <GroupQA group={group} onBack={onBack} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 glass-effect border-b border-border/50 px-4 py-3"
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          
          <div className="w-10 h-10 rounded-xl loopify-gradient flex items-center justify-center">
            <Users className="w-5 h-5 text-primary-foreground" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-foreground truncate">{group.name}</h1>
            <p className="text-xs text-muted-foreground truncate">
              {group.member_count ?? 0}/{group.max_members || 6} members · {group.subject || 'Study Group'}
            </p>
          </div>

          {isOwner && (
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-full hover:bg-muted transition-colors"
            >
              <Settings className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
        </div>
      </motion.header>

      {/* Owner Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-border/50 bg-card"
          >
            <div className="p-4 space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Group Settings</h3>

              {onUpdateDetails && (
                <div className="space-y-3 pb-3 border-b border-border/50">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Group Name</label>
                    <Input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Group name"
                      className="h-9 rounded-lg text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Subject</label>
                    <Input
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      placeholder="e.g., Web Development"
                      className="h-9 rounded-lg text-sm"
                    />
                  </div>
                  <Button
                    onClick={handleUpdateDetails}
                    disabled={savingDetails || !detailsChanged || !newName.trim()}
                    size="sm"
                    className="loopify-gradient hover:opacity-90"
                  >
                    {savingDetails ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save details'}
                  </Button>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Member Limit</label>
                <div className="flex flex-wrap gap-2">
                  {MEMBER_LIMITS.map((limit) => (
                    <button
                      key={limit}
                      type="button"
                      onClick={() => setNewLimit(limit)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        newLimit === limit
                          ? 'loopify-gradient text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {limit}
                    </button>
                  ))}
                  <Input
                    type="number"
                    min={2}
                    max={100}
                    value={!MEMBER_LIMITS.includes(newLimit) ? newLimit : ''}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (val >= 2 && val <= 100) setNewLimit(val);
                    }}
                    placeholder="Custom"
                    className="w-20 h-8 rounded-lg text-xs"
                  />
                </div>
              </div>
              <Button
                onClick={handleUpdateLimit}
                disabled={updatingLimit || newLimit === (group.max_members || 6)}
                size="sm"
                className="loopify-gradient hover:opacity-90"
              >
                {updatingLimit ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab Selector */}
      <div className="flex border-b bg-card">
        <button
          onClick={() => setActiveTab('chat')}
          className="flex-1 py-3 px-4 flex items-center justify-center gap-2 font-medium transition-colors border-b-2 border-primary text-primary"
        >
          <MessageCircle className="h-4 w-4" />
          Chat
        </button>
        <button
          onClick={() => setActiveTab('qa')}
          className="flex-1 py-3 px-4 flex items-center justify-center gap-2 font-medium transition-colors border-b-2 border-transparent text-muted-foreground hover:text-foreground"
        >
          <HelpCircle className="h-4 w-4" />
          Q&A
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 rounded-2xl loopify-gradient flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-primary-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No messages yet</h3>
            <p className="text-muted-foreground">Be the first to start the conversation!</p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {messages.map((message, index) => {
              const isOwn = message.user_id === user?.id;
              const showAvatar = index === 0 || messages[index - 1]?.user_id !== message.user_id;
              
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`flex gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  {!isOwn && showAvatar && (
                    <div className="w-8 h-8 rounded-full loopify-gradient flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary-foreground">
                      {getInitials(message.profile?.full_name)}
                    </div>
                  )}
                  {!isOwn && !showAvatar && <div className="w-8" />}
                  
                  <div className={`max-w-[75%] ${isOwn ? 'order-first' : ''}`}>
                    {!isOwn && showAvatar && (
                      <p className="text-xs text-muted-foreground mb-1 ml-1">
                        {message.profile?.full_name || 'Unknown'}
                      </p>
                    )}
                    <div
                      className={`px-4 py-2 rounded-2xl ${
                        isOwn
                          ? 'loopify-gradient text-primary-foreground rounded-br-md'
                          : 'bg-muted text-foreground rounded-bl-md'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    </div>
                    <p className={`text-xs text-muted-foreground mt-1 ${isOwn ? 'text-right mr-1' : 'ml-1'}`}>
                      {format(new Date(message.created_at), 'HH:mm')}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky bottom-nav-offset glass-effect border-t border-border/50 p-4"
      >
        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 h-12 rounded-xl border-2 focus:border-primary"
            disabled={sending}
          />
          <Button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="h-12 w-12 rounded-xl loopify-gradient hover:opacity-90 loopify-shadow"
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
