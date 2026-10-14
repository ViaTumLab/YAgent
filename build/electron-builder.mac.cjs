'use strict';

// Build on a Mac of the target architecture: native npm runtimes are installed
// for the host, so cross-building would silently ship the wrong executables.
const { build } = require('../package.json');
const path = require('node:path');
module.exports = {
  ...build,
  // electron-builder 24 cannot select an ad hoc identity itself. Sign the
  // Electron bundle locally; preserve the upstream signatures and hashes of
  // independent runtimes in Resources. This build is for local distribution;
  // Developer ID signing and notarization need a separate release pipeline.
  afterPack: async context => {
    const app = path.join(context.appOutDir, 'Yan Agent.app');
    await require('@electron/osx-sign').signAsync({
      app, platform: 'darwin', identity: '-', identityValidation: false,
      preAutoEntitlements: false,
      ignore: file => file.startsWith(path.join(app, 'Contents/Resources') + path.sep),
      optionsForFile: () => ({ hardenedRuntime: true, entitlements: path.join(__dirname, 'entitlements.mac.plist') })
    });
  },
  extraResources: build.extraResources.map(resource => resource.to === 'codegraph-runtime'
    ? { ...resource, from: `node_modules/@colbymchenry/codegraph-darwin-${process.arch}` }
    : resource),
  files: [...build.files, '!node_modules/@colbymchenry/codegraph-darwin-*/**/*'],
  asarUnpack: [...build.asarUnpack, 'node_modules/opencode-darwin-*/**/*', 'node_modules/sherpa-onnx-darwin-*/**/*'],
  mac: {
    icon: 'build/icon.icns',
    category: 'public.app-category.productivity',
    target: [{ target: 'dmg', arch: [process.arch] }],
    artifactName: 'Yan.Agent.v${version}.macOS.${arch}.${ext}',
    identity: null,
    hardenedRuntime: true,
    entitlements: 'build/entitlements.mac.plist',
    entitlementsInherit: 'build/entitlements.mac.plist',
    extendInfo: { NSMicrophoneUsageDescription: 'Yan Agent 使用麦克风录制语音输入。' }
  },
  dmg: { title: 'Yan Agent ${version}' }
};
