# Chatbot Response Time Optimization Bugfix Design

## Overview

The EcoStep Messenger chatbot suffers from 1-2 minute response delays due to two compounding architectural issues: (1) synchronous webhook processing that triggers Meta's retry mechanism when responses exceed 20 seconds, creating a cascade of duplicate requests that clog the event loop, and (2) uncontrolled AI generation time with no timeout or output token limits, allowing the Gemini model to hang indefinitely on complex queries.

This design implements two targeted fixes:
- **Fire-and-forget webhook pattern**: Return HTTP 200 immediately before processing messages, eliminating retry loops
- **Aggressive AI timeout controls**: 15-second request timeout + 300 token output limit to prevent hangs

The fix minimizes code changes (modify webhook handler + AI service initialization) while preserving all existing functionality (verification flow, message routing, error handling, RAG methodology).

## Glossary

- **Bug_Condition (C)**: The condition that triggers excessive response time - when webhook processing exceeds 20 seconds OR Gemini AI hangs on complex queries
- **Property (P)**: The desired behavior - webhook returns 200 OK within milliseconds, AI requests complete within 15 seconds maximum
- **Preservation**: Existing webhook verification, message filtering, error logging, RAG data injection, and graceful fallback behavior must remain unchanged
- **processMessagingEvent()**: The method in `messenger.controller.ts` that handles individual messaging events (text, quick replies, postbacks)
- **receiveWebhook()**: The POST handler in `messenger.controller.ts` that receives Meta webhook payloads
- **genAI.getGenerativeModel()**: The initialization method in `gemini-ai.service.ts` that configures the Gemini model instance
- **generateContent()**: The API call method that sends prompts to Gemini and receives responses
- **Fire-and-forget**: Architectural pattern where webhook handler returns HTTP response immediately without awaiting async operations
- **Meta Webhook Retry**: Meta's behavior of resending identical payloads when webhook responses exceed 20-second timeout
- **Event Loop Clogging**: Performance degradation caused by multiple duplicate async operations queued simultaneously
- **RAG (Retrieval-Augmented Generation)**: The methodology where real-time MongoDB data is injected into AI prompts

## Bug Details

### Bug Condition

The bug manifests when a user sends a message to the chatbot and the response takes 1-2 minutes to arrive. The root cause is two-fold: (1) the `receiveWebhook()` handler in `messenger.controller.ts` uses `await` on the `processMessagingEvent()` calls, delaying the HTTP response until all message processing completes, and when this exceeds 20 seconds, Meta resends the webhook payload, creating duplicate processing requests that compound the delay, and (2) the `gemini-ai.service.ts` allows unbounded AI reasoning time with no timeout on `generateContent()` calls and no `maxOutputTokens` limit in the model configuration.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type WebhookPayload OR AIQuery
  OUTPUT: boolean
  
  RETURN (input.type == 'webhook' 
          AND processingTime(input) > 20 seconds
          AND metaRetriesDetected(input) == true)
         OR
         (input.type == 'ai_query'
          AND hasTimeout(generateContent) == false
          AND hasMaxOutputTokens(modelConfig) == false
          AND responseTime(input) > 60 seconds)
END FUNCTION
```

### Examples

**Webhook Retry Loop Example:**
- **User Action**: Sends "What's my energy total today?" via Messenger
- **Current Behavior**: 
  1. Meta sends webhook payload at T=0s
  2. Controller awaits `processMessagingEvent()` which queries DB + calls Gemini (25s)
  3. Meta times out at T=20s, resends same payload
  4. Controller now processing 2 identical requests simultaneously
  5. Each request takes 25s, but event loop is clogged
  6. Response arrives at T=50s or later
- **Expected Behavior**:
  1. Meta sends webhook payload at T=0s
  2. Controller returns 200 OK immediately at T=0.001s
  3. Message processing happens asynchronously (no retry)
  4. Response arrives at T=3-5s (normal Gemini latency)

**AI Reasoning Hang Example:**
- **User Action**: Sends complex calculation question "How much energy would 100 people walking 500 steps generate?"
- **Current Behavior**:
  1. Gemini model begins extended reasoning (no timeout set)
  2. Model potentially hangs or takes 60+ seconds
  3. No output token limit means verbose responses increase latency
  4. Webhook times out, triggers retry loop
  5. Multiple hanging AI requests compound the problem
- **Expected Behavior**:
  1. Gemini model has 15-second timeout configured
  2. Model limited to 300 output tokens (2-3 sentences)
  3. Request completes quickly or times out gracefully
  4. Fallback message returned if timeout occurs

**Preservation Example - Webhook Verification:**
- **User Action**: Meta sends GET request to verify webhook during setup
- **Current Behavior**: Returns challenge string after token validation
- **Expected Behavior**: UNCHANGED - continues to validate token and return challenge

**Edge Case - Multiple Users Simultaneously:**
- **User Action**: 5 users send messages within same second
- **Current Behavior**: All 5 trigger webhook processing, each awaited sequentially, causing 1-2 minute delays
- **Expected Behavior**: All 5 webhooks return 200 OK immediately (within milliseconds), processing happens in parallel asynchronously

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- GET `/webhook` verification flow must continue to validate verify tokens and return challenge strings
- Message filtering logic (echo detection, delivery receipts, read receipts) must continue to drop non-actionable events
- Quick reply vs postback vs text message routing must continue to work identically
- Error logging with `.catch()` handlers must continue to capture and log async errors with full stack traces
- RAG methodology (fetching MongoDB data + injecting into prompts) must continue unchanged
- Gemini system instructions and scope restrictions (EcoStep-only responses) must continue unchanged
- Graceful fallback messages when AI unavailable must continue to be returned

**Scope:**
All inputs that do NOT involve the webhook response timing or AI generation timeout should be completely unaffected by this fix. This includes:
- Webhook verification GET requests (token validation flow)
- Message type detection and routing logic
- Database query operations for energy data
- Prompt construction with data injection
- AI system instruction enforcement
- Error handling and logging patterns
- Fallback message behavior

## Hypothesized Root Cause

Based on the bug description and code analysis, the root causes are:

1. **Synchronous Webhook Processing**: The `receiveWebhook()` method uses `for` loops with `await this.processMessagingEvent(event)`, blocking the HTTP response until all events are processed. When processing exceeds 20 seconds, Meta's webhook timeout triggers, causing duplicate payload delivery.

2. **Webhook Retry Cascade**: When Meta resends the same payload due to timeout, the controller processes the duplicate request, doubling the workload. If the original request is still pending, both execute simultaneously, clogging the event loop and compounding delays.

3. **Unbounded AI Generation Time**: The `gemini-ai.service.ts` calls `await this.model.generateContent(prompt)` with no timeout parameter in the API request configuration, allowing the Gemini model to spend unlimited time reasoning.

4. **No Output Token Limit**: The `getGenerativeModel()` initialization does not include `generationConfig: { maxOutputTokens: 300 }`, allowing the model to generate verbose responses that increase generation time unnecessarily.

5. **Event Loop Blocking**: Node.js event loop architecture means multiple concurrent async operations (duplicate webhook processing + hanging AI calls) compete for resources, exponentially increasing latency.

## Correctness Properties

Property 1: Bug Condition - Webhook Returns Immediately

_For any_ webhook POST request to `/webhook` with valid Facebook Messenger payload, the fixed handler SHALL return HTTP 200 OK with `'EVENT_RECEIVED'` within milliseconds (< 100ms) without awaiting any message processing operations, preventing Meta webhook timeout and retry loop.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Bug Condition - AI Generation Completes Quickly

_For any_ Gemini AI generation request, the fixed service SHALL complete the API call within 15 seconds maximum (due to aggressive timeout) and generate responses of 300 tokens or less (due to maxOutputTokens limit), preventing hanging requests and reducing generation latency.

**Validates: Requirements 2.4, 2.5**

Property 3: Preservation - Webhook Verification Flow

_For any_ GET request to `/webhook` with verification parameters (hub.mode, hub.verify_token, hub.challenge), the fixed handler SHALL produce exactly the same validation behavior as the original handler, returning the challenge string when the token matches or throwing BadRequestException when it doesn't.

**Validates: Requirements 3.1**

Property 4: Preservation - Message Filtering and Routing

_For any_ webhook payload containing messaging events (text, quick_reply, postback, echo, delivery, read), the fixed handler SHALL apply the same filtering logic (dropping echoes, receipts) and routing logic (prioritizing quick_reply over text) as the original handler, preserving message type detection behavior.

**Validates: Requirements 3.2, 3.3**

Property 5: Preservation - Error Handling and Logging

_For any_ async message processing operation that throws an error, the fixed handler SHALL continue to catch errors with `.catch()` handlers and log the error name, message, and stack trace exactly as the original handler does, preserving debugging visibility.

**Validates: Requirements 3.4**

Property 6: Preservation - RAG and AI Behavior

_For any_ AI query processed by the Gemini service, the fixed service SHALL continue to fetch real-time MongoDB data, inject it into prompts, enforce system instruction constraints, and return fallback messages on errors, preserving all existing RAG methodology and AI behavior except generation timeout/token limits.

**Validates: Requirements 3.5, 3.6, 3.7**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `src/messenger/messenger.controller.ts`

**Function**: `receiveWebhook()` (POST handler) and `processMessagingEvent()`

**Specific Changes**:

1. **Remove `await` from Loop**: Change the `for` loops in `receiveWebhook()` that currently use `await this.processMessagingEvent(event)` to call `this.processMessagingEvent(event)` without awaiting, allowing immediate return of HTTP 200 OK.

   **Before:**
   ```typescript
   async receiveWebhook(@Body() body: WebhookBodyDto): Promise<string> {
     // ... validation ...
     for (const entry of body.entry) {
       for (const event of entry.messaging) {
         await this.processMessagingEvent(event); // BLOCKS HERE
       }
     }
     return 'EVENT_RECEIVED';
   }
   ```

   **After:**
   ```typescript
   async receiveWebhook(@Body() body: WebhookBodyDto): Promise<string> {
     // ... validation ...
     for (const entry of body.entry) {
       for (const event of entry.messaging) {
         this.processMessagingEvent(event); // FIRE-AND-FORGET
       }
     }
     return 'EVENT_RECEIVED'; // RETURNS IMMEDIATELY
   }
   ```

2. **Ensure Error Handling in Async Calls**: Verify that `processMessagingEvent()` internally uses `.catch()` on all async operations (it already does - `messengerService.handleMessage().catch(...)` pattern exists for all event types).

3. **Add Fire-and-Forget Documentation**: Update method documentation to clarify the fire-and-forget pattern and Meta webhook timeout requirements.

**File**: `src/messenger/gemini-ai.service.ts`

**Function**: Constructor (model initialization) and `processQuery()` (API call)

**Specific Changes**:

1. **Add `maxOutputTokens` to Model Config**: Modify the `getGenerativeModel()` call in the constructor to include `generationConfig: { maxOutputTokens: 300 }`, limiting response length.

   **Before:**
   ```typescript
   this.model = this.genAI.getGenerativeModel({
     model: modelName,
     systemInstruction: this.getSystemInstructions(),
   });
   ```

   **After:**
   ```typescript
   this.model = this.genAI.getGenerativeModel({
     model: modelName,
     systemInstruction: this.getSystemInstructions(),
     generationConfig: {
       maxOutputTokens: 300, // Limit to ~2-3 sentences
     },
   });
   ```

2. **Add Request Timeout to API Call**: Modify the `generateContent()` call in `processQuery()` to include a 15-second timeout using `Promise.race()` pattern or `AbortController` with timeout.

   **Implementation Options:**

   **Option A - Promise.race with Timeout:**
   ```typescript
   // Create timeout promise
   const timeoutPromise = new Promise((_, reject) => {
     setTimeout(() => reject(new Error('Gemini API timeout after 15s')), 15000);
   });

   // Race between API call and timeout
   const result = await Promise.race([
     this.model.generateContent(prompt),
     timeoutPromise
   ]);
   ```

   **Option B - AbortController (if supported by SDK):**
   ```typescript
   const controller = new AbortController();
   const timeoutId = setTimeout(() => controller.abort(), 15000);
   
   try {
     const result = await this.model.generateContent(prompt, {
       signal: controller.signal
     });
     clearTimeout(timeoutId);
   } catch (error) {
     if (error.name === 'AbortError') {
       this.logger.warn('Gemini request aborted after 15s timeout');
       return this.getFallbackMessage();
     }
     throw error;
   }
   ```

   **Recommended: Option A (Promise.race)** - More portable, works regardless of SDK abort signal support.

3. **Add Timeout Logging**: Add trace logs before/after API call to measure actual generation time and log when timeouts occur.

4. **Update Fallback Message**: Consider updating `getFallbackMessage()` to include a timeout-specific message variant (optional enhancement).

### Implementation Order

1. **Start with AI Timeout Fix** (lower risk, isolated change):
   - Add `maxOutputTokens: 300` to model config
   - Implement `Promise.race()` timeout in `processQuery()`
   - Test with complex queries to verify timeout behavior
   - Verify fallback messages work correctly

2. **Then Apply Webhook Fire-and-Forget** (higher impact, affects all messages):
   - Remove `await` from `processMessagingEvent()` calls
   - Verify error logging still captures async errors
   - Test with rapid message bursts
   - Monitor for webhook retry elimination

### Risk Mitigation

- **Error Visibility**: Async errors are already caught by `.catch()` handlers in `processMessagingEvent()`, preserving logging
- **Race Conditions**: Fire-and-forget pattern may cause out-of-order processing if user sends rapid messages, but this is acceptable for chatbot use case (each message is independent)
- **Timeout Too Aggressive**: 15-second timeout may cut off legitimate long responses, but fallback message provides graceful degradation
- **Token Limit Too Restrictive**: 300 tokens (~2-3 sentences) enforces conciseness as per system instructions requirement

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bugs on unfixed code (webhook retry loops + AI hangs), then verify the fixes work correctly (immediate webhook returns + aggressive timeouts) while preserving existing behavior (verification flow, message routing, error handling, RAG methodology).

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bugs BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that simulate webhook POST requests with complex messages, measure response times, and monitor for Meta retry behavior. Run these tests on the UNFIXED code to observe slow webhook responses and AI hangs.

**Test Cases**:

1. **Webhook Response Time Test**: Send webhook POST with text message, measure HTTP response time (will be >20s on unfixed code due to await)
   - **Setup**: Mock Meta webhook POST request with simple text message
   - **Execute**: Call `receiveWebhook()` and measure time until HTTP 200 returned
   - **Expected on Unfixed**: Response time >20 seconds (blocked by async processing)
   - **Expected Counterexample**: Response delayed until message fully processed

2. **Webhook Retry Detection Test**: Send webhook POST, wait 21 seconds, check if duplicate processing occurs (will happen on unfixed code)
   - **Setup**: Mock Meta webhook with identical payload sent twice (simulating retry)
   - **Execute**: Monitor logs for duplicate "Text message from [senderId]" entries
   - **Expected on Unfixed**: Duplicate processing logged, event loop clogged
   - **Expected Counterexample**: Same message processed multiple times

3. **AI Generation Timeout Test**: Send complex calculation query, measure Gemini API response time (will be >60s or hang on unfixed code)
   - **Setup**: Mock message: "If 1000 people walk 10,000 steps each day for a year, calculating piezoelectric efficiency at 3% with voltage degradation..."
   - **Execute**: Call `processQuery()` and measure time until response
   - **Expected on Unfixed**: Response time >60 seconds or indefinite hang
   - **Expected Counterexample**: No timeout enforced, lengthy generation time

4. **Token Limit Test**: Send open-ended query, check response length (will be >300 tokens on unfixed code)
   - **Setup**: Mock message: "Tell me everything about how piezoelectric energy works"
   - **Execute**: Call `processQuery()`, measure output token count
   - **Expected on Unfixed**: Response >300 tokens (no limit configured)
   - **Expected Counterexample**: Verbose response increases latency

**Expected Counterexamples**:
- Webhook responses take 20+ seconds due to awaited async operations
- Meta retry behavior triggers duplicate processing when responses exceed 20s timeout
- Gemini API calls hang or exceed 60 seconds with no timeout enforcement
- AI responses exceed 300 tokens, increasing generation time unnecessarily
- Possible causes: synchronous webhook processing, no request timeout, no output token limit

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds (slow webhooks, hanging AI), the fixed functions produce the expected behavior (immediate response, aggressive timeout).

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := fixedFunction(input)
  ASSERT expectedBehavior(result)
END FOR

SPECIFICALLY:
- FOR webhook POST requests:
  ASSERT responseTime(receiveWebhook_fixed) < 100ms
  ASSERT metaRetryDetected == false

- FOR AI generation requests:
  ASSERT responseTime(generateContent_fixed) <= 15000ms
  ASSERT tokenCount(response) <= 300
```

**Test Cases**:

1. **Webhook Immediate Return Test**: Send webhook POST, verify 200 OK returned within 100ms (before message processing completes)
   - **Setup**: Mock webhook POST with text message that triggers slow AI query
   - **Execute**: Call `receiveWebhook()`, measure response time
   - **Assert**: HTTP 200 returned in <100ms, async processing continues in background

2. **No Webhook Retry Test**: Send webhook POST, wait 25 seconds, verify no duplicate processing occurs
   - **Setup**: Mock single webhook POST, monitor logs for 30 seconds
   - **Execute**: Call `receiveWebhook()`, check logs
   - **Assert**: Only one "Text message from [senderId]" log entry, no duplicates

3. **AI Timeout Enforcement Test**: Send complex query, verify response completes within 15 seconds or returns fallback
   - **Setup**: Mock complex calculation query
   - **Execute**: Call `processQuery()`, measure time
   - **Assert**: Response received within 15 seconds OR fallback message returned

4. **Token Limit Enforcement Test**: Send open-ended query, verify response length ≤300 tokens
   - **Setup**: Mock broad question about EcoStep
   - **Execute**: Call `processQuery()`, count output tokens
   - **Assert**: Response contains ≤300 tokens (enforced by generationConfig)

5. **Error Logging Preserved Test**: Trigger async error in message processing, verify `.catch()` handler logs it
   - **Setup**: Mock webhook POST that causes exception in `handleMessage()`
   - **Execute**: Call `receiveWebhook()`, check logs after async processing completes
   - **Assert**: Error logged with name, message, stack trace (preservation check)

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold (verification requests, non-problematic messages, AI queries within normal parameters), the fixed functions produce the same result as the original functions.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT originalFunction(input) = fixedFunction(input)
END FOR

SPECIFICALLY:
- FOR webhook GET verification:
  ASSERT verifyWebhook_fixed(validToken) == challenge
  ASSERT verifyWebhook_fixed(invalidToken) throws BadRequestException

- FOR message filtering:
  ASSERT echo messages still dropped
  ASSERT delivery/read receipts still dropped
  ASSERT quick_reply prioritized over text

- FOR RAG methodology:
  ASSERT MongoDB data still fetched
  ASSERT data still injected into prompts
  ASSERT system instructions still enforced
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for webhook verification, message filtering, and AI responses, then write property-based tests capturing that behavior.

**Test Cases**:

1. **Webhook Verification Preservation**: Observe that GET `/webhook` with valid token returns challenge on unfixed code, then write test to verify this continues after fix
   - **Unfixed Behavior**: `verifyWebhook({ 'hub.mode': 'subscribe', 'hub.verify_token': VALID, 'hub.challenge': '12345' })` returns `'12345'`
   - **Fixed Behavior**: MUST be identical
   - **Test**: Generate random valid/invalid token combinations, verify same responses

2. **Message Filter Preservation**: Observe that echo messages are dropped on unfixed code, then write test to verify this continues after fix
   - **Unfixed Behavior**: `processMessagingEvent({ message: { is_echo: true } })` logs "DROPPED: is_echo = true"
   - **Fixed Behavior**: MUST be identical (no processing, just log and return)
   - **Test**: Generate random echo/delivery/read events, verify all still filtered

3. **Quick Reply Routing Preservation**: Observe that quick_reply payload takes precedence over text on unfixed code, then write test to verify this continues after fix
   - **Unfixed Behavior**: `processMessagingEvent({ message: { text: 'Help', quick_reply: { payload: 'GET_STARTED' } } })` processes `'GET_STARTED'` not `'Help'`
   - **Fixed Behavior**: MUST be identical
   - **Test**: Generate events with both text and quick_reply, verify payload processed

4. **RAG Data Injection Preservation**: Observe that MongoDB data is fetched and injected into prompts on unfixed code, then write test to verify this continues after fix
   - **Unfixed Behavior**: `processQuery('What's my energy today?')` calls `fetchEnergyData()` and includes result in prompt
   - **Fixed Behavior**: MUST be identical (except timeout wrapping)
   - **Test**: Mock database responses, verify prompt contains injected data

5. **Error Fallback Preservation**: Observe that AI errors return fallback message on unfixed code, then write test to verify this continues after fix
   - **Unfixed Behavior**: When `generateContent()` throws exception, `processQuery()` returns `getFallbackMessage()`
   - **Fixed Behavior**: MUST be identical (timeout errors also return fallback)
   - **Test**: Mock API errors, verify fallback message returned

6. **System Instruction Enforcement Preservation**: Observe that off-topic queries are declined on unfixed code, then write test to verify this continues after fix
   - **Unfixed Behavior**: `processQuery('Who won the election?')` returns decline message about EcoStep scope
   - **Fixed Behavior**: MUST be identical
   - **Test**: Generate random off-topic queries, verify decline template used

### Unit Tests

- Test webhook POST handler returns immediately without awaiting message processing
- Test `processMessagingEvent()` calls `messengerService.handleMessage()` without await
- Test Gemini model initialized with `maxOutputTokens: 300` in config
- Test `Promise.race()` timeout wrapper returns fallback after 15 seconds
- Test async error logging still works with fire-and-forget pattern
- Test webhook GET verification flow unchanged (token validation)
- Test message filtering logic unchanged (echo, delivery, read detection)
- Test quick reply vs postback vs text routing logic unchanged

### Property-Based Tests

- Generate random webhook payloads (valid/invalid), verify immediate 200 OK for valid payloads
- Generate random messaging events (text, quick_reply, postback, echo), verify filtering and routing logic preserved
- Generate random verification requests (valid/invalid tokens), verify same validation behavior
- Generate random AI queries (simple, complex, off-topic), verify timeout enforced and system instructions preserved
- Generate burst of simultaneous messages (5-10 concurrent), verify no webhook retries occur
- Generate random MongoDB data responses, verify RAG injection behavior preserved

### Integration Tests

- Test full message flow: webhook POST → immediate 200 OK → async processing → Messenger response
- Test complex AI query flow: text message → DB query → prompt injection → Gemini call with timeout → response
- Test webhook retry elimination: send message that would previously trigger retry, verify no duplicates
- Test error resilience: trigger DB error, AI error, verify fallback messages and logging preserved
- Test multi-user concurrency: 5 users send messages simultaneously, verify all get responses without retries
- Test timeout edge cases: AI query that takes exactly 15 seconds, verify graceful completion or fallback
