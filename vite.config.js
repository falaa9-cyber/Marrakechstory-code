import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'fs';
import path from 'path';

// Marrakech Story is a "no-build" UMD React + Babel-in-browser app.
// Vite is only used so Hostinger detects a framework. The build step
// just copies every static asset Vite normally ignores into dist/.

function copyEverythingStatic() {
  const root = process.cwd();
  // Paths to copy verbatim into the build output
  const include = ['src', 'assets', 'styles.css'];

  return {
    name: 'copy-static-tree',
    apply: 'build',
    closeBundle() {
      const outDir = path.resolve(root, 'dist');
      const copyRecursive = (src, dest) => {
        const stat = fs.statSync(src);
        if (stat.isDirectory()) {
          fs.mkdirSync(dest, { recursive: true });
          for (const f of fs.readdirSync(src)) {
            copyRecursive(path.join(src, f), path.join(dest, f));
          }
        } else {
          fs.mkdirSync(path.dirname(dest), { recursive: true });
          fs.copyFileSync(src, dest);
        }
      };
      for (const entry of include) {
        const from = path.resolve(root, entry);
        if (!fs.existsSync(from)) continue;
        const to = path.resolve(outDir, entry);
        copyRecursive(from, to);
      }
    }
  };
}

export default defineConfig({
  // Treat the project as a "multi-page app" so Vite doesn't try to
  // bundle the in-browser Babel scripts as ES modules.
  appType: 'mpa',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(process.cwd(), 'index.html')
    }
  },
  plugins: [copyEverythingStatic()]
});
