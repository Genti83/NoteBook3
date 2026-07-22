const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetCORS = `  app.use(express.json({ limit: '10mb' }));`;
const replacementCORS = `  app.use(express.json({ limit: '10mb' }));
  
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
`;

if (code.includes(targetCORS)) {
    code = code.replace(targetCORS, replacementCORS);
    fs.writeFileSync('server.ts', code);
    console.log("CORS added to server.ts");
} else {
    console.log("Could not find target string.");
}
