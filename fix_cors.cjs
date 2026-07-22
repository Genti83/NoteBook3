const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetCORS = `  const app = express();
  const PORT = 3000;
  app.use(express.json({ limit: '10mb' }));

  // AI API Route handlers`;

const replacementCORS = `  const app = express();
  const PORT = 3000;
  app.use(express.json({ limit: '10mb' }));
  
  // Enable CORS for Capacitor APK
  app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      if (req.method === 'OPTIONS') {
          return res.status(200).end();
      }
      next();
  });

  // AI API Route handlers`;

if (!code.includes('Access-Control-Allow-Origin')) {
    code = code.replace(targetCORS, replacementCORS);
    fs.writeFileSync('server.ts', code);
    console.log("CORS enabled in server.ts");
}
