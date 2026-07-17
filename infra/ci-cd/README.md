# ci-cd

CI/CD pipeline configuration — Architecture Blueprint §5.

GitHub Actions workflows: lint → unit → build → integration → security scan → a11y
scan (TDD §9, referenced in Implementation Roadmap Phase 0). Turborepo-aware so CI only
rebuilds/retests modules affected by a given PR's changes once the module count grows
(TDD §4, monorepo-aware pipeline note).

No workflow files exist yet.
