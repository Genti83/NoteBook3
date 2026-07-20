const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const targetBackupModal = `                   {/* Cloud Backup */}
                   <div className={\`p-4 rounded-xl border \${isDark ? "bg-zinc-800/50 border-zinc-700" : "bg-zinc-50 border-zinc-200"}\`}>
                      <h4 className={\`font-bold mb-2 flex items-center gap-2 \${textColor}\`}>
                         <Cloud className="w-5 h-5 text-accent-500" /> {t('Siguria në Cloud (Online)', 'Cloud Security (Online)')}
                      </h4>
                      <p className={\`text-sm mb-4 \${isDark ? "text-zinc-400" : "text-zinc-600"}\`}>
                        {t('Të dhënat tuaja rezervohen automatikisht në Cloud sapo jeni i kyçur. Mund t\\'i shkarkoni përsëri edhe nëse ndërroni telefon.', 'Your data is automatically synced to the Cloud when you are logged in. You can redownload it even if you switch phones.')}
                      </p>
                      {user ? (
                         <div className="flex flex-col sm:flex-row gap-3">
                            <button onClick={() => {forceCloudBackup(); setBackupModal(false)}} className={\`flex-1 flex justify-center items-center gap-2 px-4 py-2 font-medium rounded-lg transition-colors bg-accent-600 hover:bg-accent-500 text-white shadow-lg shadow-accent-600/20\`}>
                               <Cloud className="w-4 h-4" /> {t('Shto në Cloud', 'Push to Cloud')}
                            </button>
                            <button onClick={handleFullCloudRestore} className={\`flex-1 flex justify-center items-center gap-2 px-4 py-2 font-medium rounded-lg transition-colors border \${isDark ? "bg-orange-600 hover:bg-orange-500 text-white shadow-md border-transparent" : "bg-orange-500 hover:bg-orange-600 text-white shadow-md font-bold border-transparent"}\`}>
                               <Download className="w-4 h-4" /> {t('Rikthe Ngarko', 'Restore All')}
                            </button>
                            <button onClick={() => {setBackupModal(false); openCloudModal();}} className={\`flex-1 flex justify-center items-center gap-2 px-4 py-2 font-medium rounded-lg transition-colors border \${isDark ? "bg-green-600 hover:bg-green-500 text-white shadow-md border-transparent" : "bg-green-500 hover:bg-green-600 text-white shadow-md font-bold border-transparent"}\`}>
                               <FolderOpen className="w-4 h-4" /> {t('Listo Online', 'List Online')}
                            </button>
                         </div>
                      ) : (
                         <button onClick={() => {setBackupModal(false); setAuthModal(true)}} className={\`w-full flex justify-center items-center gap-2 px-4 py-2 font-medium rounded-lg transition-colors bg-accent-600 hover:bg-accent-500 text-white shadow-lg\`}>
                            <LogIn className="w-4 h-4" /> {t('Kyçuni për Cloud', 'Login for Cloud')}
                         </button>
                      )}
                   </div>`;

const replacementBackupModal = `                   {/* Cloud Backup */}
                   <div className={\`p-4 rounded-xl border \${isDark ? "bg-zinc-800/50 border-zinc-700" : "bg-zinc-50 border-zinc-200"}\`}>
                      <h4 className={\`font-bold mb-2 flex items-center gap-2 \${textColor}\`}>
                         <Cloud className="w-5 h-5 text-accent-500" /> {t('Siguria në Cloud (Online)', 'Cloud Security (Online)')}
                      </h4>
                      <p className={\`text-sm mb-4 \${isDark ? "text-zinc-400" : "text-zinc-600"}\`}>
                        {t('Të dhënat tuaja rezervohen automatikisht në Cloud sapo jeni i kyçur. Mund t\\'i shkarkoni përsëri edhe nëse ndërroni telefon.', 'Your data is automatically synced to the Cloud when you are logged in. You can redownload it even if you switch phones.')}
                      </p>
                      {user ? (
                         <div className="flex flex-col sm:flex-row gap-3">
                            <button onClick={() => {forceCloudBackup(); setBackupModal(false)}} className={\`flex-1 flex justify-center items-center gap-2 px-4 py-2 font-medium rounded-lg transition-colors bg-accent-600 hover:bg-accent-500 text-white shadow-lg shadow-accent-600/20\`}>
                               <Cloud className="w-4 h-4" /> {t('Shto në Cloud', 'Push to Cloud')}
                            </button>
                            <button onClick={handleFullCloudRestore} className={\`flex-1 flex justify-center items-center gap-2 px-4 py-2 font-medium rounded-lg transition-colors border \${isDark ? "bg-orange-600 hover:bg-orange-500 text-white shadow-md border-transparent" : "bg-orange-500 hover:bg-orange-600 text-white shadow-md font-bold border-transparent"}\`}>
                               <Download className="w-4 h-4" /> {t('Rikthe Ngarko', 'Restore All')}
                            </button>
                            <button onClick={() => {setBackupModal(false); openCloudModal();}} className={\`flex-1 flex justify-center items-center gap-2 px-4 py-2 font-medium rounded-lg transition-colors border \${isDark ? "bg-green-600 hover:bg-green-500 text-white shadow-md border-transparent" : "bg-green-500 hover:bg-green-600 text-white shadow-md font-bold border-transparent"}\`}>
                               <FolderOpen className="w-4 h-4" /> {t('Listo Online', 'List Online')}
                            </button>
                         </div>
                      ) : (
                         <button onClick={() => {setBackupModal(false); setAuthModal(true)}} className={\`w-full flex justify-center items-center gap-2 px-4 py-2 font-medium rounded-lg transition-colors bg-accent-600 hover:bg-accent-500 text-white shadow-lg\`}>
                            <LogIn className="w-4 h-4" /> {t('Kyçuni për Cloud', 'Login for Cloud')}
                         </button>
                      )}
                   </div>

                   {/* GitHub Gist Backup */}
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

code = code.replace(targetBackupModal, replacementBackupModal);
fs.writeFileSync('src/components/Notepad.tsx', code);
