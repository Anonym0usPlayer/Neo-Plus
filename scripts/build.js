import { compile } from 'sass';
import { build } from 'esbuild';
import { writeFileSync, unlinkSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const codegenEntry = resolve(__dirname, 'liquidglass.ts');
const codegenOut = resolve(__dirname, '.gen-liquidglass.mjs');
await build({
  entryPoints: [codegenEntry],
  outfile: codegenOut,
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node18',
});
await import(pathToFileURL(codegenOut).href);
unlinkSync(codegenOut);
const scssPath = resolve(root, 'styles/index.scss');
const cssPath = resolve(root, 'index.css');
const cssResult = compile(scssPath, { style: 'compressed' });
writeFileSync(cssPath, cssResult.css);
console.log('Build complete: index.css');
const tsEntry = resolve(root, 'src/index.ts');
const jsOut = resolve(root, 'index.js');
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
