import { compile } from 'sass';
import { build } from 'esbuild';
import { writeFileSync, unlinkSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
// 0. 液态玻璃滤镜 codegen：生成 src/modules/liquidglassfilter.ts
const codegenEntry = resolve(__dirname, 'scripts/liquidglass.ts');
const codegenOut = resolve(__dirname, 'scripts/.gen-liquidglass.mjs');
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
