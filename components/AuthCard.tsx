import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  auth,
  db
} from '../src/lib/firebase';
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { Eye, EyeOff, Mail, Lock, LogIn, UserPlus } from 'lucide-react';

const AuthCard: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isRegister) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", userCredential.user.uid), {
          email: email,
          createdAt: serverTimestamp(),
          itlaStatus: "ActiveMember"
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-10 shadow-2xl animate-in zoom-in duration-500">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
            A-AI <span className="text-blue-500">Agenda</span>
          </h1>
          <p className="text-slate-500 text-[10px] font-black mt-3 tracking-[0.3em] uppercase border-y border-slate-800 py-2 inline-block">
            SISTEMA PRIVADO DE GESTIÓN // ITLA v7.0
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-[10px] font-bold p-4 rounded-2xl mb-8 uppercase text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-6">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="email" 
              placeholder="CORREO ELECTRÓNICO" 
              className="w-full bg-slate-950 border border-slate-800 text-white pl-12 pr-4 py-5 rounded-2xl text-[11px] font-black outline-none focus:border-blue-500 transition-all placeholder:text-slate-700 uppercase"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="CONTRASEÑA" 
              className="w-full bg-slate-950 border border-slate-800 text-white pl-12 pr-12 py-5 rounded-2xl text-[11px] font-black outline-none focus:border-blue-500 transition-all placeholder:text-slate-700"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full py-5 rounded-2xl font-black text-xs tracking-[0.3em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl uppercase ${
              isRegister ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/20' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-900/20'
            }`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : isRegister ? (
              <><UserPlus size={18}/> CREAR CUENTA NUEVA</>
            ) : (
              <><LogIn size={18}/> ACCEDER AL SISTEMA</>
            )}
          </button>
        </form>

        <p className="text-center mt-10 text-slate-500 text-[10px] font-black uppercase tracking-widest">
          {isRegister ? "¿YA TIENES UNA CUENTA?" : "¿ERES NUEVO EN EL SISTEMA?"}{' '}
          <button 
            onClick={() => setIsRegister(!isRegister)}
            className="text-blue-500 hover:text-blue-400 transition-colors font-black"
          >
            {isRegister ? "ENTRA AQUÍ" : "REGÍSTRATE GRATIS"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthCard;
