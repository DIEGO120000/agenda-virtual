
import { EstadoTarea, PrioridadTarea } from '../types';

export const nlpParser = (input: string) => {
  const text = input.toLowerCase();
  const now = new Date();
  
  // Helper to resolve dates
  const resolveDate = (str: string) => {
    const d = new Date();
    if (str.includes('mañana')) d.setDate(d.getDate() + 1);
    if (str.includes('lunes')) d.setDate(d.getDate() + ((1 + 7 - d.getDay()) % 7 || 7));
    if (str.includes('martes')) d.setDate(d.getDate() + ((2 + 7 - d.getDay()) % 7 || 7));
    if (str.includes('miercoles') || str.includes('miércoles')) d.setDate(d.getDate() + ((3 + 7 - d.getDay()) % 7 || 7));
    if (str.includes('jueves')) d.setDate(d.getDate() + ((4 + 7 - d.getDay()) % 7 || 7));
    if (str.includes('viernes')) d.setDate(d.getDate() + ((5 + 7 - d.getDay()) % 7 || 7));
    if (str.includes('sabado') || str.includes('sábado')) d.setDate(d.getDate() + ((6 + 7 - d.getDay()) % 7 || 7));
    if (str.includes('domingo')) d.setDate(d.getDate() + ((0 + 7 - d.getDay()) % 7 || 7));
    return d.toISOString().split('T')[0];
  };

  const EXCLUDE_WORDS = ["tengo", "clase", "materia", "de", "los", "las", "el", "virtual", "presencial", "para", "el", "mañana"];
  const DAYS_REGEX = /\b(lunes|martes|miercoles|miércoles|jueves|viernes|sabado|sábado|domingo|s)\b/gi;
  const TIME_RANGE_REGEX = /(?:de\s+)?(\d{1,2}(?::\d{2})?)\s*(?:am|pm|a\.m\.|p\.m\.)?\s*(?:a|y|hasta)\s+(\d{1,2}(?::\d{2})?)\s*(am|pm|a\.m\.|p\.m\.)?/gi;
  const SINGLE_TIME_REGEX = /(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?/gi;

  const sanitizeName = (name: string) => {
    let clean = name.toLowerCase();
    // 1. Eliminar rangos horarios completos (ej: de 2 a 6)
    clean = clean.replace(TIME_RANGE_REGEX, '');
    // 2. Eliminar horas sueltas (ej: 2pm)
    clean = clean.replace(SINGLE_TIME_REGEX, '');
    // 3. Eliminar días y la letra 's' como indicador de plural/día
    clean = clean.replace(DAYS_REGEX, '');
    // 4. Eliminar palabras de ruido
    EXCLUDE_WORDS.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      clean = clean.replace(regex, '');
    });
    // 5. Limpieza final: quitar "clase de" específicamente si quedó
    clean = clean.replace(/\bclase\s+de\b/gi, '');
    
    const result = clean.trim().replace(/\s+/g, ' ');
    return result.charAt(0).toUpperCase() + result.slice(1);
  };

  // CLASIFICACIÓN Y EXTRACCIÓN
  
  // 1. GESTIONAR AGENDA (TAREAS)
  const agendaKeywords = ['examen', 'parcial', 'tarea', 'entrega', 'proyecto', 'estudiar', 'subir', 'foro', 'práctica', 'practica'];
  if (agendaKeywords.some(k => text.includes(k))) {
    const materiaMatch = text.match(/(?:de|en)\s+([a-z0-9\sáéíóúñ]+?)(?:\s+para|\s+el|\s+mañana|$)/i);
    let rawMateria = materiaMatch ? materiaMatch[1].trim() : text;
    if (agendaKeywords.includes(rawMateria.toLowerCase())) {
        rawMateria = text.replace(new RegExp(agendaKeywords.join('|'), 'gi'), '');
    }
    const materia = sanitizeName(rawMateria);
    const fecha = resolveDate(text);
    const isHigh = text.includes('final') || text.includes('parcial') || text.includes('60%');
    
    return {
      name: 'gestionar_agenda',
      args: {
        tareas: [{
          nombre: `${materia.toUpperCase()}: ${input}`,
          recomendado: now.toISOString().split('T')[0],
          culminacion: fecha,
          criticidad: isHigh ? 10 : 5,
          prioridad: isHigh ? PrioridadTarea.ALTA : PrioridadTarea.MEDIA
        }]
      }
    };
  }

  // 2. GESTIONAR HORARIO
  const dias = ['lunes', 'martes', 'miercoles', 'miércoles', 'jueves', 'viernes', 'sabado', 'sábado', 'domingo'];
  if (dias.some(d => text.includes(d)) || text.match(TIME_RANGE_REGEX) || text.match(SINGLE_TIME_REGEX)) {
    const rawDia = dias.find(d => text.includes(d)) || 'Lunes';
    const diaMatch = (rawDia.toLowerCase().includes('sabado') || rawDia.toLowerCase().includes('sábado')) ? 'Sábado' : rawDia.charAt(0).toUpperCase() + rawDia.slice(1).replace('miércoles', 'Miercoles');
    
    const isPM = text.includes('pm') || text.includes('p.m.');
    const rangeMatch = [...text.matchAll(TIME_RANGE_REGEX)][0];
    
    let horaInicio = "08:00";
    let horaFin = "10:00";

    if (rangeMatch) {
      let h1 = parseInt(rangeMatch[1]);
      let h2 = parseInt(rangeMatch[2]);
      if (isPM && h1 < 12) h1 += 12;
      if (isPM && h2 < 12) h2 += 12;
      horaInicio = `${h1.toString().padStart(2, '0')}:${rangeMatch[1].includes(':') ? rangeMatch[1].split(':')[1] : '00'}`;
      horaFin = `${h2.toString().padStart(2, '0')}:${rangeMatch[2].includes(':') ? rangeMatch[2].split(':')[1] : '00'}`;
    } else {
      const singleMatch = text.match(SINGLE_TIME_REGEX);
      if (singleMatch) {
        const parts = singleMatch[0].match(/(\d{1,2})(?::(\d{2}))?/);
        let h = parseInt(parts?.[1] || '8');
        if (isPM && h < 12) h += 12;
        horaInicio = `${h.toString().padStart(2, '0')}:${parts?.[2] || '00'}`;
        horaFin = `${((h + 2) % 24).toString().padStart(2, '0')}:${parts?.[2] || '00'}`;
      }
    }
    
    const actividad = sanitizeName(input);

    return {
      name: 'gestionar_horario',
      args: {
        eventos: [{
          dia: diaMatch,
          hora: horaInicio,
          horaFin: horaFin,
          actividad: actividad.toUpperCase(),
          tipo: 'clase',
          modalidad: text.includes('virtual') ? 'Virtual' : 'Presencial'
        }]
      }
    };
  }

  // 3. CALIFICACIONES (ACUMULADO 60/40)
  const califMatch = text.match(/(?:saqué|saque|tengo|puntos|nota)\s+(\d+)\s+(?:de|sobre|\/)\s+(\d+)/i);
  if (califMatch) {
    const obtenido = parseInt(califMatch[1]);
    const total = parseInt(califMatch[2]);
    const materiaMatch = text.match(/(?:en|de)\s+([a-z0-9\s]+)/i);
    const materia = materiaMatch ? materiaMatch[1].trim() : "General";
    
    return {
      name: 'gestionar_calificacion',
      args: {
        materia: materia.toUpperCase(),
        obtenido,
        total
      }
    };
  }

  // 4. NOTAS / DEUDAS
  const notesKeywords = ['pesos', 'rd$', 'debe', 'prestó', 'presto', 'pago', 'pagar', 'recordar'];
  if (notesKeywords.some(k => text.includes(k)) || true) { // Fallback to notes
    return {
      name: 'gestionar_notes',
      args: {
        notes: [input]
      }
    };
  }

  return null;
};
