import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Layers } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { FlashcardsTab } from '@/components/FlashcardsTab';

export default function Flashcards() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass-effect border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-2 -ml-2 rounded-full hover:bg-muted">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <Layers className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">My Flashcards</h1>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6 max-w-3xl">
        <p className="text-sm text-muted-foreground mb-4">
          Personal decks — only you can see these. To study with your class, open a learning group's <strong>Flashcards</strong> tab.
        </p>
        <FlashcardsTab groupId={null} canEdit={true} />
      </main>
    </div>
  );
}
