import babel from "@rollup/plugin-babel";
import cjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import { terser } from "rollup-plugin-terser";
import node from "@rollup/plugin-node-resolve";

export default {
  input: "./src/index.ts",
  output: {
    file: "./umd/rmrk-tools.min.js",
    format: "umd",
    name: "rmrkTools",
    inlineDynamicImports: true,
  },
  plugins: [
    babel({
      exclude: "node_modules/**",
      sourceMap: true,
      babelrc: false,
      extensions: [".ts"],
      presets: [
        "@babel/typescript",
        [
          "@babel/preset-env",
          {
            targets: { browsers: "defaults, not ie 11", node: true },
            modules: false,
            useBuiltIns: false,
            loose: true,
          },
        ],
      ],
    }),

    cjs({
      sourceMap: true,
      include: "node_modules/**",
    }),

    json(),

    node({
      extensions: [".ts"],
    }),
  ],
};
