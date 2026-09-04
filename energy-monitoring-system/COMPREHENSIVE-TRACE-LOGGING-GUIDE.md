# 🔍 Comprehensive AI Pipeline Trace Logging

## Overview

All three critical files have been instrumented with **8 trace points** to diagnose exactly where the AI integration is failing.

## ✅ Files Modified

1. **`src/messenger/messenger.controller.ts`** - Webhook entry + event filtering
2. **`src/messenger/messenger.service.ts`** - Message routing + Meta API dispatch
3. **`src/messenger/gemini-ai.service.ts`** - AI initialization + processing + database

## 📊 Trace Points (in execution order)

| # | Trace Point | Location | What It Shows |
|---|-------------|----------|---------------|
| **1** | `[TRACE 1: INCOMING PAYLOAD]` | Controller | Full webhook event from Meta |
| **2** | `[TRACE 2: EVENT FILTER]` | Controller | Event type filtering (echo, delivery, read) |
| **3** | `[TRACE 3: DB CONTEXT]` | GeminiAI Service | Database queries before AI call |
| **4** | `[TRACE 4: API KEY VERIFICATION]` | GeminiAI Service | API key presence, length, prefix |
| **5** | `[TRACE 5: CALLING GEMINI]` | GeminiAI Service | Request to Gemini API |
| **6** | `[TRACE 6: GEMINI RAW RESULT]` | GeminiAI Service | Raw response + safety checks |
| **7** | `[TRACE 7: SENDING TO META]` | Messenger Service | Outgoing message payload |
| **8** | `[TRACE 8: META RESPONSE]` | Messenger Service | Meta API response status |

---

## 🧪 How to Test

### Step 1: Restart the Server
```bash
npm run start:dev
```

### Step 2: Send Test Message
Via Facebook Messenger, send:
```
What is the total generated electricity today?
```

### Step 3: Monitor Logs
Watch your terminal/console for trace markers.

---

## 📋 Expected Log Sequence (Success Case)

```log
═══════════════════════════════════════════════════════
[TRACE 1: INCOMING PAYLOAD] Full event object:
{
  "sender": { "id": "123456789" },
  "recipient": { "id": "987654321" },
  "timestamp": 1234567890,
  "message": {
    "mid": "m_xxx",
    "text": "What is the total generated electricity today?"
  }
}
[TRACE 1: INCOMING PAYLOAD] Sender ID: 123456789
═══════════════════════════════════════════════════════

[TRACE 2: EVENT FILTER] Checking event type...
[TRACE 2: EVENT FILTER] ✅ Event passed all filter checks
[TRACE 2: EVENT FILTER] Event type: TEXT_MESSAGE
[TRACE 2: EVENT FILTER] 📩 Text message from 123456789: "What is the total generated electricity today?"
[TRACE 2: EVENT FILTER]    Message length: 47 characters
[TRACE 2: EVENT FILTER] ✅ Passing to MessengerService.handleMessage()...

═══════════════════════════════════════════════════════
[MESSENGER SERVICE] handleMessage() called
[MESSENGER SERVICE]    Sender ID: 123456789
[MESSENGER SERVICE]    Message text: "What is the total generated electricity today?"
[MESSENGER SERVICE]    Message length: 47 characters
[MESSENGER SERVICE]    Normalized command: "what is the total generated electricity today?"
[MESSENGER SERVICE]    Original text preserved for AI routing
[MESSENGER SERVICE] Calling routeCommand()...

───────────────────────────────────────────────────────
[ROUTE COMMAND] Command received: "what is the total generated electricity today?"
[ROUTE COMMAND] Original text: "What is the total generated electricity today?"
[ROUTE COMMAND] Has originalText: true
[ROUTE COMMAND] AI enabled: true

[ROUTE COMMAND] ═══════════════════════════════════════
[ROUTE COMMAND] DEFAULT CASE - No predefined command matched
[ROUTE COMMAND] Checking AI routing conditions...
[ROUTE COMMAND]    ✓ originalText exists: true
[ROUTE COMMAND]    ✓ originalText value: "What is the total generated electricity today?"
[ROUTE COMMAND]    ✓ AI service enabled: true
[ROUTE COMMAND] ✅ CONDITIONS MET - Routing to AI natural language handler

═══════════════════════════════════════════════════════
[AI HANDLER] handleNaturalLanguageQuery() called
[AI HANDLER]    Sender ID: 123456789
[AI HANDLER]    User message: "What is the total generated electricity today?"
[AI HANDLER]    Message length: 47 characters
[AI HANDLER] Calling GeminiAIService.processQuery()...

═══════════════════════════════════════════════════════
[GEMINI] processQuery() called
[GEMINI]    User message: "What is the total generated electricity today?"
[GEMINI]    Message length: 47 characters
[GEMINI] Checking AI initialization status...
[GEMINI]    isEnabled: true
[GEMINI]    model exists: true
[GEMINI] ✅ AI is enabled and ready

[TRACE 3: DB CONTEXT] ═══════════════════════════════════
[TRACE 3: DB CONTEXT] Fetching energy data from MongoDB...
[TRACE 3: DB CONTEXT] Starting fetchEnergyData()...
[TRACE 3: DB CONTEXT] [1/2] Querying EnergyService.getTodayEnergyTotal()...
[TRACE 3: DB CONTEXT] [1/2] ✅ Completed in 45ms
[TRACE 3: DB CONTEXT] [1/2] Result: {"totalPower":127.5,"avgPower":12.3,"maxPower":45.2,"count":234}...
[TRACE 3: DB CONTEXT] [2/2] Querying AnalyticsService.getDailySummary()...
[TRACE 3: DB CONTEXT] [2/2] ✅ Completed in 38ms
[TRACE 3: DB CONTEXT] [2/2] Result: {"totalEnergyKWh":0.1275,"peakPowerW":45.2,"avgPowerW":12.3}...
[TRACE 3: DB CONTEXT] ✅ Data compilation complete
[TRACE 3: DB CONTEXT] Combined data structure:
{
  "timestamp": "2026-09-04T10:30:45.123Z",
  "today": {
    "totalEnergyWh": 127.5,
    "avgPowerW": 12.3,
    "maxPowerW": 45.2,
    "readingCount": 234
  },
  "analytics": {
    "totalEnergyKWh": 0.1275,
    "peakPowerW": 45.2,
    "avgPowerW": 12.3,
    "date": "2026-09-04"
  },
  "status": "ok"
}

[TRACE 3: DB CONTEXT] ✅ Database queries completed in 83ms
[TRACE 3: DB CONTEXT]    Data status: ok
[TRACE 3: DB CONTEXT] Data sample (first 200 chars):
{"timestamp":"2026-09-04T10:30:45.123Z","today":{"totalEnergyWh":127.5,"avgPowerW":12.3,"maxPowerW":45.2,"readingCount":234},"analytics":{"totalEnergyKWh":0.1275,"peakPowerW":45.2,"avgPowerW":12.3,...

[GEMINI] Prompt constructed (1234 characters)

[TRACE 5: CALLING GEMINI] ═══════════════════════════════
[TRACE 5: CALLING GEMINI] Sending request to Gemini API...
[TRACE 5: CALLING GEMINI]    Model: gemini-3.6-flash
[TRACE 5: CALLING GEMINI]    Prompt length: 1234 characters
[TRACE 5: CALLING GEMINI] Prompt preview (first 300 chars):
**REAL-TIME ECOSTEP DATA FROM MONGODB DATABASE:**

```json
{
  "timestamp": "2026-09-04T10:30:45.123Z",
  "today": {
    "totalEnergyWh": 127.5,
    "avgPowerW": 12.3,
    "maxPowerW": 45.2,
    "readingCount": 234
  },
  "analytics": {
    "totalEnergyKWh": 0.1275,
    "peakPowerW":...
[TRACE 5: CALLING GEMINI] System instruction: You are EcoStep AI, an intelligent assistant for the EcoStep piezoelectric energy monitoring...

[TRACE 5: CALLING GEMINI] ✅ API call completed in 2345ms

[TRACE 6: GEMINI RAW RESULT] ═══════════════════════════
[TRACE 6: GEMINI RAW RESULT] Raw response object keys: [ 'candidates', 'usageMetadata' ]
[TRACE 6: GEMINI RAW RESULT]    Candidates count: 1
[TRACE 6: GEMINI RAW RESULT]    Finish reason: STOP
[TRACE 6: GEMINI RAW RESULT] ✅ Response completed normally (STOP)
[TRACE 6: GEMINI RAW RESULT]    Response text length: 156 characters
[TRACE 6: GEMINI RAW RESULT]    Response preview (first 200 chars):
⚡ Today you've generated 127.5Wh of clean energy! That's enough to charge a smartphone about 6 times. Your peak power of 45.2W shows strong footstep activity. Keep stepping! 💚

[GEMINI] ✅ Processing complete - returning AI response

[AI HANDLER] ✅ Received AI response
[AI HANDLER]    Response length: 156 characters
[AI HANDLER]    Response preview: "⚡ Today you've generated 127.5Wh of clean energy! That's enough to charge a smartphone about 6 times...
[AI HANDLER] Sending AI response to user via sendMessage()...

═══════════════════════════════════════════════════════
[TRACE 7: SENDING TO META] Preparing to send message
[TRACE 7: SENDING TO META]    Recipient ID: 123456789
[TRACE 7: SENDING TO META]    Message length: 156 characters
[TRACE 7: SENDING TO META]    Message preview: "⚡ Today you've generated 127.5Wh of clean energy! That's enough to charge a smartphone about 6 times..."
[TRACE 7: SENDING TO META]    Has quick replies: true
[TRACE 7: SENDING TO META]    Quick replies count: 3
[TRACE 7: SENDING TO META]    Quick reply titles: System Status, Help, 🏠 Main Menu
[TRACE 7: SENDING TO META] Full payload to Meta:
{
  "recipient": { "id": "123456789" },
  "message": {
    "text": "⚡ Today you've generated 127.5Wh of clean energy! That's enough to charge a smartphone about 6 times. Your peak power of 45.2W shows strong footstep activity. Keep stepping! 💚",
    "quick_replies": [
      { "content_type": "text", "title": "System Status", "payload": "status" },
      { "content_type": "text", "title": "Help", "payload": "help" },
      { "content_type": "text", "title": "🏠 Main Menu", "payload": "menu" }
    ]
  }
}
[TRACE 7: SENDING TO META] Sending POST to: https://graph.facebook.com/v18.0/me/messages

[TRACE 8: META RESPONSE] ═══════════════════════════════
[TRACE 8: META RESPONSE] ✅ Message sent successfully
[TRACE 8: META RESPONSE]    HTTP Status: 200 OK
[TRACE 8: META RESPONSE]    Recipient ID: 123456789
[TRACE 8: META RESPONSE]    Response data: {"recipient_id":"123456789","message_id":"m_xyz"}

[AI HANDLER] ✅ AI response sent successfully
[MESSENGER SERVICE] ✅ routeCommand() completed successfully
```

---

## 🛑 Troubleshooting by Last Trace

| Last Trace Seen | Problem | What to Check |
|----------------|---------|---------------|
| **None** | Webhook not receiving | - Check ngrok is running<br>- Verify webhook URL in Meta<br>- Check VERIFY_TOKEN matches |
| **TRACE 1** only | Event processing not starting | - Check if event structure changed<br>- Look for exceptions in controller |
| **TRACE 2** "DROPPED" | Message filtered out | - Check if it's an echo<br>- Verify message.text exists<br>- Check event type |
| **TRACE 2** ✅ but stops | handleMessage not called | - Check MessengerService injection<br>- Look for async/await issues |
| **handleMessage** but not **ROUTE COMMAND** | routeCommand not reached | - Check try/catch blocks<br>- Look for early returns |
| **ROUTE COMMAND** "NOT MET" | AI conditions failing | - Check `originalText` is passed<br>- Verify `isAIEnabled()` returns true |
| **TRACE 4** "NOT configured" | API key missing | - Check `.env` file<br>- Verify `GEMINI_API_KEY` is set<br>- Restart server after adding key |
| **TRACE 3** starts but hangs | Database timeout | - Check MongoDB connection string<br>- Verify network access<br>- Check if queries are slow |
| **TRACE 5** starts but fails | Gemini API error | - Check API key validity<br>- Verify model name (gemini-3.6-flash)<br>- Check API quota/billing |
| **TRACE 6** "NOT STOP" | Safety blocked | - Content flagged by safety filters<br>- Check finishReason<br>- Review prompt content |
| **TRACE 7** starts but fails | Meta API rejection | - Check PAGE_ACCESS_TOKEN<br>- Verify token permissions<br>- Check message format |
| **TRACE 8** error | Meta returned error | - Check HTTP status code<br>- Review error response data<br>- Verify recipient ID valid |

---

## 🔧 Key Changes Made

### 1. Controller (`messenger.controller.ts`)
- ✅ Added TRACE 1: Full incoming payload logging
- ✅ Added TRACE 2: Event filtering with drop reasons
- ✅ Enhanced error logging with name, message, stack

### 2. Service (`messenger.service.ts`)
- ✅ Added GeminiAIService import and injection
- ✅ Added `originalText` parameter to `routeCommand()`
- ✅ Added AI routing logic in default case
- ✅ Created `handleNaturalLanguageQuery()` method
- ✅ Added TRACE 7: Outgoing Meta payload
- ✅ Added TRACE 8: Meta API response

### 3. Gemini AI Service (`gemini-ai.service.ts`)
- ✅ Added TRACE 4: API key verification
- ✅ Added TRACE 3: Database context fetching
- ✅ Added TRACE 5: Gemini API request
- ✅ Added TRACE 6: Raw result + safety check
- ✅ Changed model from `gemini-2.5-flash` to `gemini-3.6-flash`
- ✅ Enhanced all error logging with full details

---

## ⚙️ Configuration Requirements

### `.env` File Must Have:
```env
# Messenger
MESSENGER_PAGE_ACCESS_TOKEN=your_token_here
MESSENGER_VERIFY_TOKEN=your_verify_token

# Gemini AI
GEMINI_API_KEY=AIza... or AQ....

# MongoDB
MONGODB_URI=mongodb+srv://...
```

### Module Registration (`messenger.module.ts`)
```typescript
providers: [MessengerService, GeminiAIService],
```

---

## 🎯 Next Steps

1. **Restart server**: `npm run start:dev`
2. **Send test message** via Messenger
3. **Copy all logs** from terminal
4. **Find the last trace** that appears
5. **Use troubleshooting table** above to diagnose

The instrumentation will show you **exactly** where execution stops!

---

## 📝 Notes

- All error catch blocks now log: `error.name`, `error.message`, `error.stack`
- Database queries are timed and logged
- API calls show duration and full responses
- Safety blocks are detected and logged with ratings
- Meta API errors show HTTP status and full error data
