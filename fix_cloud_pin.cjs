const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const target = `const blueRef = doc(db, 'settings', currentUser.uid);
        await setDoc(blueRef, { blueText: blueText, userId: currentUser.uid });`;

const replacement = `const blueRef = doc(db, 'settings', currentUser.uid);
        await setDoc(blueRef, { 
           blueText: blueText, 
           userId: currentUser.uid,
           pin: localStorage.getItem('grid_notepad_pin') || null
        });`;

code = code.replace(target, replacement);

fs.writeFileSync('src/components/Notepad.tsx', code);
