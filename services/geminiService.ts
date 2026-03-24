import { GoogleGenerativeAI } from "@google/generative-ai";
import { AppState, PrioridadTarea } from "../types";

const tools = [
  {
    name: 'gestionar_agenda',
    description: 'Añade tareas académicas.',
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
    description: 'Añade eventos al horario.',
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
  const rawKey = import.meta.env.VITE_GEMINI_API_KEY || "";
  const apiKey = rawKey.trim().replace(/["']/g, "");

  if (!apiKey) throw new Error("API_KEY_EMPTY");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const instructionText = `IDENTIDAD: Admin v4.3. ESTADO: ${JSON.stringify(state)}. IMPORTANTE: Si vas a modificar la agenda, usa las funciones disponibles.`;

  // Iniciamos un chat con historia para inyectar las instrucciones (Método más compatible)
  const chat = model.startChat({
    history: [
      { role: "user", parts: [{ text: instructionText }] },
      { role: "model", parts: [{ text: "PROTOCOLO RECONECTADO. LISTO PARA PROCESAR." }] },
    ],
    tools: [{ functionDeclarations: tools as any }],
    generationConfig: { temperature: 0.1 }
  });

  try {
    const parts: any[] = [];
    if (audio) parts.push({ inlineData: { mimeType: audio.mimeType, data: audio.data } });
    if (fileData) parts.push({ inlineData: { mimeType: fileData.mimeType, data: fileData.data } });
    parts.push({ text: userPrompt || "Sincronizar." });

    const result = await chat.sendMessage(parts);
    const response = result.response;
    const functionCalls = response.candidates?.[0]?.content?.parts
      ?.filter(p => p.functionCall)
      .map(p => p.functionCall);

    return {
      text: response.text(),
      functionCalls: functionCalls?.length ? functionCalls : undefined
    };
  } catch (error: any) {
    console.error("❌ ERROR_4.3:", error);
    if (error.message?.includes("404")) {
      throw new Error("404_NOT_FOUND: Tu API Key no tiene acceso a Gemini. Ve a AI Studio y activa 'Generative Language API'.");
    }
    throw error;
  }
};