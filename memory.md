# SkiResort frontend migration memory

## 2026-10-05 — Phase 1: branding and shared shell

Implemented the approved first migration task. Later domain phases remain deferred.

### Changes

- Renamed the package identity from `nestar-next` to `skiresort-next`, preserving scripts and dependency versions.
- Added SkiResort text wordmarks to desktop/mobile navigation, footer, account branding, and admin layout.
- Updated shared page titles, admin title, SEO metadata, and footer copyright.
- Replaced the favicon with a mountain SVG and corrected its declared MIME type.
- Changed navigation labels to Resorts/Instructors while retaining `/property` and `/agent` targets for this phase.
- Replaced basic-layout photographic banners with winter CSS backgrounds and updated shell titles/breadcrumbs.
- Derived the authentication-banner class from the current route instead of setting state inside memoization.
- Added 16 matching translation keys in English, Korean, and Russian; preserved existing domain translation values.
- Allowed mobile navigation to wrap to accommodate the wordmark.

### Changed implementation files

- `package.json`
- `pages/_document.tsx`
- `pages/account/join.tsx`
- `libs/components/Top.tsx`
- `libs/components/Footer.tsx`
- `libs/components/layout/LayoutHome.tsx`
- `libs/components/layout/LayoutBasic.tsx`
- `libs/components/layout/LayoutFull.tsx`
- `libs/components/layout/LayoutAdmin.tsx`
- `public/img/logo/favicon.svg`
- `public/locales/en/common.json`
- `public/locales/kr/common.json`
- `public/locales/ru/common.json`
- `scss/app.scss`
- `scss/pc/general.scss`
- `scss/mobile/main.scss`

### Validation

- Passed syntax parsing for all eight changed TSX files using the existing backend TypeScript compiler. This is not a frontend typecheck.
- Passed JSON parsing, matching new translation-key coverage, and preservation of original translation values.
- Passed package dependency/script preservation, navigation-target/redirect preservation, and changed-shell legacy-brand checks.
- Passed scope checks confirming Apollo/auth files, enums, environment files, and `yarn.lock` were unchanged.
- Passed favicon XML parsing and `git diff --check`.
- Frontend typecheck, lint, and production build were attempted but could not start: `node_modules/typescript/bin/tsc` and `node_modules/next/dist/bin/next` are missing.
- Browser layout verification remains unperformed because the frontend cannot currently start with these missing dependencies.
- No packages were installed and no commit was made.

### Remaining work and boundaries

- Next approved-scope candidate: Authentication and Member compatibility with USER/ADMIN/INSTRUCTOR backend roles.
- Resort, Instructor, Equipment, and admin domain migrations remain separate phases; branding does not establish backend compatibility.
- Existing Property/Agent queries, roles, catalog behavior, home imagery, and legacy domain components remain for subsequent migration.
- Future public routes use `/resort` and `/instructor`, preserving the existing index/detail query-parameter convention.
- Verify current backend resolver/schema signatures before domain integration; handoff documentation has history-input discrepancies.
- Booking, payments, Lessons, checkout, and inventory reservation remain deferred.
- Restore the existing frontend toolchain through an authorized environment step before full type/lint/build and browser validation; do not upgrade dependencies as part of branding.

## 2026-10-05 — Instruction follow-up

Reread `AGENTS.md` after the user added workflow step 12: “Write to memory.md if made changes.” Created this record for the completed Phase 1 work. The user's `AGENTS.md` edit was preserved.

## 2026-10-05 — Node runtime repair

- User requested removal of Node 24.19.0 after `nvm use 20.19.0` still reported Node 24.
- Verified that `C:/Program Files/nodejs` correctly pointed to NVM's `v20.19.0` directory, but that directory contained a Node 24.19.0 executable and npm 11.17.0. The executable hash matched the temporary Node 24 runtime. The Git Bash alias was not the underlying cause.
- Downloaded the official Node 20.19.0 Windows x64 archive and verified its SHA-256 against the published SHASUMS256.txt.
- Restored the official Node 20 distribution in the existing NVM v20.19.0 directory, preserving other NVM versions and unrelated global packages.
- Removed the verified temporary Node 24.19.0 runtime directory.
- Verified both the NVM executable and the active `C:/Program Files/nodejs/node.exe` report v20.19.0; bundled npm reports 10.8.2.
- This does not restore frontend dependencies. The missing Next.js/TypeScript packages still require the planned Yarn lockfile-preserving installation repair.
- No application source or dependency manifests were changed by this runtime repair; no commit was made.

## 2026-10-05 - Home hero, navigation, and Resort search

### Approved scope and implementation

- Reread project instructions and migration/Resort/Equipment skills; inspected backend handoffs and current Resort resolver, DTOs, service and enums.
- User explicitly selected a working Resort search with a small results page.
- Added Equipments after Instructors in both header navigation branches. `/equipment` is a translated coming-soon landing page; the Equipment catalog remains deferred.
- Replaced the home layout's Three.js hero usage with `HeroBanner.tsx`: five local winter photographs, five-second autoplay, manual arrows, clickable dots, swipe/keyboard controls, pause and reduced-motion support. Existing Three.js source/packages remain untouched.
- Replaced housing fields in `HeaderFilter.tsx` with Resort name, location and ski level, using backend enums and serialized `input` URL state. The Resorts header link now opens `/resort`.
- Added typed `getResorts` in the existing Apollo query file, manual Resort result/input types/enums and defensive URL parsing. Unknown/legacy filters are discarded; search resets pagination; invalid JSON/pages safely fall back.
- Added `/resort` results with pagination, KRW daily prices including zero, minimum days, nullable levels/descriptions, SOLD_OUT display, missing-image fallback, loading/error/retry and empty states. No detail, booking or interaction mutations were added.
- Added responsive discovery styles via one stylesheet import in `_app.tsx`; providers remain unchanged. Updated Basic layout route headings and all three locales.
- Five photographs live under `public/img/hero/`, with source links in its README. They are generic winter inspiration, not photos attributed to Korean resorts.

### Validation and limitations

- Dependencies are now present. Dev compilation and HTTP smoke checks passed for `/`, `/resort`, `/equipment`, `/kr/resort` and `/ru/resort` (HTTP 200).
- Temporary assertions passed for malformed/legacy URL inputs, exact enum filtering, invalid pages, filter/pagination roundtrips, locale key coverage and GraphQL document parsing.
- TypeScript was rerun after fixing MUI union complexity in the hero. No errors remain in changed files; full checking still reports the existing `apollo/client.ts:74` ArrayBufferView generic incompatibility and four CommunityCard prop mismatches in `pages/community/index.tsx`.
- Production build was attempted and stops at the existing Apollo type error. No bypass was added.
- `next lint --no-cache` stops at the ESLint setup prompt: no repository ESLint config exists. No configuration/packages were introduced.
- Existing Prettier formatted new components/types/styles and locales; its existing `extends` option is ignored with a warning.
- No GraphQL endpoint is configured in the loaded environment, so live backend data verification is unavailable. Contracts were checked against backend source; no live results are claimed.
- Browser surfaces are unavailable, so visual/manual carousel verification remains unperformed. Dev reports `.next/trace` permission errors but serves the checked routes.
- Existing home catalog sections still use Property/Agent operations and await separate migration. Instructor header routing remains `/agent`.
- Auth/Apollo transport, dependency versions, lockfile and backend were unchanged. No commit was made.

## 2026-10-05 - Search travel dates

- Replaced the first Resort-name control with grouped Arrival/Departure native date inputs in `HeaderFilter.tsx`; Location and Ski level stay unchanged.
- Added responsive date-control styling and labels/validation text in English, Korean and Russian.
- Validates complete date ranges and requires departure after arrival. Dates are optional; location/level search remains available without them.
- Stores validated `arrival`/`departure` query parameters separately from GraphQL input; restores them on reload/back navigation and preserves them across pagination in `pages/resort/index.tsx`.
- Current backend ResortSearch has no date/availability fields. UI explains that dates are trip preferences and availability is not checked; no booking logic or backend changes were added.
- Date checks passed for leap dates, impossible dates, reversed/equal ranges, incomplete/array query values and exclusion from GraphQL inquiry. Existing search/locale assertions and `git diff --check` passed; changed files were formatted.
- Full typecheck has no new errors, but existing Apollo ArrayBufferView and CommunityCard errors remain. Build stops at the existing Apollo error; lint still prompts for missing ESLint configuration. Browser visual verification remains unavailable.
- No packages installed; no commit made.

## 2026-10-05 - Single calendar date range

- Replaced separate native Arrival/Departure fields with one Travel dates control and `TravelDateRange.tsx`, using existing MUI Popover/buttons without additional packages.
- First day click selects arrival; the next later day selects departure, highlights the days between and closes the calendar. Clicking an earlier/equal day restarts arrival selection; selecting after a completed range starts a new range.
- Added hover/focus range preview, month navigation, localized month/day/date labels, Clear dates, Close, keyboard-open support and accessible day buttons.
- Existing date validation, URL persistence, pagination and location/level filtering remain unchanged. Dates remain trip preferences outside the backend GraphQL input.
- Updated shared calendar styles and English/Korean/Russian labels. Removed obsolete paired-date styles.
- Existing date/URL/locale assertions and patch integrity checks passed. Formatting completed. Typecheck/build/lint were attempted; existing Apollo/Community type errors and missing ESLint configuration remain blockers. Browser visual verification remains unavailable.
- No dependency changes or commits.

## 2026-10-05 - Eight-section SkiResort homepage

### Structure and implementation

- Inspected project instructions/skills, backend handoffs, current resolvers/DTOs/enums, homepage collections/cards/layouts, routes and styles before implementing the approved plan.
- Original home entry rendered Trend/Popular/Top Property collections, Advertisement, Top Agents, Events and Community Boards. Its layout already held the winter hero and date-range search.
- Preserved LayoutHome, HeroBanner, date-range search, Next.js Pages Router, Swiper, MUI, Apollo hooks/reactive Member state, auth/header transport, SweetAlert and SCSS patterns.
- Home now renders Popular Resorts, Difficulty, Trending Resorts, Equipment, Instructors, Why SkiResort and final CTA beneath the existing hero (eight sections total). Hero now includes Explore Resorts.
- Popular uses resortLikes DESC; Trending uses resortViews DESC; both request six records and use shared Resort cards with facility chips, counters, KRW daily prices, minimum stay, nullable levels, SOLD_OUT and favorites.
- Favorites use likeTargetResort(resortId), existing guest feedback, a synchronous per-ID duplicate lock and disabled buttons in both collections. Mutation completion awaits refetch of all active getResorts queries. Identity changes refresh both collections.
- Difficulty links use BEGINNER/INTERMEDIATE/ADVANCED/MIXED and exact serialized levelList filters. EXPERT was explicitly excluded because the backend does not support it. Resort sort types/parser now whitelist all seven supported sorts.
- Equipment previews six newest records with All/SKI/SNOWBOARD/BOOTS/HELMET/POLES/CLOTHING category controls. Cards display configured rental packages without deriving prices, optional brand/normalized size, audience and purchase capability. Preview shows all packages; no stock or availability claims.
- Instructor previews use getInstructors, memberRank DESC, six records, nullable experience/languages/level/audience/profile prices and Member image/name fallbacks. No ratings, ownership or unresolved Resort-name join is invented.
- Resort/Equipment/Instructor View actions open MUI preview dialogs from list data; no detail query or view-recording operation is invoked.
- CTAs use /resort, /equipment and /#instructors. Shared Instructor header links now target the homepage anchor while directory migration is deferred. Equipment remains an existing coming-soon destination, as approved.
- Collections have independent loading, empty, error and retry states. Shared Swiper uses separate built-in navigation/pagination instances, no autoplay, and 1.12/2/3 slides at mobile/tablet/desktop widths. Winter hero autoplay/reduced-motion behavior remains.
- Why SkiResort and final CTA are static. All new labels are translated into English, Korean and Russian.
- Removed ten unused old homepage sections/cards after reference checks; removed housing-specific homepage desktop/mobile styles. Community Boards is no longer rendered on home but its components/routes remain. Housing assets used by other pages and Three.js source/packages remain untouched.
- No new architecture, packages, auth/storage changes, backend changes, Booking, checkout, payment, Lesson or application/admin implementation.

### Files changed in this task

Modified:

- pages/index.tsx
- libs/components/Top.tsx
- libs/components/homepage/HeroBanner.tsx
- apollo/user/query.ts
- apollo/user/mutation.ts
- libs/enums/resort.enum.ts
- libs/types/resort/resort.input.ts
- libs/types/resort/resort.ts
- libs/resortSearch.ts
- scss/pc/homepage/homepage.scss
- scss/mobile/main.scss (only obsolete homepage blocks removed)
- scss/home-discovery.scss (mobile hero spacing for new CTA)
- public/locales/en/common.json
- public/locales/kr/common.json
- public/locales/ru/common.json
- memory.md

Added under libs/components/homepage/:

- HomeSection.tsx, HomeCarousel.tsx, HomeCollectionState.tsx, homeUtils.ts
- ResortCard.tsx, ResortCollection.tsx, PopularResorts.tsx, TrendResorts.tsx
- ResortDifficultySection.tsx
- EquipmentCard.tsx, EquipmentSection.tsx
- InstructorCard.tsx, TopInstructors.tsx
- WhySkiResort.tsx, HomeCTA.tsx

Added domain contracts:

- libs/enums/equipment.enum.ts
- libs/enums/instructor.enum.ts
- libs/types/equipment/equipment.ts
- libs/types/equipment/equipment.input.ts
- libs/types/member/instructor.ts

Removed under libs/components/homepage/:

- PopularProperties.tsx, PopularPropertyCard.tsx
- TrendProperties.tsx, TrendPropertyCard.tsx
- TopProperties.tsx, TopPropertyCard.tsx
- TopAgents.tsx, TopAgentCard.tsx
- Advertisement.tsx, Events.tsx

Other working-tree changes predate this task, including the user's AGENTS.md edit and previous branding/search/runtime work; none were reset or committed.

### Verification

- TypeScript: no errors in new/changed homepage code. Full check still fails at existing apollo/client.ts:74 ArrayBufferView generic and four CommunityCard prop mismatches in pages/community/index.tsx.
- Production build attempted; stops at the existing Apollo type error. No bypass/config change.
- Existing lint attempted; exits at ESLint setup prompt because no repository config exists. No config/package introduced.
- Formatting completed with existing Prettier (existing unsupported extends warning remains); git diff --check passed.
- All four new documents (getResorts, getEquipments, getInstructors, likeTargetResort) passed graphql.validate against an actual code-first schema generated from backend resolvers/DTO metadata with inert service imports, no database connection or application bootstrap.
- Actual-card server-render assertions passed for zero prices/experience, nullable fields, default images/category icons, Mondopoint size label, two-package limit, SOLD_OUT, favorite and disabled states; loading/error/empty states, all Resort sorts/levels and three-locale coverage passed.
- Isolated mounted React DOM tests with mocked Apollo responses passed guest favorite denial, authenticated toggle, duplicate-click locking, disabled state in both sections, refetch of both collections, all three preview dialogs, category variables/empty results and error/retry. Layout/carousel/SweetAlert were isolated in the harness; this is not browser or live-backend testing. Initial harness-only failures from missing self and asynchronous timing were corrected before the passing run.
- Next dev compiled homepage; HTTP 200 for /, /kr and /ru with all eight sections present and no old detail links. Dev reports pre-existing .next/trace permission warning but serves pages.
- No application test files/framework scripts were found. Assertion scripts used existing dependencies from temporary files, not a new repository test framework.
- Residual search of pages/index.tsx, homepage components, homepage desktop styles and cleaned mobile stylesheet found no Property/Agent/housing terms or old operations/routes.
- Live data/authenticated backend smoke tests remain unavailable because the loaded environment has no GraphQL endpoint. Browser surfaces are unavailable, so visual desktop/tablet/mobile and manual Swiper/keyboard QA remain unperformed.

### Remaining work

- Configure the intended backend endpoint separately and perform live-data/favorite smoke tests; finish browser visual/accessibility checks when a browser surface is available.
- Equipment catalog and Instructor directory/detail pages remain later phases; Resort detail is still deferred. Preview dialogs intentionally avoid those unmigrated destinations.
- Remaining legacy Property/Agent pages, member ownership panels, admin interfaces, shared enums/operations and assets are outside this homepage task. Community features were preserved.
- Existing type/lint/tooling blockers need separately scoped repair. No commit was made.


## 2026-10-05 — Full frontend migration implementation (supersedes prior remaining-work notes)

### Scope and architecture

Implemented the approved A–N migration sequentially. Preserved Pages Router, Apollo transport/cache, reactive Member identity, JWT/localStorage keys, MUI, SCSS, Swiper, winter hero/date-range preferences, existing community/article/follow features and prior uncommitted work. No packages installed, backend edits, dependency upgrades, commits or Booking/payment/Lesson/reservation implementation.

### Delivered behavior

- Homepage cards now route to individual Resort/Equipment/Instructor details; headings and View All route to working catalogs. Header uses singular domain routes and authenticated Favorites hearts on desktop/mobile.
- Catalogs share safe serialized URL inquiry parsing, page size 9, allowed sorts, pagination/back navigation, empty/error/retry states and desktop/mobile filter controls. Trip dates remain separate from GraphQL inputs.
- Resort text/location/level/facilities/daily-price filters and ACTIVE/SOLD_OUT details, galleries, KRW daily pricing, minimum days and favorites.
- Instructor nickname directory and Member-backed ACTIVE/INSTRUCTOR details, nullable experience/languages/level/audience/weekly prices, Member likes/follows and comments. Association uses an ID-based Resort link; no ownership or joined-title inference.
- Equipment filters cover exact supported text/category/audience/size/brand/Resort/purchase/duration/rental-price/purchase-price inputs. Searchable Resort selector, independent rental packages, zero prices/stock, Mondopoint/CM and optional purchase presentation; no checkout/availability claims.
- Independent Resort/Equipment favorites and visited tabs with correct differing inquiry signatures, cross-query refresh and synchronous shared duplicate-toggle lock. Removing the last favorite returns to the preceding page. Detail queries record views; no view mutation.
- Shared RESORT/EQUIPMENT/MEMBER comments with authenticated 1–100-character creation, owner edit/status deletion and admin removal. Backend counter behavior is preserved.
- USER applications/latest status/reapplication after rejection, approval relogin notice, dedicated nullable-clearing Instructor profile editing with refreshed JWT.
- Admin Resort/Equipment create/update/uploads/status hiding/separately confirmed permanent removal; application list/detail/approval/reason-required rejection/conflict refetch. Generic Member role controls cannot assign/reassign INSTRUCTOR. Unsupported support/notification administration removed from active navigation.
- USER-only signup, masked passwords, propagated login failures, no credential logging, session-restoration gate, general Member profile uploads/token replacement. AGENT ownership panels removed; roles and TELEGRAPH spelling aligned.
- Legacy Property/Agent URLs redirect to catalog listings without reusing IDs. Unused Property cards/types/operations/ownership editors removed after reference checks. About/FAQ/support now use honest winter discovery copy.
- Neutral shared interaction/counter types, manual catalog/domain types/documents, responsive styling, English/Korean/Russian copy. Apollo TS4.6 ArrayBufferView issue and Community handler prop errors repaired. Minimal existing-tooling ESLint config added.

### Validation actually executed

- TypeScript noEmit/incremental false: PASS. Production build also completes lint/type validation and generates all 83 pages.
- Standard next lint: PASS with existing image/hook warnings. Expanded pages/libs/apollo lint: FAIL only at unchanged, unused Three.js ScrollControls.tsx (three anonymous-component display-name errors and deprecated ReactDOM.render). No rule suppression or unrelated infrastructure rewrite.
- Production next build: PASS, including all catalog/detail/admin/application routes. Browserslist age warning remains; no dependency changes.
- All 51 exported Apollo GraphQL documents validate against actual backend code-first generated schema using inert services, without backend bootstrap/database or network. No generated client types/framework introduced.
- Existing-dependency isolated ReactDOM/jsdom checks: PASS for guarded inquiry/filter parsing, all three list/detail queries and links, clear filters, zero prices/stock/experience, gallery dialog, guest favorites, duplicate toggle lock, invalid Instructor rejection, application pending/rejected/approved states, last-page favorite removal, required admin rejection reason, approval conflicts/success/refetch.
- Actual authentication-helper checks with isolated Apollo responses: PASS for credential/token failure propagation, USER-only signup, storage/JWT/reactive state and zero-valued Instructor claims.
- Changed-file Prettier checks: PASS (116 code/style/JSON files). Literal translation-key audit: no missing keys across en/kr/ru. git diff --check: PASS; existing CRLF normalization notices only.
- Production HTTP smoke: 200 for home/en/Korean/Russian, all six public catalog/detail routes, login, personal page and three new admin screens. Legacy Property/Agent/admin-Property routes return 307 to their intended listing, including legacy IDs. These confirm server routing, not client-side rendering or live data.
- Temporary assertion helpers were kept outside the repository. No application test framework/script or GraphQL codegen exists.

### Remaining validation and retained legacy material

- No configured GraphQL/upload/WebSocket endpoint was available. Requested the intended endpoint asynchronously; live backend auth/uploads/mutations/schema introspection remain unexecuted. Do not infer deployment endpoints or claim live verification.
- Computer-use inventory has no enabled browsers; desktop/tablet/mobile visual QA, actual browser back/focus/keyboard/gallery/drawer checks remain unperformed. Responsive implementation and isolated DOM checks do not replace browser verification.
- Retained backend compatibility fields memberProperties and unsupported NotificationGroup.PROPERTY exactly match current backend source; neither drives active catalog presentation.
- Legacy URL files are intentional compatibility redirects. Historical docs/memory, unused real-estate assets/styles and inactive Three.js infrastructure remain; no active Property/Agent GraphQL operations remain. Generic table parameter named property and user-agent detection are unrelated terms. Unsupported static support admin files are retained but absent from active navigation.
- Booking, Lessons, payment, checkout, date availability, inventory deduction and reservation await finalized backend contracts. Future live/browser checks are still required before rollout.

### Working-tree file manifest

This inventory includes preserved edits from earlier branding/homepage/runtime tasks and the user's instructions; it is not a claim that every listed file changed in this execution slice. Nothing was reset or committed.

```text
 M AGENTS.md
 M apollo/admin/mutation.ts
 M apollo/admin/query.ts
 M apollo/client.ts
 M apollo/user/mutation.ts
 M apollo/user/query.ts
 M libs/auth/index.ts
 M libs/components/Footer.tsx
 M libs/components/Top.tsx
 M libs/components/admin/AdminMenuList.tsx
 D libs/components/admin/properties/PropertyList.tsx
 M libs/components/admin/users/MemberList.tsx
 D libs/components/agent/ReviewCard.tsx
 D libs/components/common/AgentCard.tsx
 D libs/components/common/PropertyBigCard.tsx
 M libs/components/cs/Faq.tsx
 M libs/components/cs/Notice.tsx
 D libs/components/homepage/Advertisement.tsx
 D libs/components/homepage/Events.tsx
 M libs/components/homepage/HeaderFilter.tsx
 D libs/components/homepage/PopularProperties.tsx
 D libs/components/homepage/PopularPropertyCard.tsx
 D libs/components/homepage/TopAgentCard.tsx
 D libs/components/homepage/TopAgents.tsx
 D libs/components/homepage/TopProperties.tsx
 D libs/components/homepage/TopPropertyCard.tsx
 D libs/components/homepage/TrendProperties.tsx
 D libs/components/homepage/TrendPropertyCard.tsx
 M libs/components/layout/LayoutAdmin.tsx
 M libs/components/layout/LayoutBasic.tsx
 M libs/components/layout/LayoutFull.tsx
 M libs/components/layout/LayoutHome.tsx
 M libs/components/member/MemberArticles.tsx
 M libs/components/member/MemberFollowers.tsx
 M libs/components/member/MemberFollowings.tsx
 M libs/components/member/MemberMenu.tsx
 D libs/components/member/MemberProperties.tsx
 D libs/components/mypage/AddNewProperty.tsx
 D libs/components/mypage/Article.tsx
 M libs/components/mypage/MyArticles.tsx
 M libs/components/mypage/MyFavorites.tsx
 M libs/components/mypage/MyMenu.tsx
 M libs/components/mypage/MyProfile.tsx
 D libs/components/mypage/MyProperties.tsx
 D libs/components/mypage/PropertyCard.tsx
 M libs/components/mypage/RecentlyVisited.tsx
 M libs/components/mypage/WriteArticle.tsx
 D libs/components/property/Filter.tsx
 D libs/components/property/PropertyCard.tsx
 D libs/components/property/Review.tsx
 M libs/config.ts
 M libs/enums/comment.enum.ts
 M libs/enums/like.enum.ts
 M libs/enums/member.enum.ts
 D libs/enums/property.enum.ts
 M libs/enums/view.enum.ts
 M libs/types/board-article/board-article.ts
 M libs/types/comment/comment.ts
 M libs/types/customJwtPayload.ts
 M libs/types/follow/follow.ts
 M libs/types/member/member.input.ts
 M libs/types/member/member.ts
 D libs/types/property/property.input.ts
 D libs/types/property/property.ts
 D libs/types/property/property.update.ts
 M libs/utils.ts
 M package.json
 M pages/_admin/properties/index.tsx
 M pages/_admin/users/index.tsx
 M pages/_app.tsx
 M pages/_document.tsx
 M pages/about/index.tsx
 M pages/account/join.tsx
 M pages/agent/detail.tsx
 M pages/agent/index.tsx
 M pages/community/index.tsx
 M pages/cs/index.tsx
 M pages/index.tsx
 M pages/member/index.tsx
 M pages/mypage/index.tsx
 M pages/property/detail.tsx
 M pages/property/index.tsx
 M public/img/logo/favicon.svg
 M public/locales/en/common.json
 M public/locales/kr/common.json
 M public/locales/ru/common.json
 M scss/app.scss
 M scss/mobile/main.scss
 M scss/pc/general.scss
 M scss/pc/homepage/homepage.scss
?? .eslintrc.json
?? libs/catalogSearch.ts
?? libs/components/admin/CatalogAdmin.tsx
?? libs/components/admin/CatalogEditor.tsx
?? libs/components/admin/InstructorApplications.tsx
?? libs/components/common/CatalogFilters.tsx
?? libs/components/common/CatalogPage.tsx
?? libs/components/common/ResortSelect.tsx
?? libs/components/common/ResourceComments.tsx
?? libs/components/common/ResourceDetail.tsx
?? libs/components/common/ResourceGallery.tsx
?? libs/components/homepage/EquipmentCard.tsx
?? libs/components/homepage/EquipmentSection.tsx
?? libs/components/homepage/HeroBanner.tsx
?? libs/components/homepage/HomeCTA.tsx
?? libs/components/homepage/HomeCarousel.tsx
?? libs/components/homepage/HomeCollectionState.tsx
?? libs/components/homepage/HomeSection.tsx
?? libs/components/homepage/InstructorCard.tsx
?? libs/components/homepage/PopularResorts.tsx
?? libs/components/homepage/ResortCard.tsx
?? libs/components/homepage/ResortCollection.tsx
?? libs/components/homepage/ResortDifficultySection.tsx
?? libs/components/homepage/TopInstructors.tsx
?? libs/components/homepage/TravelDateRange.tsx
?? libs/components/homepage/TrendResorts.tsx
?? libs/components/homepage/WhySkiResort.tsx
?? libs/components/homepage/homeUtils.ts
?? libs/components/mypage/InstructorWorkflow.tsx
?? libs/components/mypage/SavedCatalog.tsx
?? libs/enums/equipment.enum.ts
?? libs/enums/instructor.enum.ts
?? libs/enums/resort.enum.ts
?? libs/hooks/useCatalogFavorite.ts
?? libs/hooks/useMemberSession.ts
?? libs/resortSearch.ts
?? libs/types/catalog.ts
?? libs/types/equipment/equipment.input.ts
?? libs/types/equipment/equipment.ts
?? libs/types/interaction.ts
?? libs/types/member/instructor.ts
?? libs/types/resort/resort.input.ts
?? libs/types/resort/resort.ts
?? libs/uploadImages.ts
?? memory.md
?? pages/_admin/equipment/index.tsx
?? pages/_admin/instructor-applications/index.tsx
?? pages/_admin/resort/index.tsx
?? pages/equipment/detail.tsx
?? pages/equipment/index.tsx
?? pages/instructor/detail.tsx
?? pages/instructor/index.tsx
?? pages/resort/detail.tsx
?? pages/resort/index.tsx
?? public/img/hero/README.md
?? public/img/hero/winter-1.jpg
?? public/img/hero/winter-2.jpg
?? public/img/hero/winter-3.jpg
?? public/img/hero/winter-4.jpg
?? public/img/hero/winter-5.jpg
?? scss/home-discovery.scss
```
