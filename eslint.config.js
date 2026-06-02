import js from '@eslint/js'
import prettierConfig from 'eslint-config-prettier'
import importPlugin from 'eslint-plugin-import'
import prettier from 'eslint-plugin-prettier'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'

export default tseslint.config(
    js.configs.recommended,
    ...tseslint.configs.recommended,
    prettierConfig,
    {
        plugins: {
            'react-hooks': reactHooks,
            react,
            import: importPlugin,
            prettier,
        },
        settings: {
            react: { version: 'detect' },
            'import/resolver': {
                typescript: true,
                node: true,
            },
        },
        rules: {
            // react-hooks
            ...reactHooks.configs.recommended.rules,

            // TypeScript strictness
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/explicit-function-return-type': [
                'warn',
                { allowExpressions: true },
            ],
            '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],

            // Unused variables and imports
            'no-unused-vars': 'off', // отключаем базовое правило — не понимает TypeScript-типы
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    vars: 'all',
                    args: 'after-used',
                    ignoreRestSiblings: true,
                    varsIgnorePattern: '^_',
                    argsIgnorePattern: '^_',
                },
            ],

            // Code quality
            eqeqeq: ['error', 'always'],
            'no-console': 'warn',
            'no-debugger': 'error',
            'prefer-const': 'error',

            // React
            'react/jsx-key': 'error',
            'react/no-array-index-key': 'warn',
            'react/self-closing-comp': ['warn', { component: true, html: true }],
            'react/jsx-fragments': ['warn', 'syntax'],
            'react/react-in-jsx-scope': 'off',

            // Import order
            'import/order': [
                'warn',
                {
                    groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
                    'newlines-between': 'always',
                    alphabetize: { order: 'asc' },
                },
            ],
            'import/no-duplicates': 'error',

            // Prettier
            'prettier/prettier': 'warn',
        },
    },
    {
        ignores: ['dist/**', 'node_modules/**'],
    }
)
