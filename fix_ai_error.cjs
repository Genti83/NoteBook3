const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const targetCatch = `    } catch (err) {
       setAiChatResponse("Gabim lidhjeje me serverin.");
    }`;

const replacementCatch = `    } catch (err: any) {
       setAiChatResponse("Gabim lidhjeje me serverin (Network/CORS): " + err.message + ". Sigurohuni që pajisja ka internet dhe që keni bërë 'Share' aplikacionin në AI Studio që të përditësohet serveri.");
    }`;

if (code.includes(targetCatch)) {
    code = code.replace(targetCatch, replacementCatch);
    fs.writeFileSync('src/components/Notepad.tsx', code);
    console.log("AI Catch fixed!");
}
