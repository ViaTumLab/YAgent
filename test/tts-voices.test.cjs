'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const {
  AUTO_VOICE,
  AUTO_VOICES,
  VOICE_OPTIONS,
  speechLanguage,
  resolveVoice,
  previewTexts
} = require('../lib/tts-voices');

test('sentences with any Han character stay Chinese; Latin-only sentences are English', () => {
  assert.equal(speechLanguage('你好，世界。'), 'zh');
  assert.equal(speechLanguage('请先运行 npm test 再提交。'), 'zh');
  assert.equal(speechLanguage('Please run npm test before pushing.'), 'en');
  assert.equal(speechLanguage('2026-09-22'), 'zh');
  assert.equal(speechLanguage(''), 'zh');
});

test('the auto voice follows the sentence language while explicit voices are kept', () => {
  assert.equal(resolveVoice(AUTO_VOICE, '你好。'), AUTO_VOICES.zh);
  assert.equal(resolveVoice(AUTO_VOICE, 'Hello there.'), AUTO_VOICES.en);
  assert.equal(resolveVoice('en-US-GuyNeural', '你好。'), 'en-US-GuyNeural');
  assert.equal(resolveVoice('zh-CN-YunxiNeural', 'Hello there.'), 'zh-CN-YunxiNeural');
});

test('the picker keeps the Chinese voices first, then English voices, then auto', () => {
  const ids = VOICE_OPTIONS.map(option => option.id);
  assert.deepEqual(ids.slice(0, 8), [
    'zh-CN-XiaoxiaoNeural',
    'zh-CN-XiaoyiNeural',
    'zh-CN-YunxiNeural',
    'zh-CN-YunjianNeural',
    'zh-CN-YunyangNeural',
    'zh-CN-YunxiaNeural',
    'zh-CN-liaoning-XiaobeiNeural',
    'zh-CN-shaanxi-XiaoniNeural'
  ]);
  assert.ok(ids.includes('en-US-AriaNeural'));
  assert.ok(ids.includes('en-GB-SoniaNeural'));
  assert.equal(ids.at(-1), AUTO_VOICE);
  assert.ok(ids.includes(AUTO_VOICES.zh) && ids.includes(AUTO_VOICES.en));
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(VOICE_OPTIONS.every(option => option.label));
});

test('previews read a sample in the language of the chosen voice', () => {
  const [chinese] = previewTexts('zh-CN-YunxiNeural');
  const [english] = previewTexts('en-GB-RyanNeural');
  assert.equal(speechLanguage(chinese), 'zh');
  assert.equal(speechLanguage(english), 'en');
  assert.deepEqual(previewTexts(AUTO_VOICE), [chinese, english]);
});

const rendererRoot = path.join(__dirname, '..', 'renderer');

test('the settings page loads the shared voice list before renderer.js', () => {
  const html = fs.readFileSync(path.join(rendererRoot, 'index.html'), 'utf8');
  const shared = html.indexOf('<script src="../lib/tts-voices.js"></script>');
  assert.ok(shared > 0, 'index.html loads lib/tts-voices.js');
  assert.ok(shared < html.indexOf('<script src="renderer.js"></script>'));
});

test('every voice label has an English translation', () => {
  const sandbox = { window: {}, URLSearchParams };
  vm.runInNewContext(fs.readFileSync(path.join(rendererRoot, 'i18n.js'), 'utf8'), sandbox);
  const { translate } = sandbox.window.YanI18n;
  for (const option of VOICE_OPTIONS) {
    assert.doesNotMatch(translate(option.label, 'en'), /[㐀-鿿]/u, `${option.label} is not translated`);
  }
});
