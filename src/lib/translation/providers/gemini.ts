import { GoogleGenAI } from "@google/genai";
import { SubtitleCue } from "../types";

export async function translateWithGemini(
  chunk: SubtitleCue[],
  targetLanguageName: string,
  userApiKey?: string
): Promise<SubtitleCue[]> {
  const activeKey = userApiKey?.trim();

  if (!activeKey) {
    throw new Error(
      "Gemini API key is required for AI mode. Please enter your API key in the settings (stored only in your browser) or switch to Google Translate (Free)."
    );
  }

  const ai = new GoogleGenAI({ apiKey: activeKey });

  const prompt = `You are a professional subtitle translator.
Translate the following array of subtitle objects from English to ${targetLanguageName}.
Maintain the exact same array structure. ONLY translate the 'text' field to ${targetLanguageName}. Keep 'id', 'startTime', and 'endTime' completely unmodified.
Do not add any conversational text or markdown formatting outside of the JSON array.

Input JSON:
${JSON.stringify(chunk)}
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });

  const translatedText = response.text;
  if (!translatedText) {
    throw new Error("Received empty response from Gemini API");
  }

  try {
    const parsed = JSON.parse(translatedText);
    if (!Array.isArray(parsed)) {
      throw new Error("Gemini response is not a valid JSON array");
    }
    return parsed;
  } catch (parseError: any) {
    console.error("Failed to parse JSON response from Gemini:", translatedText);
    throw new Error(`Failed to parse Gemini response as JSON: ${parseError.message}`);
  }
}
