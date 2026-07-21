const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetModel = `model: 'gemini-2.0-flash',`;
const replacementModel = `model: 'gemini-2.5-flash',`;
code = code.replace(targetModel, replacementModel);

fs.writeFileSync('server.ts', code);
