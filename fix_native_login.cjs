const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const target = `  const loginWithGoogle = async () => {
      if (window.self !== window.top) {
         showToast("Kujdes: Hyrja me Google nuk funksionon brenda kornizës (iframe). Ju lutem hapeni aplikacionin në një dritare të re (New Tab) ose përdorni Email/Fjalëkalim.");
         return;
      }`;

const replacement = `  const loginWithGoogle = async () => {
      if (Capacitor.isNativePlatform()) {
         showToast("Hyrja me Google kërkon konfigurim të avancuar për APK. Ju lutem përdorni Email/Fjalëkalim për Native (Aktivizoni Emailin në Firebase Console -> Authentication).");
         return;
      }
      if (window.self !== window.top) {
         showToast("Kujdes: Hyrja me Google nuk funksionon brenda kornizës (iframe). Ju lutem hapeni aplikacionin në një dritare të re (New Tab) ose përdorni Email/Fjalëkalim.");
         return;
      }`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/Notepad.tsx', code);
