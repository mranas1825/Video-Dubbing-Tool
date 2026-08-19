const fs = require('fs');
const path = require('path');
const { execSync, exec } = require('child_process');

const rootDir = path.join(__dirname, '..');
const srcDir = path.join(rootDir, 'src');
const pythonDir = path.join(rootDir, 'python');
const exePath = path.join(rootDir, 'dist_electron', 'win-unpacked', 'DubCraft AI.exe');

console.log('====================================================');
console.log('   DubCraft AI — Automatic Code & EXE Watcher System');
console.log('====================================================');
console.log('[Watcher] Monitoring src/ and python/ for changes...');

let buildTimeout = null;

function triggerAutoBuild(filePath) {
  if (buildTimeout) clearTimeout(buildTimeout);
  console.log(`[File Change Detected] ${path.relative(rootDir, filePath)} modified.`);
  console.log('[Auto-Build] Re-compiling updated DubCraft AI.exe in background...');

  buildTimeout = setTimeout(() => {
    try {
      execSync('npm run dist', { cwd: rootDir, stdio: 'inherit' });
      console.log('[Auto-Build Success] DubCraft AI.exe updated successfully!');
    } catch (err) {
      console.error('[Auto-Build Error] Failed to update .exe:', err.message);
    }
  }, 1500); // 1.5 second debounce delay
}

function watchDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  fs.watch(dir, { recursive: true }, (eventType, filename) => {
    if (filename && !filename.includes('node_modules') && !filename.includes('.git') && !filename.includes('temp')) {
      const fullPath = path.join(dir, filename);
      triggerAutoBuild(fullPath);
    }
  });
}

watchDirectory(srcDir);
watchDirectory(pythonDir);

// Initial build if EXE does not exist yet
if (!fs.existsSync(exePath)) {
  console.log('[Initial Build] DubCraft AI.exe not found. Building initial executable...');
  try {
    execSync('npm run dist', { cwd: rootDir, stdio: 'inherit' });
    console.log('[Initial Build Success] DubCraft AI.exe created!');
  } catch (err) {
    console.error('[Initial Build Error]', err.message);
  }
}
