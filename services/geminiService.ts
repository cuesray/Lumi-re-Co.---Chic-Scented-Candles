
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getScentRecommendation(mood: string, preferences: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a world-class perfumer and scent specialist for an aesthetic candle brand called "Lumière & Co.". 
      A customer is feeling "${mood}" and usually likes "${preferences}". 
      Recommend which of our types (Floral, Woody, Fresh, or Gourmand) would suit them best and describe a "vibe" for their ideal candle. 
      Keep it poetic, aesthetic, and brief (max 3 sentences).`,
    });
    return response.text || "Our candles are crafted to match every mood. Try our Floral collection for a gentle reset.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The stars are aligning for a cozy night. We recommend our signature Sandalwood blend.";
  }
}
