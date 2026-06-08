// Copies YAML, JSON, and Markdown assets from src/ to dist/ so they're available at runtime.
const { copyFileSync, mkdirSync, existsSync, readdirSync, statSync } = require('fs');
const { join, dirname } = require('path');
const { globSync } = require('glob') || { globSync: null };

function ensureDir(p) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

function copyRecursive(srcDir, destDir, extensions) {
  if (!existsSync(srcDir)) return;
  const entries = readdirSync(srcDir);
  for (const entry of entries) {
    const srcPath = join(srcDir, entry);
    const destPath = join(destDir, entry);
    const stat = statSync(srcPath);
    if (stat.isDirectory()) {
      copyRecursive(srcPath, destPath, extensions);
    } else if (extensions.some(ext => entry.endsWith(ext))) {
      ensureDir(dirname(destPath));
      copyFileSync(srcPath, destPath);
      console.log(`  copied: src/${join(srcDir.replace(__dirname, '').replace(/^[\\/]/, ''), entry).replace(/\\/g, '/')} → dist/`);
    }
  }
}

const srcRoot = join(__dirname, '..', 'src');
const distRoot = join(__dirname, '..', 'dist');

console.log('Copying assets...');
copyRecursive(srcRoot, distRoot, ['.yaml', '.json', '.md']);
console.log('Done.');
