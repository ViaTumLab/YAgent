'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');

for (const platform of ['win32', 'darwin']) {
  test(`packaged CodeGraph resolves its private Node on ${platform}`, t => {
    const resources = fs.mkdtempSync(path.join(os.tmpdir(), 'yan-codegraph-test-'));
    t.after(() => fs.rmSync(resources, { recursive: true, force: true }));
    const runtime = path.join(resources, 'codegraph-runtime');
    const entry = path.join(runtime, 'lib/dist/bin/codegraph.js');
    fs.mkdirSync(path.dirname(entry), { recursive: true });
    fs.writeFileSync(entry, '');
    const node = path.join(runtime, platform === 'win32' ? 'node.exe' : 'node');
    fs.writeFileSync(node, '');
    const context = { require, process: { platform, arch: platform === 'win32' ? 'x64' : 'arm64' }, module: { exports: {} } };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../lib/codegraph-runtime.js'), 'utf8'), context);
    for (const name of ['app.asar', 'app.asar.unpacked']) {
      const result = context.module.exports.resolveRuntime(path.join(resources, name));
      assert.equal(result.ok, true, result.error);
      assert.equal(result.command, node);
      assert.ok(result.args.includes(entry));
    }
    fs.rmSync(node);
    assert.equal(context.module.exports.resolveRuntime(path.join(resources, 'app.asar')).ok, false);
  });
}
