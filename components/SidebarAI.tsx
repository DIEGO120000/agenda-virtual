import React, { useState, useRef, useEffect } from 'react';
import { AppState } from '../types';
import { analizarComando, procesarConsulta } from '../services/groqService';
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
  
  // 3. Comandos de sistema locales
  if (/^(clear|limpiar|borrar)$/.test(txt)) {
    return "CLEAR_COMMAND";
  }
  
  // Si no coincide con palabras rápidas, devuelve null (pasa a la IA de Groq)
  return null;
};

const SidebarAI: React.FC<Props> = ({ state }) => {
  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<{ role: 'ai' | 'user' | 'error'; text: string }[]>([
    { role: 'ai', text: 'SISTEMA OPERATIVO A-AI v6.0 // MOTOR SEMÁNTICO GROQ (LLAMA 3.1) ACTIVO.' }
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
      let aiText = "";

      switch (resultado.tipo) {
        case 'modificacion': {
          const collectionName = resultado.objetivo === 'horario' ? 'horario' : 
                                resultado.objetivo === 'tareas' ? 'tareas' : 'notas';
          
          const collectionData = state[resultado.objetivo as keyof AppState] as any[];
          const target = collectionData.find((item: any) => 
            item.id === resultado.identificador || 
            (item.nombre || item.actividad || item.materia || item.contenido)?.toLowerCase().includes(String(resultado.identificador).toLowerCase())
          );

          if (target) {
            await updateMyData(collectionName, target.id, resultado.nuevos_datos);
            aiText = `ACTUALIZACIÓN EXITOSA // ${resultado.objetivo.toUpperCase()}: ${target.id} MODIFICADO.`;
          } else {
            aiText = `ERROR: NO SE ENCONTRÓ EL OBJETIVO "${resultado.identificador}" EN ${resultado.objetivo.toUpperCase()}.`;
          }
          break;
        }

        case 'consulta':
          aiText = await procesarConsulta(resultado.intencion, state.tareas);
          break;

        case 'horario':
          await saveData('horario', {
            actividad: resultado.materia?.toUpperCase() || "MATERIA",
            dia: resultado.dia,
            hora: resultado.hora,
            modalidad: resultado.modalidad || "Presencial",
            tipo: 'clase'
          });
          aiText = `MATERIA REGISTRADA: ${resultado.materia} // DÍA: ${resultado.dia} // HORA: ${resultado.hora}.`;
          break;

        case 'tarea': {
          const fechaIngreso = new Date();
          const parsedCulm = new Date(resultado.culminacion);
          const fechaCulminacion = isNaN(parsedCulm.getTime()) 
            ? new Date(new Date().setHours(23, 59, 59)) 
            : parsedCulm;
          
          const fechaRecomendado = new Date(fechaIngreso.getTime() + (fechaCulminacion.getTime() - fechaIngreso.getTime()) / 2);

          await saveData('tareas', {
            nombre: resultado.tarea,
            ingreso: fechaIngreso.toISOString(),
            recomendado: fechaRecomendado.toISOString(),
            culminacion: fechaCulminacion.toISOString(),
            criticidad: 5,
            estado: EstadoTarea.PENDIENTE,
            prioridad: PrioridadTarea.MEDIA
          });
          aiText = `TAREA ASIGNADA: ${resultado.tarea} // CULMINACIÓN: ${fechaCulminacion.toISOString()} // RECOMENDADO: ${fechaRecomendado.toISOString()}.`;
          break;
        }

        case 'nota':
          await saveData('notas', {
            contenido: resultado.texto || trimmedInput,
            timestamp: new Date().toISOString()
          });
          aiText = `NOTA CAPTURADA: "${resultado.texto || trimmedInput}" // ALMACENADA EN MEMORIA CENTRAL.`;
          break;

        case 'chat':
          aiText = resultado.respuesta;
          break;

        default:
          aiText = "COMANDO NO RECONOCIDO POR EL MOTOR SEMÁNTICO.";
      }

      const finalMsg = (resultado.tipo === 'consulta' || resultado.tipo === 'chat') ? aiText : `COMANDO EJECUTADO // ${aiText}`;
      setMessages(prev => [...prev, { role: 'ai', text: finalMsg }]);
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'error', text: `GROQ_ERR: FALLA EN LA INFERENCIA (${error.message})` }]);
    } finally {
      setLoading(false);
    }
  };

  const toggleMic = async () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        setMessages(prev => [...prev, { role: 'error', text: "ERROR: NAVEGADOR NO SOPORTA VOZ." }]);
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'es-DO';
      recognition.onstart = () => setIsRecording(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        handleSend(transcript);
      };
      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);
      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      setMessages(prev => [...prev, { role: 'error', text: "ERROR: MICRÓFONO NO ACCESIBLE." }]);
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
              <span className="mono font-bold text-[11px] tracking-[0.2em] text-blue-500 uppercase">A-AI TERMINAL v5.0</span>
              <span className="text-[8px] text-slate-500 font-black tracking-widest mt-1 flex items-center gap-1.5 uppercase">
                <span className={`w-1.5 h-1.5 rounded-full ${isRecording ? 'bg-red-500 animate-ping' : 'bg-green-500'}`}></span> 
                {isRecording ? 'LISTENING' : 'READY'}
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
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-5 py-4 rounded-2xl text-[13px] mono border shadow-lg ${
                    m.role === 'user' ? 'bg-blue-600 text-white border-blue-500' : 
                    m.role === 'error' ? 'bg-red-950/40 text-red-500 border-red-900/50' :
                    'bg-slate-900/80 text-blue-100 border-slate-700/50'
                  }`}>
                    <p className="leading-relaxed">{m.text}</p>
                  </div>
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
                  onClick={toggleMic}
                  className={`p-3 rounded-xl ${isRecording ? 'text-red-500 animate-pulse' : 'text-slate-500 hover:text-blue-400'}`}
                >
                  {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
                </button>

                <textarea
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                  placeholder="ORDEN SEMÁNTICA..."
                  className="flex-1 bg-transparent border-none py-3 px-1 text-[13px] outline-none text-white resize-none mono font-bold"
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
