const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const target = `    const handlePopState = (e: PopStateEvent) => {
        // Find if any modal is open
        const anyModalOpen = document.querySelector('.fixed.inset-0.z-\\\\[80\\\\]');
        if (anyModalOpen) {
            // Re-push state so next back button press will be caught again
            window.history.pushState({ appLocked: false }, '');
            
            // Dispatch a custom event that we can listen to close modals
            window.dispatchEvent(new Event('close-all-modals'));
        }
    };`;

const rep = `    let lastBackPress = 0;
    const handlePopState = (e: PopStateEvent) => {
        // Find if any modal is open
        const anyModalOpen = document.querySelector('.fixed.inset-0');
        if (anyModalOpen) {
            window.history.pushState({ appLocked: false }, '');
            window.dispatchEvent(new Event('close-all-modals'));
        } else {
            const now = Date.now();
            if (now - lastBackPress < 1500) {
               // Double back pressed -> exit app
               if (Capacitor.isNativePlatform()) {
                   try {
                       const App = require('@capacitor/app').App;
                       App.exitApp();
                   } catch(e) {}
               } else {
                   window.close();
               }
            } else {
               lastBackPress = now;
               window.history.pushState({ appLocked: false }, '');
               const toast = document.createElement('div');
               toast.className = 'fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-zinc-800 text-white px-4 py-2 rounded-lg shadow-lg z-[200] animate-in fade-in zoom-in';
               toast.innerText = 'Shtyp sërish për të dalë.';
               document.body.appendChild(toast);
               setTimeout(() => toast.remove(), 1500);
            }
        }
    };`;

code = code.replace(target, rep);

fs.writeFileSync('src/components/Notepad.tsx', code);
