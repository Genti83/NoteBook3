const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const targetStr = `         } else {
             showToast("Gabim gjatë hyrjes me Google: " + err.message);
         }`;

const replacementStr = `         } else {
             alert("Gabim gjatë hyrjes me Google:\\n" + err.message + "\\n\\nNëse jeni në APK/Android dhe Google Sign-in nuk funksionon, kyçuni me Email/Password.");
         }`;

if (code.includes(targetStr)) {
    code = code.replace(targetStr, replacementStr);
    fs.writeFileSync('src/components/Notepad.tsx', code);
    console.log("Updated google error fallback!");
}
