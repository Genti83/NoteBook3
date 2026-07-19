const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

// Update Google Auth
const targetGoogle = `  const loginWithGoogle = async () => {
      showToast("Kujdes: Hyrja me Google kërkon aktivizim manual në Firebase Console (Authentication -> Sign-in method -> Google). Ju lutemi përdorni Email/Fjalëkalim pasi është konfiguruar të funksionojë automatikisht pa aktivizim!");
      // We will still try in case they activated it:
      try {
         const provider = new GoogleAuthProvider();
         await signInWithRedirect(auth, provider);
      } catch (err: any) {
         console.error("Google Auth error", err);
      }
  };`;

const replacementGoogle = `  const loginWithGoogle = async () => {
      if (Capacitor.isNativePlatform()) {
         showToast("Kujdes: Hyrja me Google në APK kërkon konfigurim nativ (mbetet në Web Browser). Ju lutem përdorni Email / Fjalëkalim për të qëndruar brenda aplikacionit APK!");
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
         showToast("Gabim gjatë hyrjes me Google: " + err.message);
      }
  };`;

code = code.replace(targetGoogle, replacementGoogle);

// Let's remove the getRedirectResult useEffect since we don't use redirect anymore
const targetEffect = `  useEffect(() => {
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
  }, []);`;
  
code = code.replace(targetEffect, '');

// Update Email Auth just in case
const targetEmail = `  const handleEmailAuth = async (e: React.FormEvent) => {
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
          let msg = "Gabim gjatë procesit: " + err.message;
          if (err.code === 'auth/email-already-in-use') msg = "Kjo adresë emaili është tashmë në përdorim.";
          if (err.code === 'auth/weak-password') msg = "Fjalëkalimi është tepër i dobët. (Min. 6 karaktere)";
          if (err.code === 'auth/invalid-email') msg = "Formati i emailit është i pasaktë.";
          if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') msg = "Emaili ose fjalëkalimi i gabuar.";
          if (err.code === 'auth/operation-not-allowed') msg = "Kujdes: Duhet të aktivizoni Email/Password në Firebase Console -> Authentication -> Sign-in method -> Enable.";
          showToast(msg);
      }
  };`;

const replacementEmail = `  const handleEmailAuth = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          if (isSignUp) {
              await createUserWithEmailAndPassword(auth, email, password);
              localStorage.setItem('grid_cloud_sync_freq', '5000');
              setCloudSyncFrequency(5000);
              showToast("Llogaria u krijua me sukses! Sinkronizimi Cloud u aktivizua.");
          } else {
              await signInWithEmailAndPassword(auth, email, password);
              localStorage.setItem('grid_cloud_sync_freq', '5000');
              setCloudSyncFrequency(5000);
              showToast("Hyrje e suksesshme! Sinkronizimi Cloud u aktivizua.");
          }
          localStorage.setItem('grid_notepad_saved_email', email);
          localStorage.setItem('grid_notepad_saved_pwd', password);
          setAuthModal(false);
          setPassword('');
          setTimeout(() => forceCloudBackup(), 1500);
      } catch (err: any) {
          let msg = "Gabim: " + err.message;
          if (err.code === 'auth/email-already-in-use') {
             setIsSignUp(false);
             showToast("Llogaria ekziston. Po kalojmë tek Hyrja. Klikoni Hyr përsëri.");
             return;
          }
          if (err.code === 'auth/weak-password') msg = "Fjalëkalimi duhet të ketë të paktën 6 karaktere.";
          if (err.code === 'auth/invalid-email') msg = "Formati i emailit është i pasaktë.";
          if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') msg = "Emaili ose fjalëkalimi i gabuar.";
          if (err.code === 'auth/operation-not-allowed') msg = "Kujdes: Email/Password nuk është aktivizuar në Firebase Console.";
          showToast(msg);
      }
  };`;

code = code.replace(targetEmail, replacementEmail);

fs.writeFileSync('src/components/Notepad.tsx', code);
