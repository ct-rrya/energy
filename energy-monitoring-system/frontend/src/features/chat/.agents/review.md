# EcoChat Widget Redesign

Redesigned chat widget to match the new Jitter-style landing page: replaced dark teal panel with the landing design system, added suggestion chips for first-time guidance, improved accessibility, added mobile bottom-sheet behavior, and tightened error handling.

**Watch for:** Session ID leakage across browser tabs (confirmed), focus trap incomplete on desktop (confirmed), error bubble positioning conflict with input box shadow (likely).

**Verdict**: NEEDS_CHANGES

## High-level view

The widget correctly calls `POST /chat` with `{message, sessionId}` and reads `{response, sessionId, suggestions?}`, storing the sessionId in sessionStorage for conversation continuity across page navigation but not persisting messages. The four suggestion chips ("How does a footstep make power?", "What's the current energy status?", "What does the ESP32 do?", "How do I read the dashboard?") appear only when the message list contains just the greeting and disappear after the first user message; "New chat" clears the thread and restores them. Bot replies are parsed with `marked` and sanitized with DOMPurify before rendering via `dangerouslySetInnerHTML`, and all links receive `target="_blank" rel="noopener noreferrer"`.

The panel follows the landing design tokens (`--landing-*`), uses Bricolage Grotesque exclusively (weight 400, 600, 800), and respects the existing theme toggle via `data-theme` attribute. Panel radius is 28px, bubble radius is 22px with the corner nearest the speaker at 8px, and all motion uses `cubic-bezier(0.65, 0, 0.15, 1)` with 300ms transitions and prefers-reduced-motion support. Mobile breakpoint at 560px switches to a full-width bottom sheet (92dvh, rounded top corners, safe-area-inset-bottom padding).

Icons are Lucide-only: `sprout` in the green avatar tile, `x` for close, `rotate-ccw` for "New chat", `send-horizontal` in the Send button, `message-square` in the launcher—all 20px, stroke 2, currentColor, with aria-labels on icon-only buttons. The input is an auto-growing textarea (1 to 4 rows, max 96px) with Enter to send, Shift+Enter for newlines, a 500-character limit, and a counter appearing at 400+ characters. The Send button is a green pill with the `send-horizontal` icon, disabled when empty or loading. The panel is `role="dialog"` with `aria-label="EcoChat"`, the message list is `role="log"` with `aria-live="polite"`, the typing indicator has visually-hidden "EcoStep is typing" text, and Escape closes the panel.

Client-side rate limiting enforces 1.5 seconds between messages, and HTTP 429 is caught with "Too many messages, try again in a moment." Network failures and generic errors display "I couldn't reach EcoStep right now. Check your connection and try again." with a Retry button that resends the last user message. No raw error text or stack traces are shown.

<details>
<summary>Issues (3)</summary>

1. **Session ID shared across tabs** — Use sessionStorage key scoped to a tab-unique ID (e.g., `crypto.randomUUID()` stored in a module-level variable on mount) or document the single-tab assumption.

2. **Focus trap incomplete on desktop** — Add a focus trap with a library like `focus-trap-react` or manual tab-key interception to cycle focus within the panel, or document that desktop trap was deferred.

3. **Error bubble box-shadow conflicts with input** — Test with a long error message and active input focus; consider reducing error padding or adding a small gap between error and input.

</details>

<details>
<summary>Details</summary>

## Design token fidelity

The panel radius is 28px, bubble radius is 22px with the speaker corner at 8px, input and buttons are 999px (pill shape), and the signature easing `cubic-bezier(0.65, 0, 0.15, 1)` appears in all transitions. The panel open animation is 300ms with `@keyframes chatPanelOpen` scaling from 0.96 and fading from 0. `@media (prefers-reduced-motion: reduce)` forces `transition-duration: 0.01ms !important` and `animation-duration: 0.01ms !important` on all chat elements.

Mobile breakpoint at `max-width: 560px` switches to `width: 100vw`, `height: 92dvh`, `bottom: 0`, `left: 0`, `border-radius: 28px 28px 0 0`, and `padding-bottom: env(safe-area-inset-bottom)`. Typography is Bricolage Grotesque: message text 15px, timestamps 12px, header title 17px weight 800, header subtitle 13px weight 400.

## API contract and session management

The `useChat` hook calls `api.chat.sendMessage(message, sessionId?)`, which sends `POST /chat` with body `{message: string, sessionId?: string}` and expects `{success: boolean, response: string, sessionId: string, suggestions?: string[], timestamp: string}`. The sessionId is stored in sessionStorage under `ecostep_chat_session_id` and passed on subsequent requests. Messages are NOT persisted—only the sessionId is stored. Clearing the chat resets the message array to `[INITIAL_GREETING]` but does not clear the sessionId, so the backend conversation context persists across "New chat" clicks.

SessionStorage is per-origin, which means multiple tabs share the same storage in some browser configurations (e.g., when service workers are involved or in older Safari versions). If two tabs send messages concurrently, they will overwrite each other's sessionId.

## Markdown rendering and sanitization

Bot messages pass through `marked.parse(text, {async: false})` to convert markdown to HTML, then `DOMPurify.sanitize(rawHtml, {ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'code', 'pre', 'a'], ALLOWED_ATTR: ['href', 'target', 'rel']})` to strip unsafe tags and attributes. A DOMPurify hook (`addHook('afterSanitizeAttributes', ...)`) adds `target="_blank"` and `rel="noopener noreferrer"` to all `<a>` tags after sanitization. The sanitized HTML is rendered via `dangerouslySetInnerHTML` in `MessageBubble`. This is the only occurrence of `dangerouslySetInnerHTML` in the chat feature. User messages are rendered as plain text.

The `ALLOWED_TAGS` list permits inline code, code blocks, bold, italic, lists, paragraphs, and line breaks. It does not allow headings, images, iframes, or script tags.

## Suggestion chips and empty state

The `SuggestionChips` component renders four chips in a vertical stack. The chip list is hardcoded as `['How does a footstep make power?', "What's the current energy status?", 'What does the ESP32 do?', 'How do I read the dashboard?']`. Each chip is a button with pill shape (border-radius 999px), `--landing-soft` background, `1px solid var(--landing-line)` border. On hover, the chip lifts 2px and gains a soft shadow.

The chips are displayed only when `messages.length === 1` (the greeting is the only message). After the first user message, `messages.length` becomes 2, so the chips disappear. Clicking "New chat" calls `clearChat()`, which resets `messages` to `[INITIAL_GREETING]`, restoring the chips.

## Input behavior and character limit

The `ChatInput` component uses a `<textarea>` with auto-resizing: `textarea.style.height = Math.min(textarea.scrollHeight, 96) + 'px'` on every value change. The 96px cap is approximately 4 rows. Enter sends, Shift+Enter adds a newline.

The `MAX_CHARS` constant is 500, enforced in `handleChange`: `if (e.target.value.length <= MAX_CHARS) { setValue(e.target.value); }`. The counter appears when `value.length >= 400`: `{showCounter && <span className="chat-input-counter">{value.length}/{MAX_CHARS}</span>}`. The counter is positioned `position: absolute; bottom: 12px; right: 20px;` with `pointer-events: none`.

The Send button is a 44px green pill with a `SendHorizontal` icon (20px, stroke 2). It's disabled when `value.trim().length === 0 || disabled`. The disabled state reduces opacity to 0.45 and sets `cursor: not-allowed`.

## Error handling and retry mechanism

On error, `useChat` checks the error message for specific patterns: if `errorMessage.includes('Too many messages')`, set error to "Too many messages, try again in a moment." If the message includes "Failed to connect" or "couldn't reach", set error to "I couldn't reach EcoStep right now. Check your connection and try again." No raw error text or stack traces appear.

The client-side rate limit enforces `Date.now() - lastSendTimeRef.current < 1500ms`, setting error to "Please wait ${seconds} seconds before sending another message." The last user message is stored in `lastUserMessageRef.current`, and `retryLastMessage` calls `sendMessage(lastUserMessageRef.current)`.

The error is displayed in `ChatPanel`: `{error && <div className="chat-error"><p>{error}</p><button className="chat-error-retry" onClick={retryLastMessage}>Retry</button></div>}`. The error bubble has `background: rgba(255, 59, 48, 0.1); border-top: 1px solid rgba(255, 59, 48, 0.2);` and sits between the `MessageList` and the `ChatInput`.

The error bubble's placement may visually conflict with the input's focus box-shadow. The input has `box-shadow: 0 0 0 3px rgba(25, 212, 106, 0.15)` on focus, and the error sits directly above it. If a long error message wraps to multiple lines and the input is focused, the green shadow might overlap the error's border.

## Accessibility: dialog role, focus management, and ARIA

The `ChatPanel` renders `<div role="dialog" aria-label="EcoChat" aria-modal="true">`. The `MessageList` renders `<div role="log" aria-live="polite" aria-atomic="false">`. The `TypingIndicator` wraps the three dots with `<span className="sr-only">EcoStep is typing</span>`, where `.sr-only` is the visually-hidden class. All icon-only buttons have `aria-label`: the launcher has "Open EcoChat assistant", the close button "Close", the "New chat" button "Start new chat", and the Send button "Send message".

Escape closes the panel. The panel stores the previously focused element in `previousFocusRef.current = document.activeElement as HTMLElement` when opening, and restores focus on close. After opening, the input is focused.

The panel does NOT implement a focus trap. Tabbing forward from the input can reach elements outside the dialog on desktop. `aria-modal="true"` implies the background is inert, and without a focus trap, keyboard users can reach background content, violating the modal contract.

## Mobile bottom-sheet and safe-area insets

At `max-width: 560px`, the panel switches to `width: 100vw; height: 92dvh; bottom: 0; left: 0; border-radius: 28px 28px 0 0; padding-bottom: env(safe-area-inset-bottom);`. The `dvh` unit (dynamic viewport height) accounts for browser chrome changes (mobile address bar hiding). The panel is rounded only on the top corners, and the bottom padding includes the safe area inset for devices with home indicators.

The launcher button uses `bottom: max(24px, env(safe-area-inset-bottom)); right: max(24px, env(safe-area-inset-right));`. The implementation uses `dvh` for the panel height, which should keep the input visible, but there's no explicit `visualViewport` listener. On iOS, the keyboard may overlap the input if the panel's flex layout doesn't shrink the message list.

## File map

- **`chat.types.ts`** — TypeScript interfaces: `ChatMessage`, `SuggestionChip`, `ChatState`.
- **`useChat.ts`** — State management hook: message array, loading, error, sessionId, sendMessage, retryLastMessage, clearChat, rate limiting.
- **`chat.css`** — All widget styles consuming landing design tokens, responsive breakpoints, animations, reduced-motion support.
- **`components/ChatLauncher.tsx`** — 56px floating green circle button, listens for open/close events, dispatches `ecostep:openchat`.
- **`components/ChatPanel.tsx`** — Main dialog container, handles open/close, focus management, Escape key, renders header, message list, error, input.
- **`components/ChatHeader.tsx`** — Panel header with Sprout avatar tile, "EcoChat" title, "EcoStep assistant" subtitle, "New chat" and close buttons.
- **`components/MessageList.tsx`** — Scrollable message container with auto-scroll, "Jump to latest" pill, renders message bubbles, typing indicator, suggestion chips.
- **`components/MessageBubble.tsx`** — Individual message bubble, markdown rendering with DOMPurify for bot messages, plain text for user messages, timestamp on hover or for last in group.
- **`components/SuggestionChips.tsx`** — Four hardcoded suggestion pills, displayed when `messages.length === 1`.
- **`components/TypingIndicator.tsx`** — Three-dot pulse animation with visually-hidden "EcoStep is typing" label.
- **`components/ChatInput.tsx`** — Auto-growing textarea, Enter to send, Shift+Enter for newlines, 500 char limit, counter at 400+, green pill Send button.
- **`components/SuggestedActions.tsx`** — Old component from previous design (not used, dead code).
- **`index.ts`** — Barrel export: `ChatLauncher`, `ChatPanel`, `useChat`, types.

The old `FloatingChatButton.tsx` and `FloatingChatButton.test.tsx` in `frontend/src/components/` were deleted. The new components are integrated in `App.tsx`: `<ChatLauncher />` and `<ChatPanel />` are rendered as siblings to `<RouterProvider>` so they appear globally across all routes.

</details>
