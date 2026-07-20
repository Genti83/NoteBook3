const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const targetState = `  const [backupModal, setBackupModal] = useState(false);`;
const replacementState = `  const [backupModal, setBackupModal] = useState(false);
  const [gistToken, setGistToken] = useState(localStorage.getItem('grid_notepad_gist_token') || '');
  const [gistId, setGistId] = useState(localStorage.getItem('grid_notepad_gist_id') || '');

  const saveToGist = async () => {
      if (!gistToken) return showToast("Ju lutem vendosni një GitHub Token");
      showToast("Duke ruajtur në GitHub Gist...");
      try {
          const content = JSON.stringify(documents);
          let method = 'POST';
          let url = 'https://api.github.com/gists';
          
          if (gistId) {
             method = 'PATCH';
             url = \`https://api.github.com/gists/\${gistId}\`;
          }

          const res = await fetch(url, {
             method,
             headers: {
                'Authorization': \`token \${gistToken}\`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
             },
             body: JSON.stringify({
                description: 'Grid Notepad Backup',
                public: false,
                files: {
                   'grid_notepad_backup.json': { content }
                }
             })
          });

          if (!res.ok) throw new Error("Gabim gjatë ruajtjes në Gist. Kontrolloni Token-in.");
          const data = await res.json();
          setGistId(data.id);
          localStorage.setItem('grid_notepad_gist_id', data.id);
          localStorage.setItem('grid_notepad_gist_token', gistToken);
          showToast("U ruajt me sukses në GitHub Gist!");
      } catch (err: any) {
          showToast(err.message);
      }
  };

  const loadFromGist = async () => {
      if (!gistToken) return showToast("Ju lutem vendosni një GitHub Token");
      if (!gistId) return showToast("Nuk ka asnjë Gist ID të ruajtur për t'u rikthyer.");
      showToast("Duke ngarkuar nga GitHub Gist...");
      try {
          const res = await fetch(\`https://api.github.com/gists/\${gistId}\`, {
             headers: {
                'Authorization': \`token \${gistToken}\`,
                'Accept': 'application/vnd.github.v3+json'
             }
          });
          if (!res.ok) throw new Error("Gabim gjatë ngarkimit. Gist ID ose Token i pavlefshëm.");
          const data = await res.json();
          const file = data.files['grid_notepad_backup.json'];
          if (!file) throw new Error("Skedari nuk u gjet në këtë Gist.");
          
          const content = file.truncated ? await (await fetch(file.raw_url)).text() : file.content;
          const parsed = JSON.parse(content);
          
          setDocuments(parsed);
          localStorage.setItem('grid_notepad_documents_v2', JSON.stringify(parsed));
          if (activeDocId) {
             const curr = parsed.find((d: any) => d.id === activeDocId);
             if (curr) {
                 setRows(curr.rows);
                 setHeaders(curr.headers);
             } else {
                 createNewDocument();
             }
          }
          showToast("Të dhënat u rikthyen me sukses nga Gist!");
      } catch (err: any) {
          showToast(err.message);
      }
  };`;

code = code.replace(targetState, replacementState);
fs.writeFileSync('src/components/Notepad.tsx', code);
