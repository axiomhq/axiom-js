module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2015,
        sourceType: 'module',
    },
    extends: ['prettier'],
    rules: {
        // "@typescript-eslint/explicit-function-return-type": "off",
    },
    plugins: [
        'eslint-plugin-tsdoc'
    ]
};
