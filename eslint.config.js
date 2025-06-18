import prettier from "eslint-plugin-prettier";

export default [
  { ignores: ["**/node_modules/**"] },
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      globals: {
        // Node.js globals
        process: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        module: "readonly",
        require: "readonly",
        console: "readonly",
      },
    },
    plugins: { prettier },
    rules: { "no-console": "warn", "prettier/prettier": "error" },
  },
];
