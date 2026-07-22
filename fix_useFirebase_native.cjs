const fs = require('fs');
let code = fs.readFileSync('src/hooks/useFirebase.ts', 'utf8');

if (!code.includes('@capacitor-firebase/authentication')) {
    code = "import { FirebaseAuthentication } from '@capacitor-firebase/authentication';\n" + 
           "import { signInWithCredential } from 'firebase/auth';\n" + code;
}

const targetGoogleLogin = `  const loginWithGoogle = async () => {
    try {
      addDebugLog('Starting Google Login (Popup)');
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      
      // Provon popup, nese deshton (p.sh. bllokohet), provon redirect
      try {
          const res = await signInWithPopup(auth, provider);
          addDebugLog('Popup login success: ' + res.user.email);
          return res.user;
      } catch (popupErr: any) {
          addDebugLog('Popup blocked or failed: ' + popupErr.message + '. Falling back to redirect.');
          await signInWithRedirect(auth, provider);
          return null; // redirect will reload page
      }
    } catch(err: any) {
      addDebugLog('Google Login Exception: ' + err.message);
      throw err;
    }
  };`;

const replacementGoogleLogin = `  const loginWithGoogle = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
          addDebugLog('Starting Native Google Login');
          const result = await FirebaseAuthentication.signInWithGoogle();
          if (result.credential?.idToken) {
              const credential = GoogleAuthProvider.credential(result.credential.idToken);
              const res = await signInWithCredential(auth, credential);
              addDebugLog('Native login success: ' + res.user.email);
              return res.user;
          } else {
              throw new Error("No idToken returned from Google");
          }
      } else {
          addDebugLog('Starting Web Google Login (Popup)');
          const provider = new GoogleAuthProvider();
          provider.setCustomParameters({ prompt: 'select_account' });
          
          try {
              const res = await signInWithPopup(auth, provider);
              addDebugLog('Popup login success: ' + res.user.email);
              return res.user;
          } catch (popupErr: any) {
              addDebugLog('Popup blocked or failed: ' + popupErr.message + '. Falling back to redirect.');
              await signInWithRedirect(auth, provider);
              return null;
          }
      }
    } catch(err: any) {
      addDebugLog('Google Login Exception: ' + err.message);
      throw err;
    }
  };`;

code = code.replace(targetGoogleLogin, replacementGoogleLogin);
fs.writeFileSync('src/hooks/useFirebase.ts', code);
