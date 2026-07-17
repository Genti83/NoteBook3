const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

code = code.replace(`  const forceCloudBackup = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    setIsSaving(true);
    setAutoSaveMsg('Po ngarkon në Cloud...');`, `  const forceCloudBackup = async (silent = false) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    setIsSaving(true);
    if (!silent) setAutoSaveMsg('Po ngarkon në Cloud...');`);

code = code.replace(`    setIsSaving(false);
    if (success) {
        setAutoSaveMsg('Ngarkuar!');
        showToast("Të gjitha dokumentet u ruajtën në Cloud!");
    } else {
        setAutoSaveMsg('Gabim!');
        showToast("Pati një problem gjatë ngarkimit në Cloud.");
    }`, `    setIsSaving(false);
    if (success) {
        setAutoSaveMsg('Ngarkuar!');
        if (!silent) showToast("Të gjitha dokumentet u ruajtën në Cloud!");
    } else {
        setAutoSaveMsg('Gabim!');
        if (!silent) showToast("Pati një problem gjatë ngarkimit në Cloud.");
    }`);

code = code.replace(`     const interval = setInterval(() => {
         if (documents.length > 0) {
             forceCloudBackup();
         }
     }, cloudSyncFrequency);`, `     const interval = setInterval(() => {
         if (documents.length > 0) {
             forceCloudBackup(true);
         }
     }, cloudSyncFrequency);`);

fs.writeFileSync('src/components/Notepad.tsx', code);
