module.exports = {
  parser: '@typescript-eslint/parser',
  extends: ['airbnb-base', 'prettier'],
  plugins: ['@typescript-eslint', 'prettier'],
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.mjs', '.js', '.json', '.ts'],
      },
    },
    'import/extensions': ['.js', '.mjs', '.jsx', '.ts', '.tsx'],
  },
  parserOptions: {
    project: ['./tsconfig.eslint.json'],
    tsconfigRootDir: __dirname,
  },
  rules: {
    // Let typescript compiler handle this
    'no-unused-vars': 'off',
    'typescript/no-unused-vars': 'off',

    // Catch common async/await problems
    '@typescript-eslint/no-misused-promises': 2,
    '@typescript-eslint/no-floating-promises': [2, { ignoreIIFE: true }],
    '@typescript-eslint/promise-function-async': 2,

    // originally required in the early days of monorepos -- consider revisiting
    'import/no-cycle': 'off',

    // prettier is handling this
    'max-len': 'off',

    // our loop iterations are rarely independent, and it's a more readable syntax
    'no-await-in-loop': 'off',

    // we almost never do default exports
    'import/prefer-default-export': 'off',

    // artifact of the Flow days, imports were indeed duplicated because types had to be separate
    'import/no-duplicates': 'off',

    // Just migrated to Node 16, not ready for this undertaking
    'import/extensions': 'off',

    // relax this to avoid unnecessary temp variables
    'no-param-reassign': [
      2,
      {
        props: false,
      },
    ],

    // unhappy with our one-liner Promise constructor arrow functions
    'no-promise-executor-return': 'off',

    // prettier issues are warnings here
    'prettier/prettier': 'warn',
  },
};
