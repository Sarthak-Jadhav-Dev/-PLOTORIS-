const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const targetDir = path.join(__dirname, 'src/components');

walkDir(targetDir, function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Pattern 1
    const regex1 = /const activeProvider = ([a-zA-Z\.\?]+) \? localStorage\.getItem\(`plotoris_active_provider_\$\{([^}]+)\}`\) \|\| "gemini" : "gemini";\s*const apiKey = ([a-zA-Z\.\?]+) \? localStorage\.getItem\(`plotoris_\$\{activeProvider\}_key_\$\{([^}]+)\}`\) \|\| "" : "";\s*const headers: any = \{ "Content-Type": "application\/json" \};\s*if \(apiKey\) \{\s*headers\["x-api-key"\] = apiKey;\s*headers\["x-api-provider"\] = activeProvider;\s*\}/g;
    content = content.replace(regex1, (match, p1, p2, p3, p4) => {
      modified = true;
      return `const activeProvider = ${p1} ? localStorage.getItem(\`plotoris_active_provider_\$\{${p2}\}\`) || "gemini" : "gemini";
      const apiKey = ${p1} ? localStorage.getItem(\`plotoris_\$\{activeProvider\}_key_\$\{${p2}\}\`) || "" : "";
      const geminiKey = ${p1} ? localStorage.getItem(\`plotoris_gemini_key_\$\{${p2}\}\`) || "" : "";
      const headers: any = { "Content-Type": "application/json" };
      if (apiKey) {
        headers["x-api-key"] = apiKey;
        headers["x-api-provider"] = activeProvider;
      }
      if (geminiKey) headers["x-gemini-key"] = geminiKey;`;
    });

    // Pattern 2
    const regex2 = /const activeProvider = localStorage.getItem\(`plotoris_active_provider_\$\{([^}]+)\}`\) \|\| "gemini";\s*const apiKey = localStorage\.getItem\(`plotoris_\$\{activeProvider\}_key_\$\{([^}]+)\}`\) \|\| "";\s*const headers: any = \{ "Content-Type": "application\/json" \};\s*if \(apiKey\) \{\s*headers\["x-api-key"\] = apiKey;\s*headers\["x-api-provider"\] = activeProvider;\s*\}/g;
    content = content.replace(regex2, (match, p1, p2) => {
      modified = true;
      return `const activeProvider = localStorage.getItem(\`plotoris_active_provider_\$\{${p1}\}\`) || "gemini";
      const apiKey = localStorage.getItem(\`plotoris_\$\{activeProvider\}_key_\$\{${p1}\}\`) || "";
      const geminiKey = localStorage.getItem(\`plotoris_gemini_key_\$\{${p1}\}\`) || "";
      const headers: any = { "Content-Type": "application/json" };
      if (apiKey) {
        headers["x-api-key"] = apiKey;
        headers["x-api-provider"] = activeProvider;
      }
      if (geminiKey) headers["x-gemini-key"] = geminiKey;`;
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated frontend for geminiKey: ${filePath}`);
    }
  }
});
