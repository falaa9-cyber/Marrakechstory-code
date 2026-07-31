import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { transformWithEsbuild } from 'vite';

function walkJsxFiles(dir) {
  if (!fs.existsSync(dir)) return [];

  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkJsxFiles(full));
    else if (entry.isFile() && full.endsWith('.jsx')) out.push(full);
  }
  return out;
}

export async function compileJsxTree({ srcDir, outDir, target = 'es2018' }) {
  const files = walkJsxFiles(srcDir);

  for (const file of files) {
    const rel = path.relative(srcDir, file);
    const dest = path.resolve(outDir, rel.replace(/\.jsx$/, '.js'));
    const code = fs.readFileSync(file, 'utf8');
    const transformed = await transformWithEsbuild(code, file, {
      loader: 'jsx',
      jsx: 'transform',
      target,
      sourcemap: false,
    });

    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, transformed.code);
  }

  return files.length;
}

export function rewriteHtmlScriptEntries(file) {
  if (!fs.existsSync(file)) return false;

  let html = fs.readFileSync(file, 'utf8');
  html = html.replace(
    /\n\s*<script src="https:\/\/unpkg\.com\/@babel\/standalone@7\.29\.0\/babel\.min\.js" crossorigin="anonymous"><\/script>\n\s*<script>if \(!window\.Babel\) \{ document\.write\('<scr'\+'ipt src="https:\/\/cdn\.jsdelivr\.net\/npm\/@babel\/standalone@7\.29\.0\/babel\.min\.js"><\\\/scr'\+'ipt>'\); \}<\/script>\n/g,
    '\n'
  );
  html = html.replace(/<script type="text\/babel" src="([^"]+)\.jsx(\?v=\d+)"><\/script>/g, '<script src="$1.js$2"></script>');
  fs.writeFileSync(file, html);
  return true;
}

const thisFile = fileURLToPath(import.meta.url);
const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === thisFile;

if (isDirectRun) {
  const root = process.cwd();
  const count = await compileJsxTree({
    srcDir: path.resolve(root, 'src'),
    outDir: path.resolve(root, 'src'),
    target: 'es2018',
  });

  rewriteHtmlScriptEntries(path.resolve(root, 'index.html'));
  rewriteHtmlScriptEntries(path.resolve(root, 'admin.html'));

  console.log(`[sync-browser-js] compiled ${count} JSX files into src/*.js and rewrote HTML entrypoints.`);
}
