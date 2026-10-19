import { NextResponse } from "next/server";
import { getLanguageByCode } from "@/lib/languages";
import { TranslationRequestBody, SubtitleCue } from "@/lib/translation/types";
import { translateWithGemini } from "@/lib/translation/providers/gemini";
import { translateWithGoogle } from "@/lib/translation/providers/google";

export async function POST(req: Request) {
  try {
    const body: TranslationRequestBody = await req.json();
    const { chunk, targetLang = "en", engine = "google", apiKey } = body;

    if (!chunk || !Array.isArray(chunk) || chunk.length === 0) {
      return NextResponse.json({ error: "Invalid or empty chunk data provided." }, { status: 400 });
    }

    const language = getLanguageByCode(targetLang);

    let translatedChunk: SubtitleCue[];

    if (engine === "google") {
      translatedChunk = await translateWithGoogle(chunk, language.code);
    } else if (engine === "gemini") {
      if (!apiKey || !apiKey.trim()) {
        return NextResponse.json(
          {
            error:
              "Gemini API key is required for AI mode. Please enter your API key in the settings or switch to Google Translate.",
          },
          { status: 400 }
        );
      }
      translatedChunk = await translateWithGemini(chunk, language.name, apiKey);
    } else {
      return NextResponse.json(
        { error: `Unsupported translation engine: '${engine}'. Choose 'gemini' or 'google'.` },
        { status: 400 }
      );
    }

    return NextResponse.json({ translatedChunk });
  } catch (error: any) {
    console.error("Translation API Error:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred during translation" },
      { status: 500 }
    );
  }
}
