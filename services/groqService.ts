import Groq from "groq-sdk";

const groq = new Groq({ 
  apiKey: import.meta.env.VITE_GROQ_API_KEY, 
  dangerouslyAllowBrowser: true 
});

export const analizarComando = async (texto: string) => {
  const now = new Date();
  const fechaActual = now.toLocaleString('es-DO', { timeZone: 'America/Santo_Domingo' });
  const isoNow = now.toISOString();

  const prompt = `ERES UN CLASIFICADOR ESTRICTO. Debes clasificar la información extraída en 'materia', 'tarea' o 'nota' usando ÚNICAMENTE estas reglas absolutas:
  
  REFERENCIA TEMPORAL ABSOLUTA: ${fechaActual} (ISO: ${isoNow}).
  Analiza: "${texto}".
  
  REGLAS ABSOLUTAS DE CLASIFICACIÓN:
  
  REGLA 1 - MATERIA (HORARIO):
  - OBLIGATORIO: Debe tener Nombre de la materia, Día de la semana, Hora de inicio y Hora de culminación.
  - EXCEPCIÓN: Solo será materia si falta algún dato SÍ Y SOLO SÍ el usuario declara explícitamente que no lo tiene (ej. 'No sé a qué hora es').
  - Si falta la hora o el día y no hay justificación explícita, NO ES MATERIA.
  
  REGLA 2 - TAREA:
  - OBLIGATORIO: Debe tener una acción a realizar Y un día ESPECÍFICO de culminación.
  - VÁLIDO COMO ESPECÍFICO: 'Mañana', 'pasado mañana', 'el jueves', 'el 15 de mayo'.
  - INVÁLIDO (AMBIGUO): 'Esta semana', 'este mes', 'este año', 'pronto'. Si el tiempo es ambiguo, ESTÁ PROHIBIDO clasificarlo como tarea. Pasa a ser NOTA.
  
  REGLA 3 - NOTA:
  - DEFINICIÓN: Todo lo que no cumpla estrictamente con la Regla 1 o Regla 2.
  - CASO A: Información sin tiempo absoluto (ej. 'Emmanuel me debe $500').
  - CASO B: Acciones con tiempos ambiguos (ej. 'En esta semana tengo que bailar con Anastasia'). Al no decir un día exacto, es automáticamente una nota.

  Formato de salida JSON (ESTRICTO):
  {
    "actions": [
      { "tipo": "materia", "dia": "Lunes/Martes...", "hora_inicio": "...", "hora_fin": "...", "nombre": "...", "profesor": "...", "modalidad": "..." },
      { "tipo": "tarea", "tarea": "...", "culminacion": "ISO_DATE" },
      { "tipo": "nota", "texto": "..." },
      { "tipo": "modificacion", "objetivo": "tareas/notas/horario", "identificador": "nombre_o_id", "nuevos_datos": { "campo": "valor" } }
    ],
    "respuesta": "Resumen natural consolidado de las acciones realizadas."
  }

  REGLA VITAL DE FECHAS: Para cualquier campo de tiempo (FUERA de la sección de materias/horario), DEBES calcular la fecha real utilizando el contexto de la fecha actual proporcionada y devolverla ESTRICTAMENTE en formato ISO 8601.

  CERO TEXTO EXTRA. SOLO JSON.`;

  const chatCompletion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama-3.1-8b-instant", 
    temperature: 0,
    response_format: { type: "json_object" }
  });
  
  return JSON.parse(chatCompletion.choices[0]?.message?.content || "{}");
};

export const procesarConsulta = async (intencion: string, tareas: any[], horario: any[], notas: any[], pasatiempos: any[]) => {
  const now = new Date().toLocaleString('es-DO', { timeZone: 'America/Santo_Domingo' });

  const formatList = (list: any[], key: string) => {
    if (!list || list.length === 0) return "Vacío/No asignado";
    return JSON.stringify(list);
  };

  const prompt = `Eres el asistente de la Agenda Virtual. Tienes acceso a toda la información del usuario.
  DATOS ACTUALES:
  - Tareas: ${formatList(tareas, 'tareas')}
  - Horario: ${formatList(horario, 'horario')}
  - Notas: ${formatList(notas, 'notas')}
  - Pasatiempos: ${formatList(pasatiempos, 'pasatiempos')}

  REGLAS CRÍTICAS:
  1. Si el usuario pregunta por una sección que está vacía, infórmale de manera natural que aún no ha agregado nada ahí. NO inventes datos.
  2. PROHIBICIÓN ABSOLUTA: NUNCA crees, asignes ni simules crear una tarea por tu cuenta. SOLO debes crear una tarea si el usuario te lo ordena explícitamente (ej. 'crea una tarea para...'). 
  3. Si el usuario responde con un simple 'sí' o 'no' a una de tus preguntas, responde conversacionalmente basándote en el contexto. NUNCA respondas con el formato 'Hecho: TAREA ASIGNADA' a menos que haya una orden directa.
  4. Sé empático, directo y usa un tono casual. Hora actual: ${now}.`;

  const response = await groq.chat.completions.create({
    messages: [{ role: "system", content: prompt }, { role: "user", content: intencion }],
    model: "llama-3.1-8b-instant",
    temperature: 0.7
  });

  return response.choices[0]?.message?.content || "Lo siento, tuve un problema al procesar tu consulta.";
};

export const transcribirAudio = async (audioBlob: Blob) => {
  const formData = new FormData();
  formData.append("file", audioBlob, "audio.webm");
  formData.append("model", "whisper-large-v3");

  const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { 
      "Authorization": `Bearer ${import.meta.env.VITE_GROQ_API_KEY}` 
    },
    body: formData
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || `HTTP ${response.status}`);
  }
  const data = await response.json();
  return data.text;
};
