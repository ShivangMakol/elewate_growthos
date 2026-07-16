// Root ESLint entry point. Real rules live in packages/config/eslint.base.js
// (TDD 4.2: "config centralized in packages/config"). This file just wires it up
// and defines repo-wide ignores. Individual apps/services/packages will extend
// this same base once they exist (M1+).
import baseConfig from "./packages/config/eslint.base.mjs";

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.next/**",
      "**/coverage/**",
      "**/.turbo/**",
    ],
  },
  ...baseConfig,
];
