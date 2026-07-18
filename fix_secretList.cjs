const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const stateTarget = `const [blueText, setBlueText] = useState('');`;
const stateRep = `const [blueText, setBlueText] = useState('');
  const [secretList, setSecretList] = useState<{id: string, text: string, done: boolean}[]>([]);`;
code = code.replace(stateTarget, stateRep);

const loadTarget = `    const savedOrange = localStorage.getItem('grid_notepad_blue');
    if (savedOrange) {
       setBlueText(savedOrange);
    }`;
const loadRep = `    const savedOrange = localStorage.getItem('grid_notepad_blue');
    if (savedOrange) {
       setBlueText(savedOrange);
    }
    const savedSecretList = localStorage.getItem('grid_notepad_secret_list');
    if (savedSecretList) {
       try { setSecretList(JSON.parse(savedSecretList)); } catch(e){}
    }`;
code = code.replace(loadTarget, loadRep);

fs.writeFileSync('src/components/Notepad.tsx', code);
