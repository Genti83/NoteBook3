const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

code = code.replace(/stroke-width/g, 'strokeWidth');
code = code.replace(/stroke-linecap/g, 'strokeLinecap');
code = code.replace(/stroke-linejoin/g, 'strokeLinejoin');

fs.writeFileSync('src/components/Notepad.tsx', code);
