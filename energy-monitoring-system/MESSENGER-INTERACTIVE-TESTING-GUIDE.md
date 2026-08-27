# Messenger Interactive Features - Testing Guide

**Quick reference for testing the enhanced Messenger bot**

---

## 🚀 Quick Start

### 1. Start Application

```bash
npm run start:dev
```

**Watch for these logs:**
```
Initializing Messenger Bot features...
✅ Persistent menu configured successfully
✅ Get Started button configured successfully
✅ Greeting text configured successfully
✅ Messenger Bot initialized successfully
```

### 2. Open Messenger

- Go to your Facebook Page
- Click "Send Message" button
- OR open https://m.me/YOUR_PAGE_USERNAME

---

## ✅ Test Checklist

### **Test 1: Get Started Button**

**Steps:**
1. Open Messenger as a NEW user (or delete conversation)
2. Look for "Get Started" button
3. Click "Get Started"

**Expected Result:**
```
👋 Welcome to EcoStep!

Monitor your piezoelectric energy generation
system in real time.

Choose an option below to get started:

[📊 System Status] [⚡ Energy] [🔋 Battery]
[📈 Analytics] [🌱 Impact] [ℹ️ Help]
```

✅ **Pass:** Welcome message appears with 6 Quick Reply buttons  
❌ **Fail:** No buttons or different message

---

### **Test 2: Welcome Message**

**Steps:**
1. Type: `hello`
2. OR Type: `hi`
3. OR Type: `start`

**Expected Result:**
Same welcome message with Quick Replies

✅ **Pass:** Welcome message with buttons appears  
❌ **Fail:** Plain text response without buttons

---

### **Test 3: Quick Replies - Status**

**Steps:**
1. Type: `status` OR tap **📊 System Status** button
2. Read the response
3. Look at bottom of message

**Expected Result:**
```
📊 Energy System Status
[data...]

[📅 Today's Energy] [🔋 Battery]
[📈 Analytics] [🏠 Main Menu]
```

✅ **Pass:** Status info + 4 Quick Reply buttons  
❌ **Fail:** Status info without buttons

---

### **Test 4: Quick Reply Navigation**

**Steps:**
1. From status response, tap **📅 Today's Energy**
2. Read today's report
3. Tap **📅 This Week** button
4. Read week's report
5. Tap **📆 This Month** button

**Expected Result:**
Each screen shows:
- Relevant data
- 4 new Quick Reply buttons
- Smooth navigation flow

✅ **Pass:** Navigation works, buttons change contextually  
❌ **Fail:** Buttons missing or navigation breaks

---

### **Test 5: Persistent Menu**

**Steps:**
1. Look for menu icon (☰) in message composer
2. Tap the menu icon
3. View available options

**Expected Menu:**
```
📊 System Status
⚡ Energy
🔋 Battery
📈 Analytics
🌱 Environmental Impact
⚙️ About EcoStep
```

✅ **Pass:** Menu appears with 6 options  
❌ **Fail:** Menu missing or different options

---

### **Test 6: Persistent Menu - Selections**

**Steps:**
1. Open Persistent Menu
2. Select **⚡ Energy**
3. Verify energy status appears with Quick Replies
4. Open menu again
5. Select **🔋 Battery**
6. Verify battery status appears with Quick Replies

**Expected Result:**
Each menu selection:
- Triggers correct command
- Shows relevant data
- Includes Quick Reply buttons

✅ **Pass:** All menu items work  
❌ **Fail:** Menu items don't respond or show wrong data

---

### **Test 7: Analytics Button Template**

**Steps:**
1. Type: `analytics` OR tap **📈 Analytics** from menu
2. Look for button template

**Expected Result:**
```
📈 Analytics Menu

Choose a time period to view:

[📅 Today] [📅 This Week] [📆 This Month]
```

✅ **Pass:** 3 buttons in structured template  
❌ **Fail:** Plain text or no buttons

---

### **Test 8: Button Template Interaction**

**Steps:**
1. From Analytics Menu, tap **📅 Today**
2. Verify today's report appears
3. Type `analytics` again
4. Tap **📅 This Week**
5. Verify week's report appears

**Expected Result:**
Each button triggers:
- Correct time period report
- Quick Reply buttons for navigation

✅ **Pass:** Buttons work, reports show correctly  
❌ **Fail:** Buttons don't work or wrong data

---

### **Test 9: Backward Compatibility - Text Commands**

**Steps:**
Test each text command:

```
status
energy
battery
today
week
month
peak
impact
savings
help
about
subscribe
unsubscribe
```

**Expected Result:**
- Each command works
- Returns correct data
- Includes Quick Reply buttons

✅ **Pass:** All text commands functional  
❌ **Fail:** Any command fails or missing buttons

---

### **Test 10: Unknown Command**

**Steps:**
1. Type: `xyz123`
2. Type: `random`
3. Type: `test`

**Expected Result:**
```
🤔 Sorry, I don't recognize that command.

Try typing one of these:

• help
• status
• battery
• energy

💡 Type "help" to see all available commands

[ℹ️ Help] [📊 Status] [⚡ Energy] [🏠 Main Menu]
```

✅ **Pass:** Helpful error with Quick Replies  
❌ **Fail:** Error without recovery options

---

### **Test 11: Quick Reply Disappearance**

**Steps:**
1. Send any command that returns Quick Replies
2. Tap one of the Quick Reply buttons
3. Look at previous message

**Expected Result:**
- Quick Replies disappear after selection
- Only the last message has buttons
- Chat history looks clean

✅ **Pass:** Old buttons disappear  
❌ **Fail:** Multiple sets of buttons visible

---

### **Test 12: Context-Appropriate Buttons**

**Steps:**
Check that Quick Replies make sense:

| After Command | Should Suggest |
|---------------|----------------|
| Status | Today, Battery, Analytics, Menu |
| Today | Week, Month, Status, Menu |
| Energy | Battery, Analytics, Status, Menu |
| Impact | Savings, Status, Analytics, Menu |

**Expected Result:**
Each command suggests logical next actions

✅ **Pass:** Suggestions are contextual  
❌ **Fail:** Suggestions don't make sense

---

## 🔧 Debugging Tests

### **Test 13: Check Persistent Menu API**

```bash
curl -X GET \
  "https://graph.facebook.com/v18.0/me/messenger_profile?fields=persistent_menu,get_started,greeting&access_token=YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "data": [{
    "persistent_menu": [
      {
        "locale": "default",
        "composer_input_disabled": false,
        "call_to_actions": [...]
      }
    ],
    "get_started": {
      "payload": "GET_STARTED"
    },
    "greeting": [
      {
        "locale": "default",
        "text": "Welcome to EcoStep! 🌞..."
      }
    ]
  }]
}
```

✅ **Pass:** All 3 features configured  
❌ **Fail:** Missing features or errors

---

### **Test 14: Check Application Logs**

**Steps:**
1. Start app: `npm run start:dev`
2. Watch console output
3. Send a message in Messenger
4. Check logs

**Expected Logs:**
```
Initializing Messenger Bot features...
✅ Persistent menu configured successfully
✅ Get Started button configured successfully
✅ Greeting text configured successfully
✅ Messenger Bot initialized successfully

Message from 123456789: hello
Message sent to 123456789
```

✅ **Pass:** Clean logs, no errors  
❌ **Fail:** Errors or missing confirmations

---

### **Test 15: Webhook Events**

**Steps:**
1. Monitor application logs
2. In Messenger, tap a Quick Reply button
3. Check logs for event type

**Expected Log:**
```
Quick reply from 123456789: status
Message sent to 123456789
```

✅ **Pass:** Quick reply event detected  
❌ **Fail:** Event not detected or error

---

## 🎭 Demo Scenario

**Perfect for capstone presentation:**

1. **Open Messenger** (projected on screen)
2. **Show Get Started** - "Notice the welcome button"
3. **Click Get Started** - "See the interactive menu"
4. **Tap 📊 System Status** - "All data in real-time"
5. **Show Quick Replies** - "Navigation is just a tap"
6. **Open Persistent Menu** - "Always accessible from here"
7. **Select 📈 Analytics** - "Structured options"
8. **Tap Today** - "Instant detailed report"
9. **Type 'battery'** - "Still works with text too"
10. **Show buttons again** - "Every response guides the user"

**Key Points to Highlight:**
- 🚀 Modern interactive UI
- 👆 Minimal typing required
- 🧭 Always guided
- 📱 Professional experience
- ⚡ Real-time data
- 🔄 Works both ways (text & buttons)

---

## 🐛 Common Issues & Fixes

### **Issue:** Persistent Menu Not Showing

**Fix 1:** Clear Messenger cache
```
Settings → Apps → Messenger → Clear Data
```

**Fix 2:** Re-initialize menu
```bash
# Restart application
npm run start:dev
```

**Fix 3:** Manually set menu
```bash
curl -X DELETE \
  "https://graph.facebook.com/v18.0/me/messenger_profile?fields=persistent_menu&access_token=YOUR_TOKEN"

# Then restart app to reinitialize
```

---

### **Issue:** Quick Replies Not Appearing

**Check:**
1. Is `sendMessage()` called with `quickReplies` parameter?
2. Are there more than 13 buttons? (Facebook limit)
3. Check logs for API errors

**Fix:**
```typescript
// Verify this pattern is used:
await this.sendMessage(senderId, response, quickReplies);
```

---

### **Issue:** Buttons Not Responding

**Check:**
1. Webhook receiving postback events?
2. Payload matches case in `routeCommand()`?
3. No errors in logs?

**Fix:**
```typescript
// Verify payload handling:
case 'status':  // Must match button payload
  await this.handleStatusCommand(senderId);
  break;
```

---

### **Issue:** Duplicate Responses

**Check:**
1. Is command handled multiple times?
2. Are there duplicate cases in switch statement?

**Fix:**
Ensure each command only has one handler

---

## ✅ Success Criteria

**All Tests Pass When:**

✅ Get Started button works  
✅ Welcome message has Quick Replies  
✅ All commands show Quick Replies  
✅ Persistent Menu appears  
✅ All menu items work  
✅ Button templates display correctly  
✅ Text commands still work  
✅ Navigation is smooth  
✅ Buttons disappear after use  
✅ Context makes sense  
✅ No errors in logs  
✅ Backward compatible  

---

## 📊 Test Results Template

```
Date: __________
Tester: __________

Test 1: Get Started            [ ] Pass [ ] Fail
Test 2: Welcome Message         [ ] Pass [ ] Fail
Test 3: Quick Replies - Status  [ ] Pass [ ] Fail
Test 4: Navigation Flow         [ ] Pass [ ] Fail
Test 5: Persistent Menu         [ ] Pass [ ] Fail
Test 6: Menu Selections         [ ] Pass [ ] Fail
Test 7: Analytics Template      [ ] Pass [ ] Fail
Test 8: Button Interaction      [ ] Pass [ ] Fail
Test 9: Text Commands           [ ] Pass [ ] Fail
Test 10: Unknown Command        [ ] Pass [ ] Fail
Test 11: Button Cleanup         [ ] Pass [ ] Fail
Test 12: Context Relevance      [ ] Pass [ ] Fail

Overall Result: [ ] PASS [ ] FAIL

Notes:
_________________________________
_________________________________
_________________________________
```

---

## 🎯 Ready for Demonstration!

All interactive features are implemented and ready for testing. Follow this guide to verify everything works perfectly before your capstone presentation.

**Good luck!** 🚀
