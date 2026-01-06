import { applySuggestionToText, extractPlainTextFromDoc } from '@/lib/editorUtils';
import { validateSuggestions } from '@/lib/editorValidation';

export const runEditorRuntimeChecks = () => {
  // Suggestion schema validation
  try {
    validateSuggestions([
      {
        suggestionId: '00000000-0000-4000-8000-000000000001',
        type: 'replace',
        targetQuote: 'foo',
        replacementText: 'bar',
        reason: 'better wording',
        confidence: 0.8,
      },
    ]);
  } catch (err) {
    console.warn('Suggestion validation failed', err);
  }

  // applySuggestion tests
  const base = 'I led a team of 5.';
  const replaced = applySuggestionToText(base, {
    id: '1',
    suggestion_id: '00000000-0000-4000-8000-0000000000a1',
    resume_id: 'r1',
    user_id: 'u1',
    type: 'replace',
    target_quote: 'led',
    replacement_text: 'managed',
    reason: 'clarity',
    status: 'pending',
    created_at: '',
  } as any);
  console.assert(replaced.includes('managed'), 'Replace should swap text');

  const inserted = applySuggestionToText(base, {
    id: '2',
    suggestion_id: 's2',
    resume_id: 'r1',
    user_id: 'u1',
    type: 'insert_after',
    target_quote: 'team',
    replacement_text: ' of engineers',
    reason: 'detail',
    status: 'pending',
    created_at: '',
  } as any);
  console.assert(inserted.includes('team of engineers'), 'Insert_after should append text');

  const deleted = applySuggestionToText(base, {
    id: '3',
    suggestion_id: 's3',
    resume_id: 'r1',
    user_id: 'u1',
    type: 'delete',
    target_quote: 'team of 5',
    replacement_text: null,
    reason: 'remove detail',
    status: 'pending',
    created_at: '',
  } as any);
  console.assert(!deleted.includes('team of 5'), 'Delete should remove target');

  // extractPlainText tests
  const text = extractPlainTextFromDoc({ content: [{ text: 'Hello' }, { text: 'World' }] });
  console.assert(text === 'Hello\nWorld', 'Should join paragraphs');
};
