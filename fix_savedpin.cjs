const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

code = code.replace(/savedPin/g, 'savedPassword');

fs.writeFileSync('src/components/Notepad.tsx', code);
