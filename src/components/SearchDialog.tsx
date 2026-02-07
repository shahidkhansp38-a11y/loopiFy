import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { supabase } from '@/integrations/supabase/client';

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface GroupResult {
  id: string;
  name: string;
  subject: string | null;
}

export default function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [results, setResults] = useState<GroupResult[]>([]);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
      return;
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from('study_groups')
        .select('id, name, subject')
        .or(`name.ilike.%${query}%,subject.ilike.%${query}%`)
        .limit(10);

      setResults(data || []);
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  const handleSelect = (groupId: string) => {
    onOpenChange(false);
    navigate('/groups');
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search study groups..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No groups found.</CommandEmpty>
        <CommandGroup heading="Study Groups">
          {results.map((group) => (
            <CommandItem
              key={group.id}
              value={group.name}
              onSelect={() => handleSelect(group.id)}
              className="cursor-pointer"
            >
              <Users className="mr-2 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">{group.name}</p>
                {group.subject && (
                  <p className="text-xs text-muted-foreground">{group.subject}</p>
                )}
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
