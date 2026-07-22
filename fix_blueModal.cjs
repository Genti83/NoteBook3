const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const targetBlueModal = `      {blueModal && (
          <div className="fixed inset-0 z-[100] flex items-start pt-12 pb-[40vh] md:items-center overflow-y-auto justify-center bg-black/60 sm:p-4 animate-in fade-in">
             <div className={\`w-full h-[100dvh] sm:max-w-2xl sm:h-[80vh] flex flex-col sm:rounded-2xl shadow-2xl border-0 sm:border \${isDark ? "bg-zinc-900 sm:border-blue-500/30" : "bg-white sm:border-blue-300"}\`}>
                <div className={\`flex justify-between items-center p-4 border-b shrink-0 \${isDark ? "border-zinc-800" : "border-zinc-200"}\`}>
                   <h3 className={\`text-xl font-bold flex items-center gap-2 \${isDark ? "text-blue-500" : "text-blue-600"}\`}>
                      <Lock className="w-5 h-5" /> Shënime Sekrete
                   </h3>
                   <button onClick={() => setBlueModal(false)} className="p-2 bg-transparent text-zinc-500 hover:text-red-500 transition-colors">
                      <X className="w-5 h-5"/>
                   </button>
                </div>
                
                <div className={\`flex-1 p-5 \${isDark ? "bg-zinc-950" : "bg-blue-50/30"}\`}>

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
                                    <Trash2 className="w-3 h-3" />
                                 </button>
                              </div>
                           ))}
                        </div>
                     </div>
                     <textarea 
                        className={\`w-full flex-1 p-4 rounded-xl border resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 \${isDark ? "bg-zinc-900 border-zinc-800 text-zinc-300" : "bg-white border-zinc-200 text-zinc-700 shadow-sm"}\`}
                        placeholder="Shkruaj shënime të tjera të rëndësishme këtu..."
                        value={blueText}
                        onChange={(e) => {
                           setBlueText(e.target.value);
                           localStorage.setItem('grid_notepad_blue', e.target.value);
                        }}
                     />
                   </div>
                </div>
             </div>
          </div>
      )}`;

const replacementBlueModal = `      {blueModal && (
          <div className="fixed inset-0 z-[100] flex items-start pt-12 pb-[40vh] md:items-center overflow-y-auto justify-center bg-black/60 sm:p-4 animate-in fade-in">
             <div className={\`w-full h-[100dvh] sm:max-w-3xl sm:h-[85vh] flex flex-col sm:rounded-2xl shadow-2xl border-0 sm:border \${isDark ? "bg-black sm:border-zinc-700" : "bg-white sm:border-zinc-300"}\`}>
                <div className={\`flex justify-between items-center p-4 border-b shrink-0 \${isDark ? "border-zinc-800 bg-zinc-950" : "border-zinc-200 bg-zinc-50"}\`}>
                   <h3 className={\`text-xl font-bold flex items-center gap-2 \${isDark ? "text-white" : "text-black"}\`}>
                      <Lock className="w-5 h-5" /> Shënime Sekrete
                   </h3>
                   <div className="flex gap-2">
                       <button onClick={() => {forceCloudBackup(false);}} title="Ruaj në Cloud (Upload)" className={\`p-2 rounded-lg transition-colors border \${isDark ? "bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700" : "bg-zinc-200 hover:bg-zinc-300 text-black border-zinc-300"}\`}>
                           <UploadCloud className="w-5 h-5" />
                       </button>
                       <button onClick={() => {handleFullCloudRestore();}} title="Rifresko nga Cloud (Download)" className={\`p-2 rounded-lg transition-colors border \${isDark ? "bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700" : "bg-zinc-200 hover:bg-zinc-300 text-black border-zinc-300"}\`}>
                           <Download className="w-5 h-5" />
                       </button>
                       <button onClick={() => setBlueModal(false)} className="p-2 ml-2 bg-transparent text-zinc-500 hover:text-red-500 transition-colors">
                          <X className="w-6 h-6"/>
                       </button>
                   </div>
                </div>
                
                <div className={\`flex-1 p-5 \${isDark ? "bg-black" : "bg-white"}\`}>

                   <div className="flex flex-col md:flex-row h-full gap-4">
                     {/* Lista e Sekreteve */}
                     <div className={\`flex-1 rounded-xl p-4 flex flex-col border \${isDark ? "bg-zinc-950 border-zinc-800" : "bg-zinc-50 border-zinc-200 shadow-sm"}\`}>
                        <div className="flex items-center justify-between mb-4">
                           <h4 className={\`text-base font-bold \${isDark ? "text-white" : "text-black"}\`}>Lista e Sekreteve</h4>
                           <button 
                             onClick={() => {
                                const newItem = { id: Date.now().toString(), text: '', done: false };
                                const updated = [...secretList, newItem];
                                setSecretList(updated);
                                localStorage.setItem('grid_notepad_secret_list', JSON.stringify(updated));
                             }}
                             className={\`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 \${isDark ? "bg-white text-black hover:bg-zinc-200" : "bg-black text-white hover:bg-zinc-800"}\`}
                           >
                             <Plus className="w-4 h-4" /> Shto
                           </button>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide space-y-3">
                           {secretList.length === 0 && (
                              <p className={\`text-sm text-center mt-6 \${isDark ? "text-zinc-500" : "text-zinc-400"}\`}>Nuk ka asnjë element në listë.</p>
                           )}
                           {secretList.map((item, idx) => (
                              <div key={item.id} className={\`flex items-center gap-3 p-2 rounded-lg border \${isDark ? "bg-black border-zinc-800" : "bg-white border-zinc-200"}\`}>
                                 <button 
                                   onClick={() => {
                                      const updated = [...secretList];
                                      updated[idx].done = !updated[idx].done;
                                      setSecretList(updated);
                                      localStorage.setItem('grid_notepad_secret_list', JSON.stringify(updated));
                                   }}
                                   className={\`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors \${
                                     item.done 
                                      ? (isDark ? "bg-white border-white text-black" : "bg-black border-black text-white")
                                      : (isDark ? "border-zinc-600 text-transparent hover:border-white" : "border-zinc-400 text-transparent hover:border-black")
                                   }\`}
                                 >
                                    <Check className="w-4 h-4" />
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
                                   className={\`flex-1 bg-transparent border-none outline-none font-medium text-base \${
                                      item.done ? (isDark ? "text-zinc-600 line-through" : "text-zinc-400 line-through") : (isDark ? "text-white" : "text-black")
                                   }\`}
                                 />
                                 <button
                                   onClick={() => {
                                      const updated = secretList.filter(i => i.id !== item.id);
                                      setSecretList(updated);
                                      localStorage.setItem('grid_notepad_secret_list', JSON.stringify(updated));
                                   }}
                                   className={\`p-2 rounded-md transition-colors \${isDark ? "text-zinc-500 hover:text-white hover:bg-zinc-800" : "text-zinc-400 hover:text-black hover:bg-zinc-200"}\`}
                                 >
                                    <Trash2 className="w-4 h-4" />
                                 </button>
                              </div>
                           ))}
                        </div>
                     </div>
                     <div className="flex-1 flex flex-col gap-2">
                         <h4 className={\`text-base font-bold px-1 \${isDark ? "text-white" : "text-black"}\`}>Shënime të lira</h4>
                         <textarea 
                            className={\`w-full flex-1 p-4 rounded-xl border-2 resize-none focus:outline-none font-medium text-base \${isDark ? "bg-black border-zinc-800 focus:border-white text-white" : "bg-white border-zinc-200 focus:border-black text-black shadow-sm"}\`}
                            placeholder="Shkruaj shënime të tjera të rëndësishme këtu..."
                            value={blueText}
                            onChange={(e) => {
                               setBlueText(e.target.value);
                               localStorage.setItem('grid_notepad_blue', e.target.value);
                            }}
                         />
                     </div>
                   </div>
                </div>
             </div>
          </div>
      )}`;

if (!code.includes(replacementBlueModal)) {
    code = code.replace(targetBlueModal, replacementBlueModal);
    fs.writeFileSync('src/components/Notepad.tsx', code);
    console.log("BlueModal replaced successfully!");
} else {
    console.log("BlueModal already replaced!");
}
