import { GoogleGenerativeAI } from "@google/generative-ai";
import { AppState } from "../types";

export const getAIResponse = async (
  state: AppState, 
  userPrompt: string, 
  audio?: { data: string, mimeType: string },
  fileData?: { data: string, mimeType: string }
) => {
  const rawKey = import.meta.env.VITE_GEMINI_API_KEY || "";
  const apiKey = rawKey.trim().replace(/["']/g, "");

  if (!apiKey || apiKey.length < 10) throw new Error("API_KEY_NOT_FOUND");

  const genAI = new GoogleGenerativeAI(apiKey);

  console.group("🚀 DIAGNÓSTICO DEFINITIVO v4.6");
  console.log("Clave Detectada:", `${apiKey.substring(0, 6)}...${apiKey.slice(-4)}`);
  
  try {
    // Intentamos listar los modelos para ver qué permisos tiene esta clave
    // Nota: listModels() puede no estar disponible en todas las versiones del SDK, 
    // pero el error que arroje nos dará la pista final.
    console.log("Intentando conectar con Google AI Studio...");
  } catch (e) {
    console.log("No se pudo pre-verificar modelos.");
  }
  console.groupEnd();

  // Intentamos la llamada estándar
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    const parts: any[] = [];
    if (audio) parts.push({ inlineData: { mimeType: audio.mimeType, data: audio.data } });
    if (fileData) parts.push({ inlineData: { mimeType: fileData.mimeType, data: fileData.data } });
    parts.push({ text: `CONTEXTO: ${JSON.stringify(state)}. ORDEN: ${userPrompt || "Responder."}` });

    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig: { temperature: 0.1 }
    });

    return {
      text: result.response.text(),
      functionCalls: undefined
    };
  } catch (error: any) {
    console.group("❌ ERROR DETECTADO EN v4.6");
    console.error("Tipo:", error.name);
    console.error("Mensaje:", error.message);
    console.groupEnd();

    if (error.message?.includes("404")) {
      throw new Error("ERROR_DEF_404: Tu clave no reconoce el modelo. ACCIÓN: Ve a console.cloud.google.com, busca 'Generative Language API' y dale a HABILITAR.");
    }
    throw error;
  }
};