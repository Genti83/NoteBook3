const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

// 1. Import useFirebase
if (!code.includes('import { useFirebase }')) {
    code = code.replace("import { format } from 'date-fns';", "import { format } from 'date-fns';\nimport { useFirebase } from '../hooks/useFirebase';");
}

// 2. Remove user state
code = code.replace("const [user, setUser] = useState<User | null>(null);", "");

// 3. Add useFirebase destructuring at the top of the component
code = code.replace("const [authModal, setAuthModal] = useState(false);", "const [authModal, setAuthModal] = useState(false);\n  const { user, loginWithGoogle: hookGoogleLogin, loginWithEmail: hookEmailLogin, registerWithEmail: hookEmailRegister, logout: hookLogout } = useFirebase();");

// 4. Update the onAuthStateChanged effect to depend on the `user` object from the hook instead.
const targetEffect = `  useEffect(() => {
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
    const savedPwd = localStorage.getItem('grid_notepad_saved_pwd');
    if (savedEmail && savedPwd && !auth.currentUser) {
        signInWithEmailAndPassword(auth, savedEmail, savedPwd).catch(() => {});
    }

    const savedPassword = localStorage.getItem('grid_notepad_pin');
    if (savedPassword) {
       setAppLocked(true);
    }
    const savedOrange = localStorage.getItem('grid_notepad_blue');
    if (savedOrange) {
       setBlueText(savedOrange);
    }
    const savedSecret = localStorage.getItem('grid_notepad_secretList');
    if (savedSecret) {
       try { setSecretList(JSON.parse(savedSecret)); } catch(e){}
    }

    const unsub = onAuthStateChanged(auth, async (u) => {
       setUser(u);
       if (u) {
           try {
               const q = query(collection(db, 'documents'), where('userId', '==', localStorage.getItem('grid_notepad_custom_uid') || u.uid));
               const snaps = await getDocs(q);
               const fetched: GridDocument[] = [];
               snaps.forEach(s => {
                  const data = s.data();
                  if (data) fetched.push(data as GridDocument);
               });
               
               setDocuments(prevLocal => {
                   const mergedMap = new Map<string, GridDocument>();
                   prevLocal.forEach(d => mergedMap.set(d.id, d));
                   
                   fetched.forEach(d => {
                       const existing = mergedMap.get(d.id);
                       if (!existing || new Date(d.updatedAt) > new Date(existing.updatedAt)) {
                           mergedMap.set(d.id, d);
                       }
                   });
                   
                   const newMerged = Array.from(mergedMap.values()).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
                   localStorage.setItem('grid_notepad_documents_v2', JSON.stringify(newMerged));
                   
                   // Push any newer local docs to cloud silently
                   newMerged.forEach(async (docObj) => {
                       const cloudVersion = fetched.find(c => c.id === docObj.id);
                       if (!cloudVersion || new Date(docObj.updatedAt) > new Date(cloudVersion.updatedAt)) {
                           try {
                               await setDoc(doc(db, 'documents', docObj.id), { ...docObj, userId: localStorage.getItem('grid_notepad_custom_uid') || u.uid });
                           } catch (e) { console.error("Auto sync push error", e); }
                       }
                   });
                   
                   return newMerged;
               });
           } catch (err) {
               console.error("Auto sync fetch error", err);
           }
       }
    });
    return () => unsub();
  }, []);`;

const replacementEffect = `  useEffect(() => {
    // Auto-login fallback for Capacitor environments that might wipe IndexedDB
    const savedEmail = localStorage.getItem('grid_notepad_saved_email');
    const savedPwd = localStorage.getItem('grid_notepad_saved_pwd');
    if (savedEmail && savedPwd && !user) {
        hookEmailLogin(savedEmail, savedPwd).catch(() => {});
    }

    const savedPassword = localStorage.getItem('grid_notepad_pin');
    if (savedPassword) {
       setAppLocked(true);
    }
    const savedOrange = localStorage.getItem('grid_notepad_blue');
    if (savedOrange) {
       setBlueText(savedOrange);
    }
    const savedSecret = localStorage.getItem('grid_notepad_secretList');
    if (savedSecret) {
       try { setSecretList(JSON.parse(savedSecret)); } catch(e){}
    }
  }, []);

  useEffect(() => {
     if (user) {
         const fetchCloudData = async () => {
           try {
               const q = query(collection(db, 'documents'), where('userId', '==', localStorage.getItem('grid_notepad_custom_uid') || user.uid));
               const snaps = await getDocs(q);
               const fetched: GridDocument[] = [];
               snaps.forEach(s => {
                  const data = s.data();
                  if (data) fetched.push(data as GridDocument);
               });
               
               setDocuments(prevLocal => {
                   const mergedMap = new Map<string, GridDocument>();
                   prevLocal.forEach(d => mergedMap.set(d.id, d));
                   
                   fetched.forEach(d => {
                       const existing = mergedMap.get(d.id);
                       if (!existing || new Date(d.updatedAt) > new Date(existing.updatedAt)) {
                           mergedMap.set(d.id, d);
                       }
                   });
                   
                   const newMerged = Array.from(mergedMap.values()).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
                   localStorage.setItem('grid_notepad_documents_v2', JSON.stringify(newMerged));
                   
                   // Push any newer local docs to cloud silently
                   newMerged.forEach(async (docObj) => {
                       const cloudVersion = fetched.find(c => c.id === docObj.id);
                       if (!cloudVersion || new Date(docObj.updatedAt) > new Date(cloudVersion.updatedAt)) {
                           try {
                               await setDoc(doc(db, 'documents', docObj.id), { ...docObj, userId: localStorage.getItem('grid_notepad_custom_uid') || user.uid });
                           } catch (e) { console.error("Auto sync push error", e); }
                       }
                   });
                   
                   return newMerged;
               });
           } catch (err) {
               console.error("Auto sync fetch error", err);
           }
         };
         fetchCloudData();
     }
  }, [user]);`;

code = code.replace(targetEffect, replacementEffect);

// 5. Replace handleEmailAuth and loginWithGoogle implementations
const targetHandlers = `  const handleEmailAuth = async (e: React.FormEvent) => {
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
          localStorage.removeItem('grid_notepad_custom_uid'); 
          
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
          showToast(msg);
      }
  };

  const loginWithGoogle = async () => {
      try {
         const provider = new GoogleAuthProvider();
         if (!auth) throw new Error("Auth is not initialized");
         
         if (Capacitor.isNativePlatform()) {
             await signInWithRedirect(auth, provider);
         } else {
             await signInWithPopup(auth, provider);
             localStorage.setItem('grid_cloud_sync_freq', '5000');
             setCloudSyncFrequency(5000);
             localStorage.removeItem('grid_notepad_custom_uid'); 
             setAuthModal(false);
             showToast("Hyrje e suksesshme me Google! Sinkronizimi Cloud u aktivizua.");
             setTimeout(() => forceCloudBackup(), 1500);
         }
      } catch (err: any) {
         showToast("Gabim gjatë hyrjes me Google: " + err.message);
      }
  };`;

const replacementHandlers = `  const handleEmailAuth = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          if (isSignUp) {
              await hookEmailRegister(email, password);
              showToast("Llogaria u krijua me sukses! Sinkronizimi Cloud u aktivizua.");
          } else {
              await hookEmailLogin(email, password);
              showToast("Hyrje e suksesshme! Sinkronizimi Cloud u aktivizua.");
          }
          
          localStorage.setItem('grid_notepad_saved_email', email);
          localStorage.setItem('grid_notepad_saved_pwd', password);
          localStorage.removeItem('grid_notepad_custom_uid'); 
          
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
          showToast(msg);
      }
  };

  const loginWithGoogle = async () => {
      try {
         await hookGoogleLogin();
         localStorage.setItem('grid_cloud_sync_freq', '5000');
         setCloudSyncFrequency(5000);
         localStorage.removeItem('grid_notepad_custom_uid'); 
         setAuthModal(false);
         showToast("Hyrje e suksesshme me Google! Sinkronizimi Cloud u aktivizua.");
         setTimeout(() => forceCloudBackup(), 1500);
      } catch (err: any) {
         showToast("Gabim gjatë hyrjes me Google: " + err.message);
      }
  };`;

code = code.replace(targetHandlers, replacementHandlers);

fs.writeFileSync('src/components/Notepad.tsx', code);
