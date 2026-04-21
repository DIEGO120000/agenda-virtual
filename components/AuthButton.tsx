import React, { useState, useEffect } from 'react';
import { 
  auth, 
  googleProvider, 
  signInWithRedirect, 
  getRedirectResult, 
  signOut, 
  onAuthStateChanged 
} from '../src/lib/firebase';
import { User } from 'firebase/auth';

const AuthButton: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Sincronización del estado actual del usuario
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    // Capturar el usuario tras la redirección de Google
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) setUser(result.user);
      })
      .catch(console.error);

    return () => unsubscribe();
  }, []);

  const handleLogin = () => {
    console.log("Login iniciado con nueva API Key");
    signInWithRedirect(auth, googleProvider);
  };
  
  const handleLogout = () => signOut(auth).then(() => setUser(null));

  return (
    <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 1000, display: 'flex', gap: '8px' }}>
      {user ? (
        <div style={{ background: 'white', padding: '0.4rem 0.8rem', borderRadius: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', color: 'black', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>{user.displayName}</span>
          <button onClick={handleLogout} style={{ color: '#ef4444', fontSize: '9px', fontWeight: 'bold', border: 'none', background: 'none', cursor: 'pointer', padding: '0 4px' }}>SALIR</button>
        </div>
      ) : (
        <button 
          onClick={handleLogin}
          style={{ background: 'white', color: 'black', padding: '0.6rem 1.2rem', borderRadius: '1rem', fontWeight: '900', fontSize: '11px', border: '1px solid #ddd', cursor: 'pointer', boxShadow: '0 6px 15px rgba(0,0,0,0.1)', letterSpacing: '0.05em' }}
        >
          ENTRAR CON GOOGLE
        </button>
      )}
    </div>
  );
};

export default AuthButton;
