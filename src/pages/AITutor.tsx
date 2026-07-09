import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Bot, User, Loader2, Sparkles, Trash2, Plus, MessageSquare, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useAIConversations, AIMessage } from '@/hooks/useAIConversations';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-tutor`;

const WELCOME_MESSAGE: AIMessage = {
  id: 'welcome',
  role: 'assistant',
  content: "Hello! I'm your AI Learning Assistant. 🎓\n\nI can help you with:\n• Explaining complex topics\n• Answering study questions\n• Creating practice problems\n• Summarizing content\n\nWhat would you like to learn about today?",
  created_at: new Date().toISOString()
};

export default function AITutor() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [localMessages, setLocalMessages] = useState<AIMessage[]>([WELCOME_MESSAGE]);
  
  const { user, loading: authLoading } = useAuth();
  const {
    conversations,
    currentConversation,
    messages: dbMessages,
    loading: conversationsLoading,
    createConversation,
    addMessage,
    selectConversation,
    deleteConversation,
    startNewChat
  } = useAIConversations();
  
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync local messages with DB messages
  useEffect(() => {
    if (currentConversation && dbMessages.length > 0) {
      setLocalMessages(dbMessages);
    } else if (!currentConversation) {
      setLocalMessages([WELCOME_MESSAGE]);
    }
  }, [currentConversation, dbMessages]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages]);

  const streamChat = async (
    chatMessages: { role: string; content: string }[],
    onDelta: (deltaText: string) => void,
    onDone: () => void
  ) => {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages: chatMessages }),
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      if (resp.status === 429) {
        toast.error("Rate limit exceeded. Please wait a moment and try again.");
        throw new Error("Rate limit exceeded");
      }
      if (resp.status === 402) {
        toast.error("AI credits exhausted. Please add funds to continue.");
        throw new Error("Payment required");
      }
      throw new Error(errorData.error || "Failed to get AI response");
    }

    if (!resp.body) throw new Error("No response body");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch { /* ignore */ }
      }
    }

    onDone();
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userContent = input.trim();
    setInput('');
    setIsLoading(true);

    // Create conversation if needed
    let convId = currentConversation?.id;
    if (!convId) {
      const newConv = await createConversation(userContent);
      if (!newConv) {
        toast.error("Failed to create conversation");
        setIsLoading(false);
        return;
      }
      convId = newConv.id;
    }

    // Add user message to DB
    const userMsg = await addMessage(convId, 'user', userContent);
    if (!userMsg) {
      toast.error("Failed to save message");
      setIsLoading(false);
      return;
    }

    // Update local messages with user message
    const userMessage: AIMessage = {
      id: userMsg.id,
      role: 'user',
      content: userContent,
      created_at: userMsg.created_at
    };
    
    setLocalMessages(prev => {
      const filtered = prev.filter(m => m.id !== 'welcome');
      return [...filtered, userMessage];
    });

    // Stream AI response
    let assistantContent = "";
    const tempAssistantId = `temp-${Date.now()}`;

    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setLocalMessages(prev => {
        const existing = prev.find(m => m.id === tempAssistantId);
        if (existing) {
          return prev.map(m => 
            m.id === tempAssistantId ? { ...m, content: assistantContent } : m
          );
        }
        return [...prev, {
          id: tempAssistantId,
          role: 'assistant' as const,
          content: assistantContent,
          created_at: new Date().toISOString()
        }];
      });
    };

    try {
      const chatHistory = localMessages
        .filter(m => m.id !== 'welcome')
        .concat([userMessage])
        .map(m => ({ role: m.role, content: m.content }));

      await streamChat(chatHistory, updateAssistant, async () => {
        // Save assistant message to DB
        if (assistantContent) {
          const savedMsg = await addMessage(convId!, 'assistant', assistantContent);
          if (savedMsg) {
            // Replace temp ID with real ID
            setLocalMessages(prev => 
              prev.map(m => m.id === tempAssistantId 
                ? { ...m, id: savedMsg.id } 
                : m
              )
            );
          }
        }
        setIsLoading(false);
      });
    } catch (error) {
      console.error('Error getting AI response:', error);
      if (assistantContent === "") {
        const errorMsg: AIMessage = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: "I'm sorry, I encountered an error. Please try again.",
          created_at: new Date().toISOString()
        };
        setLocalMessages(prev => [...prev, errorMsg]);
      }
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    startNewChat();
    setLocalMessages([WELCOME_MESSAGE]);
    setShowSidebar(false);
  };

  const handleSelectConversation = async (conv: typeof conversations[0]) => {
    await selectConversation(conv);
    setShowSidebar(false);
  };

  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (await deleteConversation(convId)) {
      toast.success("Conversation deleted");
    }
  };

  if (authLoading || conversationsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <AnimatePresence>
        {showSidebar && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setShowSidebar(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed md:relative left-0 top-0 h-full w-[280px] bg-card border-r border-border z-50 flex flex-col"
            >
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h2 className="font-semibold text-foreground">Chat History</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSidebar(false)}
                  className="md:hidden"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="p-3">
                <Button
                  onClick={handleNewChat}
                  className="w-full loopify-gradient text-primary-foreground"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Chat
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {conversations.map(conv => (
                  <motion.button
                    key={conv.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => handleSelectConversation(conv)}
                    className={`w-full text-left p-3 rounded-lg transition-colors group ${
                      currentConversation?.id === conv.id
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-muted text-foreground'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {conv.title || 'New conversation'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={(e) => handleDeleteConversation(conv.id, e)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </motion.button>
                ))}

                {conversations.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No conversations yet
                  </p>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="sticky top-0 z-30 glass-effect border-b border-border/50 px-4 py-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSidebar(true)}
                className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
              >
                <Menu className="w-5 h-5 text-foreground" />
              </button>
              
              <button
                onClick={() => navigate('/')}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-foreground" />
              </button>
              
              <div className="w-10 h-10 rounded-xl loopify-gradient flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary-foreground" />
              </div>
              
              <div>
                <h1 className="font-semibold text-foreground">AI Tutor</h1>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  Powered by Lovable AI
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleNewChat}
              className="text-muted-foreground hover:text-primary"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </motion.header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence mode="popLayout">
            {localMessages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full loopify-gradient flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
                
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                    message.role === 'user'
                      ? 'loopify-gradient text-primary-foreground rounded-br-md'
                      : 'bg-muted text-foreground rounded-bl-md'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>

                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-secondary-foreground" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && localMessages[localMessages.length - 1]?.role === 'user' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-full loopify-gradient flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-muted">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {localMessages.length <= 1 && localMessages[0]?.id === 'welcome' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 pb-2"
          >
            <div className="flex gap-2 overflow-x-auto pb-2">
              {['Explain React hooks', 'Help with calculus', 'Python basics', 'Study tips'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="flex-shrink-0 px-4 py-2 rounded-full bg-muted hover:bg-muted/80 text-sm font-medium text-foreground transition-colors"
                >
                  <Sparkles className="w-3 h-3 inline mr-1 text-primary" />
                  {suggestion}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Input */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="sticky bottom-0 glass-effect border-t border-border/50 p-4"
        >
          <form onSubmit={handleSend} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              className="flex-1 h-12 rounded-xl border-2 focus:border-primary"
              disabled={isLoading}
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="h-12 w-12 rounded-xl loopify-gradient hover:opacity-90 loopify-shadow"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
