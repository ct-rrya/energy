# Manual Test Checklist - Task 20.3: FloatingChatButton

**Test Date**: _____________  
**Tester**: _____________  
**Environment**: http://localhost:5174/  
**Backend**: http://localhost:3000

---

## Quick Test Checklist

### Visual Verification
- [ ] FloatingChatButton visible on Home page (bottom-right corner)
- [ ] Button has green/teal color (#89D7B7)
- [ ] Button has chat icon (speech bubble)
- [ ] Button has subtle pulse animation
- [ ] No embedded chat interface visible on the page itself

### Expand/Collapse Functionality
- [ ] Button can be clicked to expand chat
- [ ] Chat panel appears with smooth slide-up animation
- [ ] Panel size is 400x600px on desktop
- [ ] Panel has header with "EcoStep Chat" title and 🌱 logo
- [ ] Panel has close button (X) in top-right
- [ ] Chat can be closed via close button
- [ ] Chat can be closed via Escape key
- [ ] Button reappears when chat is closed

### Chat Functionality
- [ ] User can type in the text input field
- [ ] User can send messages by pressing Enter
- [ ] User can send messages by clicking Send button
- [ ] Shift+Enter creates a new line without sending
- [ ] User messages appear on the right side
- [ ] Loading/typing indicator appears while waiting
- [ ] Bot messages appear on the left side
- [ ] Messages receive responses from backend API
- [ ] Scroll automatically moves to latest message

### Session Persistence
- [ ] Chat can be closed and reopened
- [ ] Previous messages are still visible after reopening
- [ ] Session persists across open/close cycles
- [ ] Conversation context is maintained

### Keyboard Navigation
- [ ] Tab key reaches the floating button
- [ ] Button shows visible focus indicator (green outline)
- [ ] Enter key opens chat from button
- [ ] Space key opens chat from button
- [ ] Tab key navigates within chat panel (focus trap)
- [ ] Escape key closes chat
- [ ] Focus returns to button after closing

### Mobile Responsiveness (DevTools)
- [ ] Button is visible on mobile viewport (< 768px)
- [ ] Chat expands to full-screen on mobile
- [ ] Semi-transparent backdrop appears
- [ ] Body scroll is disabled when chat is open
- [ ] Chat is usable on small screens (iPhone 12, etc.)
- [ ] Close button is accessible on mobile

### Accessibility
- [ ] Screen reader announces button label correctly
- [ ] Screen reader announces chat opening/closing
- [ ] New messages are announced to screen reader
- [ ] ARIA labels are present on interactive elements
- [ ] Color contrast is sufficient (WCAG AA)
- [ ] Text is readable at 200% zoom

### No Embedded Chat Verification
- [ ] Inspect DOM: No chat-interface found on LandingPage
- [ ] Only FloatingChatButton exists in root App component
- [ ] ChatInterface only renders inside FloatingChatButton panel

### Error Handling
- [ ] Error messages display if backend is unavailable
- [ ] User-friendly error text (no stack traces)
- [ ] Retry option available on errors

### Performance
- [ ] Chat opens within 300ms (smooth animation)
- [ ] Messages send and receive within 2 seconds
- [ ] No visible lag when typing
- [ ] Smooth scroll behavior

---

## Detailed Test Results

### Test 1: Button Visibility
**Expected**: Green circular button at bottom-right  
**Actual**: _____________  
**Status**: ⏳ Pass / ❌ Fail  
**Notes**: _____________

### Test 2: Expand Chat
**Expected**: Panel slides up, 400x600px, with header  
**Actual**: _____________  
**Status**: ⏳ Pass / ❌ Fail  
**Notes**: _____________

### Test 3: Send Message
**Expected**: User message on right, bot response on left  
**Actual**: _____________  
**Status**: ⏳ Pass / ❌ Fail  
**Notes**: _____________

### Test 4: Session Persistence
**Expected**: Messages persist after reopening  
**Actual**: _____________  
**Status**: ⏳ Pass / ❌ Fail  
**Notes**: _____________

### Test 5: Keyboard Navigation
**Expected**: Tab, Enter, Space, Escape work correctly  
**Actual**: _____________  
**Status**: ⏳ Pass / ❌ Fail  
**Notes**: _____________

### Test 6: Mobile Responsive
**Expected**: Full-screen on mobile with backdrop  
**Actual**: _____________  
**Status**: ⏳ Pass / ❌ Fail  
**Notes**: _____________

### Test 7: Accessibility
**Expected**: Screen reader announces correctly  
**Actual**: _____________  
**Status**: ⏳ Pass / ❌ Fail  
**Notes**: _____________

### Test 8: No Embedded Chat
**Expected**: No chat-interface on LandingPage DOM  
**Actual**: _____________  
**Status**: ⏳ Pass / ❌ Fail  
**Notes**: _____________

---

## Browser Compatibility

### Desktop Browsers
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (if available)

### Mobile Browsers
- [ ] Chrome Mobile (Android)
- [ ] Safari Mobile (iOS)

---

## Issues Found

| # | Description | Severity | Screenshot/Steps |
|---|-------------|----------|------------------|
| 1 | | 🔴 High / 🟡 Medium / 🟢 Low | |
| 2 | | | |
| 3 | | | |

---

## Final Sign-Off

**All Critical Tests Passed**: ⏳ Yes / ❌ No  
**Deployment Approved**: ⏳ Yes / ❌ No  

**Comments**:
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________

**Tester Signature**: _____________  
**Date**: _____________
