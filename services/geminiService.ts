import { GoogleGenerativeAI } from "@google/generative-ai";
import { AppState, PrioridadTarea } from "../types";

// Esquema de herramientas simplificado al máximo para evitar errores de validación
const tools = [
  {
    name: 'gestionar_agenda',
    description: 'Añade o modifica tareas académicas.',
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
  const now = new Date();
  const instructionText = `
    IDENTIDAD: Administradora de Agenda v4.0.
    FECHA: ${now.toLocaleDateString('es-ES')}.
    ESTADO: ${JSON.stringify(state)}
    ORDEN: Sé breve y eficiente.
  `;

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey.length < 10) throw new Error("API_KEY_INVALID");

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // SINCRONIZACIÓN EXACTA CON SDK v0.21.0
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: instructionText, // String directo: Máxima compatibilidad
    tools: [{ functionDeclarations: tools as any }],
  });

  try {
    const contents = [];
    const parts: any[] = [];

    if (audio) parts.push({ inlineData: { mimeType: audio.mimeType, data: audio.data } });
    if (fileData) parts.push({ inlineData: { mimeType: fileData.mimeType, data: fileData.data } });
    parts.push({ text: userPrompt || "PROCESAR." });

    contents.push({ role: "user", parts });

    const result = await model.generateContent({
      contents,
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
    console.error("DEBUG_V4_ERROR:", error);
    throw error;
  }
};