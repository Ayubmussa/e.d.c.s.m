const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for additional file extensions
config.resolver.assetExts.push('svg', 'wav', 'mp3');
config.resolver.sourceExts.push('jsx', 'ts', 'tsx');

// Add resolver for React Native internal files
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

module.exports = config;
