const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const targetCatch = `          if (err.code === 'auth/email-already-in-use') {
             setIsSignUp(false);
             showToast("Llogaria ekziston. Po kalojmë tek Hyrja. Klikoni Hyr përsëri.");
             return;
          }
          if (err.code === 'auth/weak-password') msg = "Fjalëkalimi duhet të ketë të paktën 6 karaktere.";
          if (err.code === 'auth/invalid-email') msg = "Formati i emailit është i pasaktë.";
          if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') msg = "Emaili ose fjalëkalimi është i gabuar.";
          
          showToast(msg);`;

const replacementCatch = `          if (err.code === 'auth/email-already-in-use') {
             setIsSignUp(false);
             showToast("Kjo llogari ekziston tashmë! Provo të hysh (Login) ose përdor Google.");
             return;
          }
          if (err.code === 'auth/weak-password') msg = "Fjalëkalimi duhet të ketë të paktën 6 karaktere.";
          if (err.code === 'auth/invalid-email') msg = "Formati i emailit është i pasaktë.";
          if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
             msg = "Kredenciale të gabuara! Nëse jeni regjistruar me Google, klikoni butonin Google.";
          }
          if (err.code === 'auth/operation-not-allowed') {
             msg = "Ky opsion nuk është i lejuar. Nëse përdorni Google, klikoni butonin Google.";
          }
          
          showToast(msg);`;

code = code.replace(targetCatch, replacementCatch);
fs.writeFileSync('src/components/Notepad.tsx', code);
