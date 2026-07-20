const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const targetStateTitle = `  const [title, setTitle] = useState(t('Shënim i Paemërtuar', 'Untitled Note'));`;
const replacementStateTitle = `  const [title, setTitle] = useState(t('Shënim i Paemërtuar', 'Untitled Note'));
  const [activeTags, setActiveTags] = useState<string[]>([]);`;

code = code.replace(targetStateTitle, replacementStateTitle);

const targetCreateNew = `  const createNewDocument = () => {
    setActiveDocId(\`doc-\${Date.now()}\`);
    setTitle(t('Shënim i Paemërtuar', 'Untitled Note'));
    setRows(getEmptyRows());
    setHeaders([t('Kolona 1', 'Column 1'), t('Kolona 2', 'Column 2'), t('Kolona 3', 'Column 3'), t('Kolona 4', 'Column 4')]);
    setSelectedRows(new Set());
  };`;

const replacementCreateNew = `  const createNewDocument = () => {
    setActiveDocId(\`doc-\${Date.now()}\`);
    setTitle(t('Shënim i Paemërtuar', 'Untitled Note'));
    setActiveTags([]);
    setRows(getEmptyRows());
    setHeaders([t('Kolona 1', 'Column 1'), t('Kolona 2', 'Column 2'), t('Kolona 3', 'Column 3'), t('Kolona 4', 'Column 4')]);
    setSelectedRows(new Set());
  };`;
code = code.replace(targetCreateNew, replacementCreateNew);

const targetOpen = `  const openDocument = (doc: GridDocument) => {
    setActiveDocId(doc.id);
    setTitle(doc.title);`;

const replacementOpen = `  const openDocument = (doc: GridDocument) => {
    setActiveDocId(doc.id);
    setTitle(doc.title);
    setActiveTags(doc.tags || []);`;

code = code.replace(targetOpen, replacementOpen);

fs.writeFileSync('src/components/Notepad.tsx', code);
