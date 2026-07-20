const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const targetOldAuth = `    const unsub = onAuthStateChanged(auth, async (u) => {
       setUser(u);
       if (u) {
           try {
               const q = query(collection(db, 'documents'), where('userId', '==', localStorage.getItem('grid_notepad_custom_uid') || u.uid));
               const snaps = await getDocs(q);
               const fetched: GridDocument[] = [];
               snaps.forEach(s => {
                  const data = s.data();
                  if (data) fetched.push(data as GridDocument);
               });
               
               setDocuments(prevLocal => {
                   const mergedMap = new Map<string, GridDocument>();
                   prevLocal.forEach(d => mergedMap.set(d.id, d));
                   
                   fetched.forEach(d => {
                       const existing = mergedMap.get(d.id);
                       if (!existing || new Date(d.updatedAt) > new Date(existing.updatedAt)) {
                           mergedMap.set(d.id, d);
                       }
                   });
                   
                   const newMerged = Array.from(mergedMap.values()).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
                   localStorage.setItem('grid_notepad_documents_v2', JSON.stringify(newMerged));
                   
                   // Push any newer local docs to cloud silently
                   newMerged.forEach(async (docObj) => {
                       const cloudVersion = fetched.find(c => c.id === docObj.id);
                       if (!cloudVersion || new Date(docObj.updatedAt) > new Date(cloudVersion.updatedAt)) {
                           try {
                               await setDoc(doc(db, 'documents', docObj.id), { ...docObj, userId: localStorage.getItem('grid_notepad_custom_uid') || u.uid });
                           } catch (e) { console.error("Auto sync push error", e); }
                       }
                   });
                   
                   return newMerged;
               });
           } catch (err) {
               console.error("Auto sync fetch error", err);
           }
       }
    });
    return () => unsub();`;

const replacementOldAuth = `// Auth data fetching now driven by useFirebase hook user state`;

code = code.replace(targetOldAuth, replacementOldAuth);

fs.writeFileSync('src/components/Notepad.tsx', code);
