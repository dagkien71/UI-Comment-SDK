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
      ...(isProduction
        ? [
            terser({
              compress: {
                drop_console: true,
                drop_debugger: true,
                pure_funcs: [
                  "console.log",
                  "console.info",
                  "console.debug",
                  "console.warn",
                ],
                passes: 3,
                unsafe: true,
                unsafe_comps: true,
                unsafe_Function: true,
                unsafe_math: true,
                unsafe_proto: true,
                unsafe_regexp: true,
                unsafe_undefined: true,
                dead_code: true,
                evaluate: true,
                hoist_funs: true,
                hoist_props: true,
                hoist_vars: true,
                if_return: true,
                inline: true,
                join_vars: true,
                loops: true,
                reduce_vars: true,
                sequences: true,
                side_effects: true,
                switches: true,
                toplevel: true,
                typeofs: true,
                unused: true,
              },
              mangle: {
                toplevel: true,
                properties: {
                  regex: /^_/, // chỉ mangle các thuộc tính bắt đầu bằng _ (an toàn cho public API)
                },
                safari10: true,
              },
              format: {
                comments: false,
                ascii_only: true,
                beautify: false,
              },
              ecma: 2020,
              keep_classnames: false,
              keep_fnames: false,
              ie8: false,
              safari10: true,
            }),
          ]
        : []),
    ],
    external: (id) => {
      return id === "react" || id === "react-dom";
    },
  },
  // CDN builds (ultra-minified for production)
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
        cssnano: {
          preset: [
            "default",
            {
              discardComments: { removeAll: true },
              normalizeWhitespace: true,
              colormin: true,
              minifyFontValues: true,
              minifySelectors: true,
              mergeLonghand: true,
              mergeRules: true,
              reduceIdents: false,
              zindex: false,
            },
          ],
        },
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
          pure_funcs: [
            "console.log",
            "console.info",
            "console.debug",
            "console.warn",
          ],
          passes: 3,
          unsafe: true,
          unsafe_comps: true,
          unsafe_Function: true,
          unsafe_math: true,
          unsafe_proto: true,
          unsafe_regexp: true,
          unsafe_undefined: true,
          dead_code: true,
          evaluate: true,
          hoist_funs: true,
          hoist_props: true,
          hoist_vars: true,
          if_return: true,
          inline: true,
          join_vars: true,
          loops: true,
          reduce_vars: true,
          sequences: true,
          side_effects: true,
          switches: true,
          toplevel: true,
          typeofs: true,
          unused: true,
        },
        mangle: {
          toplevel: true,
          properties: {
            regex: /^_/,
          },
          safari10: true,
        },
        format: {
          comments: false,
          ascii_only: true,
          beautify: false,
        },
        ecma: 2020,
        keep_classnames: false,
        keep_fnames: false,
        ie8: false,
        safari10: true,
      }),
    ],
    external: (id) => {
      return id === "react" || id === "react-dom";
    },
  },
];
