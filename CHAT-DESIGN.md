# SNOWKR — Global Chat Design & Frontend Handoff

**Project:** `C:/Users/Aziz/Desktop/skiresort-next/`  
**Prepared:** 2026-10-07  
**Implementation phase:** frontend design and local interactions; backend connection ob SOCKET_CHAT_HANDOFF.md.

## 1. Task for Codex in VS Code

Implement a global floating chat widget in the existing SNOWKR frontend using this specification. Match the current application design and coding conventions. First inspect the referenced files and explain the small set of changes you intend to make, then implement and verify the UI.

Keep Next.js Pages Router, React, TypeScript, MUI, SCSS, existing authentication, Apollo providers and translations. Reuse the existing `Chat.tsx` entry point. Use simple typed components and local React state; no new packages or chat framework.

The user's current request explicitly permits a frontend preview before backend integration. Historical backend-first instructions in project documents remain relevant to future integration; they do not authorize connecting services or expanding this phase. Sample chat messages and presence counts must be clearly identified as demo data.

## 2. Required behavior

- One chat launcher is fixed to the bottom-right of every page, including account and admin pages. On the initial page load, the panel is closed.
- Clicking the launcher opens the chat panel. Clicking it again or using the header close button closes the panel.
- The header shows the number of online users in a visible badge.
- **Every guest-authored message is on the left, including a message sent by the current visitor while logged out.**
- **Every authenticated sender's message is on the right, including messages from other logged-in members.**
- Alignment is based on the sender's authentication status when the message was sent. It is not based on whether the message belongs to the current viewer.
- Login or logout must not move previously sent messages to the opposite side.
- A guest can send a message without being forced to log in.
- Local sending works in the preview. No actual chat service, presence tracking or message delivery is connected in this phase.

Design assumption: this is one shared community chat room, not a private conversation or customer-support bot.

## 3. Existing project references

These findings come from reading the current repository. Recheck the files before implementation in case they have changed.

| Reference | Relevance |
| --- | --- |
| `AGENTS.md`, `UI.md` | Preserve project architecture and the shared SNOWKR appearance. |
| `scss/MaterialTheme/index.ts` | Active MUI palette, typography and component styling. |
| `scss/snowkr.scss` | Global brand variables, Inter/Plus Jakarta Sans fonts, public shell styling. |
| `pages/_app.tsx` | Global Apollo/Theme providers; suitable place for one persistent chat instance. |
| `libs/components/Chat.tsx` | Existing unfinished chat component; sending is empty and messages are placeholders. |
| `scss/pc/main.scss` | Legacy `.chatting` styles nested under `#pc-wrap`. |
| `libs/hooks/useMemberSession.ts` | Existing `{ user, ready }` session interface. |
| `apollo/store.ts` | Existing reactive user state. |
| `libs/components/layout/AppLayout.tsx` | Public shared shell. |
| `libs/components/layout/LayoutAdmin.tsx`, `libs/components/admin/users/AdminMembersShell.tsx` | Admin shell variants that also need the global launcher. |
| `libs/components/common/CartDrawer.tsx`, `libs/components/Top.tsx` | Existing right-side cart drawer and navigation overlays. |
| `public/locales/en/common.json`, `public/locales/kr/common.json`, `public/locales/ru/common.json` | Existing translation files. |

The old chat is currently not mounted in the pages/layouts. Its delayed `openButton` visibility and pathname effect should not be carried into the redesign: the launcher must remain available after navigation. Do not reuse its hardcoded `hi` messages, `any` types, Nunito font or mismatched `msg_right`/`msg-right` classes.

## 4. Visual direction

A compact alpine community panel: white surfaces, navy text, sky-blue accents, rounded corners and restrained shadows. It must feel like the current resort/equipment pages. Preserve the site's header, footer and page content.

| Element | Specification |
| --- | --- |
| Body font | Inter, inherited from the active design; 14px / 1.5 for messages. |
| Panel title | Plus Jakarta Sans, 16px / 1.4, weight 700. |
| Sender name | Inter, 12px, weight 600. |
| Supporting text/time | Inter, 12px; readable muted color. |
| Composer text | Inter, 16px to avoid mobile input zoom. |
| Primary | Existing `--snowkr-primary`: `#0284c7`. |
| Main text | Existing `--snowkr-navy`: `#0f172a`. |
| Muted text | Existing theme `text.secondary`: `#64748b`. |
| Panel/header/composer surface | Existing paper: `#ffffff`. |
| Conversation background | Existing page background: `#f8fafc`. |
| Borders | Existing `--snowkr-border`: `#e2e8f0`, 1px. |
| Guest bubble | White with border and navy text. |
| Member bubble | Existing brand shade `#075985` with white text, for readable small text. |
| Online badge | Proposed component-local pale green `#f0fdf4`, green text/dot `#166534`; include text and number. |
| Panel radius | 20px; clip the background to rounded corners. |
| Bubble radius | 16px, reduced to 4px at the sender-side lower corner. |
| Panel shadow | Proposed `0 16px 48px rgba(15, 23, 42, 0.16)`. |
| Spacing | 4/8/12/16/20/24px rhythm. |
| Icons | Existing MUI icon package; no new icon library. |

Use existing theme values/variables where available. Keep additional values scoped to the chat; do not change the global theme to style this feature. In particular, use the active Inter typography rather than the legacy Poppins variable.

## 5. Launcher and panel layout

### Desktop and tablet, viewport width 600px and above

- Launcher: 56 × 56px circular primary button, white 24px chat icon, right 24px, bottom 24px. Accessible name: “Open chat” / “Close chat”.
- Hover: slightly darker blue; keyboard focus: clearly visible ring. No repeating pulse or bouncing animation.
- Panel: 392px wide, with `max-width: calc(100vw - 32px)`; preferred height 584px, capped to `calc(100dvh - 184px)` with a `100vh` fallback. This reserves space for the site's header as well as the launcher.
- Panel sits right 24px, bottom 96px, leaving 16px above the launcher. It overlays content without changing the page width.
- Header and composer stay visible; only the message history scrolls. Use `min-height: 0` on the flexible message area so short screens do not overflow.
- Desktop panel is non-modal: no page-dimming backdrop and no page scroll lock.
- Use a stacking layer above page content but below existing cart drawers, dialogs and the mobile menu. The public header uses 1100; the custom admin header uses 1200. A desktop chat layer around 1190 fits between them and below standard MUI drawer/modal layers; keep the panel below the admin header geometrically as well. Inspect actual overlap before finalizing it.

### Mobile, viewport width below 600px; also use the full-screen panel below 480px height

- Closed launcher: 52 × 52px, right 16px, bottom `16px + env(safe-area-inset-bottom)`.
- Open panel: a full-screen dialog using the available dynamic viewport height. No rounded outside corners; no horizontal overflow at 320px.
- Hide the external launcher while the mobile dialog is open; keep a 44px close control in the header.
- Respect top/bottom safe areas. The composer must remain reachable when the software keyboard opens.
- Lock background scrolling and contain keyboard focus while the mobile dialog is open. Reuse MUI's modal/focus behavior where practical; restore focus and scrolling on close.

### Panel structure

```text
┌──────────────────────────────────────┐
│ [chat] SNOWKR Chat   [● 12 online] [×]│
│        Community conversation        │
├──────────────────────────────────────┤
│ Demo chat · messages stay in this tab │
│                Today                 │
│                                      │
│ [G] Guest 104 · Guest                 │
│     ┌──────────────────────────┐     │
│     │ Any beginner slope tips? │     │
│     └──────────────────────────┘     │
│     10:24                            │
│                                      │
│                  Mina · Member [M]   │
│     ┌──────────────────────────┐     │
│     │ Start with the green run.│     │
│     └──────────────────────────┘     │
│                            10:25     │
│                                      │
│ [G] Guest 207 (You) · Guest           │
│     ┌──────────────────────────┐     │
│     │ Thanks! I'll try that.   │     │
│     └──────────────────────────┘     │
│     10:26                            │
├──────────────────────────────────────┤
│ Chatting as Guest 207                 │
│ [Write a message…             ] [➤] │
└──────────────────────────────────────┘
                               [chat]
```

The last bubble deliberately remains on the left: it belongs to the current viewer, who sent it as a guest. The count and conversation above are illustrative fixtures.

## 6. Header, history and composer details

**Header:** approximately 76px high with 16px horizontal padding. Place the title and subtitle on the left; online badge and close button on the right. Allow sensible wrapping at 320px instead of truncating the count. Use `12 online` as the default demo fixture; support `0 online` without hiding the badge. Never derive the online count from message count or animate it randomly.

**History:** 16px padding, 16px between different senders, 8px between name/bubble/time. Avatars are 28px with 8px gap, aligned to the relevant side. Use initials or the existing avatar fallback. Bubble groups use at most 82% of the history width. Break long words/URLs, preserve line breaks, and render content as plain text. Names and “Guest”/“Member” labels make the distinction understandable without relying on color alone.

**Own-message label:** add “(You)” next to the current sender's displayed name. This is only an identity label; it must not affect alignment. Other authenticated members still appear on the right.

**Composer:** white surface, top border, 16px padding. Show “Chatting as Guest 207” or the real member nickname above the input. A guest gets a stable temporary label for this tab session. Use a multiline input with 44px minimum height, capped at roughly three visible lines, and a separate 44px icon send button. Do not add an attachment picker, emoji menu or voice controls in this phase.

Enter sends; Shift+Enter inserts a line break. Enter during IME composition must not send, including Korean input. Trim outer whitespace; blank submissions are disabled. Keep a configurable demo limit of 1,000 characters and show an inline limit hint near the limit. This is a UI preview choice, not a backend contract.

After a valid send, append one local message, clear the input, retain focus and reveal that message. If an incoming-message fixture is exercised during verification, only auto-scroll if the reader is near the bottom; otherwise offer “New messages” to jump down. Do not add a simulated incoming-message timer. Closing/reopening or changing routes preserves messages, draft and panel state during the mounted app session. A full reload may reset the demo; no localStorage message history is required. The existing logout helper reloads the page, so a demo reset on logout is expected; do not change that helper to preserve the preview.

## 7. Alignment model and session handling

| Message author at send time | Current viewer | Alignment |
| --- | --- | --- |
| Another guest | Any | Left |
| Current viewer, sent as guest | Guest or subsequently logged in | Left |
| Another authenticated member | Any | Right |
| Current viewer, sent while authenticated | Logged in or subsequently logged out | Right |

Store structured message data, not JSX elements, in state. A minimal **UI-only** type is sufficient:

```ts
type ChatMessage = {
  id: string;
  senderKey: string;
  senderName: string;
  senderKind: 'guest' | 'member';
  text: string;
  createdAt: string;
};

const alignment = message.senderKind === 'guest' ? 'left' : 'right';
```

`senderKind` records authentication at send time, not an authorization role. Do not compare `senderKey` to the current user to choose a side. This type does not claim any backend field names or require creating a database model.

Use the existing `useMemberSession()` and actual user identity fields (`user._id` for member identity). While `ready` is false, allow opening the panel but disable sending with a brief “Preparing chat…” state, so an authenticated visitor is not briefly treated as a guest. Do not replace login, token storage, route guards or Apollo state. A development-only fixture switch may help inspect both sender states, but it must not modify the real session or appear as a fake login control in the production UI.

## 8. States and accessibility

| State | Required presentation/behavior |
| --- | --- |
| Closed | Only the accessible launcher; no invisible focusable panel controls. |
| Open demo | Mixed guest/member messages, clearly labeled demo presence and local sending. |
| Empty history | Small chat icon, “Start the conversation” and “Ask about slopes, gear or your next trip.” Composer remains available. |
| Session preparing | Panel remains usable; send waits for session readiness. |
| Empty/whitespace input | Send disabled; no blank bubble appended. |
| Invalid input | Inline feedback near the composer; draft remains intact. |
| Future unavailable presence | “Online count unavailable”, not a fabricated zero. |
| Future send failure | Preserve draft or failed message with Retry; do not display delivery success. |

Implement the current local states; document future connection states without building a network/retry subsystem now. No fabricated delivery ticks, typing users, notifications, unread counters or generated replies.

Provide accessible labels for icon buttons and the composer, `aria-expanded`/`aria-controls` on the launcher, a labeled dialog/panel, and a message log that announces additions politely without rereading the whole history. Escape closes the active chat; do not intercept Escape intended for a higher-priority modal. Focus the composer when opened on desktop; on mobile focus the title or close control first to avoid immediately covering the conversation with the keyboard. Restore launcher focus on close. Honor reduced-motion preferences; otherwise use a short 150–200ms opening transition.

Use existing `useTranslation('common')` patterns and add labels in English, Korean and Russian. Do not translate user-authored message text. Check contrast, keyboard operation and enlarged text as well as mouse interactions.

## 9. Minimal implementation scope

1. Refine `libs/components/Chat.tsx`, retaining its default export. Extract a small message-row component only if it makes the code easier to follow.
2. Add `scss/chat.scss`, scoped under `.snowkr-chat`. Explicitly apply the active font and box-sizing because a global mount sits outside `#pc-wrap.snowkr-app`. Keep portal/mobile styles within the same namespace.
3. In `pages/_app.tsx`, import the stylesheet and mount one `<Chat />` inside existing providers, as a sibling of the page component. Avoid route keys that remount it and do not create a second React root.
4. Update only the relevant keys in the three existing common translation files.
5. Keep mock fixtures separate from rendering logic, either as a small constant or a small adjacent fixture file. Keep the `Demo chat` disclosure visible.

Do not mount another chat in each page/layout. Keep modal/cart/menu stacking functional. Do not port the legacy chat's oversized fixed dimensions or depend on its `#pc-wrap` styles. Remove legacy styles only if they are confirmed unused and removal is directly part of this change; do not refactor unrelated SCSS.

Do not add backend calls, WebSockets, polling, GraphQL operations, database work, new authentication, private messaging, moderation, file uploads or chat history storage. Before later backend integration, inspect the actual chat and presence contracts. The server must ultimately establish sender identity/status; frontend styling is not authentication.

## 10. Acceptance checks

- [ ] Exactly one launcher appears on Home, Resort/Equipment pages, Community, Account, My Page and both admin layout variants.
- [ ] It stays visible after client-side navigation; open state, draft and local messages persist across route changes.
- [ ] Initial state is closed; launcher, header close and Escape behave correctly.
- [ ] The header displays the online badge, including zero; mock presence is visibly disclosed.
- [ ] A logged-out user's own submitted message appears on the **left**.
- [ ] Another guest's message also appears on the left.
- [ ] The current authenticated user's message and another member's message both appear on the **right**.
- [ ] Existing bubbles do not change sides after login/logout.
- [ ] Guest sending requires no login; sending waits while the actual session is being restored.
- [ ] Enter, Shift+Enter, IME input, whitespace rejection and the demo length limit work.
- [ ] Text is rendered safely; long messages, long names and unbroken URLs do not overflow.
- [ ] Header/composer stay visible at desktop, 320px mobile and short landscape heights; mobile keyboard and safe-area behavior are checked.
- [ ] Cart drawers, menus and dialogs stay above chat; no duplicate overlays trap focus or block their close controls.
- [ ] Keyboard focus, accessible names, translation labels and reduced motion work.
- [ ] No real chat network traffic, auth changes or changes to unrelated pages occur.

After implementation, run the project's TypeScript and lint checks, then its normal build when the environment permits. Reuse existing test tooling for the alignment rule and sending behavior; do not add a new test dependency solely for this task. Visually inspect desktop and mobile. Report pre-existing failures separately and do not disrupt a running development server merely to force a build. Report changed files, checks and remaining backend integration work; update project memory according to its existing convention. Do not commit unless the user requests it.
