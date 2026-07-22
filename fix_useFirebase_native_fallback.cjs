const fs = require('fs');
let code = fs.readFileSync('src/hooks/useFirebase.ts', 'utf8');

const targetNative = `      if (Capacitor.isNativePlatform()) {
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
      }`;

const replacementNative = `      if (Capacitor.isNativePlatform()) {
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
      }`;

if (code.includes('if (Capacitor.isNativePlatform()) {')) {
    code = code.replace(targetNative, replacementNative);
    fs.writeFileSync('src/hooks/useFirebase.ts', code);
    console.log("Native Google fallback updated!");
}
