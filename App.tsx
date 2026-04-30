
import React, { useState, useEffect } from 'react';
import { Tarea, Nota, Pasatiempo, AppState, EstadoTarea, EventoHorario, PrioridadTarea } from './types';
import AgendaTable from './components/AgendaTable';
import SidebarAI from './components/SidebarAI';
import TaskForm from './components/TaskForm';
import Sections from './components/Sections';
import ScheduleSection from './components/ScheduleSection';
import Login from './components/Login';
import GradesSection from './components/GradesSection';
import { PlusCircle, Calendar, ClipboardList, Moon, Sun, LogOut, Loader2, Award } from 'lucide-react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase/config';
import { logout } from './services/auth';
import { saveData, subscribeToMyData, deleteMyData, updateMyData } from './services/db';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [state, setState] = useState<AppState>({ 
    tareas: [], 
    notas: [], 
    pasatiempos: [], 
    horario: [],
    calificaciones: []
  });

  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Observador de Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Suscripciones en tiempo real a Firestore
  useEffect(() => {
    if (user) {
      const unsubTareas = subscribeToMyData('tareas', (data) => setState(p => ({ ...p, tareas: data as Tarea[] })));
      const unsubPasatiempos = subscribeToMyData('pasatiempos', (data) => setState(p => ({ ...p, pasatiempos: data as Pasatiempo[] })));
      const unsubHorario = subscribeToMyData('horario', (data) => setState(p => ({ ...p, horario: data as EventoHorario[] })));
      const unsubCalificaciones = subscribeToMyData('calificaciones', (data) => setState(p => ({ ...p, calificaciones: data as Calificacion[] })));

      return () => {
        unsubTareas();
        unsubPasatiempos();
        unsubHorario();
        unsubCalificaciones();
      };
    }
  }, [user]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Handlers sincronizados con DB
  const handleUpdateHorario = async (id: string, updates: Partial<EventoHorario>) => {
    const oldEvento = state.horario.find(e => e.id === id);
    if (oldEvento && updates.actividad && updates.actividad !== oldEvento.actividad) {
      // Propagar cambio de nombre a todas las entradas del horario con el mismo nombre
      const sameSubjects = state.horario.filter(e => e.actividad === oldEvento.actividad);
      for (const s of sameSubjects) {
        await updateMyData('horario', s.id, { actividad: updates.actividad });
      }
      // Propagar a calificaciones
      const relatedCalifs = state.calificaciones.filter(c => c.materia === oldEvento.actividad);
      for (const calif of relatedCalifs) {
        await updateMyData('calificaciones', calif.id, { materia: updates.actividad });
      }
    } else {
      await updateMyData('horario', id, updates);
    }
  };

  const handleRemoveHorario = async (id: string) => {
    const evento = state.horario.find(e => e.id === id);
    if (evento) {
      await deleteMyData('horario', id);
      // Opcional: Si ya no quedan entradas para esa materia, podríamos limpiar calificaciones
      // pero por seguridad de datos del usuario, las mantendremos ocultas en la UI 
      // hasta que la materia vuelva a aparecer o se borren manualmente.
    }
  };

  const handleAddTask = async (t: any) => {
    const nuevaTarea = {
      ...t,
      ingreso: new Date().toISOString(),
      estado: EstadoTarea.PENDIENTE,
    };
    try {
      await saveData('tareas', nuevaTarea);
    } catch (err) { console.error("Error al guardar tarea:", err); }
  };

  const handleAddCalificacion = async (materia: string, entrada: any) => {
    const existing = state.calificaciones.find(c => c.materia === materia);
    const newEntrada = { ...entrada, id: crypto.randomUUID() };

    if (existing) {
      await updateMyData('calificaciones', existing.id, {
        entradas: [...existing.entradas, newEntrada]
      });
    } else {
      await saveData('calificaciones', {
        materia,
        entradas: [newEntrada]
      });
    }
  };

  const handleRemoveCalificacion = async (califId: string, entradaId: string) => {
    const calif = state.calificaciones.find(c => c.id === califId);
    if (calif) {
      const filtered = calif.entradas.filter(e => e.id !== entradaId);
      if (filtered.length === 0) {
        await deleteMyData('calificaciones', califId);
      } else {
        await updateMyData('calificaciones', califId, { entradas: filtered });
      }
    }
  };

  const bulkAddTasks = (nuevas: any[]) => {
    nuevas.forEach(t => handleAddTask(t));
  };

  const removeTasksByName = (nombres: string[]) => {
    state.tareas.forEach(t => {
      if (nombres.some(n => t.nombre.toLowerCase().includes(n.toLowerCase()))) {
        deleteMyData('tareas', t.id);
      }
    });
  };

  const updateHorario = async (eventos: any[]) => {
    for (const e of eventos) {
      try {
        await saveData('horario', e);
      } catch (err) { console.error(err); }
    }
  };

  const removeHorarioByCriteria = (criterios: string[]) => {
    state.horario.forEach(e => {
      if (criterios.some(c => e.actividad.toLowerCase().includes(c.toLowerCase()))) {
        deleteMyData('horario', e.id);
      }
    });
  };

  const addNota = async (contenido: string) => {
    const nuevaNota = { contenido, timestamp: new Date().toISOString() };
    try {
      await saveData('notas', nuevaNota);
    } catch (err) { console.error(err); }
  };

  const bulkAddNotas = (textos: string[]) => {
    textos.forEach(t => addNota(t));
  };

  const removeNotasByCriteria = (criterios: string[]) => {
    // Nota: El estado global 'state.notas' ya no se actualiza por suscripcion, 
    // pero podemos obtener las notas actuales para borrarlas si es necesario 
    // o simplemente delegar a una consulta. Para este MVP, SidebarAI aun usa state.
  };

  const addPasatiempo = async (nombre: string) => {
    const nuevoP = { nombre, completado: false };
    try {
      await saveData('pasatiempos', nuevoP);
    } catch (err) { console.error(err); }
  };

  const bulkAddPasatiempos = (nombres: string[]) => {
    nombres.forEach(n => addPasatiempo(n));
  };

  const removePasatiemposByCriteria = (criterios: string[]) => {
    state.pasatiempos.forEach(p => {
      if (criterios.some(c => p.nombre.toLowerCase().includes(c.toLowerCase()))) {
        deleteMyData('pasatiempos', p.id);
      }
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0B1121]">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  if (!user) {
    return <Login onAuthSuccess={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0B1121] dark:text-white transition-colors duration-300">
      <main className="max-w-7xl mx-auto p-4 md:p-8 pb-48">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="animate-in fade-in slide-in-from-left duration-700">
            <h1 className="text-3xl font-black tracking-tighter flex items-center gap-3">
              <Calendar className="text-blue-600" size={32} /> AGENDA <span className="text-blue-600">VIRTUAL</span>
            </h1>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1 ml-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span> 
              Operador: {user.email}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
              {theme === 'dark' ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} className="text-blue-600" />}
            </button>
            <button onClick={() => logout()} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-gray-200 dark:border-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 transition-all">
              <LogOut size={20} />
            </button>
            <button onClick={() => setIsTaskFormOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-black text-xs tracking-widest flex items-center gap-2 shadow-lg transition-all active:scale-95 uppercase">
              <PlusCircle size={18} /> Nueva Tarea
            </button>
          </div>
        </header>

        <section className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-800 overflow-hidden mb-8 animate-in fade-in zoom-in-95 duration-500">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center gap-2 bg-gray-50/50 dark:bg-slate-800/30">
            <ClipboardList className="text-blue-600" size={18} />
            <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-400">Módulo de Seguimiento Dinámico</h2>
          </div>
          <AgendaTable 
            tareas={state.tareas} 
            now={currentTime}
            updateTask={(id, upds) => updateMyData('tareas', id, upds)}
            removeTask={(id) => deleteMyData('tareas', id)}
          />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <ScheduleSection 
              horario={state.horario} 
              onRemove={handleRemoveHorario}
              onClear={() => state.horario.forEach(e => deleteMyData('horario', e.id))}
              onUpdate={handleUpdateHorario}
            />
            <GradesSection 
              horario={state.horario}
              calificaciones={state.calificaciones}
              onAddEntrada={handleAddCalificacion}
              onRemoveEntrada={handleRemoveCalificacion}
            />
          </div>
          <div className="space-y-8">
            <Sections 
              pasatiempos={state.pasatiempos}
              addNota={addNota}
              removeNota={(id) => deleteMyData('notas', id)}
              addPasatiempo={addPasatiempo}
              togglePasatiempo={(id) => {
                const p = state.pasatiempos.find(x => x.id === id);
                if (p) updateMyData('pasatiempos', id, { completado: !p.completado });
              }}
              removePasatiempo={(id) => deleteMyData('pasatiempos', id)}
            />
          </div>
        </div>
      </main>

      <SidebarAI 
        state={state}
        onAIAddTask={bulkAddTasks}
        onAIRemoveTasks={removeTasksByName}
        onAIUpdateHorario={updateHorario}
        onAIRemoveHorario={removeHorarioByCriteria}
        onAIAddNotas={bulkAddNotas}
        onAIRemoveNotas={removeNotasByCriteria}
        onAIAddPasatiempos={bulkAddPasatiempos}
        onAIRemovePasatiempos={removePasatiemposByCriteria}
        onAIAddCalificacion={(m, o, t) => saveData('calificaciones', { materia: m, obtenido: o, total: t })}
      />

      {isTaskFormOpen && (
        <TaskForm 
          onClose={() => setIsTaskFormOpen(false)} 
          onSubmit={handleAddTask} 
        />
      )}
    </div>
  );
};

export default App;
