const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const target = `  // Periodic Auto-Backup to Cloud (Firebase)
  useEffect(() => {
     if (cloudSyncFrequency === -1 || !auth.currentUser) return;
     
     const interval = setInterval(() => {
         if (documents.length > 0) {
             forceCloudBackup(true);
         }
     }, cloudSyncFrequency);
     
     return () => clearInterval(interval);
  }, [documents, cloudSyncFrequency]);`;

code = code.replace(target, '');

fs.writeFileSync('src/components/Notepad.tsx', code);
