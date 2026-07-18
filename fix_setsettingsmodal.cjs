const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

code = code.replace(/setSettingsModal\\(false\\);\\n/g, '');
code = code.replace(/          setSettingsModal\\(false\\);\\n/g, '');

fs.writeFileSync('src/components/Notepad.tsx', code);
