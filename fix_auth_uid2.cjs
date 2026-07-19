const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const target1 = `where('userId', '==', getActiveUid()!)`;
const replacement1 = `where('userId', '==', localStorage.getItem('grid_notepad_custom_uid') || u.uid)`;

code = code.replace(target1, replacement1);

const target2 = `userId: getActiveUid()!`;
const replacement2 = `userId: localStorage.getItem('grid_notepad_custom_uid') || u.uid`;
code = code.replace(target2, replacement2);

fs.writeFileSync('src/components/Notepad.tsx', code);
