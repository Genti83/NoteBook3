const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');
code = code.replace("import { Trash2, ", "import { Github, Trash2, ");
fs.writeFileSync('src/components/Notepad.tsx', code);
