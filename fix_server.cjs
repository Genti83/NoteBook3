const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetGemini = `          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',`;

const replacementGemini = `          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',`;

code = code.replace("model: 'gemini-2.5-flash',", "model: 'gemini-2.0-flash',");
fs.writeFileSync('server.ts', code);
console.log("Server.ts updated!");
