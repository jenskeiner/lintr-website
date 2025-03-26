import commonjs from "@rollup/plugin-commonjs"
import nodeResolve from "@rollup/plugin-node-resolve"
import babel from "@rollup/plugin-babel"
import eslint from "@rollup/plugin-eslint"
import { terser } from "rollup-plugin-terser"
import postcss from "rollup-plugin-postcss"
import replace from "@rollup/plugin-replace"
import image from "@rollup/plugin-image"
import path from "path"
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load JSON config
const eslintConfig = JSON.parse(
  readFileSync(resolve(__dirname, '.eslintrc.json'), 'utf8')
);

const dev = {
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
      ...eslintConfig
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

const prod = {
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
      ...eslintConfig
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

const conf = process.env.NODE_ENV == "production" ? prod : dev

export default conf
