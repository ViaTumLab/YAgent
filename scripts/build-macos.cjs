'use strict';

const path = require('node:path');
const { execFileSync } = require('node:child_process');
if (process.platform !== 'darwin' || process.arch !== 'arm64') {
  throw Error('Build macOS on Apple Silicon with arm64 Node.js. Intel needs a separately verified OpenCode patch.');
}
const root = path.resolve(__dirname, '..');
const npm = process.env.npm_execpath;
if (!npm) throw Error('Run npm run build:mac');
function run(script, args = []) {
  execFileSync(process.execPath, [script, ...args], { cwd: root, stdio: 'inherit' });
}
for (const task of ['bundle:katex', 'build:playwright', 'bundle:opencode-provider',
  'bundle:dsh-review', 'bundle:tts', 'bundle:voice', 'bundle:intelligent-ui']) {
  run(npm, ['run', task]);
}
run(path.join(__dirname, 'write-build-manifest.cjs'));
run(require.resolve('electron-builder/cli.js'), ['--config', 'build/electron-builder.mac.cjs', '--mac', '--publish', 'never']);
const { version } = require('../package.json');
execFileSync('hdiutil', ['verify', path.join(root, 'dist', `Yan.Agent.v${version}.macOS.${process.arch}.dmg`)], { stdio: 'inherit' });
run(path.join(__dirname, 'verify-macos.cjs'));
