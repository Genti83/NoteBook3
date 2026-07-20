import { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { 
  onAuthStateChanged, 
  User, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  getRedirectResult,
  signInWithRedirect,
  setPersistence,
  browserLocalPersistence,
  indexedDBLocalPersistence
} from 'firebase/auth';
import { Capacitor } from '@capacitor/core';

export function useFirebase() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Explicitly set persistence for robustness
    const persistenceType = Capacitor.isNativePlatform() ? indexedDBLocalPersistence : browserLocalPersistence;
    setPersistence(auth, persistenceType).catch((err) => console.log("Persistence setup issue:", err));

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    getRedirectResult(auth).then((result) => {
      if (result && result.user) {
        setUser(result.user);
      }
    }).catch((err) => {
      console.error("Redirect auth error", err);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    
    if (Capacitor.isNativePlatform()) {
      await signInWithRedirect(auth, provider);
      return null;
    } else {
      try {
        const res = await signInWithPopup(auth, provider);
        return res.user;
      } catch (error: any) {
        if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
           // Fallback to redirect if popup fails
           await signInWithRedirect(auth, provider);
           return null;
        }
        throw error;
      }
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    const res = await signInWithEmailAndPassword(auth, email, password);
    return res.user;
  };

  const registerWithEmail = async (email: string, password: string) => {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    return res.user;
  };

  const logout = async () => {
    await firebaseSignOut(auth);
  };

  return {
    user,
    loading,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    logout
  };
}
