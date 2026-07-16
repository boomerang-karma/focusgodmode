const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// expo-sqlite web (wa-sqlite) + optional SQL modules
config.resolver.assetExts = [...config.resolver.assetExts, 'wasm', 'sql'];
config.resolver.sourceExts = config.resolver.sourceExts.filter(
  (ext) => ext !== 'sql' && ext !== 'wasm',
);

// Allow .wasm imports from expo-sqlite web worker
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
