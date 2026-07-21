const fs = require('fs');
let code = fs.readFileSync('src/hooks/useFirebase.ts', 'utf8');

const targetInit = `  useEffect(() => {
    addDebugLog('useFirebase Init - Platform: ' + Capacitor.getPlatform());
    
    // Default firebase persistence automatically handles browserLocalPersistence
    // which is the most reliable cross-platform (Web + simple Capacitor WebViews)
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      addDebugLog('Auth state changed. User: ' + (currentUser ? currentUser.email : 'null'));
    }, (err) => {
      addDebugLog('Auth state error: ' + err.message);
      setLoading(false);
    });

    // Handle any redirect results if they came back from a mobile redirect flow
    getRedirectResult(auth).then((result) => {
      if (result && result.user) {
        addDebugLog('Redirect auth success: ' + result.user.email);
        setUser(result.user);
      }
    }).catch((err) => {
      addDebugLog("Redirect auth error: " + err.message);
    });

    return () => unsubscribe();
  }, []);`;

const replacementInit = `  useEffect(() => {
    addDebugLog('useFirebase Init - Platform: ' + Capacitor.getPlatform());
    
    let unsubscribe = () => {};
    
    // Forcojme ruajtjen e sesionit (LOCAL persistence)
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
         addDebugLog('Persistence set to browserLocal');
         unsubscribe = onAuthStateChanged(auth, (currentUser) => {
           setUser(currentUser);
           setLoading(false);
           addDebugLog('Auth state changed. User: ' + (currentUser ? currentUser.email : 'null'));
         }, (err) => {
           addDebugLog('Auth state error: ' + err.message);
           setLoading(false);
         });
      })
      .catch((err) => {
         addDebugLog("Persistence setup issue: " + err.message);
         // Fallback anyway
         unsubscribe = onAuthStateChanged(auth, (currentUser) => {
           setUser(currentUser);
           setLoading(false);
         });
      });

    // Handle any redirect results if they came back from a mobile redirect flow
    getRedirectResult(auth).then((result) => {
      if (result && result.user) {
        addDebugLog('Redirect auth success: ' + result.user.email);
        setUser(result.user);
      }
    }).catch((err) => {
      addDebugLog("Redirect auth error: " + err.message);
    });

    return () => unsubscribe();
  }, []);`;

code = code.replace(targetInit, replacementInit);

const targetGoogleLogin = `  const loginWithGoogle = async () => {
    try {
      addDebugLog('Starting Google Login (Popup)');
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      
      const res = await signInWithPopup(auth, provider);
      addDebugLog('Popup login success: ' + res.user.email);
      return res.user;
    } catch(err: any) {
      addDebugLog('Google Login Exception: ' + err.message);
      throw err;
    }
  };`;

const replacementGoogleLogin = `  const loginWithGoogle = async () => {
    try {
      addDebugLog('Starting Google Login (Popup)');
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      
      // Provon popup, nese deshton (p.sh. bllokohet), provon redirect
      try {
          const res = await signInWithPopup(auth, provider);
          addDebugLog('Popup login success: ' + res.user.email);
          return res.user;
      } catch (popupErr: any) {
          addDebugLog('Popup blocked or failed: ' + popupErr.message + '. Falling back to redirect.');
          await signInWithRedirect(auth, provider);
          return null; // redirect will reload page
      }
    } catch(err: any) {
      addDebugLog('Google Login Exception: ' + err.message);
      throw err;
    }
  };`;

code = code.replace(targetGoogleLogin, replacementGoogleLogin);
fs.writeFileSync('src/hooks/useFirebase.ts', code);
