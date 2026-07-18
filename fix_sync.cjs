const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const saveTarget = `        const t = setTimeout(() => {
           const blueRef = doc(db, 'settings', auth.currentUser!.uid);
           setDoc(blueRef, { blueText, userId: auth.currentUser!.uid, pin: localStorage.getItem('grid_notepad_pin') || null }, { merge: true }).catch(()=>{});
        }, 1500);
        return () => clearTimeout(t);
     }
  }, [blueText]);`;

const saveRep = `        const t = setTimeout(() => {
           const blueRef = doc(db, 'settings', auth.currentUser!.uid);
           setDoc(blueRef, { 
               blueText, 
               secretList,
               userId: auth.currentUser!.uid, 
               pin: localStorage.getItem('grid_notepad_pin') || null 
           }, { merge: true }).catch(()=>{});
        }, 1500);
        return () => clearTimeout(t);
     }
  }, [blueText, secretList]);`;

const forceSaveTarget = `        const blueRef = doc(db, 'settings', currentUser.uid);
        await setDoc(blueRef, { 
           blueText: blueText, 
           userId: currentUser.uid,
           pin: localStorage.getItem('grid_notepad_pin') || null
        });`;
const forceSaveRep = `        const blueRef = doc(db, 'settings', currentUser.uid);
        await setDoc(blueRef, { 
           blueText: blueText, 
           secretList: secretList,
           userId: currentUser.uid,
           pin: localStorage.getItem('grid_notepad_pin') || null
        }, { merge: true });`;

const loadCloudTarget = `             const bt = data.blueText || '';
             setBlueText(bt);
             localStorage.setItem('grid_notepad_blue', bt);
             
             if (data.pin) {`;
const loadCloudRep = `             const bt = data.blueText || '';
             setBlueText(bt);
             localStorage.setItem('grid_notepad_blue', bt);
             
             const sl = data.secretList || [];
             setSecretList(sl);
             localStorage.setItem('grid_notepad_secret_list', JSON.stringify(sl));
             
             if (data.pin) {`;

code = code.replace(saveTarget, saveRep);
code = code.replace(forceSaveTarget, forceSaveRep);
code = code.replace(loadCloudTarget, loadCloudRep);

fs.writeFileSync('src/components/Notepad.tsx', code);
