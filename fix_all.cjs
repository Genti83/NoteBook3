const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

code = code.replace(/setSettingsModal\\(false\\);/g, '');
code = code.replace(/handleForgotPin/g, 'handleForgotPassword');
code = code.replace(/handleForceChangePin/g, 'handleForceChangePassword');
code = code.replace(/handleForceRemovePin/g, 'handleForceRemovePassword');

fs.writeFileSync('src/components/Notepad.tsx', code);
