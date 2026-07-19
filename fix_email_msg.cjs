const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const target = `if (err.code === 'auth/operation-not-allowed') msg = "Hyrja me Email është e çaktivizuar. Kyçuni me Google ose aktivizoni Emailin në Firebase Console.";`;
const replacement = `if (err.code === 'auth/operation-not-allowed') msg = "Kujdes: Duhet të aktivizoni Email/Password në Firebase Console -> Authentication -> Sign-in method -> Enable.";`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/Notepad.tsx', code);
