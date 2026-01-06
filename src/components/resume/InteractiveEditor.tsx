import React, { useEffect, useMemo, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ResumeSuggestion } from '@/types/editor';

interface InteractiveEditorProps {
  docText: string;
  suggestions: ResumeSuggestion[];
  onTextChange: (next: string) => void;
  onAccept: (suggestion: ResumeSuggestion) => void;
  onReject: (suggestion: ResumeSuggestion) => void;
  onGenerateSuggestions: () => void;
  isGenerating: boolean;
}

const InteractiveEditor: React.FC<InteractiveEditorProps> = ({
  docText,
  suggestions,
  onTextChange,
  onAccept,
  onReject,
  onGenerateSuggestions,
  isGenerating,
}) => {
  const editorRef = useRef<HTMLDivElement | null>(null);

  // Build text segments with inline suggestion decorations
  const segments = useMemo(() => {
    const pending = suggestions.filter((s) => s.status === 'pending');
    const blocks: Array<{ type: 'text' | 'suggestion'; content: string; suggestion?: ResumeSuggestion; }> = [];
    let cursor = 0;
    const text = docText || '';

    pending.forEach((sugg) => {
      const idx = text.indexOf(sugg.target_quote, cursor);
      if (idx === -1) return; // skip if not found
      if (idx > cursor) {
        blocks.push({ type: 'text', content: text.slice(cursor, idx) });
      }
      const replacement = sugg.replacement_text || sugg.target_quote;
      blocks.push({ type: 'suggestion', content: replacement, suggestion: sugg });
      cursor = idx + sugg.target_quote.length;
    });

    if (cursor < text.length) {
      blocks.push({ type: 'text', content: text.slice(cursor) });
    }

    if (!blocks.length) {
      blocks.push({ type: 'text', content: text });
    }

    return blocks;
  }, [docText, suggestions]);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    // Keep caret stable by not resetting innerText when user types; we rely on React render only when docText changes.
  }, [docText]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Interactive Resume Editor</h3>
        <Button size="sm" variant="outline" onClick={onGenerateSuggestions} disabled={isGenerating}>
          {isGenerating ? 'Generating...' : 'Generate Suggestions'}
        </Button>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className={cn(
          'min-h-[400px] rounded-xl border border-border bg-card p-4 focus:outline-none focus:ring-2 focus:ring-primary/50',
          'prose prose-sm max-w-none dark:prose-invert'
        )}
        onInput={(e) => {
          const next = (e.currentTarget.innerText ?? '').trimEnd();
          onTextChange(next);
        }}
      >
        {segments.map((seg, i) => {
          if (seg.type === 'text') {
            return <span key={i}>{seg.content}</span>;
          }
          const suggestion = seg.suggestion!;
          return (
            <span key={i} className="inline-flex items-center gap-2 px-1 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-200" contentEditable={false}>
              <span>{seg.content}</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="h-6 w-6 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center"
                  onClick={() => onAccept(suggestion)}
                >
                  ✓
                </button>
                <button
                  type="button"
                  className="h-6 w-6 rounded-full bg-destructive text-white text-xs flex items-center justify-center"
                  onClick={() => onReject(suggestion)}
                >
                  ✕
                </button>
              </div>
            </span>
          );
        })}
      </div>
    </div>
  );
};

export default InteractiveEditor;
