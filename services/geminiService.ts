import { GoogleGenerativeAI } from "@google/generative-ai";
import { AppState, PrioridadTarea } from "../types";

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
              prioridad: { type: 'string', enum: Object.values(PrioridadTarea) }
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
    description: 'Modifica el horario semanal.',
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
    description: 'Guarda notas personales.',
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
    description: 'Borra elementos por nombre o tipo.',
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

  if (!apiKey) throw new Error("ERROR_V4.7: API_KEY_MISSING");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: `SISTEMA v4.7. ESTADO: ${JSON.stringify(state)}. Tarea: Administrar agenda académica.`,
    tools: [{ functionDeclarations: tools as any }]
  });

  try {
    const parts: any[] = [];
    if (audio) parts.push({ inlineData: { mimeType: audio.mimeType, data: audio.data } });
    if (fileData) parts.push({ inlineData: { mimeType: fileData.mimeType, data: fileData.data } });
    parts.push({ text: userPrompt || "Sincronizar ahora." });

    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
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
    console.error("DEBUG_V4.7:", error);
    if (error.message?.includes("404")) {
      throw new Error("404_API_DISABLE: Debes habilitar 'Generative Language API' en la consola de Google Cloud.");
    }
    throw error;
  }
};