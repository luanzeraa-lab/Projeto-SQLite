const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Mantenha suas regras customizadas existentes aqui (ex: suporte a .wasm)
config.resolver.assetExts.push('wasm');

module.exports = config;