import { SubtitleCue } from "../types";

const DELIMITER = "\n~~~SPLIT~~~\n";
const GOOGLE_TRANSLATE_ENDPOINT = "https://translate.googleapis.com/translate_a/single";

/**
 * Translates a single text using Cloudflare Worker proxy (Solution 2) if configured,
 * with automatic fallback to Google Translate's free web endpoint.
 */
async function translateSingleText(text: string, targetLang: string): Promise<string> {
  if (!text || !text.trim()) {
    return text;
  }

  const proxyUrl = process.env.CLOUDFLARE_WORKER_URL || process.env.TRANSLATION_PROXY_URL;

  // 1. Try Cloudflare Worker Proxy first (if configured in environment variables)
  if (proxyUrl && proxyUrl.trim()) {
    try {
      const proxyRes = await fetch(proxyUrl.trim(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          targetLang,
        }),
      });

      if (proxyRes.ok) {
        const data = await proxyRes.json();
        if (data && typeof data.translatedText === "string") {
          return data.translatedText;
        }
      } else {
        console.warn(
          `Cloudflare translation proxy responded with HTTP ${proxyRes.status}. Falling back to direct endpoint.`
        );
      }
    } catch (proxyErr) {
      console.warn("Cloudflare translation proxy error, falling back to direct endpoint:", proxyErr);
    }
  }

  // 2. Direct Google Translate web endpoint (default / fallback)
  const params = new URLSearchParams({
    client: "gtx",
    sl: "auto",
    tl: targetLang,
    dt: "t",
    q: text,
  });

  const res = await fetch(GOOGLE_TRANSLATE_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
    body: params.toString(),
  });

  if (!res.ok) {
    throw new Error(`Google Translate responded with HTTP ${res.status}`);
  }

  const data = await res.json();
  if (Array.isArray(data) && Array.isArray(data[0])) {
    return data[0].map((item: any) => item[0] || "").join("");
  }

  return text;
}

/**
 * Translates a chunk of subtitle cues using Google Translate (No AI).
 * Uses batched POST requests with delimiters for high speed, and falls back to
 * parallel item-by-item translation if delimiter alignment ever diverges.
 */
export async function translateWithGoogle(
  chunk: SubtitleCue[],
  targetLangCode: string
): Promise<SubtitleCue[]> {
  if (!chunk || chunk.length === 0) {
    return [];
  }

  // Pre-process cues
  const texts = chunk.map((c) => (c.text || "").trim());

  // Check if any non-empty texts exist
  const hasContent = texts.some((t) => t.length > 0);
  if (!hasContent) {
    return chunk;
  }

  try {
    // Attempt fast batch translation using delimiter
    const combinedText = texts.map((t) => (t === "" ? "[EMPTY]" : t)).join(DELIMITER);
    const translatedCombined = await translateSingleText(combinedText, targetLangCode);

    // Split translated text back using the delimiter regex
    const splitRegex = /\s*~~~SPLIT~~~\s*/;
    const splitParts = translatedCombined.split(splitRegex);

    if (splitParts.length === chunk.length) {
      return chunk.map((cue, index) => {
        let translated = splitParts[index].trim();
        if (translated === "[EMPTY]") translated = "";
        return {
          ...cue,
          text: translated || cue.text,
        };
      });
    }

    console.warn(
      `Delimiter split count mismatch (${splitParts.length} vs expected ${chunk.length}). Falling back to micro-batching.`
    );
  } catch (batchErr) {
    console.warn("Batch translation error, falling back to safe item-by-item:", batchErr);
  }

  // Fallback: translate cues individually in parallel with controlled concurrency
  const results = await Promise.all(
    chunk.map(async (cue) => {
      try {
        if (!cue.text || !cue.text.trim()) {
          return cue;
        }
        const translated = await translateSingleText(cue.text, targetLangCode);
        return {
          ...cue,
          text: translated.trim() || cue.text,
        };
      } catch (err) {
        console.error(`Failed to translate cue ID ${cue.id}:`, err);
        return cue; // Keep original on cue-specific error
      }
    })
  );

  return results;
}
