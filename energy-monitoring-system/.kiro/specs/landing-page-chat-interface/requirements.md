# Requirements Document

## Introduction

This document specifies the requirements for extending EcoStep's existing chatbot system to support both Meta Messenger and a public landing-page chat interface. EcoStep is an academic IoT capstone project that currently has a working Meta Messenger webhook/chatbot integration built with NestJS backend and React frontend.

The objective is to add a second chatbot access channel through the public landing page while preserving the existing Messenger integration completely intact. Both channels will share the same core chatbot logic and IoT telemetry access, ensuring consistent responses and data across platforms.

## Glossary

- **Messenger_System**: The existing Meta Messenger webhook integration including GET/POST /messenger/webhook endpoints
- **Landing_Page**: The public React SPA homepage at the root route
- **Chat_UI**: The embedded chat interface component on the landing page
- **Chat_API**: The new REST API endpoint (POST /api/chat) for landing page chat
- **Chatbot_Core**: The shared message handling logic in MessengerService.handleMessage()
- **Telemetry_Data**: Real-time IoT sensor data including voltage, current, power, and energy readings
- **Meta_Webhook**: Facebook Messenger Platform webhook that sends user messages to the backend
- **Public_User**: An anonymous user accessing the landing page without authentication
- **Admin_User**: An authenticated user with access to the dashboard and administrative functions
- **Session**: A temporary conversation context for multi-turn interactions on the landing page
- **Command**: A recognized keyword or phrase that triggers a specific chatbot response (e.g., "status", "today", "help")
- **Message_Handler**: The central service method that processes user input and generates responses

## Requirements

### Requirement 1: Preserve Existing Messenger Integration

**User Story:** As a project maintainer, I want the existing Meta Messenger integration to remain completely unchanged, so that current users experience no disruption.

#### Acceptance Criteria

1. THE Messenger_System SHALL preserve the existing GET /messenger/webhook verification endpoint
2. THE Messenger_System SHALL preserve the existing POST /messenger/webhook event handling endpoint
3. THE Messenger_System SHALL preserve the existing webhook verification token validation
4. THE Messenger_System SHALL preserve the existing Meta page access token configuration
5. THE Messenger_System SHALL preserve the existing MessengerController class structure
6. THE Messenger_System SHALL preserve the existing message deduplication logic
7. THE Messenger_System SHALL preserve the existing fire-and-forget webhook response pattern
8. THE Messenger_System SHALL preserve the existing quick replies functionality
9. THE Messenger_System SHALL preserve the existing button templates functionality
10. THE Messenger_System SHALL preserve the existing persistent menu configuration

### Requirement 2: Shared Chatbot Core Architecture

**User Story:** As a developer, I want both chat channels to use the same core message handling logic, so that maintenance is simplified and responses remain consistent.

#### Acceptance Criteria

1. THE Chatbot_Core SHALL expose a reusable message processing interface
2. THE Messenger_System SHALL invoke the Chatbot_Core for message processing
3. THE Chat_API SHALL invoke the same Chatbot_Core for message processing
4. WHEN a command is processed, THE Chatbot_Core SHALL return consistent data regardless of channel
5. THE Chatbot_Core SHALL support both identified users (Meta PSID) and anonymous users
6. THE Chatbot_Core SHALL access the same AnalyticsService, EnergyService, and GeminiAIService
7. THE Chatbot_Core SHALL NOT duplicate command parsing logic between channels
8. THE Chatbot_Core SHALL NOT duplicate response generation logic between channels

### Requirement 3: Landing Page Public Telemetry Display

**User Story:** As a visitor, I want to view real-time system status on the landing page without logging in, so that I can quickly assess the system's current performance.

#### Acceptance Criteria

1. THE Landing_Page SHALL display current voltage reading
2. THE Landing_Page SHALL display current current reading
3. THE Landing_Page SHALL display current power output
4. THE Landing_Page SHALL display total energy generated today
5. THE Landing_Page SHALL display last updated timestamp
6. THE Landing_Page SHALL retrieve telemetry data from the backend via API
7. THE Landing_Page SHALL NOT display hard-coded or fake telemetry values
8. WHEN telemetry data is unavailable, THE Landing_Page SHALL display an appropriate offline message
9. THE Landing_Page SHALL update telemetry display at regular intervals (polling or real-time)
10. THE Landing_Page SHALL NOT require authentication to view telemetry data

### Requirement 4: Landing Page Chat UI Component

**User Story:** As a visitor, I want to interact with a chat interface on the landing page, so that I can ask questions about the system without using Messenger.

#### Acceptance Criteria

1. THE Chat_UI SHALL render as an embedded component on the Landing_Page
2. THE Chat_UI SHALL display a scrollable message container
3. THE Chat_UI SHALL visually distinguish between user messages and bot messages
4. THE Chat_UI SHALL include a text input field for message entry
5. THE Chat_UI SHALL include a Send button for message submission
6. WHEN Enter key is pressed, THE Chat_UI SHALL submit the message
7. WHEN Shift+Enter is pressed, THE Chat_UI SHALL insert a newline without submitting
8. THE Chat_UI SHALL display a loading or typing indicator while waiting for responses
9. WHEN an API error occurs, THE Chat_UI SHALL display a user-friendly error message
10. THE Chat_UI SHALL use native fetch() API for backend communication
11. THE Chat_UI SHALL match the existing EcoStep design system colors and typography
12. THE Chat_UI SHALL be responsive and work on mobile devices

### Requirement 5: Chat API Backend Endpoint

**User Story:** As a frontend developer, I want a REST API endpoint for sending chat messages, so that the landing page can communicate with the chatbot backend.

#### Acceptance Criteria

1. THE Chat_API SHALL expose a POST /api/chat endpoint
2. WHEN a POST request is received, THE Chat_API SHALL accept JSON body with "message" field
3. THE Chat_API SHALL validate that the message field is present
4. THE Chat_API SHALL validate that the message is not empty or whitespace-only
5. THE Chat_API SHALL validate that the message length does not exceed 2000 characters
6. WHEN validation passes, THE Chat_API SHALL pass the message to the Chatbot_Core
7. WHEN processing succeeds, THE Chat_API SHALL return JSON with success: true and response text
8. WHEN validation fails, THE Chat_API SHALL return HTTP 400 with error details
9. WHEN processing fails, THE Chat_API SHALL return HTTP 500 with generic error message
10. THE Chat_API SHALL NOT expose stack traces or internal error details to clients
11. THE Chat_API SHALL support CORS for frontend requests
12. THE Chat_API SHALL log incoming requests for monitoring

### Requirement 6: Channel-Specific Feature Handling

**User Story:** As a system architect, I want to separate channel-specific features from core chatbot logic, so that each channel can have appropriate functionality.

#### Acceptance Criteria

1. THE Chatbot_Core SHALL identify whether a request originates from Messenger or Landing_Page
2. WHEN a Public_User sends "subscribe", THE Chatbot_Core SHALL return a message explaining subscriptions are only available via Messenger
3. WHEN a Public_User sends "unsubscribe", THE Chatbot_Core SHALL return a message explaining subscriptions are only available via Messenger
4. THE Messenger_System SHALL continue to support subscribe/unsubscribe commands
5. THE Chatbot_Core SHALL adapt response format based on channel (rich templates vs plain text)
6. WHEN responding to Messenger, THE Chatbot_Core SHALL support Quick Replies
7. WHEN responding to Landing_Page, THE Chatbot_Core SHALL return plain text or markdown
8. THE Chatbot_Core SHALL support all informational commands (status, today, week, month, peak, impact, savings, energy, battery, about, help) on both channels

### Requirement 7: Session Management for Landing Page

**User Story:** As a visitor, I want my conversation context to be maintained across multiple messages, so that I can have natural multi-turn conversations.

#### Acceptance Criteria

1. THE Chat_API SHALL generate a unique session identifier for each new conversation
2. THE Chat_API SHALL accept an optional sessionId in the request body
3. WHEN sessionId is provided, THE Chat_API SHALL retrieve existing session context
4. WHEN sessionId is not provided, THE Chat_API SHALL create a new session
5. THE Chatbot_Core SHALL store conversation history in the session
6. THE Session SHALL expire after 30 minutes of inactivity
7. THE Chat_UI SHALL persist sessionId in browser storage (sessionStorage)
8. WHEN the browser tab is closed, THE Session SHALL be cleared from client storage
9. THE Chatbot_Core SHALL use session context to maintain conversation continuity
10. THE Session SHALL NOT store sensitive user information

### Requirement 8: Security and Access Control

**User Story:** As a security engineer, I want the public chat API to be secure and prevent unauthorized actions, so that the system remains protected from abuse.

#### Acceptance Criteria

1. THE Chat_API SHALL validate all incoming request bodies
2. THE Chat_API SHALL reject messages exceeding 2000 characters with HTTP 400
3. THE Chat_API SHALL reject empty messages with HTTP 400
4. THE Chat_API SHALL implement rate limiting per IP address
5. THE Chat_API SHALL NOT expose database credentials in error messages
6. THE Chat_API SHALL NOT expose API tokens in error messages
7. THE Chatbot_Core SHALL prevent Public_Users from accessing admin-only commands
8. THE Chatbot_Core SHALL prevent Public_Users from modifying telemetry data
9. THE Chatbot_Core SHALL prevent Public_Users from managing sensors or devices
10. THE Chat_API SHALL configure CORS to allow requests only from the application domain
11. THE Chat_API SHALL sanitize user input to prevent XSS attacks
12. THE Chat_API SHALL log suspicious activity (repeated failed requests, malformed input)

### Requirement 9: Error Handling and Resilience

**User Story:** As a visitor, I want to receive helpful error messages when something goes wrong, so that I understand what happened without seeing technical details.

#### Acceptance Criteria

1. WHEN the database is unavailable, THE Chatbot_Core SHALL return "System temporarily unavailable, please try again later"
2. WHEN IoT devices are offline, THE Chatbot_Core SHALL return "No recent sensor data available"
3. WHEN telemetry data is missing, THE Chatbot_Core SHALL return "Energy data not available at this time"
4. WHEN an API timeout occurs, THE Chat_API SHALL return "Request timed out, please try again"
5. WHEN an invalid command is sent, THE Chatbot_Core SHALL return the help message with available commands
6. THE Chat_API SHALL NOT expose stack traces to clients
7. THE Chat_API SHALL NOT expose database error details to clients
8. THE Chat_API SHALL log all errors internally with full details
9. WHEN the Gemini AI service fails, THE Chatbot_Core SHALL fall back to command-based responses
10. THE Chat_UI SHALL display connection errors with retry option

### Requirement 10: Response Format Adaptation

**User Story:** As a chatbot user, I want to receive responses formatted appropriately for my platform, so that messages are easy to read and interact with.

#### Acceptance Criteria

1. THE Chatbot_Core SHALL accept a channel parameter (messenger or web)
2. WHEN channel is messenger, THE Chatbot_Core SHALL format responses for Meta Messenger
3. WHEN channel is web, THE Chatbot_Core SHALL format responses as plain text or markdown
4. WHEN channel is messenger, THE Chatbot_Core SHALL include Quick Reply options
5. WHEN channel is web, THE Chatbot_Core SHALL include suggested follow-up questions as text
6. THE Chatbot_Core SHALL preserve core response content across both formats
7. THE Chatbot_Core SHALL convert emoji-rich Messenger responses to web-friendly format
8. THE Chatbot_Core SHALL NOT include Meta-specific features (buttons, templates) in web responses
9. THE Chat_UI SHALL render markdown formatting (bold, links, line breaks)
10. THE Chat_UI SHALL display suggested follow-up questions as clickable options

### Requirement 11: Public Telemetry API Endpoint

**User Story:** As a frontend developer, I want a public API endpoint to fetch current telemetry data, so that the landing page can display real-time system status.

#### Acceptance Criteria

1. THE Backend SHALL expose a GET /api/public/telemetry endpoint
2. THE Public_Telemetry_API SHALL NOT require authentication
3. WHEN a request is received, THE Public_Telemetry_API SHALL return current voltage, current, power, and energy
4. THE Public_Telemetry_API SHALL return the last updated timestamp
5. THE Public_Telemetry_API SHALL return HTTP 200 with JSON data when telemetry is available
6. WHEN telemetry data is unavailable, THE Public_Telemetry_API SHALL return HTTP 503 with error message
7. THE Public_Telemetry_API SHALL implement caching to reduce database load (5-10 second cache)
8. THE Public_Telemetry_API SHALL retrieve data from EnergyService
9. THE Public_Telemetry_API SHALL NOT expose sensitive system information
10. THE Public_Telemetry_API SHALL support CORS for frontend requests

### Requirement 12: Chat UI Visual Design

**User Story:** As a designer, I want the chat interface to match EcoStep's existing design system, so that the user experience is cohesive.

#### Acceptance Criteria

1. THE Chat_UI SHALL use the primary color #1A312C for user message backgrounds
2. THE Chat_UI SHALL use the secondary color #428475 for bot message backgrounds
3. THE Chat_UI SHALL use the accent color #89D7B7 for interactive elements
4. THE Chat_UI SHALL use the existing EcoStep font family and sizes
5. THE Chat_UI SHALL include the EcoStep logo in the chat header
6. THE Chat_UI SHALL display rounded message bubbles with appropriate padding
7. THE Chat_UI SHALL align user messages to the right side
8. THE Chat_UI SHALL align bot messages to the left side
9. THE Chat_UI SHALL display timestamps for each message
10. THE Chat_UI SHALL support light and dark theme variants
11. THE Chat_UI SHALL include a smooth scroll animation when new messages appear
12. THE Chat_UI SHALL display a typing indicator with animated dots

### Requirement 13: Performance and Scalability

**User Story:** As a system administrator, I want the chat system to handle multiple concurrent users efficiently, so that performance remains acceptable under load.

#### Acceptance Criteria

1. THE Chat_API SHALL respond to requests within 2 seconds under normal load
2. THE Chat_API SHALL implement connection pooling for database queries
3. THE Public_Telemetry_API SHALL cache responses for 5 seconds to reduce database queries
4. THE Chatbot_Core SHALL reuse service instances across requests
5. THE Chat_API SHALL implement rate limiting of 10 requests per minute per IP
6. WHEN rate limit is exceeded, THE Chat_API SHALL return HTTP 429 with retry-after header
7. THE Chat_UI SHALL debounce rapid message submissions (1 second minimum between sends)
8. THE Backend SHALL log slow requests exceeding 5 seconds
9. THE Session store SHALL automatically clean up expired sessions
10. THE Backend SHALL monitor memory usage and log warnings when threshold is exceeded

### Requirement 14: Testing and Validation

**User Story:** As a QA engineer, I want comprehensive test coverage for the chat system, so that bugs are caught before deployment.

#### Acceptance Criteria

1. THE Chat_API SHALL have unit tests for request validation
2. THE Chat_API SHALL have unit tests for error handling
3. THE Chatbot_Core SHALL have unit tests for command routing
4. THE Chatbot_Core SHALL have unit tests for channel-specific formatting
5. THE Chat_UI SHALL have integration tests for message submission
6. THE Chat_UI SHALL have integration tests for error display
7. THE Public_Telemetry_API SHALL have unit tests for data formatting
8. THE Public_Telemetry_API SHALL have unit tests for offline scenarios
9. THE Session management SHALL have unit tests for creation and expiration
10. THE Backend SHALL have end-to-end tests simulating complete chat flows

### Requirement 15: Deployment and Configuration

**User Story:** As a DevOps engineer, I want the chat feature to be configurable through environment variables, so that it can be deployed in different environments.

#### Acceptance Criteria

1. THE Chat_API SHALL read CORS allowed origins from environment variable
2. THE Chat_API SHALL read rate limit thresholds from environment variable
3. THE Chat_API SHALL read session timeout from environment variable
4. THE Chat_UI SHALL read API base URL from environment variable
5. THE Public_Telemetry_API SHALL read cache duration from environment variable
6. THE Backend SHALL validate all required environment variables at startup
7. WHEN required configuration is missing, THE Backend SHALL fail startup with clear error message
8. THE Backend SHALL log configuration values at startup (excluding secrets)
9. THE Backend SHALL support feature flags to enable/disable chat features
10. THE Backend SHALL document all new environment variables in .env.example

### Requirement 16: Documentation and Developer Experience

**User Story:** As a developer, I want clear documentation for the chat API, so that I can integrate and extend it easily.

#### Acceptance Criteria

1. THE Chat_API SHALL include Swagger/OpenAPI documentation
2. THE Chat_API documentation SHALL include request/response examples
3. THE Chat_API documentation SHALL include error code descriptions
4. THE Chatbot_Core SHALL include JSDoc comments for all public methods
5. THE Project SHALL include a README section explaining the chat architecture
6. THE Project SHALL include diagrams showing the data flow between components
7. THE Project SHALL include setup instructions for local development
8. THE Project SHALL include examples of adding new chat commands
9. THE Project SHALL include troubleshooting guide for common issues
10. THE Project SHALL update the API changelog with new endpoints

### Requirement 17: Monitoring and Observability

**User Story:** As a system administrator, I want to monitor chat usage and performance, so that I can identify and resolve issues proactively.

#### Acceptance Criteria

1. THE Chat_API SHALL log all incoming requests with timestamp and IP
2. THE Chat_API SHALL log response times for performance monitoring
3. THE Chat_API SHALL log all errors with stack traces
4. THE Chatbot_Core SHALL log command usage frequency
5. THE Chatbot_Core SHALL log AI service invocations and latency
6. THE Chat_API SHALL expose health check endpoint for monitoring
7. THE Chat_API SHALL expose metrics endpoint for Prometheus (optional)
8. THE Backend SHALL track chat session creation and expiration counts
9. THE Backend SHALL track rate limiting events
10. THE Backend SHALL track telemetry API cache hit/miss ratio

### Requirement 18: Accessibility and Usability

**User Story:** As a visitor with accessibility needs, I want the chat interface to be usable with assistive technologies, so that I can interact with the system independently.

#### Acceptance Criteria

1. THE Chat_UI SHALL include ARIA labels for all interactive elements
2. THE Chat_UI SHALL support keyboard navigation (Tab, Enter, Escape)
3. THE Chat_UI SHALL announce new messages to screen readers
4. THE Chat_UI SHALL maintain focus management when messages are sent
5. THE Chat_UI SHALL provide clear visual focus indicators
6. THE Chat_UI SHALL use sufficient color contrast (WCAG AA minimum)
7. THE Chat_UI SHALL allow text resizing up to 200% without breaking layout
8. THE Chat_UI SHALL include skip-to-chat link for keyboard users
9. THE Chat_UI SHALL support reduced motion preferences
10. THE Chat_UI SHALL provide descriptive error messages without relying solely on color

### Requirement 19: Data Privacy and Compliance

**User Story:** As a compliance officer, I want user chat data to be handled responsibly, so that privacy regulations are met.

#### Acceptance Criteria

1. THE Backend SHALL NOT store chat message content permanently
2. THE Backend SHALL only log messages for debugging in non-production environments
3. THE Session store SHALL automatically delete expired session data
4. THE Chat_API SHALL NOT collect personally identifiable information
5. THE Landing_Page SHALL include a privacy notice about chat data handling
6. THE Landing_Page SHALL NOT use tracking cookies without consent
7. THE Backend SHALL NOT share chat data with third parties
8. THE Backend SHALL encrypt session data at rest
9. THE Backend SHALL sanitize logs to prevent credential exposure
10. THE Project SHALL document data retention policies for chat sessions

### Requirement 20: Backward Compatibility and Migration

**User Story:** As a project maintainer, I want the new chat feature to integrate smoothly with existing code, so that deployment is low-risk.

#### Acceptance Criteria

1. THE New chat API SHALL NOT modify existing controller routes
2. THE New chat service SHALL NOT break existing MessengerService functionality
3. THE Refactored Chatbot_Core SHALL maintain the same public interface
4. THE MessengerService SHALL continue to function if chat feature is disabled
5. THE Backend SHALL run existing unit tests successfully after integration
6. THE Backend SHALL run existing integration tests successfully after integration
7. THE Frontend SHALL maintain existing routes and navigation after chat UI addition
8. THE Database schema SHALL NOT require breaking changes
9. THE Environment configuration SHALL remain backward compatible
10. THE Deployment process SHALL include rollback plan for chat feature
