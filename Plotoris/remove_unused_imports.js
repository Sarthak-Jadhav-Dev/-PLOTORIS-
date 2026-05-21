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

    // Remove unused import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
    content = content.replace(/import\s*\{\s*ChatGoogleGenerativeAI\s*,\s*GoogleGenerativeAIEmbeddings\s*\}\s*from\s*"@langchain\/google-genai";?\s*/g, '');
    content = content.replace(/import\s*\{\s*GoogleGenerativeAIEmbeddings\s*,\s*ChatGoogleGenerativeAI\s*\}\s*from\s*"@langchain\/google-genai";?\s*/g, '');
    content = content.replace(/import\s*\{\s*ChatGoogleGenerativeAI\s*\}\s*from\s*"@langchain\/google-genai";?\s*/g, '');
    content = content.replace(/import\s*\{\s*GoogleGenerativeAIEmbeddings\s*\}\s*from\s*"@langchain\/google-genai";?\s*/g, '');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Removed unused imports in: ${filePath}`);
    }
  }
});
