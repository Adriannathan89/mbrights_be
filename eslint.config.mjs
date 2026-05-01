// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unusedImports from 'eslint-plugin-unused-imports';

/**
 * Konfigurasi ESLint Flat Config untuk proyek TypeScript.
 * Menggabungkan standar keamanan TypeScript, gaya kode Prettier, dan rule kustom.
 * @see {@link https://eslint.org/docs/latest/use/configure/configuration-files} Dokumen Flat Config
 * @see {@link https://typescript-eslint.io/getting-started/typed-linting} Dokumentasi Type-Checked Linting
 */
export default tseslint.config(
    /**
     * Bagian Global Ignores.
     * File atau folder di sini akan diabaikan sepenuhnya oleh ESLint.
     */
    {
        ignores: [
            'eslint.config.mjs',
            'dist',
            'node_modules',
            'coverage',
            'drizzle.config.ts',
            '*.spec.ts', // Mengabaikan semua file unit test agar tidak terkena aturan strict
        ],
    },

    // Base ESLint recommended rules
    eslint.configs.recommended,

    /**
     * Konfigurasi TypeScript-ESLint.
     * Menggunakan 'recommendedTypeChecked' untuk mendeteksi bug berbasis tipe data (Type Safety),
     * dan 'stylisticTypeChecked' untuk konsistensi penulisan kode.
     */
    ...tseslint.configs.recommendedTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,

    // Integrasi Prettier agar tidak bentrok dengan ESLint
    eslintPluginPrettierRecommended,

    /**
     * Pengaturan Lingkungan (Environment) dan Parser.
     */
    {
        plugins: {
            'simple-import-sort': simpleImportSort,
            'unused-imports': unusedImports,
        },
        
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.jest,
            },
            sourceType: 'commonjs',
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },

    /**
     * Kustomisasi Aturan (Rules).
     */
    {
        rules: {
            // Mengaktifkan plugin simple-import-sort untuk mengurutkan import/exports
            'simple-import-sort/imports': 'error',
            'simple-import-sort/exports': 'error',


            // Mengaktifkan plugin unused-imports untuk menghapus import yang tidak terpakai
            'unused-imports/no-unused-imports': 'warn',

            // Mengatur variabel tidak terpakai dengan aturan khusus
            'unused-imports/no-unused-vars': [
                'warn',
                {
                    vars: 'all',
                    varsIgnorePattern: '^_',
                    args: 'after-used',
                    argsIgnorePattern: '^_',
                },
            ],

            // Pengaturan format Prettier (Tab: 4, Single Quote, Trailing Comma)
            'prettier/prettier': [
                'error',
                {
                    singleQuote: true,
                    trailingComma: 'all',
                    tabWidth: 4,
                    endOfLine: 'auto',
                },
            ],

            /**
             * Type Safety Rules (Ketat)
             * Mencegah penggunaan 'any' dan operasi yang tidak aman secara tipe data.
             */
            '@typescript-eslint/no-explicit-any': 'error',

            /**
             * Prohibit usage of 'unknown' type.
             * This forces developers to know the exact type, not just 'unknown'.
             */
            '@typescript-eslint/no-restricted-types': 'off',

            '@typescript-eslint/no-unsafe-assignment': 'error',
            '@typescript-eslint/no-unsafe-member-access': 'error',
            '@typescript-eslint/no-unsafe-call': 'error',
            '@typescript-eslint/no-unsafe-return': 'error',
            '@typescript-eslint/no-unsafe-argument': 'error',


            // Fleksibilitas: Tidak mewajibkan return type eksplisit pada function/boundary
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            '@typescript-eslint/explicit-function-return-type': 'off',

            // Mematikan peringatan untuk promise yang tidak di-await (berguna pada beberapa pola async)
            '@typescript-eslint/no-floating-promises': 'off',

            /**
             * Variabel yang tidak terpakai diperbolehkan jika diawali dengan underscore (_).
             * Contoh: (err, _res) => { ... }
             */
            '@typescript-eslint/no-unused-vars': [
                'warn',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                },
            ],

            // Mematikan error untuk class kosong (sering digunakan di NestJS atau Drizzle)
            '@typescript-eslint/no-extraneous-class': 'off',

            // no deprecated untuk mencegah penggunaan API yang sudah usang
            '@typescript-eslint/no-deprecated': 'error',
        },
    },
);