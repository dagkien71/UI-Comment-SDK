import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";
import postcss from "rollup-plugin-postcss";

const isProduction = process.env.NODE_ENV === "production";

export default [
  // Main builds (development)
  {
    input: "src/index.ts",
    output: [
      {
        file: "dist/index.js",
        format: "cjs",
        sourcemap: !isProduction,
        exports: "named",
      },
      {
        file: "dist/index.esm.js",
        format: "es",
        sourcemap: !isProduction,
      },
      {
        file: "dist/index.umd.js",
        format: "umd",
        name: "UICommentSDK",
        sourcemap: !isProduction,
        exports: "named",
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
      },
    ],
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false,
      }),
      commonjs(),
      postcss({
        extract: false,
        inject: true,
        modules: false,
        use: ["sass"],
        minimize: isProduction,
      }),
      typescript({
        tsconfig: "./tsconfig.json",
        sourceMap: !isProduction,
        inlineSources: !isProduction,
      }),
      ...(isProduction ? [terser()] : []),
    ],
    external: (id) => {
      return id === "react" || id === "react-dom";
    },
  },
  // CDN builds (minified for production)
  {
    input: "src/index.ts",
    output: [
      {
        file: "dist/ui-comment-sdk.min.js",
        format: "umd",
        name: "UICommentSDK",
        sourcemap: false,
        exports: "named",
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
      },
      {
        file: "dist/ui-comment-sdk.esm.min.js",
        format: "es",
        sourcemap: false,
      },
    ],
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false,
      }),
      commonjs(),
      postcss({
        extract: false,
        inject: true,
        modules: false,
        use: ["sass"],
        minimize: true,
      }),
      typescript({
        tsconfig: "./tsconfig.json",
        sourceMap: false,
        inlineSources: false,
      }),
      terser({
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ["console.log", "console.info", "console.debug"],
          passes: 2,
        },
        mangle: {
          toplevel: true,
          properties: {
            regex: /^_/,
          },
        },
        format: {
          comments: false,
        },
      }),
    ],
    external: (id) => {
      return id === "react" || id === "react-dom";
    },
  },
];
