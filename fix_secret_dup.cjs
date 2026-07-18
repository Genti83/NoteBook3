const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const target = `const [blueText, setBlueText] = useState('');
  const [secretList, setSecretList] = useState<{id: string, text: string, done: boolean}[]>([]);
  const [secretList, setSecretList] = useState<{id: string, text: string, done: boolean}[]>([]);`;

const rep = `const [blueText, setBlueText] = useState('');
  const [secretList, setSecretList] = useState<{id: string, text: string, done: boolean}[]>([]);`;

code = code.replace(target, rep);

fs.writeFileSync('src/components/Notepad.tsx', code);
