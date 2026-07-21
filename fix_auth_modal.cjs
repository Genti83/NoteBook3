const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const targetModalInfo = `                   <p className="text-center text-sm text-zinc-500 mb-6">
                      Për të pasur akses në sistemin Cloud (Firebase) fillimisht duhet të regjistroheni për të aktivizuar hapësirën tuaj personale. <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-accent-500 hover:underline">{isSignUp ? 'Keni llogari? Hyni këtu' : 'Krijo llogari (Register)'}</button>
                   </p>`;

const replacementModalInfo = `                   <p className="text-center text-sm text-zinc-500 mb-4">
                      Për të pasur akses në sistemin Cloud (Firebase) fillimisht duhet të regjistroheni për të aktivizuar hapësirën tuaj personale. <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-accent-500 hover:underline">{isSignUp ? 'Keni llogari? Hyni këtu' : 'Krijo llogari (Register)'}</button>
                   </p>
                   <div className="bg-blue-500/10 text-blue-600 dark:text-blue-400 p-3 rounded-lg text-xs mb-4 text-center">
                      <span className="font-bold">Info:</span> Hyrja me Google hap një dritare të re (pop-up) për siguri. Nëse dëshironi hyrje direkte pa dritare të reja, përdorni E-mail dhe Password!
                   </div>`;

code = code.replace(targetModalInfo, replacementModalInfo);
fs.writeFileSync('src/components/Notepad.tsx', code);
