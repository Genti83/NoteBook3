const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const hookTarget = `  useEffect(() => {
    const savedPin = localStorage.getItem('grid_notepad_pin');`;
const hookRep = `  useEffect(() => {
    // History API for Android Hardware Back button and Browser Back
    window.history.pushState({ appLocked: false }, '');
    
    const handlePopState = (e: PopStateEvent) => {
        // Find if any modal is open
        const anyModalOpen = document.querySelector('.fixed.inset-0.z-\\\\[80\\\\]');
        if (anyModalOpen) {
            // Re-push state so next back button press will be caught again
            window.history.pushState({ appLocked: false }, '');
            
            // Dispatch a custom event that we can listen to close modals
            window.dispatchEvent(new Event('close-all-modals'));
        }
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  
  useEffect(() => {
    const savedPin = localStorage.getItem('grid_notepad_pin');`;

code = code.replace(hookTarget, hookRep);

const closeTarget = `  useEffect(() => {
     if (auth.currentUser && navigator.onLine) {`;
const closeRep = `  useEffect(() => {
      const closeAll = () => {
          setCloudModal(false);
          setAuthModal(false);
          setBackupModal(false);
          setPasswordModal(prev => ({...prev, isOpen: false}));
          setActiveCell(null);
          setSettingsModal(false);
          setBlueModal(false);
      };
      window.addEventListener('close-all-modals', closeAll);
      return () => window.removeEventListener('close-all-modals', closeAll);
  }, []);
  
  useEffect(() => {
     if (auth.currentUser && navigator.onLine) {`;

code = code.replace(closeTarget, closeRep);

fs.writeFileSync('src/components/Notepad.tsx', code);
