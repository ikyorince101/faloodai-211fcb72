import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ResumeSuggestion } from '@/types/editor';

interface SuggestionsPanelProps {
  suggestions: ResumeSuggestion[];
  onAccept: (s: ResumeSuggestion) => void;
  onReject: (s: ResumeSuggestion) => void;
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-500/20 text-amber-700 dark:text-amber-200',
  accepted: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-200',
  rejected: 'bg-destructive/10 text-destructive',
};

const SuggestionsPanel: React.FC<SuggestionsPanelProps> = ({ suggestions, onAccept, onReject }) => {
  const pending = suggestions.filter((s) => s.status === 'pending');

  return (
    <div className="glass-card p-4 h-full space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Suggestions</p>
          <p className="text-xs text-muted-foreground">Inline AI edits</p>
        </div>
        <Badge variant="secondary">{pending.length} pending</Badge>
      </div>

      <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
        {suggestions.map((s) => (
          <div key={s.id} className="border border-border rounded-lg p-3 space-y-2 bg-card/60">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">{s.section_hint || 'General'}</span>
              <Badge className={statusColors[s.status] || ''}>{s.status}</Badge>
            </div>
            <p className="text-sm text-foreground">{s.replacement_text || s.target_quote}</p>
            {s.reason && <p className="text-xs text-muted-foreground">{s.reason}</p>}
            <div className="flex gap-2">
              <Button size="sm" onClick={() => onAccept(s)} disabled={s.status !== 'pending'} className="flex-1">
                Accept
              </Button>
              <Button size="sm" variant="outline" onClick={() => onReject(s)} disabled={s.status !== 'pending'} className="flex-1">
                Reject
              </Button>
            </div>
          </div>
        ))}
        {!suggestions.length && (
          <p className="text-sm text-muted-foreground">No suggestions yet. Generate to see inline ideas.</p>
        )}
      </div>
    </div>
  );
};

export default SuggestionsPanel;
