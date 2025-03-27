import globals from "globals";
import js from "@eslint/js";
import babelParser from "@babel/eslint-parser";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // Global configuration
  {
    ignores: ["node_modules/**", "dist/**"]
  },
  
  // Base JS configuration
  js.configs.recommended,
  
  // Custom configuration for JavaScript
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

  // TypeScript configuration
  tseslint.configs.recommended,

  {
    files: ["**/*.ts"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      parser: tseslint.parser,
      parserOptions: {
        project: "./tsconfig.json"
      },
      globals: {
        ...globals.browser
      }
    },
    rules: {
      // Add any TypeScript-specific rules here
    }
  },
);