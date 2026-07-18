const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const t = `<button onClick={handleForceChangePassword} className={\`flex items-center gap-3 px-4 py-3 text-sm text-left font-medium transition-colors hover:bg-accent-500 hover:text-white\`}>
                           <Lock className="w-4 h-4 shrink-0" /> {t('Ndrysho / Setup Kodin Password', 'Change / Setup Password Code')}
                       </button>
                       <button onClick={handleForceRemovePassword} className={\`flex items-center gap-3 px-4 py-3 text-sm text-left font-medium transition-colors hover:bg-accent-500 hover:text-white\`}>
                           <Unlock className="w-4 h-4 shrink-0" /> {t('Çaktivizo Kodin Password', 'Disable Password Code')}
                       </button>`;

const rep = `<div className="flex items-center justify-between px-4 py-3 hover:bg-accent-500/10 transition-colors">
                           <div className="flex items-center gap-3 text-sm font-medium">
                               <Lock className="w-4 h-4 shrink-0 text-accent-500" /> Password (ON / OFF)
                           </div>
                           <button onClick={() => {
                               if (localStorage.getItem('grid_notepad_pin')) {
                                   handleForceRemovePassword();
                               } else {
                                   handleForceChangePassword();
                               }
                           }} className={\`w-10 h-5 rounded-full relative transition-colors \${localStorage.getItem('grid_notepad_pin') ? 'bg-accent-500' : (isDark ? 'bg-zinc-700' : 'bg-zinc-300')}\`}>
                               <span className={\`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200 \${localStorage.getItem('grid_notepad_pin') ? 'translate-x-5' : ''}\`} />
                           </button>
                       </div>
                       <button onClick={handleForceChangePassword} className={\`flex items-center gap-3 px-4 py-3 text-sm text-left font-medium transition-colors hover:bg-accent-500 hover:text-white\`}>
                           <Lock className="w-4 h-4 shrink-0" /> {localStorage.getItem('grid_notepad_pin') ? 'CHANGE PASSWORD' : 'NEW PASSWORD'}
                       </button>`;

code = code.replace(t, rep);
fs.writeFileSync('src/components/Notepad.tsx', code);
