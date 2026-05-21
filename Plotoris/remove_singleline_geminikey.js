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

    content = content.replace(/if \(!geminiKey\) return NextResponse\.json\([\s\S]*?;\s*/g, '');
    
    // Also remove geminiKey from AgentState types if any
    content = content.replace(/geminiKey:\s*string;\s*/g, '');
    content = content.replace(/geminiKey:\s*\{[\s\S]*?\},\s*/g, '');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed residual single-line geminiKey in: ${filePath}`);
    }
  }
});
