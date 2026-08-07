import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, PlayCircle, BookOpen, Layers, ClipboardList, Loader2, Clock } from 'lucide-react';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import {
  useGlobalSearch,
  getRecentSearches,
  pushRecentSearch,
  SearchResult,
  SearchResultType,
} from '@/hooks/useGlobalSearch';

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GROUP_META: Record<SearchResultType, { heading: string; Icon: typeof Users }> = {
  group: { heading: 'Study Groups', Icon: Users },
  lecture: { heading: 'Lectures', Icon: PlayCircle },
  resource: { heading: 'Resources', Icon: BookOpen },
  deck: { heading: 'Flashcard Decks', Icon: Layers },
  assignment: { heading: 'Assignments', Icon: ClipboardList },
};

const ORDER: SearchResultType[] = ['group', 'lecture', 'resource', 'deck', 'assignment'];

export default function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [query, setQuery] = useState('');
  const [recents, setRecents] = useState<string[]>([]);
  const navigate = useNavigate();
  const { results, loading } = useGlobalSearch(query, open);

  useEffect(() => {
    if (open) setRecents(getRecentSearches());
    else setQuery('');
  }, [open]);

  const handleSelect = (result: SearchResult) => {
    pushRecentSearch(query);
    onOpenChange(false);
    navigate(result.route);
  };

  const showRecents = !query.trim() && recents.length > 0;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search groups, lectures, resources, cards..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && !showRecents && (
          <CommandEmpty>
            {query.trim().length < 2 ? 'Type at least 2 characters…' : 'No results found.'}
          </CommandEmpty>
        )}

        {showRecents && (
          <CommandGroup heading="Recent searches">
            {recents.map((term) => (
              <CommandItem key={term} value={term} onSelect={() => setQuery(term)} className="cursor-pointer">
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{term}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {!loading &&
          ORDER.map((type) => {
            const items = results.filter((r) => r.type === type);
            if (items.length === 0) return null;
            const { heading, Icon } = GROUP_META[type];
            return (
              <CommandGroup key={type} heading={heading}>
                {items.map((item) => (
                  <CommandItem
                    key={`${type}-${item.id}`}
                    value={`${type}-${item.id}-${item.title}`}
                    onSelect={() => handleSelect(item)}
                    className="cursor-pointer"
                  >
                    <Icon className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{item.title}</p>
                      {item.subtitle && (
                        <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            );
          })}
      </CommandList>
    </CommandDialog>
  );
}
