import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";
import postcss from "rollup-plugin-postcss";

const isProduction = process.env.NODE_ENV === "production";

export default [
  // Main builds
  {
    input: "src/index.ts",
    output: [
      {
        file: "dist/index.js",
        format: "cjs",
        sourcemap: true,
        exports: "named",
      },
      {
        file: "dist/index.esm.js",
        format: "es",
        sourcemap: true,
      },
      {
        file: "dist/index.umd.js",
        format: "umd",
        name: "UICommentSDK",
        sourcemap: true,
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
        sourceMap: true,
        inlineSources: true,
      }),
      ...(isProduction ? [terser()] : []),
    ],
    external: (id) => {
      return id === "react" || id === "react-dom";
    },
  },
  // CDN builds (minified)
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
        },
        mangle: {
          toplevel: true,
        },
      }),
    ],
    external: (id) => {
      return id === "react" || id === "react-dom";
    },
  },
];
