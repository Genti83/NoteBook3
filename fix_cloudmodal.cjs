const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const target = `                <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-3">
                   {isFetchingCloud ? (`

const replacement = `                <div className={\`p-4 border-b flex flex-wrap gap-2 \${isDark ? "bg-zinc-800/50 border-zinc-800" : "bg-zinc-50 border-zinc-200"}\`}>
                    <button onClick={() => {forceCloudBackup(); setCloudModal(false);}} className={\`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border shadow-sm \${isDark ? "bg-accent-600 hover:bg-accent-500 text-white border-transparent" : "bg-accent-500 hover:bg-accent-600 text-white border-transparent"}\`}>
                        <Cloud className="w-4 h-4 inline-block mr-1" /> Ngarko / Save (Backup All)
                    </button>
                    <button onClick={() => {handleFullCloudRestore(); setCloudModal(false);}} className={\`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border shadow-sm \${isDark ? "bg-orange-600 hover:bg-orange-500 text-white border-transparent" : "bg-orange-500 hover:bg-orange-600 text-white border-transparent"}\`}>
                        <Download className="w-4 h-4 inline-block mr-1" /> Importo / Download All
                    </button>
                    <button onClick={handleExportTxt} className={\`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border shadow-sm \${isDark ? "bg-zinc-700 hover:bg-zinc-600 text-white border-transparent" : "bg-zinc-200 hover:bg-zinc-300 text-zinc-900 border-transparent"}\`}>TXT</button>
                    <button onClick={handleExportPdf} className={\`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border shadow-sm \${isDark ? "bg-zinc-700 hover:bg-zinc-600 text-white border-transparent" : "bg-zinc-200 hover:bg-zinc-300 text-zinc-900 border-transparent"}\`}>PDF</button>
                    <button onClick={handleExportJson} className={\`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border shadow-sm \${isDark ? "bg-zinc-700 hover:bg-zinc-600 text-white border-transparent" : "bg-zinc-200 hover:bg-zinc-300 text-zinc-900 border-transparent"}\`}>JSON</button>
                    <button onClick={handleExportCsv} className={\`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border shadow-sm \${isDark ? "bg-zinc-700 hover:bg-zinc-600 text-white border-transparent" : "bg-zinc-200 hover:bg-zinc-300 text-zinc-900 border-transparent"}\`}>CSV</button>
                </div>
                <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-3">
                   {isFetchingCloud ? (`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/Notepad.tsx', code);
