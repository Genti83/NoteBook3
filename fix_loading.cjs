const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const targetStr = `const { user, loginWithGoogle: hookGoogleLogin, loginWithEmail: hookEmailLogin, registerWithEmail: hookEmailRegister, logout: hookLogout } = useFirebase();`;
const replacementStr = `const { user, loading, loginWithGoogle: hookGoogleLogin, loginWithEmail: hookEmailLogin, registerWithEmail: hookEmailRegister, logout: hookLogout } = useFirebase();`;

if (code.includes(targetStr)) {
    code = code.replace(targetStr, replacementStr);
    fs.writeFileSync('src/components/Notepad.tsx', code);
    console.log("Fixed missing loading prop!");
}
