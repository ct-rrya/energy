# Implementation Plan: EcoChat Widget Redesign

## Overview
Complete redesign of the EcoChat floating widget to match the new Jitter-style landing page design (Bricolage Grotesque, light/airy light mode, navy dark mode, pill shapes, smooth motion with signature easing `cubic-bezier(.65, 0, .15, 1)`). The backend API contract (`POST /chat` with `{message, sessionId?}` → `{response, sessionId, suggestions?}`) **must NOT change**.

## Exploration Findings

**Framework & Dependencies:**
- React 19 with TypeScript, Vite build system
- Already installed: `lucide-react@1.25.0`, `marked@18.0.13`, `dompurify@3.4.15`
- Theme system: `ThemeContext` with `data-theme` attribute, stored in localStorage as `'ecostep-theme'`
- CSS variables: `landing.css` defines `--landing-*` variables on `:root` with `data-theme` selectors
- Path alias: `@/` → `src/`

**Current Implementation:**
- `FloatingChatButton.tsx`: 60px circular launcher, bottom-right, opens sliding panel (88dvh mobile bottom sheet, 400×600px desktop)
- `ChatInterface.tsx`: Full chat UI with message list, typing indicator, markdown rendering (marked + DOMPurify), suggested actions, auto-resizing textarea, session storage for `sessionId`
- API client: `lib/api.ts` exports `api.chat.sendMessage(message, sessionId?)` → `ChatResponse{response, sessionId, suggestions?}`
- Theme colors: `lib/theme.ts` exports `getThemeColors(theme)` returning color tokens
- Existing design: Navy header (#0B132B), teal bot bubbles (#1E6F5C), neon green user bubbles (#39FF88), emoji avatar (🌱)

**Design Tokens (from landing.css):**
| Token | Light | Dark |
|-------|-------|------|
| `--landing-bg` | `#f5f8f3` | `#0a1224` |
| `--landing-surface` | `#ffffff` | `#111b30` |
| `--landing-ink` | `#0d1b14` | `#eaf3ee` |
| `--landing-mute` | `#5b6b62` | `#93a39b` |
| `--landing-line` | `#dfe8e1` | `#1f2b44` |
| `--landing-green` | `#19d46a` | `#19d46a` |
| `--landing-green-ink` | `#05361f` | `#05361f` |
| `--landing-soft` | `#e4f7ea` | `#10301f` |

**Radii:** Panel 28px, bubbles 22px (speaker corner 8px), buttons/input 999px  
**Typography:** Bricolage Grotesque (already loaded globally) — 400/600/800 weights. Message 15-16px, timestamps 12px, header 17px weight 800  
**Icons:** Lucide React, 20px, stroke-2, `currentColor`  
**Motion:** `cubic-bezier(.65, 0, .15, 1)` for all transitions, respect `prefers-reduced-motion`

**Build & Test Commands:**
- Build: `npm run build` (or `npm run dev` for dev server on port 5173)
- Test: `npm run test` (Vitest)
- Lint: `npm run lint`

---

## Implementation Steps

- [ ] 1. **Create chat.types.ts with TypeScript interfaces**  
      Define `ChatMessage`, `SuggestionChip`, `ChatState`, and any other needed types. `ChatMessage` should have `{id: string, role: 'user'|'bot', text: string, timestamp: Date}`. `SuggestionChip` is `{id: string, text: string}` (4 pre-defined chips shown on empty state).  
      Files: `frontend/src/features/chat/chat.types.ts`  
      Verify: `npm run build` — TypeScript compiles without errors.

- [ ] 2. **Create useChat.ts custom hook for state management**  
      Consolidate all chat logic: message array state, `isLoading` state, `sendMessage(text)` function that calls `api.chat.sendMessage(text, sessionId)`, retry last message function, client-side rate limit (1 message per 1.5s, track last send time in ref), 429 handling (extract `retryAfter` from error and show friendly message). Store `sessionId` in `sessionStorage` with key `'ecostep_chat_session_id'` (NOT messages — only sessionId for backend continuity). Expose `{messages, isLoading, sendMessage, retryLastMessage, clearChat}`. `clearChat` resets to initial greeting and 4 chips.  
      Files: `frontend/src/features/chat/useChat.ts`  
      Verify: `npm run build` — TypeScript compiles; inspect the exported hook interface.

- [ ] 3. **Create ChatLauncher.tsx — 56px floating circle**  
      56px circle (not 60px), `background: var(--landing-green)`, `color: var(--landing-green-ink)`, Lucide `MessageSquare` icon 20px stroke-2. Position `fixed` `bottom: max(24px, env(safe-area-inset-bottom))` `right: max(24px, env(safe-area-inset-right))` `z-index: 9999`. Hover: scale 1.05 with `cubic-bezier(.65,0,.15,1)` 250ms transition. `aria-label="Open EcoChat assistant"`. Click opens `ChatPanel` via a custom event `'ecostep:openchat'` dispatched on `window`. Listen for `'ecostep:closechat'` to track closed state (button hidden while panel open). Respect `prefers-reduced-motion` (no scale animation if reduced-motion is set).  
      Files: `frontend/src/features/chat/ChatLauncher.tsx`  
      Verify: `npm run build` — compiles; `npm run dev`, open localhost:5173, see the green launcher circle bottom-right with Lucide MessageSquare icon.

- [ ] 4. **Create ChatPanel.tsx — `role="dialog"` floating panel**  
      `role="dialog"` `aria-label="EcoChat"` `aria-modal="true"`. Listen for `'ecostep:openchat'` event to show, Escape key to close. Desktop (≥560px): `width: min(400px, calc(100vw - 24px))` `height: min(640px, 80dvh)`, `position: fixed` `bottom: 24px` `right: 24px`, border-radius `28px`, `box-shadow: 0 10px 40px rgba(13,27,20,0.15)`, `border: 1px solid var(--landing-line)`, `background: var(--landing-surface)`. Mobile (<560px): full-width bottom sheet `width: 100vw` `height: 92dvh`, `bottom: 0` `left: 0`, rounded top corners only `border-radius: 28px 28px 0 0`, `padding-bottom: env(safe-area-inset-bottom)`. Open/close animation: scale from 0.96 origin bottom-right, opacity 0→1, 300ms with signature easing; respect `prefers-reduced-motion` (instant if set). Focus trap: on open, move focus to first interactive element (input); on close, return focus to launcher. Backdrop: semi-transparent overlay `rgba(10,18,36,0.4)` with `backdrop-filter: blur(4px)`, click to close. Dispatch `'ecostep:closechat'` event on close.  
      Files: `frontend/src/features/chat/ChatPanel.tsx`  
      Verify: `npm run build`; `npm run dev`, click launcher → panel opens with smooth scale+opacity animation, Escape closes, backdrop click closes, focus moves to input on open.

- [ ] 5. **Create ChatHeader.tsx — panel header with logo and controls**  
      Background `var(--landing-surface)` (not dark green). Left: green tile with Lucide `Sprout` icon (`width: 40px` `height: 40px` `border-radius: 12px` `background: var(--landing-green)` `color: var(--landing-green-ink)` with 20px stroke-2 `Sprout` icon). Title "EcoChat" 17px weight 800 `font-family: 'Bricolage Grotesque', ...`. Subtitle "EcoStep assistant" 13px weight 400 `color: var(--landing-mute)`. Right: Lucide `RotateCcw` icon button (20px stroke-2) `aria-label="Start new chat"` (calls `clearChat()` from `useChat` hook), then Lucide `X` icon button `aria-label="Close"` (calls `onClose` prop). Icon buttons: 36×36px, `border-radius: 999px`, hover background `rgba(25,212,106,0.1)`, focus outline `3px solid var(--landing-green)` offset 3px. Padding `20px 24px`, border-bottom `1px solid var(--landing-line)`.  
      Files: `frontend/src/features/chat/ChatHeader.tsx`  
      Verify: `npm run build`; `npm run dev`, open panel → header shows green Sprout tile, "EcoChat" title, subtitle, RotateCcw and X buttons; click RotateCcw → chat clears to greeting + chips; click X → panel closes.

- [ ] 6. **Create MessageList.tsx — scrollable message container**  
      `role="log"` `aria-live="polite"` `aria-atomic="false"`. Flex column, `overflow-y: auto`, `padding: 20px 24px`. Auto-scroll to newest message when messages change (use ref to scroll into view), BUT detect if user has scrolled up more than 100px from bottom → if so, do NOT auto-scroll, instead show a "Jump to latest" pill (`position: sticky` `bottom: 16px` `align-self: center`, pill button `padding: 8px 16px` `border-radius: 999px` `background: var(--landing-green)` `color: var(--landing-green-ink)` `font-size: 13px` weight 600, click scrolls to bottom smoothly). Visually-hidden live region: announce "New message from EcoChat" when bot messages arrive, "Your message sent" when user messages added. Respect `prefers-reduced-motion` for scroll behavior.  
      Files: `frontend/src/features/chat/MessageList.tsx`  
      Verify: `npm run build`; `npm run dev`, send multiple messages until scroll appears → auto-scrolls to newest; scroll up → "Jump to latest" pill appears; click pill → scrolls to bottom.

- [ ] 7. **Create MessageBubble.tsx — user and bot message bubbles**  
      Bot bubbles: `background: var(--landing-surface)` `border: 1px solid var(--landing-line)` `color: var(--landing-ink)`, left-aligned, max-width 88%, `border-radius: 22px 22px 22px 8px` (bottom-left corner 8px). User bubbles: `background: var(--landing-green)` `color: var(--landing-green-ink)` weight 600, right-aligned, max-width 88%, `border-radius: 22px 22px 8px 22px` (bottom-right corner 8px). Both: `padding: 14px 18px`, `font-size: 15px` `line-height: 1.5`. Timestamp: 12px `color: var(--landing-mute)`, shown only on hover/focus or for last message in a group (detect consecutive same-role messages). Bot text: render as **sanitized Markdown** using `marked.parse(text)` then `DOMPurify.sanitize(html, {ALLOWED_TAGS: ['p','br','strong','em','ul','ol','li','code','pre','a'], ALLOWED_ATTR: ['href','target','rel']})`. Configure marked renderer to add `target="_blank" rel="noopener noreferrer"` to all links. Never use `dangerouslySetInnerHTML` on unsanitized text. User text: plain text (no markdown).  
      Files: `frontend/src/features/chat/MessageBubble.tsx`  
      Verify: `npm run build`; `npm run dev`, send a message → user bubble green right-aligned; receive bot reply with markdown (**bold**, lists, link) → renders correctly, link opens in new tab with `rel="noopener noreferrer"`. Hover bubble → timestamp appears.

- [ ] 8. **Create SuggestionChips.tsx — 4 initial suggestion pills**  
      Shown below the greeting message ONLY when `messages.length === 1` (just the greeting). 4 chips in a vertical or wrapped flex layout: pill shape `border-radius: 999px`, `background: var(--landing-soft)` `border: 1px solid var(--landing-line)` `color: var(--landing-ink)` `padding: 10px 18px` `font-size: 14px` weight 400. Hover: lift 2px with `cubic-bezier(.65,0,.15,1)` 200ms transition, `box-shadow: 0 4px 12px rgba(13,27,20,0.08)`. Click sends that text as user message (call `sendMessage(chipText)` from `useChat`). Config array:  
      ```ts
      const DEFAULT_CHIPS = [
        "How does a footstep make power?",
        "What's the current energy status?",
        "What does the ESP32 do?",
        "How do I read the dashboard?"
      ];
      ```
      Hide chips after first user message (when `messages.length > 1` or when `messages[1]?.role === 'user'`). "New chat" (from `clearChat()`) restores them.  
      Files: `frontend/src/features/chat/SuggestionChips.tsx`  
      Verify: `npm run build`; `npm run dev`, open chat → greeting + 4 chips; click a chip → sends message, chips disappear; click "New chat" → greeting + chips return.

- [ ] 9. **Create ChatInput.tsx — auto-growing textarea + send button**  
      Auto-growing textarea 1-4 rows (`min-height: 44px`, `max-height: ~96px` for 4 rows at 15px line-height). **Enter** sends (call `e.preventDefault()` and `sendMessage(value.trim())`), **Shift+Enter** adds newline (default behavior). Max 500 characters: show a character counter `500 - value.length` in `color: var(--landing-mute)` `font-size: 12px` bottom-right of input wrapper, visible ONLY when `value.length >= 400`. Textarea: `border-radius: 999px` `padding: 12px 20px` `border: 1px solid var(--landing-line)` `background: var(--landing-surface)` `color: var(--landing-ink)`, placeholder "Type your message..." in `color: var(--landing-mute)`. Focus: `border-color: var(--landing-green)` `box-shadow: 0 0 0 3px rgba(25,212,106,0.15)`. Send button: green pill `width: 44px` `height: 44px` `border-radius: 999px` `background: var(--landing-green)` `color: var(--landing-green-ink)`, Lucide `SendHorizontal` icon 20px stroke-2. Disabled when `value.trim() === ''` or `isLoading` (reduce opacity to 0.4, cursor not-allowed). Press animation: scale 0.95 on mousedown. Layout: flex row, gap 12px, padding `16px 24px`, border-top `1px solid var(--landing-line)`, background `var(--landing-surface)`.  
      Files: `frontend/src/features/chat/ChatInput.tsx`  
      Verify: `npm run build`; `npm run dev`, type in input → auto-grows to 4 rows max; Enter sends, Shift+Enter newlines; type 400+ chars → counter appears; send button disabled when empty, enabled with text, press animation on click.

- [ ] 10. **Create TypingIndicator.tsx — three-dot animation**  
      Bot bubble style (`background: var(--landing-surface)` `border: 1px solid var(--landing-line)`, left-aligned, `border-radius: 22px 22px 22px 8px`, `padding: 14px 18px`). Three dots: 6px circles `background: var(--landing-mute)`, inline-flex gap 4px. Opacity pulse animation staggered 150ms: `@keyframes dotPulse { 0%, 60%, 100% { opacity: 0.3; } 30% { opacity: 1; } }`. Dot 1: 0ms delay, Dot 2: 150ms delay, Dot 3: 300ms delay. Duration 1.5s infinite. Visually-hidden label `<span className="sr-only">EcoStep is typing</span>` for screen readers (position absolute, width 1px, height 1px, overflow hidden). Shown when `isLoading === true` in `MessageList`, after the last user message.  
      Files: `frontend/src/features/chat/TypingIndicator.tsx`  
      Verify: `npm run build`; `npm run dev`, send a message → typing indicator appears with pulsing dots, screen reader announces "EcoStep is typing" (test with browser dev tools or screen reader).

- [ ] 11. **Create chat.css — scoped styles consuming landing.css tokens**  
      Import in a component or index: `import './chat.css';`. DO NOT redefine color values. Reference `var(--landing-*)` tokens from `landing.css`. Define:
      - `.chat-panel` class for panel wrapper (box-shadow, border-radius, transitions)
      - `.chat-message-bubble` for shared bubble styles (padding, border-radius, font-size)
      - `.chat-message-user`, `.chat-message-bot` for role-specific overrides
      - `.chat-input-wrapper` for input container layout
      - `.chat-suggestion-chip` for chip hover/focus states
      - Animations: `@keyframes chatPanelOpen { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }` with `animation: chatPanelOpen 300ms cubic-bezier(.65,0,.15,1);`
      - Mobile responsive rules for <560px (full-width bottom sheet, rounded top corners only)
      - `prefers-reduced-motion` query: disable all animations (duration 0.01ms)
      Files: `frontend/src/features/chat/chat.css`  
      Verify: `npm run build` — CSS compiles; `npm run dev`, open panel → smooth scale+opacity animation, theme toggle works (colors follow `data-theme` attribute).

- [ ] 12. **Create index.ts barrel export**  
      Export all public components and hooks from one file for clean imports: `export { ChatLauncher } from './ChatLauncher'; export { ChatPanel } from './ChatPanel'; export { useChat } from './useChat'; export * from './chat.types';`  
      Files: `frontend/src/features/chat/index.ts`  
      Verify: `npm run build` — compiles; test import `import { ChatLauncher, ChatPanel } from '@/features/chat';` in a scratch file to confirm path alias works.

- [ ] 13. **Edit App.tsx to replace FloatingChatButton with new ChatLauncher + ChatPanel**  
      Remove import `import FloatingChatButton from '@/components/FloatingChatButton';`. Add import `import { ChatLauncher, ChatPanel } from '@/features/chat';`. Replace `<FloatingChatButton />` with `<ChatLauncher />` and `<ChatPanel />` siblings (both rendered at root level outside `<RouterProvider>`). Ensure both are outside the router so they appear on all routes. Move `z-index: 9999+` to launcher and `10000+` to panel (panel above launcher).  
      Files: `frontend/src/App.tsx`  
      Verify: `npm run build`; `npm run dev`, navigate to landing page → new chat launcher appears; click → new panel opens with all features (header, greeting, chips, input). Navigate to dashboard (if accessible) → launcher still visible.

- [ ] 14. **Edit EcoChatSection.tsx to trigger ChatPanel via custom event**  
      Replace the `querySelector('[aria-label*="chat assistant"]')` selector with dispatching a custom event: `window.dispatchEvent(new CustomEvent('ecostep:openchat'));`. The "Ask EcoStep" button now opens the new chat panel instead of the old floating button.  
      Files: `frontend/src/features/landing/components/EcoChatSection.tsx`  
      Verify: `npm run build`; `npm run dev`, go to landing page, click "Ask EcoStep" button → new chat panel opens.

- [ ] 15. **Delete old FloatingChatButton.tsx and old ChatInterface.tsx**  
      Remove `frontend/src/components/FloatingChatButton.tsx` and `frontend/src/features/chat/components/ChatInterface.tsx`. Remove old `SuggestedActions.tsx` if it's replaced (check if it's still used — the new design uses `SuggestionChips.tsx` for the initial 4 chips, and the backend `suggestions` array may still use a separate component for post-message suggestions; clarify: the NEW design shows 4 chips on empty state, and backend suggestions are shown as a separate row of pills after bot messages — keep the old `SuggestedActions.tsx` for backend suggestions, or rename it to avoid confusion). Delete any old test files for `FloatingChatButton` and `ChatInterface` if they exist (e.g., `FloatingChatButton.test.tsx`, `ChatInterface.test.tsx` — keep only the new component tests if written).  
      Files to delete: `frontend/src/components/FloatingChatButton.tsx`, `frontend/src/features/chat/components/ChatInterface.tsx` (and any associated `.test.tsx` files for these two components only).  
      Verify: `npm run build` — compiles without errors (no imports of deleted files); `npm run lint` — no linting errors.

- [ ] 16. **Accessibility audit and manual testing**  
      Test the following with keyboard only and screen reader (NVDA/JAWS on Windows, VoiceOver on Mac):
      - [ ] Tab navigation: launcher → panel (Shift+Tab back)
      - [ ] Escape closes panel, focus returns to launcher
      - [ ] Enter/Space on launcher opens panel
      - [ ] Enter in textarea sends message, Shift+Enter adds newline
      - [ ] Panel `role="dialog"` with `aria-label="EcoChat"`
      - [ ] Message list `role="log"` `aria-live="polite"` announces new messages
      - [ ] Typing indicator has visually-hidden "EcoStep is typing" label
      - [ ] All icon-only buttons have `aria-label`
      - [ ] Focus trap: Tab cycles within panel, cannot escape to page below
      - [ ] Visible focus outlines on all interactive elements (3px green ring, 3px offset)
      - [ ] Color contrast: Green text on green background (`--green-ink` #05361f on `--green` #19d46a) ≥ 7:1 (AA compliant). Bot text on `--landing-surface` ≥ 4.5:1 (AA compliant for normal text).
      - [ ] Mobile: panel is full-width bottom sheet, input stays above on-screen keyboard (test on actual device or emulator with virtual keyboard)
      - [ ] `prefers-reduced-motion`: all animations disabled (scale, opacity, pulse) — test by setting OS to reduce motion, or in browser dev tools emulation
      Verify: Manual testing passes all checks. Document any issues found and fix them before proceeding.

- [ ] 17. **Integration testing: full chat flow**  
      Test the complete user journey:
      1. Open landing page → see green chat launcher bottom-right
      2. Click launcher → panel opens with smooth animation, greeting "Hi! I'm your EcoStep assistant..." and 4 suggestion chips
      3. Click a chip (e.g., "How does a footstep make power?") → user message sent, chips disappear, typing indicator appears, bot reply arrives (markdown rendered with bold, links)
      4. Type a message in input → counter appears at 400 chars, Send button enabled
      5. Press Enter → message sends, typing indicator, bot reply
      6. Send multiple messages until scroll appears → auto-scrolls to newest; scroll up → "Jump to latest" pill appears
      7. Click "New chat" → chat clears to greeting + 4 chips
      8. Click X or press Escape → panel closes, focus returns to launcher
      9. Toggle theme (light/dark) → panel colors update, Bricolage Grotesque font persists
      10. Resize viewport to mobile (<560px) → panel becomes full-width bottom sheet with rounded top corners
      11. Test on mobile device with notch (or emulator) → safe-area insets applied (launcher and panel respect notch)
      Files: `frontend/src/features/chat/__tests__/integration.test.tsx` (optional, if writing tests)  
      Verify: Manual test passes all steps. Backend API contract unchanged: `POST /chat` `{message, sessionId?}` → `{response, sessionId, suggestions?}`. No changes to backend required.

- [ ] 18. **Final build and verification**  
      Run full build and lint to ensure no errors or warnings:
      ```bash
      cd frontend
      npm run build
      npm run lint
      npm run test
      ```
      Verify: All commands succeed with no errors. Build produces optimized bundle with no console warnings about missing dependencies or circular imports. Lint passes with no accessibility violations (if `eslint-plugin-jsx-a11y` is configured). Tests pass (or skip if no tests written yet).

---

## Notes for Implementation

1. **Backend API Contract (DO NOT CHANGE):**  
   - Endpoint: `POST /api/chat`
   - Request: `{message: string, sessionId?: string}`
   - Response: `{success: boolean, response: string, sessionId: string, suggestions?: string[], timestamp: string}`
   - The new frontend must use the existing `api.chat.sendMessage(message, sessionId)` from `lib/api.ts` without modification.

2. **CSS Token Strategy:**  
   The chat widget consumes `--landing-*` variables defined in `landing.css` (set on `:root` by `data-theme` attribute). Do NOT duplicate color values in `chat.css`. Reference them as `var(--landing-surface)`, `var(--landing-green)`, etc. This ensures automatic theme following when the user toggles theme via `ThemeContext`.

3. **Font Loading:**  
   Bricolage Grotesque is already loaded globally by the landing page redesign (weights 400, 600, 800). Do NOT load it again. Use `font-family: 'Bricolage Grotesque', system-ui, -apple-system, 'Segoe UI', sans-serif;` in component styles.

4. **Icons:**  
   Use Lucide React (already installed `lucide-react@1.25.0`). Import individual icons: `import { Sprout, X, RotateCcw, SendHorizontal, MessageSquare } from 'lucide-react';`. Render at 20px with stroke-2: `<Sprout size={20} strokeWidth={2} />`. Use `currentColor` for icon color (inherits from parent text color).

5. **Animations:**  
   Signature easing: `cubic-bezier(.65, 0, .15, 1)` for all transitions. Panel open: scale 0.96→1.0 origin bottom-right, opacity 0→1, 300ms. Typing dots: opacity pulse 0.3→1.0→0.3, staggered 150ms, 1.5s infinite. Hover lifts: translateY(-2px), 200ms. Respect `prefers-reduced-motion`: check `window.matchMedia('(prefers-reduced-motion: reduce)').matches` and set animation durations to 0.01ms or disable entirely.

6. **Mobile Responsive Design:**  
   - Breakpoint: `max-width: 560px` for mobile bottom sheet
   - Mobile panel: `width: 100vw` `height: 92dvh` `bottom: 0` `border-radius: 28px 28px 0 0` `padding-bottom: env(safe-area-inset-bottom)`
   - Desktop panel: `width: min(400px, calc(100vw - 24px))` `height: min(640px, 80dvh)` `bottom: 24px` `right: 24px` `border-radius: 28px`
   - Launcher: `bottom: max(24px, env(safe-area-inset-bottom))` `right: max(24px, env(safe-area-inset-right))`
   - Test with Chrome DevTools mobile emulation (iPhone 14 Pro with notch)

7. **Accessibility Checklist:**  
   - [ ] Panel `role="dialog"` `aria-label="EcoChat"` `aria-modal="true"`
   - [ ] Message list `role="log"` `aria-live="polite"` `aria-atomic="false"`
   - [ ] Typing indicator visually-hidden label "EcoStep is typing"
   - [ ] All icon-only buttons have `aria-label`
   - [ ] Focus trap: Tab cycles within open panel, Escape closes
   - [ ] Focus management: open → focus input; close → focus launcher
   - [ ] Visible focus outlines: 3px solid `var(--landing-green)` offset 3px
   - [ ] Color contrast AA: green text on green bg (#05361f on #19d46a ≈ 7:1), bot text on surface ≥ 4.5:1
   - [ ] Keyboard navigation: Enter/Space on launcher, Enter sends message, Shift+Enter newlines, Escape closes

8. **Markdown Rendering Security:**  
   Bot messages render markdown with `marked.parse(text)` then `DOMPurify.sanitize(html, {ALLOWED_TAGS: ['p','br','strong','em','ul','ol','li','code','pre','a'], ALLOWED_ATTR: ['href','target','rel']})`. Configure `marked` renderer to add `target="_blank" rel="noopener noreferrer"` to all `<a>` tags. NEVER use `dangerouslySetInnerHTML` on unsanitized text. User messages are plain text (no markdown parsing).

9. **Rate Limiting:**  
   Client-side: 1 message per 1.5 seconds (track `lastSendTime` in ref, check `Date.now() - lastSendTime < 1500` before sending). Server 429 response: extract `retryAfter` from error response and show friendly message "Too many messages, try again in ${retryAfter} seconds." Handle in `useChat` hook, not in API client.

10. **Session Management:**  
    Store ONLY `sessionId` in `sessionStorage` with key `'ecostep_chat_session_id'`. Do NOT store message history (it lives in React state only, cleared on page refresh). Backend uses `sessionId` for conversation continuity within the session.

11. **File Organization:**  
    All new files under `frontend/src/features/chat/`:
    - Root: `chat.types.ts`, `useChat.ts`, `index.ts`, `chat.css`
    - Components: `ChatLauncher.tsx`, `ChatPanel.tsx`, `ChatHeader.tsx`, `MessageList.tsx`, `MessageBubble.tsx`, `SuggestionChips.tsx`, `ChatInput.tsx`, `TypingIndicator.tsx`
    - Delete: `frontend/src/components/FloatingChatButton.tsx`, `frontend/src/features/chat/components/ChatInterface.tsx` (and their `.test.tsx` files if they exist)
    - Keep: `frontend/src/features/chat/components/SuggestedActions.tsx` (if still used for backend `suggestions` array — clarify: the NEW design uses `SuggestionChips.tsx` for the initial 4 chips only; backend suggestions may use the old component or be refactored to use the same chip component with different data source)

12. **Backend Suggestions vs. Initial Chips:**  
    - **Initial chips** (4 hardcoded): shown on empty state (greeting only), defined in `SuggestionChips.tsx` config array, disappear after first user message, restored by "New chat"
    - **Backend suggestions** (dynamic): returned in `ChatResponse.suggestions` array, shown as a separate row of pills after bot messages (reuse `SuggestedActions.tsx` or create a new component `BackendSuggestions.tsx` if the old one is too coupled to the old design)
    - Clarify with user or assume: backend suggestions are OPTIONAL feature, not in the requirements. If needed, add a step to handle them (render after bot message bubbles, same pill style as initial chips).

---

## Deliverables

This plan will result in:
1. A completely redesigned EcoChat widget matching the new Jitter-style design
2. All components under `frontend/src/features/chat/` with clean barrel export
3. Smooth animations with signature easing and `prefers-reduced-motion` support
4. Full keyboard accessibility and WCAG AA color contrast
5. Mobile-responsive bottom sheet with safe-area insets
6. Markdown rendering with DOMPurify sanitization
7. Client-side rate limiting and friendly error handling
8. No changes to backend API contract
9. Old components deleted, new components tested and verified

**Total Steps:** 18  
**Estimated Effort:** 1-2 days for an experienced React/TypeScript developer  
**Risk Areas:** Markdown renderer configuration (ensure links get `target="_blank" rel="noopener noreferrer"`), mobile virtual keyboard handling (input staying above keyboard), focus trap implementation (tricky with dynamic content)

---

**Plan complete. Ready for implementation.**
