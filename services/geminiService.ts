
import { GoogleGenAI } from "@google/genai";

export async function removeWatermark(imageBase64: string): Promise<string> {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API key is not configured.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // Clean up base64 prefix if present
  const base64Data = imageBase64.replace(/^data:image\/(png|jpeg|webp);base64,/, '');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: 'image/png'
            }
          },
          {
            text: "Remove all watermarks, logos, brand names, and overlaid text from this image. Reconstruct the background texture and lighting seamlessly so the image looks completely natural and professional. Return ONLY the edited image."
          }
        ]
      }
    });

    const candidate = response.candidates?.[0];
    if (!candidate) throw new Error("No response from AI.");

    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("The model did not return an image part.");
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}
