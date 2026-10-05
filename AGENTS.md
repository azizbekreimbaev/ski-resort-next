# SkiResort Frontend Agent Instructions

## Project Goal

This project is the SkiResort frontend.

It was migrated from the existing Nestar Next.js frontend.

Nestar was a real-estate platform for apartments, villas, houses and agents.
SkiResort uses the same frontend architecture and coding standards but replaces
the real-estate domain with the SkiResort domain.

The goal is NOT to rebuild the frontend architecture.

The goal is to transform the existing UI, UX and domain logic into SkiResort
while preserving the working project structure and coding style.

## Backend Is the Source of Truth

The SkiResort backend has already been developed.

Before implementing a frontend domain, inspect the backend GraphQL contracts,
DTOs, enums and relevant documentation.

Read the backend `skiresort/docs/ai/` documents when available, especially:

- `COMPLETED_TASKS.md`
- `DECISIONS.md`
- `BACKEND_MIGRATION.md`
- `NEXT_STEPS.md`
- relevant client/API documentation

Do not guess GraphQL fields, enums, filters or operation names.

## Existing Frontend Architecture

Preserve the existing project architecture and conventions, including:

- Next.js
- React
- TypeScript
- Apollo Client / GraphQL
- MUI
- existing authentication flow
- existing layout system
- existing routing conventions
- existing hooks
- existing utilities
- existing state patterns
- existing folder structure
- existing component organization
- existing error/loading patterns

Do not introduce a new architecture unless explicitly requested.

## Core Rules

1. Inspect existing code before editing.
2. Reuse existing components and patterns where appropriate.
3. Preserve working authentication and Apollo configuration.
4. Preserve current coding style and naming conventions.
5. Do not perform blind repository-wide replacements.
6. Rename domain concepts only after understanding their actual behavior.
7. Do not rewrite working shared infrastructure.
8. Do not introduce new packages unless clearly necessary and approved.
9. Do not use `any` to bypass TypeScript problems.
10. Do not change backend contracts from the frontend.
11. Do not modify unrelated files.
12. Keep each migration phase small and reviewable.
13. Run available typecheck, lint and build checks after implementation.
14. Do not commit unless explicitly requested.

## Domain Migration

Typical Nestar concepts must be migrated intentionally.

Examples:

- Property -> Resort where behavior represents the main catalog
- Agent -> Instructor
- property browsing -> resort browsing
- real-estate filters -> resort filters
- property favorites -> resort/equipment favorites

Do not mechanically rename a concept if its SkiResort behavior is different.

## SkiResort Main Domains

Frontend work should follow the implemented backend contracts for:

- Member
- Instructor
- Instructor Application
- Resort
- Equipment
- Booking
- Comments
- Likes
- Views
- Favorites
- Visited history
- Follows
- Notices
- Notifications
- Board Articles

Implement only the domain requested in the current task.

## UI / UX

The visual design should become a ski-resort platform.

Remove real-estate-specific:

- apartment imagery
- property terminology
- house/villa UI
- real-estate icons
- agent-specific presentation
- property-specific filters

Replace them with SkiResort-oriented:

- resort discovery
- skiing/snowboarding visuals
- equipment catalog
- instructors
- rental/booking experiences
- winter/travel UI

Preserve reusable layout/component behavior when it still makes sense.

## Workflow

For every major frontend phase:

1. Read `AGENTS.md`.
2. Read `SKILLS.md` and the relevant skill.
3. Inspect relevant backend `docs/ai/` documentation.
4. Inspect backend GraphQL contracts for that domain.
5. Inspect the existing Nestar frontend implementation being replaced.
6. Identify reusable code.
7. Produce a short plan before large changes.
8. Implement only the approved scope.
9. Remove obsolete domain references from the changed area.
10. Run TypeScript/lint/build checks.
11. Report changed files, tests/checks and remaining work.
12. Write to memory.md if made changes.

## Migration Order

Prefer this order:

1. Foundation and branding
2. Shared navigation/layout
3. Authentication and Member UI
4. Resort catalog
5. Instructor UI
6. Equipment catalog
7. Booking UI
8. Favorites / visited / likes / comments
9. Admin UI
10. Notices / notifications / board
11. Final legacy cleanup

Do not migrate all domains in one large pass.

## Safety

Do not:

- reset Git history
- run destructive Git commands
- delete working infrastructure
- expose secrets
- rewrite Apollo/auth setup without need
- silently change GraphQL contracts
- invent backend behavior
- implement unrelated backend logic