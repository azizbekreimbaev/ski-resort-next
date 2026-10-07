Current product branding is **SNOWAY** (renamed from SNOWKR on 2026-10-07). Use the shared BrandLogo component and SNOWAY asset URLs for new UI. Legacy snowkr CSS identifiers remain internal implementation names.

# SNOWKR Global UI / Layout Rules

These rules are GLOBAL and MUST be applied consistently to every page and every new screen.

## 1. Global Header — MUST Be Identical Everywhere

Use ONE shared header/navigation design across the entire SNOWKR platform.

Do NOT generate different headers for different pages.

The approved header is the header used in the latest Equipment pages.

Header structure:

Left:
- SNOWKR logo
- Resorts
- Instructors
- Equipment
- Community
- Events
- About Us

Right:
- KR / EN language selector
- Favorites / heart icon with optional count badge
- Cart / bag icon with optional count badge
- User / profile icon

### Header rules

- Header must be implemented as ONE reusable global component.
- Every page MUST use exactly the same header component.
- Do not redesign the header per page.
- Do not change header height between pages.
- Do not change logo size between pages.
- Do not change navigation spacing between pages.
- Do not add page-specific navigation items.
- Do not create alternative desktop headers.
- Do not duplicate header markup inside individual pages.
- Active navigation item may use a light-blue pill/background.
- Header content must align to the same global container as the page content.

Example architecture:

<AppLayout>
  <Header />
  <main>{page}</main>
  <Footer />
</AppLayout>

Pages should NEVER define their own Header or Footer.

---

## 2. Global Footer — MUST Be Identical Everywhere

Use ONE shared footer across ALL SNOWKR pages.

The approved footer is the dark navy footer shown in the Equipment design.

Footer layout:

### Brand column

SNOWKR

"The platform for discovering ski resorts, finding coaches, and
renting or buying winter sports equipment across South Korea."

© SNOWKR Inc. All rights reserved.

### Explore

- Ski Resorts
- Instructors
- Equipment Rental
- Equipment Shop
- Lift Pass Rates

### Community & Events

- Community Board
- Snow Condition Reports
- Competitions & Camps
- Winter Festivals

### Company

- About Us
- Terms of Service
- Privacy Policy
- Help Center

Bottom row:

English (EN) / 한국어

KRW (₩)

Right side:

Alpine Winter Sports Platform in Korea

### Footer rules

- Footer must be ONE reusable global component.
- Every public page uses exactly the same footer.
- Do not generate a different footer for Resorts, Instructors,
  Equipment, Home, or Detail pages.
- Footer width/alignment must follow the global container.
- Footer visual design must remain identical across pages.
- Footer background should span the full viewport width.
- Footer inner content must align with the global content container.

---

# 3. GLOBAL CONTENT WIDTH — CRITICAL

SNOWKR must use ONE STANDARD CONTENT WIDTH across the entire website.

Do NOT allow Stitch to choose a different page width for each screen.

Create a reusable global container.

Recommended implementation:

```css
.snowkr-container {
  width: 100%;
  max-width: 1440px;
  margin-left: auto;
  margin-right: auto;
  padding-left: 32px;
  padding-right: 32px;
}

# 8. My Page — Reuse Existing Nestar Architecture

## CRITICAL RULE

DO NOT rebuild My Page from scratch.

The existing Nestar project already contains the My Page architecture,
business logic, API integration, GraphQL operations, authentication,
member state, routing, mutations, queries, pagination, and related
functionality.

Use the existing Nestar My Page implementation as the architectural
and functional source.

The task is primarily:

NESTAR MY PAGE
        ↓
KEEP ARCHITECTURE + LOGIC
        ↓
ADAPT DATA TO CURRENT SNOWKR BACKEND
        ↓
REDESIGN UI FOR SNOWKR

Do NOT redesign the underlying application logic unless the current
SNOWKR backend requires a necessary compatibility change.

---

## My Page — What Must Be Preserved

Before modifying My Page, inspect the existing Nestar implementation.

Preserve and reuse where applicable:

- authentication logic
- logged-in member detection
- member/profile queries
- profile update mutations
- image/avatar upload logic
- likes/favorites logic
- comments/reviews logic
- pagination
- sorting
- filtering
- loading states
- error handling
- GraphQL queries
- GraphQL mutations
- Apollo cache behavior
- route protection
- member role handling
- reusable hooks
- existing state management
- backend field mappings

Do NOT replace working logic simply to match a generated Stitch screen.

Stitch is a UI DESIGN REFERENCE, not the source of business logic.

---

# 9. My Page — Adapt to SNOWKR

Modify the Nestar My Page terminology and presentation so it belongs
naturally inside the SNOWKR ski platform.

The My Page UI should use the same:

- global Header
- global Footer
- SnowKR container width
- typography
- spacing
- border radius
- buttons
- cards
- colors
- icons
- responsive behavior

as the rest of the SNOWKR application.

My Page must look like part of the same website.

Do NOT make it look like a separate dashboard product.

---

## My Page Information Architecture

Build the available sections from the ACTUAL SNOWKR backend.

Possible My Page sections include:

### Profile
- Profile image
- Name / nickname
- Email
- Phone if supported
- Member information
- Edit profile

### Favorites
Show the resources that the current backend actually allows users to
like/favorite.

Examples may include:

- Favorite Resorts
- Favorite Instructors
- Favorite Equipment

Do NOT create a favorites category if the backend does not support it.

### My Reviews / Comments
Reuse the existing Nestar comment/review architecture where compatible.

Adapt terminology and UI to SNOWKR.

Examples:

- resort reviews
- instructor reviews/comments
- equipment reviews/comments

Only expose relationships supported by the backend.

### Orders / Rentals / Bookings

If these features exist in the current backend, My Page may expose:

- resort bookings
- instructor bookings
- equipment rentals
- equipment purchases
- booking/rental history
- current bookings
- order status

Again:

DO NOT invent frontend data or fake backend functionality.

The current backend schema is the source of truth.

---

# 10. Role-Aware My Page

SNOWKR member roles currently include concepts such as:

- USER
- INSTRUCTOR
- ADMIN

Use the ACTUAL backend enum names.

Do not create new role names only for the frontend.

For USER:

show normal customer/account functionality supported by the backend.

For INSTRUCTOR:

reuse the existing Nestar agent/member architecture where possible.

An instructor may have additional profile information and management
capabilities depending on the current backend.

For ADMIN:

do not mix the public My Page with admin functionality unless the
existing architecture already intentionally does this.

Role-specific rendering should follow existing authentication and
authorization logic.

---

# 11. Nestar → SNOWKR Domain Mapping

When reusing Nestar components, identify their domain meaning before
renaming them.

Conceptually:

Nestar                     SNOWKR
------------------------------------------------
Property                    Resort
Agent                       Instructor
Member                      Member/User
Property favorite           Resort favorite
Agent favorite              Instructor favorite
Property comments           Resort reviews/comments

Equipment is a new SNOWKR domain and must use the actual Equipment
backend model.

Do NOT perform blind text replacement.

For example:

PropertyCard → ResortCard

is reasonable only if the component is now actually backed by Resort
data.

Do not rename variables while leaving incompatible Property types or
GraphQL fields underneath.

Refactor domain naming carefully while preserving working behavior.

---

# 12. Community Page — Reuse Existing Nestar Architecture

DO NOT build the Community system from scratch if equivalent
functionality already exists in Nestar.

First inspect the Nestar project for:

- community
- board
- article
- notice
- comment
- review
- discussion
- post
- like
- view
- member interaction

Reuse the existing architecture and backend-connected logic wherever
compatible.

The goal is:

NESTAR COMMUNITY / BOARD LOGIC
             ↓
      PRESERVE LOGIC
             ↓
MAP TO CURRENT SNOWKR BACKEND
             ↓
      REDESIGN UI
             ↓
       SNOWKR COMMUNITY

Do NOT replace working GraphQL/backend functionality with static
Stitch mock data.

---

# 13. Community Must Follow the Current Backend

Before implementing the Community UI:

1. Inspect the backend modules.
2. Inspect GraphQL schemas/types.
3. Inspect DTO/input classes.
4. Inspect enums.
5. Inspect queries.
6. Inspect mutations.
7. Inspect existing frontend GraphQL documents.
8. Determine what community functionality actually exists.

Then design the UI around those capabilities.

BACKEND IS THE SOURCE OF TRUTH.

Never invent fields because they appear in a Stitch mockup.

For example, do not invent:

- categories
- tags
- vote counts
- reply systems
- badges
- moderation states
- follower counts
- weather reports
- resort reports

unless those concepts are supported by the backend or are explicitly
requested for implementation.

---

# 14. Community UI

The Community page should visually belong to SNOWKR.

It must use:

<Header />

<SnowKRContainer>

  Community content

</SnowKRContainer>

<Footer />

Possible presentation:

Community
------------------------------------------------

[ Search discussions... ]             [ Write Post ]

Category / filters                    Sort

------------------------------------------------

Post title
Author · Date · Views · Likes
Short preview...

------------------------------------------------

Post title
Author · Date · Views · Likes
Short preview...

------------------------------------------------

Pagination

The exact fields displayed MUST depend on backend availability.

Do not create fake metadata just to fill the design.

---

# 15. Community Detail Page

If supported by the backend, reuse existing Nestar detail architecture.

Typical structure:

Breadcrumb

Post title

Author information
Created date
Views / likes if supported

Post content

Actions

Comments

Write comment

Related/recent posts if supported

Do not implement functionality that has no backend support.

Use existing:

- query patterns
- mutation patterns
- member authentication
- comment creation
- comment deletion
- likes
- pagination

where available.

Only redesign the visual presentation.

---

# 16. UI vs Logic Boundary — VERY IMPORTANT

Codex must clearly separate these two concerns.

## CAN CHANGE

Codex may change:

- JSX structure where needed for presentation
- CSS / SCSS / MUI styling
- responsive layout
- spacing
- typography
- icons
- cards
- visual hierarchy
- page composition
- loading skeleton appearance
- empty-state presentation
- labels such as Property → Resort
- domain-specific visible terminology

## SHOULD NOT CHANGE WITHOUT NECESSITY

Codex should preserve:

- GraphQL behavior
- API contracts
- backend DTO structure
- authentication
- authorization
- database relationships
- mutations
- queries
- business rules
- pagination behavior
- filtering behavior
- existing working hooks
- cache/update logic

Do not rewrite functional code merely because Stitch generated a
different UI structure.

---

# 17. Backend-First Implementation Rule

For My Page and Community, use this order:

1. Inspect existing Nestar frontend implementation.
2. Inspect current SNOWKR backend.
3. Identify reusable architecture.
4. Map old Nestar domain concepts to SNOWKR.
5. Identify unsupported/outdated fields.
6. Preserve working logic.
7. Modify only what is necessary for backend compatibility.
8. Apply the new SNOWKR UI.
9. Connect the UI to real backend data.
10. Test all interactions.

NEVER:

Stitch mockup
   ↓
hardcoded frontend
   ↓
try to make backend fit it

ALWAYS:

Current backend
      +
Existing working Nestar architecture
      ↓
SNOWKR frontend logic
      ↓
Stitch-inspired SNOWKR UI

---

# 18. No Mock Data in Final Implementation

Stitch may generate placeholder data for visual purposes.

That data must NOT become the final application implementation.

Do not hardcode:

- resorts
- instructors
- users
- equipment
- community posts
- comments
- reviews
- favorites
- prices
- booking information
- statistics

when equivalent data should come from the backend.

Temporary mock data may only be used during isolated visual
development and must be removed before completion.

---

# 19. Preserve Existing Features During Redesign

A UI redesign must NOT cause regression.

After modifying My Page or Community, verify:

- authentication still works
- current user loads correctly
- profile data loads
- profile editing works
- image upload works if currently supported
- favorites/likes work
- comments work
- pagination works
- filtering works
- sorting works
- role-based behavior works
- GraphQL requests contain correct variables
- loading states work
- errors are handled
- responsive layout works

Do not mark the redesign complete based only on visual appearance.

---

# 20. Final Design Consistency

After implementing My Page and Community, compare them with:

- Home
- Resorts
- Resort Detail
- Instructors
- Instructor Detail
- Equipment
- Equipment Detail

They must share the same:

- Header
- Footer
- content width
- horizontal padding
- typography system
- button system
- card language
- colors
- border styles
- responsive breakpoints

The entire SNOWKR frontend should feel like ONE application.

My Page and Community should NOT retain the visual appearance of
Nestar.

Reuse Nestar's ARCHITECTURE and LOGIC.

Do NOT reuse Nestar's old visual design.

# CORE MIGRATION PRINCIPLE

This project is NOT a from-scratch frontend implementation.

For existing functionality:

NESTAR = architecture / logic reference
SNOWKR BACKEND = data and business-rule source of truth
STITCH = UI/UX design reference

Therefore:

KEEP working Nestar architecture and logic where compatible.
ADAPT it to the current SNOWKR backend.
REDESIGN only the presentation to match the new SNOWKR design system.

Never sacrifice working application logic just to reproduce a Stitch
mockup exactly.