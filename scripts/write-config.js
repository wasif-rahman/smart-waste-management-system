const fs = require('fs');
const path = require('path');

// This version won't crash your build
const url = process.env.SUPABASE_URL || 'UNDEFINED_URL';
const key = process.env.SUPABASE_ANON_KEY || 'UNDEFINED_KEY';

if (url === 'UNDEFINED_URL') {
    console.warn('WARNING: SUPABASE_URL is missing from Vercel Settings');
}

const outPath = path.join(process.cwd(), 'config.js');
const content = `const SUPABASE_URL = '${url}';\nconst SUPABASE_ANON_KEY = '${key}';\n`;

fs.writeFileSync(outPath, content, { encoding: 'utf8' });
console.log('Build finished. config.js created.');
