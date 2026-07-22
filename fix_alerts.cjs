const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const targetEmailError = `          if (err.code === 'auth/operation-not-allowed') {
             msg = "Email login is disabled in Firebase! Ju lutem aktivizoni 'Email/Password' tek Firebase Console -> Authentication -> Sign-in method.";
          }`;
          
const replacementEmailError = `          if (err.code === 'auth/operation-not-allowed') {
             msg = "Kujdes: Hyrja me Email/Password nuk është e aktivizuar!\\n\\nJu lutem shkoni tek Firebase Console:\\n1. Authentication\\n2. Sign-in method\\n3. Aktivizoni 'Email/Password'";
             alert(msg);
             return;
          }`;

if (code.includes(targetEmailError)) {
    code = code.replace(targetEmailError, replacementEmailError);
} else {
    console.log("Could not find email error target.");
}

const targetGoogleError = `         } else if (err.code === 'auth/operation-not-allowed') {
             showToast("Hyrja me Google është e çaktivizuar në server! Provoni Email.");`;
             
const replacementGoogleError = `         } else if (err.code === 'auth/operation-not-allowed') {
             alert("Kujdes: Hyrja me Google nuk është e aktivizuar në Firebase!\\n\\nJu lutem shkoni tek Firebase Console -> Authentication -> Sign-in method dhe aktivizoni 'Google'.");`;

if (code.includes(targetGoogleError)) {
    code = code.replace(targetGoogleError, replacementGoogleError);
}

fs.writeFileSync('src/components/Notepad.tsx', code);
console.log("Added alerts for operation-not-allowed!");
