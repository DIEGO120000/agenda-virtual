
import React, { useState, useEffect } from 'react';
import { Nota, Pasatiempo } from '../types';
import { Trash2, Plus, StickyNote, Gamepad2, CheckCircle2, Circle, Clock, Edit2, Save, X } from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase/config';

interface Props {
  pasatiempos: Pasatiempo[];
  addNota: (text: string) => void;
  removeNota: (id: string) => void;
  updateNota?: (id: string, content: string) => void;
  addPasatiempo: (text: string) => void;
  togglePasatiempo: (id: string) => void;
  removePasatiempo: (id: string) => void;
}

const Sections: React.FC<Props> = ({ 
  pasatiempos, addNota, removeNota, updateNota, addPasatiempo, togglePasatiempo, removePasatiempo 
}) => {
  const [localNotas, setLocalNotas] = useState<Nota[]>([]);
  const [notaInput, setNotaInput] = useState('');
  const [pasatiempoInput, setPasatiempoInput] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteContent, setEditNoteContent] = useState('');

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

  const handleSaveEdit = (id: string) => {
    if (updateNota && editNoteContent.trim()) {
      updateNota(id, editNoteContent);
      setEditingNoteId(null);
    }
  };

  const startEditing = (nota: Nota) => {
    setEditingNoteId(nota.id);
    setEditNoteContent(nota.contenido);
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
        <div className="p-6">
          <form onSubmit={handleAddNota} className="flex gap-2 mb-6">
            <input 
              className="flex-1 border border-gray-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 bg-gray-50 dark:bg-slate-800 dark:text-white transition-all"
              placeholder="Añadir recordatorio, deuda..."
              value={notaInput}
              onChange={e => setNotaInput(e.target.value)}
            />
            <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white p-3 rounded-xl transition-all shadow-lg active:scale-95">
              <Plus size={20} />
            </button>
          </form>
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {localNotas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 opacity-40">
                <StickyNote size={48} className="mb-2 text-amber-200" />
                <p className="text-gray-400 dark:text-slate-500 text-xs italic">No hay notas guardadas.</p>
              </div>
            ) : (
              localNotas.map(n => (
                <div key={n.id} className="bg-amber-50/50 dark:bg-amber-900/5 p-5 rounded-2xl border border-amber-100 dark:border-amber-900/20 flex flex-col group animate-in fade-in slide-in-from-bottom-2 duration-300 relative">
                  <div className="flex justify-between items-start gap-4">
                    {editingNoteId === n.id ? (
                      <textarea 
                        className="flex-1 bg-white dark:bg-slate-800 border border-amber-500 rounded-xl p-3 text-sm outline-none resize-none min-h-[80px]"
                        value={editNoteContent}
                        onChange={(e) => setEditNoteContent(e.target.value)}
                        autoFocus
                      />
                    ) : (
                      <p className="text-sm text-amber-900 dark:text-amber-100 leading-relaxed flex-1 font-medium whitespace-pre-wrap">{n.contenido}</p>
                    )}
                    
                    <div className="flex flex-col gap-2">
                      {editingNoteId === n.id ? (
                        <>
                          <button onClick={() => handleSaveEdit(n.id)} className="text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 p-2 rounded-lg transition-colors"><Save size={16} /></button>
                          <button onClick={() => setEditingNoteId(null)} className="text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-lg transition-colors"><X size={16} /></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEditing(n)} className="text-amber-400 dark:text-amber-600 hover:text-amber-500 p-2 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-colors opacity-0 group-hover:opacity-100"><Edit2 size={16} /></button>
                          <button 
                            onClick={() => removeNota(n.id)}
                            className="text-amber-300 dark:text-amber-800 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[9px] font-mono text-amber-600/60 dark:text-amber-400/50 mt-3 uppercase font-black tracking-wider border-t border-amber-100/50 dark:border-amber-900/10 pt-2">
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
        <div className="p-6">
          <form onSubmit={handleAddPasatiempo} className="flex gap-2 mb-6">
            <input 
              className="flex-1 border border-gray-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 bg-gray-50 dark:bg-slate-800 dark:text-white transition-all"
              placeholder="Actividad de ocio..."
              value={pasatiempoInput}
              onChange={e => setPasatiempoInput(e.target.value)}
            />
            <button type="submit" className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-xl transition-all shadow-lg active:scale-95">
              <Plus size={20} />
            </button>
          </form>
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {pasatiempos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 opacity-40">
                <Gamepad2 size={48} className="mb-2 text-green-200" />
                <p className="text-gray-400 dark:text-slate-500 text-xs italic">No hay pasatiempos registrados.</p>
              </div>
            ) : (
              pasatiempos.map(p => (
                <div key={p.id} className="flex items-center justify-between bg-green-50/50 dark:bg-green-900/5 p-5 rounded-2xl border border-green-100 dark:border-green-900/20 group hover:border-green-500/30 transition-all animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => togglePasatiempo(p.id)}
                      className={`${p.completado ? 'text-green-600 dark:text-green-400' : 'text-gray-300 dark:text-slate-600'} hover:text-green-500 transition-all transform active:scale-125`}
                    >
                      {p.completado ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                    </button>
                    <span className={`text-sm font-semibold ${p.completado ? 'line-through text-green-800/50 dark:text-green-400/50' : 'text-green-900 dark:text-green-100'}`}>
                      {p.nombre}
                    </span>
                  </div>
                  <button 
                    onClick={() => removePasatiempo(p.id)}
                    className="text-green-300 dark:text-green-800 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    <Trash2 size={18} />
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
