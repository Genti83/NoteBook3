const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const targetBtn = `<button type="button" onClick={loginWithGoogle} className={\`w-full py-3 flex items-center justify-center gap-2 font-medium rounded-xl transition-colors border \${
                      isDark ? "bg-zinc-950 border-zinc-700 text-zinc-300 hover:bg-zinc-800" : "bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-50"
                   }\`}>
                      Google
                   </button>`;

const replacementBtn = `{!Capacitor.isNativePlatform() && (
                   <button type="button" onClick={loginWithGoogle} className={\`w-full py-3 flex items-center justify-center gap-2 font-medium rounded-xl transition-colors border \${
                      isDark ? "bg-zinc-950 border-zinc-700 text-zinc-300 hover:bg-zinc-800" : "bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-50"
                   }\`}>
                      Google
                   </button>
                   )}`;

code = code.replace(targetBtn, replacementBtn);

fs.writeFileSync('src/components/Notepad.tsx', code);
