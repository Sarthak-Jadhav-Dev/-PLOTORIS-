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
    let original = content;

    // Use a more aggressive regex to match the if (!geminiKey) block regardless of what the error message says
    // It looks for `if (!geminiKey) {` and everything up to `}`
    content = content.replace(/if\s*\(\!geminiKey\)\s*\{[\s\S]*?\s*\}\s*;/g, '');
    content = content.replace(/if\s*\(\!geminiKey\)\s*\{[\s\S]*?\s*\}/g, '');
    
    // Check if there are any rogue references to geminiKey left
    // If there is `geminiKey: req.headers.get("x-gemini-key")` etc.
    content = content.replace(/const geminiKey[\s\S]*?;\s*/g, ''); // if any const geminiKey is left

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed residual geminiKey in: ${filePath}`);
    }
  }
});
