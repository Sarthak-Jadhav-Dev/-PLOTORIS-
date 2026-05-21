const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const targetDir = path.join(__dirname, 'src/app/api');

walkDir(targetDir, function(filePath) {
  if (filePath.endsWith('route.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Use a more permissive regex that allows for anything before the closing `});`
    // Wait, let's just match the start and extract model and temperature manually
    const regex1 = /const ([a-zA-Z0-9_]+) = new ChatGoogleGenerativeAI\(\{\s*apiKey: (.*?),\s*model: ["']([^"']+)["'],\s*temperature: ([0-9.]+)(.*?)\}\);/gs;
    
    content = content.replace(regex1, (match, varName, apiKeyVar, modelName, temp) => {
      modified = true;
      return `const ${varName} = getLLM(req, ${temp}, "${modelName}");`;
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated backend regex: ${filePath}`);
    }
  }
});
