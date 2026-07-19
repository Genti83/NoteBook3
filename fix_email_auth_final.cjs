const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const targetEmail = `  const handleEmailAuth = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          // Përdorim Anonymouse Login si transport për të kaluar rregullat e Firebase (që kërkojnë request.auth != null)
          // por përdorim një hash unik nga Emaili + Fjalëkalimi juaj për të identifikuar të dhënat kudo (Web/APK).
          const { signInAnonymously } = await import('firebase/auth');
          await signInAnonymously(auth);
          
          const encoder = new TextEncoder();
          const data = encoder.encode(email.toLowerCase().trim() + "::" + password);
          const hashBuffer = await crypto.subtle.digest('SHA-256', data);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const customUid = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
          
          localStorage.setItem('grid_notepad_custom_uid', customUid);
          localStorage.setItem('grid_notepad_saved_email', email);
          localStorage.setItem('grid_notepad_saved_pwd', password);
          
          localStorage.setItem('grid_cloud_sync_freq', '5000');
          setCloudSyncFrequency(5000);
          
          showToast(isSignUp ? "Llogaria u krijua dhe u lidh me Cloud automatikisht!" : "Hyrje e suksesshme! Sinkronizimi aktiv.");
          setAuthModal(false);
          setPassword('');
          
          fetchCloudDocs(customUid);
          setTimeout(() => forceCloudBackup(), 1500);
      } catch (err: any) {
          console.error("Auth error", err);
          showToast("Gabim gjatë lidhjes me Cloud: " + err.message);
      }
  };`;

const replacementEmail = `  const handleEmailAuth = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          if (isSignUp) {
              await createUserWithEmailAndPassword(auth, email, password);
              showToast("Llogaria u krijua me sukses! Sinkronizimi Cloud u aktivizua.");
          } else {
              await signInWithEmailAndPassword(auth, email, password);
              showToast("Hyrje e suksesshme! Sinkronizimi Cloud u aktivizua.");
          }
          
          localStorage.setItem('grid_notepad_saved_email', email);
          localStorage.setItem('grid_notepad_saved_pwd', password);
          localStorage.removeItem('grid_notepad_custom_uid'); // We will use Firebase standard UID
          
          localStorage.setItem('grid_cloud_sync_freq', '5000');
          setCloudSyncFrequency(5000);
          
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

// Make sure Google login doesn't have custom logic either that breaks it
const targetGoogle = `  const loginWithGoogle = async () => {
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

const replacementGoogle = `  const loginWithGoogle = async () => {
      try {
         const provider = new GoogleAuthProvider();
         if (!auth) throw new Error("Auth is not initialized");
         
         if (Capacitor.isNativePlatform()) {
             showToast("Kujdes: Hyrja me Google në APK kërkon konfigurim nativ. Po përpiqemi me Redirect...");
             await signInWithRedirect(auth, provider);
         } else {
             await signInWithPopup(auth, provider);
             localStorage.setItem('grid_cloud_sync_freq', '5000');
             setCloudSyncFrequency(5000);
             localStorage.removeItem('grid_notepad_custom_uid'); // Clean any pseudo-login
             setAuthModal(false);
             showToast("Hyrje e suksesshme me Google! Sinkronizimi Cloud u aktivizua automatikisht!");
             setTimeout(() => forceCloudBackup(), 1500);
         }
      } catch (err: any) {
         showToast("Gabim gjatë hyrjes me Google: " + err.message);
      }
  };`;

code = code.replace(targetGoogle, replacementGoogle);

fs.writeFileSync('src/components/Notepad.tsx', code);
