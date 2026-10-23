import { SubtitleCue } from "../types";

export interface GeminiClientError extends Error {
  isKeyError?: boolean;
  statusCode?: number;
}

/**
 * Translates a chunk of subtitle cues directly from the user's browser using Google Gemini REST API.
 * 
 * - 100% Client-Side: Requests never hit your Next.js server, consuming 0 server resources.
 * - Detects invalid/expired API keys specifically to warn the user.
 * - Transparent retry/fallback on temporary errors without throwing scary UI failures.
 */
export async function translateWithGeminiClient(
  chunk: SubtitleCue[],
  targetLanguageName: string,
  apiKey: string
): Promise<SubtitleCue[]> {
  const cleanKey = apiKey.trim();

  if (!cleanKey) {
    const keyErr: GeminiClientError = new Error(
      "Gemini API key is required for AI mode. Please enter your key in the settings or switch to Google Translate."
    );
    keyErr.isKeyError = true;
    throw keyErr;
  }

  const prompt = `You are a professional subtitle translator.
Translate the following array of subtitle objects from English to ${targetLanguageName}.
Maintain the exact same array structure. ONLY translate the 'text' field to ${targetLanguageName}. Keep 'id', 'startTime', and 'endTime' completely unmodified.
Do not add any conversational text or markdown formatting outside of the JSON array.

Input JSON:
${JSON.stringify(chunk)}
`;

  // We use gemini-2.5-flash, with fallback to gemini-flash-latest
  const primaryModel = "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${primaryModel}:generateContent?key=${encodeURIComponent(
    cleanKey
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
    const status = errorJson?.error?.status || "";
    const code = errorJson?.error?.code || res.status;

    // Detect if this error is specifically caused by an invalid/unauthorized API key
    const isInvalidKey =
      code === 400 &&
      (msg.toLowerCase().includes("api key") ||
        msg.toLowerCase().includes("invalid") ||
        msg.toLowerCase().includes("not valid")) ||
      code === 401 ||
      code === 403 ||
      status === "PERMISSION_DENIED" ||
      msg.includes("API_KEY_INVALID");

    // Detect if the daily quota is completely exhausted (cannot be resolved by fast retries)
    const isQuotaExhausted =
      code === 429 &&
      (msg.toLowerCase().includes("quota") ||
        msg.toLowerCase().includes("plan and billing") ||
        msg.toLowerCase().includes("resource_exhausted") ||
        status === "RESOURCE_EXHAUSTED");

    let friendlyMessage = msg;
    if (isInvalidKey) {
      friendlyMessage = "Your Gemini API key is invalid or not working. Please check your key in settings.";
    } else if (isQuotaExhausted) {
      friendlyMessage =
        "Gemini free quota limit reached for this API key (429: Quota Exhausted). Please wait or switch to Google Translate (Free).";
    }

    const error: GeminiClientError = new Error(friendlyMessage);
    error.isKeyError = isInvalidKey || isQuotaExhausted;
    error.statusCode = code;
    throw error;
  }

  const data = await res.json();
  let rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error("Received empty response from Gemini API");
  }

  // Strip potential markdown wrappers like ```json ... ```
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

  // Align translated text back with original cue timestamps and IDs
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
