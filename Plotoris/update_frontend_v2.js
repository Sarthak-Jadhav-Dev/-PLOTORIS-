const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const targetDir = path.join(__dirname, 'src/components/chat');

walkDir(targetDir, function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Pattern 1: With ternary `projectId ? ... : ""`
    const regex1 = /const activeProvider = ([a-zA-Z\.\?]+) \? localStorage\.getItem\(`plotoris_active_provider_\$\{([^}]+)\}`\) \|\| "gemini" : "gemini";\s*const apiKey = ([a-zA-Z\.\?]+) \? localStorage\.getItem\(`plotoris_\$\{activeProvider\}_key_\$\{([^}]+)\}`\) \|\| "" : "";\s*const geminiKey = ([a-zA-Z\.\?]+) \? localStorage\.getItem\(`plotoris_gemini_key_\$\{([^}]+)\}`\) \|\| "" : "";\s*const headers: any = (\{[^\}]*\});\s*if \(apiKey\) \{\s*headers\["x-api-key"\] = apiKey;\s*headers\["x-api-provider"\] = activeProvider;\s*\}\s*if \(geminiKey\) headers\["x-gemini-key"\] = geminiKey;/g;

    let modified = false;
    content = content.replace(regex1, (match, p1, p2, p3, p4, p5, p6, headersObj) => {
      modified = true;
      return `const activeTextProvider = ${p1} ? localStorage.getItem(\`plotoris_active_text_provider_\$\{${p2}\}\`) || "gemini" : "gemini";
      const activeEmbeddingProvider = ${p1} ? localStorage.getItem(\`plotoris_active_embedding_provider_\$\{${p2}\}\`) || "gemini" : "gemini";
      const textKey = ${p1} ? localStorage.getItem(\`plotoris_\$\{activeTextProvider\}_key_\$\{${p2}\}\`) || "" : "";
      const embeddingKey = ${p1} ? localStorage.getItem(\`plotoris_\$\{activeEmbeddingProvider\}_key_\$\{${p2}\}\`) || "" : "";
      const headers: any = ${headersObj};
      if (textKey) {
        headers["x-api-key"] = textKey;
        headers["x-api-provider"] = activeTextProvider;
      }
      if (embeddingKey) {
        headers["x-embedding-key"] = embeddingKey;
        headers["x-embedding-provider"] = activeEmbeddingProvider;
      }`;
    });

    // Pattern 2: Without ternary
    const regex2 = /const activeProvider = localStorage\.getItem\(`plotoris_active_provider_\$\{([^}]+)\}`\) \|\| "gemini";\s*const apiKey = localStorage\.getItem\(`plotoris_\$\{activeProvider\}_key_\$\{([^}]+)\}`\) \|\| "";\s*const geminiKey = localStorage\.getItem\(`plotoris_gemini_key_\$\{([^}]+)\}`\) \|\| "";\s*const headers: any = (\{[^\}]*\});\s*if \(apiKey\) \{\s*headers\["x-api-key"\] = apiKey;\s*headers\["x-api-provider"\] = activeProvider;\s*\}\s*if \(geminiKey\) headers\["x-gemini-key"\] = geminiKey;/g;

    content = content.replace(regex2, (match, p1, p2, p3, headersObj) => {
      modified = true;
      return `const activeTextProvider = localStorage.getItem(\`plotoris_active_text_provider_\$\{${p1}\}\`) || "gemini";
      const activeEmbeddingProvider = localStorage.getItem(\`plotoris_active_embedding_provider_\$\{${p1}\}\`) || "gemini";
      const textKey = localStorage.getItem(\`plotoris_\$\{activeTextProvider\}_key_\$\{${p1}\}\`) || "";
      const embeddingKey = localStorage.getItem(\`plotoris_\$\{activeEmbeddingProvider\}_key_\$\{${p1}\}\`) || "";
      const headers: any = ${headersObj};
      if (textKey) {
        headers["x-api-key"] = textKey;
        headers["x-api-provider"] = activeTextProvider;
      }
      if (embeddingKey) {
        headers["x-embedding-key"] = embeddingKey;
        headers["x-embedding-provider"] = activeEmbeddingProvider;
      }`;
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated frontend for text/embedding separation: ${filePath}`);
    }
  }
});
