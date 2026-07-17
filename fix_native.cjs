const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const target1 = `          if (Capacitor.isNativePlatform()) {
              const reader = new FileReader();
              reader.readAsDataURL(blob);
              reader.onloadend = async () => {
                  const base64data = reader.result?.toString().split(',')[1];
                  if (base64data) {
                      try {
                          const savedFile = await Filesystem.writeFile({
                              path: filename,
                              data: base64data,
                              directory: Directory.Cache
                          });
                          await Share.share({
                              title: shareTitle,
                              url: savedFile.uri,
                              dialogTitle: t("Ruaj Skedarin", "Save File")
                          });
                          showToast(t("Tani zgjidhni vendin për ta ruajtur.", "Now choose where to save it."));
                      } catch (e) {
                          console.error("Capacitor save/share error:", e);
                          showToast("Gabim gjatë ruajtjes.");
                      }
                  }
              };
              return;
          }`;

const replacement1 = `          if (Capacitor.isNativePlatform()) {
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

code = code.replace(target1, replacement1);

const target2 = `{Capacitor.isNativePlatform() && (
                                    <div className="text-xs font-bold text-orange-600 bg-orange-100 p-2 rounded">
                                       {t('Në celular, ky konfigurim nuk është i nevojshëm. Zgjedhja e dosjes (File Picker) hapet automatikisht sa herë që shkarkoni një skedar.', 'On mobile, this configuration is not needed. The File Picker opens automatically whenever you download a file.')}
                                    </div>
                                )}`;

const replacement2 = `{Capacitor.isNativePlatform() && (
                                    <div className="text-[11px] font-medium text-blue-600 bg-blue-100 p-2 rounded">
                                       {t('Në celular (Android), skedarët do të ruhen automatikisht në memorien tuaj te dosja "Documents/EmriQëShkruaniMëPoshtë".', 'On mobile, files will automatically be saved to Documents/FolderYouSpecifyBelow.')}
                                    </div>
                                )}`;

code = code.replace(target2, replacement2);

fs.writeFileSync('src/components/Notepad.tsx', code);
