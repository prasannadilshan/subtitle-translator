import { SubtitleCue } from "../types";

export interface GeminiProviderError extends Error {
  isKeyError?: boolean;
  statusCode?: number;
}

/**
 * Translates a chunk of subtitle cues using Google Gemini REST API via native fetch.
 * Uses zero Node.js-only SDKs to ensure 100% compatibility across Cloudflare Workers,
 * OpenNext, Vercel, and standard Node.js environments.
 */
export async function translateWithGemini(
  chunk: SubtitleCue[],
  targetLanguageName: string,
  userApiKey?: string
): Promise<SubtitleCue[]> {
  const activeKey = userApiKey?.trim();

  if (!activeKey) {
    const err: GeminiProviderError = new Error(
      "Gemini API key is required for AI mode. Please enter your API key in the settings (stored only in your browser) or switch to Google Translate (Free)."
    );
    err.isKeyError = true;
    throw err;
  }

  const prompt = `You are a professional subtitle translator.
Translate the following array of subtitle objects from English to ${targetLanguageName}.
Maintain the exact same array structure. ONLY translate the 'text' field to ${targetLanguageName}. Keep 'id', 'startTime', and 'endTime' completely unmodified.
Do not add any conversational text or markdown formatting outside of the JSON array.

Input JSON:
${JSON.stringify(chunk)}
`;

  const primaryModel = "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${primaryModel}:generateContent?key=${encodeURIComponent(
    activeKey
  )}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => null);
    const msg = errorJson?.error?.message || `HTTP ${res.status}`;
    const code = errorJson?.error?.code || res.status;

    const isInvalidKey =
      code === 400 &&
      (msg.toLowerCase().includes("api key") ||
        msg.toLowerCase().includes("invalid") ||
        msg.toLowerCase().includes("not valid")) ||
      code === 401 ||
      code === 403;

    const err: GeminiProviderError = new Error(msg);
    err.isKeyError = isInvalidKey;
    err.statusCode = code;
    throw err;
  }

  const data = await res.json();
  let rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error("Received empty response from Gemini API");
  }

  rawText = rawText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  let parsed: any;
  try {
    parsed = JSON.parse(rawText);
  } catch (parseError: any) {
    throw new Error(`Failed to parse Gemini response as JSON: ${parseError.message}`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Gemini response is not a valid JSON array");
  }

  return chunk.map((originalCue, idx) => {
    const translatedCue = parsed[idx];
    const translatedText =
      translatedCue && typeof translatedCue.text === "string" && translatedCue.text.trim()
        ? translatedCue.text.trim()
        : originalCue.text;

    return {
      id: originalCue.id,
      startTime: originalCue.startTime,
      endTime: originalCue.endTime,
      text: translatedText,
    };
  });
}

