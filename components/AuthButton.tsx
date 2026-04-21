import React, { useState, useEffect } from 'react';
import { 
  auth, 
  provider, 
  signInWithPopup, 
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
    return () => unsubscribe();
  }, []);

  const handleLogin = () => {
    signInWithPopup(auth, provider)
      .then((result) => setUser(result.user))
      .catch(console.error);
  };

  const handleLogout = () => {
    signOut(auth).then(() => setUser(null)).catch(console.error);
  };

  return (
    <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 1000 }}>
      {user ? (
        <div style={{ background: 'white', padding: '0.5rem 1rem', borderRadius: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', color: 'black', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src={user.photoURL || ''} alt="" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
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
