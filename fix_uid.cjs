const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

// A helper function to get the current UID
const helper = `
  const getActiveUid = () => {
     return localStorage.getItem('grid_notepad_custom_uid') || (auth.currentUser ? auth.currentUser.uid : null);
  };
`;
// Insert helper after color themes
code = code.replace(/const COLOR_THEMES = \{[\s\S]+?\};\n/, match => match + helper);

// Replace auth.currentUser.uid
code = code.replace(/auth\.currentUser!\.uid/g, 'getActiveUid()!');
code = code.replace(/auth\.currentUser\.uid/g, 'getActiveUid()!');
code = code.replace(/currentUser\.uid/g, 'getActiveUid()!');

// Replace u.uid in onAuthStateChanged
code = code.replace(/where\('userId', '==', u\.uid\)/g, "where('userId', '==', getActiveUid()!)");
code = code.replace(/userId: u\.uid/g, "userId: getActiveUid()!");

// In checkAutoLogin, replace signInWithEmailAndPassword with our new logic
const oldAutoLogin = `    if (savedEmail && savedPwd && !auth.currentUser) {
        signInWithEmailAndPassword(auth, savedEmail, savedPwd).catch(() => {});
    }`;
const newAutoLogin = `    if (savedEmail && savedPwd && !auth.currentUser) {
        import('firebase/auth').then(({ signInAnonymously }) => signInAnonymously(auth).catch(() => {}));
    }`;
code = code.replace(oldAutoLogin, newAutoLogin);

fs.writeFileSync('src/components/Notepad.tsx', code);
