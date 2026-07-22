const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const targetInitialEffect = `  useEffect(() => {
    const root = document.documentElement;
    const theme = COLOR_THEMES[accentColor];`;

const replacementInitialEffect = `  // Auto-restore docs if empty on login (e.g. fresh phone install)
  useEffect(() => {
    if (user && !loading) {
       const docs = JSON.parse(localStorage.getItem('grid_notepad_documents_v2') || '[]');
       if (docs.length === 0 || (docs.length === 1 && docs[0].rows.length === 0)) {
           // We are empty and logged in. Wait for online status.
           if (navigator.onLine) {
               console.log("Auto-restoring from cloud since local docs are empty...");
               handleFullCloudRestore();
           }
       }
    }
  }, [user, loading]);

  useEffect(() => {
    const root = document.documentElement;
    const theme = COLOR_THEMES[accentColor];`;

if (code.includes('useEffect(() => {\n    const root = document.documentElement;')) {
    code = code.replace(targetInitialEffect, replacementInitialEffect);
    fs.writeFileSync('src/components/Notepad.tsx', code);
    console.log("Auto-restore initial effect added!");
}
