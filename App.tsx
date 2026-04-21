import React, { useState, useEffect } from 'react';
import { EstadoTarea, AppState } from './types';
import AgendaTable from './components/AgendaTable';
import SidebarAI from './components/SidebarAI';
import AuthButton from './components/AuthButton';
import TaskForm from './components/TaskForm';
import Sections from './components/Sections';
import ScheduleSection from './components/ScheduleSection';
import { PlusCircle, Calendar, ClipboardList, Moon, Sun } from 'lucide-react';

// ... (generador de IDs)

const App: React.FC = () => {
  // ... (estados)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white transition-colors duration-300">
      <AuthButton />
      <main className="max-w-7xl mx-auto p-4 md:p-8 pb-48">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="animate-in fade-in slide-in-from-left duration-700">
            <h1 className="text-3xl font-black tracking-tighter flex items-center gap-3">
              <Calendar className="text-blue-600" size={32} /> FORMATO A <span className="text-blue-600">CENTRAL</span>
            </h1>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1 ml-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span> 
              Sincronización Táctica Activa
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setDarkMode(!darkMode)} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors" title="Toggle Dark Mode">
              {darkMode ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} className="text-blue-600" />}
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
            updateTask={(id, upds) => setState(p => ({ ...p, tareas: p.tareas.map(t => t.id === id ? {...t, ...upds} : t) }))}
            removeTask={(id) => setState(p => ({ ...p, tareas: p.tareas.filter(t => t.id !== id) }))}
          />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <ScheduleSection 
              horario={state.horario} 
              onRemove={(id) => setState(p => ({ ...p, horario: p.horario.filter(e => e.id !== id) }))}
              onClear={() => setState(p => ({ ...p, horario: [] }))}
            />
          </div>
          <div className="space-y-8">
            <Sections 
              notas={state.notas} 
              pasatiempos={state.pasatiempos}
              addNota={(c) => setState(p => ({ ...p, notas: [...p.notas, {id: generateId(), contenido: c, timestamp: new Date().toISOString()}] }))}
              removeNota={(id) => setState(p => ({ ...p, notas: p.notas.filter(n => n.id !== id) }))}
              addPasatiempo={(n) => setState(p => ({ ...p, pasatiempos: [...p.pasatiempos, {id: generateId(), nombre: n, completado: false}] }))}
              togglePasatiempo={(id) => setState(p => ({ ...p, pasatiempos: p.pasatiempos.map(p => p.id === id ? {...p, completado: !p.completado} : p) }))}
              removePasatiempo={(id) => setState(p => ({ ...p, pasatiempos: p.pasatiempos.filter(p => p.id !== id) }))}
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
        onAIAddCalificacion={addCalificacion}
      />

      {isTaskFormOpen && (
        <TaskForm 
          onClose={() => setIsTaskFormOpen(false)} 
          onSubmit={(t) => setState(p => ({ 
            ...p, 
            tareas: [...p.tareas, {...t, id: generateId(), ingreso: new Date().toISOString(), estado: EstadoTarea.PENDIENTE}] 
          }))} 
        />
      )}
    </div>
  );
};

export default App;