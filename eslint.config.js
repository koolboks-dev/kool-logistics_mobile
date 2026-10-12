// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.expo/*', 'scripts/*'],
  },
  {
    // The UI kit animates with Reanimated shared values (`scale.value = …`),
    // which the React Compiler rules mistake for mutating React state/refs.
    files: ['src/components/ui/**/*.tsx'],
    rules: {
      'react-hooks/immutability': 'off',
      'react-hooks/refs': 'off',
      'react/display-name': 'off',
    },
  },
]);
