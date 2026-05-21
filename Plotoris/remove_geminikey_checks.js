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

    // Remove const geminiKey line
    content = content.replace(/const geminiKey = req\.headers\.get\("x-gemini-key"\) \|\| process\.env\.GEMINI_API_KEY;\s*/g, '');
    
    // Remove if (!geminiKey) block
    content = content.replace(/if \(!geminiKey\) \{\s*return NextResponse\.json\(\{ error: "Gemini API key is required\." \}, \{ status: 401 \}\);\s*\}\s*/g, '');

    // Remove if (!geminiKey) block with different quotes
    content = content.replace(/if \(!geminiKey\) \{\s*return NextResponse\.json\(\{ error: 'Gemini API key is required\.' \}, \{ status: 401 \}\);\s*\}\s*/g, '');

    // Remove geminiKey from initial states if it exists (e.g. geminiKey: geminiKey,)
    content = content.replace(/geminiKey: geminiKey,\s*/g, '');
    // Or just geminiKey,
    content = content.replace(/geminiKey,\s*/g, '');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Cleaned up geminiKey from: ${filePath}`);
    }
  }
});
