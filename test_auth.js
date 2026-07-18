const code = require('fs').readFileSync('src/components/Notepad.tsx', 'utf8');
console.log(code.includes('getRedirectResult(auth)'));
