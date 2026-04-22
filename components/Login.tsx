
import React, { useState } from 'react';
import { loginWithEmail, registerUser } from '../services/auth';
import { Eye, EyeOff, Lock, Mail, Loader2, AlertCircle } from 'lucide-react';

interface LoginProps {
  onAuthSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Aseguramos que pasamos strings puros extraídos del estado
    const cleanEmail = email.trim();
    const cleanPassword = password;

    try {
      if (isLogin) {
        await loginWithEmail(cleanEmail, cleanPassword);
      } else {
        await registerUser(cleanEmail, cleanPassword);
      }
      onAuthSuccess();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/wrong-password') {
        setError('Contraseña incorrecta.');
      } else if (err.code === 'auth/user-not-found') {
        setError('Usuario no encontrado.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('El correo ya está en uso.');
      } else if (err.code === 'auth/weak-password') {
        setError('La contraseña es muy débil (mín. 6 caracteres).');
      } else if (err.code === 'auth/invalid-email') {
        setError('El formato del correo es inválido.');
      } else {
        setError(`Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 p-4 transition-colors">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        <div className="p-8">
          <header className="text-center mb-8">
            <h1 className="text-3xl font-black tracking-tighter text-gray-900 dark:text-white flex justify-center items-center gap-2">
              FORMATO A <span className="text-blue-600">CENTRAL</span>
            </h1>
            <p className="text-gray-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">
              {isLogin ? 'Acceso al Sistema' : 'Registro de Operaciones'}
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 ml-1">Email Corporativo</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                  placeholder="usuario@dominio.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 ml-1">Contraseña Encriptada</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold border border-red-100 dark:border-red-900/30 animate-in shake duration-300">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white py-3 rounded-xl font-black text-xs tracking-widest flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 uppercase mt-6"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : (isLogin ? 'Iniciar Conexión' : 'Generar Acceso')}
            </button>
          </form>

          <footer className="mt-8 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 hover:text-blue-600 transition-colors"
            >
              {isLogin ? '¿No tienes cuenta? Solicitar Registro' : '¿Ya tienes cuenta? Volver al Login'}
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Login;
