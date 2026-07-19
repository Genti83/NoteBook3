const fs = require('fs');
let code = fs.readFileSync('src/lib/firebase.ts', 'utf8');
if (!code.includes('appVerificationDisabledForTesting')) {
    code += `\nauth.settings.appVerificationDisabledForTesting = true;\n`;
    fs.writeFileSync('src/lib/firebase.ts', code);
}
