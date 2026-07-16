// Enforces Conventional Commits (feat:, fix:, refactor:, chore:, test:, ...)
// per TDD Section 4.4 — enables automated changelog generation and
// semantic-release tooling downstream.
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Keep the type list explicit and matching exactly what TDD 4.4 names,
    // plus the conventional-commit standard types not excluded by it.
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "refactor",
        "chore",
        "test",
        "docs",
        "style",
        "perf",
        "build",
        "ci",
        "revert",
      ],
    ],
    "subject-case": [0],
  },
};
