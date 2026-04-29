import React, { useState, useRef, useEffect } from 'react';
import { AppState } from '../types';
import { analizarComando, procesarConsulta, transcribirAudio } from '../services/groqService';
import { saveData, updateMyData } from '../services/db';
import { EstadoTarea, PrioridadTarea } from '../types';
import { Send, Mic, MicOff, Loader2, ChevronUp, ChevronDown, Terminal } from 'lucide-react';

interface Props {
  state: AppState;
}

const fastPathRouter = (texto: string) => {
  const txt = texto.toLowerCase().trim();
  
  // 1. Banco de Saludos
  if (/^(hola|klk|buenas|buenos dias|buenos días|buenas tardes|buenas noches|saludos|hey|que tal|qué tal)$/.test(txt)) {
    const saludos = [
      "¡Hola! ¿Cómo estás? ¿En qué te puedo ayudar el día de hoy?",
      "¡Hola Diego! ¿Qué tenemos en la agenda para hoy?",
      "¡Buenas! Todo listo por aquí, ¿qué necesitas organizar hoy?",
      "¡Hola! Dime, ¿qué plan tenemos?"
    ];
    return saludos[Math.floor(Math.random() * saludos.length)];
  }
  
  // 2. Banco de Despedidas / Confirmaciones
  if (/^(gracias|ok|listo|chao|adios|adiós|entendido|perfecto|nitido|vale|excelente)$/.test(txt)) {
    const confirmaciones = [
      "¡De nada! Aquí estoy si necesitas algo más.",
      "¡Perfecto! Todo bajo control.",
      "¡A la orden! Me avisas si hay algo más que anotar.",
      "¡Entendido! Sigamos dándole."
    ];
    return confirmaciones[Math.floor(Math.random() * confirmaciones.length)];
  }
  
  // 3. Comandos de sistema locales / Ayuda
  if (/^(clear|limpiar|borrar)$/.test(txt)) {
    return "CLEAR_COMMAND";
  }
  
  if (/^(ayuda|help|que puedes hacer|qué puedes hacer|instrucciones)$/.test(txt)) {
    return "¡Claro! Puedo ayudarte a organizar tu horario, anotar tareas, crear notas rápidas o simplemente responder tus dudas sobre lo que tienes pendiente. Solo dime qué necesitas.";
  }
  
  // Si no coincide con palabras rápidas, devuelve null (pasa a la IA de Groq)
  return null;
};

const SidebarAI: React.FC<Props> = ({ state }) => {
  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<{ role: 'ai' | 'user' | 'error'; text: string }[]>([
    { role: 'ai', text: '¡Hola! Soy tu asistente de estudio. ¿En qué puedo ayudarte hoy?' }
  ]);
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

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

    const fastResponse = fastPathRouter(trimmedInput);
    if (fastResponse) {
      if (fastResponse === "CLEAR_COMMAND") {
        setMessages([{ role: 'ai', text: 'Chat limpiado. ¡Empecemos de cero!' }]);
      } else {
        setMessages(prev => [...prev, { role: 'ai', text: fastResponse }]);
      }
      return;
    }

    setLoading(true);

    try {
      const resultado = await analizarComando(trimmedInput);
      const acciones = resultado.actions || [resultado];
      
      // Procesamiento Secuencial de Acciones (Multi-Intento)
      for (const accion of acciones) {
        switch (accion.tipo) {
          case 'modificacion': {
            const collectionName = accion.objetivo === 'horario' ? 'horario' : 
                                  accion.objetivo === 'tareas' ? 'tareas' : 'notas';
            
            const collectionData = state[accion.objetivo as keyof AppState] as any[];
            const target = collectionData.find((item: any) => 
              item.id === accion.identificador || 
              (item.nombre || item.actividad || item.materia || item.contenido)?.toLowerCase().includes(String(accion.identificador).toLowerCase())
            );

            if (target) {
              await updateMyData(collectionName, target.id, accion.nuevos_datos);
            }
            break;
          }

          case 'horario':
            await saveData('horario', {
              actividad: accion.materia?.toUpperCase() || "MATERIA",
              dia: accion.dia,
              hora: accion.hora,
              modalidad: accion.modalidad || "Presencial",
              tipo: 'clase'
            });
            break;

          case 'tarea': {
            const fechaIngreso = new Date();
            const parsedCulm = new Date(accion.culminacion);
            const fechaCulminacion = isNaN(parsedCulm.getTime()) 
              ? new Date(new Date().setHours(23, 59, 59)) 
              : parsedCulm;
            
            const fechaRecomendado = new Date(fechaIngreso.getTime() + (fechaCulminacion.getTime() - fechaIngreso.getTime()) / 2);

            await saveData('tareas', {
              nombre: accion.tarea,
              ingreso: fechaIngreso.toISOString(),
              recomendado: fechaRecomendado.toISOString(),
              culminacion: fechaCulminacion.toISOString(),
              criticidad: 5,
              estado: EstadoTarea.PENDIENTE,
              prioridad: PrioridadTarea.MEDIA
            });
            break;
          }

          case 'nota':
            await saveData('notas', {
              contenido: accion.texto || trimmedInput,
              timestamp: new Date().toISOString()
            });
            break;
        }
      }

      // Determinar respuesta final consolidada
      let aiText = resultado.respuesta;

      if (!aiText) {
        const consulta = acciones.find((a: any) => a.tipo === 'consulta');
        const chat = acciones.find((a: any) => a.tipo === 'chat');
        
        if (consulta) {
          aiText = await procesarConsulta(consulta.intencion, state.tareas, state.horario, state.notas, state.pasatiempos);
        } else if (chat) {
          aiText = chat.respuesta;
        } else if (acciones.length > 0) {
          aiText = "Entendido, he procesado todas tus solicitudes correctamente.";
        } else {
          aiText = await procesarConsulta(trimmedInput, state.tareas, state.horario, state.notas, state.pasatiempos);
        }
      }

      setMessages(prev => [...prev, { role: 'ai', text: aiText }]);
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'error', text: `Lo siento, hubo un problema: ${error.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Detección de formato compatible con el dispositivo
        const mimeTypes = ['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav'];
        const supportedType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || '';
        
        const options = supportedType ? { mimeType: supportedType } : {};
        const mediaRecorder = new MediaRecorder(stream, options);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = async () => {
          stream.getTracks().forEach(track => track.stop());
          
          if (audioChunksRef.current.length === 0) {
            setMessages(prev => [...prev, { role: 'error', text: "SYS_ERR: No se capturaron datos de audio." }]);
            return;
          }

          const audioBlob = new Blob(audioChunksRef.current, { type: supportedType });
          
          setLoading(true);
          try {
            const textoTranscrito = await transcribirAudio(audioBlob);
            if (textoTranscrito) setInput(textoTranscrito);
          } catch (error: any) {
            setMessages(prev => [...prev, { role: 'error', text: `SYS_ERR: ${error.message}` }]);
          } finally {
            setLoading(false);
          }
        };

        mediaRecorder.start(200); // Captura datos cada 200ms para evitar buffers vacíos
        setIsRecording(true);
      } catch (err: any) {
        setMessages(prev => [...prev, { role: 'error', text: `MIC_PERMISSION_ERR: ${err.message}` }]);
      }
    }
  };

  return (
    <div className="fixed bottom-0 left-0 w-full z-[100] flex justify-center px-4 pb-4">
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[-1]"
          onClick={() => setIsExpanded(false)}
        />
      )}

      <div className={`
        relative w-full max-w-4xl terminal-glass rounded-3xl overflow-hidden transition-all duration-500 ease-in-out shadow-2xl
        ${isExpanded ? 'h-[60vh]' : 'h-16'}
      `}>
        <div className="scanline" />

        <div 
          className="h-16 flex items-center justify-between px-6 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-4">
            <div className={`p-2 rounded-xl bg-blue-600/20 text-blue-400 ${loading ? 'animate-pulse' : ''}`}>
              <Terminal size={20} />
            </div>
            <div className="flex flex-col">
              <span className="mono font-bold text-[11px] tracking-[0.2em] text-blue-500 uppercase">Asistente de Estudio</span>
              <span className="text-[8px] text-slate-500 font-black tracking-widest mt-1 flex items-center gap-1.5 uppercase">
                <span className={`w-1.5 h-1.5 rounded-full ${isRecording ? 'bg-red-500 animate-ping' : 'bg-green-500'}`}></span> 
                {isRecording ? 'Escuchando...' : 'En línea'}
              </span>
            </div>
          </div>
          <div className="p-2 rounded-full bg-slate-800 text-slate-400">
            {isExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </div>
        </div>

        {isExpanded && (
          <div className="flex flex-col h-[calc(60vh-4rem)]">
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((m, i) => (
                <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] px-5 py-4 rounded-2xl text-[13px] mono border shadow-lg ${
                    m.role === 'user' ? 'bg-blue-600 text-white border-blue-500' : 
                    m.role === 'error' ? 'bg-red-950/40 text-red-500 border-red-900/50' :
                    'bg-slate-900/80 text-blue-100 border-slate-700/50'
                  }`}>
                    <p className="leading-relaxed">{m.text}</p>
                  </div>
                  
                  {m.role === 'ai' && i === 0 && messages.length === 1 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {[
                        "¿Qué materias tengo hoy?",
                        "Recomiéndame qué tareas hacer",
                        "¿Qué tareas vencen pronto?"
                      ].map((chip) => (
                        <button
                          key={chip}
                          onClick={() => handleSend(chip)}
                          className="border border-white/20 bg-transparent rounded-full text-zinc-300 text-sm px-4 py-2 hover:bg-white/10 transition-all active:scale-95"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-slate-900/50 p-4 rounded-2xl flex items-center gap-3 border border-slate-800">
                    <Loader2 size={16} className="animate-spin text-blue-500" />
                    <span className="mono text-[11px] text-blue-500 uppercase font-black">Procesando...</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-950/80 border-t border-slate-800/50">
              <div className="flex items-end gap-3 bg-slate-900 border border-slate-700/50 rounded-2xl p-2 focus-within:border-blue-500 transition-colors">
                <button 
                  onClick={toggleRecording}
                  className={`p-3 rounded-xl ${isRecording ? 'text-red-500 animate-pulse' : 'text-slate-500 hover:text-blue-400'}`}
                >
                  {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
                </button>

                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                  placeholder="Escribe algo aquí o pregunta..."
                  className="flex-1 bg-transparent border-none py-3 px-1 text-[13px] outline-none text-white resize-none mono font-bold max-h-40 overflow-y-auto"
                />
                
                <button 
                  onClick={() => handleSend()} 
                  disabled={loading || isRecording}
                  className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-90 transition-transform disabled:opacity-50"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SidebarAI;
