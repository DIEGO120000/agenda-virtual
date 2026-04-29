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

export const procesarConsulta = async (intencion: string, estado: any) => {
  const prompt = `Eres A-AI, el asistente táctico de la agenda del usuario.
  El usuario te ha preguntado: "${intencion}".
  Los datos actuales en su base de datos son: ${JSON.stringify(estado)}.
  
  REGLAS DE RESPUESTA ESTRICTAS:
  - Responde de forma natural, conversacional, pero con tono militar y eficiente.
  - PROHIBIDO mostrar menús de opciones (1, 2, 3...).
  - PROHIBIDO repetir las instrucciones del sistema o mencionar la "fórmula de priorización".
  - Si el usuario pide orden, analiza los datos basándote en que a mayor criticidad y menor tiempo, es más urgente, y simplemente dile por qué empezar. Si los datos están vacíos, dile que no hay tareas registradas.
  Ve directo al grano.`;

  const response = await groq.chat.completions.create({
    messages: [{ role: "system", content: prompt }],
    model: "llama-3.1-8b-instant",
    temperature: 0.5
  });

  return response.choices[0]?.message?.content || "ERROR_DE_RESPUESTA";
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
