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

## 2026-10-05 — SNOWKR redesign phase 1: shared shell and Home
- Applied the approved Stitch project 531088098807301001 reference and UI.md precedence. One shared SNOWKR header/footer now serves Home, public, account and admin layouts; removed per-wrapper banners and duplicated shell markup.
- Added a 1440px responsive container, blue MUI theme, typography and shared responsive styles. Home retains existing catalog queries and adds real Community articles plus explicitly labeled sample Events.
- Introduced demo-only cart state for the header badge; no backend contract, package, auth transport, or deployment changes.
- Located existing Node 20 runtime. TypeScript passed after the initial shell changes. Later phases require fresh checks; browser QA not yet executed.

## 2026-10-05 — SNOWKR redesign phase 2: catalog presentation
- Preserved list/detail operations, filter parsing, pagination, favorites and comments. Added real associated-Resort lookup and responsive detail content/selection panels.
- Added demo-only Resort/Instructor/Equipment selections using actual daily, weekly and configured hourly-package prices. No Booking/payment/availability API is invented.
- Cart/checkout implementation and account/community adaptation are in progress; final type/lint/build and interaction checks remain pending.

## 2026-10-05 — SNOWKR redesign phase 3: account and Community
- Preserved signup/login and profile upload/update operations; applied SNOWKR account styling and shared shell. My Page retains existing categories, role-aware Instructor workflows and social components, with an added separate demo receipts category.
- Community list/detail now works on mobile, with backend categories/search/sorts, URL pagination, article likes and the existing shared comment operations extended to ARTICLE. My Articles uses current-user filtering and owner article edit/status deletion. The existing Toast UI editor and upload protocol are retained with controlled inputs and actual DTO limits.
- Typechecking caught a Community form-event annotation; corrected it. Final checks pending.
- Computer-use inventory reports no enabled apps/browsers. Browser visual/keyboard validation remains unavailable; no visual verification is claimed.

## 2026-10-05 — SNOWKR redesign phase 4: demo commerce and content
- Added typed browser-local cart with reload/cross-tab restoration and quantity badge, plus /cart, /checkout, /checkout/success and member-separated local demo receipts in My Page.
- Backend price selections cover Resort daily price × days, independent Instructor weekly prices, Equipment configured hourly packages and purchase prices × quantity. Zero prices are supported; missing prices and invalid dates/packages are blocked. No extra fees, availability guarantees or stock deductions.
- Checkout requires login, revalidates current catalog records and prices, requires reconfirmation of changed totals and blocks unavailable selections. Simulated success/failure/retry uses a shared duplicate-submission lock and checks account/cart consistency before receipt creation. No real card data or payment/Booking mutations.
- Added clearly labeled fictional Events and snow reports. Real catalog, Community and member data remain backend-fed.
- Added isolated cart/revalidation regression checks using existing tooling. The current 51 Apollo documents validate against the backend generated schema. Final build/DOM checks remain pending.

## 2026-10-05 — SNOWKR redesign phase 5: consistency and support
- Standardized account/Member/social/admin responsive presentation and branded metadata. Retained protected admin management routes and intentional compatibility redirects.
- Public Help Center routes show honest unavailable states for unpublished legal/lift-pass information. Inactive legacy admin support routes now show unavailable API information instead of fabricated records/actions; they remain outside active admin navigation.
- Updated service/FAQ wording to distinguish local demo checkout from real payments/reservations. Localization and final validation are in progress.

## 2026-10-05 — SNOWKR final verification and handoff
- Completed the five implementation phases above. The shared shell covers retained public/account/management pages, with responsive catalog/detail, Member, account, Community/editor, Help Center and admin presentation. Added /cart, /checkout, /checkout/success, /events and /snow-reports; My Page exposes member-separated Demo orders.
- Replaced the remaining legacy follower/following lists with one typed component using existing GET_MEMBER_FOLLOWERS/GET_MEMBER_FOLLOWINGS operations and the existing parent interaction handlers. Added query guards, responsive rows, pending locks, pagination and network error/retry states. No Member phone/address is displayed in these rows.
- Added English/Korean/Russian copy for new UI, demo states and navigation. Admin pages without translation loaders now receive the existing server-side locale resources. The skip link targets a focusable main element; MUI menus/drawers/forms retain their keyboard behavior.
- Found that ignored .env.local contained comments only, while the three existing public API URLs were in ignored .env.development. Added those same URLs to .env.local for production builds, preserving Apollo/auth infrastructure. Verified the production browser bundle includes the configured GraphQL URL.
- PASS: TypeScript (tsc --noEmit --incremental false); Next lint (warnings only); final production build, 92 localized static pages. Remaining lint warnings: existing About/admin img usage and two existing admin refetch effect dependencies. Build also reports an outdated Browserslist dataset; no dependency updates were made.
- PASS: scripts/check-graphql-documents.cjs validates all 51 Apollo documents against the current sibling backend code-first schema, using inert service stubs without starting API/database services.
- PASS: live read-only public Apollo operations return 6 Resorts, 12 Equipment items, 1 Instructor and 0 Board Articles; catalog detail and supported Resort association reads succeed. No application mutation was executed by these live checks.
- PASS: 75 production route requests across en/kr/ru, one shared header/footer/main on retained public/account pages, six navigation links, serialized correct locale, no active mobile placeholders, and /property, /agent and /_admin/properties compatibility redirects.
- PASS: scripts/check-demo-checkout.cjs covers mixed-domain totals, zero/missing prices, invalid dates/packages, changed/removed/ineligible records, corrupt storage, reload restoration, merged selections, member receipt isolation and storage failures.
- PASS: scripts/check-demo-ui.cjs covers login return, changed-price review/reconfirmation, double-click prevention, local receipt creation, query-only network operations, simulated failure retention/retry controls and account-switch protection.
- PASS: scripts/check-follow-ui.cjs covers real query field mapping, correct interaction target/refetch, pagination, network failure/retry and invalid member-ID guards.
- PASS: existing isolated catalog/application/admin regression checks and actual authentication-helper regression checks. git diff --check is clean.
- New tests use installed dependencies only. Run the four scripts above with Node from the frontend root; GraphQL validation additionally requires the existing sibling skiresort backend dependencies. Existing usable runtime: C:/Users/Aziz/AppData/Local/Temp/skiresort-node20-repair/node-v20.19.0-win-x64/node.exe.
- Verification limits: computer-use inventory exposes no browser/apps, so desktop/tablet/mobile visual comparison, actual keyboard navigation and browser locale/dialog checks are not visually verified. No authorized live test account was provided, so live login/logout, profile upload/update, article/comment writes and USER/INSTRUCTOR/ADMIN mutation workflows remain unverified against live data; isolated checks are not claimed as live authenticated verification.
- Checkout/payment, Events and snow reports remain explicitly labeled demos; receipt/cart state is browser-local. No booking/payment backend write, real card collection, stock deduction, fees or fabricated supported catalog/community data. Backend files, dependencies, Git history and deployment were not changed.
- Local final production preview is running at http://localhost:3012.

## 2026-10-05 — Homepage review and redevelopment from code.html
- Scope: reviewed the static code.html reference and redeveloped only the homepage body. Kept the existing Top/Footer, auth/Apollo transport, dependencies and other page implementations. Existing workspace edits were retained; no commit.
- Read AGENTS.md, SKILLS.md, frontend-migration/resort-ui skills, backend docs/ai handoffs and the actual Resort/Equipment/Instructor/BoardArticle DTOs, enums and public resolvers.
- Rebuilt hero/search presentation, dedicated compact homepage Resort/Instructor/Equipment cards, responsive scroll-snap carousels with keyboard focus and disabled boundary controls, article/news cards and homepage-only skeleton states. Styles live in scss/homepage-refresh.scss, imported by scss/snowkr.scss and scoped to .home-refreshed.
- Resort search now changes the homepage GET_RESORTS Apollo variables. Quick filters use BEGINNER, EQUIPMENT_RENTAL and SKI_SCHOOL; equipment chips use GET_EQUIPMENTS categoryList. Actual configured package durations/prices, zero prices, purchase capability, teaching experience/languages and real favorite mutations are preserved. Travel dates are carried into resort links and remain outside backend search/availability contracts.
- Replaced homepage sample Events with backend BoardArticle NEWS content because no Events API exists. Empty collections remain honest empty states. Added English/Korean/Russian homepage copy.
- Changed files in this task: pages/index.tsx; libs/components/layout/LayoutHome.tsx; homepage HeroBanner, HeaderFilter, HomeCarousel, HomeSection, HomeCollectionState, ResortCollection, TopInstructors, EquipmentSection, CommunityBoards; new HomeCatalogCards.tsx; new scss/homepage-refresh.scss plus its import; locale common.json files; new scripts/check-homepage-ui.cjs; memory.md. Shared HomeCollectionState keeps its previous spinner as default outside Home.
- PASS: final Next production build including TypeScript/lint, all 92 localized static pages. Lint reports only existing About/admin image warnings and admin refetch dependencies. PASS: all 51 existing Apollo documents validate against sibling backend generated schema.
- PASS: isolated mounted-homepage Apollo integration check verifies real query variables, NEWS category, search/facility filters/reset, equipment category, network failure/retry, zero-price packages, empty instructor state and travel-date propagation. Uses installed dependencies and fixtures; no live mutations.
- PASS: read-only live Apollo calls return 6 Resorts, 1 Instructor, 6 Equipment records at the homepage limit, 2 filtered Snowboards, 0 Community/NEWS articles, and 0 Resorts for BEGINNER plus SKI_SCHOOL. Live empty states are expected; no records were fabricated.
- Browser inventory exposes no apps/browsers; visual desktop/mobile comparison remains unverified. Existing inactive legacy homepage files and other routes were not migrated in this task. No backend/auth/payment changes or deployment.

## 2026-10-05 — Homepage screenshot detail pass
- Applied the four supplied screenshots to the homepage search, Resort, Instructor and Equipment presentation. Kept the shared header/footer and other page implementations.
- Search now has external uppercase labels, location/calendar/ski icons, 46px pale inputs, a blue search button, divider and four compact quick-filter chips. Province selections map to actual ResortLocation lists; facility chips use EQUIPMENT_RENTAL/SKI_SCHOOL. Reused the working date picker with an optional homepage presentation.
- Resort cards have 190px cover photos, bottom location/title overlays, circular hearts, a minimum-stay/views row, compact level/facility tags and a divided daily-price/Details footer. No unsupported slope count or lift-pass fields were invented.
- Instructor cards use inset square portraits, a dark Instructor badge, circular like control, name/Follow row, teaching-level subtitle, weekly-price/views row and full-width pale View Instructor button. Real LIKE_TARGET_MEMBER/SUBSCRIBE/UNSUBSCRIBE operations have login/self guards, a shared per-card pending lock, error feedback and active-query refetch. Directory state refetches on member changes.
- Equipment cards use pale inset image panels, Rent/Rent & Buy badges, hearts, category/views row, title, configured rental-price/duration and purchase-price rows, rental-only text and divided Details/Rent/Buy footers. Action links open the existing equipment detail and package-selection page; no checkout, booking or payment behavior was added.
- Screenshot structure, spacing, radii, tag colors, price typography, button treatments and heading-aligned carousel arrows are in homepage-scoped scss/homepage-refresh.scss. Backend prices retain daily Resort / weekly Instructor / configured-hour Equipment units, and all images/counts remain backend-sourced.
- Files changed this pass: HomeCatalogCards.tsx, HeaderFilter.tsx, TravelDateRange.tsx, TopInstructors.tsx, PopularResorts.tsx, ResortCollection.tsx, new homeSearchOptions.ts, homepage-refresh.scss, locale common.json files and check-homepage-ui.cjs.
- PASS: tsc --noEmit --incremental false; lint with existing About/admin warnings only; all 51 Apollo documents validate against the backend schema; mounted-homepage integration checks cover query filters, travel dates, retry/empty states, zero prices, equipment action layout, follow/unfollow/like targets, guest/self guards and duplicate-click prevention. No live mutations executed.
- The workspace's standard build hit EPERM on the locked .next/trace. Production verification uses a temporary source snapshot at C:/Users/Aziz/AppData/Local/Temp/skiresort-homepage-screenshot-build with a junction to the existing dependencies; no dependency or project configuration edits.
- Browser inventory again returned no enabled apps/browsers. Pixel-level desktop/mobile rendering comparison remains unverified. No unrelated domains, backend files, dependencies, Git history or deployment changed.
- PASS: standard Next production build on the temporary source snapshot, compiled successfully and generated all 92 localized static pages. The original workspace trace lock was not changed.

## 2026-10-05 — Resort directory from code.html and screen.png
- Rebuilt only /resort using new libs/components/resort/ResortCatalog.tsx and scoped scss/resort-directory.scss, imported by snowkr.scss. Retained the existing homepage Top/Footer through LayoutBasic/AppLayout; other catalogs, auth/Apollo, backend, dependencies and prior workspace edits remain intact. No commit.
- Read AGENTS.md, SKILLS.md, frontend-migration/resort-ui skills, backend docs/ai handoffs and actual Resort enums, inquiry DTO, resolver/service and existing frontend catalog/favorite patterns.
- Implemented panoramic winter hero, name search, desktop filter sidebar/mobile drawer, active removable filters, refined two-column image cards (one column on phones), pagination with eight records per page, skeletons, empty states and retry feedback.
- Cities are all eleven exact ResortLocation enum values, with All Korea reset and multiple selection. Skill levels/facilities and inclusive validated daily price ranges use actual backend fields. City counts, slope counts, night skiing and lift-pass pricing from the static reference were omitted because no supporting backend contract exists. Search is correctly labeled name-only, matching the backend title search.
- Most viewed maps to resortViews DESC, Popular to resortLikes DESC, and high/low prices to resortPricePerDay DESC/ASC. Existing saved/homepage URL filters and sorts remain supported. Filter/sort changes reset page one; trip dates are preserved in list/detail URLs outside GraphQL filters.
- Cards use backend photos, city, level, facilities, views, likes, daily price and minimum stay, with SOLD_OUT badges and existing real favorite mutation/login/pending-lock behavior. Zero prices remain visible. Added en/kr/ru directory strings.
- Changed files: pages/resort/index.tsx; new ResortCatalog.tsx; new resort-directory.scss; snowkr.scss import; three locale common.json files; new scripts/check-resort-directory.cjs; memory.md.
- PASS: production build in C:/Users/Aziz/AppData/Local/Temp/skiresort-resort-directory-build, including type checking, lint and all 92 localized pages. Workspace build hit the existing locked .next/trace; the isolated build uses a junction to existing dependencies. Only existing About/admin lint warnings and outdated Browserslist notice remain.
- PASS: all 51 Apollo documents validate against the sibling backend schema. Mounted UI integration check covers exact city/level/facility variables, four sort mappings/directions, pagination, invalid/zero price ranges, filter reset, trip links, zero-price cards, guest favorite guard, authenticated exact-target favorite and duplicate-click lock, empty/network-retry states and mobile drawer. Fixture mutations only; no live mutations.
- PASS: live read-only API queries verify all four actual sorted orders (8 records/page, 11 total at verification) and PYEONGCHANG filtering (1 record). Generated en/kr/ru resort HTML has one shared header/footer/main and h1.
- Browser inventory exposes no enabled apps/browsers; pixel-level desktop/mobile comparison remains unverified. No unsupported booking/availability/lift-pass behavior was added.

## 2026-10-05 - Resort typography and screenshot correction
- Reviewed the actual Resort screen with Stitch MCP (project 531088098807301001, screen f0744625cb044ae0b12d5d5fcdc34065), downloading its HTML/screenshot for inspection and comparing code.html. Both references specify Inter body/control text and Plus Jakarta Sans display headings. No Stitch project writes.
- Found the legacy reset explicitly assigns Poppins to individual elements, defeating simple root inheritance. Scoped the correct font families to resort content and its mobile drawer; retained display headings, with readable result-count weight/line-height/tabular numerals. Shared Home header/footer and other domains remain untouched.
- Corrected the damaged U+2013 range separator (previously a question mark) in English and repaired the prior task's damaged Korean/Russian directory translations using direct UTF-8 patches.
- Replaced long floating price-input labels with external translated Min/Max labels and full accessible daily-price names, 44px pale inputs with 8px corners, adequate padding and a compact rectangular Apply price range button. Restricted filter label/legend rules to direct children so MUI outline/notch elements are not restyled by sidebar rules.
- Changed files: ResortCatalog.tsx, resort-directory.scss, en/kr/ru common.json, check-resort-directory.cjs, memory.md. Filtering/query/favorite/backend contracts are unchanged; no dependencies or commit.
- PASS: TypeScript; lint (existing About/admin warnings only); final isolated production build at C:/Users/Aziz/AppData/Local/Temp/skiresort-resort-typography-build, all 92 localized pages; git diff --check.
- PASS: mounted resort regression checks, expanded with realistic 11-record pagination and exact Showing 1-8 / 9-11 text (using U+2013), all locale directory-text integrity, accessible external price labels, font checks against the actual legacy Sass reset, 44px input height/8px radius and no inherited float on MUI notch legends. JSDOM stylesheet ordering is explicitly accommodated; these checks do not claim browser visual rendering.
- Browser MCP inventory remains empty. Stitch reference was reviewed, but final live desktop/mobile visual comparison is unavailable. Updated production preview uses port 3014; previous port 3013 serves the prior snapshot.

## 2026-10-05 - Resort count separator follow-up
- Replaced the result range punctuation with words: English now reads Showing 1 to 8 of 11 resorts in both toolbar and pagination. Korean/Russian use their corresponding word connectors. No filtering, sorting or backend behavior changes.
- Updated existing regression assertions for first/last-page counts and locale text integrity. PASS: resort UI integration check; production build including TypeScript/lint and all 92 localized pages (existing unrelated lint warnings only); git diff --check.
- Identified and stopped only the two previously created resort preview processes, refreshed their builds, and restarted ports 3013/3014 so the original preview link no longer serves the stale damaged separator.

## 2026-10-05 - Homepage resort navigation fix
- Homepage Search Resorts now navigates to /resort with the existing serialized inquiry URL instead of filtering and scrolling within the homepage. Province city mappings, skill level and facility filters travel in input; validated arrival/departure remain separate URL preferences.
- Popular Ski Resorts heading and Explore resorts share the catalog link, preserving popularity sort and trip dates. Added optional titleHref to HomeSection without changing other section headings.
- Expanded the existing Details anchor hit area across the resort card using homepage-scoped CSS. Photos/title and Details use the existing /resort/detail?id route; favorites remain above the link hit area. Added a full-card keyboard focus outline and preserved heading font inheritance.
- Changed files this task: pages/index.tsx, HomeSection.tsx, ResortCollection.tsx, scss/homepage-refresh.scss, scripts/check-homepage-ui.cjs and memory.md. Preserved prior uncommitted work; no backend, auth, dependencies or commits.
- PASS: homepage mounted regression check verifies catalog navigation, exact Gangwon city filters, skill/facility query round-trip through the actual catalog parser, dates, popularity heading/detail URLs and favorite navigation isolation. Existing equipment/instructor checks also pass. MUI reports a JSDOM layout warning when opening the select menu; assertions pass.
- PASS: TypeScript, lint (existing unrelated About/admin warnings), scoped git diff --check and production build generating all 92 localized pages. Workspace build hits the existing .next/trace lock; successful build uses C:/Users/Aziz/AppData/Local/Temp/skiresort-home-routing-build with existing dependencies. Browser hit-area verification and existing production preview refresh were not performed.

## 2026-10-05 - Resort detail from Stitch and backend contracts
- Read AGENTS.md, SKILLS.md, frontend-migration/resort-ui skills, backend docs/ai handoffs and actual Resort resolver/DTO/enums/service, Instructor search DTO and existing frontend detail, gallery, favorite, comment and demo-cart patterns. Preserved earlier workspace changes.
- Retrieved and inspected Stitch project 531088098807301001, screen 98eb77e1c15142b3b8ede5c9d3752577 (SNOWKR - Mona Yongpyong Resort Detail). Downloaded its HTML and screenshot to Temp; no Stitch writes. Matched its asymmetric gallery, white rounded information/facility cards, daily pricing sidebar, instructor discovery and full-width comments using existing shared header/footer.
- Replaced only the /resort/detail presentation with new ResortDetail.tsx and scoped resort-detail.scss. Uses the existing GET_RESORT document, valid-ID/router guards, skeletons, unavailable/retry states, exact backend address/description/level/facilities/counters, actual photo count and an accessible gallery dialog. Empty photos/descriptions/facilities show unavailable copy. Real favorite controls retain login checks, shared duplicate locks and active-query refetch; Share writes the actual page URL to the clipboard and reports failures honestly.
- The backend has no lift-pass/hourly pricing or Booking reservation API. Retained the existing explicitly labeled local demo cart, showing backend daily price/minimum stay, sold-out disablement and validated arrival/departure URL prefill through an optional DemoBookingPanel prop. Zero prices work. No live booking/payment behavior or unsupported night-skiing facility was invented.
- Reused TopInstructors as general instructor discovery, labeled Meet the instructors: InstructorSearch only supports text, so this does not claim instructors belong to the displayed Resort. Reused ResourceComments with RESORT group and an optional onChange callback to refresh the detail counters after successful comment operations; existing other callers remain compatible. Backend owner-comment deletion may leave persisted counters different from ACTIVE comments, per the backend's documented policy; frontend does not fabricate counter corrections.
- Changed files: pages/resort/detail.tsx; new libs/components/resort/ResortDetail.tsx; new scss/resort-detail.scss and snowkr.scss import; DemoBookingPanel.tsx; ResourceComments.tsx; libs/types/resort/resort.ts (existing selected resortComments field); en/kr/ru common.json; new scripts/check-resort-detail.cjs; memory.md. No new dependencies, backend/auth/Apollo infrastructure edits, commit or deployment.
- PASS: TypeScript; lint (only existing About/admin warnings); all 51 Apollo documents validate against the generated backend schema; final standard workspace production build generating all 92 localized pages; scoped git diff --check. This task's workspace builds succeeded without the previously reported trace lock. Existing outdated Browserslist notice remains.
- PASS: mounted detail/Apollo regression checks for exact detail variables and invalid IDs, backend content, gallery navigation/close, real clipboard call, trip dates, zero-price demo cart, SOLD_OUT, favorite guest guard/exact target/duplicate lock and saved state, exact RESORT comment submission/query target plus counter refetch, missing data and network retry. Mutations use fixtures only. Existing check-demo-ui.cjs checkout regression also passes.
- PASS: live guest read-only catalog/detail smoke check against the existing configured API; 11 catalog records, selected ACTIVE Resort with one photo and three facilities. No live mutations executed.
- Browser tool inventory returned no enabled apps/browsers. Stitch reference review and DOM behavior are verified; final rendered desktop/mobile visual comparison and preview-server refresh remain unverified.

## 2026-10-05 - Resort detail share dismissal, active comment total and backend pricing prompt
- Share success/failure notices now disappear after three seconds. Each completed Share click restarts the timer, with cleanup when navigating away or unmounting.
- Verified backend owner updateComment sets DELETE without decrementing persisted resortComments. Resort detail now receives the actual ACTIVE getComments.metaCounter total through an optional ResourceComments onTotalChange callback, so the displayed count decreases after deletion and stays correct after refetch. Counts use total across all pages, not the current list length. Backend persisted counters are unchanged; other ResourceComments callers retain existing behavior.
- Confirmed the minimum stay originates in backend ResortInput (@Min(2), default 2), ResortUpdate and the Mongoose schema, and is enforced by the existing frontend demo panel. No pricing contract was changed in this frontend task.
- Added docs/backend-resort-pass-prompt.md for the user's requested 3-hour, 6-hour, full-day and full-day-plus-night Resort passes, independent configured KRW rates and flexible one/multiple visit days without minimum stay. Prompt covers exact API handoff, filter/sort changes and explicit migration/rollout; full-day pass types do not imply guessed opening hours. It notes persisted comment counter drift as a separate backend follow-up.
- Changed files: ResortDetail.tsx; ResourceComments.tsx; check-resort-detail.cjs; new docs/backend-resort-pass-prompt.md; memory.md. No backend edits, live mutations, dependencies, commits or deployments.
- PASS: TypeScript; production compilation and 92 localized pages including lint with only existing About/admin warnings; scoped git diff --check; mounted detail regression expanded to verify automatic share dismissal/repeated-click timer reset and owner deletion/refetch with intentionally stale persisted Resort counter. Existing detail scenarios also pass.

## 2026-10-05 - Resort card views, likes and comments
- Added comment icon/count after views and likes on /resort directory cards. Added the complete views/likes/comments row to homepage Resort cards, retaining minimum stay on its own row. Counts use existing resortViews/resortLikes/resortComments selections, show zeros, use existing translations and wrap on narrow cards. No extra card queries or GraphQL/backend changes.
- Changed files: ResortCatalog.tsx; HomeCatalogCards.tsx; homepage-refresh.scss; check-resort-directory.cjs; check-homepage-ui.cjs; memory.md. Other homepage card domains retain their existing presentation.
- PASS: existing mounted directory/homepage regression checks with new assertions for all three displayed counters in the requested order. Homepage check retains its known MUI/JSDOM anchor layout warning. Scoped git diff --check passes.
- PASS: production build including TypeScript/lint and all 92 localized pages in temporary source copy C:/Users/Aziz/AppData/Local/Temp/skiresort-card-counters-cc5b559987dd4be2a7d353fa5812ae29, using existing dependencies. Workspace build reached typecheck/lint but hit the existing locked .next/trace. Existing unrelated lint warnings and outdated Browserslist notice remain. No preview refresh, live mutations, commits or deployment.
- Catalog cards reflect the backend persisted resortComments counter; the separately documented owner-deletion counter drift remains a backend follow-up. Resort detail continues to use the active-comment inquiry total.
## 2026-10-05 - Equipment directory from supplied design
- Read AGENTS.md, SKILLS.md, equipment-ui/frontend-migration skills, backend docs/ai Equipment handoff/decisions/migration/completed tasks/next steps, and actual Equipment DTO/enums/resolver/service. Reviewed existing catalog, equipment cards, favorites, layout and Resort directory patterns. Preserved earlier workspace changes.
- Used DESIGN.md and code.html for the compact alpine banner, search strip, sidebar, three-column cards and rounded results/pagination bars. screen.png contains only the 28-byte text `<FIFE Image failed to fetch>` and cannot provide a screenshot reference. Reused shared AppLayout/header/footer, EquipmentImage fallback, translations, Apollo documents and authenticated favorite hook. No fabricated catalog records or facet counts.
- /equipment now renders EquipmentCatalog.tsx with URL-backed search, exact single-brand filter, real Resort IDs, backend category/audience values, category-specific canonical sizes plus custom input, rental-only/purchasable filters, and rental/purchase price ranges. Size filters require one category; category changes clear sizes. Rental filtering validates whole-hour duration and binds the range to that configured package. Cards show real views/likes, minimum configured package price with its hours (or selected package), optional purchase price, real favorite buttons and existing detail links. Zero prices are preserved. Mobile filters use the existing MUI Drawer pattern.
- Sort options are Newest (default; no createdAt in the label), Popular (equipmentLikes DESC), Most viewed (equipmentViews DESC), Price high to low and Price low to high. The backend explicitly rejects price sorts. The design's price options therefore use purchase prices collected through valid getEquipments requests in 100-record batches, then sort the complete filtered collection before local nine-item pagination. Rental-only items always follow purchasable items, with an explanatory label. Never send purchasePrice as a GraphQL sort. Cancel stale results when filters/auth change; retry failures without displaying partial collections; refresh after favorites. Price sorting costs requests/storage proportional to the filtered catalog and is not a transactional snapshot across concurrent catalog edits.
- Changed files: pages/equipment/index.tsx; new libs/components/equipment/EquipmentCatalog.tsx, libs/equipmentSearch.ts, scss/equipment-directory.scss and scripts/check-equipment-directory.cjs; scss/snowkr.scss import; en/kr/ru common.json additions; memory.md. No backend/auth/Apollo infrastructure changes, dependencies, commits or deployment. Equipment detail and other domains were not migrated in this task.
- PASS: TypeScript; lint (only existing unrelated About/admin warnings); all 51 GraphQL documents validate against the actual generated backend schema; mounted Equipment regression for all sort mappings, 102-record cross-page price ordering, zero purchase/rental prices, local pagination, filters and rental validation, detail links, guest/signed-in favorites, empty results, ordinary and price-sort errors/retry, mobile drawer and translation encoding. No live mutations were executed.
- PASS: final production build including typecheck/lint and all 92 localized pages in isolated Temp source copy C:/Users/Aziz/AppData/Local/Temp/skiresort-equipment-build-a1b5a80cec03442a8183833a324a9ac5 using existing dependencies. Initial workspace build compiled/generated pages but failed during a .next output rename (ENOENT); isolated build succeeded. Fixed the Equipment CSS flex-end compatibility warning before final build. Existing outdated Browserslist notice remains.
- Computer/browser tool inventory has no enabled apps or browsers; final rendered desktop/mobile visual comparison and preview refresh remain unverified. Resort selector currently queries the first 100 alphabetically sorted public Resorts, matching the existing filter lookup pattern. No obsolete real-estate references remain in the new Equipment directory.
## 2026-10-05 - Equipment detail from Stitch and backend contracts
- Read AGENTS.md, SKILLS.md, equipment-ui/frontend-migration skills, backend docs/ai Equipment handoff/decisions/migration/completed tasks/next steps and actual Equipment DTO/enums/resolver/service, existing ResourceDetail, Equipment gallery/favorites/comments and demo-cart patterns. Preserved earlier staged and unstaged workspace changes.
- Read connected Stitch project 531088098807301001, screen 843f86d30d654f77aba372fdae8fa2ee (Oakley Flight Deck Goggles Detail). Downloaded and visually inspected its screenshot at C:/Users/Aziz/AppData/Local/Temp/skiresort-equipment-detail-stitch.png. Used updated code.html and DESIGN.md. The supplied screen.png remains the 28-byte failed-fetch message. No Stitch writes or reference-file changes.
- /equipment/detail now renders EquipmentDetail.tsx: actual backend product photos with selectable thumbnails, image failure/empty states and accessible gallery dialog; real brand/name/category/size/audience/status/quantity; description; views/likes/active-comment totals; clipboard Share with three-second notice dismissal; real favorite mutation with existing login guard/duplicate locks; and associated Resort query/link with independent loading/unavailable/retry states. Null associations and missing optional data have honest empty copy. Invalid IDs never query; wrong-ID/hidden/error responses never show a usable detail/cart panel. Member changes refresh detail so backend meLiked and once-per-member view behavior remain authoritative.
- Product comments reuse ResourceComments with EQUIPMENT group, exact equipment ID and backend create/update/delete operations. onTotalChange supplies the ACTIVE total rather than the potentially stale persisted equipmentComments; onChange refetches detail. No changes to shared comment behavior or backend counter policy.
- EquipmentActionDesk.tsx presents the existing local demo cart in the Stitch rent/buy layout: configured whole-hour packages in duration order, independent per-package KRW prices, rental date, quantity 1-99, per-unit total, conditional purchase mode and actual purchase price. Zero prices work. No derived daily/hourly rate, calendar-day package assumption, official product/pickup/stock guarantee or live Booking/payment/order operation. Catalog quantity is shown directly and explicitly does not establish date availability; demo state does not allocate inventory. Sticky desktop sidebar uses grid placement; mobile places it after the product identity before descriptions/comments, with matching keyboard/DOM order.
- Changed files this task: pages/equipment/detail.tsx; new libs/components/equipment/EquipmentDetail.tsx and EquipmentActionDesk.tsx; new scss/equipment-detail.scss with scss/snowkr.scss import; en/kr/ru common.json additions; new scripts/check-equipment-detail.cjs; memory.md. Existing auth/Apollo/layout infrastructure, Equipment directory and other domains remain intact. No dependencies, commits or deployment.
- PASS: TypeScript; lint (only existing unrelated About/admin warnings); all 51 GraphQL documents validated against the generated backend schema; scoped whitespace/legacy-field audit; mounted detail checks for exact query IDs/associated Resort, gallery navigation, backend product information, independent package and zero prices, local demo-cart modes/date/quantity validation, guest/signed-in favorites and duplicate lock, comment create/edit/owner-delete plus stale counter correction, optional-data fallback, invalid IDs/hidden records and detail/association retry states. Tests use fixture responses only.
- PASS: anonymous live read-only configured backend catalog/detail smoke check: 12 catalog records; selected AVAILABLE Equipment with three configured rental packages. No authenticated requests, view writes or live mutations executed.
- PASS: final isolated production build including typecheck/lint and all 92 localized pages at C:/Users/Aziz/AppData/Local/Temp/skiresort-equipment-detail-build-eb725c10ddf740a0a8b97237872fc210 using existing dependencies. Existing outdated Browserslist notice remains. Browser/app inventory is empty; final rendered desktop/mobile comparison and preview refresh remain unverified. Booking/payment backend connection remains unavailable because those API contracts are not implemented.

## 2026-10-05 - Community listing from supplied design and backend contracts
- Read AGENTS.md, SKILLS.md, frontend-migration skill, backend docs/ai migration/decisions/completed tasks/next steps/frontend handoff and actual BoardArticle DTO/enums/resolver/service/sort allowlist. Inspected existing Community, ArticleCard, post editor and shared layout patterns. Used supplied code.html, DESIGN.md and visually inspected screen.png; no reference-file or Stitch changes.
- Rebuilt only /community presentation with alpine hero, local design hero image, title search and keyboard shortcut, category sidebar, single-column post feed inside a responsive three-column layout, backend popularity list, suggested title-search topics, etiquette and paginated result ranges. Backend categories remain FREE/RECOMMEND/NEWS/HUMOR (General/Recommendations/News/Humor); unsupported design categories, snow telemetry and fabricated global statistics were omitted. Search follows backend title-only behavior. Topics are suggestions, not a claim of live trending/tag support.
- Reused GET_BOARD_ARTICLES with actual filters/sorts/total counters; six articles per page, four popular posts ordered by articleViews. URL changes reset page, invalid URL values fall back safely, loading/error/empty/retry states are preserved. CommunityPost displays actual author/date/category/content/photos with broken-image fallback and detail/member routes. Optional ArticleCard community variant retains existing authenticated like mutation, duplicate lock and active listing refetch, including popular posts. Existing callers keep their original layout. Create Post uses the existing protected backend-connected editor route.
- Changed files: pages/community/index.tsx; new libs/components/community/CommunityPost.tsx; libs/components/common/ArticleCard.tsx; libs/types/board-article/board-article.input.ts (optional category/memberId matching backend); new scss/community-directory.scss and snowkr.scss import; public/img/community/community-hero.jpg; en/kr/ru common.json; new scripts/check-community-directory.cjs; memory.md. No dependencies, auth/Apollo infrastructure/backend changes, commit or deployment. No real-estate references remain in the changed listing area.
- Locale update initially failed because PowerShell JSON parsing rejects existing case-distinct keys. Restored all three locale files from the latest Equipment detail build copy, preserving the 64 preceding Equipment additions, then added Community entries safely with Node JSON parsing.
- PASS: TypeScript; lint with existing unrelated About/admin warnings only; all 51 GraphQL documents validate against backend-generated schema; mounted Apollo fixture checks for exact queries, popular posts, category/page/topic URL transitions, invalid input fallback, guest/signed-in likes/duplicate protection/refetch, detail/editor routes, empty/retry and keyboard focus; git diff --check. Anonymous read-only configured backend query returned HTTP 200, zero Community articles and total 0. No live writes or seed data were created.
- Workspace production build trace was locked by a running process. Isolated production build passed with all 92 localized pages at C:/Users/Aziz/AppData/Local/Temp/skiresort-community-build-b85650e802d8489c9fc659e2017035f5 using existing dependencies. Corrected CSS flex-start compatibility warning and ran final incremental build. Browser inventory is empty; rendered desktop/mobile visual comparison and preview refresh remain unverified. Existing outdated Browserslist notice remains.

## 2026-10-06 - Community Create page from supplied design
- Read AGENTS.md, SKILLS.md, frontend-migration skill, backend docs/ai frontend handoff/migration/decisions/completed tasks/next steps, and actual BoardArticle input/resolver/service/enums plus imageUploader MIME/size contracts. Inspected existing Teditor, WriteArticle, Community listing/detail, session, upload and shared layout patterns. Used supplied code.html, DESIGN.md and visually inspected screen.png. No reference-file or Stitch changes; preserved prior staged/unstaged work.
- Added protected /community/create with the supplied alpine layout, breadcrumbs, actual member author pill, category/title/content form, Markdown formatting controls, one optional cover image with picker/drop/preview/removal, posting guidelines, cancel and publish actions. Reused existing AppLayout, session/login referrer flow, Apollo CREATE_BOARD_ARTICLE and authenticated multipart imageUploader targeting articles. Community listing Create Post now links to this route; existing My Page creation/editing stays intact.
- Backend-authoritative categories: FREE/RECOMMEND/NEWS/HUMOR with existing readable labels. Titles are 3–50 characters; content is 3–250 Markdown characters, stored directly for the existing Toast UI viewer. Backend has one articleImage, so design's four images become one cover. JPEG/JPG/PNG only; UI caps upload at 10 MiB within backend's 15,000,000-byte limit; no unsupported WebP. No memberId sent; backend derives author. Required/length errors focus the first invalid field; upload/mutation errors preserve inputs; successful uploads are reused on mutation retry; duplicate lock and published state prevent repeated creation after success. Uploads occur only on Publish, though backend provides no cleanup operation for an uploaded image if article creation never succeeds.
- Changed: pages/community/create.tsx; libs/components/community/CreatePost.tsx; scss/community-create.scss and snowkr.scss import; pages/community/index.tsx Create Post link; en/kr/ru common.json entries; new scripts/check-community-create.cjs and updated listing route expectation in scripts/check-community-directory.cjs; memory.md. No dependencies, backend/auth/Apollo infrastructure changes, commits or deployment. No obsolete real-estate references in the new page.
- PASS: TypeScript; lint (existing unrelated About/admin warnings only); all 51 GraphQL documents validate against generated backend schema; mounted fixture checks for guest login redirect, actual author/categories, required/length boundaries, formatting, optional cover, format/size rejection, preview/removal, authenticated multipart mapping, upload/create errors and retry, exact create mutation, duplicate locks and detail navigation; Community listing regression; translation coverage; git diff --check. Tests use fixtures only; no live uploads or article creation performed.
- PASS: isolated production build with all 95 localized pages at C:/Users/Aziz/AppData/Local/Temp/skiresort-community-create-build-9428d88c349f47b28b3fd94af9b99f3e using existing dependencies. Workspace build could not open locked .next/trace (EPERM). Existing outdated Browserslist notice remains. Computer/browser inventory has no enabled surfaces, so rendered desktop/mobile visual comparison and preview refresh remain unverified.

## 2026-10-06 - Community categories and Toast UI follow-up
- User supplied GENERAL/NEWS/REVIEWS/TIPS_GUIDES/QUESTIONS and requested TuiEditor/TViewer for article creation. Verified the current backend enum now exposes exactly these five values; BoardArticleInput still limits title to 3–50 and content to 3–250 characters. Updated frontend BoardArticleCategory and shared community category labels so Create, listing filters/cards, My Page and enum-driven admin selectors use the new contract. No backend modifications or old-category aliases.
- Extracted reusable ArticleContentEditor from existing Teditor.tsx and reused it in both the legacy My Page editor and new Create page. Create loads it client-side via Next dynamic, uses the Toast UI WYSIWYG/Markdown toolbar, saves getHTML() output through the existing mutation, validates blank HTML and serialized HTML length, and disables editor interaction while publishing. Kept the one-cover-image upload workflow; Create's inline-image hook is disabled because its separate cover picker supplies articleImage. The My Page editor retains its existing inline-image upload hook.
- Added Preview post/Hide preview using the existing TViewer component. Typed TViewer props and ref, update its content through setMarkdown whenever the HTML changes, and use Toast UI's standard rendering/sanitization instead of legacy untyped custom raw-HTML renderers. The detail page already uses the same TViewer. Styled the Toast UI container/toolbar and preview to fit the supplied design; added en/kr/ru categories/editor/preview translations.
- Changed this follow-up: libs/enums/board-article.enum.ts; libs/components/community/CommunityPost.tsx, CreatePost.tsx, Teditor.tsx, TViewer.tsx; scss/community-create.scss; en/kr/ru common.json; scripts/check-community-create.cjs and check-community-directory.cjs; memory.md. No dependencies, auth/Apollo infrastructure changes, commits or live writes.
- PASS: TypeScript; lint (only existing unrelated About/admin warnings); all 51 GraphQL documents against actual backend schema; mounted fixture regressions with mocked Toast UI primitives but real shared editor/viewer wrappers for exact five categories, HTML publication, live preview updates, blank/oversized HTML rejection, prior authenticated upload/retry/duplicate/login flows; Community listing regression; whitespace and scoped obsolete category audit. Isolated production build passed all 95 localized pages in the existing Temp build copy. Browser visual review remains unavailable; no real article publication or image upload was performed. This entry supersedes the previous four-category/Markdown-text description.

## 2026-10-06 - Community detail from supplied design and backend
- Read AGENTS.md, SKILLS.md, frontend-migration skill, backend docs/ai handoffs and current BoardArticle/Comment resolvers, services, DTOs and enums. Inspected existing Community detail, shared ResourceComments, TViewer, listing, auth routes and AppLayout. Used code.html, DESIGN.md and visually inspected screen.png; reference files and Stitch were not changed.
- Rebuilt /community/detail with centered alpine article layout, breadcrumbs/category navigation, actual author/avatar/date/views/likes, optional backend cover with image fallback, existing client-side Toast UI content viewer, active like state/count, owner post menu and edit route. Owner deletion sends updateBoardArticle with DELETE and returns to Community. Guest likes show login guidance; query validation/loading/error/retry remain intact. No fabricated sample content or unsupported fields.
- Added optional community presentation to ResourceComments: composer above results, signed-in identity, guest login/referrer link, actual active comment total, avatars, owner edit/delete and existing admin delete capability. Preserved other callers' default presentation. Added synchronous mutation locks, focused editing, first-page refetch after submission and last-page correction after deletion. ARTICLE comment totals use getComments metaCounter because the backend does not decrement articleComments on owner status deletion.
- Changed this task: pages/community/detail.tsx; libs/components/common/ResourceComments.tsx; new scss/community-detail.scss and snowkr.scss import; en/kr/ru detail translations; new scripts/check-community-detail.cjs; memory.md. Preserved existing staged/unstaged work. No dependencies, backend/auth/Apollo infrastructure changes, commits or live writes.
- PASS: TypeScript; lint with existing unrelated About/admin warnings only; all 51 GraphQL documents against the backend-generated schema; mounted Community detail fixture checks for exact query/category/cover, guest and owner permissions, like duplicate lock, comment create/edit/delete and failure retry, active totals despite stale persisted counter, owner article delete, retry and invalid IDs; existing Community directory/Create and Equipment detail regressions; git diff --check and scoped legacy-term audit.
- PASS: final isolated production build with all 95 localized pages in C:/Users/Aziz/AppData/Local/Temp/skiresort-community-create-build-9428d88c349f47b28b3fd94af9b99f3e using existing dependencies. Browser/app inventory is empty, so rendered desktop/mobile comparison remains unverified. Tests used fixtures; no real articles/comments/likes were created or deleted.

## 2026-10-06 - Community detail like visibility and comment placement
- Fixed the white like-button overlay: the prior span:last-child selector accidentally styled MUI's full-button TouchRipple span as the white count badge. Added explicit detail-like-count class and scoped badge styles; kept readable disabled-state colors. Changed pages/community/detail.tsx and scss/community-detail.scss only for this visual fix.
- Confirmed published comments render below the comment composer, as requested; added a DOM-order assertion to the existing Community detail regression script. Existing backend submission/refetch and ordering remain intact.
- PASS: TypeScript, Community detail mounted fixtures including post-input comment order, lint (existing unrelated About/admin warnings only), compiled CSS contrast/ripple-isolation check, and isolated production build with 95 localized pages. No backend changes or live mutations. Browser visual verification remains unavailable from the last empty browser inventory.

## 2026-10-06 - Correct Community comment order
- User clarified that comments must appear above the comment input. Moved the Community composer after comment results and pagination in ResourceComments; other callers retain their existing order. Updated the mounted Community detail DOM-order assertion to require comments before the composer. This supersedes the preceding below-input requirement.
- PASS: Community detail fixtures, TypeScript and lint (existing unrelated warnings only). No backend behavior changes or live mutations.
- PASS: isolated production build, all 95 localized pages.

## 2026-10-06 - Community comment card inset
- Added 20px left/right inset to Community comment cards: avatar left offset is now 20px, with text/actions padding-left 72px to retain their gap from the avatar. Changed scss/community-detail.scss only; backend and comment ordering unchanged.
- PASS: SCSS compilation and scoped whitespace check. No new tests for this small styling adjustment.

## 2026-10-06 - Homepage article covers
- Fixed both From the Community and Latest winter news through shared CommunityBoards: render the queried backend articleImage using homeImageUrl, link covers to article details, lazy-load with article-title alt text, and use existing winter-1.jpg for missing/broken images. Added responsive 16:9 cover styling in homepage-refresh.scss.
- Inspected frontend-migration skill, backend docs/ai handoffs, nullable BoardArticle.articleImage DTO and existing GET_BOARD_ARTICLES selection. No contract, dependency or query/filter changes.
- PASS: TypeScript, lint (existing unrelated About/admin warnings), git diff --check. Production build reached optimization but failed on filesystem EPERM opening .next/trace; full build and browser visual verification remain unverified. No commits.

## 2026-10-06 - Admin Members from Stitch and backend contracts
- Read AGENTS.md, SKILLS.md, frontend-migration/member-instructor-ui skills, backend docs/ai migration/decisions/completed tasks/next steps and actual Member DTO/enums/resolver/service/sort allowlist. Inspected the legacy admin users page/table, shared admin guard/layout and existing Apollo documents. Preserved the prior homepage changes and deleted design references.
- Used connected Stitch project 531088098807301001, Members Management screen 9570fcbc72e3430fbf23c6908dd174b0. Downloaded HTML and screenshot to Temp; screenshot contains only the header, so HTML supplied the main content reference. Built responsive summary cards, status tabs, filter toolbar, member identity/contact/role/status/moderation/date table, pagination, current-page CSV export, and detail/editor drawer within the existing admin layout.
- Backend integration reuses getAllMembersByAdmin/updateMemberByAdmin. Summary query aliases count-only admin inquiries for all/ACTIVE/INSTRUCTOR/BLOCK totals. Search is nickname only with regex metacharacters escaped. Filters compose and reset page; sorts are the actual allowed createdAt/updatedAt/memberLikes/memberViews values. No name/warning sorts, email/last-session/certificate/bookings fields, fake statistics, invite/warning mutations, or claim of session termination/block-counter increments. CSV exports only the displayed page and escapes quotes/formula prefixes.
- Profile edits send supported fields; nickname 3-12/full-name 3-100 validation, role-change and ACTIVE/BLOCK/DELETE confirmation, duplicate lock, errors/retry and list/summary refresh. Instructor role cannot be assigned or reassigned through generic edits; link uses existing applications. Archived means DELETE status; no permanent member removal. Empty existing full name remains optional; previously populated names cannot silently be cleared because backend requires at least three characters.
- Changed: pages/_admin/users/index.tsx; new libs/components/admin/users/AdminMembers.tsx; removed unused obsolete MemberList.tsx; apollo/admin/query.ts summary document; scss/admin-members.scss and snowkr.scss import; en/kr/ru common.json translations; scripts/check-admin-members.cjs; memory.md. No dependencies, backend/auth/Apollo infrastructure changes, commits or live account writes.
- PASS: TypeScript; lint with only existing About/admin-community warnings; all 52 documents validate against generated backend schema; mounted real-Apollo fixtures for actual totals, literal nickname search, composed status filters/page reset, pagination, confirmation before mutation, update failure/retry, duplicate lock, edit validation, empty/error/retry and CSV escaping; whitespace and scoped legacy-term checks.
- PASS: isolated production build with all 95 localized pages in C:/Users/Aziz/AppData/Local/Temp/skiresort-admin-members-build-fb16e028033043f8aeef445cbf4e5c93. Workspace build hit existing locked .next/trace EPERM. Rendered browser visual comparison and live authenticated backend smoke test remain unverified; fixture tests perform no real mutations. Shared public/admin navigation stays as the existing layout, rather than migrating unrelated admin pages.

## 2026-10-06 - Admin Members image review and shell correction
- Reviewed restored code.html, DESIGN.md and visually inspected the supplied screen.png. The image shows a full-width admin shell, unlike the prior page embedded in public AppLayout. Rechecked project migration skills, backend docs/ai and current Member list/update/filter/sort contracts. Reference files and previous homepage changes were preserved.
- Added opt-in membersDesign presentation to existing withAdminLayout; its existing session readiness/ADMIN guard and redirect remain intact. Only /_admin/users opts in. New AdminMembersShell uses the reference fixed 64px header/240px sidebar, pale alpine canvas, real logged-in administrator avatar/name, existing admin routes, working page jump search/public-site link and existing logOut. Mobile navigation collapses behind a toggle/backdrop. Other admin pages retain their original layout. No invented notification count, API uptime, unsupported Orders/Settings routes or fake account/email.
- Matched white summary cards, status count badges (including a new count-only DELETE alias), compact search/role/status/sort strip, checkbox selection, larger nickname/full-name rows, blue active status dots, restricted row tint, short badges and three-dot member details control. Added select-all/current-page selection with selected CSV export; filter/page changes clear selection. Backend list/profile/USER-ADMIN role/status operations and confirmation/error/duplicate protection remain connected. Actual nickname-only search and allowed sorts are used. Add Member is shown disabled with unavailable-yet guidance because no admin invite/create operation exists; no fake creation/warning actions or unsupported statistics.
- Changed this review: LayoutAdmin.tsx, pages/_admin/users/index.tsx, new AdminMembersShell.tsx, AdminMembers.tsx, admin-members.scss, MEMBER_SUMMARY in apollo/admin/query.ts, en/kr/ru translations, check-admin-members.cjs, memory.md. No new dependencies, backend changes, auth/Apollo infrastructure rewrites, commits or live writes.
- PASS: TypeScript, lint (existing About/admin-community warnings only), all 52 GraphQL documents against actual generated backend schema, mounted real-Apollo member fixtures plus archived count/selection checks and admin-shell readiness/role redirects/current navigation/mobile toggle/page jump/existing logout/unchanged other-admin-layout checks, git diff --check and scoped legacy-term audit.
- Computer-use inventory returned no enabled apps or browsers. Rendered browser comparison and live authenticated backend smoke test remain unverified. All data mutation tests used fixtures. Isolated production build verification uses existing Temp workspace because the active project .next output is locked.
- PASS: final isolated production build compiled and generated all 95 localized pages, including /_admin/users. Existing Browserslist notice remains.

## 2026-10-06 - Inline Admin Members role/status controls
- Made table role/status Chips accessible buttons opening anchored MUI menus. Current values are disabled. USER/ADMIN role changes and ACTIVE/BLOCK/DELETE status changes reuse the existing confirmation, typed updateMemberByAdmin mutation, duplicate lock, errors/retry and list/summary refresh. Table-origin changes retain table context instead of opening the member drawer. Instructor role badges expose existing application guidance/link; backend forbids generic promotion/reassignment.
- Changed AdminMembers.tsx and check-admin-members.cjs; reused existing translations, styles and backend contracts. Added fixture checks for table role confirmation/cancel, exact role/status mutation inputs, current-value disabling, Instructor restrictions and no automatic drawer opening. Corrected fixture drawer-close targeting to avoid the success Alert's identically labelled close button, and supplied MUI anchor bounds.
- PASS: TypeScript, lint (existing About/admin-community warnings), mounted Admin Members/backend fixtures and shell checks, whitespace/encoding audit, isolated production build with all 95 localized pages. No backend/auth changes, dependencies, commits or live member mutations. Browser visual verification remains unavailable.

## 2026-10-06 - Admin header profile link
- Wrapped admin header avatar/name/nickname in the existing Next Link to /mypage. Kept View Public Site separate and preserved the compact mobile profile layout. Changed AdminMembersShell.tsx, admin-members.scss and added href verification to the existing member fixture.
- PASS: TypeScript and Admin Members/shell regression fixtures. No backend/auth changes or live writes.
- PASS: lint with existing unrelated warnings and isolated production build (95 localized pages).

## 2026-10-06 - Admin Resort list and create from supplied designs
- Read AGENTS.md, SKILLS.md, frontend-migration/resort-ui skills, backend docs/ai migration/decisions/completed tasks/next steps/Resort handoff, actual Resort DTOs/enums/resolver/service and authenticated image-upload contracts. Reviewed code.html, DESIGN.md, code2.html, DESIGN2.md and both screenshots visually. Reference artifacts unchanged.
- Replaced the legacy admin Resort table with the supplied alpine card-grid presentation at /_admin/resort. Reused the existing protected admin shell; nested Resort create navigation now remains active and page title reflects Resorts. Added real all/ACTIVE/DELETE count aliases, current-page average pricing, title search, backend location/level/status/sort filters, page-size/pagination, photo switching, public-detail links, existing edit dialog, current-page CSV with quote/formula escaping, and confirmed DELETE-status archive/ACTIVE restoration. Permanent deletion is not attached to the design's archive action.
- Added /_admin/resort/create with six design sections, actual enum facilities, JPG/PNG authenticated upload through existing uploadImages, size/type validation, removable photos/cover ordering, live card preview and createResort mutation. Exact backend rules: trimmed required title/address, finite nonnegative price, integer minimum days >=2, optional level/description and empty images allowed. Backend initializes ACTIVE; no invented DRAFT status, 1-day policy, WebP support, unknown facilities or unsupported global average/season trend. Search is explicitly title-only. Upload/mutation locks prevent duplicate submissions and save waits for upload; failures retain values and uploaded paths for retry. Success returns to list without submitting a second creation if navigation fails.
- Added English/Korean/Russian strings. Changed pages/_admin/resort/index.tsx and new create.tsx; new AdminResorts.tsx/AdminResortCreate.tsx; AdminMembersShell.tsx; apollo/admin/query.ts; new admin-resorts.scss plus snowkr.scss import; locale common.json files; new check-admin-resorts.cjs; memory.md. Existing CatalogEditor reused for editing. No new dependencies, auth/Apollo infrastructure rewrites, backend changes, commits or live mutations.
- PASS: TypeScript, lint (only existing unrelated About/admin-community warnings), all 53 GraphQL documents against actual generated backend schema, mounted Resort fixtures for filters/photo navigation/archive confirmation/exact update, live create preview/minimum-day validation/upload formats and target/failure retry/exact create inputs/duplicate lock/redirect; existing Admin Members/shell fixtures; git diff --check and scoped legacy reference audit. Fixtures mock hook/transport responses; they do not prove a live authenticated database integration.
- Initial isolated production build passed all 98 localized pages including Resort create. Final build reruns with new locale text and CSS compatibility adjustment. Browser-rendered desktop/mobile comparison and live authenticated backend smoke test remain unverified.
- PASS: final isolated production build with translations/CSS correction generated all 98 localized pages in C:/Users/Aziz/AppData/Local/Temp/skiresort-admin-resorts-build-d4a10b89e4c74527a2a095b5f04cb8ec. Existing unrelated lint warnings and Browserslist notice remain.

## 2026-10-06 - Resort minimum booking changed to one day
- Verified current backend ResortInput/ResortUpdate DTO minimum is 1 and creation default is 1; Mongoose also uses default/minimum 1. Reused resort-ui skill and preserved existing admin implementation.
- Updated AdminResortCreate default, numeric validation/input minimum, decrement boundary and preview fallback from 2 to 1. Updated existing CatalogEditor default/input minimum to allow one-day edits. Updated English/Korean/Russian guidance. Resort fixtures now reject zero and submit resortMinDays: 1, retaining the existing retry/duplicate-lock assertions; existing two-day resort fixture stays valid.
- No backend changes, new dependencies, commits or live mutations. This supersedes the two-day rule documented in the preceding admin Resort entry. TypeScript/lint/fixture and isolated production build checks are running.
- PASS: TypeScript, mounted admin Resort fixtures including zero-day rejection/one-day mutation, lint (existing unrelated warnings only), git diff --check and isolated production build (98 localized pages). No live backend writes.

## 2026-10-06 - Route Resort editing to shared create/update page
- Reused resort-ui skill and rechecked current ResortUpdate DTO/admin resolver/service contracts. Edit Resort now routes to /_admin/resort/create?id=<resort ID> instead of opening CatalogEditor. Add Resort retains the ID-free create route.
- AdminResortCreate now chooses create/update from the router ID after router readiness; validates IDs, loads the exact existing resort, and prefills content, facilities, photos, price, minimum days and status. Heading/breadcrumb/top and bottom actions change to Update Resort. Updates send updateResortByAdmin with _id and supported content/status fields; ID-free mode still uses createResort without status/ownership fields. Existing upload, cover selection, error retry and submit locks remain; successful update returns to Resort list. Editing archived resorts works and preserves status unless explicitly changed.
- Backend has no admin single-ID detail query or ID inquiry filter. The loader uses the existing authenticated getAllResortsByAdmin query in 100-record pages and exact ID matching, stopping when found/end/error. This avoids the public getResort query's visibility restrictions and view-count side effect. Larger catalogs may require multiple reads; no backend contract was invented or changed. Invalid/missing/error/loading states never render an empty create form for an edit URL; query failure exposes retry. Route-ID changes remount the form to avoid stale prior-resort fields.
- Changed this follow-up: AdminResorts.tsx, AdminResortCreate.tsx, en/kr/ru common.json, check-admin-resorts.cjs, memory.md. Existing CatalogEditor remains for its other callers. No dependencies, auth/Apollo infrastructure changes, backend changes, commits or live mutations.
- PASS: TypeScript, lint (existing unrelated warnings only), expanded mounted fixtures for edit route/ID, create behavior, existing/archived prefill, second-page ID lookup, update label/status/photo preservation, one-day update, exact update mutation, failure/retry, invalid/missing/error/loading states and return to create mode; git diff --check. Isolated production build running. Browser comparison and live authenticated database writes remain unverified.
- PASS: final isolated production build generated all 98 localized pages, including the shared Resort create/update route.

## 2026-10-06 - Admin Equipment list, create, and shared update page
- Read AGENTS.md, SKILLS.md, local equipment-ui/frontend-migration skills, backend docs/ai Equipment handoff and migration/decision/completion/next-step context, current Equipment DTOs/enums/resolver/service, existing catalog editor/upload helper and Resort create/update flow. Reviewed supplied code.html, DESIGN.md, screen.png, code2.html, DESIGN2.md and screen2.png. Supplied design artifacts and pre-existing Resort work preserved.
- Replaced /_admin/equipment's generic table with the alpine equipment card grid in the existing protected admin shell. Added backend title/category/audience/size/status/resort filters, supported sorting, pagination, photo controls, public detail links for AVAILABLE items, current-page CSV export, real status/purchase count aliases, and confirmed DELETE-status archive/AVAILABLE restoration. Low-stock total scans minimal stock fields in 100-record pages across the entire catalog, excluding DELETE; refreshes after status writes and exposes retry/error state. This read is not a transaction snapshot during concurrent inventory edits.
- Added /_admin/equipment/create; ID-free mode creates equipment and ?id= mode follows Resort's exact-ID admin paginated loader, prefills every editable field, supports archived records, updates through updateEquipmentByAdmin and returns to Equipment. Invalid/missing/loading/error IDs never render an empty create form. Preserves unchanged resort associations by omitting resortId on edit unless changed, avoiding revalidation of a historical association. Includes configurable unique whole-hour rental tiers, stock bounds, purchase toggle with nullable price clearing, optional brand/size/description/resort, authenticated JPG/PNG upload to equipment, first-image cover/reorder/remove, live card preview, inline failure/retry and duplicate-save/upload locks.
- Used actual backend enums SKI/SNOWBOARD/HELMET and MAINTENANCE, rather than unsupported reference enum values. Backend only exposes AVAILABLE publicly; quantity zero does not automatically change status. Uses shortest-duration configured rental package as the card base rate, with no invented daily price or availability calculation. Reference WebP/15 MB upload text adapted to supported JPG/PNG and existing 10 MB client validation. No booking/payment or backend changes.
- Changed files: libs/components/admin/AdminEquipment.tsx, AdminEquipmentCreate.tsx; pages/_admin/equipment/index.tsx, create.tsx; apollo/admin/query.ts; scss/admin-equipment.scss and its snowkr.scss import; protected shell page title in libs/components/admin/users/AdminMembersShell.tsx; public/img/icons/equipment-placeholder.svg; English/Korean/Russian common.json additions; scripts/check-admin-equipment.cjs; memory.md. No packages, commits, auth/Apollo infrastructure rewrites, or live catalog mutations.
- PASS: TypeScript noEmit/incremental false; lint with only existing About img/admin Community hook warnings; mounted equipment fixtures for filters/photo controls/archive/restore, multi-page global stock and archived exclusion, create input validation, zero purchase price, purchase disable/null, upload MIME handling, failure/retry, duplicate submission, exact update payload and preservation, second-page ID lookup, and invalid/missing/error/loading cases; existing mounted Resort regression fixtures; scoped patch whitespace check. Whole-workspace diff check still reports pre-existing trailing whitespace in supplied code2.html, left untouched.
- Isolated production build compiled and generated all 101 localized pages under .next/equipment-verify; final optimization pending at this entry. Initial temporary build-launch issues (inline worker restart, Windows path normalization, output override in webpack worker) were resolved in Temp scripts without changing project config. No connected browser surface was available; live browser visual comparison and authenticated backend smoke tests remain unverified. Resort display names use the existing first-100 admin lookup with ID fallback, and ResortSelect retains its existing server-search behavior.
- PASS: final isolated production build completed successfully with all 101 localized pages, including Equipment list and create/update routes. Final equipment source encoding and AST no-any audit passed.

## 2026-10-06 - Equipment enum dropdown submission repair
- Fixed category and audience options in AdminEquipmentCreate.tsx to use explicit backend enum values while retaining translated labels. Previously selecting translated Snowboard submitted Snowboard instead of SNOWBOARD and failed GraphQL enum coercion. The shared create/update form is covered; backend contracts remain unchanged.
- Expanded scripts/check-admin-equipment.cjs with translated Snowboard/Adults labels, real option-value checks and exact SNOWBOARD/ADULTS mutation assertions. Mounted Equipment fixtures passed; scoped Next lint passed with the existing no-img-element warning; scoped patch whitespace passed. TypeScript validation result follows. No live catalog writes, deployment or unrelated edits.
- PASS: frontend TypeScript noEmit/incremental false. Full production build and live browser/backend creation were not run for this focused dropdown repair.

## 2026-10-06 - Admin Equipment Stitch design review
- Reviewed AGENTS.md, SKILLS.md, equipment-ui/frontend-migration skills, backend docs/ai and Equipment resolver/input/update contracts. Local code.html/screen.png currently depict Instructor Applications; used connected Stitch screen projects/531088098807301001/screens/307fe0eedf7d48cd80bf42ad89535cdc (SNOWKR Admin - Equipment Management) and DESIGN.md for the requested Equipment design.
- Refined existing AdminEquipment.tsx/scss/admin-equipment.scss with summary icons, low-stock emphasis, export styling, resort/engagement icons, rental/purchase presentation, translated readable sort labels, keyboard focus indicators, responsive heading layout and archive/restore button styling. Fixed photo-dot centering and deterministic KRW formatting. Preserved existing working-tree changes and Apollo/auth infrastructure; no packages or commits.
- Confirmed existing getAllEquipmentsByAdmin/createEquipment/updateEquipmentByAdmin operations, backend filters/sorts and AVAILABLE/MAINTENANCE/DELETE statuses. Archive/restore retains records; pricing uses configured hour packages without invented daily rates. Existing create/edit form, uploads, pagination, global summaries and stock scan remain connected through Apollo.
- PASS: mounted Equipment regression suite (filters, photos, archive/restore, create/update validation, upload behavior, submission lock, paginated edit lookup and errors); TypeScript noEmit/incremental false; full lint with two existing warnings in About and admin Community. Production build compiled successfully; final page generation result follows.
- Browser visual verification and authenticated live backend smoke testing remain unverified: CUA reports no enabled browser surfaces. Resort title lookup retains first-100 lookup with ID fallback; CSV exports the current page. No backend edits or live catalog writes.
- PASS: isolated production build completed successfully, generating all 101 localized pages including Equipment list and create/update routes. Final standalone Equipment Sass compilation and UTF-8 currency encoding checks passed.

## 2026-10-06 - Admin Instructor Application review design
- Read AGENTS.md, SKILLS.md and member-instructor-ui skill; inspected local code.html, DESIGN.md, screen.png, backend docs/ai handoff/decisions/completed tasks/next steps and Instructor Application resolver/DTOs/enums. Preserved existing working-tree changes.
- Rebuilt InstructorApplications.tsx with Alpine summary cards, live status counts, validated exact Member ID filter, latest/oldest sorting, paginated winter cards and responsive right-side details drawer. Activated existing AdminMembersShell on its route; added isolated application-summary GraphQL and scoped Sass import.
- Kept existing ADMIN Apollo queries/mutations. Added explicit approval confirmation, required trimmed rejection reason, pending-only review actions, synchronous duplicate-submit guard, conflict feedback and list/detail/summary refreshes. Page clamps after results shrink.
- Backend applications exclude pricing, certificates and joined applicant/resort identity; displayed application snapshots and ID fallbacks, with a pricing-unavailable message. No invented prices, email, photos, certifications, policy settings or backend changes. Winter card cover is decorative shared imagery.
- PASS: mounted regression checks in scripts/check-admin-instructor-applications.cjs for confirmation, exact mutation inputs, empty rejection guard, trimmed reason, error/retry feedback, refreshes and reviewed-state actions. TypeScript noEmit/incremental false passed. Full lint passed with existing About image and Community hook warnings. Production build succeeded with all 101 localized pages. Duplicate-submit guard was finalized after build and verified by regression execution.
- Browser visual QA and authenticated live backend smoke testing remain unverified. No packages, commits or deployment. Files: InstructorApplications.tsx, apollo/admin/instructorApplication.ts, instructor-applications route, scss/admin-instructor-applications.scss, scss/snowkr.scss import, regression script and this memory entry. No legacy real-estate references remain in the changed application component.

## 2026-10-06 - Admin Community design and backend integration
- Read AGENTS.md, SKILLS.md and frontend-migration skill; inspected backend docs/ai completion/decisions/migration/next steps, current BoardArticle DTOs/enums/resolver/service and existing frontend list/create/detail flows. Reviewed supplied code2.html, DESIGN2.md and screen2.png visually. Preserved supplied references and pre-existing work.
- Replaced /_admin/community's legacy table with the Alpine card grid and existing protected AdminMembersShell: breadcrumb/actions, four summary cards, status tabs, complete title/author search, actual categories, newest/oldest/views/likes sorting, four-card pagination, single backend cover image or text-only card, author/date/IDs, engagement counters, deleted styling, responsive filters/cards, details drawer and active-post edit dialog. Create Post reuses the existing /community/create flow with its validated editor/upload behavior. Shell title now recognizes Community.
- New minimal AdminCommunityArticles query selects articleComments and public author identity without credentials/contact fields. Loads existing getAllBoardArticlesByAdmin in 100-record batches; publishes results only after successful complete loading, cancels stale loaders, de-duplicates IDs and handles failure/retry. Search, summaries and CSV cover all loaded records, not only the displayed page. Filters/pagination/sorting are local because the admin API has no text/author search or sum aggregate. Full-catalog reads may be costly at scale and are not a transaction snapshot during concurrent changes; the backend aggregation also unwinds existing authors.
- Editing sends only _id/articleTitle/articleContent to updateBoardArticleByAdmin, preserves category/image/author, follows backend 3-50 title/3-250 content bounds, retains values on failure and locks duplicate submissions. Delete requires explicit confirmation and sends DELETE status; does not permanently remove records. Backend admin update only matches ACTIVE records, so restoration is unavailable; reference Restore Post is disabled with explanation and deleted details remain inspectable. No backend changes or invented restoration contract. Summary comments use stored articleComments; backend deletion can leave counters including deleted comments, disclosed on the screen.
- CSV exports all filtered posts with quoting, UTF-8 BOM and spreadsheet formula escaping. No fabricated sample posts, trend figures, resort/board associations, multiple photos, system-health values or moderation audit history.
- Files: new apollo/admin/community.ts; libs/components/admin/community/AdminCommunity.tsx and communityCatalog.ts; pages/_admin/community/index.tsx; new scss/admin-community.scss and snowkr.scss import; existing AdminMembersShell title; en/kr/ru common.json; new scripts/check-admin-community.cjs; extended scripts/check-graphql-documents.cjs to include the new document; memory.md. Existing unused CommunityArticleList remains untouched. No packages, auth/Apollo infrastructure rewrites, commits, deployment or live data writes.
- PASS: mounted community regression for multi-batch full search/counts, category/status filters, sort/reset/empty state, deleted details/disabled restore, edit length validation/failure/retry/exact payload, duplicate-submit lock, confirmed soft-delete/exact payload/refresh, read failure/retry, stale-loader cancellation and CSV escaping. Existing Community Create regression passed including exact creation/upload/validation/retry behavior. All 56 selected frontend GraphQL documents validate against generated actual backend schema.
- PASS: Next lint (only existing About image warning; obsolete admin Community hook warning removed). Production build passed TypeScript and compilation and generated all 101 localized pages under .next/admin-community-verify; final optimization result follows. Scoped git diff --check passed. No legacy real-estate references or added any types in new community code.
- Browser visual QA and live authenticated database integration remain unverified: connected CUA inventory returned no browser/app surfaces. The implementation uses existing Apollo transport; fixtures mock requests and do not prove live integration.
- PASS: final isolated production build completed successfully with all 101 localized pages, including /_admin/community. TypeScript validation, page optimization and build traces completed.

## 2026-10-06 - My Page profile dashboard
- Read AGENTS.md, SKILLS.md and local frontend-migration/member-instructor-ui skills. Reviewed supplied code2.html, DESIGN2.md and screen2.png, backend docs/ai completion/decisions/migration/next steps/frontend handoff, actual Member update/read contracts, Instructor Application resolver/input and Comment inquiry/service. Preserved existing work and design references.
- Rebuilt /mypage using the Alpine dashboard reference: real member identity/role/joined date, sticky account navigation, five live summary cards, instructor invitation, winter activity links, honest booking unavailable panel, profile form, followers/followings cards, saved Resort/Equipment catalog, two-column article cards, comments availability explanation and role-gated instructor workflow. Existing public layout/header/footer and category deep links are preserved; overview is now the default. Added responsive layouts and English/Korean/Russian labels.
- Added GET_MY_PAGE_SUMMARY through existing Apollo transport: authenticated member ID, own follow totals, both favorite totals, authored article total and stored member comment counter. getMember is the existing public read and retains its backend view-recording behavior. My Page explicitly fixes social lists to the authenticated member even if memberId appears in the URL; public member browsing retains existing behavior. Article deletion refreshes summary. No demo role switching or fabricated trends/data.
- Reworked MyProfile with design-matched editable fields, removable preview, JPG/PNG and 5 MB checks, upload failure handling, exact backend profile field payload, nickname/full-name bounds, optional full-name null clearing, synchronous upload/save lock and existing refreshed JWT storage/session update. Added InstructorWorkflow submit lock and hides submission form while its status query fails/loads; retains PENDING/APPROVED blocking and dedicated instructor update contract.
- Backend has no Booking API or member-authored comment-history query (getComments requires a target ID). Those design panels disclose current availability. No invented email field, booking confirmation, instructor favorites, application prices/certificates or role changes. Weekly prices remain available only in the existing approved Instructor profile workflow.
- Files: pages/mypage/index.tsx; new apollo/user/mypage.ts; MyProfile.tsx, MyArticles.tsx, InstructorWorkflow.tsx; minimal ownerId prop in MemberFollows.tsx; new scss/mypage-dashboard.scss and snowkr.scss import; en/kr/ru common.json additions; new scripts/check-mypage.cjs; GraphQL checker includes new summary; memory.md. No packages, backend/auth/Apollo infrastructure edits, commits or live account writes.
- PASS: TypeScript noEmit/incremental false; lint (only existing About image warning after My Page cleanup); all 57 frontend GraphQL documents validate against actual generated backend schema; existing mounted follow fixtures; new mounted My Page fixtures for real summary variables/counts, Korean joined date, own social lists, deep-link navigation, admin gating, unavailable panels, summary failure/retry affordance, application query failure/PENDING submission guards, JPG/PNG validation, exact profile save/upload inputs, error/retry, token persistence and duplicate-submit lock. Scoped whitespace and legacy/any checks pass. UTF-8 source/translation keys checked using Node.
- Isolated production build passed and generated all 101 localized pages. Final icon imports and Sass compatibility refinements are undergoing a second isolated build; completion follows below.
- Browser visual comparison and authenticated live-backend smoke testing remain unverified: CUA inventory contains no connected browser/app surfaces. Mounted fixtures mock transport; contract validation does not prove a live authenticated request. Sources use the existing configured Apollo client. Supplied local references used directly; Stitch modifications were unnecessary.
- PASS: final isolated production build completed successfully after direct icon imports and Sass refinements; all 101 localized pages generated, including /mypage. No new My Page lint or Sass warnings.

## 2026-10-06 - My Page spacing and input repair
- Reviewed supplied screenshots of compressed profile inputs, excessive follow-list spacing/overlapping follow cards and uneven instructor fields. Reused member-instructor-ui guidance and existing components; no domain/auth/backend changes needed.
- Added My Page-only high-specificity Sass overrides in scss/mypage-dashboard.scss. Restored MUI input content-box sizing within the global border-box layout, 48px minimum outlined controls, matching label positions, multiline padding/automatic textarea height and consistent Autocomplete sizing. Reset Instructor form child margins to use the grid gap; standardized section padding, photo spacing and save-button sizing.
- Overrode legacy #main Member follow rules within account-dashboard: left-aligned title, 24px list gap instead of inherited 85px margin, full-width vertical card layout with separate identity/like/follow controls, fixed avatar sizing and wrapping member names. Preserved public Member pages and all interactions.
- PASS: existing mounted My Page regression suite; final complete snowkr.scss Sass compilation. Production build passed compilation/type/lint and generated all 101 localized pages; final build result follows. Only existing About image lint warning remains. Browser visual verification remains unavailable with no connected browser surface.
- PASS: isolated production build finished successfully, including page optimization/build traces for all 101 localized pages. Final multiline-selector and alignment refinements separately passed complete Sass compilation.

## 2026-10-06 - Admin Instructor Application count, sizing and applicant names
- Reviewed latest screenshots, prior member-instructor-ui guidance, actual application/member DTOs and Member resolver/service. Fixed hard-coded replacement characters in summary cards/status tabs: successful empty metaCounter results display 0, loading/error/missing totals display an ASCII dash.
- Constrained instructor-applications to a centered 1600px maximum width with responsive existing 3/2/1-column grid, minimum-width protection and preserved section padding. Restored Member ID/sort control content-box input sizing, 44px minimum height, internal padding and label positions within admin shell global border-box reset.
- Added minimal ApplicationMember GraphQL query selecting only _id/memberNick/memberFullName/memberType through existing getMember. Cards and details drawer now show real full name (nickname fallback), nickname and current role. cache-first reuses member results across cards/drawer. Member ID remains visible in details; loading/failure/unavailable/deleted members use the existing Applicant + ID suffix fallback. getMember supports ACTIVE/BLOCK records and retains existing view-recording behavior; no full-member-catalog scan, invented application fields, contact/credential selections or backend changes.
- Files: InstructorApplications.tsx, apollo/admin/instructorApplication.ts, scss/admin-instructor-applications.scss, scripts/check-admin-instructor-applications.cjs, GraphQL checker and memory.md. Preserved existing unrelated work; no packages, commits or live review mutations.
- PASS: expanded mounted application fixtures for empty-counter zero, loading dash, no replacement symbols, exact applicant lookup ID, real names/nicknames on cards/drawer, unavailable-member fallback and existing approval/rejection confirmation/inputs/conflict handling/refresh. All 59 frontend GraphQL documents including application summary/identity validate against actual generated backend schema. Build passed lint/typecheck/compilation; final page-generation result follows.
- Browser visual comparison and live authenticated backend requests remain unverified; no connected browser surface is available. Names are current Member data, while application credentials remain immutable application snapshots.
- PASS: isolated production build completed successfully with all 101 localized pages, including /_admin/instructor-applications. Complete stylesheet compilation and scoped whitespace check passed; only the existing About image lint warning remains.

## 2026-10-06 - Admin Instructor Application search by name
- Replaced the exact Member ID field with translated Instructor name / Search by full name or nickname labels. Search now matches trimmed, case-insensitive full names and nicknames, including @nickname input; member IDs remain available only in details.
- Actual application inquiry supports status/memberId but no name filter; admin Member search supports nickname only. Added minimal ApplicationSearchMembers (ID/full name/nickname/role only) and applicationSearch.ts to read selected-status application pages in 100-record batches, then admin Member pages until needed applicant identities are found or records end. Names are matched locally across the complete application result before 9-card pagination. Existing server pagination remains for blank searches. No invented backend filters, backend changes, getMember view writes for search lookups, packages or credentials/contact selections.
- Reuses loaded identity data on matching cards/drawer, including admin-readable archived members; retains ordinary existing card lookup when search is blank. Typing additional characters filters the loaded catalog without extra reads. Status/sort changes, retry and review refresh reload search data; stale loaders cancel and partial failures publish no partial matches. Empty search restores normal listing. This frontend fallback can require catalog-wide reads at scale and is not a transaction snapshot under concurrent changes.
- Changed InstructorApplications.tsx; new applicationSearch.ts; apollo/admin/instructorApplication.ts; en/kr/ru common.json labels; expanded scripts/check-admin-instructor-applications.cjs; memory.md. Existing styles, summaries and approval/rejection behavior preserved. No commits or live review actions.
- PASS: mounted fixtures for full-name partial/case/space matching, @nickname, application and member matches beyond backend page 1, no memberId filter, no extra reads while editing query, empty results/clear, read failure/retry, names/counter fallbacks and existing review confirmation/exact payload/error/refresh tests. All 60 selected frontend documents validate against actual generated backend schema. Production build result follows.
- Live authenticated browser verification remains unavailable. Search uses current Member identity data and existing admin Apollo permissions.
- PASS: final isolated production build completed successfully with all 101 localized pages after aligning the search loader with the Apollo hook client type. Typecheck, lint, compilation and optimization passed; only the existing About image lint warning remains. Scoped whitespace and no-any checks passed.

## 2026-10-06 - Public Instructor listing design and backend integration
- Replaced /instructor generic CatalogPage with dedicated libs/components/instructor/InstructorDirectory.tsx and scss/instructor-directory.scss, imported from pages/_app.tsx. Retained AppLayout, navigation, auth and Apollo infrastructure; no backend modifications or dependencies.
- Read AGENTS.md, SKILLS.md, member-instructor-ui/frontend-migration skills and backend migration/decision/completed/next-step docs plus Member DTO/service. code.html and DESIGN.md define hero, search, sidebar, 3-column cards, sort, weekly pricing and pagination. screen.png is invalid: its contents are <FIFE Image failed to fetch>; image comparison is unavailable.
- Uses existing GET_INSTRUCTORS, GET_RESORTS and LIKE_TARGET_MEMBER contracts. Complete 100-record directory batches load before local name/audience/level/language/experience/resort/selected-week-price filtering and 9-card pagination. Server handles newest/views/likes sort; prices/images/counters/resorts come from backend, absent prices remain unlisted. Like actions require session, prevent duplicate clicks, refresh persisted state and report errors. No fabricated instructors/counts/ratings, bookings or favorites contract.
- Local profile filtering is necessary because InstructorSearch supports only nickname text. Complete-directory reads may become expensive at scale; concurrent data changes are not a snapshot. Public resort names resolve only from visible resort catalog. Shared hero winter asset reused. Existing real-estate references are absent in this changed listing scope.
- TypeScript noEmit passed. Lint passed with existing About page image warning only. All 60 frontend GraphQL documents validate against generated backend schema. Production build pending final result. No connected browser surfaces; live authenticated interactions and visual screenshot verification remain unverified. Existing workspace edits preserved; no commit.
- PASS: isolated production build completed with all 101 localized pages, including /instructor. Final typecheck passed; focused lint exposed the image-link passHref warning and it was corrected. Existing .next/trace lock bypassed with the proven Temp build runner and isolated .next/instructor-directory-verify output; project configuration unchanged. The failed initial external output directory was removed. Final experience filter includes exactly 10 years in the 10+ option.

## 2026-10-06 - Instructor language filter order
- Language options now always show Korean, English, Russian and Chinese in that order, followed by any additional instructor languages alphabetically. Existing local profile filtering and backend contracts preserved.
- Changed libs/components/instructor/InstructorDirectory.tsx. Focused lint passed; TypeScript and isolated production build results follow.
- PASS: TypeScript noEmit, focused lint, scoped whitespace check and isolated production build (101 localized pages). Build retains only the existing About image warning.

## 2026-10-06 - Instructor duration filter repair
- Selected 1/2/3/4-week duration now requires a non-null price for that exact duration before showing an instructor, regardless of the budget slider. Valid zero prices remain supported; counts and pagination follow the filtered list.
- Fixed card duration translation by passing count to the existing Weeks key, removing the duplicated count and literal {{count}} placeholder in EN/KR/RU.
- Changed only libs/components/instructor/InstructorDirectory.tsx plus this log. PASS: production-predicate fixtures for all four durations, null/undefined/zero prices, budget boundaries, and label interpolation; TypeScript; focused lint; isolated production build (101 localized pages). Only pre-existing About image warning. No backend changes or commit.

## 2026-10-06 - Instructor detail design and backend integration
- Replaced /instructor/detail generic ResourceDetail with dedicated InstructorDetail.tsx, InstructorPackagePanel.tsx and scoped scss/instructor-detail.scss imported from pages/_app.tsx. Preserved AppLayout, existing routing, auth, Apollo and dependencies. Added EN/KR/RU detail labels and an opt-in instructor presentation variant to ResourceComments; existing community and generic behavior preserved.
- Reviewed AGENTS.md, SKILLS.md, member-instructor-ui/booking-ui/frontend-migration skills, backend docs/ai handoffs and current Member resolver/service/DTO, comment resolver/input/update contracts. Used code.html and DESIGN.md for the portrait hero, tags, profile statistics, information facts, associated resort, comment composer and sticky weekly package sidebar. screen.png contains only <FIFE Image failed to fetch>; no usable reference bitmap. No browser surfaces are connected, so screenshot comparison and live authenticated backend interaction remain unverified.
- Reuses GET_INSTRUCTOR/getMember, GET_RESORT, LIKE_TARGET_MEMBER, SUBSCRIBE/UNSUBSCRIBE and existing MEMBER comment CRUD with owner/admin controls. Guards malformed IDs and inactive/non-instructor profiles, refreshes social state on session changes, blocks repeated social clicks, and presents loading/error/retry plus nullable profile/image/resort fallbacks. Heart means backend Member like, not an invented Instructor favorites API.
- Package card reads exact nullable instructorPrice1Week through instructorPrice4Weeks, supports zero prices, disables unconfigured packages, validates a nonpast Korea start date and shows a frontend week/end-date preview. Add to Cart uses the existing local demo cart with no quantity/pricing formula invented for backend booking. Booking, availability and payment operations remain unimplemented in backend; explicit demo notice retained. No backend edits, new packages or commits.
- Added scripts/check-instructor-detail.cjs: mounted Apollo fixtures cover exact detail/resort/comment payloads, resort link and image fallback, login refresh, persisted like/follow state, comment create/edit/delete, zero/missing package prices, selected-week demo cart lines, malformed IDs, hidden profiles, error/retry and nullable fields.
- PASS: TypeScript noEmit, full lint (existing About image warning only), focused detail/component lint (zero warnings), all 60 frontend GraphQL documents against generated backend schema, mounted instructor fixtures, scoped whitespace checks and isolated production build (all 101 localized pages). Temp verification runner uses normalized Windows root and .next/instructor-detail-verify to avoid existing development trace locks; project configuration unchanged. Existing staged/unstaged user work preserved.

## 2026-10-06 - Instructor comment order adjustment
- User requested posted comments above the comment input. Moved the instructor composer after the comment list and pagination in libs/components/common/ResourceComments.tsx; existing community/generic order and backend operations preserved.
- PASS: TypeScript noEmit, focused lint, existing mounted instructor interaction fixtures and scoped whitespace check. Isolated production build generated all 101 pages; final build completion follows.
- PASS: isolated production build completed successfully for all 101 localized pages. Only the pre-existing About image lint warning remains.

## 2026-10-06 - Instructor comment identity layout
- User requested name/date next to the avatar, rather than below. Updated only scoped instructor-detail.scss: comment cards use a 32px avatar column with name/date beside it; comment text and action controls span the card below. Comment list remains above the composer. Backend and shared comment markup unchanged.
- TypeScript noEmit and full lint passed (existing About image warning only). Isolated production build pending completion.
- PASS: isolated production build completed successfully for all 101 localized pages; scoped whitespace check passed.

## 2026-10-06 - Instructor comment text spacing
- Added 16px top margin above posted comment text in scoped scss/instructor-detail.scss. Avatar/name/date header and composer order preserved. No backend or component logic changes.
- Scoped whitespace check passed; TypeScript and isolated production build/lint checks initiated.
- PASS: TypeScript noEmit and isolated production build (101 localized pages), including lint. Only existing About image warning remains.

## 2026-10-06 - Event page design and backend CRUD
- Read AGENTS.md, SKILLS.md and frontend-migration skill, supplied code.html/DESIGN.md and valid screen.png. Inspected backend docs/ai Event handoff, decisions/completed/migration/next steps and Event resolver/service/DTOs. Replaced /events demo placeholder with responsive hero, search, location filter, upcoming/past tabs, two-column cards, pagination and details dialog using existing AppLayout/Apollo/auth/MUI.
- New apollo/events.ts implements all eight actual Event operations; libs/types/event.ts provides typed models and Korea-time/file validation. Public reads use published-only operations; current ACTIVE ADMIN sessions can toggle Manage events, browse drafts/published, create/edit/publish/upload/delete with confirmation and reload after conflict. Dedicated upload mutation carries Apollo-Require-Preflight, validates 1–5 PNG/JPEG images and 15,000,000 bytes/file, preserves uploaded paths after save failure and supports per-image removal. Optional location/resort clear via null; immutable creator omitted from input. Server enforces permissions and file/resort validation.
- Added EventPage.tsx, EventEditor.tsx, scoped scss/events.scss, /events routing and _app stylesheet import; EN/KR/RU labels; scripts/check-events.cjs and Event schema/doc inclusion in check-graphql-documents.cjs. No packages/backend edits/commits; existing user code.html and screen.png edits preserved.
- Backend has no Event categories, likes/views, booking or registration; corresponding fabricated design controls/counters omitted. Text search uses actual title/description filter. Complete 100-record batches load before local end-date and location filtering and six-card pagination; ongoing events count with upcoming until end. This may be expensive for large catalogs and is not a transactional snapshot. Dates display/input explicitly in Asia/Seoul. Homepage Event preview and help demo copy remain outside this page scope.
- PASS: TypeScript noEmit/incremental false; full lint (only pre-existing About image warning); all 68 frontend GraphQL documents validate against generated local backend schema; mounted mocked-Apollo fixtures for published/admin operation selection, complete 101-record reads/pagination, empty/failure/retry behavior, detail, create/edit/delete confirmation, conflict reload, upload preflight/paths, required fields, file boundaries and Korea-time conversions. Scoped whitespace check passed. Isolated production build .next/events-verify pending result.
- Live authenticated backend requests, actual multipart HTTP transport and browser screenshot comparison remain unverified. Supplied screenshot reviewed directly; existing winter image reused for hero and image fallback.
- PASS: isolated production build completed successfully with all 101 localized pages, including /events. No new Event lint warnings; only existing About image warning. No commit.

## 2026-10-06 - Event detail design and backend CRUD
- Used frontend-migration skill, supplied code.html, DESIGN.md and screen.png; verified Event resolver/DTOs and backend docs/ai Event handoff plus decisions/completed/migration/next steps. Preserved existing AppLayout, Apollo, member session and EventEditor; no backend changes, dependencies or commits.
- Added pages/events/detail.tsx and libs/components/events/EventDetail.tsx; event list title/View Event links now open /events/detail?id= instead of the former detail dialog. Added scoped detail styles to scss/events.scss and EN/KR/RU labels. Responsive image hero, breadcrumb/back link, backend status/title/location, Korea-time date timeline, description, photo links, information sidebar and actual associated Resort query/card with unavailable fallback. Native share/clipboard fallback reports errors/cancellation correctly.
- Public reads use getEvent; ACTIVE ADMIN sessions use getEventByAdmin including draft visibility. Admin details reuse EventEditor for update/publish/upload, reload on save/conflict and permanent delete with confirmation followed by /events navigation. Creation remains in the existing list Manage events workflow. Invalid route IDs are blocked before querying; loading/error/retry and unpublished fallback included. Backend has no Event registration/categories/schedule/social/comment contracts, so fabricated screenshot data/actions are omitted.
- Extended scripts/check-events.cjs to cover dedicated route query selection, malformed IDs, public draft guard, retry, associated resort, share fallback, edit and confirmed delete/navigation alongside existing listing/create/upload/update/delete validation fixtures. PASS: TypeScript, all 68 frontend documents against generated backend GraphQL schema, Event mounted mocked-Apollo fixtures. Full build lint reports only the pre-existing About image warning; isolated production build .next/events-detail-verify running.
- No connected browser surfaces are available for screenshot verification. Live authenticated backend/multipart HTTP requests remain unverified; backend integration is validated through actual contracts and mocked Apollo requests. Earlier build runner using node -e caused worker startup failure; corrected temporary runner uses a preload shim and proper script entry point, without application configuration changes.
- PASS: corrected isolated production build completed successfully, including /events/detail and all 104 localized pages. Only the existing About image lint warning and environment cache/Browserslist notices remain. Scoped whitespace check passed.

## 2026-10-06 - Dedicated admin Events UI
- Followed AGENTS.md, SKILLS.md and frontend-migration skill. Rechecked backend docs/ai Event handoff/decisions/completed/migration/next steps and current Event resolver/DTOs. Added /_admin/events using existing withAdminLayout/AdminMembersShell, with Events navigation in both admin menus and correct shell title.
- Reused EventPage with a dedicated adminPage variant: starts in management mode, reads draft/published/past Events through getAllEventsByAdmin, renders two cards per desktop row (one on mobile), and uses the established colors/cards/header/filter design. Includes search, status/location filters, sorting, six-card pagination, start/end dates, edit/delete actions and detail links. Create/update reuse the unchanged EventEditor including dedicated upload mutation/preflight, validation, draft/publish and Korea-time dates; saves/deletes reload the listing and conflict recovery remains available.
- Blocks both rendering and all Event queries for non-ACTIVE ADMIN sessions on this route, while preserving the existing public page and its management toggle. No shared auth/Apollo rewrites, packages, backend edits or commits. Added EN/KR/RU admin introduction/access-denial labels and scoped styles to events.scss.
- Extended scripts/check-events.cjs mounted Apollo fixtures: direct management mode, actual admin operation selection without public requests, two rendered draft/published cards, create dialog reuse, backend DRAFT filter, draft update, blocked admin/user query denial. Existing public/detail/create/upload/update/delete fixtures pass. Production build/lint running in isolated .next/admin-events-verify; no connected browser surfaces or live authenticated requests verified.
- PASS: TypeScript noEmit/incremental false, mounted Event fixtures, full production lint (only pre-existing About image warning), scoped whitespace checks and isolated production build including /_admin/events with all 107 localized pages. Live backend transport and screenshot verification remain unverified.

## 2026-10-07 - Public FAQ and admin CRUD
- Read AGENTS.md, SKILLS.md, frontend-migration skill, supplied FAQ_IMPLEMENTATION.md and backend docs/ai completed/decisions/migration/next steps; inspected actual FAQ DTOs/resolver and existing Events/admin/help UI.
- Added typed apollo/faq.ts (seven actual operations), libs/types/faq.ts and libs/components/faq list/admin/record components. Replaced hardcoded Help Center FAQ with published-only backend search, server pagination, expandable plain-text answers and /cs/faq?id= detail route.
- Added /_admin/faq list, create, edit and detail pages using existing admin shell and Events heading styles. FAQ appears directly after Events in both left menus; old /_admin/cs/faq reuses the new list. ACTIVE ADMIN rendering gates prevent unauthorized queries. Draft/published filters and editor, nonblank trimmed content, server-derived immutable creator, changed-fields-only updates, disabled unchanged saves, confirmed permanent deletion, duplicate-submit locks, invalid-ID guard, loading/empty/error/retry and KST timestamps included. EN/KR/RU labels added without translating backend content.
- PASS: production build including lint/type validation and all 122 localized pages (.next/faq-verify). Only existing About img warning and Browserslist age notice. All 75 frontend GraphQL documents validate against generated actual backend schema. scripts/check-faq.cjs mounted mocked-Apollo checks pass for public/admin operation selection, inactive admin denial, escaped plain text, trimmed draft creation, partial update with omitted unchanged status, confirmed deletion/navigation, invalid ID, empty results and error/retry. Scoped whitespace check passed.
- No new dependencies, backend changes or commit; preserved earlier working tree Events and other user changes. Live authenticated backend transport and browser visual verification remain unverified.

## 2026-10-07 - FAQ spacing and navigation refinement
- Added FAQ after About Us in shared desktop/mobile navigation, linking to /cs?tab=faq with active state on FAQ list/detail.
- Added scoped scss/faq.scss, FAQ public/admin/list/form classes: 1200px public reading width, centered admin content, deliberate header/panel margins, 28-32px panel padding, 64px accordion rows, aligned filters/counts, correct input padding/height and responsive stacking. Admin status filter now visibly shows All statuses. Existing data, GraphQL/auth and other domain layouts unchanged.
- Browser visual review passed for public FAQ (all nine entries), admin list and create form. Type/lint stages passed with only pre-existing About img warning. Production build final result pending.
- A malformed PowerShell replacement damaged three files during editing; restored their exact pre-edit contents from earlier reads and applied only intended class/import changes. Auto-review rejected a proposed HEAD-based recovery because it could overwrite uncommitted changes; used safer content restoration instead. No history reset or user changes discarded.
- PASS: isolated production build completed successfully with all 122 localized pages; scoped whitespace check passed. Public/admin list/create layouts visually verified in connected Chrome. No commit.

## 2026-10-07 - Admin Overview redesign
- Replaced /_admin legacy redirect with a dedicated Overview using existing withAdminLayout membersDesign/AdminMembersShell. Added personalized navy/blue welcome panel, quick links to resort/equipment/FAQ creation and seven linked management cards. Responsive 3/2/1-column grid, consistent 1240px content width, panel padding and typography via scoped scss/admin-overview.scss. EN/KR/RU labels added.
- Preserved auth flow; Overview requires ACTIVE ADMIN. No fabricated dashboard statistics, new GraphQL operations, backend changes or dependencies. Corrected Members sidebar label accidentally showing FAQ on FAQ routes, and set Overview shell title.
- Browser screenshot review passed; Create FAQ quick action navigated to real create page without submitting data. Type/build lint stages passed; focused overview lint has no diagnostics after passHref adjustment. Existing shell Link warnings and About img warning remain. Translation payload now reports 130kB shared page-data warning; no shared translation refactor included. Production build generated all 122 pages; final completion recorded below.
- PASS: isolated production build .next/admin-overview-verify completed successfully (122 localized pages); scoped whitespace check passed. Redesigned /_admin left open in connected Chrome. No commit.

## 2026-10-07 - Demo cart drawer and checkout design
- Shared Top cart icon opens a right-side MUI CartDrawer on public layouts. Drawer shows selections, quantities, removal, total, View cart and Continue to checkout links; empty state links to equipment.
- CartPage now has Cart/Checkout/Success steps, a styled empty state, responsive order summary, and selectable VISA/Mastercard demo cards. Selected demo method is included in local receipts; existing auth, query-only price revalidation, failure/retry and cart-clearing behavior preserved.
- DemoOrders renders a success panel only for an existing receipt, plus payment method. Success page links to demo orders and resorts. Added scoped scss/cart-checkout.scss and five EN/KR/RU labels. No real payments, backend booking operations, packages or commits.
- Typecheck, project lint and existing scripts/check-demo-checkout.cjs passed (existing About image warning). Drawer navigation and card selection visually verified. Initial isolated-build runner had Windows path/config errors and disturbed the dev cache; corrected temporary runner and restarted only the verified project dev server. Final production-build outcome pending below.
- PASS: standard Next.js production build using a temporary inherited config override completed in .next/cart-checkout-final, generating all 122 localized pages. Existing shared translation payload warning now reports 131kB. Rechecked receipt/cart script after adding optional paymentMethod; passed. Preview recovered and /cart rendered correctly. Existing user cart was preserved; full browser payment completion was not performed because its existing rental/resort dates were in the past. No real booking/payment integration or legacy domain changes in this scope.

## 2026-10-07 - Blank-page runtime recovery
- Confirmed actual blank homepage in user's Chrome: generated webpack.js crashed with Cannot set properties of undefined (setting j). This was separate from cart date validation; earlier response misidentified the user's rendering issue.
- Stopped only confirmed skiresort-next dev processes, preserved generated .next cache at C:/Users/Aziz/AppData/Local/Temp/snowkr-next-render-cache-20261007, and started a fresh dev server on port 3000. No app source, auth, cart data, dependencies or backend changed.
- Browser verification passed: homepage visibly renders, shared cart drawer opens, drawer checkout link navigates, and checkout renders with cards and summary. New dev logs show successful compilation/HTTP 200 without the runtime crash. Checkout left visible for user.

## 2026-10-07 � Public member profile
- Rebuilt `/member` with the existing My Page dashboard classes: public identity header, bio, role, joined date, instructor link, public navigation and three clickable social/article counters.
- Retained verified backend `getMember`, follower/following queries and subscribe/unsubscribe contracts. Follow actions require login, prevent duplicate profile requests and refresh profile counts and active follow collections. Own profile links to My Page.
- Shared follow cards show nicknames and bios; following label is consistent; failed/loading requests hide stale rows. Preserved pagination, member likes and profile navigation.
- Files: pages/member/index.tsx, libs/components/member/MemberFollows.tsx, scss/mypage-dashboard.scss. No auth/Apollo infrastructure or backend changes; existing unrelated working edits retained.
- Validation: TypeScript passed; full lint passed with warnings, changed-file lint passed with existing native-image warning; scripts/check-follow-ui.cjs passed; git diff --check passed. Production build attempted but stopped with EPERM opening .next/trace. No live browser or database integration verification performed.

## 2026-10-07 - Global community WebSocket chat
- Read AGENTS.md, SKILLS.md, CHAT-DESIGN.md, SOCKET_CHAT_HANDOFF.md and backend docs/ai socket decisions/completed/migration/next steps; verified SocketGateway, AuthService and Member contract. Listed skills/frontend-migration/SKILL.md is missing from this checkout. Current request authorizes live integration beyond the design document's earlier demo-only phase.
- Replaced libs/components/Chat.tsx placeholders with one global widget in pages/_app.tsx; added libs/hooks/useSocketChat.ts, libs/types/chat.ts, scss/chat.scss, EN/KR/RU chat translations and scripts/check-chat.cjs. No packages, backend edits, auth/Apollo rewrites or commits; existing unrelated deleted files and handoff documents preserved.
- Native root-path ws/wss endpoint derives from existing API origin/GraphQL/WS configuration with existing accessToken query authentication. Waits for session readiness and server history handshake. Server echo alone creates message rows. History replaces on reconnect; automatic retries back off from 1 to 30 seconds, with manual retry/online recovery, 10-second handshake timeout and teardown cleanup. Token polling/storage/focus/Apollo identity changes detect replacement; send rejects stale-identity sockets. Only nickname/ID claims retained. Presence counts sockets, not unique users.
- Guest frames remain left and authenticated frames right regardless of viewer. No invented guest IDs, timestamps, receipts or demo messages. Server-confirmed identity labels own member messages; guest You labels cannot be established by this protocol. Client-only 1000-character composer limit, IME-safe Enter/Shift+Enter, plain text, failed-send draft retention and new-message jump behavior. Display retains up to 200 received messages; reconnect restores only backend's latest five.
- Mobile/short-screen MUI modal includes focus containment, scroll lock, safe areas and visualViewport keyboard sizing; desktop is non-modal below drawers. Open state/drafts persist across routes; initially closed.
- PASS: TypeScript noEmit/incremental false; full lint (existing About img warning); scripts/check-chat.cjs wire/private-claim validation, guest/member alignment, single echo, five-entry replacement, joins before auth, token reconnect, invalid-token guest fallback, retry/disconnected state, draft/whitespace/limit/IME checks, focus, cleanup and mobile modal. Scoped whitespace check passed. Corrected isolated production build .next/chat-verify completed for all 122 localized pages; shared translation payload warning now 133kB, plus Browserslist and error/redirect-page i18n notices.
- Live configured guest handshake returned info/getMessages. Browser confirmed existing authenticated identity/live count, Home-to-Instructor draft/open persistence, cart stacking/Escape priority, 320px mobile layout and admin launcher. No live test messages sent. Two-tab live delivery/auth-change smoke test, physical keyboard behavior and production proxy upgrades remain unverified. Backend retains process-local five-message history with no persistence/rooms/message IDs/receipts.
- Preview runner initially loaded config before environment files, showing unconfigured API; corrected temporary runners load @next/env before existing config. Restarted only task-created dev processes. Preview uses port 3000 and isolated .next/chat-preview cache; source configuration unchanged. Appended memory entry without reencoding prior mixed-encoding content.

## 2026-10-07 - Correct duplicate online connection count
- Diagnosed one browser tab reporting two connections: existing Apollo WebSocketLink eagerly created an unused native socket to the same chat gateway, alongside useSocketChat. The installed subscriptions-transport-ws defaults lazy to false; no frontend GraphQL subscription operations are present.
- Added lazy: true to apollo/client.ts subscription options, preserving HTTP queries/mutations, authentication and subscription routing. No backend count manipulation, packages or commits.
- Live browser verification passed: refreshed existing single tab shows 1 online connection; opening a temporary second tab changes it to 2; closing that tab returns to 1. No chat messages sent; original tab remains open. TypeScript, full lint (existing About image warning) and scoped whitespace check passed. Chat regression and isolated production build pending final results.
- PASS: chat regression script and isolated production build .next/chat-count-verify completed for all 122 localized pages. Only existing image, translation-size, i18n and Browserslist notices remain. No commit.

## 2026-10-07 - Login and registration spacing
- Updated pages/account/join.tsx and scoped auth styles in scss/snowkr.scss: grouped headings, consistent 20px gaps, 32px desktop card padding / 28px 20px mobile padding, responsive page spacing, 56px fields and 48px buttons.
- Restored MUI input content-box sizing within auth forms to prevent padding from collapsing field height. Kept labels shrunk above inputs to prevent browser autofill overlap. Authentication behavior and backend contracts unchanged; no dependencies or commits.
- TypeScript and full lint passed (existing About image warning); isolated production build generated all 122 pages. Login and Register visually verified in browser. Initial build override did not propagate to workers and disturbed the default dev cache; corrected inherited preload and restored the verified frontend server on port 3000 with .next/auth-spacing-preview. Backend process unchanged. Project-listed member-instructor-ui skill file absent.
## 2026-10-07 - Viewer-relative chat alignment and navbar profile image
- User supersedes CHAT-DESIGN.md alignment rule: own authenticated messages now appear right; messages from every other member appear left. Chat.tsx compares server-provided sender _id with the connection's verified selfMember._id; scss/chat.scss uses message--own for right alignment/blue bubble. Sender role labels remain display-only. Guest frames lack identity and remain left.
- Top.tsx account button now renders a 28px MUI Avatar from reactive userVar.memberImage, resolved by existing homeImageUrl. Existing profile save returns a fresh token and updates userVar; photo changes appear without reload. No photo/default/failed image uses account icon. Verified backend MemberUpdate/updateMember token flow; no auth, backend, dependency or unrelated user edits changed.
- Extended scripts/check-chat.cjs with the same Kevin/Kim conversation rendered from both perspectives, reactive navbar image replacement/removal, relative/absolute image URLs and MUI image-loader failure fallback. Mirrored Next's targeted icon imports in Node fixture to avoid loading the entire icon barrel. PASS: regression fixtures, TypeScript noEmit/incremental false, full lint (existing About image warning), isolated production build .next/chat-profile-verify (122 localized pages). Existing translation-size, i18n and Browserslist notices remain.
- Live browser confirms Kevin's existing message right and Dilyara/guest messages left. No chat messages, profile uploads or profile saves performed during verification. Navbar image changes verified using mounted reactive-state fixtures; current live member has default image. Updated files: Chat.tsx, Top.tsx, chat.scss, check-chat.cjs, memory.md. Existing account/join.tsx and snowkr.scss user changes retained. No commit.

## 2026-10-07 - Admin routing Apollo cache crash
- Reproduced the exact Cannot convert object to primitive value stack with the installed Apollo cache and a Next-style console formatter. Live browser diagnostic identified Resort.meLiked: replacing a populated array with [] emitted warnAboutDataLoss, whose null-prototype cached objects crash Next console.warn string conversion. Removed temporary diagnostics after identifying the field.
- Added apollo/cache.ts and wired its factory in apollo/client.ts. Resort/Equipment meLiked now explicitly replace complete viewer snapshots (merge: false). Four admin list fields merge non-normalized list/metaCounter envelopes so count-only summaries retain cached lists; argument keys and incoming-page replacement remain unchanged. Preserved existing lazy WebSocket setting, auth, HTTP links, backend contracts and all unrelated working edits. No packages or commit.
- Added scripts/check-admin-cache.cjs: reproduces the original summary and cleared-like crashes; verifies list/summary order, repeated visits, count updates, replacement/empty lists, distinct page/limit arguments and cleared Resort/Equipment likes without cache warnings.
- PASS: focused regression, TypeScript noEmit/incremental false, full lint and isolated production build .next/admin-cache-verify (122 localized pages). Existing About image, translation-size and i18n notices remain. Live authenticated Equipment -> Resorts -> Members -> Instructor applications -> Equipment -> Resorts navigation loaded real rows/counts with no new runtime errors after final reload; existing historical console errors predate the final fix. No live mutations performed. Backend DTOs/services and docs/ai reviewed; project-listed skills directory absent.
## 2026-10-07 Google authentication frontend
- Read backend GOOGLE_AUTH_HANDOFF.md and actual Google DTOs/resolver; project-listed skills directory remains absent. Preserved pre-existing working edits, architecture, password authentication and backend contracts. No new npm packages, backend changes, index commands or commit.
- Configured supplied public Web OAuth client ID in ignored .env.local and added placeholder .env.example. Login/register now render Google's official GIS popup button with loading, load-failure retry and pending-state controls. New Google identities collect nickname/phone without a password; onboarding credentials remain in page memory and expire/cancel/restart as documented.
- Added exact googleAuth/completeGoogleSignup GraphQL operations, typed responses and helpers that reuse existing JWT session/cache clearing. Google mutations use no-cache and inline translated errors (EN/KR/RU); invalid/used onboarding restarts Google authentication, profile conflicts remain retryable. Removed full Apollo request-operation console logging to avoid credential exposure.
- Changed area: pages/account/join.tsx; libs/components/common/GoogleSignInButton.tsx; libs/auth/index.ts and googleErrors.ts; libs/types/member/google-auth.ts; apollo/user/mutation.ts and client.ts; three locale common.json files; .env.example; GOOGLE_AUTH_FRONTEND.md; scripts/check-google-auth.cjs.
- PASS: focused fixture-based auth checks (contracts, onboarding cache/storage isolation and expiry, JWT session creation, completion, restart/retry behavior, local-auth compatibility, translations), TypeScript noEmit/incremental false and full lint (existing About img warning). Browser inspected real GIS button on login and registration; no real Google account sign-in or live member mutation performed. Development translation resources were cached; restart dev server for new translations.
- Build verification uses .next/google-auth-verify; first in-process override compiled but failed manifest collection because worker output directories differed. Rerun uses a temporary inherited output-directory override; restore next.config.js after verification. Remaining rollout: authorized frontend origins in Google Cloud, backend deployment/configuration and required targeted indexes, real-account end-to-end testing. See GOOGLE_AUTH_FRONTEND.md and backend handoff.
- PASS: isolated production build completed all 122 localized pages (exit 0); original next.config.js restored. Existing image, page-data-size, i18n and Browserslist notices remain. No legacy domain rename was required in this authentication scope.

## 2026-10-07 Google sign-in runtime repair
- Investigated reported unavailable message. Credential-free GraphQL diagnostic on localhost:3007 returned GOOGLE_AUTH_DISABLED despite matching configured backend/frontend client IDs: running Nest watcher had not loaded the new backend .env setting.
- Read-only inspection of configured MONGO_DEV database SkiResort confirmed existing member nickname/phone/googleSubject indexes correct, but googleOnboardings had only _id_. Preflight found zero onboarding records and no duplicates/invalid fields. Installed only handoff indexes unique_google_onboarding_token (unique tokenHash) and expire_google_onboarding (expiresAt TTL 0); verified definitions. No index drops, synchronization, account changes or backend contract edits.
- Restarted identified local API Nest development watcher to load current environment, using hidden startup and local ignored output logs. Runtime readiness verification pending compilation. Temporary diagnostic/rollout scripts will be removed after verification.
- VERIFIED: restarted API is listening on localhost:3007. Deliberately invalid diagnostic credential now returns GOOGLE_TOKEN_INVALID/UNAUTHENTICATED instead of GOOGLE_AUTH_DISABLED, proving runtime Google verification is enabled. Read-only reinspection confirms all five required member/onboarding indexes. Real-account sign-in remains for the user to retry; no member/onboarding fixture was created. Removed temporary diagnosis/rollout scripts; no frontend source edits needed for this runtime repair.

## 2026-10-07 Google authentication cancelled
- User cancelled Google authentication development. Removed frontend GIS button, Google-specific helpers/types, both GraphQL mutations, onboarding/expiry flow, EN/KR/RU translations, feature tests, frontend handoff and feature-only .env.example. Removed only NEXT_PUBLIC_GOOGLE_CLIENT_ID from ignored .env.local. Restored original nickname/password login/signup/session flow and preserved pre-existing login layout edits, cache/chat work and request-log removal.
- Deleted libs/components/common/GoogleSignInButton.tsx, libs/auth/googleErrors.ts, libs/types/member/google-auth.ts, scripts/check-google-auth.cjs, GOOGLE_AUTH_FRONTEND.md and .env.example. Removed inlineAuthErrors Apollo context handling. No source migration outside authentication.
- Backend removal was being performed concurrently: read-only reinspection confirms Google source/tests/schema/DTO/module wiring, dependency/configuration and handoff are already removed there, with cancellation documented in backend COMPLETED_TASKS.md. Did not overwrite concurrent backend edits. Database records and previously installed indexes remain untouched.
- Active frontend source scan has no Google-auth references; validation underway. Earlier Google implementation/runtime notes above are historical and superseded. Do not resume Google development without a new request.
- PASS: frontend TypeScript noEmit/incremental false, full lint (existing About img warning), isolated production build (122 localized pages), whitespace checks and no-Google-auth source/dependency scans. Original next.config.js restored, temporary verification script removed. Restarted only identified localhost:3000 frontend dev processes after a connection-reset/stalled-render check; browser verification pending. Database/indexes unchanged by cancellation.

- Final runtime verification PASS: localhost:3000/account/join returned HTTP 200, nickname/password present, no GIS widget or Google translation resources. GraphQL introspection on localhost:3007 confirms login/signup remain and googleAuth/completeGoogleSignup are absent. Corrected Windows startup block caused by open logs under .next: stopped only identified development process trees, removed four temporary log files after handles released, relaunched API/frontend hidden with logs in system TEMP. Both servers responding. Browser automation timed out; live HTTP/API checks supplied final verification. Cancellation complete; no Google-auth source files remain.

## 2026-10-07 Demo instructor account setup
- Created SnowDemo1, SnowDemo2, SnowDemo3 through localhost:3000 registration and submitted instructor applications. Demo phone values: 01000009001, 01000009002, 01000009003.
- Signed in as existing admin Kevin and approved all three pending applications. Admin queue verified: 6 total, 0 pending, 5 approved, 1 previously rejected. Prior applications were unchanged.
- Logged in again as each new user and verified INSTRUCTOR role. Saved full names Snow Demo One/Two/Three, explicitly demo biographies, and distinct existing winter-1/2/3.jpg images via member uploads. All saved images visibly loaded.
- Saved 1/2/3/4-week lesson prices in KRW: SnowDemo1 150000/280000/390000/480000; SnowDemo2 200000/380000/540000/680000; SnowDemo3 250000/470000/660000/820000. Verified every package in public instructor directory. No separate instructor fee field exists.
- Chrome file uploads initially blocked; user enabled extension file URL access. Reconnected after extension reload, completed uploads. Left instructor directory open as SnowDemo2. No application source changes, package changes, or commits; runtime UI verification used instead of source checks.

## 2026-10-07 — SNOWAY branding
- Changed the current product brand from SNOWKR to SNOWAY in public/admin page copy, titles, metadata, and English/Korean/Russian translations (including chat title).
- Created original vector mountain/trail and outlined SNOWAY wordmark assets: snoway-logo.svg, snoway-logo-light.svg, snoway-icon.svg. Replaced legacy logoText.svg/logoWhite.svg/favicon.svg with matching artwork for compatibility. New asset URLs avoid cached Nestar artwork.
- Added shared common/BrandLogo.tsx and used it in Top.tsx, Footer.tsx, AdminMembersShell.tsx and account/join.tsx; updated responsive logo styling in snowkr.scss. Kept existing internal CSS names and browser-storage keys to preserve behavior.
- Reviewed project instructions, UI rules and backend AI documentation. The listed frontend-migration skill is absent from this checkout and installed skill directories; no GraphQL/domain changes were needed.
- TypeScript noEmit and lint passed, with only the existing About img warning. Browser screenshots verified the public header and dark footer. Admin logo uses the same component; no admin login or data mutations were performed.
- Initial production checks encountered a development trace lock and a nested cache directory cleared by dev. Restored only the identified Next frontend processes; localhost:3000 is working with SNOWAY branding. Final production check uses node_modules/.cache/snoway-brand-build; no next.config.js changes.
- Preserved pre-existing workspace edits; no dependencies or commit.
- Final verification: production build PASS (122 localized pages), locale JSON parsing PASS, whitespace check PASS, no SNOWKR/SnowKR references in active libs/pages/public. Existing build warnings: About img, large locale page data, Browserslist age and i18next initialization.
