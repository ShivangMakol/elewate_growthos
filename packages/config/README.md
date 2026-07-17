# config

Shared lint/tsconfig/build config — Architecture Blueprint §5.

The centralized ESLint and Prettier configuration required by TDD §4.2 ("config
centralized in `packages/config`, enforced via pre-commit hook and CI gate"). Root
`eslint.config.mjs` and `prettier.config.js` both delegate here rather than defining
rules directly, so every future workspace package inherits the same rules from one
place.

Built in M0 (see the M0 verification report for what was implemented and tested).

| File               | Purpose                                                                                                                                                                            |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `eslint.base.mjs`  | Shared ESLint flat config — style rules (TDD §4.2) and the `eslint-plugin-boundaries` scaffold for Clean Architecture enforcement (TDD §4.3), to be filled in as modules are added |
| `prettier.base.js` | Shared Prettier formatting config                                                                                                                                                  |
| `index.js`         | Barrel export exposing paths to the above                                                                                                                                          |
