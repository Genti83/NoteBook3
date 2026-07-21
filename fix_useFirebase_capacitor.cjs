const fs = require('fs');
let code = fs.readFileSync('src/hooks/useFirebase.ts', 'utf8');

const targetImports = `import { Capacitor } from '@capacitor/core';`;
const replacementImports = `import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { signInWithCredential } from 'firebase/auth';`;

code = code.replace(targetImports, replacementImports);

const targetGoogleLogin = `  const loginWithGoogle = async () => {
    try {
      addDebugLog('Starting Google Login (Redirect)');
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || Capacitor.isNativePlatform();
      
      if (isMobile) {
         addDebugLog('Mobile detected, using signInWithRedirect');
         await signInWithRedirect(auth, provider);
         return null;
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
  };`;

const replacementGoogleLogin = `  const loginWithGoogle = async () => {
    try {
      addDebugLog('Starting Google Login (Native & Web)');
      
      if (Capacitor.isNativePlatform()) {
         addDebugLog('Native Platform detected, using Capacitor Firebase Auth');
         const result = await FirebaseAuthentication.signInWithGoogle();
         const credential = GoogleAuthProvider.credential(result.credential?.idToken);
         const res = await signInWithCredential(auth, credential);
         addDebugLog('Native login success: ' + res.user.email);
         return res.user;
      } else {
         addDebugLog('Web Platform detected, using signInWithPopup');
         const provider = new GoogleAuthProvider();
         provider.setCustomParameters({ prompt: 'select_account' });
         const res = await signInWithPopup(auth, provider);
         addDebugLog('Web login success: ' + res.user.email);
         return res.user;
      }
    } catch(err: any) {
      addDebugLog('Google Login Exception: ' + err.message);
      throw err;
    }
  };`;

code = code.replace(targetGoogleLogin, replacementGoogleLogin);
fs.writeFileSync('src/hooks/useFirebase.ts', code);
