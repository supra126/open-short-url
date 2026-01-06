import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  // Base recommended configs
  ...tseslint.configs.recommended,

  // Prettier config (disables conflicting rules)
  eslintConfigPrettier,

  // TypeScript-specific rules
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      // ===== TypeScript 'any' related rules =====
      // Warn on explicit 'any' usage
      '@typescript-eslint/no-explicit-any': 'warn',

      // Warn on unsafe any operations
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',

      // ===== Other TypeScript rules =====
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],

      // ===== NestJS common patterns =====
      // Allow empty functions (common in NestJS for constructor injection)
      '@typescript-eslint/no-empty-function': 'off',

      // Interface naming (NestJS uses I prefix sometimes)
      '@typescript-eslint/interface-name-prefix': 'off',

      // Allow require imports (sometimes needed)
      '@typescript-eslint/no-require-imports': 'warn',
    },
  },

  // Ignore patterns
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '**/*.js',
      '**/*.d.ts',
    ],
  }
);
