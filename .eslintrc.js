module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2015,
        sourceType: 'module',
    },
    extends: ['plugin:@typescript-eslint/recommended', 'prettier/@typescript-eslint', 'plugin:prettier/recommended'],
    rules: {
        // "@typescript-eslint/explicit-function-return-type": "off",
    },
};
