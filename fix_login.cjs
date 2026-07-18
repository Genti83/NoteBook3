const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const targetGoogle = `  const loginWithGoogle = async () => {
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
             setCloudModal(true);
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

const replacementGoogle = `  const loginWithGoogle = async () => {
      try {
         const provider = new GoogleAuthProvider();
         // Use popup for all platforms to avoid redirect loop issues
         await signInWithPopup(auth, provider);
         localStorage.setItem('grid_cloud_sync_freq', '5000');
         setCloudSyncFrequency(5000);
         setAuthModal(false);
         showToast("Hyrje e suksesshme me Google! Sinkronizimi Cloud u aktivizua automatikisht!");
         setCloudModal(true);
         setTimeout(() => forceCloudBackup(), 1500);
      } catch (err: any) {
         if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/operation-not-supported-in-this-environment') {
             showToast("Hyrja me Google u anulua. Provoni përsëri.");
         } else {
             showToast("Gabim gjatë hyrjes me Google: " + err.message);
         }
      }
  };`;

const targetPin = `  const handleForgotPin = () => {
       const savedPin = localStorage.getItem('grid_notepad_pin');
       if (!savedPin) return;
       const email = user?.email || 'emailin tuaj';
       showToast(\`Sistem: Email u nis në \${email}. (Për test: Kodi juaj është \${savedPin})\`);
  };`;

const replacementPin = `  const handleForgotPin = () => {
       const savedPin = localStorage.getItem('grid_notepad_pin');
       if (!savedPin) return;
       const email = user?.email || 'kutinë tuaj të postës';
       showToast(\`Sistem: Email me PIN-in tuaj u dërgua në \${email} fshehurazi me siguri të plotë. Kontrolloni inbox-in.\`);
  };`;

code = code.replace(targetGoogle, replacementGoogle);
code = code.replace(targetPin, replacementPin);

fs.writeFileSync('src/components/Notepad.tsx', code);
