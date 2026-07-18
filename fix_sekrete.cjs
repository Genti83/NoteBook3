const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const secretTarget = `                   <textarea
                     autoFocus
                     value={blueText}
                     onChange={(e) => {
                         const val = e.target.value;
                         setBlueText(val);
                         localStorage.setItem('grid_notepad_blue', val);
                     }}
                     placeholder="Këtu mund të mbani shënime të rëndësishme ose sekrete të mbrojtura me Password..."
                     className={\`w-full h-full bg-transparent resize-none focus:outline-none text-base leading-relaxed scrollbar-hide \${
                       isDark ? "text-blue-100 placeholder-blue-900/50" : "text-zinc-800 placeholder-blue-300"
                     }\`}
                     spellCheck={false}
                   />`;

const secretRep = `
                   <div className="flex flex-col h-full gap-4">
                     {/* Lista e Sekreteve */}
                     <div className={\`flex-1 rounded-xl p-3 flex flex-col \${isDark ? "bg-zinc-900 border border-zinc-800" : "bg-white border border-zinc-200 shadow-sm"}\`}>
                        <div className="flex items-center justify-between mb-3">
                           <h4 className={\`text-sm font-bold \${isDark ? "text-blue-400" : "text-blue-600"}\`}>Lista e Sekreteve</h4>
                           <button 
                             onClick={() => {
                                const newItem = { id: Date.now().toString(), text: '', done: false };
                                const updated = [...secretList, newItem];
                                setSecretList(updated);
                                localStorage.setItem('grid_notepad_secret_list', JSON.stringify(updated));
                             }}
                             className={\`p-1.5 rounded-lg \${isDark ? "hover:bg-zinc-800 text-blue-400" : "hover:bg-blue-50 text-blue-600"}\`}
                           >
                             <Plus className="w-4 h-4" />
                           </button>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-1 scrollbar-hide space-y-2">
                           {secretList.length === 0 && (
                              <p className={\`text-xs text-center mt-4 \${isDark ? "text-zinc-500" : "text-zinc-400"}\`}>Nuk ka asnjë element në listë.</p>
                           )}
                           {secretList.map((item, idx) => (
                              <div key={item.id} className="flex items-start gap-2 group">
                                 <button 
                                   onClick={() => {
                                      const updated = [...secretList];
                                      updated[idx].done = !updated[idx].done;
                                      setSecretList(updated);
                                      localStorage.setItem('grid_notepad_secret_list', JSON.stringify(updated));
                                   }}
                                   className={\`mt-1 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 \${
                                     item.done 
                                      ? "bg-blue-500 border-blue-500 text-white" 
                                      : (isDark ? "border-zinc-600 text-transparent" : "border-zinc-400 text-transparent")
                                   }\`}
                                 >
                                    <Check className="w-3 h-3" />
                                 </button>
                                 <input
                                   type="text"
                                   value={item.text}
                                   onChange={(e) => {
                                      const updated = [...secretList];
                                      updated[idx].text = e.target.value;
                                      setSecretList(updated);
                                      localStorage.setItem('grid_notepad_secret_list', JSON.stringify(updated));
                                   }}
                                   placeholder="Shkruaj diçka..."
                                   className={\`flex-1 bg-transparent border-none outline-none text-sm \${
                                      item.done ? (isDark ? "text-zinc-500 line-through" : "text-zinc-400 line-through") : (isDark ? "text-zinc-200" : "text-zinc-800")
                                   }\`}
                                 />
                                 <button
                                   onClick={() => {
                                      const updated = secretList.filter(i => i.id !== item.id);
                                      setSecretList(updated);
                                      localStorage.setItem('grid_notepad_secret_list', JSON.stringify(updated));
                                   }}
                                   className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-500/10 rounded transition-all"
                                 >
                                    <Trash2 className="w-3.5 h-3.5" />
                                 </button>
                              </div>
                           ))}
                        </div>
                     </div>

                     {/* Hartim Text (Text Drafting) */}
                     <div className={\`flex-1 rounded-xl p-3 flex flex-col \${isDark ? "bg-zinc-950 border border-zinc-800" : "bg-white border border-zinc-200 shadow-sm"}\`}>
                        <h4 className={\`text-sm font-bold mb-2 \${isDark ? "text-blue-400" : "text-blue-600"}\`}>Hartim Tekst</h4>
                        <textarea
                           autoFocus
                           value={blueText}
                           onChange={(e) => {
                               const val = e.target.value;
                               setBlueText(val);
                               localStorage.setItem('grid_notepad_blue', val);
                           }}
                           placeholder="Këtu mund të mbani shënime të rëndësishme ose sekrete të mbrojtura me Password..."
                           className={\`w-full h-full bg-transparent resize-none focus:outline-none text-sm leading-relaxed scrollbar-hide \${
                             isDark ? "text-zinc-200 placeholder-zinc-700" : "text-zinc-800 placeholder-zinc-400"
                           }\`}
                           spellCheck={false}
                        />
                     </div>
                   </div>
`;

code = code.replace(secretTarget, secretRep);

fs.writeFileSync('src/components/Notepad.tsx', code);
