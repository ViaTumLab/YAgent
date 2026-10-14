'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');

test('macOS update handlers do not fetch or open a Windows installer', async () => {
  const file = path.join(__dirname, '../lib/main/ipc-tools.js');
  const context = { require: createRequire(file), process: { platform: 'darwin' }, module: { exports: {} } };
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), context);
  const handlers = new Map();
  context.module.exports.registerToolsIpc({
    ipcMain: { handle: (name, handler) => handlers.set(name, handler) },
    config: { load() {} }, paths: {},
    app: { getVersion() { assert.fail('Must not check the Windows feed'); } },
    shell: { openPath() { assert.fail('Must not open a Windows installer'); } }
  });
  for (const name of ['update:check', 'update:download', 'update:install']) {
    const result = await handlers.get(name)();
    assert.equal(result.ok, false);
    assert.equal(result.error, 'unsupported-platform');
    assert.match(result.message, /手动更新/);
  }
});
