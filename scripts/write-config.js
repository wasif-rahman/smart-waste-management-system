const fs = require('fs');
const path = require('path');

// This will help us see what Vercel is actually passing in the logs
console.log('--- DEBUG INFO ---');
console.log('Available Env Vars:', Object.keys(process.env).filter(key => key.includes('SUPABASE')));

const url = process.env.SUPABASE_URL || 'MISSING_URL';
const key = process.env.SUPABASE_ANON_KEY || 'MISSING_KEY';

const outPath = path.join(process.cwd(), 'config.js');
const content = `const SUPABASE_URL = '${url}';\nconst SUPABASE_ANON_KEY = '${key}';\n`;

fs.writeFileSync(outPath, content, { encoding: 'utf8' });
console.log('Wrote config.js to:', outPath);
