const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const targetGoogleBtn = `                   <button type="button" onClick={loginWithGoogle} className={\`w-full py-3 flex items-center justify-center gap-2 font-medium rounded-xl transition-colors border \${
                      isDark ? "bg-zinc-950 border-zinc-700 text-zinc-300 hover:bg-zinc-800" : "bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-50"
                   }\`}>
                      Google
                   </button>`;

const replacementGoogleBtn = `                   {!Capacitor.isNativePlatform() ? (
                     <button type="button" onClick={loginWithGoogle} className={\`w-full py-3 flex items-center justify-center gap-2 font-medium rounded-xl transition-colors border \${
                        isDark ? "bg-zinc-950 border-zinc-700 text-zinc-300 hover:bg-zinc-800" : "bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-50"
                     }\`}>
                        Google
                     </button>
                   ) : (
                     <div className="text-center text-xs text-orange-500 font-medium p-2 bg-orange-500/10 rounded-lg">
                        ⚠️ Për siguri dhe funksionim të plotë në Aplikacion, ju lutemi përdorni llogari me Email. Hyrja me Google ofrohet vetëm në web.
                     </div>
                   )}`;

code = code.replace(targetGoogleBtn, replacementGoogleBtn);
fs.writeFileSync('src/components/Notepad.tsx', code);
