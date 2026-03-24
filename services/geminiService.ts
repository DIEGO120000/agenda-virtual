import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { AppState, PrioridadTarea } from "../types";

const tools: FunctionDeclaration[] = [
  {
    name: 'gestionar_agenda',
    parameters: {
      type: Type.OBJECT,
      description: 'Añade o modifica tareas académicas/personales basándose en syllabus o comandos.',
      properties: {
        tareas: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              nombre: { type: Type.STRING },
              recomendado: { type: Type.STRING, description: 'Fecha sugerida de inicio (YYYY-MM-DD)' },
              culminacion: { type: Type.STRING, description: 'Fecha de entrega final (YYYY-MM-DD)' },
              criticidad: { type: Type.NUMBER, description: 'Nivel de importancia del 1 al 10' },
              prioridad: { type: Type.STRING, enum: Object.values(PrioridadTarea) }
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
      type: Type.OBJECT,
      description: 'Añade eventos al horario semanal.',
      properties: {
        eventos: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              dia: { type: Type.STRING, description: 'Lunes, Martes, etc.' },
              hora: { type: Type.STRING, description: 'HH:MM (24h)' },
              horaFin: { type: Type.STRING, description: 'HH:MM (24h)' },
              actividad: { type: Type.STRING },
              tipo: { type: Type.STRING, enum: ['clase', 'estudio', 'descanso'] },
              modalidad: { type: Type.STRING, enum: ['Virtual', 'Semipresencial', 'Presencial'] }
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
      type: Type.OBJECT,
      description: 'Guarda recordatorios rápidos, deudas, recados o notas personales.',
      properties: {
        notes: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ['notes']
    }
  },
  {
    name: 'gestionar_pasatiempos',
    parameters: {
      type: Type.OBJECT,
      description: 'Registra actividades de ocio o hobbies.',
      properties: {
        hobbies: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ['hobbies']
    }
  },
  {
    name: 'eliminar_contenido',
    parameters: {
      type: Type.OBJECT,
      description: 'Borra elementos de la base de datos por nombre o palabra clave.',
      properties: {
        tipo: { type: Type.STRING, enum: ['tarea', 'horario', 'nota', 'pasatiempo'] },
        criterios: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Lista de nombres o fragmentos a eliminar' }
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
    ESTÁS OPERANDO BAJO EL "PROTOCOLO FORMATO A" v3.4.
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

  // LOG DE SEGURIDAD PARA DEPURACIÓN (Ver en Consola F12)
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const isProd = import.meta.env.PROD;
  
  console.group("🚀 AGV_CORE_DIAGNOSTIC_v3.5");
  console.log("STATUS:", apiKey ? "✅ KEY_PRESENT" : "❌ KEY_MISSING");
  console.log("LENGTH:", apiKey?.length || 0);
  console.log("ENV:", isProd ? "PRODUCTION" : "DEVELOPMENT");
  console.groupEnd();
  
  if (!apiKey || apiKey.length < 10) {
    throw new Error(`CRITICAL_AUTH_FAILURE: KEY_INVALID_OR_EMPTY (V3.5_${isProd ? "PROD" : "DEV"})`);
  }

  // IMPORTANTE: El nuevo SDK @google/genai requiere un objeto de configuración
  const genAI = new GoogleGenAI({ apiKey: apiKey });
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
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

    const response = await model.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig: {
        temperature: 0.1,
      },
    });

    const result = response.response;
    const functionCalls = result.candidates?.[0]?.content?.parts
      ?.filter(part => part.functionCall)
      .map(part => part.functionCall);

    return {
      text: result.text(),
      functionCalls: functionCalls && functionCalls.length > 0 ? functionCalls : undefined
    };
  } catch (error: any) {
    console.error("Critical AI Core Error:", error);
    throw error;
  }
};