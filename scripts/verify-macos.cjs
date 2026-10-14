'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { _electron } = require('playwright');

const root = path.resolve(__dirname, '..');
const app = path.resolve(process.argv[2] || path.join(root, 'dist', process.arch === 'arm64' ? 'mac-arm64' : 'mac', 'Yan Agent.app'));
const resources = path.join(app, 'Contents/Resources');
const unpacked = path.join(resources, 'app.asar.unpacked');
const executable = path.join(app, 'Contents/MacOS/Yan Agent');

async function main() {
  assert.equal(process.platform, 'darwin');
  execFileSync(process.execPath, [path.join(__dirname, 'verify-packaged-runtime.cjs'), resources], { stdio: 'inherit' });
  execFileSync('codesign', ['--verify', '--deep', '--strict', app], { stdio: 'inherit' });
  const codegraph = require(path.join(unpacked, 'lib/codegraph-runtime')).resolveRuntime(unpacked);
  assert.ok(codegraph.ok, codegraph.error);
  execFileSync(codegraph.command, [...codegraph.args, '--version'], { stdio: 'inherit', timeout: 30000 });
  const opencode = path.join(unpacked, 'node_modules', `opencode-darwin-${process.arch}`, 'bin/opencode');
  execFileSync(opencode, ['--version'], { stdio: 'inherit', timeout: 30000 });
  execFileSync(path.join(resources, 'officecli-runtime/officecli'), ['--version'], { stdio: 'inherit', timeout: 30000 });
  execFileSync(process.execPath, [path.join(root, 'test/provider-runtime-matrix.e2e.cjs')], {
    stdio: 'inherit', env: { ...process.env, YAN_OPENCODE_EXECUTABLE: opencode,
      YAN_PROVIDER_MODULE_PATH: path.join(unpacked, 'lib/opencode-dsml-provider.mjs'),
      YAN_PACKAGED_APP_ROOT: path.join(resources, 'app.asar') }
  });
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'yan-macos-smoke-'));
  let electron;
  try {
    const env = { ...process.env, YAN_E2E_MODE: '1', YAN_E2E_USER_DATA_DIR: profile };
    delete env.ELECTRON_RUN_AS_NODE;
    electron = await _electron.launch({ executablePath: executable, env, timeout: 60000 });
    const page = await electron.firstWindow();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.waitForFunction(() => window.__YAN_APP_READY__, undefined, { timeout: 60000 });
    assert.deepEqual(errors, [], 'Renderer must start without uncaught errors');
    assert.ok(await page.evaluate(() => Boolean(window.yan)), 'Preload bridge must be present');
    fs.mkdirSync(path.join(root, 'output'), { recursive: true });
    await page.screenshot({ path: path.join(root, 'output/macos-smoke.png') });
    console.log('[verify-macos] Packaged app starts, renderer is ready, and preload bridge is available.');
  } finally {
    await electron?.close();
    fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 500 });
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
