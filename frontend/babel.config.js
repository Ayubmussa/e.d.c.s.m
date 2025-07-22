module.exports = function(api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', {
        jsxImportSource: 'react'
      }]
    ],
    plugins: [
      'react-native-reanimated/plugin',
      ['module-resolver', {
        root: ['./src'],
        alias: {
          '@': './src',
          '@components': './src/components',
          '@screens': './src/screens',
          '@services': './src/services',
          '@utils': './src/utils',
          '@assets': './src/assets',
          '@types': './src/types',
        }
      }],
      ['@babel/plugin-transform-flow-strip-types'],
      ['@babel/plugin-proposal-export-namespace-from'],
      ['@babel/plugin-proposal-class-properties', { loose: true }],
      ['@babel/plugin-proposal-private-methods', { loose: true }]
    ],
  };
};
