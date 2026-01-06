import React, { useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ResumeSuggestion } from '@/types/editor';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

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
  const editorRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const escapeHtml = (input: string) =>
    input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  const buildHtmlWithSuggestions = (text: string, pending: ResumeSuggestion[]) => {
    const base = text || '';
    let cursor = 0;
    const parts: string[] = [];

    pending.forEach((sugg) => {
      const idx = base.indexOf(sugg.target_quote, cursor);
      if (idx === -1) return;
      if (idx > cursor) {
        parts.push(escapeHtml(base.slice(cursor, idx)));
      }
      const replacement = sugg.replacement_text || sugg.target_quote;
      parts.push(
        `<span class="suggestion-chip" data-suggestion-id="${sugg.id}">` +
          `${escapeHtml(replacement)}` +
          `<span class="suggestion-control" data-suggestion-id="${sugg.id}" data-action="accept">✓</span>` +
          `<span class="suggestion-control" data-suggestion-id="${sugg.id}" data-action="reject">✕</span>` +
        `</span>`
      );
      cursor = idx + sugg.target_quote.length;
    });

    if (cursor < base.length) {
      parts.push(escapeHtml(base.slice(cursor)));
    }

    if (!parts.length) {
      parts.push(escapeHtml(base));
    }

    const html = parts.join('');
    return `<p>${html.replace(/\n/g, '</p><p>')}</p>`;
  };

  const pendingSuggestions = useMemo(() => suggestions.filter((s) => s.status === 'pending'), [suggestions]);
  const editorData = useMemo(() => buildHtmlWithSuggestions(docText, pendingSuggestions), [docText, pendingSuggestions]);

  const handleClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const action = target.dataset.action;
    const suggestionId = target.dataset.suggestionId;
    if (!action || !suggestionId) return;
    const suggestion = suggestions.find((s) => s.id === suggestionId);
    if (!suggestion) return;
    event.preventDefault();
    event.stopPropagation();
    if (action === 'accept') {
      onAccept(suggestion);
    } else if (action === 'reject') {
      onReject(suggestion);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener('click', handleClick);
    return () => {
      container.removeEventListener('click', handleClick);
    };
  });

  const suggestionStyles = `
    .suggestion-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 2px 6px;
      border-radius: 6px;
      background: rgba(16, 185, 129, 0.15);
      color: #065f46;
    }
    .suggestion-control {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 18px;
      height: 18px;
      border-radius: 999px;
      background: #10b981;
      color: white;
      font-size: 11px;
      cursor: pointer;
      user-select: none;
    }
    .suggestion-control[data-action='reject'] {
      background: #ef4444;
    }
  `;

  return (
    <div className="space-y-3" ref={containerRef}>
      <style>{suggestionStyles}</style>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Interactive Resume Editor</h3>
        <Button size="sm" variant="outline" onClick={onGenerateSuggestions} disabled={isGenerating}>
          {isGenerating ? 'Generating...' : 'Generate Suggestions'}
        </Button>
      </div>

      <CKEditor
        editor={ClassicEditor}
        data={editorData}
        onReady={(editor) => {
          editorRef.current = editor;
        }}
        onChange={(_, editor) => {
          const html = editor.getData() || '';
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          const text = doc.body.innerText.replace(/\u00A0/g, ' ').trimEnd();
          onTextChange(text);
        }}
        config={{
          toolbar: ['undo', 'redo', '|', 'bold', 'italic', 'underline', 'bulletedList', 'numberedList', 'link', 'blockQuote'],
        }}
      />
    </div>
  );
};

export default InteractiveEditor;
