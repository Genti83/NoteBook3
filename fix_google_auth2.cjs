const fs = require('fs');
let code = fs.readFileSync('src/hooks/useFirebase.ts', 'utf8');

const targetGoogleLogin = `  const loginWithGoogle = async () => {
    try {
      addDebugLog('Starting Google Login');
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      
      try {
        addDebugLog('Trying popup login...');
        const res = await signInWithPopup(auth, provider);
        addDebugLog('Popup login success: ' + res.user.email);
        return res.user;
      } catch (error: any) {
        addDebugLog('Popup login failed: ' + error.message + ' (code: ' + error.code + ')');
        // Always try redirect as fallback, especially on native where popup might fail
        addDebugLog('Falling back to redirect');
        await signInWithRedirect(auth, provider);
        return null;
      }
    } catch(err: any) {
      addDebugLog('Google Login Exception: ' + err.message);
      throw err;
    }
  };`;

const replacementGoogleLogin = `  const loginWithGoogle = async () => {
    try {
      addDebugLog('Starting Google Login (Popup Only)');
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      
      const res = await signInWithPopup(auth, provider);
      addDebugLog('Popup login success: ' + res.user.email);
      return res.user;
    } catch(err: any) {
      addDebugLog('Google Login Exception: ' + err.message);
      throw err;
    }
  };`;

code = code.replace(targetGoogleLogin, replacementGoogleLogin);
fs.writeFileSync('src/hooks/useFirebase.ts', code);
