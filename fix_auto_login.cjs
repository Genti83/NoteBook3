const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const targetAutoLogin = `    const savedPwd = localStorage.getItem('grid_notepad_saved_pwd');
    if (savedEmail && savedPwd && !auth.currentUser) {
        import('firebase/auth').then(({ signInAnonymously }) => signInAnonymously(auth).catch(() => {}));
    }`;

const replacementAutoLogin = `    const savedPwd = localStorage.getItem('grid_notepad_saved_pwd');
    if (savedEmail && savedPwd && !auth.currentUser) {
        signInWithEmailAndPassword(auth, savedEmail, savedPwd).catch(() => {});
    }`;

code = code.replace(targetAutoLogin, replacementAutoLogin);

fs.writeFileSync('src/components/Notepad.tsx', code);
