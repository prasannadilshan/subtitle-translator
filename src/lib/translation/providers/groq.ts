import { SubtitleCue } from "../types";

export interface ProviderError extends Error {
  isKeyError?: boolean;
  isQuotaExhausted?: boolean;
  statusCode?: number;
  retryAfter?: number;
}

/**
 * Supported Groq models in order of priority.
 * 1. openai/gpt-oss-20b: Fast, high throughput open-weights model hosted natively on Groq.
 * 2. openai/gpt-oss-120b: High-capacity fallback model.
 * 3. qwen/qwen3.8-27b: Fast multimodal/chat model.
 */
const GROQ_CANDIDATE_MODELS = [
  "openai/gpt-oss-20b",
  "openai/gpt-oss-120b",
  "qwen/qwen3.8-27b",
];

// Cache the last successful model to avoid redundant candidate cycling
let activeGroqModel = "openai/gpt-oss-20b";

function cleanJsonText(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }
  return cleaned.trim();
}

function extractCuesArray(parsed: any): any[] | null {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === "object") {
    if (Array.isArray(parsed.cues)) return parsed.cues;
    if (Array.isArray(parsed.subtitles)) return parsed.subtitles;
    if (Array.isArray(parsed.translations)) return parsed.translations;
    if (Array.isArray(parsed.data)) return parsed.data;
    const found = Object.values(parsed).find(Array.isArray);
    if (found) return found as any[];
  }
  return null;
}

/**
 * Translates subtitle cues using Groq's high-speed inference engine.
 * 
 * - Processed on backend to safely circumvent browser CORS limitations.
 * - Authenticated with user's personal Groq API key (tracked per-key, zero server IP rate limit).
 * - Multi-model resilience: automatically falls back if a specific model is sunsetted or restricted.
 */
export async function translateWithGroq(
  chunk: SubtitleCue[],
  targetLanguageName: string,
  apiKey: string
): Promise<SubtitleCue[]> {
  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    const err: ProviderError = new Error(
      "Groq API key is required. Get your free key at console.groq.com (no credit card needed)."
    );
    err.isKeyError = true;
    throw err;
  }

  // Token optimization: Send only id and text to save tokens and eliminate timestamp hallucination
  const cuesToTranslate = chunk.map((c) => ({ id: c.id, text: c.text }));

  let lastError: any = null;
  const modelsToTry = [
    activeGroqModel,
    ...GROQ_CANDIDATE_MODELS.filter((m) => m !== activeGroqModel),
  ];

  for (const model of modelsToTry) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cleanKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content: `You are an expert subtitle translator. Translate each subtitle text accurately and naturally into ${targetLanguageName}. Keep phrasing natural and timing concise. You must strictly respond with a JSON object: { "cues": [ { "id": "...", "text": "..." } ] }`,
            },
            {
              role: "user",
              content: JSON.stringify({ cues: cuesToTranslate }),
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.1,
          max_tokens: 4096,
        }),
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => null);
        const msg = errorJson?.error?.message || `Groq API responded with HTTP status ${res.status}`;

        if (res.status === 401 || res.status === 403) {
          const err: ProviderError = new Error(
            "Your Groq API key is invalid or unauthorized. Please verify your key in settings."
          );
          err.isKeyError = true;
          err.statusCode = res.status;
          throw err;
        }

        if (res.status === 429) {
          const retryHeader = res.headers.get("retry-after");
          let retrySeconds: number | undefined;

          if (retryHeader) {
            const parsed = parseFloat(retryHeader);
            if (!isNaN(parsed) && parsed > 0) {
              retrySeconds = Math.ceil(parsed);
            }
          }

          if (!retrySeconds && msg) {
            const match = msg.match(/try again in ([\d\.]+)s/i);
            if (match && match[1]) {
              const parsed = parseFloat(match[1]);
              if (!isNaN(parsed) && parsed > 0) {
                retrySeconds = Math.ceil(parsed);
              }
            }
          }

          // Fallback if header/msg didn't specify: default to 12s
          if (!retrySeconds || retrySeconds < 5) {
            retrySeconds = 12;
          }

          // 1s safety buffer to avoid firing directly at the quota boundary
          retrySeconds += 1;

          const err: ProviderError = new Error(
            msg || "Your Groq key has reached its speed or rate limit (429). Please wait a moment."
          );
          err.isQuotaExhausted = true;
          err.statusCode = 429;
          err.retryAfter = retrySeconds;
          throw err;
        }

        // If the model does not exist or user has no access (404), try next model in candidate list
        if (
          res.status === 404 ||
          msg.toLowerCase().includes("does not exist") ||
          msg.toLowerCase().includes("access") ||
          msg.toLowerCase().includes("decommissioned")
        ) {
          console.warn(`Groq model '${model}' unavailable (HTTP 404 / no access). Trying next model...`);
          lastError = new Error(
            `Groq model '${model}' is unavailable on your tier. Trying next model...`
          );
          lastError.statusCode = 502;
          continue;
        }

        const err: ProviderError = new Error(msg);
        err.statusCode = res.status;
        throw err;
      }

      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("Received empty response from Groq");
      }

      const cleanedContent = cleanJsonText(content);
      let parsed: any;
      try {
        parsed = JSON.parse(cleanedContent);
      } catch (parseErr: any) {
        throw new Error(`Failed to parse Groq response as JSON: ${parseErr.message}`);
      }

      const cuesArray = extractCuesArray(parsed);
      if (!cuesArray || !Array.isArray(cuesArray)) {
        throw new Error("Groq output does not contain a valid cues array");
      }

      // Model succeeded: remember it as active model for subsequent chunks
      activeGroqModel = model;

      return chunk.map((originalCue, idx) => {
        const item = cuesArray[idx];
        let translatedText = "";
        if (typeof item === "string") {
          translatedText = item.trim();
        } else if (item && typeof item === "object") {
          translatedText = (item.text || item.translation || item.translatedText || "").toString().trim();
        }
        return {
          id: originalCue.id,
          startTime: originalCue.startTime,
          endTime: originalCue.endTime,
          text: translatedText || originalCue.text,
        };
      });
    } catch (err: any) {
      if (err.isKeyError || err.isQuotaExhausted) {
        throw err;
      }
      lastError = err;
      if (err.statusCode === 502 || err.statusCode === 404) {
        continue;
      }
      console.warn(`Encountered error with Groq model '${model}':`, err.message);
    }
  }

  throw lastError || new Error("All Groq models failed to process the translation chunk.");
}
