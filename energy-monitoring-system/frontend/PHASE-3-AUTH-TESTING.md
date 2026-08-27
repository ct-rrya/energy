# Phase 3: Authentication Testing Guide

## Overview

This document provides step-by-step instructions for testing the complete authentication flow.

---

## Prerequisites

### 1. Start Backend Server

```bash
cd ../
npm run start:dev
```

Verify backend is running at: http://localhost:3000

### 2. Seed Admin Account (if not done)

```bash
npm run seed
```

Default credentials:
- Email: `admin@example.com`
- Password: Check `ADMIN_PASSWORD` in backend `.env`

### 3. Start Frontend Server

```bash
cd frontend
npm run dev
```

Frontend will be available at: http://localhost:5173

---

## Test Scenarios

### ✅ Test 1: Successful Login

**Steps:**
1. Navigate to http://localhost:5173
2. You should be redirected to `/login` (unauthenticated)
3. Enter valid credentials:
   - Email: `admin@example.com`
   - Password: Your admin password
4. Click "Sign In"

**Expected Results:**
- ✅ Form validates successfully
- ✅ Loading spinner shows on button
- ✅ Green success toast appears: "Login successful! Welcome back."
- ✅ Redirects to `/dashboard`
- ✅ Dashboard page displays with user name in sidebar
- ✅ No console errors

**What to Check:**
- Browser DevTools → Network tab → POST `/api/auth/login` returns 200
- Browser DevTools → Application → Local Storage:
  - `auth_token` contains JWT
  - `auth_user` contains user JSON

---

### ✅ Test 2: Failed Login - Invalid Credentials

**Steps:**
1. Navigate to http://localhost:5173/login
2. Enter invalid credentials:
   - Email: `admin@example.com`
   - Password: `wrongpassword`
3. Click "Sign In"

**Expected Results:**
- ✅ Form validates successfully (no field errors)
- ✅ Loading spinner shows briefly
- ✅ Red error toast appears: "Invalid email or password. Please try again."
- ✅ Stays on login page
- ✅ Form remains editable
- ✅ No authentication data stored

**What to Check:**
- Network tab → POST `/api/auth/login` returns 401
- Local Storage → No `auth_token` or `auth_user`

---

### ✅ Test 3: Field Validation

**Steps:**
1. Navigate to http://localhost:5173/login
2. Leave both fields empty
3. Click "Sign In"

**Expected Results:**
- ✅ Email error: "Email is required"
- ✅ Password error: "Password is required"
- ✅ No API call made
- ✅ Red border on both input fields

**Additional Tests:**
4. Enter invalid email: `notanemail`
   - ✅ Error: "Invalid email address"

5. Enter short password: `12345`
   - ✅ Error: "Password must be at least 6 characters"

6. Enter valid email, leave password empty
   - ✅ Only password shows error

---

### ✅ Test 4: Password Show/Hide Toggle

**Steps:**
1. Navigate to http://localhost:5173/login
2. Enter password: `mypassword`
3. Click the eye icon

**Expected Results:**
- ✅ Password becomes visible as plain text
- ✅ Eye icon changes to eye-off icon
4. Click eye-off icon
- ✅ Password becomes hidden again
- ✅ Eye-off icon changes back to eye icon

---

### ✅ Test 5: Page Refresh Preserves Authentication

**Steps:**
1. Log in successfully (Test 1)
2. Navigate to `/dashboard`
3. Press F5 (refresh page)

**Expected Results:**
- ✅ Page reloads
- ✅ Brief loading spinner shows
- ✅ Stays on `/dashboard` (doesn't redirect to login)
- ✅ User information still displayed
- ✅ No new login required

**What to Check:**
- Network tab → No POST `/api/auth/login` call
- Network tab → GET `/api/users/profile` called (validates token)
- Console → No errors

---

### ✅ Test 6: Protected Route Access (Unauthenticated)

**Steps:**
1. If logged in, log out first
2. In browser address bar, manually navigate to:
   - http://localhost:5173/dashboard
   - http://localhost:5173/sensors
   - http://localhost:5173/analytics

**Expected Results:**
- ✅ Immediately redirects to `/login`
- ✅ Does NOT show protected content
- ✅ No errors in console

---

### ✅ Test 7: Login Page Access (Authenticated)

**Steps:**
1. Log in successfully
2. In browser address bar, manually navigate to:
   - http://localhost:5173/login

**Expected Results:**
- ✅ Immediately redirects to `/dashboard`
- ✅ Does NOT show login form
- ✅ No errors in console

---

### ✅ Test 8: Logout Flow

**Steps:**
1. Log in successfully
2. Navigate to any protected page
3. Click "Logout" button in sidebar

**Expected Results:**
- ✅ Blue info toast appears: "Logged out successfully"
- ✅ Redirects to `/login`
- ✅ Login form is displayed
- ✅ Sidebar no longer visible

**What to Check:**
- Local Storage → `auth_token` removed
- Local Storage → `auth_user` removed
- Network tab → No API calls after logout

**Additional Test:**
4. Press browser back button
   - ✅ Cannot access protected pages
   - ✅ Redirects back to `/login`

---

### ✅ Test 9: Token Expiration Handling

**Note:** This test requires backend configuration or manual token manipulation.

**Option A: Wait for Token Expiration**
1. Log in successfully
2. Wait for JWT_EXPIRATION time (default: 7 days)
3. Try to access a protected page

**Option B: Manual Token Invalidation**
1. Log in successfully
2. Open DevTools → Application → Local Storage
3. Edit `auth_token` → Change any character
4. Refresh page or navigate to another protected route

**Expected Results:**
- ✅ Red error toast may appear (depending on implementation)
- ✅ Redirects to `/login`
- ✅ Authentication data cleared
- ✅ Must log in again

---

### ✅ Test 10: Network Error Handling

**Steps:**
1. Stop the backend server (Ctrl+C)
2. Navigate to http://localhost:5173/login
3. Enter valid credentials
4. Click "Sign In"

**Expected Results:**
- ✅ Loading spinner shows
- ✅ After timeout, red error toast: "Network error. Please check your connection."
- ✅ Stays on login page
- ✅ Form remains editable
- ✅ User can retry

**Recovery:**
5. Restart backend server
6. Click "Sign In" again
   - ✅ Should now work successfully

---

### ✅ Test 11: Multiple Tab Behavior

**Steps:**
1. Log in successfully in Tab 1
2. Open new tab (Tab 2)
3. Navigate to http://localhost:5173

**Expected Results (Tab 2):**
- ✅ Redirects to `/dashboard` (authenticated)
- ✅ User information displays correctly

**Continue:**
4. In Tab 1, click "Logout"
5. Switch to Tab 2
6. Try to navigate or make an API call

**Expected Results (Tab 2):**
- ✅ Next API call returns 401
- ✅ Redirects to `/login`
- ✅ Authentication cleared

---

### ✅ Test 12: Responsive Design

**Desktop (≥1024px):**
1. View login page at full width
   - ✅ Form centered with max-width
   - ✅ Comfortable spacing
   - ✅ Logo prominent

**Tablet (768px - 1023px):**
2. Resize browser to 800px width
   - ✅ Form adjusts nicely
   - ✅ Padding reduced appropriately
   - ✅ Still comfortable to use

**Mobile (<768px):**
3. Resize browser to 375px width (iPhone SE)
   - ✅ Form full width with small margins
   - ✅ Inputs large enough for touch
   - ✅ Text readable
   - ✅ Button full width

---

### ✅ Test 13: Accessibility

**Keyboard Navigation:**
1. Navigate to login page
2. Press Tab key repeatedly

**Expected Results:**
- ✅ Tab 1: Email input focused
- ✅ Tab 2: Password input focused
- ✅ Tab 3: Password toggle button focused
- ✅ Tab 4: Sign In button focused
- ✅ Enter key submits form
- ✅ Focus visible (outline/ring)

**Screen Reader:**
3. Enable screen reader (NVDA, JAWS, or VoiceOver)
4. Navigate login form

**Expected Results:**
- ✅ Labels read correctly
- ✅ Required fields announced
- ✅ Error messages announced
- ✅ Button states announced (loading/not loading)

---

### ✅ Test 14: Toast Notifications

**Test All Toast Types:**

1. **Success Toast** (Login)
   - ✅ Green background
   - ✅ Checkmark icon
   - ✅ "Login successful! Welcome back."
   - ✅ Auto-closes after 5 seconds
   - ✅ Can manually close with X button

2. **Error Toast** (Invalid credentials)
   - ✅ Red background
   - ✅ Alert icon
   - ✅ Error message displayed
   - ✅ Auto-closes after 5 seconds

3. **Info Toast** (Logout)
   - ✅ Blue background
   - ✅ Info icon
   - ✅ "Logged out successfully"
   - ✅ Auto-closes after 5 seconds

4. **Multiple Toasts**
   - Trigger multiple errors quickly
   - ✅ Toasts stack vertically
   - ✅ Each dismisses independently

---

### ✅ Test 15: Browser Compatibility

Test in multiple browsers:

**Chrome/Edge:**
- ✅ All features work
- ✅ Styles render correctly
- ✅ Animations smooth

**Firefox:**
- ✅ All features work
- ✅ Styles render correctly
- ✅ Password toggle works

**Safari:**
- ✅ All features work
- ✅ Styles render correctly
- ✅ No iOS-specific issues

---

## Performance Tests

### Test 16: Load Times

**Metrics to Check:**
- ✅ Login page loads in <1 second
- ✅ Login API call completes in <500ms
- ✅ Dashboard redirect is instant
- ✅ Token validation on refresh <300ms

**Tools:**
- Chrome DevTools → Network tab
- Chrome DevTools → Performance tab

---

## Security Checks

### ✅ Test 17: Token Security

**Check:**
1. ✅ Token stored in localStorage (not visible in URL)
2. ✅ Token not logged to console
3. ✅ Password not logged to console
4. ✅ Password field masked by default
5. ✅ No sensitive data in React DevTools

**Browser DevTools → Application:**
- ✅ `auth_token` is JWT format
- ✅ `auth_user` does NOT contain password

---

## Common Issues & Solutions

### Issue: "Network Error"

**Cause:** Backend not running
**Solution:** Start backend with `npm run start:dev`

### Issue: "Invalid email or password"

**Cause:** Admin not seeded or wrong password
**Solution:** Run `npm run seed` and check `.env`

### Issue: Infinite redirect loop

**Cause:** Token validation failing
**Solution:** Clear localStorage and try again

### Issue: Styles not working

**Cause:** Tailwind not compiled
**Solution:** Restart dev server

---

## Debug Mode

### Enable Verbose Logging

Add to browser console:
```javascript
localStorage.setItem('debug', 'auth:*')
```

### Check Auth State

In browser console:
```javascript
// Check if authenticated
console.log(localStorage.getItem('auth_token'))
console.log(localStorage.getItem('auth_user'))

// Clear auth
localStorage.removeItem('auth_token')
localStorage.removeItem('auth_user')
```

---

## Success Criteria

All tests must pass before proceeding to Dashboard implementation:

- ✅ Successful login works
- ✅ Failed login shows error
- ✅ Form validation works
- ✅ Page refresh preserves auth
- ✅ Protected routes secured
- ✅ Logout clears auth
- ✅ Token expiration handled
- ✅ Network errors handled
- ✅ Responsive design works
- ✅ Accessibility checks pass
- ✅ No TypeScript errors
- ✅ No console errors
- ✅ Build succeeds

---

## Next Steps

After all tests pass:
1. ✅ Mark Phase 3 as complete
2. ✅ Commit changes
3. ✅ Proceed to Phase 4: Dashboard Implementation

---

**Testing Status**: ⏳ Ready for Testing
**Last Updated**: Phase 3 Implementation Complete
