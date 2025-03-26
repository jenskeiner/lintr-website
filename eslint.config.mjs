import globals from "globals";
import js from "@eslint/js";
import babelParser from "@babel/eslint-parser";

export default [
  // Global configuration
  {
    ignores: ["node_modules/**", "dist/**"]
  },
  
  // Base JS configuration
  js.configs.recommended,
  
  // Custom configuration
  {
    files: ["**/*.js", "**/*.mjs"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      parser: babelParser,
      globals: {
        ...globals.browser
      }
    },
  },
];