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

// Helper to log errors
export const addDebugLog = (msg: string) => {
  try {
    const logs = JSON.parse(localStorage.getItem('grid_notepad_debug_logs') || '[]');
    logs.unshift(`[${new Date().toISOString()}] ${msg}`);
    if (logs.length > 50) logs.length = 50;
    localStorage.setItem('grid_notepad_debug_logs', JSON.stringify(logs));
    window.dispatchEvent(new Event('debug-log-updated'));
  } catch(e) {}
};

export function useFirebase() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    addDebugLog('useFirebase Init - Platform: ' + Capacitor.getPlatform());
    // Explicitly set persistence for robustness
    const persistenceType = Capacitor.isNativePlatform() ? indexedDBLocalPersistence : browserLocalPersistence;
    setPersistence(auth, persistenceType)
      .then(() => addDebugLog('Persistence set to ' + (Capacitor.isNativePlatform() ? 'indexedDB' : 'browserLocal')))
      .catch((err) => addDebugLog("Persistence setup issue: " + err.message));

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      addDebugLog('Auth state changed. User: ' + (currentUser ? currentUser.email : 'null'));
    }, (err) => {
      addDebugLog('Auth state error: ' + err.message);
    });

    getRedirectResult(auth).then((result) => {
      if (result && result.user) {
        addDebugLog('Redirect auth success: ' + result.user.email);
        setUser(result.user);
      }
    }).catch((err) => {
      addDebugLog("Redirect auth error: " + err.message);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      addDebugLog('Starting Google Login');
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || Capacitor.isNativePlatform();
      
      if (isMobile) {
        addDebugLog('Mobile detected, using signInWithRedirect');
        await signInWithRedirect(auth, provider);
        return null; // Will be handled by getRedirectResult on page reload
      } else {
        addDebugLog('Desktop detected, using signInWithPopup');
        const res = await signInWithPopup(auth, provider);
        addDebugLog('Popup login success: ' + res.user.email);
        return res.user;
      }
    } catch(err: any) {
      addDebugLog('Google Login Exception: ' + err.message);
      throw err;
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    try {
      addDebugLog('Starting Email Login for: ' + email);
      const res = await signInWithEmailAndPassword(auth, email, password);
      addDebugLog('Email Login Success: ' + res.user.uid);
      return res.user;
    } catch(err: any) {
      addDebugLog('Email Login Failed: ' + err.message + ' (code: ' + err.code + ')');
      throw err;
    }
  };

  const registerWithEmail = async (email: string, password: string) => {
    try {
      addDebugLog('Starting Email Register for: ' + email);
      const res = await createUserWithEmailAndPassword(auth, email, password);
      addDebugLog('Email Register Success: ' + res.user.uid);
      return res.user;
    } catch(err: any) {
      addDebugLog('Email Register Failed: ' + err.message + ' (code: ' + err.code + ')');
      throw err;
    }
  };

  const logout = async () => {
    addDebugLog('Logging out');
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
