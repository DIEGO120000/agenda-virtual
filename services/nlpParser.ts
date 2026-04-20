
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

  const stopWords = ['los', 'las', 'de', 'a', 'el', 'los sábados', 'los sabados', 'presencial', 'virtual', 'clase', 'materia'];
  
  const sanitizeName = (name: string) => {
    let clean = name.toLowerCase();
    // Eliminar indicadores de tiempo (ej: 2pm, 2 p.m., 14:00)
    clean = clean.replace(/\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.)/gi, '');
    // Eliminar Stop Words
    stopWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      clean = clean.replace(regex, '');
    });
    return clean.trim().replace(/\s+/g, ' ');
  };

  // CLASIFICACIÓN Y EXTRACCIÓN
  
  // 1. GESTIONAR AGENDA (TAREAS)
  const agendaKeywords = ['examen', 'parcial', 'tarea', 'entrega', 'proyecto', 'estudiar', 'subir', 'foro', 'práctica', 'practica'];
  if (agendaKeywords.some(k => text.includes(k))) {
    const materiaMatch = text.match(/(?:de|en)\s+([a-z0-9\sáéíóúñ]+?)(?:\s+para|\s+el|\s+mañana|$)/i);
    let materia = materiaMatch ? materiaMatch[1].trim() : "Materia Desconocida";
    materia = sanitizeName(materia);
    
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
  if (dias.some(d => text.includes(d)) && (text.includes('a las') || text.match(/\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.)/i))) {
    const diaMatch = dias.find(d => text.includes(d)) || 'Lunes';
    const horaMatch = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?/i);
    
    let hours = parseInt(horaMatch?.[1] || '8');
    const minutes = horaMatch?.[2] || '00';
    const ampm = horaMatch?.[3]?.toLowerCase();

    if ((ampm === 'pm' || ampm === 'p.m.') && hours < 12) hours += 12;
    if ((ampm === 'am' || ampm === 'a.m.') && hours === 12) hours = 0;

    const horaFormatted = `${hours.toString().padStart(2, '0')}:${minutes}`;
    
    // Sanitize activity name
    let actividad = input.split(/lunes|martes|miercoles|miércoles|jueves|viernes|sabado|sábado|domingo/i)[0] || input;
    actividad = sanitizeName(actividad);

    return {
      name: 'gestionar_horario',
      args: {
        eventos: [{
          dia: diaMatch.charAt(0).toUpperCase() + diaMatch.slice(1).replace('miércoles', 'Miercoles').replace('sábado', 'Sabado'),
          hora: horaFormatted,
          horaFin: `${(hours + 2).toString().padStart(2, '0')}:${minutes}`, // Default +2h
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
