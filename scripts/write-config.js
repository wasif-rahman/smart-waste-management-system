const fs = require('fs');
const path = require('path');

// Log what the script sees (safely)
console.log('Build Environment Check:');
console.log('SUPABASE_URL present:', !!process.env.SUPABASE_URL);
console.log('SUPABASE_ANON_KEY present:', !!process.env.SUPABASE_ANON_KEY);

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Error: Environment variables are missing in Vercel settings.');
  process.exit(1);
}

// Generate the file in the current directory (which is 'frontend')
const outPath = path.join(process.cwd(), 'config.js');
const content = `// Auto-generated during build\nconst SUPABASE_URL = '${url}';\nconst SUPABASE_ANON_KEY = '${key}';\n`;

try {
  fs.writeFileSync(outPath, content, { encoding: 'utf8' });
  console.log('Successfully wrote config.js to:', outPath);
} catch (err) {
  console.error('File system error:', err);
  process.exit(1);
}
