import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const STORAGE_FILE = path.join(process.cwd(), 'cloud_db.json');

function readCloudDb(): Record<string, any> {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const content = fs.readFileSync(STORAGE_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (e) {
    console.error("Error reading cloud db:", e);
  }
  return {};
}

function writeCloudDb(db: Record<string, any>) {
  try {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (e) {
    console.error("Error writing cloud db:", e);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  
  // CORS
  app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      if (req.method === 'OPTIONS') {
          return res.status(200).end();
      }
      next();
  });

  // Google Cloud Storage API Endpoints
  app.post('/api/cloud/sync', (req, res) => {
    try {
      const { userId, documents, activeDocId, blueText, secretList, pin, gistToken, gistId } = req.body;
      const key = (userId || 'default_user').trim().toLowerCase();
      const db = readCloudDb();
      
      const lastUpdated = new Date().toISOString();
      db[key] = {
        documents: documents || [],
        activeDocId: activeDocId || null,
        blueText: blueText !== undefined ? blueText : db[key]?.blueText,
        secretList: secretList !== undefined ? secretList : db[key]?.secretList,
        pin: pin !== undefined ? pin : db[key]?.pin,
        gistToken: gistToken !== undefined ? gistToken : db[key]?.gistToken,
        gistId: gistId !== undefined ? gistId : db[key]?.gistId,
        geminiKey: req.body.geminiKey !== undefined ? req.body.geminiKey : db[key]?.geminiKey,
        lastUpdated
      };
      
      // Also keep a snapshot history (max 5)
      const backupKey = key + '_backups';
      if (!Array.isArray(db[backupKey])) db[backupKey] = [];
      db[backupKey].unshift({
        timestamp: lastUpdated,
        docCount: (documents || []).length,
        documents: documents || []
      });
      if (db[backupKey].length > 5) db[backupKey] = db[backupKey].slice(0, 5);

      writeCloudDb(db);
      return res.json({
        success: true,
        message: 'Dokumentat u sinkronizuan me sukses në Google Cloud Server!',
        lastUpdated,
        docCount: (documents || []).length
      });
    } catch (err: any) {
      console.error("Cloud sync error:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/cloud/load', (req, res) => {
    try {
      const userId = (req.query.userId as string || 'default_user').trim().toLowerCase();
      const db = readCloudDb();
      const record = db[userId];
      if (!record || !record.documents) {
        return res.json({ success: true, documents: [], lastUpdated: null });
      }
      return res.json({
        success: true,
        documents: record.documents,
        activeDocId: record.activeDocId,
        blueText: record.blueText,
        secretList: record.secretList,
        pin: record.pin,
        gistToken: record.gistToken,
        gistId: record.gistId,
        geminiKey: record.geminiKey,
        lastUpdated: record.lastUpdated
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/cloud/status', (req, res) => {
    try {
      const userId = (req.query.userId as string || 'default_user').trim().toLowerCase();
      const db = readCloudDb();
      const record = db[userId];
      return res.json({
        success: true,
        online: true,
        hasData: !!(record && record.documents && record.documents.length > 0),
        docCount: record?.documents?.length || 0,
        lastUpdated: record?.lastUpdated || null
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // AI API Route handlers
  app.post('/api/ai/chat', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    try {
      const { prompt, documents, activeDocId, image, audio, blueText, secretList, userEmail, geminiKey } = req.body;

      // Robust Multi-tier API Key Resolution
      let apiKey = (geminiKey || '').trim();
      if (!apiKey && userEmail) {
        const key = userEmail.trim().toLowerCase();
        const db = readCloudDb();
        if (db[key] && db[key].geminiKey) {
          apiKey = db[key].geminiKey.trim();
        }
      }

      // Check if user-supplied key has the valid Google API key structure (starts with AIzaSy).
      // Discard it if it does not, to immediately fall back to the platform key.
      if (apiKey && !apiKey.startsWith('AIzaSy')) {
        console.warn(`Ignoring non-Google format API key: ${apiKey.slice(0, 10)}...`);
        apiKey = '';
      }

      if (!apiKey) {
        apiKey = (process.env.GEMINI_API_KEY || '').trim();
      }

      if (!apiKey) {
        return res.status(400).json({ 
          error: 'Çelësi juaj API i Gemini mungon. Ju lutem konfiguroni atë në panelin "Settings > Secrets" të AI Studio ose shtoni një çelës API të vlefshëm në cilësimet e Notepad-it.' 
        });
      }

      let ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const systemInstruction = `Ti je një asistent AI për një aplikacion Bllok/Notepad, i jepur pas llogaritjeve, analizës inteligjente, matematikës dhe përmbledhjeve të çdo lloj blloku që përdoruesi krijon. Përdoruesi po të jep akses të plotë tek TË GJITHA DOKUMENTAT në PLATFORMË (përfshirë ato manuale, të nenvizuara dhe ato në Cloud për llogarinë ${userEmail || 'genti8319@gmail.com'}).
Këtu janë të dhënat e dokumenteve aktualë në formatin JSON:
${JSON.stringify(documents, null, 2)}

Shënimet Sekrete të përdoruesit (Blue/Secret Editor Text):
${blueText || 'Ska shënime'}

Lista e Checklistave Sekrete:
${JSON.stringify(secretList || [], null, 2)}

Dokumenti aktual aktiv që përdoruesi po shikon është me ID: "${activeDocId}". Ofroni përgjigjen duke u bazuar plotësisht në KËTË DOKUMENT.

Përdoruesi gjithashtu kërkon që kur bën shënime, nenvizime apo korrigjime manuale, ti si AI të jesh në sinkron të plotë dhe të kryesh përditësime në dokumentet e tij nëse kërkohet përmes aksioneve tona të strukturuara JSON.

TI GJITHMONË DUHET TË KTHESH PËRGJIGJEN TËNDE NË FORMATIN JSON SI MË POSHTË:
{
  "text": "Teksti i përgjigjes tënde për përdoruesin dhe/ose raporti i llogaritjeve",
  "actions": [
    {
       "type": "PROPOSE_COLUMNS_CHANGE",
       "documentId": "id_e_dokumentit_qe_po_ndryshon",
       "newHeaders": ["Data", "Emri", "Sasia (kg)", "Cmimi", "Vlera"],
       "newColumnWidths": [120, 200, 100, 100, 150],
       "newRows": []
    },
    {
       "type": "UPDATE_DOCUMENT_ROWS",
       "documentId": "id_e_dokumentit_qe_po_ndryshon",
       "newRows": []
    }
  ]
}
Kthe VETËM JSON të vlefshëm pa koodblock markdown!`;

      // Prioritize modern, high-performance models as recommended in gemini-api guidelines
      const candidateModels = [
        'gemini-3.6-flash',
        'gemini-3.1-flash-lite',
        'gemini-3.1-pro-preview',
        'gemini-flash-latest',
        'gemini-2.5-flash',
        'gemini-2.5-pro'
      ];
      let lastError: any = null;

      for (const modelName of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: (() => { 
              const parts: any[] = [{ text: prompt || 'Analizo bllokun mun' }]; 
              if (image) { 
                const b = image.split(',')[1]; 
                const m = image.split(';')[0].split(':')[1]; 
                parts.push({ inlineData: { data: b, mimeType: m } }); 
              } 
              if (audio) { 
                const b = audio.split(',')[1]; 
                const m = audio.split(';')[0].split(':')[1]; 
                parts.push({ inlineData: { data: b, mimeType: m } }); 
              } 
              return parts; 
            })(),
            config: {
              systemInstruction,
              temperature: 0.2,
              responseMimeType: 'application/json'
            }
          });

          let rawText = response.text || '{}';
          rawText = rawText.trim();
          if (rawText.startsWith('```')) {
            rawText = rawText.replace(/^```[a-z]*\n?/i, '').replace(/```$/i, '').trim();
          }

          let parsedResponse: any = {};
          try {
            parsedResponse = JSON.parse(rawText);
          } catch(pe) {
            parsedResponse = { text: response.text || 'Analiza u krye me sukses.' };
          }
          return res.json(parsedResponse);
        } catch (err: any) {
          console.warn(`Model ${modelName} failed:`, err.message);
          lastError = err;

          // Check if it is an API Key authorization error, and we have a custom key that failed.
          // If so, fall back to process.env.GEMINI_API_KEY immediately and retry.
          const errMsg = (err.message || '').toLowerCase();
          const isApiKeyError = errMsg.includes('api key not valid') || 
                               errMsg.includes('api_key_invalid') || 
                               errMsg.includes('api key') || 
                               errMsg.includes('unauthenticated') || 
                               errMsg.includes('invalid key');

          const fallbackKey = (process.env.GEMINI_API_KEY || '').trim();
          if (isApiKeyError && fallbackKey && apiKey !== fallbackKey) {
            console.warn("API Key was invalid. Swapping to default platform GEMINI_API_KEY and retrying...");
            apiKey = fallbackKey;
            ai = new GoogleGenAI({ 
              apiKey,
              httpOptions: {
                headers: {
                  'User-Agent': 'aistudio-build'
                }
              }
            });

            try {
              const response = await ai.models.generateContent({
                model: modelName,
                contents: (() => { 
                  const parts: any[] = [{ text: prompt || 'Analizo bllokun mun' }]; 
                  if (image) { 
                    const b = image.split(',')[1]; 
                    const m = image.split(';')[0].split(':')[1]; 
                    parts.push({ inlineData: { data: b, mimeType: m } }); 
                  } 
                  if (audio) { 
                    const b = audio.split(',')[1]; 
                    const m = audio.split(';')[0].split(':')[1]; 
                    parts.push({ inlineData: { data: b, mimeType: m } }); 
                  } 
                  return parts; 
                })(),
                config: {
                  systemInstruction,
                  temperature: 0.2,
                  responseMimeType: 'application/json'
                }
              });

              let rawText = response.text || '{}';
              rawText = rawText.trim();
              if (rawText.startsWith('```')) {
                rawText = rawText.replace(/^```[a-z]*\n?/i, '').replace(/```$/i, '').trim();
              }

              let parsedResponse: any = {};
              try {
                parsedResponse = JSON.parse(rawText);
              } catch(pe) {
                parsedResponse = { text: response.text || 'Analiza u krye me sukses.' };
              }
              return res.json(parsedResponse);
            } catch (retryErr: any) {
              console.error(`Fallback retry for model ${modelName} failed:`, retryErr.message);
              lastError = retryErr;
            }
          }
        }
      }

      throw lastError || new Error("Asnjë nga modelet e AI nuk u përgjigj.");
    } catch (err: any) {
      console.error('AI Chat Error:', err);
      let friendlyMessage = err.message || 'Ndodhi një gabim gjatë komunikimit me AI.';
      const lowerMsg = friendlyMessage.toLowerCase();
      if (lowerMsg.includes('api key not valid') || lowerMsg.includes('api_key_invalid') || lowerMsg.includes('api key') || lowerMsg.includes('unauthenticated') || lowerMsg.includes('invalid key')) {
        friendlyMessage = 'Çelësi juaj API i Gemini nuk është i vlefshëm ose mungon. Ju lutem kontrolloni dhe rregulloni konfigurimin e çelësit tuaj në panelin "Settings > Secrets" të AI Studio.';
      }
      res.status(400).json({ error: friendlyMessage });
    }
  });



  // JSON 404 Handler for any unhandled /api/ requests
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `API route ${req.method} ${req.originalUrl} nuk u gjet.` });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
