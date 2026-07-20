const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const targetUpdateDocState = `  const updateActiveDocumentState = (newTitle: string, newRows: GridRow[], newHeaders: string[], newWidths: number[] = columnWidths) => {
     let updatedDocs = [...documents];
     const existingDocIndex = updatedDocs.findIndex(d => d.id === activeDocId);
     
     const updatedDoc = {
        id: activeDocId!,
        title: newTitle,
        createdAt: existingDocIndex >= 0 ? updatedDocs[existingDocIndex].createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        headers: newHeaders,
        columnWidths: newWidths,
        rows: newRows
     };`;

const replacementUpdateDocState = `  const updateActiveDocumentState = (newTitle: string, newRows: GridRow[], newHeaders: string[], newWidths: number[] = columnWidths, newTags: string[] = activeTags) => {
     let updatedDocs = [...documents];
     const existingDocIndex = updatedDocs.findIndex(d => d.id === activeDocId);
     
     const updatedDoc = {
        id: activeDocId!,
        title: newTitle,
        createdAt: existingDocIndex >= 0 ? updatedDocs[existingDocIndex].createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        headers: newHeaders,
        columnWidths: newWidths,
        rows: newRows,
        tags: newTags
     };`;

code = code.replace(targetUpdateDocState, replacementUpdateDocState);
fs.writeFileSync('src/components/Notepad.tsx', code);
