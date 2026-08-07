import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, BookOpen, FileText, ExternalLink, Search, Loader2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface Resource {
  id: string;
  semester: number;
  subject: string;
  title: string;
  resource_type: string;
  external_url: string;
  description: string | null;
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  notes: { label: 'Notes', color: 'bg-primary/15 text-primary' },
  model_paper: { label: 'Model Paper', color: 'bg-accent/15 text-accent-foreground' },
  solution: { label: 'Solution', color: 'bg-secondary/15 text-secondary-foreground' },
};

export default function Resources() {
  const [searchParams] = useSearchParams();
  const deepLinkSem = Number(searchParams.get('sem'));
  const deepLinkId = searchParams.get('id');

  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState(
    deepLinkSem >= 1 && deepLinkSem <= 8 ? deepLinkSem : 1,
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingResource, setViewingResource] = useState<Resource | null>(null);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchResources = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .eq('semester', selectedSemester)
        .order('subject');

      if (!error && data) {
        setResources(data);
        if (deepLinkId) {
          const match = data.find((r) => r.id === deepLinkId);
          if (match) setViewingResource(match);
        }
      }
      setLoading(false);
    };

    if (user) fetchResources();
  }, [user, selectedSemester, deepLinkId]);

  const filtered = resources.filter(r =>
    r.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const grouped = filtered.reduce<Record<string, Resource[]>>((acc, r) => {
    if (!acc[r.subject]) acc[r.subject] = [];
    acc[r.subject].push(r);
    return acc;
  }, {});

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 glass-effect border-b border-border/50"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => navigate('/')} className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-foreground">VTU Resources</h1>
              <p className="text-xs text-muted-foreground">B.E CSE · All Semesters</p>
            </div>
          </div>

          {/* Semester Tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
            {Array.from({ length: 8 }, (_, i) => i + 1).map(sem => (
              <button
                key={sem}
                onClick={() => setSelectedSemester(sem)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedSemester === sem
                    ? 'loopify-gradient text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                Sem {sem}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative mt-3">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search subjects or resources..."
              className="pl-10 h-10 rounded-xl border-2"
            />
          </div>
        </div>
      </motion.header>

      <main className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No resources found for Semester {selectedSemester}</p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([subject, items], idx) => (
              <motion.div
                key={subject}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  {subject}
                </h3>
                <div className="space-y-2">
                  {items.map(resource => {
                    const typeInfo = TYPE_LABELS[resource.resource_type] || TYPE_LABELS.notes;
                    return (
                      <button
                        key={resource.id}
                        onClick={() => setViewingResource(resource)}
                        className="block w-full text-left p-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${typeInfo.color}`}>
                                {typeInfo.label}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-foreground truncate">{resource.title}</p>
                            {resource.description && (
                              <p className="text-xs text-muted-foreground truncate mt-0.5">{resource.description}</p>
                            )}
                          </div>
                          <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary flex-shrink-0 ml-2 transition-colors" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* In-app resource viewer */}
      <Sheet open={!!viewingResource} onOpenChange={(open) => !open && setViewingResource(null)}>
        <SheetContent side="bottom" className="h-[90vh] p-0 rounded-t-2xl">
          <SheetHeader className="p-4 border-b border-border/50">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-sm font-semibold truncate pr-4">
                {viewingResource?.title}
              </SheetTitle>
              <a
                href={viewingResource?.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary flex items-center gap-1 shrink-0"
              >
                Open in browser <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </SheetHeader>
          {viewingResource && (
            <iframe
              src={viewingResource.external_url}
              className="w-full h-[calc(90vh-60px)] border-0"
              title={viewingResource.title}
              sandbox="allow-scripts allow-same-origin allow-popups"
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
