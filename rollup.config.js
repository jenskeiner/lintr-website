import commonjs from "@rollup/plugin-commonjs"
import nodeResolve from "@rollup/plugin-node-resolve"
import babel from "@rollup/plugin-babel"
import eslint from "@rollup/plugin-eslint"
import { terser } from "rollup-plugin-terser"
import postcss from "rollup-plugin-postcss"
import replace from "@rollup/plugin-replace"
import image from "@rollup/plugin-image"
import path from "path"
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use an absolute path for the ESLint config file
const eslintConfigPath = resolve(__dirname, './eslint.config.mjs');

// Verify the file exists first (for better error messages)
if (!existsSync(eslintConfigPath)) {
  throw new Error(`ESLint config file not found at: ${eslintConfigPath}`);
}

// Create a Node.js require function
const require = createRequire(import.meta.url);

// Function to load the ESLint config
const getEslintConfig = async () => {
  try {
    // Method 1: Try using a relative import
    return (await import('./eslint.config.mjs')).default;
  } catch (err) {
    try {
      // Method 2: Try using an absolute import
      return (await import(eslintConfigPath)).default;
    } catch (err) {
      // Method 3: Fall back to the execSync approach
      const { execSync } = require('child_process');
      
      console.log('Using execSync fallback to load ESLint config');
      
      const cmd = `node --input-type=module -e "import config from '${eslintConfigPath.replace(/\\/g, '\\\\')}'; console.log(JSON.stringify(config))"`;
      const result = execSync(cmd);
      return JSON.parse(result.toString());
    }
  }
};

const dev = async () => {
  const eslintConfig = await getEslintConfig();
  
  return {
  
    input: "src/app.js",
    output: {
      file: "assets/assets/app.js",
      format: "umd",
    },
    context: "window",
    plugins: [
      nodeResolve({
        preferBuiltins: true,
      }),
      commonjs(),
      replace({
        preventAssignment: true,
        "process.env.NODE_ENV": JSON.stringify("development"),
      }),
      postcss({
        config: {
          path: "./postcss.config.js",
        },
        extensions: [".css"],
        extract: true,
        minimize: false,
      }),
      eslint({
        ...eslintConfig,
      }),
      babel({
        exclude: "node_modules/**",
        configFile: path.resolve(__dirname, "babel.config.json"),
        babelHelpers: "bundled",
      }),
      image({
        dom: true,
      }),
    ],
  }  
}

const prod = async () => {
  const eslintConfig = await getEslintConfig();
  
  return {
    input: "src/app.js",
    output: {
      file: "assets/assets/app.js",
      format: "esm",
    },
    context: "window",
    plugins: [
      nodeResolve({
        preferBuiltins: true,
      }),
      commonjs(),
      replace({
        preventAssignment: true,
        "process.env.NODE_ENV": JSON.stringify("production"),
      }),
      postcss({
        config: {
          path: "./postcss.config.js",
        },
        extensions: [".css"],
        extract: true,
        minimize: true,
      }),
      eslint({
        ...eslintConfig,
      }),
      babel({
        exclude: "node_modules/**",
        configFile: path.resolve(__dirname, "babel.config.json"),
        babelHelpers: "bundled",
      }),
      terser(),
      image({
        dom: true,
      }),
    ],
  }  
}
const conf = process.env.NODE_ENV == "production" ? prod : dev

export default conf
