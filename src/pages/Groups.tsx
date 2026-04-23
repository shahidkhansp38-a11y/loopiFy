import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Plus, 
  Users, 
  BookOpen, 
  Search,
  Loader2,
  UserPlus,
  LogIn
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useAppUser } from '@/hooks/useAppUser';
import { useStudyGroups, StudyGroup } from '@/hooks/useStudyGroups';
import { CreateGroupDialog } from '@/components/CreateGroupDialog';
import { GroupChat } from '@/components/GroupChat';
import { useToast } from '@/hooks/use-toast';

export default function Groups() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<StudyGroup | null>(null);
  const [activeTab, setActiveTab] = useState<'my' | 'discover'>('my');
  
  const { user, loading: authLoading } = useAuth();
  const { isTeacher } = useAppUser();
  const { groups, myGroups, loading, createGroup, joinGroup, updateGroupLimit } = useStudyGroups();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleNewClick = () => {
    if (!isTeacher) {
      toast({
        title: 'Teachers only',
        description: 'Only teachers can create groups. Update your role in Profile.',
        variant: 'destructive',
      });
      return;
    }
    setShowCreateDialog(true);
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (selectedGroup) {
    return <GroupChat group={selectedGroup} onBack={() => setSelectedGroup(null)} onUpdateLimit={updateGroupLimit} />;
  }

  const displayedGroups = activeTab === 'my' ? myGroups : groups;
  const filteredGroups = displayedGroups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.subject?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 glass-effect border-b border-border/50"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-foreground" />
              </button>
              <h1 className="text-xl font-bold text-foreground">Study Groups</h1>
            </div>
            <Button
              onClick={handleNewClick}
              size="sm"
              className="loopify-gradient hover:opacity-90"
            >
              <Plus className="w-4 h-4 mr-1" />
              New
            </Button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search groups..."
              className="pl-12 h-12 rounded-xl border-2"
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('my')}
              className={`flex-1 py-2 px-4 rounded-xl font-medium transition-colors ${
                activeTab === 'my'
                  ? 'loopify-gradient text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              My Groups
            </button>
            <button
              onClick={() => setActiveTab('discover')}
              className={`flex-1 py-2 px-4 rounded-xl font-medium transition-colors ${
                activeTab === 'discover'
                  ? 'loopify-gradient text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              Discover
            </button>
          </div>
        </div>
      </motion.header>

      {/* Groups List */}
      <main className="container mx-auto px-4 py-6">
        {filteredGroups.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 rounded-2xl loopify-gradient flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {activeTab === 'my' ? 'No groups yet' : 'No groups found'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {activeTab === 'my' 
                ? 'Create your first group or join existing ones' 
                : 'Try a different search or create a new group'}
            </p>
            <Button
              onClick={handleNewClick}
              className="loopify-gradient hover:opacity-90 loopify-shadow"
            >
              <Plus className="w-4 h-4 mr-2" />
              {isTeacher ? 'Create Group' : 'Browse groups'}
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredGroups.map((group, index) => (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => group.is_member && setSelectedGroup(group)}
                  className={`p-4 rounded-2xl bg-card border border-border/50 loopify-card-shadow ${
                    group.is_member ? 'cursor-pointer hover:border-primary/30' : ''
                  } transition-all`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl loopify-gradient flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-7 h-7 text-primary-foreground" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{group.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {group.subject || 'General'} · {group.member_count ?? 0}/{group.max_members || 6} members
                      </p>
                      {group.description && (
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {group.description}
                        </p>
                      )}
                    </div>

                    {group.is_member ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-primary"
                      >
                        <LogIn className="w-4 h-4 mr-1" />
                        Open
                      </Button>
                    ) : (group.member_count ?? 0) >= (group.max_members || 6) ? (
                      <Button size="sm" variant="ghost" disabled className="text-muted-foreground">
                        Full
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          joinGroup(group.id);
                        }}
                        className="loopify-gradient hover:opacity-90"
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Join
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Create Dialog */}
      <CreateGroupDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreate={createGroup}
      />
    </div>
  );
}
