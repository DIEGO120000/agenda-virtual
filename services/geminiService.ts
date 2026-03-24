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

  // RASTREADOR DE INTEGRIDAD (Ver en Consola F12)
  console.group("🛡️ VERIFICACIÓN DE LLAVE v4.5");
  if (apiKey.length > 10) {
    console.log("IDENTIFICADOR_CLAVE:", `${apiKey.substring(0, 6)}...${apiKey.slice(-4)}`);
    console.log("LONGITUD_OK:", apiKey.length);
  } else {
    console.error("CLAVE_NO_DETECTADA_O_MUY_CORTA");
  }
  console.groupEnd();

  if (!apiKey || apiKey.length < 10) {
    throw new Error("ERROR_V4.5: LA_CLAVE_NO_LLEGÓ_AL_NAVEGADOR. Revisa 'Secrets' en GitHub.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Probamos con el modelo más estable sin parámetros extra para forzar conexión
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    const parts: any[] = [];
    if (audio) parts.push({ inlineData: { mimeType: audio.mimeType, data: audio.data } });
    if (fileData) parts.push({ inlineData: { mimeType: fileData.mimeType, data: fileData.data } });
    parts.push({ text: `ESTADO_ACTUAL: ${JSON.stringify(state)}. ORDEN: ${userPrompt || "Sincronizar."}` });

    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig: { temperature: 0.1 }
    });

    return {
      text: result.response.text(),
      functionCalls: undefined
    };
  } catch (error: any) {
    console.error("DETALLE_ERROR_V4.5:", error);
    throw error;
  }
};