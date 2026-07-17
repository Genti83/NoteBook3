const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const target = `const loginWithGoogle = async () => {
      try {
         const provider = new GoogleAuthProvider();
         await signInWithPopup(auth, provider);
         localStorage.setItem('grid_cloud_sync_freq', '5000');
         setCloudSyncFrequency(5000);
         setAuthModal(false);
         showToast("Hyrje e suksesshme me Google! Sinkronizimi Cloud (5s Auto-Save) u aktivizua automatikisht!");
         setTimeout(() => forceCloudBackup(), 1500);
      } catch (err: any) {
         if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/operation-not-supported-in-this-environment') {
             showToast("Hyrja me Google u anulua ose bllokua. Nëse jeni në aplikacionin celular (APK), ju lutem përdorni Email dhe Fjalëkalim për t'u kyçur.");
         } else {
             showToast("Gabim gjatë hyrjes me Google: " + err.message);
         }
      }
  };`;

const replacement = `const loginWithGoogle = async () => {
      try {
         const provider = new GoogleAuthProvider();
         if (Capacitor.isNativePlatform()) {
             showToast("Po hapet llogaria Google...");
             await signInWithRedirect(auth, provider);
         } else {
             await signInWithPopup(auth, provider);
             localStorage.setItem('grid_cloud_sync_freq', '5000');
             setCloudSyncFrequency(5000);
             setAuthModal(false);
             showToast("Hyrje e suksesshme me Google! Sinkronizimi Cloud (5s Auto-Save) u aktivizua automatikisht!");
             setTimeout(() => forceCloudBackup(), 1500);
         }
      } catch (err: any) {
         if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/operation-not-supported-in-this-environment') {
             showToast("Hyrja me Google u anulua ose bllokua. Për celular përdorni Email për t'u kyçur ose provoni prapë.");
         } else {
             showToast("Gabim gjatë hyrjes me Google: " + err.message);
         }
      }
  };`;

code = code.replace(target, replacement);

fs.writeFileSync('src/components/Notepad.tsx', code);
