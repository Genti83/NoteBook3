const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const targetEvent = `             setRows(docObj.rows);
             setHeaders(docObj.headers);
             setTitle(docObj.title);
             showToast("Dokumenti u përditësua nga Cloud.");`;

const replacementEvent = `             setRows(docObj.rows);
             setHeaders(docObj.headers);
             setTitle(docObj.title);
             if (docObj.columnWidths) setColumnWidths(docObj.columnWidths);
             if (docObj.tags) setActiveTags(docObj.tags);
             showToast("Dokumenti u përditësua nga Cloud.");`;

code = code.replace(targetEvent, replacementEvent);
fs.writeFileSync('src/components/Notepad.tsx', code);
