const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const targetUseEffect = `  useEffect(() => {
     if (user) {
         const fetchCloudData = async () => {
           try {
               const q = query(collection(db, 'documents'), where('userId', '==', localStorage.getItem('grid_notepad_custom_uid') || user.uid));
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
                               await setDoc(doc(db, 'documents', docObj.id), { ...docObj, userId: localStorage.getItem('grid_notepad_custom_uid') || user.uid });
                           } catch (e) { console.error("Auto sync push error", e); }
                       }
                   });
                   
                   return newMerged;
               });
           } catch (err) {
               console.error("Auto sync fetch error", err);
           }
         };
         fetchCloudData();
         
         const fetchSettings = async () => {
             try {
                 const settingsRef = doc(db, 'settings', localStorage.getItem('grid_notepad_custom_uid') || user.uid);
                 const d = await getDoc(settingsRef);
                 if (d.exists()) {
                     const data = d.data();
                     if (data.blueText && !localStorage.getItem('grid_notepad_blue')) {
                         setBlueText(data.blueText);
                     }
                     if (data.secretList && !localStorage.getItem('grid_notepad_secret_list')) {
                         setSecretList(data.secretList);
                     }
                 }
             } catch(e) {}
         };
         fetchSettings();
     }
  }, [user]);`;

const replacementUseEffect = `  useEffect(() => {
     if (user) {
         const activeUid = localStorage.getItem('grid_notepad_custom_uid') || user.uid;
         const q = query(collection(db, 'documents'), where('userId', '==', activeUid));
         
         const unsubscribe = onSnapshot(q, (snapshot) => {
             const fetched: GridDocument[] = [];
             snapshot.forEach(s => {
                const data = s.data();
                if (data) fetched.push(data as GridDocument);
             });
             
             setCloudDocs(fetched);
             
             setDocuments(prevLocal => {
                 const mergedMap = new Map<string, GridDocument>();
                 let hasChanges = false;
                 
                 prevLocal.forEach(d => mergedMap.set(d.id, d));
                 
                 fetched.forEach(d => {
                     const existing = mergedMap.get(d.id);
                     if (!existing || new Date(d.updatedAt) > new Date(existing.updatedAt)) {
                         mergedMap.set(d.id, d);
                         hasChanges = true;
                     }
                 });
                 
                 const newMerged = Array.from(mergedMap.values()).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
                 
                 if (hasChanges) {
                     localStorage.setItem('grid_notepad_documents_v2', JSON.stringify(newMerged));
                 }
                 
                 // Push any newer local docs to cloud silently
                 newMerged.forEach(async (docObj) => {
                     const cloudVersion = fetched.find(c => c.id === docObj.id);
                     if (!cloudVersion || new Date(docObj.updatedAt) > new Date(cloudVersion.updatedAt)) {
                         try {
                             await setDoc(doc(db, 'documents', docObj.id), { ...docObj, userId: activeUid });
                         } catch (e) { console.error("Auto sync push error", e); }
                     }
                 });
                 
                 return newMerged;
             });
         }, (err) => {
             console.error("Firestore real-time sync error:", err);
         });
         
         const settingsRef = doc(db, 'settings', activeUid);
         const unsubSettings = onSnapshot(settingsRef, (docSnap) => {
             if (docSnap.exists()) {
                 const data = docSnap.data();
                 if (data.blueText) setBlueText(data.blueText);
                 if (data.secretList) setSecretList(data.secretList);
             }
         });

         return () => {
             unsubscribe();
             unsubSettings();
         };
     }
  }, [user]);`;

code = code.replace(targetUseEffect, replacementUseEffect);
fs.writeFileSync('src/components/Notepad.tsx', code);
