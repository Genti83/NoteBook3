const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const targetAuthError = `      } catch (err: any) {
          let msg = "Gabim: " + err.message;
          if (err.code === 'auth/email-already-in-use') {
             setIsSignUp(false);
             showToast("Kjo llogari ekziston tashmë! Provo të hysh (Login) ose përdor Google.");
             return;
          }
          if (err.code === 'auth/weak-password') msg = "Fjalëkalimi duhet të ketë të paktën 6 karaktere.";
          if (err.code === 'auth/invalid-email') msg = "Formati i emailit është i pasaktë.";
          if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
             msg = "Kredenciale të gabuara! Nëse jeni regjistruar me Google, klikoni butonin Google.";
          }
          if (err.code === 'auth/operation-not-allowed') {
             msg = "Ky opsion nuk është i lejuar. Për ta rregulluar: Shko tek Firebase Console -> Authentication -> Sign-in method -> Aktivizo 'Email/Password'.";
          }
          
          showToast(msg);
      }`;

const replacementAuthError = `      } catch (err: any) {
          console.error("Email auth err:", err);
          let msg = "Gabim: " + err.message;
          if (err.code === 'auth/email-already-in-use') {
             setIsSignUp(false);
             showToast("Kjo llogari ekziston tashmë! Provo të hysh (Login) ose përdor Google.");
             return;
          }
          if (err.code === 'auth/weak-password') msg = "Fjalëkalimi duhet të ketë të paktën 6 karaktere.";
          if (err.code === 'auth/invalid-email') msg = "Formati i emailit është i pasaktë.";
          if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
             msg = "Kredenciale të gabuara! Nëse jeni regjistruar me Google, klikoni butonin Google.";
          }
          if (err.code === 'auth/operation-not-allowed') {
             msg = "Email login is disabled in Firebase! Ju lutem aktivizoni 'Email/Password' tek Firebase Console -> Authentication -> Sign-in method.";
          }
          if (err.code === 'auth/network-request-failed') {
             msg = "Nuk ka lidhje interneti ose u bllokua kërkesa! Sigurohuni që pajisja ka akses.";
          }
          
          showToast(msg);
      }`;

if (code.includes('if (err.code === \'auth/email-already-in-use\') {')) {
    code = code.replace(targetAuthError, replacementAuthError);
    fs.writeFileSync('src/components/Notepad.tsx', code);
    console.log("Email errors fixed!");
}
