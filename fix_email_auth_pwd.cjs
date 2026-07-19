const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const tgt = `localStorage.setItem('grid_notepad_saved_email', email);`;
const rep = `localStorage.setItem('grid_notepad_saved_email', email);
          localStorage.setItem('grid_notepad_saved_pwd', password);`;

code = code.replace(tgt, rep);

fs.writeFileSync('src/components/Notepad.tsx', code);
