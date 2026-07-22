const fs = require('fs');
let code = fs.readFileSync('src/hooks/useFirebase.ts', 'utf8');

const targetGoogleLogin = `      } else {
          addDebugLog('Starting Web Google Login (Popup)');
          const provider = new GoogleAuthProvider();
          provider.setCustomParameters({ prompt: 'select_account' });
          
          // Vetem Popup, pa Redirect fallback pasi shkakton bllokim ne handler
          const res = await signInWithPopup(auth, provider);
          addDebugLog('Popup login success: ' + res.user.email);
          return res.user;
      }`;

const replacementGoogleLogin = `      } else {
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
      }`;

if (code.includes(targetGoogleLogin)) {
    code = code.replace(targetGoogleLogin, replacementGoogleLogin);
    fs.writeFileSync('src/hooks/useFirebase.ts', code);
    console.log("Google Login fallback fixed!");
}
