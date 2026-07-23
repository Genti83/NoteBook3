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
      const { userId, documents, activeDocId, blueText, secretList, pin } = req.body;
      const key = (userId || 'default_user').trim().toLowerCase();
      const db = readCloudDb();
      
      const lastUpdated = new Date().toISOString();
      db[key] = {
        documents: documents || [],
        activeDocId: activeDocId || null,
        blueText: blueText !== undefined ? blueText : db[key]?.blueText,
        secretList: secretList !== undefined ? secretList : db[key]?.secretList,
        pin: pin !== undefined ? pin : db[key]?.pin,
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
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'GEMINI_API_KEY environment variable is missing on server.' });
      }

      const { prompt, documents, activeDocId, image, audio } = req.body;
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      const systemInstruction = `Ti je një asistent AI për një aplikacion Bllok/Notepad, i jepur pas analizës inteligjente, matematikës dhe përmbledhjeve të çdo lloj blloku që përdoruesi krijon. Përdoruesi po të jep akses të plotë tek TË GJITHA DOKUMENTAT në PLATFORMË.
Këtu janë të dhënat e dokumenteve aktualë në formatin JSON:
${JSON.stringify(documents, null, 2)}

Dokumenti aktual aktiv që përdoruesi po shikon është me ID: "${activeDocId}". Ofroni përgjigjen duke u bazuar plotësisht në KËTË DOKUMENT.

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

      const candidateModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
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
        }
      }

      throw lastError || new Error("Asnjë nga modelet e AI nuk u përgjigj.");
    } catch (err: any) {
      console.error('AI Chat Error:', err);
      res.status(500).json({ error: err.message || 'Ndodhi një gabim gjatë komunikimit me AI.' });
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
