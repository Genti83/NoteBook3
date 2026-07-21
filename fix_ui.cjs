const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const targetGistUI = `                   {/* GitHub Gist Backup */}
                   <div className={\`p-4 rounded-xl border \${isDark ? "bg-zinc-800/50 border-zinc-700" : "bg-zinc-50 border-zinc-200"}\`}>
                      <h4 className={\`font-bold mb-2 flex items-center gap-2 \${textColor}\`}>
                         <Github className="w-5 h-5 text-zinc-900 dark:text-white" /> GitHub Gist Sync
                      </h4>
                      <p className={\`text-sm mb-4 \${isDark ? "text-zinc-400" : "text-zinc-600"}\`}>
                        Ruani të dhënat tuaja drejtpërdrejt në llogarinë tuaj GitHub përmes Private Gist. <a href="https://github.com/settings/tokens/new?scopes=gist&description=Notepad+Backup" target="_blank" rel="noopener noreferrer" className="text-accent-500 underline">Krijo një Token këtu (Zgjidh opsionin 'gist')</a>.
                      </p>
                      
                      <div className="flex flex-col gap-3 mb-4">
                         <input 
                            type="password" 
                            placeholder="GitHub Personal Access Token" 
                            value={gistToken}
                            onChange={(e) => { setGistToken(e.target.value); localStorage.setItem('grid_notepad_gist_token', e.target.value); }}
                            className={\`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:border-accent-500 \${isDark ? "bg-zinc-900 border-zinc-700 text-white" : "bg-white border-zinc-300 text-zinc-900"}\`}
                         />
                         <input 
                            type="text" 
                            placeholder="Gist ID (Bosh për të krijuar të re)" 
                            value={gistId}
                            onChange={(e) => { setGistId(e.target.value); localStorage.setItem('grid_notepad_gist_id', e.target.value); }}
                            className={\`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:border-accent-500 \${isDark ? "bg-zinc-900 border-zinc-700 text-white" : "bg-white border-zinc-300 text-zinc-900"}\`}
                         />
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                         <button onClick={saveToGist} className={\`flex-1 flex justify-center items-center gap-2 px-4 py-2 font-medium rounded-lg transition-colors border \${isDark ? "bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-white" : "bg-zinc-900 hover:bg-zinc-800 text-white shadow-md border-transparent"}\`}>
                            <Upload className="w-4 h-4" /> Ruaj në Gist
                         </button>
                         <button onClick={loadFromGist} className={\`flex-1 flex justify-center items-center gap-2 px-4 py-2 font-medium rounded-lg transition-colors border \${isDark ? "bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300" : "bg-white hover:bg-zinc-100 border-zinc-300 text-zinc-700"}\`}>
                            <Download className="w-4 h-4" /> Ngarko nga Gist
                         </button>
                      </div>
                   </div>`;

const replacementGistUI = `                   {/* GitHub Gist Backup */}
                   <div className={\`p-4 rounded-xl border \${isDark ? "bg-zinc-800/50 border-zinc-700" : "bg-zinc-50 border-zinc-200"}\`}>
                      <h4 className={\`font-bold mb-2 flex items-center gap-2 \${textColor}\`}>
                         <Github className="w-5 h-5 text-zinc-900 dark:text-white" /> Cloud Gist (GitHub)
                      </h4>
                      <p className={\`text-sm mb-4 \${isDark ? "text-zinc-400" : "text-zinc-600"}\`}>
                        Platforma Gist Online: Ruani shënimet në profilin tuaj GitHub. 
                        <i>Shënim: GitHub nuk lejon më fjalëkalim, duhet të përdorni Token. </i> 
                        <a href="https://github.com/settings/tokens/new?scopes=gist&description=Notepad+Backup" target="_blank" rel="noopener noreferrer" className="text-accent-500 underline font-bold">Krijo Token (Klik Këtu)</a>.
                      </p>
                      
                      <div className="flex flex-col gap-3 mb-4">
                         <input 
                            type="password" 
                            placeholder="Personal Token (Si Fjalëkalim)" 
                            value={gistToken}
                            onChange={(e) => { setGistToken(e.target.value); localStorage.setItem('grid_notepad_gist_token', e.target.value); }}
                            className={\`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:border-accent-500 \${isDark ? "bg-zinc-900 border-zinc-700 text-white" : "bg-white border-zinc-300 text-zinc-900"}\`}
                         />
                         <input 
                            type="text" 
                            placeholder="Gist ID (Lëre bosh herën e parë)" 
                            value={gistId}
                            onChange={(e) => { setGistId(e.target.value); localStorage.setItem('grid_notepad_gist_id', e.target.value); }}
                            className={\`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:border-accent-500 \${isDark ? "bg-zinc-900 border-zinc-700 text-white" : "bg-white border-zinc-300 text-zinc-900"}\`}
                         />
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                         <button onClick={saveToGist} className={\`flex-1 flex justify-center items-center gap-2 px-4 py-2 font-medium rounded-lg transition-colors border \${isDark ? "bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-white" : "bg-zinc-900 hover:bg-zinc-800 text-white shadow-md border-transparent"}\`}>
                            <Upload className="w-4 h-4" /> Ruaj (Sync)
                         </button>
                         <button onClick={loadFromGist} className={\`flex-1 flex justify-center items-center gap-2 px-4 py-2 font-medium rounded-lg transition-colors border \${isDark ? "bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300" : "bg-white hover:bg-zinc-100 border-zinc-300 text-zinc-700"}\`}>
                            <Download className="w-4 h-4" /> Ngarko / Rikthe
                         </button>
                      </div>
                      
                      <div className="mt-3">
                         <button onClick={() => {
                            if (!gistId) return showToast("Nuk ka Gist ID. Ruani një herë dokumentet fillimisht.");
                            window.open(\`https://gist.github.com/\${gistId}\`, "_blank");
                         }} className={\`w-full flex justify-center items-center gap-2 px-4 py-2 font-bold text-xs rounded-lg transition-colors border shadow-sm \${isDark ? "bg-zinc-700 hover:bg-zinc-600 text-white border-transparent" : "bg-zinc-200 hover:bg-zinc-300 text-zinc-900 border-transparent"}\`}>
                            <Eye className="w-4 h-4" /> Shiko Dokumentet Online (Gist)
                         </button>
                      </div>
                   </div>`;

code = code.replace(targetGistUI, replacementGistUI);
fs.writeFileSync('src/components/Notepad.tsx', code);
