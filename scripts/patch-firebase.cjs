const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

const filesToPatch = [
  path.join(rootDir, 'node_modules', '@firebase', 'firestore', 'dist', 'index.esm.js'),
  path.join(rootDir, 'node_modules', '@firebase', 'firestore', 'dist', 'index.cjs.js'),
  path.join(rootDir, 'node_modules', '@firebase', 'firestore', 'dist', 'index.rn.js'),
];

let patchedCount = 0;

filesToPatch.forEach((filePath) => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    const target = 'this.ve -= 1, __PRIVATE_hardAssert(this.ve >= 0, 3241, {';
    const replacement = 'this.ve = Math.max(0, this.ve - 1), __PRIVATE_hardAssert(this.ve >= 0, 3241, {';

    if (content.includes(target)) {
      content = content.replace(target, replacement);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`[patch-firebase] Successfully patched: ${filePath}`);
      patchedCount++;
    } else if (content.includes(replacement)) {
      console.log(`[patch-firebase] Already patched: ${filePath}`);
      patchedCount++;
    } else {
      console.warn(`[patch-firebase] Target string not found in: ${filePath}`);
    }
  }
});

// Clear or patch Vite cache
const viteDepsDir = path.join(rootDir, 'node_modules', '.vite');
if (fs.existsSync(viteDepsDir)) {
  try {
    fs.rmSync(viteDepsDir, { recursive: true, force: true });
    console.log('[patch-firebase] Cleared node_modules/.vite cache so Vite re-bundles with patched Firestore.');
  } catch (err) {
    console.warn('[patch-firebase] Could not delete .vite cache:', err.message);
  }
}

console.log(`[patch-firebase] Completed. Patched ${patchedCount} files.`);
