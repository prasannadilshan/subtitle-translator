import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const { chunk } = await req.json();
    
    if (!chunk || !Array.isArray(chunk)) {
      return NextResponse.json({ error: "Invalid chunk data provided." }, { status: 400 });
    }

    const prompt = `You are a professional subtitle translator.
Translate the following array of subtitle objects from English to Sinhala.
Maintain the exact same array structure. ONLY translate the 'text' field to Sinhala. Keep 'id', 'startTime', and 'endTime' completely unmodified.
Do not add any conversational text or formatting outside of the JSON array.

Input JSON:
${JSON.stringify(chunk)}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const translatedText = response.text;
    
    if (!translatedText) {
      throw new Error("Received empty response from Gemini API");
    }

    let translatedChunk;
    try {
      translatedChunk = JSON.parse(translatedText);
    } catch (parseError) {
      console.error("Failed to parse JSON response:", translatedText);
      throw new Error("Failed to parse Gemini response as JSON.");
    }

    return NextResponse.json({ translatedChunk });

  } catch (error: any) {
    console.error("Translation API Error:", error);
    return NextResponse.json({ error: error.message || "An error occurred during translation" }, { status: 500 });
  }
}
