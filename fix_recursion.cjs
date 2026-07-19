const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const target = `  const getActiveUid = () => {
     return localStorage.getItem('grid_notepad_custom_uid') || (auth.currentUser ? getActiveUid()! : null);
  };`;

const replacement = `  const getActiveUid = () => {
     return localStorage.getItem('grid_notepad_custom_uid') || (auth.currentUser ? auth.currentUser.uid : null);
  };`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/Notepad.tsx', code);
