# Backend prompt: Resort pass pricing and flexible visit dates

Update only the SkiResort Resort pricing contract to support ski passes rather than minimum-stay accommodation pricing. Inspect AGENTS.md, SKILLS.md, the relevant backend skill, docs/ai handoffs, Resort DTOs/enums/schema/resolver/service and current tests first. Preserve the existing NestJS, GraphQL and Mongoose architecture, authentication and role guards.

User requirements:

- Remove the Resort minimum-day requirement. A user can visit on one day or select multiple days; there is no minimum stay. Do not replace the two-day minimum with another mandatory minimum-stay field.
- Support these four distinct selectable pass types: 3 hours, 6 hours, full day, full day plus night.
- Each Resort configures an independent KRW price for each supported pass type. Prices must be finite and nonnegative; zero prices are valid. Do not derive 6-hour/day/night prices by multiplying the 3-hour price.
- Represent pass rates with an explicit pass-type enum and a structured rate collection, following the established embedded Equipment rental-rate pattern where appropriate. Full day and full day plus night are named pass types, not assumed 24-hour or 48-hour durations. Do not invent opening times, night-session hours or admission availability.
- Keep pass selection separate from the user's selected visit dates. One-day visits must be representable without requiring an end date after the visit date. Multiple selected days must not be rejected by a minimum-stay rule. Document date representation, counting and pricing semantics for a future Booking implementation; do not implement Booking, payments or availability as part of this Resort catalog change.

Implementation scope:

1. Replace the existing Resort daily-price/minimum-stay representation intentionally. Update Resort creation/update/output DTOs, GraphQL enums, Mongoose schema, validation, service handling and focused tests. Decide and document the exact final field and enum names before implementing clients. Require all four configured rate entries for new Resorts, with unique pass types; validate the final rate collection on partial updates.
2. Review catalog price filtering and sorting. Existing resortPricePerDay filters/sorts cannot silently keep their former meaning after pass pricing is introduced. Specify and test filtering/sorting for a selected pass type, or explicitly document unsupported operations. Preserve unrelated location, level, facilities and pagination behavior.
3. Preserve existing Resort status, ownership, identity rules, images, facilities, likes/views/comments, admin authorization and unrelated domains.
4. Existing daily prices cannot determine four independent pass prices. Do not fabricate rates, automatically rewrite live records or perform database/index operations. Provide an explicit migration/rollout plan for existing records and the current frontend. Identify breaking changes and coordinate rollout before retiring fields still used by the frontend.
5. Provide frontend handoff examples: exact GraphQL queries/mutations, variables, response shape, pass types, zero-price handling, update behavior, filter/sort behavior and how visit dates remain independent of pass selection. Update docs/ai decisions/completed tasks/next steps and the domain handoff.
6. Run relevant tests and both available application typecheck/build checks. Report changed files, validation results and remaining rollout work. Do not commit or deploy unless requested.

Separate known issue to report (do not bundle an unrelated comment rewrite into pricing): owner updateComment with commentStatus DELETE currently leaves persisted resortComments unchanged. The Resort detail frontend now uses the actual ACTIVE getComments.metaCounter total for its displayed count. If persisted counters also need repair, propose a separate focused backend task with decrement-once behavior, concurrent/repeated deletion tests and an explicitly approved reconciliation plan for existing drift.
