# shared-kernel/

Truly shared value objects (Money, Email, Address) — Architecture Blueprint §5.

Reserved for value objects with **no module-specific meaning** — a `Money` type used
identically by Invoicing, Commissions, and Pipeline's Quote line items belongs here.
Anything with a single module's business rules attached belongs in that module's own
`domain/value-objects/` instead. Kept deliberately small: this is the one folder every
module is allowed to depend on besides `platform/`, so scope creep here has the widest
blast radius in the codebase.

No application code exists yet.
