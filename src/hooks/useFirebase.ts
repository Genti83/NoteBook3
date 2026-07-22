import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { signInWithCredential } from 'firebase/auth';
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
    
    let unsubscribe = () => {};
    
    // Forcojme ruajtjen e sesionit (LOCAL persistence)
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
         addDebugLog('Persistence set to browserLocal');
         unsubscribe = onAuthStateChanged(auth, (currentUser) => {
           setUser(currentUser);
           setLoading(false);
           addDebugLog('Auth state changed. User: ' + (currentUser ? currentUser.email : 'null'));
         }, (err) => {
           addDebugLog('Auth state error: ' + err.message);
           setLoading(false);
         });
      })
      .catch((err) => {
         addDebugLog("Persistence setup issue: " + err.message);
         // Fallback anyway
         unsubscribe = onAuthStateChanged(auth, (currentUser) => {
           setUser(currentUser);
           setLoading(false);
         });
      });

    // Handle any redirect results if they came back from a mobile redirect flow
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
      if (Capacitor.isNativePlatform()) {
          addDebugLog('Starting Native Google Login');
          try {
             const result = await FirebaseAuthentication.signInWithGoogle();
             if (result.credential?.idToken) {
                 const credential = GoogleAuthProvider.credential(result.credential.idToken);
                 const res = await signInWithCredential(auth, credential);
                 addDebugLog('Native login success: ' + res.user.email);
                 return res.user;
             } else {
                 throw new Error("No idToken returned from Google");
             }
          } catch(nativeErr: any) {
             addDebugLog('Native plugin failed (' + nativeErr.message + '), falling back to web flow...');
             const provider = new GoogleAuthProvider();
             provider.setCustomParameters({ prompt: 'select_account' });
             await signInWithRedirect(auth, provider);
             return null;
          }
      } else {
          addDebugLog('Starting Web Google Login (Redirect)');
          const provider = new GoogleAuthProvider();
          provider.setCustomParameters({ prompt: 'select_account' });
          
          try {
             // We use popup first, but if it fails (like auth/popup-blocked), we use redirect
             const res = await signInWithPopup(auth, provider);
             addDebugLog('Popup login success: ' + res.user.email);
             return res.user;
          } catch (popupErr: any) {
             if (popupErr.code === 'auth/popup-blocked' || popupErr.code === 'auth/popup-closed-by-user' || popupErr.message.includes('popup')) {
                 addDebugLog('Popup failed, trying redirect...');
                 await signInWithRedirect(auth, provider);
                 return null;
             }
             throw popupErr;
          }
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
