import React, { useState, useEffect } from 'react';
import { EstadoTarea, AppState } from './types';
import AgendaTable from './components/AgendaTable';
import SidebarAI from './components/SidebarAI';
import AuthCard from './components/AuthCard';
import TaskForm from './components/TaskForm';
import Sections from './components/Sections';
import ScheduleSection from './components/ScheduleSection';
import { PlusCircle, Calendar, ClipboardList, Moon, Sun, LogOut } from 'lucide-react';
import { auth, onAuthStateChanged, signOut } from './src/lib/firebase';
import { dbService } from './services/dbService';
import { User } from 'firebase/auth';

const generateId = () => {
  return typeof crypto !== 'undefined' && crypto.randomUUID 
    ? crypto.randomUUID() 
    : Math.random().toString(36).substring(2, 11);
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<AppState>({ 
    tareas: [], notas: [], pasatiempos: [], horario: [], calificaciones: [] 
  });

  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('agenda_dark_mode') === 'true');
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Manejo de Autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await loadUserData();
      } else {
        setState({ tareas: [], notas: [], pasatiempos: [], horario: [], calificaciones: [] });
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loadUserData = async () => {
    try {
      const [tareas, notas, pasatiempos, horario, calificaciones] = await Promise.all([
        dbService.getPrivateData('tareas'),
        dbService.getPrivateData('notas'),
        dbService.getPrivateData('pasatiempos'),
        dbService.getPrivateData('horario'),
        dbService.getPrivateData('calificaciones'),
      ]);
      setState({ 
        tareas: tareas as any, 
        notas: notas as any, 
        pasatiempos: pasatiempos as any, 
        horario: horario as any, 
        calificaciones: calificaciones as any 
      });
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('agenda_dark_mode', darkMode.toString());
  }, [darkMode]);

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!user) return <AuthCard />;

  const handleLogout = () => signOut(auth);

  // Handlers sincronizados con Firestore
  const bulkAddTasks = async (nuevas: any[]) => {
    const mapped = nuevas.map(t => ({
      ...t, id: generateId(), ingreso: new Date().toISOString(), estado: EstadoTarea.PENDIENTE,
    }));
    for (const t of mapped) {
      await dbService.addData('tareas', t);
    }
    await loadUserData();
  };

  // ... (otros handlers similares que usen dbService)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white transition-colors duration-300">
      <main className="max-w-7xl mx-auto p-4 md:p-8 pb-48">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="animate-in fade-in slide-in-from-left duration-700">
            <h1 className="text-3xl font-black tracking-tighter flex items-center gap-3">
              <Calendar className="text-blue-600" size={32} /> FORMATO A <span className="text-blue-600">CENTRAL</span>
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}`} className="w-5 h-5 rounded-full" alt="" />
              <p className="text-gray-400 text-[8px] font-bold uppercase tracking-widest">
                SESIÓN ACTIVA: {user.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setDarkMode(!darkMode)} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
              {darkMode ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} className="text-blue-600" />}
            </button>
            <button onClick={handleLogout} className="p-2.5 rounded-xl bg-red-100 dark:bg-red-900/20 text-red-600 hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors" title="Cerrar Sesión">
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
            <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-400">Datos Sincronizados (Firestore)</h2>
          </div>
          <AgendaTable 
            tareas={state.tareas} 
            now={currentTime}
            updateTask={async (id, upds) => {
              const tarea = state.tareas.find(t => t.id === id);
              if (tarea && (tarea as any).id) await dbService.updateData('tareas', (tarea as any).id, upds);
              await loadUserData();
            }}
            removeTask={async (id) => {
              const tarea = state.tareas.find(t => t.id === id);
              if (tarea && (tarea as any).id) await dbService.deleteData('tareas', (tarea as any).id);
              await loadUserData();
            }}
          />
        </section>

        {/* ... Resto de componentes ... */}
      </main>

      <SidebarAI 
        state={state}
        onAIAddTask={bulkAddTasks}
        // ... otros handlers ...
        onAIAddCalificacion={async (materia, obtenido, total) => {
          await dbService.addData('calificaciones', { materia, obtenido, total });
          await loadUserData();
        }}
        onAIRemoveTasks={() => {}} // Implementar según necesidad
        onAIUpdateHorario={() => {}}
        onAIRemoveHorario={() => {}}
        onAIAddNotas={async (notas) => {
          for (const n of notas) await dbService.addData('notas', { contenido: n });
          await loadUserData();
        }}
        onAIRemoveNotas={() => {}}
        onAIAddPasatiempos={async (pasa) => {
          for (const p of pasa) await dbService.addData('pasatiempos', { nombre: p, completado: false });
          await loadUserData();
        }}
        onAIRemovePasatiempos={() => {}}
      />

      {isTaskFormOpen && (
        <TaskForm 
          onClose={() => setIsTaskFormOpen(false)} 
          onSubmit={async (t) => {
            await dbService.addData('tareas', {...t, id: generateId(), ingreso: new Date().toISOString(), estado: EstadoTarea.PENDIENTE});
            await loadUserData();
            setIsTaskFormOpen(false);
          }} 
        />
      )}
    </div>
  );
};

export default App;