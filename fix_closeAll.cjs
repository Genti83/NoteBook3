const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const t = `      const closeAll = () => {
          setCloudModal(false);
          setAuthModal(false);
          setBackupModal(false);
          setPasswordModal(prev => ({...prev, isOpen: false}));
          setActiveCell(null);
          setSettingsModal(false);
          setBlueModal(false);
      };`;

const rep = `      const closeAll = () => {
          setCloudModal(false);
          setAuthModal(false);
          setBackupModal(false);
          setPasswordModal(prev => ({...prev, isOpen: false}));
          setActiveCell(null);
          setBlueModal(false);
      };`;

code = code.replace(t, rep);
fs.writeFileSync('src/components/Notepad.tsx', code);
