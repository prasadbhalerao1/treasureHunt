import globals from "globals";

export default [
  {
    ignores: ["node_modules/**", "scripts/**"],
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: {
      // Error prevention
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_|next|req|res" }],
      "no-undef": "error",

      // Best practices
      "no-console": "off", // Allow console for server logging
      "prefer-const": "warn",
      "no-var": "error",

      // Style (covered by Prettier, so minimal here)
      semi: ["error", "always"],
    },
  },
];
