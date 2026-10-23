export type TranslationEngine = "google" | "groq" | "gemini";

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
