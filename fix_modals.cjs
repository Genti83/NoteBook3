const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

// Replace standard flex centers with a bit of padding top to push it up
code = code.replace(/<div className="fixed inset-0 z-\[90\] flex items-center justify-center bg-black\/60 p-4 animate-in fade-in">/g, '<div className="fixed inset-0 z-[90] flex items-start pt-20 md:pt-0 md:items-center justify-center bg-black/60 p-4 animate-in fade-in overflow-y-auto">');

// For the modal contents, add mb-20 to ensure scrolling clears the keyboard
code = code.replace(/<div className={`max-w-md w-full p-6/g, '<div className={`max-w-md w-full p-6 mb-20 md:mb-0');
code = code.replace(/<div className={`max-w-4xl w-full h-\[80vh\]/g, '<div className={`max-w-4xl w-full h-[80vh] mb-20 md:mb-0');

fs.writeFileSync('src/components/Notepad.tsx', code);
