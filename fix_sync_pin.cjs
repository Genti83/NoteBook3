const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const target = `const blueSnap = await getDoc(blueRef);
          if (blueSnap.exists()) {
             const bt = blueSnap.data().blueText || '';
             setBlueText(bt);
             localStorage.setItem('grid_notepad_blue', bt);
          }`;

const replacement = `const blueSnap = await getDoc(blueRef);
          if (blueSnap.exists()) {
             const data = blueSnap.data();
             const bt = data.blueText || '';
             setBlueText(bt);
             localStorage.setItem('grid_notepad_blue', bt);
             
             if (data.pin) {
                 localStorage.setItem('grid_notepad_pin', data.pin);
             }
          }`;

code = code.replace(target, replacement);

fs.writeFileSync('src/components/Notepad.tsx', code);
