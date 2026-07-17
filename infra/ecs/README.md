# ecs

Deployment manifests per environment — Architecture Blueprint §5 (listed there as
"k8s/ (or ecs/)").

ECS Fargate was the explicit MVP choice, locked in by the Implementation Roadmap
(Architecture §11.4: "ECS as lighter-weight equivalent pre-Series-A"). Per the roadmap's
Growth Path, a sibling `infra/k8s/` folder gets added when the platform migrates to
Kubernetes — that migration is not part of M0–M13 and this folder should not be
pre-emptively renamed or duplicated before that decision point is actually reached.

No manifests exist yet.
