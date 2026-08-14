import fs from 'fs';
import path from 'path';

/**
 * Loads all markdown files from the knowledge-base directory and concatenates them
 * into a single comprehensive string to be used as context for the AI.
 */
export async function getKnowledgeBaseContext(): Promise<string> {
  const kbDir = path.join(process.cwd(), 'src', 'lib', 'ai', 'knowledge-base');
  
  if (!fs.existsSync(kbDir)) {
    console.warn('Knowledge base directory not found at:', kbDir);
    return '';
  }

  const files = fs.readdirSync(kbDir).filter(file => file.endsWith('.md'));
  
  if (files.length === 0) {
    console.warn('No markdown files found in knowledge base directory.');
    return '';
  }

  let context = 'SHEILZ POS APPLICATION DOCUMENTATION\n=======================================\n\n';

  for (const file of files) {
    const filePath = path.join(kbDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    context += `\n--- START OF ${file} ---\n`;
    context += content;
    context += `\n--- END OF ${file} ---\n\n`;
  }

  return context;
}
