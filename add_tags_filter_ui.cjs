const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const targetSearchUI = `            <div className="relative w-full">
               <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
               <input 
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder={t("Kërko dokumente ose tekst brenda tyre...", "Search documents or text inside them...")}
                  className={\`w-full pl-9 pr-4 py-1.5 text-sm rounded-lg border focus:outline-none focus:border-accent-500 transition-colors \${
                     isDark ? "bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500" : "bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400"
                  }\`}
               />
            </div>`;

const replacementSearchUI = `            <div className="relative w-full">
               <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
               <input 
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder={t("Kërko dokumente ose tekst brenda tyre...", "Search documents or text inside them...")}
                  className={\`w-full pl-9 pr-4 py-1.5 text-sm rounded-lg border focus:outline-none focus:border-accent-500 transition-colors \${
                     isDark ? "bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500" : "bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400"
                  }\`}
               />
            </div>
            {allAvailableTags.length > 0 && (
               <div className="flex flex-wrap gap-2 mt-3 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                  <button
                     onClick={() => setSelectedTag(null)}
                     className={\`px-3 py-1 rounded-full text-xs font-bold transition-colors \${
                        selectedTag === null
                           ? "bg-accent-500 text-white"
                           : isDark ? "bg-zinc-800 text-zinc-400 hover:bg-zinc-700" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                     }\`}
                  >
                     Të gjitha
                  </button>
                  {allAvailableTags.map(tag => (
                     <button
                        key={tag}
                        onClick={() => setSelectedTag(tag)}
                        className={\`px-3 py-1 rounded-full text-xs font-bold transition-colors \${
                           selectedTag === tag
                              ? "bg-accent-500 text-white"
                              : isDark ? "bg-zinc-800 text-zinc-400 hover:bg-zinc-700" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                        }\`}
                     >
                        #{tag}
                     </button>
                  ))}
               </div>
            )}`;

code = code.replace(targetSearchUI, replacementSearchUI);
fs.writeFileSync('src/components/Notepad.tsx', code);
