const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const targetHeader = `        <div className="flex flex-col flex-grow min-w-[100px] max-w-[200px]">
           <HeaderInput 
              initialValue={title}
              onChange={(val: string) => {
                  setTitle(val);
                  updateActiveDocumentState(val, rows, headers);
              }}
              className={\`font-semibold text-sm px-2 py-1 rounded w-full border transition-colors outline-none focus:border-accent-500 \${isDark ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-300 text-zinc-900"}\`}
              placeholder={t("Titulli i Shënimit", "Note Title")}
           />
           {autoSaveMsg && (
              <span className="text-[10px] text-accent-500 font-medium px-2 py-0.5 animate-in fade-in slide-in-from-top-1 absolute top-[40px] z-50 rounded bg-white dark:bg-zinc-900 shadow-md border dark:border-zinc-800 border-zinc-200">{autoSaveMsg}</span>
           )}
        </div>`;

const replacementHeader = `        <div className="flex flex-col flex-grow min-w-[100px] max-w-[200px]">
           <HeaderInput 
              initialValue={title}
              onChange={(val: string) => {
                  setTitle(val);
                  updateActiveDocumentState(val, rows, headers, columnWidths, activeTags);
              }}
              className={\`font-semibold text-sm px-2 py-1 rounded w-full border transition-colors outline-none focus:border-accent-500 \${isDark ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-300 text-zinc-900"}\`}
              placeholder={t("Titulli i Shënimit", "Note Title")}
           />
           <input 
              value={activeTags.join(', ')}
              onChange={(e) => {
                 const newTags = e.target.value.split(',').map(t => t.trim()).filter(t => t !== '');
                 setActiveTags(newTags);
                 updateActiveDocumentState(title, rows, headers, columnWidths, newTags);
              }}
              className={\`text-[10px] px-2 py-0.5 mt-0.5 rounded w-full border transition-colors outline-none focus:border-accent-500 \${isDark ? "bg-zinc-900 border-zinc-800 text-zinc-400" : "bg-white border-zinc-300 text-zinc-500"}\`}
              placeholder={t("Etiketa (p.sh. work, personal)", "Tags (e.g. work, personal)")}
           />
           {autoSaveMsg && (
              <span className="text-[10px] text-accent-500 font-medium px-2 py-0.5 animate-in fade-in slide-in-from-top-1 absolute top-[55px] z-50 rounded bg-white dark:bg-zinc-900 shadow-md border dark:border-zinc-800 border-zinc-200">{autoSaveMsg}</span>
           )}
        </div>`;

code = code.replace(targetHeader, replacementHeader);
fs.writeFileSync('src/components/Notepad.tsx', code);
