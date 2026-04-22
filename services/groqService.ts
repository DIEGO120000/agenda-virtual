import Groq from "groq-sdk";

const groq = new Groq({ 
  apiKey: import.meta.env.VITE_GROQ_API_KEY, 
  dangerouslyAllowBrowser: true 
});

export const analizarComando = async (texto: string) => {
  const prompt = `Eres el cerebro de una agenda inteligente (A-AI). Analiza este texto: "${texto}".
  Devuelve ÚNICAMENTE un objeto JSON válido. Categorías:

  1. "modificacion": 
     - Regla: Detectar intención de cambio (ej. "cambia", "actualiza", "ya no es").
     - Atributos: {"tipo": "modificacion", "objetivo": "tareas/notas/horario", "identificador": "id_o_nombre", "nuevos_datos": {}}

  2. "consulta":
     - Regla: Preguntas sobre la agenda (ej. "¿Qué hago primero?", "¿Qué materias tengo hoy?").
     - Atributos: {"tipo": "consulta", "intencion": "recomendar/listar/fecha_actual"}

  3. "guardado":
     - Subtipos: 
       - "horario": Materia única, día, hora, modalidad.
       - "tarea": Descripción, culminación (hora/fecha), criticidad (Alta/Media/Baja).
       - "nota": Texto íntegro.
     - Atributos: {"tipo": "guardado", "subtipo": "horario/tarea/nota", "datos": {}}

  4. "chat":
     - Regla: Saludos, despedidas o charla rápida sin intención de agenda.
     - Atributos: {"tipo": "chat", "respuesta": "Respuesta corta y eficiente de IA"}

  No añadas markdown ni texto fuera del JSON. Temperatura 0 para precisión.`;

  const chatCompletion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama-3.1-8b-instant", 
    temperature: 0,
    response_format: { type: "json_object" }
  });
  
  return JSON.parse(chatCompletion.choices[0]?.message?.content || "{}");
};

export const procesarConsulta = async (intencion: string, estado: any) => {
  const prompt = `Actúa como el cerebro de la agenda. Intención: ${intencion}.
  Datos actuales: ${JSON.stringify(estado)}
  
  REGLA DE PRIORIZACIÓN: Si te piden orden o recomendación, usa: 
  Prioridad = (Criticidad * 0.7) + (Cercanía de Culminación * 0.3).
  La culminación más cercana es hoy. A mayor valor, mayor urgencia.
  
  Responde de forma concisa, militar y eficiente. No uses markdown excesivo.`;

  const response = await groq.chat.completions.create({
    messages: [{ role: "system", content: prompt }],
    model: "llama-3.1-8b-instant",
    temperature: 0.5
  });

  return response.choices[0]?.message?.content || "ERROR_DE_RESPUESTA";
};
