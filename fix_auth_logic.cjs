const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

// Replace handleEmailAuth
const oldEmailAuth = `  const handleEmailAuth = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          if (isSignUp) {
              await createUserWithEmailAndPassword(auth, email, password);
              localStorage.setItem('grid_cloud_sync_freq', '5000');
              setCloudSyncFrequency(5000);
              showToast("Llogaria u krijua! Sinkronizimi Cloud (5s Auto-Save) u aktivizua automatikisht!");
          } else {
              await signInWithEmailAndPassword(auth, email, password);
              localStorage.setItem('grid_cloud_sync_freq', '5000');
              setCloudSyncFrequency(5000);
              showToast("Hyrje e suksesshme! Sinkronizimi Cloud (5s Auto-Save) u aktivizua!");
          }
          localStorage.setItem('grid_notepad_saved_email', email);
          localStorage.setItem('grid_notepad_saved_pwd', password);
          setAuthModal(false);
          setPassword('');
          // setCloudModal(true);
          setTimeout(() => forceCloudBackup(), 1500);
      } catch (err: any) {
          console.error("Auth error", err);
          let msg = "Kujdes: Hyrja dështoi.";
          if (err.code === 'auth/email-already-in-use') msg = "Kjo adresë emaili është tashmë në përdorim.";
          if (err.code === 'auth/weak-password') msg = "Fjalëkalimi është tepër i dobët. (Min. 6 karaktere)";
          if (err.code === 'auth/invalid-email') msg = "Formati i emailit është i pasaktë.";
          if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') msg = "Emaili ose fjalëkalimi i gabuar.";
          if (err.code === 'auth/operation-not-allowed') msg = "Kujdes: Duhet të aktivizoni Email/Password në Firebase Console -> Authentication -> Sign-in method -> Enable.";
          showToast(msg);
      }
  };`;

const newEmailAuth = `  const handleEmailAuth = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          const { signInAnonymously } = await import('firebase/auth');
          await signInAnonymously(auth);
          
          // Generate a custom deterministic UID based on email and password
          const encoder = new TextEncoder();
          const data = encoder.encode(email.toLowerCase() + ":" + password);
          const hashBuffer = await crypto.subtle.digest('SHA-256', data);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const customUid = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
          
          localStorage.setItem('grid_notepad_custom_uid', customUid);
          localStorage.setItem('grid_notepad_saved_email', email);
          localStorage.setItem('grid_notepad_saved_pwd', password);
          
          localStorage.setItem('grid_cloud_sync_freq', '5000');
          setCloudSyncFrequency(5000);
          
          showToast(isSignUp ? "Llogaria u krijua dhe u lidh me Cloud!" : "Hyrje e suksesshme në Cloud!");
          setAuthModal(false);
          setPassword('');
          
          // Force a fetch with the new customUid
          fetchCloudDocs(customUid);
          setTimeout(() => forceCloudBackup(), 1500);
      } catch (err: any) {
          console.error("Auth error", err);
          showToast("Gabim gjatë lidhjes me Cloud: " + err.message);
      }
  };`;

code = code.replace(oldEmailAuth, newEmailAuth);

// Replace Google Auth
const oldGoogleAuth = `  const loginWithGoogle = async () => {
      if (Capacitor.isNativePlatform()) {
         showToast("Hyrja me Google kërkon konfigurim të avancuar për APK. Ju lutem përdorni Email/Fjalëkalim për Native (Aktivizoni Emailin në Firebase Console -> Authentication).");
         return;
      }
      if (window.self !== window.top) {
         showToast("Kujdes: Hyrja me Google nuk funksionon brenda kornizës (iframe). Ju lutem hapeni aplikacionin në një dritare të re (New Tab) ose përdorni Email/Fjalëkalim.");
         return;
      }
      try {
         const provider = new GoogleAuthProvider();
         if (!auth) throw new Error("Auth is not initialized");
         await signInWithPopup(auth, provider);
         localStorage.setItem('grid_cloud_sync_freq', '5000');
         setCloudSyncFrequency(5000);
         setAuthModal(false);
         showToast("Hyrje e suksesshme me Google! Sinkronizimi Cloud u aktivizua automatikisht!");
         setTimeout(() => forceCloudBackup(), 1500);
      } catch (err: any) {
         if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/operation-not-supported-in-this-environment') {
             showToast("Hyrja me Google u anulua. Ju lutem përdorni Email/Fjalëkalim nëse kjo nuk punon.");
         } else {
             showToast("Gabim gjatë hyrjes me Google. Përdorni Email/Fjalëkalim për Native: " + err.message);
         }
      }
  };`;

const newGoogleAuth = `  const loginWithGoogle = async () => {
      try {
         const provider = new GoogleAuthProvider();
         if (!auth) throw new Error("Auth is not initialized");
         await signInWithRedirect(auth, provider);
      } catch (err: any) {
         showToast("Gabim gjatë hyrjes me Google: " + err.message);
      }
  };
  
  useEffect(() => {
     getRedirectResult(auth).then((result) => {
         if (result && result.user) {
             localStorage.setItem('grid_notepad_custom_uid', result.user.uid);
             localStorage.setItem('grid_cloud_sync_freq', '5000');
             setCloudSyncFrequency(5000);
             showToast("Hyrje e suksesshme me Google! Sinkronizimi Cloud u aktivizua automatikisht!");
             fetchCloudDocs(result.user.uid);
             setTimeout(() => forceCloudBackup(), 1500);
         }
     }).catch(console.error);
  }, []);
`;

code = code.replace(oldGoogleAuth, newGoogleAuth);

fs.writeFileSync('src/components/Notepad.tsx', code);
