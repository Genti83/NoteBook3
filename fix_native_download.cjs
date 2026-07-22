const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const targetNativeSave = `          if (Capacitor.isNativePlatform()) {
              const reader = new FileReader();
              reader.readAsDataURL(blob);
              reader.onloadend = async () => {
                  const base64data = reader.result?.toString().split(',')[1];
                  if (base64data) {
                      try {
                          // Get folder name from state/localStorage
                          const manualFolder = localStorage.getItem('grid_mock_folder') || folderName;
                          const sanitizedFolder = manualFolder ? manualFolder.replace(/[^a-zA-Z0-9_\\s-]/g, '').trim() : '';
                          const fullPath = sanitizedFolder ? \`\${sanitizedFolder}/\${filename}\` : filename;
                          
                          await Filesystem.writeFile({
                              path: fullPath,
                              data: base64data,
                              directory: Directory.Documents,
                              recursive: true
                          });
                          
                          showToast(t(\`Skedari u ruajt me sukses në Documents/\${fullPath}\`, \`Saved to Documents/\${fullPath}\`));
                      } catch (e: any) {
                          console.error("Capacitor save error:", e);
                          showToast("Gabim gjatë ruajtjes: " + (e.message || "E panjohur"));
                      }
                  }
              };
              return;
          }`;

const replacementNativeSave = `          if (Capacitor.isNativePlatform()) {
              const reader = new FileReader();
              reader.readAsDataURL(blob);
              reader.onloadend = async () => {
                  const base64data = reader.result?.toString().split(',')[1];
                  if (base64data) {
                      try {
                          // Request permission first to ensure we can write to memory
                          try {
                             await Filesystem.requestPermissions();
                          } catch(permErr) {}

                          // Get folder name from state/localStorage
                          const manualFolder = localStorage.getItem('grid_mock_folder') || folderName;
                          const sanitizedFolder = manualFolder ? manualFolder.replace(/[^a-zA-Z0-9_\\s-]/g, '').trim() : '';
                          const fullPath = sanitizedFolder ? \`\${sanitizedFolder}/\${filename}\` : filename;
                          
                          // Write to a cache directory first so we can share it if needed
                          const writeResult = await Filesystem.writeFile({
                              path: filename,
                              data: base64data,
                              directory: Directory.Cache,
                              recursive: true
                          });
                          
                          if (downloadMethod === 'share' || downloadMethod === 'picker') {
                             await Share.share({
                                 title: shareTitle,
                                 url: writeResult.uri,
                                 dialogTitle: 'Zgjidh ku do të ruash dokumentin (Save to...)'
                             });
                             showToast("Hapëm menunë për të zgjedhur dosjen!");
                          } else {
                             // Save to documents by default
                             await Filesystem.writeFile({
                                 path: fullPath,
                                 data: base64data,
                                 directory: Directory.Documents,
                                 recursive: true
                             });
                             showToast(t(\`Skedari u ruajt me sukses në Documents/\${fullPath}\`, \`Saved to Documents/\${fullPath}\`));
                          }
                      } catch (e: any) {
                          console.error("Capacitor save error:", e);
                          showToast("Gabim gjatë ruajtjes: " + (e.message || "E panjohur"));
                      }
                  }
              };
              return;
          }`;

if (code.includes(targetNativeSave)) {
    code = code.replace(targetNativeSave, replacementNativeSave);
    fs.writeFileSync('src/components/Notepad.tsx', code);
    console.log("Native download method updated!");
}
