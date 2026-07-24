import eslint from "@eslint/js";
import globals from "globals";
import vue from "eslint-plugin-vue";

export default [
  {
    ignores: ["dist/**", "node_modules/**"],
  },
  eslint.configs.recommended,
  ...vue.configs["flat/essential"],
  {
    files: ["**/*.{js,mjs,cjs,vue}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      "no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", caughtErrors: "none" },
      ],
      "no-dupe-keys": "warn",
      "vue/multi-word-component-names": "off",
    },
  },
];
