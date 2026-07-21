const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const targetActiveDoc = `  const [activeDocId, setActiveDocId] = useState<string | null>(null);`;
const replacementActiveDoc = `  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const activeDocIdRef = useRef<string | null>(null);
  useEffect(() => { activeDocIdRef.current = activeDocId; }, [activeDocId]);`;

code = code.replace(targetActiveDoc, replacementActiveDoc);

const targetOnSnapshot = `                 // Push any newer local docs to cloud silently`;
const replacementOnSnapshot = `                 
                 // Nese kemi nje dokument hapur, e perditesojme nese erdhi i ri nga cloud
                 const currActiveId = activeDocIdRef.current;
                 if (currActiveId) {
                     const currentViewingDoc = newMerged.find(x => x.id === currActiveId);
                     const oldViewingDoc = prevLocal.find(x => x.id === currActiveId);
                     if (currentViewingDoc && oldViewingDoc && currentViewingDoc.updatedAt !== oldViewingDoc.updatedAt) {
                         // We use a custom event or a setState callback workaround, but React states inside prevLocal setter 
                         // shouldn't trigger other state updates directly if possible, or they can.
                         // P.sh.:
                         setTimeout(() => {
                             window.dispatchEvent(new CustomEvent('cloud-doc-updated', { detail: currentViewingDoc }));
                         }, 10);
                     }
                 }

                 // Push any newer local docs to cloud silently`;

code = code.replace(targetOnSnapshot, replacementOnSnapshot);
fs.writeFileSync('src/components/Notepad.tsx', code);
