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

    // Fix imports
    if (content.includes('import { getLLM } from "@/lib/ai-provider";')) {
      if (!content.includes('getEmbeddings') && content.includes('GoogleGenerativeAIEmbeddings')) {
        content = content.replace(
          'import { getLLM } from "@/lib/ai-provider";',
          'import { getLLM, getEmbeddings } from "@/lib/ai-provider";'
        );
        modified = true;
      }
    } else if (content.includes('GoogleGenerativeAIEmbeddings')) {
      if (!content.includes('getEmbeddings')) {
        content = content.replace(
          /import \{ NextResponse \} from "next\/server";/,
          `import { NextResponse } from "next/server";\nimport { getEmbeddings } from "@/lib/ai-provider";`
        );
        modified = true;
      }
    }

    // Replace Embeddings Initialization
    const regex1 = /const ([a-zA-Z0-9_]+) = new GoogleGenerativeAIEmbeddings\(\{\s*apiKey: (.*?),\s*model: ["']([^"']+)["'],?\s*\}\);/g;
    
    content = content.replace(regex1, (match, varName) => {
      modified = true;
      return `const ${varName} = getEmbeddings(req);`;
    });

    const regex2 = /const ([a-zA-Z0-9_]+) = new GoogleGenerativeAIEmbeddings\(\{([^}]*)\}\);/g;
    content = content.replace(regex2, (match, varName) => {
        // Double check it's not already matched by regex1
        if (match.includes("apiKey")) {
            modified = true;
            // req is available as `req` or `request` depending on the route.
            // Let's use whatever was passed to getLLM, or guess req/request
            let reqVar = content.includes('req: Request') ? 'req' : 'request';
            return `const ${varName} = getEmbeddings(${reqVar});`;
        }
        return match;
    });


    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated backend embeddings: ${filePath}`);
    }
  }
});
