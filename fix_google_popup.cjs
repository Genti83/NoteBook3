const fs = require('fs');
let code = fs.readFileSync('src/hooks/useFirebase.ts', 'utf8');

const targetPopup = `    } else {
      const res = await signInWithPopup(auth, provider);
      return res.user;
    }`;

const replacementPopup = `    } else {
      try {
        const res = await signInWithPopup(auth, provider);
        return res.user;
      } catch (error: any) {
        if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
           // Fallback to redirect if popup fails
           await signInWithRedirect(auth, provider);
           return null;
        }
        throw error;
      }
    }`;

code = code.replace(targetPopup, replacementPopup);
fs.writeFileSync('src/hooks/useFirebase.ts', code);
