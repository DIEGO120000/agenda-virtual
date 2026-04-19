import { AppState, PrioridadTarea } from "../types";

// Identidad Táctica - OpenRouter Gateway
const API_KEY = "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";

const tools = [
  {
    type: "function",
    function: {
      name: 'gestionar_agenda',
      description: 'Añade o modifica tareas académicas/personales basándose en syllabus o comandos.',
      parameters: {
        type: "object",
        properties: {
          tareas: {
            type: "array",
            items: {
              type: "object",
              properties: {
                nombre: { type: "string" },
                recomendado: { type: "string", description: 'Fecha sugerida de inicio (YYYY-MM-DD)' },
                culminacion: { type: "string", description: 'Fecha de entrega final (YYYY-MM-DD)' },
                criticidad: { type: "number", description: 'Nivel de importancia del 1 al 10' },
                prioridad: { type: "string", enum: Object.values(PrioridadTarea) }
              },
              required: ['nombre', 'recomendado', 'culminacion', 'criticidad', 'prioridad']
            }
          }
        },
        required: ['tareas']
      }
    }
  },
  {
    type: "function",
    function: {
      name: 'gestionar_horario',
      description: 'Añade eventos al horario semanal.',
      parameters: {
        type: "object",
        properties: {
          eventos: {
            type: "array",
            items: {
              type: "object",
              properties: {
                dia: { type: "string", description: 'Lunes, Martes, etc.' },
                hora: { type: "string", description: 'HH:MM (24h)' },
                horaFin: { type: "string", description: 'HH:MM (24h)' },
                actividad: { type: "string" },
                tipo: { type: "string", enum: ['clase', 'estudio', 'descanso'] },
                modalidad: { type: "string", enum: ['Virtual', 'Semipresencial', 'Presencial'] }
              },
              required: ['dia', 'hora', 'horaFin', 'actividad', 'tipo']
            }
          }
        },
        required: ['eventos']
      }
    }
  },
  {
    type: "function",
    function: {
      name: 'gestionar_notes',
      description: 'Guarda recordatorios rápidos, deudas, recados o notas personales.',
      parameters: {
        type: "object",
        properties: {
          notes: { type: "array", items: { type: "string" } }
        },
        required: ['notes']
      }
    }
  },
  {
    type: "function",
    function: {
      name: 'gestionar_pasatiempos',
      description: 'Registra actividades de ocio o hobbies.',
      parameters: {
        type: "object",
        properties: {
          hobbies: { type: "array", items: { type: "string" } }
        },
        required: ['hobbies']
      }
    }
  },
  {
    type: "function",
    function: {
      name: 'eliminar_contenido',
      description: 'Borra elementos de la base de datos por nombre o palabra clave.',
      parameters: {
        type: "object",
        properties: {
          tipo: { type: "string", enum: ['tarea', 'horario', 'nota', 'pasatiempo'] },
          criterios: { type: "array", items: { type: "string" }, description: 'Lista de nombres o fragmentos a eliminar' }
        },
        required: ['tipo', 'criterios']
      }
    }
  }
];

export const getAIResponse = async (
  state: AppState,
  userPrompt: string,
  audio?: { data: string, mimeType: string },
  fileData?: { data: string, mimeType: string }
) => {
  const currentMessages = [
    { role: "system", content: "Eres la Agenda Virtual Inteligente de Diego. ESTADO_ACTUAL: " + JSON.stringify(state) },
    { role: "user", content: userPrompt || "Sincronizar." }
  ];

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "HTTP-Referer": "https://diego120000.github.io/agenda-virtual/",
        "X-Title": "Agenda Virtual Inteligente",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "google/gemini-2.0-flash-exp:free",
        "messages": currentMessages,
        "tools": tools,
        "tool_choice": "auto",
        "temperature": 0.1
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `HTTP_${response.status}`);
    }

    const data = await response.json();
    const message = data.choices[0].message;

    const functionCalls = message.tool_calls?.map((tc: any) => ({
      name: tc.function.name,
      args: JSON.parse(tc.function.arguments)
    }));

    return {
      text: message.content,
      functionCalls: functionCalls
    };
  } catch (error: any) {
    console.error("Systems Core AI Error:", error);
    throw error;
  }
};