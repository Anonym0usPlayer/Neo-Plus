import { compile } from 'sass';
import { build } from 'esbuild';
import { writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const scssPath = resolve(__dirname, 'styles/index.scss');
const cssPath = resolve(__dirname, 'index.css');
const cssResult = compile(scssPath, { style: 'compressed' });
writeFileSync(cssPath, cssResult.css);
console.log('Build complete: index.css');
const tsEntry = resolve(__dirname, 'src/index.ts');
const jsOut = resolve(__dirname, 'index.js');
await build({
  entryPoints: [tsEntry],
  outfile: jsOut,
  bundle: true,
  format: 'cjs',
  platform: 'neutral',
  mainFields: ['module', 'main'],
  external: ['siyuan'],
  target: 'es2020',
  minify: true,
});
console.log('Build complete: index.js');
