const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const targetStateTitle = `  const [title, setTitle] = useState('Shënim i Paemërtuar');`;
const replacementStateTitle = `  const [title, setTitle] = useState('Shënim i Paemërtuar');
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

const targetUpdateState = `  const updateActiveDocumentState = (newTitle: string, newRows: GridRow[], newHeaders: string[], newColWidths?: number[]) => {
     const updatedDocs = documents.map(d => {
        if (d.id === activeDocId) {
            return { ...d, title: newTitle, rows: newRows, headers: newHeaders, columnWidths: newColWidths || d.columnWidths, updatedAt: new Date().toISOString() };
        }
        return d;
     });
     setDocuments(updatedDocs);
     triggerAutoSave(updatedDocs);
  };`;

const replacementUpdateState = `  const updateActiveDocumentState = (newTitle: string, newRows: GridRow[], newHeaders: string[], newColWidths?: number[], newTags?: string[]) => {
     const updatedDocs = documents.map(d => {
        if (d.id === activeDocId) {
            return { ...d, title: newTitle, rows: newRows, headers: newHeaders, columnWidths: newColWidths || d.columnWidths, tags: newTags || d.tags || [], updatedAt: new Date().toISOString() };
        }
        return d;
     });
     setDocuments(updatedDocs);
     triggerAutoSave(updatedDocs);
  };`;

code = code.replace(targetUpdateState, replacementUpdateState);

fs.writeFileSync('src/components/Notepad.tsx', code);
