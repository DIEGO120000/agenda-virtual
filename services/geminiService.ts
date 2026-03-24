import { GoogleGenerativeAI } from "@google/generative-ai";
import { AppState, PrioridadTarea } from "../types";

// Esquema de herramientas optimizado para v1beta
const tools: any[] = [
  {
    name: 'gestionar_agenda',
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
  const systemInstruction = `
    ESTÁS OPERANDO BAJO EL "PROTOCOLO FORMATO A" v3.9.
    TU IDENTIDAD: Administradora de Vida y Agenda de Grado de Alto Rendimiento.
    FECHA DEL SISTEMA: ${now.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.
    ESTADO ACTUAL: ${JSON.stringify(state)}
  `;

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const isProd = import.meta.env.PROD;
  
  console.group("🚀 AGV_CORE_DIAGNOSTIC_v3.9");
  console.log("STATUS:", apiKey ? "✅ KEY_PRESENT" : "❌ KEY_MISSING");
  console.log("ENV:", isProd ? "PRODUCTION" : "DEVELOPMENT");
  console.groupEnd();
  
  if (!apiKey || apiKey.length < 10) {
    throw new Error(`CRITICAL_AUTH_FAILURE: KEY_INVALID_OR_EMPTY (V3.9_${isProd ? "PROD" : "DEV"})`);
  }

  // Regresamos a la configuración estándar que usa v1beta por defecto
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: {
      role: "system",
      parts: [{ text: systemInstruction }]
    },
    tools: [
      {
        functionDeclarations: tools,
      },
    ],
  });

  try {
    const parts: any[] = [];
    if (audio) {
      parts.push({ inlineData: { mimeType: audio.mimeType, data: audio.data } });
    }
    if (fileData) {
      parts.push({ inlineData: { mimeType: fileData.mimeType, data: fileData.data } });
    }
    
    parts.push({ text: userPrompt || "ESPERANDO ORDEN." });

    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig: {
        temperature: 0.1,
      },
    });

    const response = result.response;
    const functionCalls = response.candidates?.[0]?.content?.parts
      ?.filter(part => part.functionCall)
      .map(part => part.functionCall);

    return {
      text: response.text(),
      functionCalls: functionCalls && functionCalls.length > 0 ? functionCalls : undefined
    };
  } catch (error: any) {
    console.error("Critical AI Core Error:", error);
    throw error;
  }
};