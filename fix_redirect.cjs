const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const target = `    const unsub = onAuthStateChanged(auth, async (u) => {`;

const replacement = `    // Handle Google Login Redirect for Capacitor Native
    if (Capacitor.isNativePlatform()) {
        getRedirectResult(auth).then((result) => {
            if (result) {
                localStorage.setItem('grid_cloud_sync_freq', '5000');
                showToast("Hyrje e suksesshme me Google (Redirect)!");
                setTimeout(() => window.location.reload(), 1500);
            }
        }).catch(err => {
            console.error(err);
            if (err.code !== 'auth/redirect-cancelled-by-user') {
                showToast("Gabim nga Google Redirect: " + err.message);
            }
        });
    }

    const unsub = onAuthStateChanged(auth, async (u) => {`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/Notepad.tsx', code);
