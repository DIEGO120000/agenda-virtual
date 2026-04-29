
import React, { useMemo, useState } from 'react';
import { Tarea, EstadoTarea, PrioridadTarea } from '../types';
import { differenceInSeconds, parseISO, startOfDay, isBefore } from 'date-fns';
import { CheckCircle, Trash2, Timer, Zap, Edit2, Save, X } from 'lucide-react';

interface Props {
  tareas: Tarea[];
  updateTask: (id: string, updates: Partial<Tarea>) => void;
  removeTask: (id: string) => void;
  now: Date;
}

const AgendaTable: React.FC<Props> = ({ tareas, updateTask, removeTask, now }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Tarea>>({});

  // Función para calcular la prioridad dinámica (0 a 100+)
  const calculateDynamicPriority = (tarea: Tarea) => {
    const culmDate = new Date(tarea.culminacion);
    culmDate.setHours(23, 59, 59, 999);
    
    const totalSeconds = differenceInSeconds(culmDate, now);
    const hoursRemaining = totalSeconds / 3600;
    
    // 1. Base por Criticidad (0-40 puntos)
    let score = tarea.criticidad * 4;
    
    // 2. Bonus por Urgencia
    if (totalSeconds <= 0) {
      score += 1000 + (tarea.criticidad * 10); 
    } else if (hoursRemaining < 24) {
      score += 60 + (tarea.criticidad * 2);
    } else if (hoursRemaining < 72) {
      score += 30 + tarea.criticidad;
    } else if (hoursRemaining < 168) {
      score += 10;
    }

    let label = PrioridadTarea.BAJA;
    if (score > 100) label = PrioridadTarea.ALTA;
    else if (score > 50) label = PrioridadTarea.MEDIA;
    
    if (tarea.prioridad === PrioridadTarea.PASATIEMPO) {
      label = PrioridadTarea.PASATIEMPO;
      score = score / 2;
    }

    return { score, label };
  };

  const processedTasks = useMemo(() => {
    return tareas.map(t => ({
      ...t,
      dynamic: calculateDynamicPriority(t)
    })).sort((a, b) => b.dynamic.score - a.dynamic.score);
  }, [tareas, now]);

  const getStatus = (tarea: Tarea): EstadoTarea => {
    if (tarea.estado === EstadoTarea.REALIZADA) return EstadoTarea.REALIZADA;
    const culmDate = startOfDay(parseISO(tarea.culminacion));
    const today = startOfDay(now);
    if (isBefore(culmDate, today)) {
      return EstadoTarea.ATRASADA;
    }
    return tarea.estado;
  };

  const getTimeRemaining = (culm: string) => {
    const culmDate = parseISO(culm);
    const targetDate = new Date(culmDate);
    targetDate.setHours(23, 59, 59, 999);
    
    const totalSeconds = differenceInSeconds(targetDate, now);
    if (totalSeconds <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return { days, hours, minutes, seconds, expired: false };
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('es-ES', { 
      day: '2-digit', month: '2-digit', year: 'numeric' 
    });
  };

  const startEditing = (tarea: Tarea) => {
    setEditingId(tarea.id);
    setEditValues({ nombre: tarea.nombre, criticidad: tarea.criticidad });
  };

  const saveEdit = (id: string) => {
    updateTask(id, editValues);
    setEditingId(null);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[1000px]">
        <thead>
          <tr className="bg-gray-100 dark:bg-slate-800/80 text-gray-600 dark:text-slate-400 uppercase text-xs font-bold border-b border-gray-200 dark:border-slate-800">
            <th className="px-4 py-3 w-12 text-center"><Zap size={14} className="inline text-blue-500" /></th>
            <th className="px-4 py-3">Tarea</th>
            <th className="px-4 py-3">Ingreso</th>
            <th className="px-4 py-3">Recomendado</th>
            <th className="px-4 py-3">Culminación</th>
            <th className="px-4 py-3">Tiempo Restante</th>
            <th className="px-4 py-3">Criticidad</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3 text-right pr-8">Acciones</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-slate-900">
          {processedTasks.length === 0 ? (
            <tr>
              <td colSpan={9} className="px-4 py-8 text-center text-gray-400 dark:text-slate-500 italic">No hay tareas pendientes en la agenda.</td>
            </tr>
          ) : (
            processedTasks.map((tarea, index) => {
              const currentStatus = getStatus(tarea);
              const { days, hours, minutes, seconds, expired } = getTimeRemaining(tarea.culminacion);
              const isEditing = editingId === tarea.id;
              const isDone = tarea.estado === EstadoTarea.REALIZADA;

              return (
                <tr key={tarea.id} className={`border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors group ${expired && !isDone ? 'bg-red-50/30 dark:bg-red-900/10' : ''}`}>
                  <td className="px-4 py-4 text-center">
                    <span className="text-[10px] font-mono font-bold text-gray-400">{index + 1}</span>
                  </td>
                  <td className="px-4 py-4 font-semibold text-gray-800 dark:text-white">
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <input 
                          type="text" 
                          value={editValues.nombre} 
                          onChange={(e) => setEditValues({...editValues, nombre: e.target.value})}
                          className="bg-slate-100 dark:bg-slate-800 border border-blue-500 rounded px-2 py-1 text-sm outline-none w-full"
                        />
                      ) : (
                        <span className={isDone ? 'line-through text-gray-400' : ''}>{tarea.nombre}</span>
                      )}
                      {!isEditing && (
                        <button 
                          onClick={() => updateTask(tarea.id, { estado: isDone ? EstadoTarea.PENDIENTE : EstadoTarea.REALIZADA })}
                          className={`transition-all ml-2 ${isDone ? 'text-green-500' : 'text-gray-300 hover:text-green-500 opacity-0 group-hover:opacity-100'}`}
                          title={isDone ? "Marcar como pendiente" : "Marcar como completada"}
                        >
                          <CheckCircle size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600 dark:text-slate-300">{formatDate(tarea.ingreso)}</td>
                  <td className="px-4 py-4 text-sm text-gray-600 dark:text-slate-300">{formatDate(tarea.recomendado)}</td>
                  <td className="px-4 py-4 text-sm text-gray-600 dark:text-slate-300">{formatDate(tarea.culminacion)}</td>
                  <td className="px-4 py-4">
                    {isDone ? (
                      <span className="text-green-600 dark:text-green-400 font-black text-[10px] uppercase tracking-widest">FINALIZADA</span>
                    ) : expired ? (
                      <span className="text-red-600 dark:text-red-400 font-black text-xs uppercase tracking-tighter animate-pulse">¡VENCIDA!</span>
                    ) : (
                      <div className="flex items-center gap-1.5 font-mono text-xs">
                        <Timer size={14} className={days === 0 ? 'text-red-500 animate-pulse' : 'text-blue-500'} />
                        <span className={`font-bold ${days === 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-white'}`}>
                          {days}d {hours.toString().padStart(2, '0')}h {minutes.toString().padStart(2, '0')}m
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <select 
                          value={editValues.criticidad} 
                          onChange={(e) => setEditValues({...editValues, criticidad: parseInt(e.target.value)})}
                          className="bg-slate-100 dark:bg-slate-800 border border-blue-500 rounded text-xs p-1"
                        >
                          {[...Array(11).keys()].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                      ) : (
                        <>
                          <div className="w-12 bg-gray-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-300 ${tarea.criticidad > 7 ? 'bg-red-500' : tarea.criticidad > 4 ? 'bg-yellow-500' : 'bg-green-500'}`}
                              style={{ width: `${tarea.criticidad * 10}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-bold font-mono">{tarea.criticidad}/10</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-xs font-bold">
                    <span className={`px-2 py-1 rounded-full ${
                      isDone ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      currentStatus === EstadoTarea.ATRASADA ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 
                      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      {currentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {isEditing ? (
                        <>
                          <button onClick={() => saveEdit(tarea.id)} className="text-blue-500 hover:text-blue-600"><Save size={18} /></button>
                          <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-red-500"><X size={18} /></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEditing(tarea)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-500 transition-all"><Edit2 size={16} /></button>
                          <button onClick={() => window.confirm('¿Eliminar?') && removeTask(tarea.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all"><Trash2 size={16} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AgendaTable;
