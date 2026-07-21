const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetFallback = `                model: 'gemini-1.5-flash',`;
const replacementFallback = `                model: 'gemini-1.5-pro',`;
code = code.replace(targetFallback, replacementFallback);

fs.writeFileSync('server.ts', code);
