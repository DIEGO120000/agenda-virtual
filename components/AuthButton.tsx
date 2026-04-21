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

const AuthButton: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    getRedirectResult(auth).then((result) => {
      if (result?.user) setUser(result.user);
    }).catch(console.error);

    return () => unsubscribe();
  }, []);

  const handleLogin = () => signInWithRedirect(auth, provider);
  const handleLogout = () => signOut(auth);

  return (
    <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 1000 }}>
      {user ? (
        <div style={{ background: 'white', padding: '0.5rem 1rem', borderRadius: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', color: 'black', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{user.displayName}</span>
          <button onClick={handleLogout} style={{ color: 'red', fontSize: '10px', fontWeight: 'bold', border: 'none', background: 'none', cursor: 'pointer' }}>SALIR</button>
        </div>
      ) : (
        <button 
          onClick={handleLogin}
          style={{ background: 'white', color: 'black', padding: '0.75rem 1.5rem', borderRadius: '1rem', fontWeight: 'bold', border: '1px solid #ddd', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
        >
          ENTRAR CON GOOGLE
        </button>
      )}
    </div>
  );
};

export default AuthButton;
