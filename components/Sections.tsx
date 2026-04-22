
import React, { useState, useEffect } from 'react';
import { Nota, Pasatiempo } from '../types';
import { Trash2, Plus, StickyNote, Gamepad2, CheckCircle2, Circle, Clock } from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase/config';

interface Props {
  pasatiempos: Pasatiempo[];
  addNota: (text: string) => void;
  removeNota: (id: string) => void;
  addPasatiempo: (text: string) => void;
  togglePasatiempo: (id: string) => void;
  removePasatiempo: (id: string) => void;
}

const Sections: React.FC<Props> = ({ 
  pasatiempos, addNota, removeNota, addPasatiempo, togglePasatiempo, removePasatiempo 
}) => {
  const [localNotas, setLocalNotas] = useState<Nota[]>([]);
  const [notaInput, setNotaInput] = useState('');
  const [pasatiempoInput, setPasatiempoInput] = useState('');

  // Suscripción en tiempo real a la colección segmentada de Notas
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, 'usuarios', user.uid, 'notas'), 
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Nota[];
      setLocalNotas(docs);
    }, (error) => {
      console.error("Error en suscripción de notas:", error);
    });

    return () => unsubscribe();
  }, []);

  const handleAddNota = (e: React.FormEvent) => {
    e.preventDefault();
    if (notaInput.trim()) {
      addNota(notaInput);
      setNotaInput('');
    }
  };

  const handleAddPasatiempo = (e: React.FormEvent) => {
    e.preventDefault();
    if (pasatiempoInput.trim()) {
      addPasatiempo(pasatiempoInput);
      setPasatiempoInput('');
    }
  };

  const formatNoteTimestamp = (iso: any) => {
    try {
      // Manejar tanto strings ISO como Firestore Timestamps
      const d = iso?.seconds ? new Date(iso.seconds * 1000) : new Date(iso);
      if (isNaN(d.getTime())) return '--:-- --/--/----';
      const time = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
      const date = d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
      return `${time} ${date}`;
    } catch {
      return '--:-- --/--/----';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* 🗒️ Notas */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-800 overflow-hidden transition-colors duration-300">
        <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border-b border-amber-100 dark:border-amber-900/20 flex items-center justify-between">
          <h2 className="font-bold text-amber-800 dark:text-amber-400 flex items-center gap-2">
            <StickyNote size={18} /> 🗒️ Notas
          </h2>
        </div>
        <div className="p-4">
          <form onSubmit={handleAddNota} className="flex gap-2 mb-4">
            <input 
              className="flex-1 border border-gray-200 dark:border-slate-700 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 bg-gray-50 dark:bg-slate-800 dark:text-white transition-all"
              placeholder="Añadir recordatorio, deuda..."
              value={notaInput}
              onChange={e => setNotaInput(e.target.value)}
            />
            <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white p-2.5 rounded-lg transition-all shadow-lg active:scale-95">
              <Plus size={18} />
            </button>
          </form>
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {localNotas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 opacity-40">
                <StickyNote size={32} className="mb-2" />
                <p className="text-gray-400 dark:text-slate-500 text-xs italic">No hay notas guardadas.</p>
              </div>
            ) : (
              localNotas.map(n => (
                <div key={n.id} className="bg-amber-50/50 dark:bg-amber-900/5 p-4 rounded-xl border border-amber-100 dark:border-amber-900/20 flex flex-col group animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm text-amber-900 dark:text-amber-100 leading-relaxed flex-1 font-medium">{n.contenido}</p>
                    <button 
                      onClick={() => removeNota(n.id)}
                      className="text-amber-300 dark:text-amber-800 hover:text-red-500 transition-colors ml-3 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-950/20"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 text-[9px] font-mono text-amber-600/60 dark:text-amber-400/50 mt-1 uppercase font-black tracking-wider">
                    <Clock size={10} />
                    {n.timestamp ? formatNoteTimestamp(n.timestamp) : '--:-- --/--/----'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* 🎯 Pasatiempos */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-800 overflow-hidden transition-colors duration-300">
        <div className="p-4 bg-green-50 dark:bg-green-900/10 border-b border-green-100 dark:border-green-900/20 flex items-center justify-between">
          <h2 className="font-bold text-green-800 dark:text-green-400 flex items-center gap-2">
            <Gamepad2 size={18} /> 🎯 Pasatiempos
          </h2>
        </div>
        <div className="p-4">
          <form onSubmit={handleAddPasatiempo} className="flex gap-2 mb-4">
            <input 
              className="flex-1 border border-gray-200 dark:border-slate-700 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 bg-gray-50 dark:bg-slate-800 dark:text-white transition-all"
              placeholder="Actividad de ocio..."
              value={pasatiempoInput}
              onChange={e => setPasatiempoInput(e.target.value)}
            />
            <button type="submit" className="bg-green-500 hover:bg-green-600 text-white p-2.5 rounded-lg transition-all shadow-lg active:scale-95">
              <Plus size={18} />
            </button>
          </form>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {pasatiempos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 opacity-40">
                <Gamepad2 size={32} className="mb-2" />
                <p className="text-gray-400 dark:text-slate-500 text-xs italic">No hay pasatiempos registrados.</p>
              </div>
            ) : (
              pasatiempos.map(p => (
                <div key={p.id} className="flex items-center justify-between bg-green-50/50 dark:bg-green-900/5 p-4 rounded-xl border border-green-100 dark:border-green-900/20 group hover:border-green-500/30 transition-all animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => togglePasatiempo(p.id)}
                      className={`${p.completado ? 'text-green-600 dark:text-green-400' : 'text-gray-300 dark:text-slate-600'} hover:text-green-500 transition-all transform active:scale-125`}
                    >
                      {p.completado ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                    </button>
                    <span className={`text-sm font-medium ${p.completado ? 'line-through text-green-800/50 dark:text-green-400/50' : 'text-green-900 dark:text-green-100'}`}>
                      {p.nombre}
                    </span>
                  </div>
                  <button 
                    onClick={() => removePasatiempo(p.id)}
                    className="text-green-300 dark:text-green-800 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Sections;
