
import React, { useState } from 'react';
import { Calificacion, EventoHorario, EntradaCalificacion } from '../types';
import { Award, Plus, Trash2, Calculator, BookOpen } from 'lucide-react';

interface Props {
  horario: EventoHorario[];
  calificaciones: Calificacion[];
  onAddEntrada: (materia: string, entrada: Omit<EntradaCalificacion, 'id'>) => void;
  onRemoveEntrada: (materiaId: string, entradaId: string) => void;
}

const GradesSection: React.FC<Props> = ({ horario, calificaciones, onAddEntrada, onRemoveEntrada }) => {
  const [newEntryName, setNewEntryName] = useState('');
  const [newEntryPoints, setNewEntryPoints] = useState('');
  const [selectedMateria, setSelectedMateria] = useState('');

  // Filtrar solo las materias únicas del horario
  const materiasUnicas = Array.from(new Set(horario.filter(e => e.tipo === 'clase').map(e => e.actividad)));

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMateria || !newEntryName || !newEntryPoints) return;
    
    onAddEntrada(selectedMateria, {
      nombre: newEntryName,
      puntos: parseFloat(newEntryPoints)
    });

    setNewEntryName('');
    setNewEntryPoints('');
  };

  const calculateTotal = (materia: string) => {
    const calif = calificaciones.find(c => c.materia === materia);
    if (!calif) return 0;
    return calif.entradas.reduce((sum, entry) => sum + entry.puntos, 0);
  };

  return (
    <section className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-800 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-emerald-50/50 dark:bg-emerald-900/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="text-emerald-600" size={18} />
          <h2 className="text-[10px] font-black uppercase tracking-widest text-emerald-800 dark:text-emerald-400">Control de Calificaciones</h2>
        </div>
      </div>

      <div className="p-6">
        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-8">
          <select 
            value={selectedMateria}
            onChange={(e) => setSelectedMateria(e.target.value)}
            className="bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500 text-gray-700 dark:text-white"
          >
            <option value="">Seleccionar Materia</option>
            {materiasUnicas.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <input 
            type="text" 
            placeholder="Ej: Foro 1, Tarea 5..."
            value={newEntryName}
            onChange={(e) => setNewEntryName(e.target.value)}
            className="bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500 text-gray-700 dark:text-white"
          />
          <input 
            type="number" 
            placeholder="Puntos"
            value={newEntryPoints}
            onChange={(e) => setNewEntryPoints(e.target.value)}
            className="bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500 text-gray-700 dark:text-white"
          />
          <button 
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
          >
            <Plus size={16} /> Registrar
          </button>
        </form>

        <div className="space-y-4">
          {materiasUnicas.length === 0 ? (
            <div className="text-center py-8 text-gray-400 dark:text-slate-500 italic text-sm">
              Registra materias en tu horario para empezar a trackear puntos.
            </div>
          ) : (
            materiasUnicas.map(materia => {
              const calif = calificaciones.find(c => c.materia === materia);
              const total = calculateTotal(materia);

              return (
                <div key={materia} className="border border-gray-100 dark:border-slate-800 rounded-2xl overflow-hidden bg-gray-50/30 dark:bg-slate-800/20">
                  <div className="px-4 py-3 bg-white dark:bg-slate-800/50 flex items-center justify-between border-b border-gray-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <BookOpen size={14} className="text-emerald-500" />
                      <span className="text-xs font-black uppercase tracking-tight text-gray-700 dark:text-white">{materia}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                      <Calculator size={12} className="text-emerald-600" />
                      <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">TOTAL: {total} pts</span>
                    </div>
                  </div>
                  <div className="p-3">
                    {calif && calif.entradas.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {calif.entradas.map(entrada => (
                          <div key={entrada.id} className="flex items-center justify-between bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-gray-100 dark:border-slate-700 group hover:border-emerald-500/50 transition-colors">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-tighter">{entrada.nombre}</span>
                              <span className="text-xs font-black text-gray-800 dark:text-white">{entrada.puntos} pts</span>
                            </div>
                            <button 
                              onClick={() => onRemoveEntrada(calif.id, entrada.id)}
                              className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[10px] text-gray-400 dark:text-slate-500 italic text-center py-2">Sin registros de puntos aún.</div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
};

export default GradesSection;
