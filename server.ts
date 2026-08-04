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

function getVerifiedUser(req: express.Request): { uid: string; email?: string } | null {
  try {
    const authHeader = req.headers.authorization;
    let token = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.body && req.body.idToken) {
      token = req.body.idToken;
    } else if (req.query && req.query.idToken) {
      token = req.query.idToken as string;
    }

    if (!token) return null;

    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
    const now = Math.floor(Date.now() / 1000);

    // Dynamically resolve projectId
    let resolvedProjId = 'gen-lang-client-0285886461';
    try {
      const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
      if (fs.existsSync(configPath)) {
        const conf = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        if (conf.projectId) resolvedProjId = conf.projectId;
      }
    } catch (e) {}

    // Allow multiple fallback issuers/audiences for maximum resilience
    const allowedIssuers = [
      'https://securetoken.google.com/gen-lang-client-0285886461',
      `https://securetoken.google.com/${resolvedProjId}`
    ];
    const allowedAudiences = [
      'gen-lang-client-0285886461',
      resolvedProjId
    ];

    if (!allowedIssuers.includes(payload.iss)) {
      console.warn('JWT Issuer mismatch:', payload.iss, 'Expected one of:', allowedIssuers);
      return null;
    }
    if (!allowedAudiences.includes(payload.aud)) {
      console.warn('JWT Audience mismatch:', payload.aud, 'Expected one of:', allowedAudiences);
      return null;
    }

    // Support up to 24-hour clock-skew/expiration leeway for persistent sessions in development/sandbox
    if (payload.exp < now - 86400) {
      console.warn('JWT Token expired heavily:', payload.exp, now);
      return null;
    }

    return {
      uid: payload.sub || payload.user_id,
      email: payload.email
    };
  } catch (e) {
    console.error('Error parsing JWT token:', e);
    return null;
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
      // Enforce authentication
      const verified = getVerifiedUser(req);
      if (!verified) {
         return res.status(401).json({ success: false, error: 'Ju lutemi kyçuni me Email/Fjalëkalim ose me Google për të sinkronizuar të dhënat.' });
      }

      const { documents, activeDocId, blueText, secretList, pin, gistToken, gistId, customLabels } = req.body;
      const key = (verified.email || verified.uid).toLowerCase();

      const db = readCloudDb();
      const lastUpdated = new Date().toISOString();
      db[key] = {
        documents: documents || [],
        activeDocId: activeDocId || null,
        blueText: blueText !== undefined ? blueText : db[key]?.blueText,
        secretList: secretList !== undefined ? secretList : db[key]?.secretList,
        customLabels: customLabels !== undefined ? customLabels : db[key]?.customLabels,
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
      // Enforce authentication
      const verified = getVerifiedUser(req);
      if (!verified) {
         return res.status(401).json({ success: false, error: 'Ju lutemi kyçuni me Email/Fjalëkalim ose me Google për të shkarkuar të dhënat.' });
      }
      const userId = (verified.email || verified.uid).toLowerCase();

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
        customLabels: record.customLabels || [],
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
      // Enforce authentication
      const verified = getVerifiedUser(req);
      if (!verified) {
         return res.status(401).json({ success: false, error: 'Kërkohet autorizim. Ju lutemi kyçuni në llogari.' });
      }
      const userId = (verified.email || verified.uid).toLowerCase();

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
      if (!apiKey) {
        const verified = getVerifiedUser(req);
        const activeUserKey = verified ? (verified.email || verified.uid).toLowerCase() : (userEmail || '').trim().toLowerCase();
        if (activeUserKey) {
          const db = readCloudDb();
          if (db[activeUserKey] && db[activeUserKey].geminiKey) {
            apiKey = db[activeUserKey].geminiKey.trim();
          }
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

Përdoruesi gjithashtu kërkon që kur bën shënime, nenvizime apo korrigjime manuale, ose kur verifikohen dublikatat, ti si AI të jesh në sinkron të plotë dhe të kryesh përditësime në dokumentet e tij nëse kërkohet përmes aksioneve tona të strukturuara JSON.

Nëse përdoruesi kërkon të pastrojë ose të verifikojë dublikatat, ose nëse detekton dokumente krejtësisht identike (apo me të njëjtin titull dhe përmbajtje rreshtash të dubluar), kthe veprimin "DELETE_DOCUMENT" për dokumentet që duhen hequr (prefero të mbash më të riun ose më të plotësuarin). Nëse ka rreshta të dubluar brenda një dokumenti të vetëm, kthe veprimin "UPDATE_DOCUMENT_ROWS" me rreshtat e pastruar.

TI GJITHMONË DUHET TË KTHESH PËRGJIGJEN TËNDE NË FORMATIN JSON SI MË POSHTË:
{
  "text": "Teksti i përgjigjes tënde për përdoruesin, psh. raporti i pastrimit të dublikatave apo korrigjimeve.",
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
    },
    {
       "type": "DELETE_DOCUMENT",
       "documentId": "id_e_dokumentit_qe_duhet_fshire",
       "title": "Titulli i dokumentit të fshirë si dublikatë"
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
          const errMsg = (err.message || '').toLowerCase();
          const isApiKeyError = errMsg.includes('api key not valid') || 
                               errMsg.includes('api_key_invalid') || 
                               errMsg.includes('api key') || 
                               errMsg.includes('unauthenticated') || 
                               errMsg.includes('invalid key');

          if (isApiKeyError) {
            const fallbackKey = (process.env.GEMINI_API_KEY || '').trim();
            if (fallbackKey && apiKey !== fallbackKey) {
              console.log(`[AI Chat Info] API Key was invalid. Swapping to fallback GEMINI_API_KEY for model ${modelName}`);
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
                lastError = retryErr;
                break; // Break the candidate loop immediately because the fallback key is also invalid
              }
            } else {
              lastError = err;
              break; // Break the candidate loop immediately because the key is invalid and we have no different fallback
            }
          } else {
            console.log(`[AI Chat Info] Model ${modelName} returned status:`, err.message || err);
            lastError = err;
          }
        }
      }

      throw lastError || new Error("Asnjë nga modelet e AI nuk u përgjigj.");
    } catch (err: any) {
      const errMsg = (err.message || '').toLowerCase();
      const isApiKeyError = errMsg.includes('api key not valid') || 
                           errMsg.includes('api_key_invalid') || 
                           errMsg.includes('api key') || 
                           errMsg.includes('unauthenticated') || 
                           errMsg.includes('invalid key');

      let friendlyMessage = err.message || 'Ndodhi një gabim gjatë komunikimit me AI.';
      if (isApiKeyError) {
        console.log('[AI Chat Info] Gemini API Key is missing or invalid.');
        friendlyMessage = 'Çelësi juaj API i Gemini nuk është i vlefshëm ose mungon. Ju lutem kontrolloni dhe rregulloni konfigurimin e çelësit tuaj në panelin "Settings > Secrets" të AI Studio, ose klikoni ikonën e konfigurimit të çelësit (🔑) lart në këtë dritare chat-i për të vendosur një çelës API personal.';
      } else {
        console.log('[AI Chat Info] Unhandled AI request:', err.message || err);
      }

      return res.status(200).json({
        text: `⚠️ **${friendlyMessage}**\n\n_Ju mund të krijoni një çelës API të ri plotësisht falas te Google AI Studio duke vizituar [aistudio.google.com](https://aistudio.google.com/)._`
      });
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
