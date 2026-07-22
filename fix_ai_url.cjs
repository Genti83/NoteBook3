const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const targetFetch = `       const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: promptText, documents: docsForAi, activeDocId, image: aiChatImage, audio: aiChatAudio })
       });`;

const replacementFetch = `       // Use production URL if running on native (Capacitor) because the local server isn't running there.
       const baseUrl = Capacitor.isNativePlatform() ? 'https://ais-pre-dva77knoqcna5xt4l6qx7i-4359193177.europe-west1.run.app' : '';
       const response = await fetch(baseUrl + '/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: promptText, documents: docsForAi, activeDocId, image: aiChatImage, audio: aiChatAudio })
       });`;

if (code.includes(targetFetch)) {
    code = code.replace(targetFetch, replacementFetch);
    fs.writeFileSync('src/components/Notepad.tsx', code);
    console.log("AI Fetch URL updated for Native!");
} else {
    console.log("Target fetch not found or already replaced.");
}
