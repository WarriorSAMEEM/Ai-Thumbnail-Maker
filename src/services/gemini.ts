import { GoogleGenAI, type GenerateContentResponse, type Part } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || "";

export interface ThumbnailRequest {
  prompt: string;
  styleImage?: string; // base64
  subjectImage?: string; // base64
  objectImage?: string; // base64
  currentImage?: string; // base64 (for redesign)
}

export async function generateThumbnail(req: ThumbnailRequest): Promise<string | null> {
  const ai = new GoogleGenAI({ apiKey });
  
  const parts: Part[] = [];
  
  // Construct the prompt
  let fullPrompt = req.prompt;
  
  if (req.styleImage) {
    parts.push({
      inlineData: {
        data: req.styleImage.split(',')[1],
        mimeType: "image/png"
      }
    });
    fullPrompt += " Use the first image as a style and layout reference.";
  }
  
  if (req.subjectImage) {
    parts.push({
      inlineData: {
        data: req.subjectImage.split(',')[1],
        mimeType: "image/png"
      }
    });
    fullPrompt += " The second image is the main subject/face to include.";
  }
  
  if (req.objectImage) {
    parts.push({
      inlineData: {
        data: req.objectImage.split(',')[1],
        mimeType: "image/png"
      }
    });
    fullPrompt += " The third image is a key object or scene to include.";
  }
  
  if (req.currentImage) {
    parts.push({
      inlineData: {
        data: req.currentImage.split(',')[1],
        mimeType: "image/png"
      }
    });
    fullPrompt = `Redesign this thumbnail based on the following instructions: ${req.prompt}. Keep the core elements but apply these changes.`;
  } else {
    fullPrompt = `Create a high-quality YouTube thumbnail (16:9 aspect ratio). ${fullPrompt}`;
  }

  parts.push({ text: fullPrompt });

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: "16:9"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error generating thumbnail:", error);
    return null;
  }
}
