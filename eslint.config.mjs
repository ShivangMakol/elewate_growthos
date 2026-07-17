// Root ESLint entry point. Real rules live in packages/config/eslint.base.mjs
// (TDD 4.2: "config centralized in packages/config"). Imported via the package
// specifier (not a relative path) to prove the pnpm workspace link + package.json
// exports map actually resolve — see @elewate/config's package.json. Individual
// apps/services/packages will extend this same base once they exist (M1+).
import baseConfig from "@elewate/config/eslint.base.mjs";

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
