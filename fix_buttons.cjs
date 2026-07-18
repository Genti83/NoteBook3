const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const modalTitles = [
  '<Cloud className="w-6 h-6 text-accent-500" /> Dokumentet Online',
  'Menaxho Llogarinë Google Cloud',
  'Backup i Fshehtë dhe Rikthim Manual',
  '{passwordModal.type === \'setup\' ? \'Krijo Password Sigurie\' : \'Futni Password\'}',
  'Cilësimet (Settings)'
];

const backButtonSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="w-5 h-5"><path d="m15 18-6-6 6-6"/></svg>`;

code = code.replace(
  /<Cloud className="w-6 h-6 text-accent-500" \/> Dokumentet Online/g,
  `<button onClick={() => setCloudModal(false)} className="mr-2 p-1.5 bg-zinc-500/10 hover:bg-zinc-500/20 rounded-lg transition-colors">\n                         ${backButtonSVG}\n                      </button>\n                      <Cloud className="w-6 h-6 text-accent-500" /> Dokumentet Online`
);

code = code.replace(
  /Menaxho Llogarinë Google Cloud/g,
  `<button onClick={() => setAuthModal(false)} className="mr-2 p-1.5 bg-zinc-500/10 hover:bg-zinc-500/20 rounded-lg transition-colors">\n                         ${backButtonSVG}\n                      </button>\n                      Menaxho Llogarinë Google Cloud`
);

code = code.replace(
  /Backup i Fshehtë dhe Rikthim Manual/g,
  `<button onClick={() => setBackupModal(false)} className="mr-2 p-1.5 bg-zinc-500/10 hover:bg-zinc-500/20 rounded-lg transition-colors">\n                         ${backButtonSVG}\n                      </button>\n                      Backup i Fshehtë dhe Rikthim Manual`
);

code = code.replace(
  /Cilësimet \(Settings\)/g,
  `<button onClick={() => setSettingsModal(false)} className="mr-2 p-1.5 bg-zinc-500/10 hover:bg-zinc-500/20 rounded-lg transition-colors">\n                         ${backButtonSVG}\n                      </button>\n                      Cilësimet (Settings)`
);

code = code.replace(
  /{passwordModal.type === 'setup' \? 'Krijo Password Sigurie' : 'Futni Password'}/g,
  `{passwordModal.type === 'setup' ? 'Krijo Password Sigurie' : 'Futni Password'}`
); // Leave password modal alone since it might interrupt flow or logic if aborted manually, wait, it has an Anulo button already.

fs.writeFileSync('src/components/Notepad.tsx', code);
