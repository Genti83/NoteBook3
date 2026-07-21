const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const targetCatch = `          if (err.code === 'auth/operation-not-allowed') {
             msg = "Ky opsion nuk është i lejuar nga Firebase. Ju lutem përdorni Hyrjen me Google.";
          }`;

const replacementCatch = `          if (err.code === 'auth/operation-not-allowed') {
             msg = "Ky opsion nuk është i lejuar. Për ta rregulluar: Shko tek Firebase Console -> Authentication -> Sign-in method -> Aktivizo 'Email/Password'.";
          }`;

code = code.replace(targetCatch, replacementCatch);
fs.writeFileSync('src/components/Notepad.tsx', code);
