
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

  const EXCLUDE_WORDS = ["tengo", "clase", "materia", "presencial", "virtual", "de", "a", "los", "las", "el", "en", "para"];
  const DAYS_LIST = ["lunes", "martes", "miercoles", "miércoles", "jueves", "viernes", "sabados", "sabado", "sábado", "domingo", "s"];
  
  const sanitizeName = (name: string) => {
    let clean = name.toLowerCase();
    
    // 1. Eliminar Rangos Horarios y Referencias de Tiempo (Ultra-Clean)
    clean = clean.replace(/(?:de\s+)?\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.)?\s*(?:a|y|hasta)\s+\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.)?/gi, '');
    clean = clean.replace(/\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.)/gi, '');
    clean = clean.replace(/\b(?:am|pm|a\.m\.|p\.m\.)\b/gi, '');
    clean = clean.replace(/\b\d{1,2}\b/g, '');

    // 2. Eliminar Días y Residuos (incluyendo 's' huérfana)
    DAYS_LIST.forEach(day => {
      const regex = new RegExp(`\\b${day}\\b`, 'gi');
      clean = clean.replace(regex, '');
    });

    // 3. Eliminar Palabras de Ruido y Conexión
    EXCLUDE_WORDS.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      clean = clean.replace(regex, '');
    });

    // 4. Limpieza final: Quitar letras sueltas residuales al final (como la 's' de sabados)
    clean = clean.trim().replace(/\s+([a-z])\b/gi, '').replace(/\b([a-z])\s+/gi, '');
    
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
  const TIME_RANGE_REGEX = /(?:de\s+)?(\d{1,2}(?::\d{2})?)\s*(?:am|pm|a\.m\.|p\.m\.)?\s*(?:a|y|hasta)\s+(\d{1,2}(?::\d{2})?)\s*(am|pm|a\.m\.|p\.m\.)?/i;
  const SINGLE_TIME_REGEX = /(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?/i;

  if (dias.some(d => text.includes(d)) || text.match(TIME_RANGE_REGEX) || text.match(SINGLE_TIME_REGEX)) {
    const rawDia = dias.find(d => text.includes(d)) || 'Lunes';
    const diaMatch = (rawDia.toLowerCase().includes('sabado') || rawDia.toLowerCase().includes('sábado')) ? 'Sábado' : rawDia.charAt(0).toUpperCase() + rawDia.slice(1).replace('miércoles', 'Miercoles');
    
    const isPM = text.includes('pm') || text.includes('p.m.');
    const rangeMatch = text.match(TIME_RANGE_REGEX);
    
    let horaInicio = "08:00";
    let horaFin = "10:00";

    if (rangeMatch) {
      let h1 = parseInt(rangeMatch[1]);
      let h2 = parseInt(rangeMatch[2]);
      
      // Aplicar +12 a ambos valores si se detecta PM en la frase
      if (isPM) {
        if (h1 < 12) h1 += 12;
        if (h2 < 12) h2 += 12;
      }
      
      horaInicio = `${h1.toString().padStart(2, '0')}:${rangeMatch[1].includes(':') ? rangeMatch[1].split(':')[1] : '00'}`;
      horaFin = `${h2.toString().padStart(2, '0')}:${rangeMatch[2].includes(':') ? rangeMatch[2].split(':')[1] : '00'}`;
    } else {
      const singleMatch = text.match(SINGLE_TIME_REGEX);
      if (singleMatch) {
        let h = parseInt(singleMatch[1]);
        if (isPM && h < 12) h += 12;
        const mins = singleMatch[2] || '00';
        horaInicio = `${h.toString().padStart(2, '0')}:${mins}`;
        horaFin = `${((h + 2) % 24).toString().padStart(2, '0')}:${mins}`;
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
