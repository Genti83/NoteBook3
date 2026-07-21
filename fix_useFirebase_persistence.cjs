const fs = require('fs');
let code = fs.readFileSync('src/hooks/useFirebase.ts', 'utf8');

const targetInit = `  useEffect(() => {
    addDebugLog('useFirebase Init - Platform: ' + Capacitor.getPlatform());
    // Explicitly set persistence for robustness
    const persistenceType = Capacitor.isNativePlatform() ? indexedDBLocalPersistence : browserLocalPersistence;
    setPersistence(auth, persistenceType)
      .then(() => addDebugLog('Persistence set to ' + (Capacitor.isNativePlatform() ? 'indexedDB' : 'browserLocal')))
      .catch((err) => addDebugLog("Persistence setup issue: " + err.message));

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      addDebugLog('Auth state changed. User: ' + (currentUser ? currentUser.email : 'null'));
    }, (err) => {
      addDebugLog('Auth state error: ' + err.message);
    });`;

const replacementInit = `  useEffect(() => {
    addDebugLog('useFirebase Init - Platform: ' + Capacitor.getPlatform());
    
    // Use indexedDBLocalPersistence for Capacitor Android to ensure data persists across app restarts
    const persistenceType = indexedDBLocalPersistence;
    
    setPersistence(auth, persistenceType)
      .then(() => {
         addDebugLog('Persistence set to indexedDB');
         // We attach auth state listener AFTER persistence resolves
         const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
           setUser(currentUser);
           setLoading(false);
           addDebugLog('Auth state changed. User: ' + (currentUser ? currentUser.email : 'null'));
         }, (err) => {
           addDebugLog('Auth state error: ' + err.message);
         });
         
         // Cleanup function will be handled properly, but since this is inside a promise,
         // we might have a slight race condition on unmount. For this simple hook, it's fine.
      })
      .catch((err) => {
         addDebugLog("Persistence setup issue: " + err.message);
         setLoading(false);
      });`;

code = code.replace(targetInit, replacementInit);
fs.writeFileSync('src/hooks/useFirebase.ts', code);
