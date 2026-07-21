const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const targetGistUI = `                <div className="p-0 overflow-y-auto flex-1 flex flex-col bg-zinc-950 text-green-400 font-mono text-xs md:text-sm">
                   <pre className="p-4 overflow-x-auto whitespace-pre-wrap">
                      {gistViewerContent ? JSON.stringify(JSON.parse(gistViewerContent), null, 2) : 'Duke ngarkuar...'}
                   </pre>
                </div>`;

const replacementGistUI = `                <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-3">
                   {gistViewerContent ? (
                       (() => {
                           try {
                               const parsedDocs = JSON.parse(gistViewerContent);
                               if (!Array.isArray(parsedDocs)) throw new Error();
                               return parsedDocs.map((docItem: any) => (
                                   <div key={docItem.id} className={\`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-xl gap-4 transition-colors \${isDark ? "bg-zinc-800 border-zinc-700" : "bg-zinc-50 border-zinc-200"}\`}>
                                       <div className="flex-1">
                                          <h4 className={\`font-bold \${textColor}\`}>{docItem.title || 'I paemërtuar'}</h4>
                                          <div className={\`text-xs mt-1 flex items-center gap-3 \${isDark ? "text-zinc-400" : "text-zinc-600"}\`}>
                                              <span>{docItem.rows?.length || 0} Rrjeshta</span>
                                              <span>•</span>
                                              <span>{docItem.headers?.length || 0} Kolona</span>
                                          </div>
                                       </div>
                                   </div>
                               ));
                           } catch (e) {
                               return (
                                  <div className="p-0 overflow-y-auto flex-1 flex flex-col bg-zinc-950 text-green-400 font-mono text-xs md:text-sm rounded-lg">
                                     <pre className="p-4 overflow-x-auto whitespace-pre-wrap">
                                        {gistViewerContent}
                                     </pre>
                                  </div>
                               );
                           }
                       })()
                   ) : (
                       <div className="flex justify-center items-center py-10">
                           <Loader2 className="w-8 h-8 text-accent-500 animate-spin" />
                       </div>
                   )}
                </div>`;

code = code.replace(targetGistUI, replacementGistUI);
fs.writeFileSync('src/components/Notepad.tsx', code);
