const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const targetGoogleLogin = `  const loginWithGoogle = async () => {
      try {
         await hookGoogleLogin();
         localStorage.setItem('grid_cloud_sync_freq', '5000');
         setCloudSyncFrequency(5000);
         localStorage.removeItem('grid_notepad_custom_uid'); 
         setAuthModal(false);
         showToast("Hyrje e suksesshme me Google! Sinkronizimi Cloud u aktivizua.");
         setTimeout(() => forceCloudBackup(), 1500);
      } catch (err: any) {
         if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
             showToast("Dritarja e hyrjes u mbyll ose u bllokua. Nëse jeni në aplikacion (APK), ju lutem aktivizoni Email/Password në Firebase sepse Google Sign-In kërkon shfletues.");
         } else {
             showToast("Gabim gjatë hyrjes me Google: " + err.message);
         }
      }
  };`;

const replacementGoogleLogin = `  const loginWithGoogle = async () => {
      try {
         const googleUser = await hookGoogleLogin();
         if (googleUser === null) {
            // This means a redirect was started! So we wait.
            showToast("Po ju ridrejtojmë tek Google për hyrje...");
            return;
         }
         localStorage.setItem('grid_cloud_sync_freq', '5000');
         setCloudSyncFrequency(5000);
         localStorage.removeItem('grid_notepad_custom_uid'); 
         setAuthModal(false);
         showToast("Hyrje e suksesshme me Google! Sinkronizimi Cloud u aktivizua.");
         setTimeout(() => forceCloudBackup(), 1500);
      } catch (err: any) {
         if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
             showToast("Dritarja u mbyll! Provoni përsëri ose përdorni hyrjen me Email/Password.");
         } else if (err.code === 'auth/operation-not-allowed') {
             showToast("Hyrja me Google është e çaktivizuar në server! Provoni Email.");
         } else {
             showToast("Gabim gjatë hyrjes me Google: " + err.message);
         }
      }
  };`;

if (code.includes('await hookGoogleLogin();')) {
    code = code.replace(targetGoogleLogin, replacementGoogleLogin);
    fs.writeFileSync('src/components/Notepad.tsx', code);
    console.log("Google login updated in Notepad!");
}
