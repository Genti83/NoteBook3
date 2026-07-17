const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const target = `                   <p className="text-center text-sm mt-2 text-zinc-500">
                      {isSignUp ? 'Keni një llogari? ' : 'Nuk keni llogari? '}
                      <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-accent-500 font-bold hover:underline">
                         {isSignUp ? 'Hyr këtu' : 'Krijo një'}
                      </button>
                   </p>`;

const replacement = `                   <p className="text-center text-xs mt-3 text-zinc-500 font-medium bg-zinc-500/10 p-3 rounded-lg">
                      {isSignUp ? 'Tashmë i keni dhënë informacionet dhe keni një llogari aktive në Firebase? ' : 'Për të pasur akses në sistemin Cloud (Firebase) fillimisht duhet të regjistroheni për të aktivizuar hapësirën tuaj personale. '}
                      <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-accent-500 font-bold hover:underline ml-1">
                         {isSignUp ? 'Hyr këtu (Login)' : 'Krijo llogari (Register)'}
                      </button>
                   </p>`;

code = code.replace(target, replacement);

fs.writeFileSync('src/components/Notepad.tsx', code);
