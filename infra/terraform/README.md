# terraform

IaC: VPC, DB, cache, queues, CDN — Architecture Blueprint §5.

Provisions the infrastructure that `infra/ecs/` deploys onto: VPC/networking, RDS
(PostgreSQL), Redis (cache + BullMQ queue backing), S3 (file storage), and CDN.
Introduced in M0 alongside the rest of the platform-foundation tooling.

No Terraform modules exist yet.
