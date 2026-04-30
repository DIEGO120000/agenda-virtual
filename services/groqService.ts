import Groq from "groq-sdk";

const groq = new Groq({ 
  apiKey: import.meta.env.VITE_GROQ_API_KEY, 
  dangerouslyAllowBrowser: true 
});

export const analizarComando = async (texto: string) => {
  const now = new Date();
  const fechaActual = now.toLocaleString('es-DO', { timeZone: 'America/Santo_Domingo' });
  const isoNow = now.toISOString();

  const prompt = `ERES UN CLASIFICADOR Y EDITOR ESTRICTO. EVALÚA EL INPUT PASO A PASO:
  
  REFERENCIA TEMPORAL ABSOLUTA: ${fechaActual} (ISO: ${isoNow}).
  Analiza: "${texto}".
  
  REGLAS ABSOLUTAS DE CLASIFICACIÓN Y EDICIÓN:
  1. PRIORIDAD DE MATERIAS: Cuando el usuario te dicte sus materias, días, horas y profesores (ej. "estas son mis materias..."), tu ÚNICA acción estructural debe ser agregarlas o actualizarlas en la sección de HORARIO/MATERIAS (tipo: "horario"). NUNCA las agregues directamente a calificaciones.
  
  2. ESQUEMA ESTRICTO PARA MATERIAS (HORARIO): Cuando detectes una materia, DEBES devolver un objeto JSON con EXACTAMENTE estas claves:
     - "dia": El día de la semana explícito (Ej. "Lunes", "Martes", "Sábado"). Si dice "Autogestionada" o "Pendiente", pon "Pendiente". ESTÁ ESTRICTAMENTE PROHIBIDO omitir el campo "dia".
     - "hora_inicio": La hora exacta de inicio (Ej. "8:00 AM").
     - "hora_fin": La hora exacta de fin (Ej. "11:00 AM").
     - "nombre": El nombre de la materia sin asteriscos.
     - "profesor": El nombre del profesor.
     - "modalidad": "Virtual", "Presencial" o "Semipresencial".

  3. MODIFICACIÓN: Si el usuario pide cambiar, corregir o actualizar algo existente (ej. "cambia la hora de la clase de Matemáticas" o "actualiza la fecha de la tarea X"), DEBES usar el tipo "modificacion". Identifica el objetivo (tareas/notas/horario) y el nombre del registro.
  
  4. TAREAS vs NOTAS: Para que sea una TAREA nueva, el usuario DEBE dictar explícitamente una fecha u hora de culminación exacta.
  
  5. REGLA DE ORO: Si identificas una acción pero EL USUARIO NO DICTÓ FECHA DE CULMINACIÓN, ESTÁ ESTRICTAMENTE PROHIBIDO INVENTARLA. Clasifícalo como NOTA (tipo: "nota").
  
  6. Si es información general o el tiempo es ambiguo, CLASIFÍCALO COMO NOTA.

  Formato de salida JSON (ESTRICTO):
  {
    "actions": [
      { "tipo": "modificacion", "objetivo": "tareas/notas/horario", "identificador": "nombre_o_id", "nuevos_datos": { "campo": "valor" } },
      { "tipo": "tarea", "tarea": "...", "culminacion": "ISO_DATE" },
      { "tipo": "nota", "texto": "..." },
      { "tipo": "horario", "dia": "...", "hora_inicio": "...", "hora_fin": "...", "nombre": "...", "profesor": "...", "modalidad": "..." }
    ],
    "respuesta": "Resumen natural consolidado de las acciones realizadas."
  }

  REGLA VITAL DE FECHAS: Para cualquier campo de tiempo (fuera de horario), DEBES calcular la fecha real utilizando el contexto de la fecha actual proporcionada y devolverla ESTRICTAMENTE en formato ISO 8601.

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
