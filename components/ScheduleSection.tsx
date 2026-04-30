
import React, { useState } from 'react';
import { EventoHorario } from '../types';
import { Trash2, CalendarDays, GraduationCap, MapPin, Monitor, Edit2, Save, X, Clock } from 'lucide-react';

interface Props {
  horario: EventoHorario[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onUpdate?: (id: string, updates: Partial<EventoHorario>) => void;
}

const ScheduleSection: React.FC<Props> = ({ horario, onRemove, onClear, onUpdate }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<EventoHorario>>({});
  const [localHoras, setLocalHoras] = useState({ inicio: '', fin: '' });
  const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  const getWeekNumber = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  const weekNow = getWeekNumber(new Date());

  const normalize = (str: string) => 
    (str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

  const sanitizeName = (name: string) => (name || "").replace(/\*/g, '').trim();

  const formatToAmPm = (time24: string) => {
    if (!time24 || typeof time24 !== 'string' || !time24.includes(':')) return time24 || '';
    if (time24 === '--') return '--';
    try {
      if (time24.toUpperCase().includes('AM') || time24.toUpperCase().includes('PM')) return time24;
      const parts = time24.split(':');
      let hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);
      const period = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      const minutesStr = minutes < 10 ? `0${minutes}` : minutes.toString();
      return `${hours}:${minutesStr} ${period}`;
    } catch (e) {
      return time24;
    }
  };

  const convertTo24Hour = (timeStr: string) => {
    if (!timeStr || timeStr === '--') return '';
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (match) {
      let h = parseInt(match[1], 10);
      const m = match[2].padStart(2, '0');
      const period = match[3].toUpperCase();
      if (period === 'PM' && h < 12) h += 12;
      if (period === 'AM' && h === 12) h = 0;
      return `${h.toString().padStart(2, '0')}:${m}`;
    }
    if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
      const parts = timeStr.split(':');
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    }
    return timeStr;
  };

  const timeToMinutes = (timeStr: string) => {
    if (!timeStr || timeStr === '--') return 9999;
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (match) {
      let h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const period = match[3].toUpperCase();
      if (period === 'PM' && h < 12) h += 12;
      if (period === 'AM' && h === 12) h = 0;
      return h * 60 + m;
    }
    const parts = timeStr.split(':');
    if (parts.length >= 2) {
      return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    }
    return 9999;
  };

  const getModalityBadge = (evento: EventoHorario) => {
    const { modalidad, semiAnchorWeek, semiAnchorState } = evento;
    if (!modalidad) return null;

    if (modalidad === 'Semipresencial') {
      const anclaSemana = semiAnchorWeek || weekNow;
      const anclaEstado = semiAnchorState || 'Presencial';
      const diff = Math.abs(weekNow - anclaSemana);
      const currentEstado = diff % 2 === 0 ? anclaEstado : (anclaEstado === 'Presencial' ? 'Virtual' : 'Presencial');
      const isVirtual = currentEstado === 'Virtual';

      return (
        <div className="flex items-center gap-3">
          <div className="bg-orange-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg shadow-black/20">
            <MapPin size={12} /> SEMIPRESENCIAL
          </div>
          <div className={`${isVirtual ? 'bg-green-500' : 'bg-red-500'} text-white text-[10px] font-black px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg shadow-black/20 animate-pulse`}>
            {isVirtual ? <Monitor size={12} /> : <MapPin size={12} />}
            {isVirtual ? 'SEMANA VIRTUAL' : 'SEMANA PRESENCIAL'}
          </div>
        </div>
      );
    }

    if (modalidad === 'Autogestionada') {
      return (
        <div className="bg-purple-600 text-white text-[10px] font-black px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg shadow-black/20">
          <Clock size={12} /> AUTOGESTIONADA
        </div>
      );
    }

    const isVirtual = modalidad === 'Virtual';
    const bgColor = isVirtual ? 'bg-green-500' : 'bg-red-500';
    const label = isVirtual ? 'VIRTUAL' : 'SESIÓN PRESENCIAL';

    return (
      <div className={`${bgColor} text-white text-[10px] font-black px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg shadow-black/20`}>
        {isVirtual ? <Monitor size={12} /> : <MapPin size={12} />}
        {label}
      </div>
    );
    };

    const startEditing = (evento: EventoHorario) => {
    setEditingId(evento.id);
    const hIn = convertTo24Hour(evento.hora);
    const hOut = convertTo24Hour(evento.horaFin);
    setLocalHoras({ inicio: hIn, fin: hOut });
    setEditValues({ 
      actividad: evento.actividad, 
      modalidad: evento.modalidad,
      dia: evento.dia || "Pendiente",
      hora: hIn,
      horaFin: hOut,
      profesor: evento.profesor || "Pendiente",
      semiAnchorState: evento.semiAnchorState || "Presencial"
    });
    };

    const saveEdit = async (id: string) => {
    const finalUpdates = { 
      ...editValues,
      hora: formatToAmPm(localHoras.inicio),
      horaFin: formatToAmPm(localHoras.fin)
    };
    if (finalUpdates.modalidad === 'Semipresencial') {
      finalUpdates.semiAnchorWeek = weekNow;
    }
    if (finalUpdates.modalidad === 'Autogestionada') {
      finalUpdates.dia = "Autogestionada";
      finalUpdates.hora = "--";
      finalUpdates.horaFin = "--";
    }
    if (onUpdate) await onUpdate(id, finalUpdates);
    setEditingId(null);
    setLocalHoras({ inicio: '', fin: '' });
    };

    // LÓGICA DE AGRUPACIÓN ANTI-CRASH (100% VISIBILIDAD)
    const groupedHorario = horario.reduce((acc, evento) => {
    const rawDia = evento.dia || "";
    const diaNorm = normalize(rawDia);
    const diaCanonico = dias.find(d => normalize(d) === diaNorm) || (rawDia.trim() || "DÍA NO ESPECIFICADO");
    const diaKey = diaCanonico.toUpperCase();
    if (!acc[diaKey]) acc[diaKey] = [];
    acc[diaKey].push(evento);
    return acc;
    }, {} as Record<string, EventoHorario[]>);

    const sortedDayNames = Object.keys(groupedHorario).sort((a, b) => {
    const idxA = dias.findIndex(d => d.toUpperCase() === a);
    const idxB = dias.findIndex(d => d.toUpperCase() === b);
    if (idxA === -1 && idxB === -1) return a.localeCompare(b);
    if (idxA === -1) return 1;
    if (idxB === -1) return -1;
    return idxA - idxB;
    });

    return (
    <section id="schedule-section" className="bg-transparent overflow-hidden flex flex-col h-fit min-h-[200px] py-4">
      <div className="flex items-center justify-between mb-8 px-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600/20 rounded-2xl">
            <CalendarDays size={24} className="text-blue-500" />
          </div>
          <h2 className="text-white font-black uppercase text-sm tracking-[0.4em]">Horario Validado</h2>
        </div>
        {horario.length > 0 && (
          <button 
            onClick={onClear}
            className="text-[10px] bg-white/5 text-white/40 px-5 py-2.5 rounded-2xl hover:bg-white/10 hover:text-white transition-all uppercase font-black tracking-widest border border-white/5"
          >
            Limpiar Todo
          </button>
        )}
      </div>

      <div className="space-y-16 pb-10">
        {horario.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center opacity-20">
            <Clock size={64} className="text-white mb-6" />
            <p className="text-white text-xs font-black uppercase tracking-[0.3em] max-w-[250px]">Sincronizando con Memoria Central...</p>
          </div>
        ) : (
          sortedDayNames.map(dia => {
            // ORDENAMIENTO CRONOLÓGICO POR DÍA
            const eventosDelDia = groupedHorario[dia].sort((a, b) => timeToMinutes(a.hora) - timeToMinutes(b.hora));

            return (
              <div key={dia} className="animate-in fade-in slide-in-from-left duration-700 px-4">
                <h3 className="text-white font-bold text-3xl uppercase text-left mb-6 mt-8 block">
                  {dia}
                </h3>
                <div className="space-y-4">
                  {eventosDelDia.map(evento => {
                    const isEditing = editingId === evento.id;
                    const isAutogestionada = editValues.modalidad === 'Autogestionada';

                    return (
                      <div 
                        key={evento.id} 
                        className="bg-[#0f172a]/80 backdrop-blur-sm border border-white/5 rounded-[2rem] p-6 flex flex-col md:flex-row items-center justify-between group hover:border-blue-500/30 transition-all hover:shadow-2xl hover:shadow-blue-500/10 gap-6"
                      >
                        <div className="flex items-center gap-8 flex-1 w-full" onClick={(e) => isEditing && e.stopPropagation()}>
                          {/* IZQUIERDA: BLOQUE DE HORA */}
                          <div className="flex-none flex flex-col items-center justify-center bg-white/5 rounded-2xl px-4 py-3 min-w-[120px] border border-white/5">
                            {isEditing ? (
                              <div className="flex flex-col gap-2">
                                <input 
                                  type="time" 
                                  value={localHoras.inicio} 
                                  onChange={(e) => setLocalHoras({...localHoras, inicio: e.target.value})}
                                  disabled={isAutogestionada}
                                  className="bg-slate-800 text-white text-[10px] p-1 rounded border border-blue-500 outline-none disabled:opacity-30"
                                />
                                <input 
                                  type="time" 
                                  value={localHoras.fin} 
                                  onChange={(e) => setLocalHoras({...localHoras, fin: e.target.value})}
                                  disabled={isAutogestionada}
                                  className="bg-slate-800 text-white text-[10px] p-1 rounded border border-blue-500 outline-none disabled:opacity-30"
                                />
                              </div>
                            ) : (
                              evento.modalidad === 'Autogestionada' ? (
                                <span className="text-white/20 font-black text-xs uppercase tracking-tighter">Sin horario fijo</span>
                              ) : (
                                <>
                                  <span className="text-white font-black text-sm">{formatToAmPm(evento.hora)}</span>
                                  <div className="w-8 h-[1px] bg-white/10 my-2"></div>
                                  <span className="text-white/40 font-bold text-xs">{formatToAmPm(evento.horaFin)}</span>
                                </>
                              )
                            )}
                          </div>

                          {/* CENTRO: MATERIA */}
                          <div className="flex flex-col gap-1 flex-1">
                            <div className="flex items-center gap-3">
                              <GraduationCap size={20} className="text-blue-500" />
                              {isEditing ? (
                                <div className="flex flex-col gap-2 w-full">
                                  <div className="flex items-center gap-2">
                                    <input 
                                      type="text" 
                                      value={editValues.actividad} 
                                      onChange={(e) => setEditValues({...editValues, actividad: e.target.value})}
                                      className="bg-slate-800 border border-blue-500 rounded-lg px-3 py-1 text-sm outline-none text-white font-bold flex-1"
                                      placeholder="Nombre de la Materia"
                                    />
                                    <select 
                                      value={editValues.dia}
                                      onChange={(e) => setEditValues({...editValues, dia: e.target.value})}
                                      disabled={isAutogestionada}
                                      className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-[10px] font-black text-white uppercase outline-none disabled:opacity-30"
                                    >
                                      <option value="Pendiente">Pendiente</option>
                                      <option value="Autogestionada">Autogestionada</option>
                                      {dias.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                  </div>
                                  <input 
                                    type="text" 
                                    value={editValues.profesor} 
                                    onChange={(e) => setEditValues({...editValues, profesor: e.target.value})}
                                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1 text-[10px] outline-none text-white/60 font-bold w-full md:w-[300px]"
                                    placeholder="Nombre del Profesor"
                                  />
                                </div>
                              ) : (
                                <div className="flex flex-col">
                                  <span className="text-xl font-black text-white tracking-tight break-words">
                                    {sanitizeName(evento.actividad)}
                                  </span>
                                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-0.5">
                                    Prof. {evento.profesor || "Pendiente"}
                                  </span>
                                </div>
                              )}
                            </div>
                            {!isEditing && <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-8">SESIÓN UNIVERSITARIA</span>}
                          </div>
                        </div>

                        {/* DERECHA: MODALIDAD Y ACCIONES */}
                        <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
                          {isEditing ? (
                            <div className="flex flex-col gap-2">
                              <select 
                                value={editValues.modalidad}
                                onChange={(e) => setEditValues({...editValues, modalidad: e.target.value as any})}
                                className="bg-slate-800 border border-blue-500 rounded-lg text-[10px] p-2 font-black text-white uppercase outline-none"
                              >
                                <option value="Virtual">Virtual</option>
                                <option value="Presencial">Presencial</option>
                                <option value="Semipresencial">Semipresencial</option>
                                <option value="Autogestionada">Autogestionada</option>
                              </select>
                              {editValues.modalidad === 'Semipresencial' && (
                                <div className="flex flex-col gap-1">
                                  <label className="text-[8px] text-white/40 font-black uppercase">Inicia esta semana con:</label>
                                  <select 
                                    value={editValues.semiAnchorState}
                                    onChange={(e) => setEditValues({...editValues, semiAnchorState: e.target.value as any})}
                                    className="bg-slate-800 border border-slate-700 rounded p-1 text-[8px] font-bold text-white uppercase"
                                  >
                                    <option value="Presencial">Presencial</option>
                                    <option value="Virtual">Virtual</option>
                                  </select>
                                </div>
                              )}
                            </div>
                          ) : (
                            getModalityBadge(evento)
                          )}
                          
                          <div className="flex items-center gap-3">
                            {isEditing ? (
                              <>
                                <button onClick={() => saveEdit(evento.id)} className="bg-emerald-500/20 text-emerald-500 p-2 rounded-xl hover:bg-emerald-500 hover:text-white transition-all"><Save size={18} /></button>
                                <button onClick={() => setEditingId(null)} className="bg-white/5 text-white/40 p-2 rounded-xl hover:bg-white/10 transition-all"><X size={18} /></button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => startEditing(evento)} className="text-white/10 hover:text-blue-500 transition-colors p-2"><Edit2 size={16} /></button>
                                <button 
                                  onClick={() => onRemove(evento.id)}
                                  className="text-white/10 hover:text-red-500 transition-colors p-2"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};

export default ScheduleSection;

