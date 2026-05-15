import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const files = [
  'i18n',
  'icon.png',
  'preview.png',
  'index.css',
  'index.js',
  'plugin.json',
  'README_zh_CN.md',
  'README.md'
];
for (const file of files) {
  const fullPath = resolve(__dirname, file);
  if (!existsSync(fullPath)) {
    console.error(`Error: ${file} not found at ${fullPath}`);
    process.exit(1);
  }
}
console.log('Creating package.zip...');
execSync(`zip -r package.zip ${files.join(' ')}`, { cwd: __dirname, stdio: 'inherit' });
console.log('Package created: package.zip');
