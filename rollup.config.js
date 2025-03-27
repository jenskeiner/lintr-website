import commonjs from "@rollup/plugin-commonjs"
import nodeResolve from "@rollup/plugin-node-resolve"
import babel from "@rollup/plugin-babel"
import eslint from "@rollup/plugin-eslint"
import terser from "@rollup/plugin-terser"
import postcss from "rollup-plugin-postcss"
import replace from "@rollup/plugin-replace"
import image from "@rollup/plugin-image"
import typescript from "@rollup/plugin-typescript"
import path from "path"
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dev = async () => {
  const target = { file: "assets/assets/app.js", format: "esm", sourcemap: true }

  return {
    input: "src/app.ts",
    output: target,
    context: "window",
    plugins: [
      nodeResolve({
        preferBuiltins: true,
        extensions: ['.js', '.ts'],
      }),
      commonjs(),
      replace({
        preventAssignment: true,
        "process.env.NODE_ENV": JSON.stringify("development"),
      }),
      typescript({
        tsconfig: './tsconfig.json',
        sourceMap: true,
        compilerOptions: {outDir: path.dirname(target.file)},
      }),
      postcss({
        config: {
          path: "./postcss.config.js",
        },
        extensions: [".css"],
        extract: true,
        minimize: false,
      }),
      eslint(),
      babel({
        exclude: "node_modules/**",
        configFile: path.resolve(__dirname, "babel.config.json"),
        babelHelpers: "bundled",
        extensions: ['.js', '.ts'],
      }),
      image({
        dom: true,
      }),
    ],
  }  
}

const prod = async () => {
  const target = { file: "assets/assets/app.js", format: "esm", sourcemap: false }

  return {
    input: "src/app.ts",
    output: target,
    context: "window",
    plugins: [
      nodeResolve({
        preferBuiltins: true,
        extensions: ['.js', '.ts'],
      }),
      commonjs(),
      replace({
        preventAssignment: true,
        "process.env.NODE_ENV": JSON.stringify("production"),
      }),
      typescript({
        tsconfig: './tsconfig.json',
        sourceMap: false,
        compilerOptions: {outDir: path.dirname(target.file)},
      }),
      postcss({
        config: {
          path: "./postcss.config.js",
        },
        extensions: [".css"],
        extract: true,
        minimize: true,
      }),
      eslint(),
      babel({
        exclude: "node_modules/**",
        configFile: path.resolve(__dirname, "babel.config.json"),
        babelHelpers: "bundled",
        extensions: ['.js', '.ts'],
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
