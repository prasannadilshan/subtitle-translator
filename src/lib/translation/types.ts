export type TranslationEngine = "gemini" | "google";

export interface SubtitleCue {
  id: string;
  startTime: string;
  endTime: string;
  text: string;
}

export interface TranslationRequestBody {
  chunk: SubtitleCue[];
  targetLang?: string;
  engine?: TranslationEngine;
  apiKey?: string;
}
