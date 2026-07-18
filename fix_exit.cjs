const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const target = `               // Double back pressed -> exit app
               if (Capacitor.isNativePlatform()) {
                   try {
                       const App = require('@capacitor/app').App;
                       App.exitApp();
                   } catch(e) {}
               } else {
                   window.close();
               }`;

const rep = `               // Double back pressed -> exit app
               if (auth.currentUser && navigator.onLine) {
                   forceCloudBackup();
               }
               if (Capacitor.isNativePlatform()) {
                   try {
                       const App = require('@capacitor/app').App;
                       App.exitApp();
                   } catch(e) {}
               } else {
                   window.close();
               }`;

code = code.replace(target, rep);

fs.writeFileSync('src/components/Notepad.tsx', code);
