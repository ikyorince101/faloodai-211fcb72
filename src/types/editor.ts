export type SuggestionType = 'replace' | 'insert_after' | 'delete';
export type SuggestionStatus = 'pending' | 'accepted' | 'rejected';

export interface ResumeEditorDoc {
  id: string;
  resume_id: string;
  user_id: string;
  doc_json: Record<string, unknown>;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface ResumeSuggestion {
  id: string;
  suggestion_id: string;
  resume_id: string;
  user_id: string;
  type: SuggestionType;
  target_quote: string;
  replacement_text?: string | null;
  reason?: string | null;
  status: SuggestionStatus;
  section_hint?: string | null;
  confidence?: number | null;
  created_at: string;
  decided_at?: string | null;
}

export interface EditorSuggestionPayload {
  suggestionId: string;
  type: SuggestionType;
  targetQuote: string;
  replacementText?: string;
  reason: string;
  sectionHint?: string;
  confidence: number;
}
