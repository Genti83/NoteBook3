const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const targetEmailLogin = `              await hookEmailLogin(email, password);
              showToast("Hyrje e suksesshme! Sinkronizimi Cloud u aktivizua.");
          }
          
          localStorage.setItem('grid_notepad_saved_email', email);`;

const replacementEmailLogin = `              await hookEmailLogin(email, password);
              showToast("Hyrje e suksesshme! Sinkronizimi Cloud u aktivizua.");
              // Auto-restore if local docs are empty (e.g. new phone)
              if (documents.length === 0 || (documents.length === 1 && documents[0].rows.length === 0)) {
                  setTimeout(() => handleFullCloudRestore(), 1000);
              }
          }
          
          localStorage.setItem('grid_notepad_saved_email', email);`;

if (code.includes(targetEmailLogin)) {
    code = code.replace(targetEmailLogin, replacementEmailLogin);
}

const targetGoogleLogin = `         showToast("Hyrje e suksesshme me Google! Sinkronizimi Cloud u aktivizua.");
         setTimeout(() => forceCloudBackup(), 1500);`;

const replacementGoogleLogin = `         showToast("Hyrje e suksesshme me Google! Sinkronizimi Cloud u aktivizua.");
         if (documents.length === 0 || (documents.length === 1 && documents[0].rows.length === 0)) {
            setTimeout(() => handleFullCloudRestore(), 1000);
         } else {
            setTimeout(() => forceCloudBackup(), 1500);
         }`;

if (code.includes(targetGoogleLogin)) {
    code = code.replace(targetGoogleLogin, replacementGoogleLogin);
}

fs.writeFileSync('src/components/Notepad.tsx', code);
console.log("Auto-restore on login added!");
