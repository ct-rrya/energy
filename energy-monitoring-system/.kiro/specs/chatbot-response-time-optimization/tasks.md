# Implementation Plan

## Overview

This task list implements two critical fixes for the chatbot response time optimization:
1. Fire-and-forget webhook pattern to eliminate Meta retry loops
2. Aggressive AI timeout controls to prevent hanging requests

The implementation follows the bug condition methodology with exploration tests before fixes, preservation tests to protect existing behavior, and validation after implementation.

---

## Tasks

- [x] 1. Write bug condition exploration tests (BEFORE implementing fixes)
  - **Property 1: Bug Condition** - Webhook Response Time and AI Timeout
  - **CRITICAL**: These tests MUST FAIL on unfixed code - failure confirms the bugs exist
  - **DO NOT attempt to fix the tests or the code when they fail**
  - **NOTE**: These tests encode the expected behavior - they will validate the fixes when they pass after implementation
  - **GOAL**: Surface counterexamples demonstrating webhook delays and AI hangs
  - **Scoped PBT Approach**: Focus on concrete failing cases (webhook with 20s+ processing, AI queries that hang)
  
  - [x] 1.1 Write webhook response time exploration test
    - Test that webhook POST returns 200 OK within 100ms (will fail on unfixed code due to await blocking)
    - Mock webhook payload with text message that triggers slow processing
    - Measure HTTP response time from `receiveWebhook()` call
    - Test implementation: Mock `messengerService.handleMessage()` to take 5 seconds, verify webhook returns before completion
    - **EXPECTED OUTCOME**: Test FAILS on unfixed code (response time >5000ms due to await)
    - Document counterexample: "Webhook response delayed until message processing completes"
    - Mark task complete when test is written, run, and failure is documented
    - _Requirements: 1.1, 2.1_
  
  - [x] 1.2 Write webhook retry detection exploration test
    - Test that duplicate webhook payloads trigger duplicate processing (will fail showing bug exists)
    - Mock Meta retry behavior: send same webhook payload twice with 21-second delay
    - Monitor logs for duplicate "Text message from [senderId]" entries
    - Test implementation: Track `handleMessage()` call count, assert it's called twice for same message
    - **EXPECTED OUTCOME**: Test FAILS on unfixed code (duplicate processing detected)
    - Document counterexample: "Same message ID processed multiple times due to Meta retry"
    - Mark task complete when test is written, run, and failure is documented
    - _Requirements: 1.2, 1.3_
  
  - [x] 1.3 Write AI generation timeout exploration test
    - Test that complex AI queries complete within 15 seconds (will fail on unfixed code - no timeout configured)
    - Mock Gemini API to simulate 30-second response delay or hang
    - Call `processQuery()` with complex calculation question
    - Measure time until response or timeout
    - Test implementation: Use `setTimeout` in mock to delay response, verify no timeout enforcement
    - **EXPECTED OUTCOME**: Test FAILS on unfixed code (request waits full 30 seconds, no timeout)
    - Document counterexample: "AI generation request took 30+ seconds with no timeout enforcement"
    - Mark task complete when test is written, run, and failure is documented
    - _Requirements: 1.4, 2.4_
  
  - [x] 1.4 Write AI token limit exploration test
    - Test that AI responses are limited to 300 tokens (will fail on unfixed code - no maxOutputTokens configured)
    - Mock open-ended query: "Tell me everything about piezoelectric energy"
    - Call `processQuery()` and count output tokens in response
    - Test implementation: Mock Gemini API to return 500-token response, verify no truncation
    - **EXPECTED OUTCOME**: Test FAILS on unfixed code (response exceeds 300 tokens)
    - Document counterexample: "AI response contained 500+ tokens, no limit enforced"
    - Mark task complete when test is written, run, and failure is documented
    - _Requirements: 1.5, 2.5_

- [x] 2. Write preservation property tests (BEFORE implementing fixes)
  - **Property 2: Preservation** - Existing Behavior Protection
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs
  - Write property-based tests capturing observed behavior patterns
  - Property-based testing generates many test cases for stronger guarantees
  
  - [x] 2.1 Write webhook verification preservation test
    - Observe: GET `/webhook` with valid token returns challenge on unfixed code
    - Observe: GET `/webhook` with invalid token throws BadRequestException on unfixed code
    - Write property-based test: Generate random verification requests with valid/invalid tokens
    - Test implementation: For all valid tokens, assert challenge returned; for invalid, assert exception thrown
    - Run test on UNFIXED code
    - **EXPECTED OUTCOME**: Test PASSES on unfixed code (confirms baseline verification behavior)
    - Mark task complete when test is written, run, and passing on unfixed code
    - _Requirements: 3.1_
  
  - [x] 2.2 Write message filtering preservation test
    - Observe: Echo messages (is_echo: true) are dropped on unfixed code
    - Observe: Delivery receipts are dropped on unfixed code
    - Observe: Read receipts are dropped on unfixed code
    - Write property-based test: Generate random messaging events with echo/delivery/read flags
    - Test implementation: For all echo/delivery/read events, assert no handleMessage() call, verify "DROPPED" log
    - Run test on UNFIXED code
    - **EXPECTED OUTCOME**: Test PASSES on unfixed code (confirms baseline filtering behavior)
    - Mark task complete when test is written, run, and passing on unfixed code
    - _Requirements: 3.3_
  
  - [x] 2.3 Write message routing preservation test
    - Observe: Quick reply payload takes precedence over text on unfixed code
    - Observe: Postback payload processed correctly on unfixed code
    - Observe: Text message processed when no quick_reply/postback present on unfixed code
    - Write property-based test: Generate events with combinations of text/quick_reply/postback
    - Test implementation: Assert quick_reply processed over text, postback processed, text as fallback
    - Run test on UNFIXED code
    - **EXPECTED OUTCOME**: Test PASSES on unfixed code (confirms baseline routing logic)
    - Mark task complete when test is written, run, and passing on unfixed code
    - _Requirements: 3.3_
  
  - [x] 2.4 Write async error logging preservation test
    - Observe: Errors in handleMessage() are caught and logged with full stack trace on unfixed code
    - Write property-based test: Mock handleMessage() to throw various error types
    - Test implementation: Trigger error, verify .catch() logs error.name, error.message, error.stack
    - Run test on UNFIXED code
    - **EXPECTED OUTCOME**: Test PASSES on unfixed code (confirms baseline error handling)
    - Mark task complete when test is written, run, and passing on unfixed code
    - _Requirements: 3.4_
  
  - [x] 2.5 Write AI fallback preservation test
    - Observe: When Gemini API errors occur, getFallbackMessage() is returned on unfixed code
    - Observe: When AI is disabled, getFallbackMessage() is returned on unfixed code
    - Write property-based test: Mock various API error scenarios (network, auth, rate limit)
    - Test implementation: For all error types, assert fallback message returned
    - Run test on UNFIXED code
    - **EXPECTED OUTCOME**: Test PASSES on unfixed code (confirms baseline fallback behavior)
    - Mark task complete when test is written, run, and passing on unfixed code
    - _Requirements: 3.5_
  
  - [x] 2.6 Write RAG data injection preservation test
    - Observe: processQuery() fetches MongoDB data and injects into prompt on unfixed code
    - Observe: Real energy values from database appear in AI responses on unfixed code
    - Write property-based test: Mock database with various energy readings
    - Test implementation: Verify fetchEnergyData() called, data included in prompt passed to Gemini
    - Run test on UNFIXED code
    - **EXPECTED OUTCOME**: Test PASSES on unfixed code (confirms baseline RAG behavior)
    - Mark task complete when test is written, run, and passing on unfixed code
    - _Requirements: 3.6_
  
  - [x] 2.7 Write system instruction enforcement preservation test
    - Observe: Off-topic queries are declined with template message on unfixed code
    - Observe: EcoStep scope restrictions enforced on unfixed code
    - Write property-based test: Generate random off-topic queries (politics, sports, weather)
    - Test implementation: For all off-topic queries, assert decline template used
    - Run test on UNFIXED code
    - **EXPECTED OUTCOME**: Test PASSES on unfixed code (confirms baseline scope enforcement)
    - Mark task complete when test is written, run, and passing on unfixed code
    - _Requirements: 3.7_

- [x] 3. Implement webhook fire-and-forget pattern

  - [x] 3.1 Remove await from message processing loops
    - Modify `receiveWebhook()` in `src/messenger/messenger.controller.ts`
    - Change `await this.processMessagingEvent(event)` to `this.processMessagingEvent(event)` (fire-and-forget)
    - Remove await from both nested for loops (entry.messaging iteration)
    - Ensure HTTP 200 OK with 'EVENT_RECEIVED' returns immediately
    - Verify existing .catch() handlers in processMessagingEvent() still capture async errors
    - _Bug_Condition: isBugCondition(input) where input.type == 'webhook' AND processingTime(input) > 20 seconds_
    - _Expected_Behavior: responseTime(receiveWebhook_fixed) < 100ms, metaRetryDetected == false_
    - _Preservation: Webhook verification (GET), message filtering (echo/delivery/read), error logging preserved_
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4_
  
  - [x] 3.2 Add fire-and-forget documentation
    - Update JSDoc comments on `receiveWebhook()` method
    - Document that method returns 200 OK immediately (fire-and-forget pattern)
    - Explain Meta webhook timeout requirements (< 20 seconds)
    - Note that message processing happens asynchronously with error logging
    - Add code comment above `this.processMessagingEvent(event)` explaining pattern
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [x] 3.3 Verify webhook immediate return test now passes
    - **Property 1: Expected Behavior** - Webhook Immediate Response
    - **IMPORTANT**: Re-run the SAME test from task 1.1 - do NOT write a new test
    - The test from task 1.1 encodes the expected behavior
    - When this test passes, it confirms webhook returns within 100ms
    - Run test: Webhook POST with slow message processing
    - Measure HTTP response time
    - **EXPECTED OUTCOME**: Test PASSES (response < 100ms, before processing completes)
    - _Requirements: 2.1, 2.2_
  
  - [x] 3.4 Verify webhook retry elimination test now passes
    - **Property 1: Expected Behavior** - No Webhook Retries
    - **IMPORTANT**: Re-run the SAME test from task 1.2 - do NOT write a new test
    - The test from task 1.2 encodes the expected behavior
    - When this test passes, it confirms no duplicate processing occurs
    - Run test: Send webhook, wait 25 seconds, check for duplicates
    - **EXPECTED OUTCOME**: Test PASSES (only one handleMessage() call, no duplicates)
    - _Requirements: 2.2, 2.3_

- [x] 4. Implement AI timeout controls

  - [x] 4.1 Add maxOutputTokens to model configuration
    - Modify `gemini-ai.service.ts` constructor
    - Add `generationConfig: { maxOutputTokens: 300 }` to `getGenerativeModel()` call
    - Keep existing `model` and `systemInstruction` parameters unchanged
    - Add log statement confirming token limit configured
    - _Bug_Condition: isBugCondition(input) where input.type == 'ai_query' AND hasMaxOutputTokens(modelConfig) == false_
    - _Expected_Behavior: tokenCount(response) <= 300_
    - _Preservation: System instructions, RAG methodology, fallback messages preserved_
    - _Requirements: 1.5, 2.5, 3.6, 3.7_
  
  - [x] 4.2 Implement Promise.race timeout wrapper
    - Modify `processQuery()` method in `gemini-ai.service.ts`
    - Create timeout promise: `new Promise((_, reject) => setTimeout(() => reject(new Error('Gemini API timeout after 15s')), 15000))`
    - Wrap `this.model.generateContent(prompt)` call with `Promise.race([apiCall, timeoutPromise])`
    - Add try-catch to handle timeout errors specifically
    - Log timeout occurrences with [TRACE] prefix
    - On timeout, call `this.getFallbackMessage()` and return
    - Preserve existing error handling for non-timeout errors
    - _Bug_Condition: isBugCondition(input) where input.type == 'ai_query' AND hasTimeout(generateContent) == false_
    - _Expected_Behavior: responseTime(generateContent_fixed) <= 15000ms OR fallback returned_
    - _Preservation: RAG data fetching, error logging, fallback messages preserved_
    - _Requirements: 1.4, 2.4, 3.5, 3.6_
  
  - [x] 4.3 Add timeout performance logging
    - Add log before Gemini API call: `[TRACE 5: CALLING GEMINI] Starting API call with 15s timeout...`
    - Add log after successful completion: `[TRACE 5: CALLING GEMINI] API call completed in ${duration}ms`
    - Add log on timeout: `[TRACE 5: CALLING GEMINI] API call timed out after 15000ms, returning fallback`
    - Log actual duration even on timeout (to measure how long requests hang)
    - _Requirements: 2.4_
  
  - [x] 4.4 Verify AI timeout test now passes
    - **Property 1: Expected Behavior** - AI Generation Timeout
    - **IMPORTANT**: Re-run the SAME test from task 1.3 - do NOT write a new test
    - The test from task 1.3 encodes the expected behavior
    - When this test passes, it confirms 15-second timeout is enforced
    - Run test: Mock 30-second Gemini response delay
    - **EXPECTED OUTCOME**: Test PASSES (timeout at 15s, fallback returned)
    - _Requirements: 2.4, 3.5_
  
  - [x] 4.5 Verify AI token limit test now passes
    - **Property 1: Expected Behavior** - AI Token Limit
    - **IMPORTANT**: Re-run the SAME test from task 1.4 - do NOT write a new test
    - The test from task 1.4 encodes the expected behavior
    - When this test passes, it confirms 300 token limit is enforced
    - Run test: Send open-ended query, count output tokens
    - **EXPECTED OUTCOME**: Test PASSES (response ≤ 300 tokens)
    - _Requirements: 2.5_

- [x] 5. Verify all preservation tests still pass

  - [x] 5.1 Re-run webhook verification preservation test
    - **Property 2: Preservation** - Webhook Verification Flow
    - **IMPORTANT**: Re-run the SAME test from task 2.1 - do NOT write a new test
    - Run test: Generate verification requests with valid/invalid tokens
    - **EXPECTED OUTCOME**: Test PASSES (same validation behavior as before fix)
    - Confirm all tests still pass after webhook fire-and-forget changes
    - _Requirements: 3.1_
  
  - [x] 5.2 Re-run message filtering preservation test
    - **Property 2: Preservation** - Message Filtering
    - **IMPORTANT**: Re-run the SAME test from task 2.2 - do NOT write a new test
    - Run test: Generate echo/delivery/read events
    - **EXPECTED OUTCOME**: Test PASSES (same filtering behavior as before fix)
    - Confirm filtering logic unchanged after fire-and-forget pattern
    - _Requirements: 3.3_
  
  - [x] 5.3 Re-run message routing preservation test
    - **Property 2: Preservation** - Message Routing Logic
    - **IMPORTANT**: Re-run the SAME test from task 2.3 - do NOT write a new test
    - Run test: Generate events with text/quick_reply/postback combinations
    - **EXPECTED OUTCOME**: Test PASSES (same routing behavior as before fix)
    - Confirm quick_reply precedence preserved
    - _Requirements: 3.3_
  
  - [x] 5.4 Re-run async error logging preservation test
    - **Property 2: Preservation** - Error Logging
    - **IMPORTANT**: Re-run the SAME test from task 2.4 - do NOT write a new test
    - Run test: Trigger handleMessage() errors
    - **EXPECTED OUTCOME**: Test PASSES (same error logging as before fix)
    - Confirm .catch() handlers still capture async errors with fire-and-forget
    - _Requirements: 3.4_
  
  - [x] 5.5 Re-run AI fallback preservation test
    - **Property 2: Preservation** - AI Fallback Messages
    - **IMPORTANT**: Re-run the SAME test from task 2.5 - do NOT write a new test
    - Run test: Mock various Gemini API errors
    - **EXPECTED OUTCOME**: Test PASSES (same fallback behavior as before fix)
    - Confirm timeout errors also return fallback (new behavior)
    - _Requirements: 3.5_
  
  - [x] 5.6 Re-run RAG data injection preservation test
    - **Property 2: Preservation** - RAG Methodology
    - **IMPORTANT**: Re-run the SAME test from task 2.6 - do NOT write a new test
    - Run test: Mock database responses, verify prompt injection
    - **EXPECTED OUTCOME**: Test PASSES (same RAG behavior as before fix)
    - Confirm MongoDB data still fetched and injected with timeout wrapper
    - _Requirements: 3.6_
  
  - [x] 5.7 Re-run system instruction enforcement preservation test
    - **Property 2: Preservation** - Scope Enforcement
    - **IMPORTANT**: Re-run the SAME test from task 2.7 - do NOT write a new test
    - Run test: Generate off-topic queries
    - **EXPECTED OUTCOME**: Test PASSES (same scope enforcement as before fix)
    - Confirm system instructions still enforced with token limit
    - _Requirements: 3.7_

- [x] 6. Integration testing and validation

  - [x] 6.1 Test end-to-end webhook flow
    - Send test message via Messenger to live webhook endpoint
    - Verify webhook returns 200 OK immediately (measure response time)
    - Verify message processing completes asynchronously
    - Verify chatbot response arrives in Messenger within 3-5 seconds (normal AI latency)
    - Monitor logs for [TRACE] statements confirming fire-and-forget pattern
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [x] 6.2 Test webhook retry elimination
    - Send multiple test messages in rapid succession (5 messages within 10 seconds)
    - Monitor server logs for duplicate processing entries
    - Verify each message processed exactly once (no "Text message from X" duplicates)
    - Verify no Meta retry webhooks received (check webhook event timestamps)
    - _Requirements: 2.2, 2.3_
  
  - [x] 6.3 Test AI timeout enforcement
    - Send complex calculation query: "If 1000 people walk 10,000 steps generating 0.5W per step..."
    - Monitor [TRACE 5: CALLING GEMINI] logs for API duration
    - Verify response received within 15 seconds OR fallback message returned
    - Verify no indefinite hangs occur
    - _Requirements: 2.4, 3.5_
  
  - [x] 6.4 Test AI token limit enforcement
    - Send open-ended query: "Tell me everything about how EcoStep works"
    - Verify response is concise (2-3 sentences as per system instructions)
    - Count tokens manually (rough estimate: ~4 chars per token)
    - Verify response ≤ 1200 characters (~300 tokens)
    - _Requirements: 2.5_
  
  - [x] 6.5 Test multi-user concurrency
    - Simulate 5 users sending messages simultaneously (within same second)
    - Verify all 5 webhooks return 200 OK immediately
    - Verify all 5 users receive responses without excessive delay
    - Verify no webhook retry loops occur under load
    - Monitor server CPU/memory usage (should remain stable)
    - _Requirements: 2.1, 2.2, 2.3_

- [x] 7. Checkpoint - Ensure all tests pass
  - Verify all exploration tests now pass (confirming bug fixes work)
  - Verify all preservation tests still pass (confirming no regressions)
  - Verify integration tests demonstrate improved response times
  - Verify webhook response time < 100ms consistently
  - Verify AI generation time ≤ 15s or fallback returned
  - If any tests fail, investigate root cause and fix before proceeding
  - Document final test results and performance metrics

---

## Success Criteria

- ✅ Webhook POST returns 200 OK within 100ms (fire-and-forget pattern)
- ✅ No webhook retry loops observed (Meta receives response within 20s timeout)
- ✅ AI generation completes within 15 seconds or returns graceful fallback
- ✅ AI responses limited to 300 tokens for conciseness
- ✅ All existing functionality preserved (verification, filtering, routing, error logging, RAG, fallbacks)
- ✅ Chatbot response time reduced from 1-2 minutes to 3-5 seconds (normal AI latency)
- ✅ No duplicate message processing under any conditions
- ✅ All tests pass consistently

## Notes

- **Exploration tests MUST be written and run BEFORE implementing fixes** (tasks 1.1-1.4)
- **Preservation tests MUST be written and run BEFORE implementing fixes** (tasks 2.1-2.7)
- **Implementation order**: Webhook fire-and-forget first (lower risk), then AI timeouts
- **Fire-and-forget pattern**: Async operations execute with .catch() error handlers, no await blocking
- **Promise.race timeout**: Preferred over AbortController for better SDK compatibility
- **RAG methodology preserved**: MongoDB data fetching and prompt injection unchanged
- **Error logging preserved**: All .catch() handlers continue to log full error details
- **System instructions preserved**: EcoStep scope restrictions and response format unchanged
