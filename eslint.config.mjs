import antfu from '@antfu/eslint-config';

export default antfu({
  type: 'lib',
  markdown: false,
  stylistic: {
    semi: true,
    indent: 2,
  },
  ignores: [
    '.cursor/**',
  ],
  rules: {
    'no-console': 'off',
    'unused-imports/no-unused-vars': [
      'warn',
      { varsIgnorePattern: '^_', argsIgnorePattern: '^_' },
    ],
    'node/prefer-global/process': 'off',
  },
});
