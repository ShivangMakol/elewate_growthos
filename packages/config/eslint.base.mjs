// Shared ESLint flat config — TDD Section 4.2 (Style & Linting) and 4.3 (Clean Architecture Enforcement).
// Individual apps/services/packages import and extend this once they exist (M1+).
// No module-specific boundary rules are defined yet — there are no modules yet (M0 scope).
// When modules/<name>/ folders are created, add boundaries element definitions here so
// domain/ cannot import infrastructure/ or interface/, and application/ cannot import
// framework-specific code, per TDD 4.3.

import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import importPlugin from "eslint-plugin-import";
import boundariesPlugin from "eslint-plugin-boundaries";
import prettierConfig from "eslint-config-prettier";
import globals from "globals";

/** @type {import('eslint').Linter.Config[]} */
export const baseConfig = [
  js.configs.recommended,
  {
    // Plain CommonJS tooling/config files (commitlint.config.js, prettier.config.js,
    // packages/config/*.js) — these run under Node directly, not through the
    // TS/bundler pipeline, so they need Node's CJS globals (module, require, etc.)
    // rather than the browser/ESM globals used elsewhere.
    files: ["**/*.js", "**/*.cjs"],
    languageOptions: {
      sourceType: "commonjs",
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ["**/*.mjs"],
    languageOptions: {
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      import: importPlugin,
      boundaries: boundariesPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,

      // TDD 4.2 — named exports only, no default export when a module has more than
      // one export. Enforced narrowly (default-export ban) rather than guessing at
      // "more than one export" statically, which ESLint cannot express directly.
      "import/no-default-export": "warn",

      // TDD 4.2 — guidelines, not hard blocks: flagged in review, not CI-blocking.
      "max-lines-per-function": ["warn", { max: 40, skipBlankLines: true, skipComments: true }],
      "max-lines": ["warn", { max: 300, skipBlankLines: true, skipComments: true }],

      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": "error",
    },
  },
  // TDD 4.3 — Clean Architecture dependency-direction enforcement.
  // Boundary element types are declared here; actual `elementType` values and
  // per-module import rules get filled in once services/core-api/src/modules/*
  // exists (M1+). Left as an explicit placeholder rather than invented now,
  // since inventing module names ahead of the roadmap would violate the
  // "never invent structure" requirement for this milestone.
  {
    settings: {
      "boundaries/elements": [],
    },
    rules: {
      "boundaries/element-types": "off",
    },
  },
  {
    // Next.js App Router requires default exports for these specific
    // filenames (page/layout/loading/error/not-found/template/route
    // handlers) and for next.config.ts — this is a framework convention,
    // not a style choice, so it's exempted from the TDD 4.2 named-exports
    // rule rather than weakening that rule repo-wide. prisma.config.ts is
    // the same situation: Prisma's CLI specifically requires
    // `export default defineConfig(...)`.
    files: [
      "apps/*/app/**/page.tsx",
      "apps/*/app/**/layout.tsx",
      "apps/*/app/**/loading.tsx",
      "apps/*/app/**/error.tsx",
      "apps/*/app/**/not-found.tsx",
      "apps/*/app/**/template.tsx",
      "apps/*/app/**/route.ts",
      "apps/*/next.config.ts",
      "apps/*/middleware.ts",
      "services/*/prisma.config.ts",
    ],
    rules: {
      "import/no-default-export": "off",
    },
  },
  prettierConfig,
];

export default baseConfig;
