const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const targetCloudModal = `             <div className={\`max-w-md w-full p-6 rounded-2xl shadow-2xl border \${isDark ? "bg-zinc-900 border-zinc-700" : "bg-white border-zinc-300"}\`}>
                <div className="flex justify-between items-center mb-6">
                   <h3 className={\`text-xl font-bold flex items-center gap-2 \${textColor}\`}>
                      <Cloud className="w-6 h-6 text-accent-500" />
                      Hapësira Cloud
                   </h3>`;

const replacementCloudModal = `             <div className={\`max-w-md w-full p-6 rounded-2xl shadow-2xl border \${isDark ? "bg-zinc-900 border-zinc-700" : "bg-white border-zinc-300"}\`}>
                <div className="flex justify-between items-center mb-6">
                   <h3 className={\`text-xl font-bold flex items-center gap-2 \${textColor}\`}>
                      <Cloud className="w-6 h-6 text-accent-500" />
                      Hapësira Cloud
                   </h3>`;

code = code.replace(targetCloudModal, replacementCloudModal);
fs.writeFileSync('src/components/Notepad.tsx', code);
