const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const targetEvent = `  useEffect(() => {
     latestDocsRef.current = documents;
     
     // Nese kemi nje dokument hapur dhe ai eshte perditesuar nga Cloud
     if (activeDocId && documents) {
         const currentViewingDoc = documents.find(d => d.id === activeDocId);
         if (currentViewingDoc) {
             // Kontrollojme nese ka ndryshime qe nuk jane ne local rows
             // P.sh., nese updatedAt eshte me e re. Qe te mos bllokojme editimin, e bejme update.
             // Mirepo, duke thene qe auto-save behet pas 2 sekondash, nese cloud sjell nje updatedAt me te ri, 
             // do te thote qe vjen nga nje pajisje tjeter ose cloud.
             // Ne mund thjesht ta leme ashtu per thjeshtesi ose te sinkronizojme rows:
             // Por per momentin, update rows nese rows kane gjatesi te ndryshme ose dicka te theksuar.
         }
     }
  }, [documents, activeDocId]);`;

const replacementEvent = `  useEffect(() => {
     latestDocsRef.current = documents;
  }, [documents]);

  useEffect(() => {
     const handleCloudUpdate = (e: any) => {
         const docObj = e.detail;
         if (docObj && docObj.id === activeDocIdRef.current) {
             setRows(docObj.rows);
             setHeaders(docObj.headers);
             setTitle(docObj.title);
             showToast("Dokumenti u përditësua nga Cloud.");
         }
     };
     window.addEventListener('cloud-doc-updated', handleCloudUpdate);
     return () => window.removeEventListener('cloud-doc-updated', handleCloudUpdate);
  }, []);`;

code = code.replace(targetEvent, replacementEvent);
fs.writeFileSync('src/components/Notepad.tsx', code);
