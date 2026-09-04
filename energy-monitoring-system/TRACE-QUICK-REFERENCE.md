# 🔍 Trace Logging Quick Reference Card

## Test Message
```
What is the total generated electricity today?
```

---

## Expected Trace Order

```
✅ [TRACE 1: INCOMING PAYLOAD] → Webhook receives event
✅ [TRACE 2: EVENT FILTER] → Event type identified (TEXT_MESSAGE)
✅ [MESSENGER SERVICE] handleMessage() → Message received
✅ [ROUTE COMMAND] → Routing to AI (conditions met)
✅ [AI HANDLER] → Calling Gemini
✅ [GEMINI] processQuery() → AI enabled check
✅ [TRACE 3: DB CONTEXT] → Fetch MongoDB data (2 queries)
✅ [TRACE 5: CALLING GEMINI] → Send request to Gemini API
✅ [TRACE 6: GEMINI RAW RESULT] → Receive AI response
✅ [AI HANDLER] → Response received
✅ [TRACE 7: SENDING TO META] → Send to user
✅ [TRACE 8: META RESPONSE] → 200 OK
```

---

## Common Failure Points

| Last Trace | Issue | Quick Fix |
|------------|-------|-----------|
| **None** | Webhook not working | Check ngrok + Meta config |
| **TRACE 1** | Controller crash | Check logs for exception |
| **TRACE 2 DROPPED** | Echo/delivery/read | Normal - these are skipped |
| **TRACE 2 ✅** but stops | Service not called | Check injection |
| **ROUTE COMMAND NOT MET** | AI disabled | Check `.env` API key |
| **TRACE 3** hangs | MongoDB timeout | Check connection string |
| **TRACE 4 NOT configured** | Missing API key | Add to `.env` |
| **TRACE 5** error | Gemini API fail | Check key validity |
| **TRACE 6 NOT STOP** | Safety block | Content flagged |
| **TRACE 7** error | Meta API reject | Check access token |

---

## Start Testing

```bash
# 1. Build
npm run build

# 2. Start server  
npm run start:dev

# 3. Look for this in logs:
[TRACE 4: API KEY VERIFICATION] ✅ API key detected
[GEMINI CONSTRUCTOR] ✅ Gemini AI Service initialized successfully

# 4. Send test message via Messenger

# 5. Watch logs - find where it stops
```

---

## Success Indicators

✅ **Constructor logs:**
```
[GEMINI CONSTRUCTOR] ✅ Gemini AI Service initialized successfully
[GEMINI CONSTRUCTOR]    Model: gemini-3.6-flash
[GEMINI CONSTRUCTOR]    Status: ENABLED
```

✅ **Message processing:**
```
[ROUTE COMMAND] ✅ CONDITIONS MET - Routing to AI natural language handler
```

✅ **Database:**
```
[TRACE 3: DB CONTEXT] ✅ Database queries completed in 83ms
```

✅ **Gemini API:**
```
[TRACE 5: CALLING GEMINI] ✅ API call completed in 2345ms
[TRACE 6: GEMINI RAW RESULT] ✅ Response completed normally (STOP)
```

✅ **Meta API:**
```
[TRACE 8: META RESPONSE] ✅ Message sent successfully
[TRACE 8: META RESPONSE]    HTTP Status: 200 OK
```

---

## File Locations

- Controller: `src/messenger/messenger.controller.ts`
- Service: `src/messenger/messenger.service.ts`
- AI Service: `src/messenger/gemini-ai.service.ts`
- Config: `.env`

---



---

## Model Changed

❌ **Old:** `gemini-2.5-flash` (deprecated - returns 404)  
✅ **New:** `gemini-3.6-flash` (current)

---

## Detailed Guides

- 📖 `COMPREHENSIVE-TRACE-LOGGING-GUIDE.md` - Full trace details
- ✅ `INSTRUMENTATION-COMPLETE.md` - What was changed
- 🧪 `test-ai-diagnosis.js` - Standalone API key test

---

**The logs will tell you exactly where it fails!** 🎯
