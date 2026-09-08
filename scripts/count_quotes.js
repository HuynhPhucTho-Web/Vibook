const fs = require('fs');
const path = 'src/pages/source/data/hcm202.js';
const s = fs.readFileSync(path, 'utf8');
const counts = {
  double: (s.match(/"/g) || []).length,
  single: (s.match(/'/g) || []).length,
  backtick: (s.match(/`/g) || []).length
};
console.log('counts for', path, counts);
// Also print first 1000 chars around likely area near 320
const loc = 32000; // arbitrary
console.log('\nSample start (first 2000 chars):\n');
console.log(s.slice(0,2000));
