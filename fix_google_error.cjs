const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const targetGoogleLogin = `         showToast("Gabim gjatë hyrjes me Google: " + err.message);`;
const replacementGoogleLogin = `         if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
             showToast("Dritarja e hyrjes u mbyll ose u bllokua. Nëse jeni në aplikacion (APK), ju lutem aktivizoni Email/Password në Firebase sepse Google Sign-In kërkon shfletues.");
         } else {
             showToast("Gabim gjatë hyrjes me Google: " + err.message);
         }`;

code = code.replace(targetGoogleLogin, replacementGoogleLogin);
fs.writeFileSync('src/components/Notepad.tsx', code);
