import { GoogleGenerativeAI } from "@google/generative-ai";
import { AppState, PrioridadTarea } from "../types";

const tools: any[] = [
  {
    name: 'gestionar_agenda',
    parameters: {
      type: 'object',
      description: 'Añade o modifica tareas académicas/personales basándose en syllabus o comandos.',
      properties: {
        tareas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              nombre: { type: 'string' },
              recomendado: { type: 'string', description: 'Fecha sugerida de inicio (YYYY-MM-DD)' },
              culminacion: { type: 'string', description: 'Fecha de entrega final (YYYY-MM-DD)' },
              criticidad: { type: 'number', description: 'Nivel de importancia del 1 al 10' },
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
      description: 'Añade eventos al horario semanal.',
      properties: {
        eventos: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dia: { type: 'string', description: 'Lunes, Martes, etc.' },
              hora: { type: 'string', description: 'HH:MM (24h)' },
              horaFin: { type: 'string', description: 'HH:MM (24h)' },
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
      description: 'Guarda recordatorios rápidos, deudas, recados o notas personales.',
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
      description: 'Registra actividades de ocio o hobbies.',
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
      description: 'Borra elementos de la base de datos por nombre o palabra clave.',
      properties: {
        tipo: { type: 'string', enum: ['tarea', 'horario', 'nota', 'pasatiempo'] },
        criterios: { type: 'array', items: { type: 'string' }, description: 'Lista de nombres o fragmentos a eliminar' }
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
    ESTÁS OPERANDO BAJO EL "PROTOCOLO FORMATO A" v3.7.
    TU IDENTIDAD: Administradora de Vida y Agenda de Grado de Alto Rendimiento.
    
    REGLA DE ORO DE AUDIO: Escucha fonéticamente con precisión. Diferencia entre:
    - Nombres propios (Pablo, María) -> Notas personales.
    - Términos financieros (pesos, debe, pagar) -> Notas personales.
    - Términos académicos (examen, parcial, entrega) -> Agenda.

    NO ALUCINES: Si el usuario dice "Pablo me debe 500 pesos", NO lo conviertas en un examen. Es una NOTA.
    
    FECHA DEL SISTEMA: ${now.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.
    TONO: Seco, ultra-eficiente, técnico.
    
    ESTADO ACTUAL: ${JSON.stringify(state)}
  `;

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const isProd = import.meta.env.PROD;
  
  console.group("🚀 AGV_CORE_DIAGNOSTIC_v3.7");
  console.log("STATUS:", apiKey ? "✅ KEY_PRESENT" : "❌ KEY_MISSING");
  console.log("LENGTH:", apiKey?.length || 0);
  console.log("ENV:", isProd ? "PRODUCTION" : "DEVELOPMENT");
  console.groupEnd();
  
  if (!apiKey || apiKey.length < 10) {
    throw new Error(`CRITICAL_AUTH_FAILURE: KEY_INVALID_OR_EMPTY (V3.7_${isProd ? "PROD" : "DEV"})`);
  }

  // Usamos 'gemini-1.5-flash-latest' para forzar el endpoint más reciente
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash-latest",
    systemInstruction: systemInstruction,
    tools: [{ functionDeclarations: tools }],
  });

  try {
    const parts: any[] = [];
    if (audio) {
      parts.push({ 
        inlineData: { 
          mimeType: audio.mimeType, 
          data: audio.data 
        } 
      });
    }
    
    if (fileData) {
      parts.push({ 
        inlineData: { 
          mimeType: fileData.mimeType, 
          data: fileData.data 
        } 
      });
    }
    
    const triggerText = userPrompt || (audio ? "TRANSCRIPCIÓN Y ACCIÓN REQUERIDA." : "ESPERANDO.");
    parts.push({ text: triggerText });

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