import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  googleProvider, 
  auth 
} from '../src/lib/firebase';
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
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl animate-in zoom-in duration-500">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">
            A-AI <span className="text-blue-500">Agenda</span>
          </h1>
          <p className="text-slate-500 text-xs font-bold mt-2 tracking-widest uppercase">
            Sistema Multi-Usuario Privado
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-[10px] font-bold p-3 rounded-xl mb-6 uppercase">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="email" 
              placeholder="CORREO ELECTRÓNICO" 
              className="w-full bg-slate-950 border border-slate-800 text-white pl-12 pr-4 py-4 rounded-2xl text-xs font-bold outline-none focus:border-blue-500 transition-colors"
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
              className="w-full bg-slate-950 border border-slate-800 text-white pl-12 pr-12 py-4 rounded-2xl text-xs font-bold outline-none focus:border-blue-500 transition-colors"
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
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black text-xs tracking-[0.2em] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-900/20 uppercase"
          >
            {loading ? "PROCESANDO..." : isRegister ? <><UserPlus size={18}/> Crear Cuenta</> : <><LogIn size={18}/> Iniciar Sesión</>}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-500">
            <span className="bg-slate-900 px-4">O continuar con</span>
          </div>
        </div>

        <button 
          onClick={handleGoogle}
          className="w-full bg-white text-slate-950 py-4 rounded-2xl font-black text-xs tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl uppercase"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          Google Access
        </button>

        <p className="text-center mt-8 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
          {isRegister ? "¿Ya tienes cuenta?" : "¿Nuevo en el sistema?"}{' '}
          <button 
            onClick={() => setIsRegister(!isRegister)}
            className="text-blue-500 hover:underline"
          >
            {isRegister ? "INICIA SESIÓN AQUÍ" : "REGÍSTRATE AHORA"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthCard;
