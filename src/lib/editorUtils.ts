import { ResumeSuggestion } from '@/types/editor';

export const extractPlainTextFromDoc = (docJson: Record<string, unknown> | null) => {
  if (!docJson || typeof docJson !== 'object') return '';
  const content = (docJson as { content?: Array<{ text?: string }> }).content || [];
  return content.map((block) => block.text || '').join('\n');
};

export const applySuggestionToText = (text: string, suggestion: ResumeSuggestion) => {
  if (!text) return text;
  const idx = text.indexOf(suggestion.target_quote);
  if (idx === -1) return text;

  if (suggestion.type === 'delete') {
    return text.slice(0, idx) + text.slice(idx + suggestion.target_quote.length);
  }

  const replacement = suggestion.replacement_text || suggestion.target_quote;
  if (suggestion.type === 'replace') {
    return text.slice(0, idx) + replacement + text.slice(idx + suggestion.target_quote.length);
  }

  if (suggestion.type === 'insert_after') {
    const insertPos = idx + suggestion.target_quote.length;
    return text.slice(0, insertPos) + ' ' + replacement + text.slice(insertPos);
  }

  return text;
};
