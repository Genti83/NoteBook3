const fs = require('fs');
let code = fs.readFileSync('src/hooks/useFirebase.ts', 'utf8');

const targetInit = `  useEffect(() => {
    addDebugLog('useFirebase Init - Platform: ' + Capacitor.getPlatform());
    
    let unsubscribe: () => void = () => {};

    // Use indexedDBLocalPersistence for Capacitor Android to ensure data persists across app restarts
    const persistenceType = indexedDBLocalPersistence;
    
    setPersistence(auth, persistenceType)
      .then(() => {
         addDebugLog('Persistence set to indexedDB');
         // We attach auth state listener AFTER persistence resolves
         unsubscribe = onAuthStateChanged(auth, (currentUser) => {
           setUser(currentUser);
           setLoading(false);
           addDebugLog('Auth state changed. User: ' + (currentUser ? currentUser.email : 'null'));
         }, (err) => {
           addDebugLog('Auth state error: ' + err.message);
         });
      })
      .catch((err) => {
         addDebugLog("Persistence setup issue: " + err.message);
         setLoading(false);
      });

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

code = code.replace(targetInit, replacementInit);
fs.writeFileSync('src/hooks/useFirebase.ts', code);
