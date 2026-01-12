import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Users, 
  MessageSquare, 
  Video, 
  Bot, 
  BookOpen,
  LogOut,
  Plus,
  Search,
  Bell,
  User,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useStudyGroups } from '@/hooks/useStudyGroups';

export default function Index() {
  const { user, loading, signOut } = useAuth();
  const { myGroups, loading: groupsLoading } = useStudyGroups();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent"
        />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const quickActions = [
    { icon: Users, label: 'Groups', color: 'bg-primary', route: '/groups' },
    { icon: MessageSquare, label: 'Chat', color: 'bg-secondary', route: '/groups' },
    { icon: Video, label: 'Video', color: 'bg-accent', route: '/video-call' },
    { icon: Bot, label: 'AI Tutor', color: 'loopify-gradient', route: '/ai-tutor' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 glass-effect border-b border-border/50"
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold loopify-gradient-text">LoopiFy</span>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-full hover:bg-muted transition-colors">
              <Search className="w-5 h-5 text-muted-foreground" />
            </button>
            <button className="p-2 rounded-full hover:bg-muted transition-colors relative">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
            </button>
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-8">
        {/* Welcome Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h1 className="text-2xl font-bold text-foreground mb-1">
            Hello, {user.user_metadata?.full_name || 'Learner'}! 👋
          </h1>
          <p className="text-muted-foreground">Ready to learn something new today?</p>
        </motion.section>

        {/* Quick Actions */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-4 gap-3">
            {quickActions.map((action, index) => (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(action.route)}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-card border border-border/50 loopify-card-shadow hover:border-primary/30 transition-colors"
              >
                <div className={`w-11 h-11 rounded-xl ${action.color} flex items-center justify-center`}>
                  <action.icon className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-xs font-medium text-foreground">{action.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.section>

        {/* My Study Groups */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">My Study Groups</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/groups')}
              className="text-primary"
            >
              <Plus className="w-4 h-4 mr-1" />
              New
            </Button>
          </div>
          
          {groupsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : myGroups.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-6 rounded-2xl bg-muted/50 text-center"
            >
              <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-3">No groups yet</p>
              <Button
                onClick={() => navigate('/groups')}
                size="sm"
                className="loopify-gradient hover:opacity-90"
              >
                Explore Groups
              </Button>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {myGroups.slice(0, 3).map((group, index) => (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  whileHover={{ x: 4 }}
                  onClick={() => navigate('/groups')}
                  className="p-4 rounded-2xl bg-card border border-border/50 loopify-card-shadow flex items-center justify-between cursor-pointer hover:border-primary/30 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl loopify-gradient flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{group.name}</h3>
                      <p className="text-sm text-muted-foreground">{group.subject || 'Study Group'}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>

        {/* AI Tutor Card */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div 
            onClick={() => navigate('/ai-tutor')}
            className="p-6 rounded-3xl loopify-gradient loopify-shadow-lg text-primary-foreground cursor-pointer hover:opacity-95 transition-opacity"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                <Bot className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-1">AI Learning Assistant</h3>
                <p className="text-white/80 text-sm mb-4">
                  Get instant help with your studies. Ask questions, get explanations, and learn faster.
                </p>
                <Button 
                  variant="secondary" 
                  className="bg-white/20 hover:bg-white/30 text-white border-0"
                >
                  Start Conversation
                </Button>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Profile Card */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="p-4 rounded-2xl bg-card border border-border/50 loopify-card-shadow flex items-center gap-4">
            <div className="w-14 h-14 rounded-full loopify-gradient flex items-center justify-center text-xl font-bold text-primary-foreground">
              {user.user_metadata?.full_name?.charAt(0) || <User className="w-6 h-6" />}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">
                {user.user_metadata?.full_name || 'Your Profile'}
              </h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </motion.section>
      </main>
    </div>
  );
}
