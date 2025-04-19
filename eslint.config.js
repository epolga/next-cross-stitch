// D:\ann\Git\next-cross-stitch\eslint.config.js
import js from '@eslint/js';
import nextPlugin from 'eslint-config-next';
import jsonPlugin from 'eslint-plugin-json';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default [
    {
        ignores: [
            '.next/',
            'out/',
            'build/',
            'dist/',
            'amplify/backend/',
            'aws-exports.js',
            'awsconfiguration.json',
            'node_modules/'
        ]
    },
    js.configs.recommended,
    nextPlugin,
    {
        files: ['**/*.js', '**/*.jsx'],
        plugins: {
            react: reactPlugin,
            'react-hooks': reactHooksPlugin,
            json: jsonPlugin
        },
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.es2021
            }
        },
        rules: {
            'react/prop-types': 'off',
            'no-unused-vars': ['error', { varsIgnorePattern: '^(__unused|_N_E)' }],
            'no-undef': ['error', { typeof: true }],
            'no-redeclare': 'warn',
            'no-prototype-builtins': 'warn',
            'no-cond-assign': 'warn',
            'no-control-regex': 'warn',
            'no-empty': 'warn',
            'no-self-assign': 'warn',
            'no-sparse-arrays': 'warn',
            'no-fallthrough': 'warn'
        },
        settings: {
            react: {
                version: 'detect'
            }
        }
    },
    {
        files: ['**/*.json'],
        ...jsonPlugin.configs.recommended
    }
];
