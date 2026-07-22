const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const targetUrl = `const baseUrl = Capacitor.isNativePlatform() ? 'https://ais-pre-dva77knoqcna5xt4l6qx7i-4359193177.europe-west1.run.app' : '';`;
const replacementUrl = `// Kemi vendosur URL e Dev per te lejuar testimin e menjehershem ne APK.
       // Pasi te besh Deploy/Share nga AI Studio, mund ta ndryshosh tek URL pre.
       const baseUrl = Capacitor.isNativePlatform() ? 'https://ais-dev-dva77knoqcna5xt4l6qx7i-4359193177.europe-west1.run.app' : '';`;

if (code.includes(targetUrl)) {
    code = code.replace(targetUrl, replacementUrl);
    fs.writeFileSync('src/components/Notepad.tsx', code);
    console.log("baseUrl fixed for dev!");
}
