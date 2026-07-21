const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const targetGistBtn = `                         <button onClick={() => {
                            if (!gistId) return showToast("Nuk ka Gist ID. Ruani një herë dokumentet fillimisht.");
                            window.open(\`https://gist.github.com/\${gistId}\`, "_blank");
                         }} className={\`w-full flex justify-center items-center gap-2 px-4 py-2 font-bold text-xs rounded-lg transition-colors border shadow-sm \${isDark ? "bg-zinc-700 hover:bg-zinc-600 text-white border-transparent" : "bg-zinc-200 hover:bg-zinc-300 text-zinc-900 border-transparent"}\`}>
                            <Eye className="w-4 h-4" /> Shiko Dokumentet Online (Gist)
                         </button>`;

const replacementGistBtn = `                         <button onClick={viewGistContent} className={\`w-full flex justify-center items-center gap-2 px-4 py-2 font-bold text-xs rounded-lg transition-colors border shadow-sm \${isDark ? "bg-zinc-700 hover:bg-zinc-600 text-white border-transparent" : "bg-zinc-200 hover:bg-zinc-300 text-zinc-900 border-transparent"}\`}>
                            <Eye className="w-4 h-4" /> Shiko Dokumentet Online (Gist)
                         </button>`;

code = code.replace(targetGistBtn, replacementGistBtn);

const targetStates = `  const [gistToken, setGistToken] = useState(localStorage.getItem('grid_notepad_gist_token') || '');
  const [gistId, setGistId] = useState(localStorage.getItem('grid_notepad_gist_id') || '');`;

const replacementStates = `  const [gistToken, setGistToken] = useState(localStorage.getItem('grid_notepad_gist_token') || '');
  const [gistId, setGistId] = useState(localStorage.getItem('grid_notepad_gist_id') || '');
  const [gistViewerModal, setGistViewerModal] = useState(false);
  const [gistViewerContent, setGistViewerContent] = useState<string | null>(null);`;

code = code.replace(targetStates, replacementStates);

const targetGistFunctions = `  const loadFromGist = async () => {`;

const replacementGistFunctions = `  const viewGistContent = async () => {
      if (!gistId) return showToast("Nuk ka Gist ID. Ruani një herë dokumentet fillimisht.");
      showToast("Duke hapur dokumentin Gist...");
      try {
          const res = await fetch(\`https://api.github.com/gists/\${gistId}\`, {
             headers: gistToken ? {
                'Authorization': \`token \${gistToken}\`,
                'Accept': 'application/vnd.github.v3+json'
             } : undefined
          });
          if (!res.ok) throw new Error("Gabim gjatë ngarkimit. Gist ID i pavlefshëm.");
          const data = await res.json();
          const file = data.files['grid_notepad_backup.json'];
          if (!file) throw new Error("Skedari nuk u gjet në këtë Gist.");
          
          const content = file.truncated ? await (await fetch(file.raw_url)).text() : file.content;
          setGistViewerContent(content);
          setGistViewerModal(true);
      } catch (err: any) {
          showToast(err.message);
      }
  };

  const loadFromGist = async () => {`;

code = code.replace(targetGistFunctions, replacementGistFunctions);

const targetModals = `      {/* CLOUD MODAL */}`;
const replacementModals = `      {/* GIST VIEWER MODAL */}
      {gistViewerModal && (
          <div className="fixed inset-0 z-[100] flex items-start pt-8 pb-32 md:py-8 md:items-center justify-center bg-black/60 p-4 animate-in fade-in overflow-y-auto">
             <div className={\`max-w-4xl w-full max-h-[85vh] flex flex-col rounded-2xl shadow-2xl border \${isDark ? "bg-zinc-900 border-zinc-700" : "bg-white border-zinc-300"}\`}>
                <div className={\`flex justify-between items-center p-5 border-b \${isDark ? "border-zinc-800" : "border-zinc-200"}\`}>
                   <h3 className={\`text-xl font-bold flex items-center gap-2 \${textColor}\`}>
                      <Github className="w-6 h-6 text-zinc-900 dark:text-white" /> Dokumenti Online (Gist)
                   </h3>
                   <button onClick={() => setGistViewerModal(false)} className="p-2 bg-transparent text-zinc-500 hover:text-red-500 transition-colors">
                      <X className="w-5 h-5"/>
                   </button>
                </div>
                <div className="p-0 overflow-y-auto flex-1 flex flex-col bg-zinc-950 text-green-400 font-mono text-xs md:text-sm">
                   <pre className="p-4 overflow-x-auto whitespace-pre-wrap">
                      {gistViewerContent ? JSON.stringify(JSON.parse(gistViewerContent), null, 2) : 'Duke ngarkuar...'}
                   </pre>
                </div>
                <div className={\`p-4 border-t flex justify-end gap-3 \${isDark ? "bg-zinc-800/50 border-zinc-800" : "bg-zinc-50 border-zinc-200"}\`}>
                    <button onClick={() => setGistViewerModal(false)} className={\`px-4 py-2 font-medium rounded-lg transition-colors border \${isDark ? "bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300" : "bg-white hover:bg-zinc-100 border-zinc-300 text-zinc-700"}\`}>
                        Mbyll
                    </button>
                </div>
             </div>
          </div>
      )}

      {/* CLOUD MODAL */}`;

code = code.replace(targetModals, replacementModals);

fs.writeFileSync('src/components/Notepad.tsx', code);
