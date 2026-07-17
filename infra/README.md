# infra/

Infrastructure-as-code and deployment configuration. Nothing in this folder is
application code — it provisions and deploys the apps/services defined elsewhere in
this repo.

| Folder       | Purpose                                                                                                                                                                                                                                                                                                                                                                        |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `terraform/` | IaC: VPC, DB, cache, queues, CDN (Architecture Blueprint §5)                                                                                                                                                                                                                                                                                                                   |
| `ecs/`       | Deployment manifests per environment. Architecture Blueprint §5 lists this as `k8s/ (or ecs/)` — ECS Fargate was the explicit MVP choice locked in by the Implementation Roadmap (Architecture §11.4: "ECS as lighter-weight equivalent pre-Series-A"). A `k8s/` folder will be added alongside this at the Growth-stage migration point described in the roadmap, not before. |
| `ci-cd/`     | CI/CD pipeline configuration                                                                                                                                                                                                                                                                                                                                                   |
