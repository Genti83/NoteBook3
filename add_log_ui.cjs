const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const targetState = `  const [aiChatResponse, setAiChatResponse] = useState('');`;
const replacementState = `  const [aiChatResponse, setAiChatResponse] = useState('');
  const [debugLogsModal, setDebugLogsModal] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  
  useEffect(() => {
     const updateLogs = () => {
         try {
             setDebugLogs(JSON.parse(localStorage.getItem('grid_notepad_debug_logs') || '[]'));
         } catch(e){}
     };
     window.addEventListener('debug-log-updated', updateLogs);
     updateLogs();
     return () => window.removeEventListener('debug-log-updated', updateLogs);
  }, []);`;

code = code.replace(targetState, replacementState);

const targetLoginBottom = `                   </p>
                </form>
             </div>
          </div>
      )}`;

const replacementLoginBottom = `                   </p>
                   <button type="button" onClick={() => setDebugLogsModal(true)} className="text-xs text-zinc-500 hover:text-accent-500 mt-4 underline text-center w-full">
                       Shiko gabimet e lidhjes (Logs)
                   </button>
                </form>
             </div>
          </div>
      )}
      
      {/* DEBUG LOGS MODAL */}
      {debugLogsModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
             <div className={\`max-w-xl w-full p-6 rounded-2xl shadow-2xl border flex flex-col \${isDark ? "bg-zinc-900 border-zinc-700" : "bg-white border-zinc-300"}\`} style={{ maxHeight: '80vh' }}>
                <div className="flex justify-between items-center mb-4">
                   <h3 className={\`text-lg font-bold \${isDark ? "text-white" : "text-zinc-900"}\`}>Sistemi i Log-eve (Problemet e lidhjes)</h3>
                   <button onClick={() => setDebugLogsModal(false)} className="p-2 bg-transparent text-zinc-500 hover:text-red-500 transition-colors">
                      <X className="w-5 h-5"/>
                   </button>
                </div>
                <div className={\`flex-1 overflow-y-auto p-3 rounded border text-xs font-mono whitespace-pre-wrap \${isDark ? "bg-zinc-950 border-zinc-800 text-green-400" : "bg-zinc-100 border-zinc-300 text-green-700"}\`}>
                    {debugLogs.length === 0 ? "Nuk ka asnjë problem të regjistruar deri tani." : debugLogs.join('\\n')}
                </div>
                <div className="mt-4 flex justify-end">
                    <button onClick={() => { localStorage.removeItem('grid_notepad_debug_logs'); setDebugLogs([]); }} className="px-4 py-2 bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white rounded-lg text-sm font-bold transition-colors">
                       Pastro
                    </button>
                </div>
             </div>
          </div>
      )}`;

code = code.replace(targetLoginBottom, replacementLoginBottom);

const targetMenuBtn = `                  <button onClick={() => setShowOptionsMenu(!showOptionsMenu)} className={\`p-1.5 sm:p-2 rounded-lg transition-colors \${showOptionsMenu ? "bg-accent-500 text-white" : isDark ? "text-zinc-400 hover:bg-zinc-800" : "text-zinc-600 hover:bg-zinc-200"}\`}>`;

const replacementMenuBtn = `                  <button onClick={() => setDebugLogsModal(true)} className={\`p-1.5 sm:p-2 rounded-lg transition-colors \${isDark ? "text-zinc-400 hover:bg-zinc-800" : "text-zinc-600 hover:bg-zinc-200"}\`} title="Logs">
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  </button>
                  <button onClick={() => setShowOptionsMenu(!showOptionsMenu)} className={\`p-1.5 sm:p-2 rounded-lg transition-colors \${showOptionsMenu ? "bg-accent-500 text-white" : isDark ? "text-zinc-400 hover:bg-zinc-800" : "text-zinc-600 hover:bg-zinc-200"}\`}>`;

code = code.replace(targetMenuBtn, replacementMenuBtn);

fs.writeFileSync('src/components/Notepad.tsx', code);
