const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

code = code.replace(/className="fixed inset-0 z-50 flex items-center justify-center bg-black\/50 p-4 animate-in fade-in"/g, 'className="fixed inset-0 z-[100] flex items-start pt-12 pb-[30vh] md:items-center justify-center bg-black/60 p-4 animate-in fade-in overflow-y-auto"');
code = code.replace(/className="fixed inset-0 z-\[60\] flex items-center justify-center bg-black\/60 p-4 animate-in fade-in"/g, 'className="fixed inset-0 z-[100] flex items-start pt-12 pb-[30vh] md:items-center justify-center bg-black/60 p-4 animate-in fade-in overflow-y-auto"');
code = code.replace(/className="fixed inset-0 z-50 flex items-center justify-center bg-black\/60 p-4 animate-in fade-in"/g, 'className="fixed inset-0 z-[100] flex items-start pt-12 pb-[30vh] md:items-center justify-center bg-black/60 p-4 animate-in fade-in overflow-y-auto"');
code = code.replace(/className="fixed inset-0 z-\[90\] flex items-start pt-8 pb-32 md:py-8 md:items-center justify-center bg-black\/60 p-4 animate-in fade-in overflow-y-auto"/g, 'className="fixed inset-0 z-[100] flex items-start pt-12 pb-[30vh] md:items-center justify-center bg-black/60 p-4 animate-in fade-in overflow-y-auto"');

fs.writeFileSync('src/components/Notepad.tsx', code);
