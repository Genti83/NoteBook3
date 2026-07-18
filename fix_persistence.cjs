const fs = require('fs');
let code = fs.readFileSync('src/lib/firebase.ts', 'utf8');

code = code.replace('browserLocalPersistence', 'indexedDBLocalPersistence');
code = code.replace('browserLocalPersistence', 'indexedDBLocalPersistence');

fs.writeFileSync('src/lib/firebase.ts', code);
