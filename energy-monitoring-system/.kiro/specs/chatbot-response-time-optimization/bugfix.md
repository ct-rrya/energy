# Bugfix Requirements Document

## Introduction

The EcoStep Messenger chatbot currently takes 1-2 minutes to respond to user messages, severely degrading user experience. This delay is caused by two compounding architectural issues:

1. **Webhook Retry Loop**: The `messenger.controller.ts` uses `await` on message handling, causing the webhook response to be delayed. When Meta's webhook times out after 20 seconds, it resends the same payload, creating duplicate processing requests that clog the event loop.

2. **AI Reasoning Hang**: The `gemini-ai.service.ts` allows the Gemini AI model to spend excessive time reasoning (or hangs silently) when processing calculation questions, with no timeout or output token limits configured.

This bugfix implements two critical optimizations:
- Fire-and-forget webhook processing to eliminate retry loops
- Aggressive timeout and token limits on AI generation to prevent hangs

## Bug Analysis

### Current Behavior (Defect)

**1.1** WHEN a user sends a message to the chatbot via Facebook Messenger THEN the webhook POST `/webhook` handler awaits the `messengerService.handleMessage()` call before returning the HTTP response

**1.2** WHEN the message processing takes longer than 20 seconds (Meta's timeout) THEN Meta resends the exact same webhook payload, creating duplicate processing requests

**1.3** WHEN multiple webhook retry payloads are queued in the event loop THEN the server becomes increasingly unresponsive, extending response times to 1-2 minutes

**1.4** WHEN the Gemini AI service processes calculation questions THEN the model may spend excessive time reasoning or hang silently with no timeout configured

**1.5** WHEN the Gemini AI generates responses THEN there is no `maxOutputTokens` limit, allowing the model to generate unnecessarily long responses that increase latency

### Expected Behavior (Correct)

**2.1** WHEN a user sends a message to the chatbot via Facebook Messenger THEN the webhook POST `/webhook` handler SHALL return `200 OK` with `'EVENT_RECEIVED'` immediately (within milliseconds) without awaiting message processing

**2.2** WHEN the webhook returns `200 OK` immediately THEN Meta SHALL receive the acknowledgment within the 20-second timeout and SHALL NOT retry the webhook request

**2.3** WHEN the webhook handler returns immediately THEN the `messengerService.handleMessage()` call SHALL execute asynchronously with a `.catch()` handler to log any unhandled errors

**2.4** WHEN the Gemini AI service makes API calls to generate content THEN the request SHALL have a 15-second timeout configured to aggressively kill hanging requests

**2.5** WHEN the Gemini AI model is instantiated THEN it SHALL include `generationConfig: { maxOutputTokens: 300 }` to keep responses concise and reduce generation time

### Unchanged Behavior (Regression Prevention)

**3.1** WHEN the webhook receives verification requests (GET `/webhook`) THEN the system SHALL CONTINUE TO validate the verify token and return the challenge string

**3.2** WHEN the webhook receives invalid payloads (non-page objects) THEN the system SHALL CONTINUE TO throw `BadRequestException`

**3.3** WHEN processing messaging events (text messages, quick replies, postbacks) THEN the system SHALL CONTINUE TO filter out echo messages, delivery receipts, and read receipts

**3.4** WHEN the message handler encounters errors during async processing THEN the system SHALL CONTINUE TO log the error details (name, message, stack trace) without crashing the server

**3.5** WHEN the Gemini AI service is disabled or encounters errors THEN the system SHALL CONTINUE TO return the graceful fallback message with available commands

**3.6** WHEN the Gemini AI processes queries THEN the system SHALL CONTINUE TO fetch real-time energy data from MongoDB and inject it into the prompt (RAG methodology)

**3.7** WHEN the Gemini AI responds to questions THEN the system SHALL CONTINUE TO enforce the system instruction constraints (EcoStep-only scope, declining unrelated queries)
