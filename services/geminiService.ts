import { GoogleGenerativeAI } from "@google/generative-ai";
import { AppState, PrioridadTarea } from "../types";

// --- NÚCLEO v6.0 (SECURITY & DEBUG) ---
const getCleanKey = () => {
  const raw = import.meta.env.VITE_GEMINI_API_KEY || "";
  return raw.trim().replace(/["']/g, "");
};

const tools = [
  {
    name: 'gestionar_agenda',
    description: 'Modifica tareas académicas.',
    parameters: {
      type: 'object',
      properties: {
        tareas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              nombre: { type: 'string' },
              recomendado: { type: 'string' },
              culminacion: { type: 'string' },
              criticidad: { type: 'number' },
              prioridad: { type: 'string', enum: ['Baja', 'Media', 'Alta', 'Urgente'] }
            },
            required: ['nombre', 'recomendado', 'culminacion', 'criticidad', 'prioridad']
          }
        }
      },
      required: ['tareas']
    }
  },
  {
    name: 'gestionar_horario',
    description: 'Modifica el horario.',
    parameters: {
      type: 'object',
      properties: {
        eventos: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dia: { type: 'string' },
              hora: { type: 'string' },
              horaFin: { type: 'string' },
              actividad: { type: 'string' },
              tipo: { type: 'string', enum: ['clase', 'estudio', 'descanso'] },
              modalidad: { type: 'string', enum: ['Virtual', 'Semipresencial', 'Presencial'] }
            },
            required: ['dia', 'hora', 'horaFin', 'actividad', 'tipo']
          }
        }
      },
      required: ['eventos']
    }
  },
  {
    name: 'gestionar_notes',
    description: 'Guarda notas.',
    parameters: {
      type: 'object',
      properties: {
        notes: { type: 'array', items: { type: 'string' } }
      },
      required: ['notes']
    }
  },
  {
    name: 'gestionar_pasatiempos',
    description: 'Registra hobbies.',
    parameters: {
      type: 'object',
      properties: {
        hobbies: { type: 'array', items: { type: 'string' } }
      },
      required: ['hobbies']
    }
  },
  {
    name: 'eliminar_contenido',
    description: 'Borra contenido.',
    parameters: {
      type: 'object',
      properties: {
        tipo: { type: 'string', enum: ['tarea', 'horario', 'nota', 'pasatiempo'] },
        criterios: { type: 'array', items: { type: 'string' } }
      },
      required: ['tipo', 'criterios']
    }
  }
];

export const getAIResponse = async (
  state: AppState, 
  userPrompt: string, 
  audio?: { data: string, mimeType: string },
  fileData?: { data: string, mimeType: string }
) => {
  const apiKey = getCleanKey();

  if (!apiKey || apiKey.length < 20) {
    throw new Error("CLAVE_INVÁLIDA_O_EXPUESTA: Por favor genera una nueva clave en AI Studio.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: "ERES ASISTENTE v6.0. EFICIENTE Y DIRECTA.",
  });

  try {
    const parts: any[] = [];
    if (audio) parts.push({ inlineData: { mimeType: audio.mimeType, data: audio.data } });
    if (fileData) parts.push({ inlineData: { mimeType: fileData.mimeType, data: fileData.data } });
    parts.push({ text: `ESTADO: ${JSON.stringify(state)}. ORDEN: ${userPrompt || "Sincronizar."}` });

    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
      tools: [{ functionDeclarations: tools as any }],
      generationConfig: { temperature: 0.1 }
    });

    const response = result.response;
    const functionCalls = response.candidates?.[0]?.content?.parts
      ?.filter(p => p.functionCall)
      .map(p => p.functionCall);

    return {
      text: response.text(),
      functionCalls: functionCalls?.length ? functionCalls : undefined
    };
  } catch (error: any) {
    console.error("V6.0_FATAL:", error);
    if (error.message?.includes("API_KEY_INVALID") || error.message?.includes("not found")) {
      throw new Error("LA_CLAVE_HA_SIDO_DESACTIVADA: Google detectó que la clave se filtró. GENERA UNA NUEVA EN AI STUDIO.");
    }
    throw error;
  }
};