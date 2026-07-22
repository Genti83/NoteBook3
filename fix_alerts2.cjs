const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const targetInUse = `          if (err.code === 'auth/email-already-in-use') {
             setIsSignUp(false);
             showToast("Kjo llogari ekziston tashmë! Provo të hysh (Login) ose përdor Google.");
             return;
          }`;
          
const replacementInUse = `          if (err.code === 'auth/email-already-in-use') {
             setIsSignUp(false);
             alert("Kjo llogari ekziston tashmë! Paneli kaloi automatikisht tek 'Login' (Hyrje). Ju lutem vendosni fjalëkalimin tuaj për t'u kyçur.");
             return;
          }`;

if (code.includes(targetInUse)) {
    code = code.replace(targetInUse, replacementInUse);
    fs.writeFileSync('src/components/Notepad.tsx', code);
    console.log("Added alert for email-in-use!");
}
