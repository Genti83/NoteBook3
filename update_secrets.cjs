const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

// 1. Rename PIN to Password in strings
code = code.replace(/PIN/g, 'Password');
code = code.replace(/Pin /g, 'Password ');
code = code.replace(/pinModal/g, 'passwordModal');
code = code.replace(/pinInput/g, 'passwordInput');
code = code.replace(/setPinModal/g, 'setPasswordModal');
code = code.replace(/setPinInput/g, 'setPasswordInput');
code = code.replace(/Kodi PIN/g, 'Fjalëkalimi');
code = code.replace(/kod PIN/g, 'fjalëkalim');
code = code.replace(/kodin PIN/g, 'fjalëkalimin');
code = code.replace(/PIN-in/g, 'Password-in');

// 2. Enhance the "Sekrete" state and structure
// Let's find the state definition for blueText
const blueTextStateTarget = `const [blueText, setBlueText] = useState('');`;
const blueTextStateRep = `const [blueText, setBlueText] = useState('');
  const [secretList, setSecretList] = useState<{id: string, text: string, done: boolean}[]>([]);`;
code = code.replace(blueTextStateTarget, blueTextStateRep);

fs.writeFileSync('src/components/Notepad.tsx', code);
