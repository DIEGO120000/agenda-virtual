import React, { useState, useRef, useEffect } from 'react';
import { AppState } from '../types';
import { getAIResponse } from '../services/geminiService';
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
}

const SidebarAI: React.FC<Props> = ({ 
  state, onAIAddTask, onAIRemoveTasks, onAIUpdateHorario, onAIRemoveHorario, 
  onAIAddNotas, onAIRemoveNotas, onAIAddPasatiempos, onAIRemovePasatiempos 
}) => {
  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<{ role: 'ai' | 'user' | 'error'; text: string }[]>([
    { role: 'ai', text: 'SISTEMA OPERATIVO A-AI v3.2 // NÚCLEO RECONECTADO // LISTO.' }
  ]);
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, loading, isExpanded]);

  const handleSend = async (
    audioData?: { data: string, mimeType: string }, 
    fileData?: { data: string, mimeType: string }
  ) => {
    const trimmedInput = input.trim();
    if (!trimmedInput && !audioData && !fileData || loading) return;
    
    let userMsg = trimmedInput;
    if (audioData) userMsg = "🎤 [COMANDO DE VOZ PROCESADO]";
    if (fileData) userMsg = `📎 [DOC_${fileData.mimeType.split('/')[1].toUpperCase()}]`;
    
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const response = await getAIResponse(state, trimmedInput, audioData, fileData);
      const aiText = response.text || "COMANDO EJECUTADO // SINCRONIZACIÓN COMPLETA.";
      
      setMessages(prev => [...prev, { role: 'ai', text: aiText }]);
      
      if (response.functionCalls) {
        response.functionCalls.forEach(fc => {
          const args = fc.args as any;
          switch (fc.name) {
            case 'gestionar_agenda': if (args.tareas) onAIAddTask(args.tareas); break;
            case 'gestionar_horario': if (args.eventos) onAIUpdateHorario(args.eventos); break;
            case 'gestionar_notes': if (args.notes) onAIAddNotas(args.notes); break;
            case 'gestionar_pasatiempos': if (args.hobbies) onAIAddPasatiempos(args.hobbies); break;
            case 'eliminar_contenido':
              if (args.tipo === 'tarea') onAIRemoveTasks(args.criterios);
              if (args.tipo === 'horario') onAIRemoveHorario(args.criterios);
              if (args.tipo === 'nota') onAIRemoveNotas(args.criterios);
              if (args.tipo === 'pasatiempo') onAIRemovePasatiempos(args.criterios);
              break;
          }
        });
      }
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'error', text: `SYS_ERROR: RECONEXIÓN FALLIDA (${error.message || 'XHR_FAILURE'})` }]);
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const options = { mimeType: 'audio/webm;codecs=opus' };
      const mimeType = MediaRecorder.isTypeSupported(options.mimeType) ? options.mimeType : 'audio/mp4';
      
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      
      recorder.ondataavailable = (e) => { 
        if (e.data.size > 0) chunksRef.current.push(e.data); 
      };
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
        if (audioBlob.size > 1000) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1];
            handleSend({ data: base64, mimeType });
          };
          reader.readAsDataURL(audioBlob);
        } else {
          setMessages(prev => [...prev, { role: 'error', text: "ERROR: SEÑAL DE VOZ INEXISTENTE." }]);
        }
        streamRef.current?.getTracks().forEach(t => t.stop());
      };
      
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'error', text: "ERROR: MICRÓFONO NO DETECTADO." }]);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
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
                  <input type="file" ref={fileInputRef} onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const r = new FileReader();
                      r.onloadend = () => handleSend(undefined, { data: (r.result as string).split(',')[1], mimeType: file.type });
                      r.readAsDataURL(file);
                    }
                    e.target.value = '';
                  }} className="hidden" />
                  
                  <button onClick={() => fileInputRef.current?.click()} className="p-3 text-slate-500 hover:text-blue-400 hover:bg-slate-800 rounded-xl transition-all">
                    <Paperclip size={20} />
                  </button>
                  
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
                <span className="text-[7px] text-slate-600 mono font-black uppercase tracking-[0.2em]">SISTEMA BLINDADO // PROTOCOLO A-3.2</span>
                <span className="text-[7px] text-slate-600 mono font-black uppercase tracking-[0.2em]">{isRecording ? "GRABANDO... CLICK PARA FINALIZAR" : "CONEXIÓN ESTABLE"}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SidebarAI;