const fs = require('fs');
let code = fs.readFileSync('src/hooks/useFirebase.ts', 'utf8');

const targetFallback = `          } catch(nativeErr: any) {
             addDebugLog('Native plugin failed (' + nativeErr.message + '), falling back to web flow...');
             const provider = new GoogleAuthProvider();
             provider.setCustomParameters({ prompt: 'select_account' });
             await signInWithRedirect(auth, provider);
             return null;
          }`;

const replacementFallback = `          } catch(nativeErr: any) {
             addDebugLog('Native plugin failed (' + nativeErr.message + '), falling back to web popup...');
             const provider = new GoogleAuthProvider();
             provider.setCustomParameters({ prompt: 'select_account' });
             try {
                const res = await signInWithPopup(auth, provider);
                addDebugLog('Fallback popup login success: ' + res.user.email);
                return res.user;
             } catch (popupErr: any) {
                addDebugLog('Fallback popup failed, trying redirect: ' + popupErr.message);
                await signInWithRedirect(auth, provider);
                return null;
             }
          }`;

if (code.includes('Native plugin failed')) {
    code = code.replace(targetFallback, replacementFallback);
    fs.writeFileSync('src/hooks/useFirebase.ts', code);
    console.log("Updated native auth fallback!");
}
