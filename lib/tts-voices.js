// Read-aloud voices shared by the main process and the renderer.
(function exposeTtsVoices(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.YanTtsVoices = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  'use strict';

  const AUTO_VOICE = 'auto';
  // The voices the auto option switches between, by sentence language.
  const AUTO_VOICES = Object.freeze({ zh: 'zh-CN-XiaoxiaoNeural', en: 'en-US-AriaNeural' });
  const VOICE_OPTIONS = Object.freeze([
    { id: 'zh-CN-XiaoxiaoNeural', label: '晓晓 · 女声温柔' },
    { id: 'zh-CN-XiaoyiNeural', label: '晓伊 · 女声活泼' },
    { id: 'zh-CN-YunxiNeural', label: '云希 · 男声阳光' },
    { id: 'zh-CN-YunjianNeural', label: '云健 · 男声沉稳' },
    { id: 'zh-CN-YunyangNeural', label: '云扬 · 男声播报' },
    { id: 'zh-CN-YunxiaNeural', label: '云夏 · 男声少年' },
    { id: 'zh-CN-liaoning-XiaobeiNeural', label: '晓北 · 女声东北' },
    { id: 'zh-CN-shaanxi-XiaoniNeural', label: '晓妮 · 女声陕西' },
    { id: 'en-US-AriaNeural', label: 'Aria · 美式女声' },
    { id: 'en-US-JennyNeural', label: 'Jenny · 美式女声亲切' },
    { id: 'en-US-GuyNeural', label: 'Guy · 美式男声' },
    { id: 'en-US-AndrewNeural', label: 'Andrew · 美式男声温暖' },
    { id: 'en-GB-SoniaNeural', label: 'Sonia · 英式女声' },
    { id: 'en-GB-RyanNeural', label: 'Ryan · 英式男声' },
    { id: AUTO_VOICE, label: '自动 · 按中英文切换' }
  ].map(option => Object.freeze(option)));
  const PREVIEW_TEXTS = Object.freeze({
    zh: '你好，我是 Yan Agent，正在为你朗读正文。',
    en: 'Hello, I am Yan Agent, reading this reply aloud for you.'
  });

  // English voices cannot read Chinese at all, while Chinese voices still
  // read the English words inside a Chinese sentence, so any Han character
  // keeps the sentence Chinese.
  function speechLanguage(text) {
    const value = String(text || '');
    if (/\p{Script=Han}/u.test(value)) return 'zh';
    return /[A-Za-z]/.test(value) ? 'en' : 'zh';
  }

  function resolveVoice(voice, text) {
    return voice === AUTO_VOICE ? AUTO_VOICES[speechLanguage(text)] : voice;
  }

  function previewTexts(voice) {
    if (voice === AUTO_VOICE) return [PREVIEW_TEXTS.zh, PREVIEW_TEXTS.en];
    return [/^en-/i.test(String(voice || '')) ? PREVIEW_TEXTS.en : PREVIEW_TEXTS.zh];
  }

  return { AUTO_VOICE, AUTO_VOICES, VOICE_OPTIONS, speechLanguage, resolveVoice, previewTexts };
}));
