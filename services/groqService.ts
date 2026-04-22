import Groq from "groq-sdk";

const groq = new Groq({ 
  apiKey: import.meta.env.VITE_GROQ_API_KEY, 
  dangerouslyAllowBrowser: true 
});

export const analizarComando = async (texto: string) => {
  const prompt = `Eres el motor semántico de una agenda. Analiza este texto: "${texto}".
  Devuelve ÚNICAMENTE un objeto JSON válido. Categorías y reglas:

  1. "horario" (Materias):
     - Regla: Detectar nombre de materia y extraerlo como título ÚNICO.
     - Atributos: {"tipo": "horario", "materia": "nombre_unico", "dia": "dia", "hora": "rango_hora", "modalidad": "presencial/virtual/semi"}

  2. "tarea" (Acción con tiempo):
     - Regla: Solo si incluye hora específica, fecha límite o nivel de criticidad explícito.
     - Atributos: {"tipo": "tarea", "tarea": "descripcion", "culminacion": "hora_o_fecha", "criticidad": "Alta/Media/Baja"}

  3. "nota" (Random/Sin contexto):
     - Regla: Afirmaciones sin tiempo (ej. "Me deben 50", "Tengo que fregar").
     - Atributos: {"tipo": "nota", "texto": "texto_integro"}

  4. "consulta" (Conversational):
     - Regla: Preguntas sobre el estado de la agenda (ej. "¿Qué tengo hoy?", "¿Por qué empiezo?").
     - Atributos: {"tipo": "consulta", "intencion": "priorizar/listar/resumir"}

  No añadas markdown ni texto fuera del JSON. Usa temperatura 0 para máxima precisión.`;

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
