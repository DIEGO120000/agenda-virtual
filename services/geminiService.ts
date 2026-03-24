import { GoogleGenerativeAI } from "@google/generative-ai";
import { AppState } from "../types";

// --- VERIFICACIÓN DE NÚCLEO v5.7 ---
const rawKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const apiKey = rawKey.trim().replace(/["']/g, "");

export const getAIResponse = async (
  state: AppState, 
  userPrompt: string, 
  audio?: { data: string, mimeType: string },
  fileData?: { data: string, mimeType: string }
) => {
  if (!apiKey || apiKey.length < 10) throw new Error("API_KEY_NOT_FOUND_IN_GITHUB");

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Usamos el modelo estándar de AI Studio
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    const parts: any[] = [];
    if (audio) parts.push({ inlineData: { mimeType: audio.mimeType, data: audio.data } });
    if (fileData) parts.push({ inlineData: { mimeType: fileData.mimeType, data: fileData.data } });
    parts.push({ text: `ESTADO: ${JSON.stringify(state)}. ORDEN: ${userPrompt || "Sincronizar."}` });

    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig: { temperature: 0.1 }
    });

    return {
      text: result.response.text(),
      functionCalls: undefined
    };
  } catch (error: any) {
    if (error.message?.includes("404")) {
      throw new Error("ERROR_404: Tu clave es de 'Google Cloud' (PAGO). ÚSALA EN 'AI Studio' (GRATIS) para que funcione sin pagar.");
    }
    throw error;
  }
};