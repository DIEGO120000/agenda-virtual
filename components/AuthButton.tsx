import React, { useState, useEffect } from 'react';
import { 
  auth, 
  provider, 
  signInWithRedirect, 
  getRedirectResult, 
  signOut, 
  onAuthStateChanged 
} from '../src/lib/firebase';
import { User } from 'firebase/auth';
import { LogOut, Loader2 } from 'lucide-react';

const AuthButton: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Escuchar cambios de estado de autenticación
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Capturar el resultado del redireccionamiento cuando la página carga de nuevo
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          setUser(result.user);
        }
      })
      .catch((error) => {
        console.error("Redirect Login Error:", error);
        setLoading(false);
      });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await signInWithRedirect(auth, provider);
    } catch (error: any) {
      console.error("Login Initiating Error:", error);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      await signOut(auth);
    } catch (error: any) {
      console.error("Logout Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed top-4 right-4 z-[1000] flex items-center gap-3">
      {user ? (
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-1.5 pr-4 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 animate-in fade-in slide-in-from-top-4 duration-500">
          <img 
            src={user?.photoURL || ''} 
            alt={user?.displayName || ''} 
            className="w-10 h-10 rounded-xl border-2 border-blue-500/20 shadow-sm"
          />
          <div className="flex flex-col">
            <span className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-tighter truncate max-w-[120px]">
              {user?.displayName}
            </span>
            <button 
              onClick={handleLogout}
              disabled={loading}
              className="text-[9px] font-bold text-red-500 hover:text-red-600 transition-colors flex items-center gap-1 uppercase tracking-widest disabled:opacity-50"
            >
              {loading ? <Loader2 size={10} className="animate-spin" /> : <LogOut size={10} />} SALIR
            </button>
          </div>
        </div>
      ) : (
        <button 
          onClick={handleLogin}
          disabled={loading}
          className="flex items-center gap-3 bg-white text-gray-900 px-5 py-2.5 rounded-2xl font-black text-[11px] tracking-widest shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] hover:shadow-none hover:bg-gray-50 transition-all active:scale-95 border border-gray-200 uppercase disabled:opacity-70"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin text-blue-600" />
          ) : (
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4" />
          )}
          {loading ? "CONECTANDO..." : "ACCEDER CON GOOGLE"}
        </button>
      )}
    </div>
  );
};

export default AuthButton;
