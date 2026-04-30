
import React, { useState } from 'react';
import { EventoHorario } from '../types';
import { Clock, Trash2, CalendarDays, BookOpen, Coffee, GraduationCap, Monitor, Users, MapPin, Edit2, Save, X } from 'lucide-react';

interface Props {
  horario: EventoHorario[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onUpdate?: (id: string, updates: Partial<EventoHorario>) => void;
}

const ScheduleSection: React.FC<Props> = ({ horario, onRemove, onClear, onUpdate }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<EventoHorario>>({});
  const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  const getWeekNumber = (date: Date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  const weekNow = getWeekNumber(new Date());

  const normalize = (str: string) => 
    (str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

  const formatToAmPm = (time24: string) => {
    if (!time24 || typeof time24 !== 'string' || !time24.includes(':')) return time24 || '';
    try {
      const parts = time24.split(':');
      if (parts.length < 2) return time24;
      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);
      const period = hours >= 12 ? 'PM' : 'AM';
      const hours12 = hours % 12 || 12;
      const minutesStr = isNaN(minutes) ? '00' : (minutes < 10 ? `0${minutes}` : minutes.toString());
      return `${hours12}:${minutesStr} ${period}`;
    } catch (e) {
      return time24;
    }
  };

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'clase': return <GraduationCap size={16} className="text-blue-500" />;
      case 'estudio': return <BookOpen size={16} className="text-purple-500" />;
      case 'descanso': return <Coffee size={16} className="text-orange-500" />;
      default: return <Clock size={16} className="text-gray-500" />;
    }
  };

  const getModalityBadge = (evento: EventoHorario) => {
    const { modalidad, id, semanaAncla, estadoAncla } = evento;
    if (!modalidad) return null;

    if (modalidad === 'Semipresencial') {
      const ancla = semanaAncla || weekNow;
      const baseEstado = estadoAncla || 'Presencial';
      const diff = Math.abs(weekNow - ancla);
      const currentEstado = diff % 2 === 0 ? baseEstado : (baseEstado === 'Presencial' ? 'Virtual' : 'Presencial');
      
      return (
        <button 
          onClick={() => onUpdate && onUpdate(id, { 
            semanaAncla: weekNow, 
            estadoAncla: currentEstado === 'Presencial' ? 'Virtual' : 'Presencial' 
          })}
          className="flex items-center gap-2 text-xs font-bold uppercase transition-all active:scale-95"
        >
          <span className="text-orange-500 text-lg">🟠</span>
          <span className="text-gray-400">Semi -</span>
          <span className={currentEstado === 'Virtual' ? 'text-green-500' : 'text-red-500'}>{currentEstado}</span>
        </button>
      );
    }

    if (modalidad === 'Virtual') {
      return (
        <div className="flex items-center gap-2 text-xs font-bold uppercase">
          <span className="text-green-500 text-lg">🟢</span>
          <span className="text-green-500">Virtual</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 text-xs font-bold uppercase">
        <span className="text-red-500 text-lg">🔴</span>
        <span className="text-red-500">Presencial</span>
      </div>
    );
  };

  const startEditing = (evento: EventoHorario) => {
    setEditingId(evento.id);
    setEditValues({ actividad: evento.actividad, modalidad: evento.modalidad });
  };

  const saveEdit = (id: string) => {
    if (onUpdate) onUpdate(id, editValues);
    setEditingId(null);
  };

  return (
    <section id="schedule-section" className="bg-[#0B1121] rounded-3xl p-8 shadow-2xl border border-slate-800 overflow-hidden transition-colors duration-300 flex flex-col h-full min-h-[400px]">
      <div className="flex items-center justify-between mb-10">
        <h2 className="text-white font-black uppercase text-xs tracking-[0.3em] flex items-center gap-3 opacity-50">
          <CalendarDays size={20} className="text-blue-500" /> Horario Académico Definitive
        </h2>
        {horario.length > 0 && (
          <button 
            onClick={onClear}
            className="text-[10px] bg-red-500/10 text-red-500 px-4 py-2 rounded-xl hover:bg-red-500/20 transition-all uppercase font-black tracking-widest border border-red-500/20"
          >
            Reset Data
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-12 pr-4 custom-scrollbar">
        {horario.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center opacity-20">
            <Clock size={64} className="text-white mb-4" />
            <p className="text-white text-sm font-bold uppercase tracking-widest max-w-[250px]">Waiting for schedule input...</p>
          </div>
        ) : (
          <>
            {dias.map(dia => {
              const normDia = normalize(dia);
              const eventosDelDia = horario
                .filter(e => normalize(e.dia || "") === normDia)
                .sort((a, b) => (a.hora || "").localeCompare(b.hora || ""));

              if (eventosDelDia.length === 0) return null;

              return (
                <div key={dia} className="animate-in fade-in slide-in-from-left duration-700">
                  <h3 className="text-white font-bold text-3xl uppercase text-left mb-6 mt-8 block tracking-tighter italic">
                    {dia}
                  </h3>
                  <div className="space-y-4">
                    {eventosDelDia.map(evento => {
                      const isEditing = editingId === evento.id;
                      return (
                        <div 
                          key={evento.id} 
                          className="flex justify-between items-center py-5 border-b border-white/5 group hover:bg-white/[0.02] px-4 rounded-2xl transition-all"
                        >
                          <div className="flex items-center gap-6 flex-1">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-3">
                                {isEditing ? (
                                  <input 
                                    type="text" 
                                    value={editValues.actividad} 
                                    onChange={(e) => setEditValues({...editValues, actividad: e.target.value})}
                                    className="bg-slate-800 border border-blue-500 rounded-lg px-3 py-1 text-sm outline-none text-white font-bold"
                                  />
                                ) : (
                                  <span className="text-xl font-bold text-white tracking-tight">
                                    {evento.actividad.replace(/\*/g, '')}
                                  </span>
                                )}
                                <span className="text-sm font-black text-white uppercase tracking-widest ml-2">
                                  {formatToAmPm(evento.hora)} - {formatToAmPm(evento.horaFin)}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-8">
                            {isEditing && evento.tipo === 'clase' ? (
                              <select 
                                value={editValues.modalidad}
                                onChange={(e) => setEditValues({...editValues, modalidad: e.target.value as any})}
                                className="bg-slate-800 border border-blue-500 rounded-lg text-[10px] p-2 font-black text-white uppercase outline-none"
                              >
                                <option value="Virtual">Virtual</option>
                                <option value="Presencial">Presencial</option>
                                <option value="Semipresencial">Semipresencial</option>
                              </select>
                            ) : (
                              evento.tipo === 'clase' && getModalityBadge(evento)
                            )}
                            
                            <div className="flex items-center gap-2">
                              {isEditing ? (
                                <>
                                  <button onClick={() => saveEdit(evento.id)} className="text-green-500 hover:scale-110 transition-transform"><Save size={18} /></button>
                                  <button onClick={() => setEditingId(null)} className="text-gray-500 hover:scale-110 transition-transform"><X size={18} /></button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => startEditing(evento)} className="text-white/10 hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100 p-2"><Edit2 size={16} /></button>
                                  <button 
                                    onClick={() => onRemove(evento.id)}
                                    className="text-white/10 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-2"
                                  >
                                    <Trash2 size={16} />
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
            })}

            {/* Auditoría de Datos */}
            {(() => {
              const standardDays = dias.map(d => normalize(d));
              const extraEvents = horario.filter(e => !standardDays.includes(normalize(e.dia || "")));
              if (extraEvents.length === 0) return null;

              return (
                <div className="mt-16 pt-8 border-t border-dashed border-white/10 opacity-30">
                  <h3 className="text-[10px] font-black text-white uppercase pb-4 tracking-[0.3em]">
                    Unclassified Data
                  </h3>
                  <div className="grid gap-2">
                    {extraEvents.map(evento => (
                      <div key={evento.id} className="flex items-center justify-between py-2 px-4 rounded-xl hover:bg-white/5 transition-all">
                        <div className="flex items-center gap-4 text-white">
                          <span className="text-[10px] font-black opacity-50">{evento.dia || 'S/D'}</span>
                          <span className="text-xs font-bold">{evento.actividad}</span>
                        </div>
                        <button onClick={() => onRemove(evento.id)} className="text-white/20 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </>
        )}
      </div>
      <div className="p-3 bg-gray-50 dark:bg-slate-800/30 border-t border-gray-100 dark:border-slate-800 flex items-center justify-center gap-2">
        <div className="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-widest text-gray-400">
           <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Virtual
        </div>
        <div className="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-widest text-gray-400">
           <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> Presencial
        </div>
        <div className="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-widest text-gray-400">
           <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div> Semi
        </div>
      </div>
    </section>
  );
};

export default ScheduleSection;
