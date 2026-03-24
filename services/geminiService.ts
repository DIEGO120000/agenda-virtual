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

  if (!apiKey) throw new Error("API_KEY_EMPTY");

  const genAI = new GoogleGenerativeAI(apiKey);

  // --- DIAGNÓSTICO DE MODELOS ---
  // Intentamos listar modelos para ver qué tiene permitido esta clave
  console.group("🔍 DIAGNÓSTICO DE CAPACIDADES v4.2");
  console.log("Key Prefix:", apiKey.substring(0, 6) + "...");
  console.groupEnd();

  // 1. Intentamos con el nombre de modelo más básico y compatible
  const modelName = "gemini-1.5-flash"; 
  
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: `Identidad: Admin v4.2. Estado: ${JSON.stringify(state)}`,
  });

  try {
    const parts: any[] = [];
    if (audio) parts.push({ inlineData: { mimeType: audio.mimeType, data: audio.data } });
    if (fileData) parts.push({ inlineData: { mimeType: fileData.mimeType, data: fileData.data } });
    parts.push({ text: userPrompt || "Sincronización requerida." });

    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig: { temperature: 0.1 }
    });

    return {
      text: result.response.text(),
      functionCalls: undefined // Desactivamos tools temporalmente para aislar el error 404
    };
  } catch (error: any) {
    console.error("❌ FALLO_CRÍTICO_V4.2:", error);
    
    // Si da 404, damos una instrucción clara al usuario
    if (error.message?.includes("404")) {
      throw new Error(`MODEL_NOT_FOUND: La API Key no tiene acceso a '${modelName}'. Verifica que 'Generative Language API' esté activa en AI Studio.`);
    }
    throw error;
  }
};