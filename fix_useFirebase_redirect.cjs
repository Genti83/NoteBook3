const fs = require('fs');
let code = fs.readFileSync('src/hooks/useFirebase.ts', 'utf8');

const targetGoogleLogin = `  const loginWithGoogle = async () => {
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
  };`;

const replacementGoogleLogin = `  const loginWithGoogle = async () => {
    try {
      addDebugLog('Starting Google Login (Redirect Mode)');
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      
      // Duke përdorur gjithmonë signInWithRedirect siç u kërkua për të shmangur popup bllokimet dhe popup-closed-by-user
      await signInWithRedirect(auth, provider);
      return null;
    } catch(err: any) {
      addDebugLog('Google Login Exception: ' + err.message);
      throw err;
    }
  };`;

code = code.replace(targetGoogleLogin, replacementGoogleLogin);
fs.writeFileSync('src/hooks/useFirebase.ts', code);
