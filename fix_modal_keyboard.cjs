const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

// Replace the wrapper classes for modals
code = code.replace(/items-start pt-20 md:pt-0 md:items-center justify-center bg-black\/60 p-4 animate-in fade-in overflow-y-auto/g, 'items-start pt-8 pb-32 md:py-8 md:items-center justify-center bg-black/60 p-4 animate-in fade-in overflow-y-auto');

fs.writeFileSync('src/components/Notepad.tsx', code);
