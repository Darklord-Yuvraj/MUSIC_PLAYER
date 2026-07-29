const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Source extensions — include cjs/mjs for Transformers.js compat
config.resolver.sourceExts = [...new Set([...(config.resolver.sourceExts || []), 'js', 'jsx', 'ts', 'tsx', 'json', 'cjs', 'mjs'])];

// Allow wasm and onnx as static assets
config.resolver.assetExts = [...new Set([...(config.resolver.assetExts || []), 'wasm', 'onnx', 'bin'])];

module.exports = config;
