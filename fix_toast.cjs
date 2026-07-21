const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

code = code.replace(/className="absolute bottom-6 left-1\/2 transform -translate-x-1\/2 bg-accent-600 text-white px-4 py-2 rounded-lg shadow-lg font-medium text-sm animate-in fade-in slide-in-from-bottom-4 z-\[100\]"/g, 'className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-accent-600 text-white px-4 py-2 rounded-lg shadow-lg font-medium text-sm animate-in fade-in slide-in-from-top-4 z-[300]"');

fs.writeFileSync('src/components/Notepad.tsx', code);
