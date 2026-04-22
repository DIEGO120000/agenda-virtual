import Groq from "groq-sdk";

const groq = new Groq({ 
  apiKey: import.meta.env.VITE_GROQ_API_KEY, 
  dangerouslyAllowBrowser: true 
});

export const analizarComando = async (texto: string) => {
  const prompt = `Eres el motor semántico de una agenda. Analiza este texto: "${texto}".
  Devuelve ÚNICAMENTE un objeto JSON válido. Reglas estrictas:
  - REGLA A (Horario): Si menciona materias, días y horas (ej. "tengo precalculo los sabados de 2 a 6 pm presencial"). -> {"tipo": "horario", "materia": "nombre", "dia": "dia", "modalidad": "presencial/virtual/semi", "horario": "rango de horas"}
  - REGLA B (Tarea): Si implica obligación con tiempo/fecha límite (ej. "tengo que fregar a las 12", "examen mañana"). -> {"tipo": "tarea", "tarea": "nombre extraido", "recomendado": "dia extraido", "culminacion": "hora/fecha límite", "criticidad": "Alta/Media/Baja"}
  - REGLA C (Nota): Si es genérico, afirmación sin tiempo, o no encaja en A ni B (ej. "pedro es feo", "tengo que fregar"). -> {"tipo": "nota", "texto": "el texto original"}
  No añadas markdown ni texto fuera del JSON.`;

  const chatCompletion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama-3.1-8b-instant", 
    temperature: 0,
    response_format: { type: "json_object" }
  });
  
  return JSON.parse(chatCompletion.choices[0]?.message?.content || "{}");
};
