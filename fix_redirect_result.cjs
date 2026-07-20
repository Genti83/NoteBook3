const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const targetEffect = `  useEffect(() => {
    // Auto-login fallback for Capacitor environments that might wipe IndexedDB
    const savedEmail = localStorage.getItem('grid_notepad_saved_email');
    const savedPwd = localStorage.getItem('grid_notepad_saved_pwd');`;

const replacementEffect = `  useEffect(() => {
    getRedirectResult(auth).then((result) => {
        if (result && result.user) {
            localStorage.setItem('grid_cloud_sync_freq', '5000');
            setCloudSyncFrequency(5000);
            localStorage.removeItem('grid_notepad_custom_uid');
            showToast("Hyrje e suksesshme me Google! Sinkronizimi Cloud u aktivizua automatikisht!");
            setTimeout(() => forceCloudBackup(), 1500);
        }
    }).catch(console.error);

    // Auto-login fallback for Capacitor environments that might wipe IndexedDB
    const savedEmail = localStorage.getItem('grid_notepad_saved_email');
    const savedPwd = localStorage.getItem('grid_notepad_saved_pwd');`;

code = code.replace(targetEffect, replacementEffect);

fs.writeFileSync('src/components/Notepad.tsx', code);
