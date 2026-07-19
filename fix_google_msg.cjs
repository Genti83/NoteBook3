const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const target = `  const loginWithGoogle = async () => {
      try {
         const provider = new GoogleAuthProvider();
         if (!auth) throw new Error("Auth is not initialized");
         await signInWithRedirect(auth, provider);
      } catch (err: any) {
         showToast("Gabim gjatë hyrjes me Google: " + err.message);
      }
  };`;

const replacement = `  const loginWithGoogle = async () => {
      showToast("Kujdes: Hyrja me Google kërkon aktivizim manual në Firebase Console (Authentication -> Sign-in method -> Google). Ju lutemi përdorni Email/Fjalëkalim pasi është konfiguruar të funksionojë automatikisht pa aktivizim!");
      // We will still try in case they activated it:
      try {
         const provider = new GoogleAuthProvider();
         await signInWithRedirect(auth, provider);
      } catch (err: any) {
         console.error("Google Auth error", err);
      }
  };`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/Notepad.tsx', code);
