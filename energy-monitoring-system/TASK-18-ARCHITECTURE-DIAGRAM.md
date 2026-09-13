# Task 18: FloatingChatButton Global Integration - Architecture Diagram

## Component Hierarchy

```
App.tsx (Root Component)
│
├─ ErrorBoundary
│  └─ QueryClientProvider
│     └─ ThemeProvider
│        └─ AuthProvider
│           └─ SocketProvider
│              │
│              ├─ RouterProvider ────┐
│              │  │                  │ Routes render here
│              │  ├─ LandingPage     │ (/)
│              │  ├─ LoginPage       │ (/login)
│              │  ├─ DashboardPage   │ (/dashboard)
│              │  ├─ SensorsPage     │ (/sensors)
│              │  ├─ AnalyticsPage   │ (/analytics)
│              │  └─ ...             │ (other routes)
│              │                     │
│              ├─ ToastContainer     │ (Global notifications)
│              │                     │
│              └─ FloatingChatButton ◄─── TASK 18: Added here
│                 │                       (Appears on ALL routes)
│                 └─ When expanded:
│                    ChatInterface
│                    ├─ ChatHeader
│                    ├─ MessageList
│                    ├─ ChatInput
│                    └─ SuggestedActions
```

## Why This Architecture?

### ✅ Benefits of Global Placement

1. **Single Source of Truth**
   - One FloatingChatButton instance for entire app
   - No risk of duplicate chat buttons
   - Centralized state management

2. **Persistent Across Routes**
   - Component doesn't unmount when routes change
   - React state preserved (open/closed, expanded state)
   - Session persists naturally (component stays mounted)

3. **Z-Index Hierarchy**
   ```
   Z-Index Stack (highest to lowest):
   10000 - FloatingChatButton (expanded panel)
   9999  - FloatingChatButton (button)
   9000  - Modals/Dialogs
   8000  - Dropdown menus
   1000  - Navigation/Headers
   0     - Page content
   ```

4. **Consistent Positioning**
   - Always bottom-right corner (desktop)
   - Always full-screen (mobile)
   - No layout conflicts with page-specific content

---

## Session Persistence Flow

```
┌────────────────────────────────────────────────────────────────┐
│                      Browser Tab                                │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                   sessionStorage                         │  │
│  │  Key: 'ecostep_chat_session_id'                         │  │
│  │  Value: '550e8400-e29b-41d4-a716-446655440000' (UUID)   │  │
│  └─────────────────────────────────────────────────────────┘  │
│                           ▲ ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                    App Component                         │  │
│  │                                                          │  │
│  │  ┌────────────────────────────────────────────────┐    │  │
│  │  │         FloatingChatButton                     │    │  │
│  │  │  (Persistent, never unmounts)                  │    │  │
│  │  │                                                 │    │  │
│  │  │  ┌──────────────────────────────────────────┐ │    │  │
│  │  │  │       ChatInterface                      │ │    │  │
│  │  │  │  (Only rendered when expanded)           │ │    │  │
│  │  │  │                                          │ │    │  │
│  │  │  │  State:                                  │ │    │  │
│  │  │  │  - messages: ChatMessage[]               │ │    │  │
│  │  │  │  - sessionId: string | null ◄────────────┼─┼────┘  │
│  │  │  │  - isLoading: boolean                    │ │       │
│  │  │  │  - suggestions: string[]                 │ │       │
│  │  │  │                                          │ │       │
│  │  │  │  Session Lifecycle:                      │ │       │
│  │  │  │  1. On mount: Read from sessionStorage   │ │       │
│  │  │  │  2. On change: Write to sessionStorage   │ │       │
│  │  │  │  3. On unmount: sessionStorage persists  │ │       │
│  │  │  └──────────────────────────────────────────┘ │       │
│  │  └────────────────────────────────────────────────┘       │
│  │                                                             │
│  │  ┌────────────────────────────────────────────────┐       │
│  │  │           RouterProvider                       │       │
│  │  │  (Routes change but FloatingChatButton stays) │       │
│  │  │                                                 │       │
│  │  │  Current Route: /dashboard                     │       │
│  │  │  Previous Route: /                             │       │
│  │  │  Session persists across navigation ✓          │       │
│  │  └────────────────────────────────────────────────┘       │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└────────────────────────────────────────────────────────────────┘

When tab closes: sessionStorage cleared (browser native behavior)
When tab reopens: New session created (no sessionId in storage)
```

---

## Route Navigation Scenarios

### Scenario 1: Home to Dashboard Navigation

```
BEFORE NAVIGATION (/)
┌──────────────────────────┐
│      Home Page           │
│                          │
│  [Content]               │
│                          │
│               [💬 Chat]  │ ◄─ FloatingChatButton visible
└──────────────────────────┘

User clicks "Dashboard" link

AFTER NAVIGATION (/dashboard)
┌──────────────────────────┐
│    Dashboard Page        │
│                          │
│  [Charts] [Tables]       │
│                          │
│               [💬 Chat]  │ ◄─ FloatingChatButton STILL visible
└──────────────────────────┘

✅ Chat button persists
✅ Session ID unchanged in sessionStorage
✅ If chat was open, it stays open
✅ If chat was closed, it stays closed
✅ Message history preserved
```

### Scenario 2: Chat Session Across Routes

```
STEP 1: User on Home page (/)
┌──────────────────────────┐
│      Home Page           │
│               [💬 Chat]  │ ◄─ User clicks chat button
└──────────────────────────┘

STEP 2: Chat opens
┌──────────────────────────┐
│      Home Page           │
│            ┌──────────┐  │
│            │ EcoStep  │  │
│            │ Chat     │  │
│            │──────────│  │
│            │ User: Hi │  │
│            │ Bot: ...  │  │
│            │ [____][>]│  │
│            └──────────┘  │
└──────────────────────────┘
sessionStorage: sessionId = 'abc-123'

STEP 3: User navigates to /dashboard
┌──────────────────────────┐
│    Dashboard Page        │
│            ┌──────────┐  │
│            │ EcoStep  │  │
│            │ Chat     │  │ ◄─ Chat STAYS OPEN
│            │──────────│  │    (component didn't unmount)
│            │ User: Hi │  │
│            │ Bot: ...  │  │
│            │ [____][>]│  │
│            └──────────┘  │
└──────────────────────────┘
sessionStorage: sessionId = 'abc-123' (unchanged)

STEP 4: User closes chat, navigates to /analytics
┌──────────────────────────┐
│   Analytics Page         │
│                          │
│  [Charts]                │
│               [💬 Chat]  │ ◄─ Chat button visible (closed)
└──────────────────────────┘
sessionStorage: sessionId = 'abc-123' (preserved)

STEP 5: User reopens chat
┌──────────────────────────┐
│   Analytics Page         │
│            ┌──────────┐  │
│            │ EcoStep  │  │
│            │ Chat     │  │
│            │──────────│  │
│            │ User: Hi │  │ ◄─ Previous messages restored
│            │ Bot: ...  │  │    from backend using sessionId
│            │ [____][>]│  │
│            └──────────┘  │
└──────────────────────────┘
API Request: POST /api/chat { message: "...", sessionId: "abc-123" }
Backend: Retrieves conversation history for session 'abc-123'
```

---

## Multi-Tab Behavior

```
Tab 1                           Tab 2
┌─────────────────────┐        ┌─────────────────────┐
│  http://app/ (Home) │        │  http://app/ (Home) │
│                     │        │                     │
│  sessionStorage:    │        │  sessionStorage:    │
│  sessionId: 'AAA'   │        │  sessionId: 'BBB'   │
│                     │        │                     │
│  Messages:          │        │  Messages:          │
│  - User: Hello      │        │  - User: Status     │
│  - Bot: Hi there!   │        │  - Bot: Here's...   │
│                     │        │                     │
│          [💬 Chat]  │        │          [💬 Chat]  │
└─────────────────────┘        └─────────────────────┘
       ▲                              ▲
       │                              │
       └──── Independent ─────────────┘
             Sessions
```

**Key Points**:
- Each tab has its own sessionStorage (browser native behavior)
- Each tab creates a separate session with unique ID
- Tabs do NOT share chat history
- Closing one tab doesn't affect other tabs
- Each tab's session expires independently

---

## Session Lifecycle States

```
STATE 1: New User (No Session)
┌─────────────────────────────────┐
│  sessionStorage: empty          │
│  sessionId: null                │
│  Status: No active session      │
└─────────────────────────────────┘
         │
         │ User sends first message
         ▼
STATE 2: Session Created
┌─────────────────────────────────┐
│  sessionStorage: 'abc-123'      │
│  sessionId: 'abc-123'           │
│  Status: Active session         │
│  Backend: Session created       │
└─────────────────────────────────┘
         │
         │ User continues conversation
         │ navigates routes
         │ (30 minutes pass)
         ▼
STATE 3: Session Expired (Backend)
┌─────────────────────────────────┐
│  sessionStorage: 'abc-123'      │ ◄─ Client still has ID
│  sessionId: 'abc-123'           │
│  Status: Expired on backend     │
│  Backend: Session deleted       │
└─────────────────────────────────┘
         │
         │ User sends new message
         ▼
STATE 4: Session Recreated
┌─────────────────────────────────┐
│  sessionStorage: 'xyz-789'      │ ◄─ New session ID
│  sessionId: 'xyz-789'           │
│  Status: New active session     │
│  Backend: New session created   │
│  History: Empty (fresh start)   │
└─────────────────────────────────┘
         │
         │ User closes browser tab
         ▼
STATE 5: Session Cleared
┌─────────────────────────────────┐
│  sessionStorage: cleared        │ ◄─ Browser native behavior
│  sessionId: null                │
│  Status: No session             │
│  Backend: Session expires       │
└─────────────────────────────────┘
         │
         │ User reopens in new tab
         ▼
STATE 1 (Loop back to start)
```

---

## Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                          User Interaction                         │
└──────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│                    FloatingChatButton Component                   │
│  State: isExpanded, sessionId (via ChatInterface)                │
└──────────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
                    ▼                       ▼
        ┌───────────────────┐   ┌─────────────────────┐
        │   Open/Close      │   │   ChatInterface     │
        │   Button Click    │   │   Component         │
        └───────────────────┘   └─────────────────────┘
                                            │
                                            ▼
                        ┌───────────────────────────────────┐
                        │   Check sessionStorage            │
                        │   Key: 'ecostep_chat_session_id'  │
                        └───────────────────────────────────┘
                                            │
                            ┌───────────────┴───────────────┐
                            ▼                               ▼
                    ┌───────────────┐             ┌─────────────────┐
                    │  Session      │             │  No Session     │
                    │  Found        │             │  Found          │
                    │  sessionId: X │             │  sessionId: null│
                    └───────────────┘             └─────────────────┘
                            │                               │
                            └───────────────┬───────────────┘
                                            ▼
                            ┌─────────────────────────────┐
                            │   User sends message        │
                            └─────────────────────────────┘
                                            │
                                            ▼
                            ┌─────────────────────────────┐
                            │   API Call to Backend       │
                            │   POST /api/chat            │
                            │   {                         │
                            │     message: "...",         │
                            │     sessionId: "..." | null │
                            │   }                         │
                            └─────────────────────────────┘
                                            │
                                            ▼
                            ┌─────────────────────────────┐
                            │   Backend Response          │
                            │   {                         │
                            │     success: true,          │
                            │     response: "...",        │
                            │     sessionId: "...",       │
                            │     suggestions: [...]      │
                            │   }                         │
                            └─────────────────────────────┘
                                            │
                                            ▼
                            ┌─────────────────────────────┐
                            │   Update React State        │
                            │   - Add bot message         │
                            │   - Set sessionId           │
                            │   - Set suggestions         │
                            └─────────────────────────────┘
                                            │
                                            ▼
                            ┌─────────────────────────────┐
                            │   Persist to sessionStorage │
                            │   sessionStorage.setItem(   │
                            │     'ecostep_chat_session_id',│
                            │     sessionId               │
                            │   )                         │
                            └─────────────────────────────┘
                                            │
                                            ▼
                            ┌─────────────────────────────┐
                            │   User navigates to new     │
                            │   route (e.g., /dashboard)  │
                            └─────────────────────────────┘
                                            │
                                            ▼
                            ┌─────────────────────────────┐
                            │   FloatingChatButton        │
                            │   PERSISTS (no unmount)     │
                            │   sessionStorage UNCHANGED  │
                            │   Session continues ✓       │
                            └─────────────────────────────┘
```

---

## Visual Layout

### Desktop View (≥768px)

```
┌────────────────────────────────────────────────────────────┐
│  [Logo]  EcoStep Energy Monitoring     [Profile] [Logout] │ ◄─ Header/Nav
├────────────────────────────────────────────────────────────┤
│                                                            │
│                                                            │
│                     Page Content                           │
│                  (Home or Dashboard)                       │
│                                                            │
│                                                            │
│                                                            │
│                                                            │
│                                              ┌──────────┐  │
│                                              │ EcoStep  │  │
│                                              │ Chat     │  │
│                                              │──────────│  │
│                                              │ User: Hi │  │
│                                              │ Bot: ...  │  │
│                                              │ [____][>]│  │
│                                              └──────────┘  │
│                                                  ▲         │
│                                            400x600px       │
│                                            Fixed position  │
│                                            bottom: 24px    │
│                                            right: 24px     │
│                                            z-index: 10000  │
└────────────────────────────────────────────────────────────┘

OR (when closed):

┌────────────────────────────────────────────────────────────┐
│  [Logo]  EcoStep Energy Monitoring     [Profile] [Logout] │
├────────────────────────────────────────────────────────────┤
│                                                            │
│                                                            │
│                     Page Content                           │
│                  (Home or Dashboard)                       │
│                                                            │
│                                                            │
│                                                            │
│                                                            │
│                                                            │
│                                                            │
│                                                    [💬]    │ ◄─ Chat button
│                                                    60x60px │    Fixed position
│                                                    bottom: │    24px
│                                                    24px    │    right: 24px
│                                                            │    z-index: 9999
└────────────────────────────────────────────────────────────┘
```

### Mobile View (<768px)

```
Chat Closed:
┌──────────────────────┐
│  [≡]  EcoStep   [👤] │ ◄─ Mobile header
├──────────────────────┤
│                      │
│                      │
│   Page Content       │
│   (Scrollable)       │
│                      │
│                      │
│                      │
│                      │
│                      │
│               [💬]   │ ◄─ Chat button
│                      │    (bottom-right)
└──────────────────────┘

Chat Open (Full Screen):
┌──────────────────────┐
│ 🌱 EcoStep Chat  [X] │ ◄─ Chat header
├──────────────────────┤
│ User: Hello          │
│                      │
│ Bot: Hi! How can...  │
│                      │
│ User: Status?        │
│                      │
│ Bot: Here's the...   │
│                      │
│                      │
│                      │
├──────────────────────┤
│ [Type message...][>] │ ◄─ Input
└──────────────────────┘
(Full viewport height/width)
(Prevents body scroll)
```

---

## Summary

Task 18 successfully integrates FloatingChatButton at the App.tsx root level, ensuring:

✅ **Global Availability**: Chat appears on all routes without page-specific code
✅ **Session Persistence**: sessionStorage maintains session across navigation
✅ **Single Instance**: No duplicate chat buttons
✅ **Consistent UX**: Same chat experience everywhere
✅ **Performance**: Component persists, no unnecessary remounts
✅ **Accessibility**: Full keyboard support and ARIA labels
✅ **Responsive**: Desktop (floating) and mobile (full-screen) layouts

This architecture provides a robust, maintainable solution for global chat availability with seamless session management.
