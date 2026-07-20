const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const targetState = `const [catalogSearch, setCatalogSearch] = useState('');`;
const replacementState = `const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  
  const allAvailableTags = Array.from(new Set(documents.flatMap(doc => doc.tags || []))).sort();`;

code = code.replace(targetState, replacementState);

const targetFilter = `  const filteredDocs = documents.filter(doc => {
     if (!catalogSearch.trim()) return true;
     const q = catalogSearch.toLowerCase();
     if (doc.title.toLowerCase().includes(q)) return true;
     return doc.rows.some(r => 
        headers.some((_, c) => (r[\`col\${c+1}\`] || '').toString().toLowerCase().includes(q))
     );
  });`;

const replacementFilter = `  const filteredDocs = documents.filter(doc => {
     if (selectedTag && !(doc.tags || []).includes(selectedTag)) return false;
     if (!catalogSearch.trim()) return true;
     const q = catalogSearch.toLowerCase();
     if (doc.title.toLowerCase().includes(q)) return true;
     return doc.rows.some(r => 
        headers.some((_, c) => (r[\`col\${c+1}\`] || '').toString().toLowerCase().includes(q))
     );
  });`;

code = code.replace(targetFilter, replacementFilter);

fs.writeFileSync('src/components/Notepad.tsx', code);
