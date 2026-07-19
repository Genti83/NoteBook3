const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const target = `  const loginWithGoogle = async () => {
      if (Capacitor.isNativePlatform()) {
         showToast("Hyrja me Google kërkon konfigurim të avancuar për APK. Ju lutem përdorni Email/Fjalëkalim për Native (Aktivizoni Emailin në Firebase Console -> Authentication).");
         return;
      }
      if (window.self !== window.top) {
         showToast("Kujdes: Hyrja me Google nuk funksionon brenda kornizës (iframe). Ju lutem hapeni aplikacionin në një dritare të re (New Tab) ose përdorni Email/Fjalëkalim.");
         return;
      }
      try {
         const provider = new GoogleAuthProvider();
         await signInWithPopup(auth, provider);`;

const replacement = `  const loginWithGoogle = async () => {
      if (Capacitor.isNativePlatform()) {
         showToast("Hyrja me Google kërkon konfigurim të avancuar për APK. Ju lutem përdorni Email/Fjalëkalim për Native (Aktivizoni Emailin në Firebase Console -> Authentication).");
         return;
      }
      if (window.self !== window.top) {
         showToast("Kujdes: Hyrja me Google nuk funksionon brenda kornizës (iframe). Ju lutem hapeni aplikacionin në një dritare të re (New Tab) ose përdorni Email/Fjalëkalim.");
         return;
      }
      try {
         const provider = new GoogleAuthProvider();
         if (!auth) throw new Error("Auth is not initialized");
         await signInWithPopup(auth, provider);`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/Notepad.tsx', code);
