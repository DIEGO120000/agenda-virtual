import { GoogleGenerativeAI } from "@google/generative-ai";
import { AppState, PrioridadTarea } from "../types";

const tools = [
  {
    name: 'gestionar_agenda',
    description: 'Añade o modifica tareas académicas/personales.',
    parameters: {
      type: 'object',
      properties: {
        tareas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              nombre: { type: 'string' },
              recomendado: { type: 'string', description: 'YYYY-MM-DD' },
              culminacion: { type: 'string', description: 'YYYY-MM-DD' },
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
    description: 'Añade eventos al horario semanal.',
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
    description: 'Guarda recordatorios o notas.',
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
    description: 'Borra elementos por nombre.',
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
  const apiKey = (import.meta.env.VITE_GEMINI_API_KEY || "").trim().replace(/["']/g, "");
  if (!apiKey) throw new Error("API_KEY_MISSING_V4.9");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: `ERES FORMATO-A v4.9. Administras esta agenda: ${JSON.stringify(state)}. Escucha el audio con precisión fonética y ejecuta las herramientas si es necesario.`,
  });

  try {
    const parts: any[] = [];
    if (audio) {
      parts.push({ inlineData: { mimeType: audio.mimeType, data: audio.data } });
      parts.push({ text: "Escucha este audio y ejecuta la acción solicitada en la agenda." });
    }
    if (fileData) {
      parts.push({ inlineData: { mimeType: fileData.mimeType, data: fileData.data } });
    }
    
    if (userPrompt) parts.push({ text: userPrompt });

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
    console.error("V4.9_MULTIMODAL_FAIL:", error);
    throw error;
  }
};