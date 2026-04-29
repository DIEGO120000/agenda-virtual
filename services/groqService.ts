import Groq from "groq-sdk";

const groq = new Groq({ 
  apiKey: import.meta.env.VITE_GROQ_API_KEY, 
  dangerouslyAllowBrowser: true 
});

export const analizarComando = async (texto: string) => {
  const now = new Date().toISOString();
  const prompt = `Eres un enrutador de datos estricto. La fecha y hora actual exacta del sistema es: ${now}.
  Analiza: "${texto}".
  
  REGLA VITAL DE FECHAS: Para cualquier campo de tiempo ('culminacion', 'hora', 'dia'), DEBES calcular la fecha real utilizando el contexto actual y devolverla ESTRICTAMENTE en formato ISO 8601 (YYYY-MM-DDTHH:mm:ss). NUNCA devuelvas palabras como "mañana", "hoy" o "a las 12". Mapea siempre a la fecha ISO correspondiente.

  Devuelve SOLO un JSON válido según estas reglas:
  1. "horario": Materias con días/horas. -> {"tipo": "horario", "materia": "...", "dia": "ISO_DATE", "hora": "ISO_DATE", "modalidad": "..."}
  2. "tarea": Acciones con TIEMPO LÍMITE explícito. -> {"tipo": "tarea", "tarea": "...", "culminacion": "ISO_DATE"}
  3. "nota": Datos sueltos o tareas SIN tiempo límite. -> {"tipo": "nota", "texto": "..."}
  4. "consulta": Preguntas sobre la agenda. -> {"tipo": "consulta", "intencion": "..."}
  5. "modificacion": Peticiones de alterar datos. -> {"tipo": "modificacion", "objetivo": "tareas/notas/horario", "identificador": "id_o_nombre", "nuevos_datos": {}}
  6. "chat": Saludos simples. -> {"tipo": "chat", "respuesta": "..."}
  
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
