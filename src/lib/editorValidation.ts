import { z } from 'zod';
import { EditorSuggestionPayload } from '@/types/editor';

export const suggestionSchema = z.object({
  suggestionId: z.string().uuid(),
  type: z.enum(['replace', 'insert_after', 'delete']),
  targetQuote: z.string().min(1),
  replacementText: z.string().optional(),
  reason: z.string().min(1),
  sectionHint: z.string().optional(),
  confidence: z.number().min(0).max(1),
});

export const suggestionArraySchema = z.array(suggestionSchema);

export const validateSuggestions = (input: unknown): EditorSuggestionPayload[] => {
  const parsed = suggestionArraySchema.parse(input);
  return parsed as EditorSuggestionPayload[];
};
