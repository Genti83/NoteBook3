const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

// Add getRedirectResult logic to useEffect where we have authStateChanged
const targetEffect = `  useEffect(() => {
     if (typeof window !== 'undefined') {
        const storedTheme = localStorage.getItem('grid_notepad_theme');`;

const replacementEffect = `  useEffect(() => {
     if (typeof window !== 'undefined') {
        const storedTheme = localStorage.getItem('grid_notepad_theme');
        
        getRedirectResult(auth).then((result) => {
            if (result && result.user) {
                localStorage.setItem('grid_cloud_sync_freq', '5000');
                setCloudSyncFrequency(5000);
                localStorage.removeItem('grid_notepad_custom_uid');
                showToast("Hyrje e suksesshme me Google! Sinkronizimi Cloud u aktivizua automatikisht!");
                setTimeout(() => forceCloudBackup(), 1500);
            }
        }).catch(console.error);`;

code = code.replace(targetEffect, replacementEffect);

fs.writeFileSync('src/components/Notepad.tsx', code);
