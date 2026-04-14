import fs from 'fs';
import path from 'path';

const dir = 'src/lib/modules/llm/providers';
const files = fs.readdirSync(dir);

for (const file of files) {
  if (!file.endsWith('.ts')) continue;
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  
  if (content.includes('createOpenAI')) {
    content = content.replace(/return ([a-zA-Z0-9_]+)\(model\);/g, 'return $1.chat(model);');
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
  }
}
