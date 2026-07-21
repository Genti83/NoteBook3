const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

// Use a regex to match all modal wrappers and replace items-center with items-start pt-12 pb-[30vh] md:items-center
code = code.replace(/className="fixed inset-0[^"]*flex items-center justify-center[^"]*"/g, (match) => {
    // Only apply to those that are strictly centered but might need scrolling on mobile
    if (match.includes('bg-black')) {
       return match.replace('items-center', 'items-start pt-12 pb-[40vh] md:items-center overflow-y-auto');
    }
    return match;
});

// For Cloud Modal specifically which is on line 2880:
code = code.replace(/className="fixed inset-0 z-\[100\] flex items-start pt-8 pb-32 md:py-8 md:items-center justify-center bg-black\/60 p-4 animate-in fade-in overflow-y-auto"/g, 'className="fixed inset-0 z-[100] flex items-start pt-12 pb-[40vh] md:items-center justify-center bg-black/60 p-4 animate-in fade-in overflow-y-auto"');

fs.writeFileSync('src/components/Notepad.tsx', code);
