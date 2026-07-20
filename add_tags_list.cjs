const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const targetList = `                     <div className="flex flex-col flex-1 shadow-none min-w-0 pr-2 gap-0.5">
                        <h3 className={\`font-bold text-sm truncate \${textColor}\`}>{doc.title}</h3>
                        <div className={\`flex flex-row flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] \${isDark ? "text-zinc-500" : "text-zinc-500"}\`}>
                           <span className="flex items-center gap-0.5"><Calendar className="w-2.5 h-2.5 shrink-0" /> {safeFormatDate(doc.createdAt, 'dd MMM yyyy')}</span>
                           <span className="flex items-center gap-0.5"><Save className="w-2.5 h-2.5 shrink-0" /> {safeFormatDate(doc.updatedAt, 'HH:mm')}</span>
                        </div>
                     </div>`;

const replacementList = `                     <div className="flex flex-col flex-1 shadow-none min-w-0 pr-2 gap-0.5">
                        <h3 className={\`font-bold text-sm truncate \${textColor}\`}>{doc.title}</h3>
                        <div className={\`flex flex-row flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] \${isDark ? "text-zinc-500" : "text-zinc-500"}\`}>
                           <span className="flex items-center gap-0.5"><Calendar className="w-2.5 h-2.5 shrink-0" /> {safeFormatDate(doc.createdAt, 'dd MMM yyyy')}</span>
                           <span className="flex items-center gap-0.5"><Save className="w-2.5 h-2.5 shrink-0" /> {safeFormatDate(doc.updatedAt, 'HH:mm')}</span>
                        </div>
                        {(doc.tags && doc.tags.length > 0) && (
                           <div className="flex flex-wrap gap-1 mt-0.5">
                              {doc.tags.map(tag => (
                                 <span key={tag} className={\`px-1.5 py-0.5 rounded text-[9px] font-bold \${isDark ? "bg-zinc-800 text-zinc-400" : "bg-zinc-100 text-zinc-500"}\`}>
                                    #{tag}
                                 </span>
                              ))}
                           </div>
                        )}
                     </div>`;

code = code.replace(targetList, replacementList);
fs.writeFileSync('src/components/Notepad.tsx', code);
