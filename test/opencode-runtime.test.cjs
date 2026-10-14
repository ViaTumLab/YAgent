'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { stageOpenCodeRuntime } = require('../lib/opencode-runtime');
const patch = require('../vendor/opencode/runtime-patch.json');

function removeFixture(directory) {
  assert.equal(path.dirname(path.resolve(directory)), path.resolve(os.tmpdir()));
  assert.ok(path.basename(directory).startsWith('yan-runtime-patch-'));
  fs.rmSync(directory, { recursive: true, force: true });
}

test('unknown runtime fails explicitly without modifying it or producing a fallback', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'yan-runtime-patch-'));
  const executable = path.join(directory, 'unknown.exe');
  fs.writeFileSync(executable, patch.filter);
  try {
    await assert.rejects(stageOpenCodeRuntime({ executable, dataDir: directory }), /当前可执行文件不匹配/);
    assert.equal(fs.readFileSync(executable, 'utf8'), patch.filter);
    assert.equal(fs.existsSync(path.join(directory, 'opencode-runtime')), false);
  } finally { removeFixture(directory); }
});

test('stages only the pinned registry change, shares concurrent work, and repairs a corrupt cache', {
  skip: !((process.platform === 'win32' && process.arch === 'x64') || (process.platform === 'darwin' && process.arch === 'arm64'))
}, async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'yan-runtime-patch-'));
  const packageName = process.platform === 'win32' ? 'opencode-windows-x64' : 'opencode-darwin-arm64';
  const executable = path.resolve('node_modules', packageName, 'bin', process.platform === 'win32' ? 'opencode.exe' : 'opencode');
  const spec = patch.binaries.find(binary => binary.package === packageName);
  const filter = spec.filter || patch.filter;
  const expectedHash = spec.signedSha256 || spec.patchedSha256;
  const options = { executable, dataDir: directory };
  const sourceStat = fs.statSync(executable);
  try {
    const first = stageOpenCodeRuntime(options);
    assert.equal(stageOpenCodeRuntime(options), first);
    const target = await first;
    assert.notEqual(target, executable);
    const source = fs.readFileSync(executable);
    const output = fs.readFileSync(target);
    const offset = source.indexOf(filter);
    assert.ok(offset > 0);
    if (!spec.signedSha256) {
      assert.deepEqual(output.subarray(0, offset), source.subarray(0, offset));
      assert.deepEqual(output.subarray(offset + filter.length), source.subarray(offset + filter.length));
    }
    assert.equal(output.subarray(offset, offset + filter.length).toString(), ' '.repeat(filter.length));
    assert.equal(crypto.createHash('sha256').update(output).digest('hex'), expectedHash);
    const cachedStat = fs.statSync(target);
    assert.equal(await stageOpenCodeRuntime(options), target);
    assert.equal(fs.statSync(target).mtimeMs, cachedStat.mtimeMs);

    const fd = fs.openSync(target, 'r+');
    try { fs.writeSync(fd, Buffer.from('x'), 0, 1, offset); } finally { fs.closeSync(fd); }
    assert.equal(await stageOpenCodeRuntime(options), target);
    assert.equal(crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex'), expectedHash);
    assert.equal(fs.statSync(executable).mtimeMs, sourceStat.mtimeMs);
    assert.equal(crypto.createHash('sha256').update(source).digest('hex'), spec.sourceSha256);
    assert.deepEqual(fs.readdirSync(path.dirname(target)), [path.basename(executable)]);
  } finally { removeFixture(directory); }
});
