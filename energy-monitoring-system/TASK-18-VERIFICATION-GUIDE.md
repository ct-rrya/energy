# Task 18.3 Verification Guide: FloatingChatButton Testing

## Overview
This guide provides step-by-step instructions to verify that the FloatingChatButton component works correctly across all routes with proper session persistence.

## Prerequisites
- Both backend and frontend servers must be running
- Backend: `npm run start:dev` from project root
- Frontend: `npm run dev` from frontend directory

## Test Cases

### Test Case 1: Chat Button Appears on Home Route (/)

**Steps:**
1. Navigate to `http://localhost:5173/` (or your frontend URL)
2. Verify the floating chat button appears in the bottom-right corner
3. Verify the button displays the chat icon (speech bubble)
4. Verify the button uses EcoStep green color (#89D7B7)

**Expected Result:**
✅ Floating chat button is visible and properly styled on the Home page

---

### Test Case 2: Chat Button Appears on Dashboard Routes (/dashboard/*)

**Steps:**
1. Navigate to `http://localhost:5173/dashboard` (or your dashboard URL)
2. Verify the floating chat button appears in the bottom-right corner
3. Navigate to sub-routes: `/dashboard/analytics`, `/dashboard/devices`, `/dashboard/reports`, `/dashboard/settings`
4. Verify the button remains visible on all dashboard sub-routes

**Expected Result:**
✅ Floating chat button is visible on all dashboard routes

---

### Test Case 3: Chat Expands and Functions Correctly

**Steps:**
1. Click the floating chat button
2. Verify the chat panel expands smoothly with slide-up animation
3. Verify the chat panel displays:
   - Header with "EcoStep Chat" and EcoStep logo (🌱)
   - Close button (X) in the header
   - Chat interface with input field and send button
4. Type a message (e.g., "status") and send
5. Verify the message appears as a user message (right-aligned, dark background #1A312C)
6. Verify a bot response appears (left-aligned, green background #428475)
7. Click the close button (X) or press Escape
8. Verify the chat panel collapses smoothly

**Expected Result:**
✅ Chat expands, functions correctly, and collapses as expected

---

### Test Case 4: Session Persistence Across Route Navigation

**Steps:**
1. From the Home page (`/`), click the floating chat button to open the chat
2. Send a message (e.g., "Hello, what can you do?")
3. Wait for the bot response
4. Navigate to `/dashboard` (keep the chat panel open)
5. Verify the chat panel remains open with the conversation history intact
6. Send another message (e.g., "status")
7. Navigate back to `/` (Home)
8. Verify the chat panel still shows the full conversation history (both messages)

**Expected Result:**
✅ Chat conversation persists when navigating between routes
✅ Session ID is maintained in sessionStorage

---

### Test Case 5: Session Persistence After Collapse/Expand

**Steps:**
1. Open the chat and send a few messages to build conversation history
2. Close the chat panel (click X or press Escape)
3. Navigate to a different route (e.g., from `/` to `/dashboard`)
4. Re-open the chat by clicking the floating button
5. Verify all previous messages are still visible

**Expected Result:**
✅ Conversation history persists across collapse/expand cycles
✅ Conversation history persists across route changes

---

### Test Case 6: No Duplicate Chat Instances

**Steps:**
1. Navigate to Home page (`/`)
2. Count the number of floating chat buttons visible (should be 1)
3. Open browser DevTools → Elements tab
4. Search for `id="floating-chat-panel"` or search for `FloatingChatButton`
5. Verify only ONE instance exists in the DOM
6. Navigate to `/dashboard` and repeat steps 2-5

**Expected Result:**
✅ Only one floating chat button exists at any time
✅ No duplicate chat panels in the DOM

---

### Test Case 7: Session Persistence in sessionStorage

**Steps:**
1. Open the chat and send a message
2. Open browser DevTools → Application tab → Session Storage
3. Find the key `ecostep_chat_session_id`
4. Verify it contains a valid UUID value (e.g., `a7b3c9d2-1234-5678-90ab-cdef12345678`)
5. Copy the UUID value
6. Navigate to a different route
7. Check sessionStorage again and verify the UUID is unchanged
8. Close the chat and reopen it
9. Verify the UUID remains the same
10. Refresh the page (F5)
11. Verify the UUID persists after page refresh

**Expected Result:**
✅ sessionId is stored in sessionStorage
✅ sessionId persists across navigation
✅ sessionId persists across page refreshes
✅ sessionId is cleared only when browser session ends (browser/tab close)

---

### Test Case 8: Responsive Behavior on Mobile

**Steps:**
1. Open DevTools → Toggle device toolbar (Ctrl+Shift+M)
2. Select a mobile device (e.g., iPhone 12, Galaxy S20)
3. Verify the floating button is visible and touch-friendly (min 44x44px)
4. Click to open the chat
5. Verify the chat panel becomes full-screen on mobile
6. Send a message and verify functionality works
7. Close the chat
8. Navigate between routes and verify button remains accessible

**Expected Result:**
✅ Chat button is touch-friendly on mobile
✅ Chat panel is full-screen on mobile devices
✅ All functionality works on mobile viewport

---

### Test Case 9: Keyboard Accessibility

**Steps:**
1. Navigate to Home page
2. Press Tab repeatedly until focus reaches the floating chat button
3. Verify the button shows a visible focus indicator (outline)
4. Press Enter or Space to open the chat
5. Verify focus moves to the first interactive element in the chat (input field)
6. Press Tab and verify focus moves through chat elements (input → send button → close button)
7. Press Escape to close the chat
8. Verify focus returns to the floating button

**Expected Result:**
✅ Chat button is keyboard accessible
✅ Focus management works correctly
✅ Escape key closes the chat
✅ All interactive elements are reachable via keyboard

---

### Test Case 10: Screen Reader Accessibility

**Steps:**
1. Enable screen reader (NVDA on Windows, VoiceOver on Mac)
2. Navigate to the floating chat button
3. Verify screen reader announces: "Open chat assistant to get help with energy monitoring"
4. Activate the button
5. Verify screen reader announces: "Chat assistant opened. You can now ask questions..."
6. Navigate through chat elements and verify proper labels are announced
7. Send a message and verify new bot messages are announced
8. Close the chat and verify closure is announced

**Expected Result:**
✅ All interactive elements have proper ARIA labels
✅ State changes are announced to screen readers
✅ Chat is fully usable with screen reader

---

## Automated Verification (Optional)

You can verify the implementation programmatically:

### Check sessionStorage Persistence
```javascript
// In browser console:
// 1. Check if sessionId exists
console.log('Session ID:', sessionStorage.getItem('ecostep_chat_session_id'));

// 2. After sending a message, verify it's set
// Expected: UUID string like "a7b3c9d2-1234-5678-90ab-cdef12345678"

// 3. Navigate and check again - should be the same
```

### Check Component Instance Count
```javascript
// In browser console:
document.querySelectorAll('[id^="floating-chat"]').length;
// Expected: 1 (only one instance)
```

### Check z-index Stacking
```javascript
// In browser console:
const button = document.querySelector('button[aria-label*="Open chat"]');
console.log('Button z-index:', window.getComputedStyle(button).zIndex);
// Expected: 9999 or higher
```

---

## Known Issues / Edge Cases

### Issue: Session clears unexpectedly
**Cause:** sessionStorage is cleared when browser/tab closes or user clears browsing data
**Expected Behavior:** This is correct - sessions should not persist across browser sessions

### Issue: Chat appears behind other elements
**Cause:** Another element has higher z-index than 9999
**Solution:** Inspect competing elements and adjust z-index if needed

### Issue: Chat doesn't appear on a specific route
**Cause:** Route might be unmounting/remounting App.tsx
**Solution:** Verify router configuration and ensure FloatingChatButton is outside RouterProvider

---

## Success Criteria

Task 18.3 is considered **COMPLETE** when all of the following are verified:

- ✅ Chat button appears on Home route (/)
- ✅ Chat button appears on all Dashboard routes (/dashboard/*)
- ✅ Chat expands and collapses smoothly
- ✅ Conversation persists when navigating between routes
- ✅ Conversation persists after collapse/expand
- ✅ Only one chat instance exists (no duplicates)
- ✅ sessionId is stored and persists in sessionStorage
- ✅ Mobile responsive behavior works correctly
- ✅ Keyboard navigation works correctly
- ✅ Screen reader accessibility works correctly

---

## Troubleshooting

### Chat button doesn't appear
1. Check browser console for errors
2. Verify backend is running on correct port
3. Verify CORS is configured correctly
4. Check that FloatingChatButton is imported and rendered in App.tsx

### Session doesn't persist
1. Check sessionStorage in DevTools → Application tab
2. Verify key name is exactly `ecostep_chat_session_id`
3. Check that sessionStorage is not being cleared by other code
4. Verify the ChatInterface component's useEffect hooks are running

### Chat appears multiple times
1. Check that FloatingChatButton is only rendered once in App.tsx
2. Verify no other components are rendering FloatingChatButton
3. Check React DevTools for duplicate component instances

---

## Reporting Results

After completing all test cases, summarize results:

```
Task 18.3 Verification Results:
- Test Case 1 (Home route): ✅ PASS / ❌ FAIL
- Test Case 2 (Dashboard routes): ✅ PASS / ❌ FAIL
- Test Case 3 (Expand/function): ✅ PASS / ❌ FAIL
- Test Case 4 (Route persistence): ✅ PASS / ❌ FAIL
- Test Case 5 (Collapse/expand persistence): ✅ PASS / ❌ FAIL
- Test Case 6 (No duplicates): ✅ PASS / ❌ FAIL
- Test Case 7 (sessionStorage): ✅ PASS / ❌ FAIL
- Test Case 8 (Mobile responsive): ✅ PASS / ❌ FAIL
- Test Case 9 (Keyboard accessibility): ✅ PASS / ❌ FAIL
- Test Case 10 (Screen reader): ✅ PASS / ❌ FAIL

Overall Status: ✅ ALL TESTS PASSED / ❌ SOME TESTS FAILED
```

If any tests fail, document the specific issue and file a bug report with reproduction steps.
