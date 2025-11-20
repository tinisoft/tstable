/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution');

module.exports = {
  root: true,
  extends: [
    'plugin:vue/vue3-essential',
    'eslint:recommended',
    '@vue/eslint-config-typescript',
    '@vue/eslint-config-prettier/skip-formatting'
  ],
  parserOptions: {
    ecmaVersion: 'latest'
  },
  rules: {
    // Disable multi-word component name requirement
    'vue/multi-word-component-names': 'off',
    
    // Allow 'any' type (common in data grids)
    '@typescript-eslint/no-explicit-any': 'warn',
    
    // ✅ NEW: Allow unused variables that start with underscore
    '@typescript-eslint/no-unused-vars': ['warn', {
      argsIgnorePattern: '^_',           // Ignore function args starting with _
      varsIgnorePattern: '^_',           // Ignore variables starting with _
      destructuredArrayIgnorePattern: '^_', // Ignore destructured array elements starting with _
      ignoreRestSiblings: true           // Ignore rest siblings in destructuring
    }],
    
    // ✅ NEW: Allow unused parameters
    'no-unused-vars': 'off', // Turn off base rule as we're using TypeScript rule
    
    // Optional: More lenient rules for library development
    '@typescript-eslint/ban-ts-comment': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'warn'
  },
  
  // ✅ NEW: Override rules specifically for .vue files
  overrides: [
    {
      files: ['*.vue'],
      rules: {
        '@typescript-eslint/no-unused-vars': ['warn', {
          args: 'none',                  // Don't check function arguments in Vue components
          varsIgnorePattern: '^_|props', // Ignore variables starting with _ or named 'props'
          ignoreRestSiblings: true
        }]
      }
    },
    {
      files: ['*.ts'],
      rules: {
        '@typescript-eslint/no-unused-vars': ['warn', {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          ignoreRestSiblings: true
        }]
      }
    }
  ]
};