const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const target1 = `setDoc(blueRef, { blueText, userId: auth.currentUser!.uid }).catch(()=>{});`;
const rep1 = `setDoc(blueRef, { blueText, userId: auth.currentUser!.uid, pin: localStorage.getItem('grid_notepad_pin') || null }, { merge: true }).catch(()=>{});`;

const target2 = `setDoc(doc(db, 'settings', auth.currentUser.uid), { blueText: '', userId: auth.currentUser.uid }).catch(() => {});`;
const rep2 = `setDoc(doc(db, 'settings', auth.currentUser.uid), { blueText: '', userId: auth.currentUser.uid }, { merge: false }).catch(() => {});`;

code = code.replace(target1, rep1);
code = code.replace(target2, rep2);

fs.writeFileSync('src/components/Notepad.tsx', code);
