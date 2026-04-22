import { EstadoTarea, PrioridadTarea } from '../types';

export interface SemanticAction {
  type: 'HORARIO' | 'TAREA' | 'NOTA';
  data: any;
}

export const semanticClassifier = (input: string): SemanticAction => {
  const text = input.toLowerCase();
  const now = new Date();

  // --- REGLA A: MATERIAS (HORARIO) ---
  // Condición: Días + Rangos de hora + Modalidad
  const diasRegex = /\b(lunes|martes|miercoles|miércoles|jueves|viernes|sabado|sábado|domingo)\b/i;
  const horasRegex = /(\d{1,2}(?::\d{2})?\s*(am|pm|a\.m\.|p\.m\.?))\s*(?:a|y|hasta)\s*(\d{1,2}(?::\d{2})?\s*(am|pm|a\.m\.|p\.m\.?))/i;
  const modalidadRegex = /\b(presencial|virtual|semi|semipresencial)\b/i;

  if (diasRegex.test(text) && horasRegex.test(text)) {
    const diaMatch = text.match(diasRegex);
    const horaMatch = text.match(horasRegex);
    const modMatch = text.match(modalidadRegex);

    // Extraer nombre de materia (eliminar ruidos)
    let materia = text
      .replace(diasRegex, '')
      .replace(horasRegex, '')
      .replace(modalidadRegex, '')
      .replace(/\b(tengo|clase|materia|de|a|las|los|el)\b/gi, '')
      .trim();
    
    materia = materia ? materia.toUpperCase() : "MATERIA DESCONOCIDA";

    return {
      type: 'HORARIO',
      data: {
        actividad: materia,
        dia: diaMatch![0].charAt(0).toUpperCase() + diaMatch![0].slice(1).replace('miércoles', 'Miercoles'),
        hora: horaMatch![1].replace(/\s/g, '').toLowerCase(),
        horaFin: horaMatch![3].replace(/\s/g, '').toLowerCase(),
        modalidad: modMatch ? modMatch[0].charAt(0).toUpperCase() + modMatch[0].slice(1) : "Presencial",
        tipo: 'clase'
      }
    };
  }

  // --- REGLA B: TAREAS (SEGUIMIENTO DINÁMICO) ---
  // Condición: Acción obligatoria + Tiempo/Fecha límite
  const tiempoLimiteRegex = /\b(mañana|hoy|a las \d{1,2}(?::\d{2})?\s*(am|pm|a\.m\.|p\.m\.?)|el lunes|el martes|el miércoles|el jueves|el viernes)\b/i;
  const obligacionRegex = /\b(tengo que|hay que|debo|entregar|hacer|estudiar|subir|examen|parcial|proyecto)\b/i;

  if (obligacionRegex.test(text) && tiempoLimiteRegex.test(text)) {
    const tiempoMatch = text.match(tiempoLimiteRegex);
    
    // Calcular fecha de culminación
    const fechaCulminacion = new Date();
    if (text.includes('mañana')) fechaCulminacion.setDate(fechaCulminacion.getDate() + 1);
    
    // Extraer nombre de tarea
    let tareaNombre = text
      .replace(tiempoLimiteRegex, '')
      .replace(obligacionRegex, '')
      .replace(/\b(una|de|la|el|que|un)\b/gi, '')
      .trim();
    
    tareaNombre = tareaNombre ? tareaNombre.charAt(0).toUpperCase() + tareaNombre.slice(1) : "Nueva Tarea";

    // Calcular criticidad basada en proximidad (si es hoy/mañana es alta)
    const criticidad = text.includes('hoy') ? 10 : (text.includes('mañana') ? 8 : 5);

    return {
      type: 'TAREA',
      data: {
        nombre: tareaNombre,
        ingreso: new Date().toISOString(),
        recomendado: new Date().toISOString().split('T')[0],
        culminacion: fechaCulminacion.toISOString().split('T')[0],
        criticidad: criticidad,
        estado: EstadoTarea.PENDIENTE,
        prioridad: criticidad > 7 ? PrioridadTarea.ALTA : PrioridadTarea.MEDIA
      }
    };
  }

  // --- REGLA C: NOTAS (DEFAULT) ---
  // Afirmaciones genéricas o acciones sin tiempo
  return {
    type: 'NOTA',
    data: {
      contenido: input,
      timestamp: new Date().toISOString()
    }
  };
};
