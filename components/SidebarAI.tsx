import React, { useState, useRef, useEffect } from 'react';
import { AppState } from '../types';
import { nlpParser } from '../services/nlpParser';
import { Send, Mic, MicOff, Loader2, ChevronUp, ChevronDown, Paperclip, Terminal } from 'lucide-react';

interface Props {
  state: AppState;
  onAIAddTask: (tareas: any[]) => void;
  onAIRemoveTasks: (nombres: string[]) => void;
  onAIUpdateHorario: (eventos: any[]) => void;
  onAIRemoveHorario: (criterios: any[]) => void;
  onAIAddNotas: (textos: string[]) => void;
  onAIRemoveNotas: (fragmentos: string[]) => void;
  onAIAddPasatiempos: (textos: string[]) => void;
  onAIRemovePasatiempos: (nombres: string[]) => void;
  onAIAddCalificacion: (materia: string, obtenido: number, total: number) => void;
}

const SidebarAI: React.FC<Props> = ({ 
  state, onAIAddTask, onAIRemoveTasks, onAIUpdateHorario, onAIRemoveHorario, 
  onAIAddNotas, onAIRemoveNotas, onAIAddPasatiempos, onAIRemovePasatiempos,
  onAIAddCalificacion
}) => {
  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<{ role: 'ai' | 'user' | 'error'; text: string }[]>([
    { role: 'ai', text: 'SISTEMA OPERATIVO A-AI v4.0 // NÚCLEO LOCAL ACTIVO // PROCESAMIENTO SIN LATENCIA.' }
  ]);
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, loading, isExpanded]);

  const handleSend = async (textToProcess?: string) => {
    const trimmedInput = (textToProcess || input).trim();
    if (!trimmedInput || loading) return;
    
    setInput('');
    if (!textToProcess) {
      setMessages(prev => [...prev, { role: 'user', text: trimmedInput }]);
    }
    setLoading(true);

    try {
      // Simular latencia mínima de procesamiento local
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const response = nlpParser(trimmedInput);
      let aiText = "COMANDO EJECUTADO // PROCESADO POR NÚCLEO LOCAL A-AI.";
      
      if (response) {
        const { name, args } = response;
        try {
          switch (name) {
            case 'gestionar_agenda': if (args.tareas) onAIAddTask(args.tareas); break;
            case 'gestionar_horario': if (args.eventos) onAIUpdateHorario(args.eventos); break;
            case 'gestionar_notes': if (args.notes) onAIAddNotas(args.notes); break;
            case 'gestionar_calificacion': 
              if (args.materia) {
                onAIAddCalificacion(args.materia, args.obtenido, args.total);
                aiText = `CALIFICACIÓN REGISTRADA: ${args.materia} (${args.obtenido}/${args.total}). ACUMULADO ACTUALIZADO.`;
              }
              break;
            case 'eliminar_contenido':
              if (args.tipo === 'tarea') onAIRemoveTasks(args.criterios);
              if (args.tipo === 'horario') onAIRemoveHorario(args.criterios);
              if (args.tipo === 'nota') onAIRemoveNotas(args.criterios);
              if (args.tipo === 'pasatiempo') onAIRemovePasatiempos(args.criterios);
              break;
          }
        } catch (fnError) {
          console.error("Local Parser Execution Error:", fnError);
        }
      } else {
        aiText = "SISTEMA LOCAL: NO SE PUDO CATEGORIZAR EL COMANDO. GUARDADO COMO NOTA GENERAL.";
        onAIAddNotas([trimmedInput]);
      }

      setMessages(prev => [...prev, { role: 'ai', text: aiText }]);
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'error', text: `LOCAL_ERR: FALLA EN EL NÚCLEO (${error.message})` }]);
    } finally {
      setLoading(false);
    }
  };

  const startRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMessages(prev => [...prev, { role: 'error', text: "ERROR: NAVEGADOR NO SOPORTA DICTADO POR VOZ." }]);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-DO';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setMessages(prev => [...prev, { role: 'user', text: `🎤 ${transcript}` }]);
      handleSend(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error(event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleMic = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  try {
    return (
      <div className="fixed bottom-0 left-0 w-full z-[100] flex justify-center px-4 pb-4">
        {isExpanded && (
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[-1] animate-in fade-in duration-300"
            onClick={() => setIsExpanded(false)}
          />
        )}

        <div className={`
          relative w-full max-w-4xl terminal-glass rounded-3xl overflow-hidden transition-all duration-500 ease-in-out shadow-[0_-20px_50px_-15px_rgba(0,0,0,0.5)]
          ${isExpanded ? 'h-[70vh] md:h-[60vh]' : 'h-16'}
        `}>
          <div className="scanline" />

          <div 
            className="h-16 flex items-center justify-between px-6 cursor-pointer group"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-xl bg-blue-600/20 text-blue-400 ${loading ? 'animate-pulse' : ''}`}>
                <Terminal size={20} />
              </div>
              <div className="flex flex-col">
                <span className="mono font-bold text-[11px] tracking-[0.2em] text-blue-500 uppercase leading-none">A-AI TERMINAL</span>
                <span className="text-[8px] text-slate-500 font-black tracking-widest mt-1 flex items-center gap-1.5 uppercase">
                  <span className={`w-1.5 h-1.5 rounded-full ${isRecording ? 'bg-red-500 animate-ping' : 'bg-green-500'}`}></span> 
                  {isRecording ? 'LISTENING_MODE_ACTIVE' : 'READY_TO_COMMAND'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {!isExpanded && (
                <div className="hidden md:flex items-center gap-4 mr-4">
                   <span className="mono text-[10px] text-slate-500 animate-pulse uppercase tracking-wider">Esperando táctica...</span>
                </div>
              )}
              <div className="p-2 rounded-full bg-slate-800 text-slate-400 group-hover:text-blue-400 transition-colors">
                {isExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
              </div>
            </div>
          </div>

          {isExpanded && (
            <div className="flex flex-col h-[calc(70vh-4rem)] md:h-[calc(60vh-4rem)]">
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                    <div className={`max-w-[90%] md:max-w-[75%] px-5 py-4 rounded-2xl text-[13px] mono border shadow-lg ${
                      m.role === 'user' ? 
                      'bg-blue-600 text-white border-blue-500 rounded-tr-none' : 
                      m.role === 'error' ? 
                      'bg-red-950/40 text-red-500 border-red-900/50' :
                      'bg-slate-900/80 text-blue-100 border-slate-700/50 rounded-tl-none'
                    }`}>
                      <div className="flex items-center gap-2 mb-2 opacity-40 text-[9px] font-black tracking-[0.3em] uppercase">
                        {m.role === 'user' ? 'USER_INPUT' : 'SYSTEM_LOG'}
                        <div className="h-[1px] flex-1 bg-current opacity-20" />
                      </div>
                      <p className="leading-relaxed">{m.text}</p>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-900/50 p-4 rounded-2xl flex items-center gap-3 border border-slate-800 shadow-sm">
                      <Loader2 size={16} className="animate-spin text-blue-500" />
                      <span className="mono text-[11px] text-blue-500 uppercase tracking-widest font-black">Escuchando...</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 md:p-6 bg-slate-950/80 border-t border-slate-800/50">
                <div className="flex items-end gap-3 bg-slate-900 border border-slate-700/50 rounded-2xl p-2 focus-within:border-blue-500/50 transition-colors shadow-inner">
                  <div className="flex gap-1 shrink-0 pb-1">
                    <button 
                      onClick={toggleMic}
                      className={`relative p-3 transition-all rounded-xl flex items-center justify-center ${isRecording ? 'text-white' : 'text-slate-500 hover:text-blue-400 hover:bg-slate-800'}`}
                      title={isRecording ? "Click para enviar" : "Click para hablar"}
                    >
                      {isRecording && <div className="ring-animation" />}
                      <div className={`relative z-10 transition-transform ${isRecording ? 'scale-125' : ''}`}>
                        {isRecording ? <MicOff size={20} className="text-red-500" /> : <Mic size={20} />}
                      </div>
                    </button>
                  </div>

                  <textarea
                    rows={1}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                    placeholder={isRecording ? "SISTEMA ESCUCHANDO..." : "ORDEN POR TEXTO O VOZ..."}
                    className="flex-1 bg-transparent border-none py-3 px-1 text-[13px] focus:ring-0 outline-none text-white resize-none max-h-32 mono font-bold placeholder:text-slate-600"
                  />
                  
                  <button 
                    onClick={() => handleSend()} 
                    disabled={loading || isRecording}
                    className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-xl active:scale-90 transition-transform disabled:opacity-50 disabled:scale-100 flex items-center justify-center"
                  >
                    <Send size={20} />
                  </button>
                </div>
                <div className="mt-3 flex justify-between items-center px-1">
                  <span className="text-[7px] text-slate-600 mono font-black uppercase tracking-[0.2em]">NÚCLEO LOCAL A-AI // SINCRONIZACIÓN OFFLINE</span>
                  <span className="text-[7px] text-slate-600 mono font-black uppercase tracking-[0.2em]">{isRecording ? "ESCUCHANDO... HABLE AHORA" : "PROCESAMIENTO INSTANTÁNEO"}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  } catch (renderError) {
    console.error("SidebarAI Render Crash:", renderError);
    return null; // Fallback to avoid white screen
  }
};

export default SidebarAI;