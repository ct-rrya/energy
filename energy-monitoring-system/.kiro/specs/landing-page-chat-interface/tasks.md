# Implementation Plan: Landing Page Chat Interface

## Overview

This plan implements a public chat interface on the EcoStep landing page while preserving the existing Meta Messenger integration. The implementation extracts shared chatbot logic into a reusable core service and adds new REST API endpoints for web-based chat and telemetry display.

## Tasks

- [x] 1. Set up backend infrastructure and shared modules
  - Create ChatbotModule with ChatbotCoreService
  - Create ChatModule structure (controller, DTOs, session manager)
  - Create PublicModule structure (controller, DTOs)
  - Install required packages (@nestjs/throttler, @nestjs/cache-manager, uuid)
  - Update app.module.ts with new modules and configurations
  - _Requirements: 2.1, 2.2, 2.3, 2.6_

- [x] 2. Extract and implement ChatbotCoreService
  - [x] 2.1 Create ChatbotCoreService with core interfaces (MessageContext, ChatbotResponse)
    - Define MessageContext interface with userId, channel, sessionData
    - Define ChatbotResponse interface with text, suggestions, metadata
    - Implement processMessage() method as main entry point
    - Implement parseCommand() for command identification
    - Implement routeCommand() for routing to handlers
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [x] 2.2 Implement command handlers in ChatbotCoreService
    - Migrate handleInformationalCommand() from MessengerService (status, today, week, month, peak, energy, battery, about, help)
    - Implement handleSubscriptionCommand() with channel-aware logic
    - Implement handleNaturalLanguage() delegating to GeminiAIService
    - Add graceful fallback when AI service fails
    - _Requirements: 2.6, 2.8, 6.8, 9.9_
  
  - [x] 2.3 Add channel-specific response formatting
    - Implement formatForChannel() method
    - Format Quick Replies for Messenger channel
    - Format plain text/markdown for web channel
    - Ensure consistent core content across formats
    - _Requirements: 6.1, 6.5, 6.6, 6.7, 10.1, 10.2, 10.3, 10.7_

- [x] 3. Refactor MessengerService to use ChatbotCoreService
  - [x] 3.1 Update MessengerService to delegate to ChatbotCoreService
    - Inject ChatbotCoreService into MessengerService
    - Modify handleMessage() to call ChatbotCoreService.processMessage()
    - Pass channel='messenger' and Meta PSID as userId
    - Preserve existing Meta API communication methods unchanged
    - _Requirements: 1.5, 2.2, 2.3, 2.7_
  
  - [x] 3.2 Preserve Messenger-specific features
    - Keep sendMessage(), sendButtonTemplate() methods unchanged
    - Keep setPersistentMenu(), setGetStartedButton() unchanged
    - Keep Quick Reply generation in MessengerService
    - Format ChatbotResponse to Meta-compatible messages
    - _Requirements: 1.8, 1.9, 1.10, 6.6_
  
  - [x] 3.3 Verify Messenger integration still works
    - Run existing MessengerService unit tests
    - Test webhook verification endpoint (GET /messenger/webhook)
    - Test webhook event handling (POST /messenger/webhook)
    - Test all commands via Messenger (status, today, subscribe, etc.)
    - Verify Quick Replies render correctly
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 20.2, 20.5, 20.6_

- [x] 4. Implement SessionManager for anonymous sessions
  - [x] 4.1 Create SessionManager with in-memory storage
    - Define ChatSession interface with sessionId, createdAt, lastActivity, messageHistory
    - Implement getOrCreateSession() with UUID generation
    - Implement updateSession() to record messages and extend expiration
    - Implement getSession() for retrieval
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.10_
  
  - [x] 4.2 Add session cleanup job
    - Implement cleanupExpiredSessions() method
    - Add @Cron decorator to run every 5 minutes
    - Set session expiration to 30 minutes of inactivity
    - Log cleanup activity
    - _Requirements: 7.6, 13.9_
  
  - [x] 4.3 Write unit tests for SessionManager
    - Test session creation with valid UUID
    - Test session retrieval
    - Test session expiration logic
    - Test cleanup of expired sessions
    - _Requirements: 14.9_

- [x] 5. Implement RateLimitGuard for abuse prevention
  - [x] 5.1 Create RateLimitGuard with throttler configuration
    - Configure @nestjs/throttler with default limits
    - Create rate limit config: chat (10 req/min), telemetry (120 req/min)
    - Implement IP-based rate limiting
    - Return 429 status with Retry-After header when exceeded
    - _Requirements: 8.4, 13.5, 13.6_
  
  - [x] 5.2 Write unit tests for RateLimitGuard
    - Test requests within limit are allowed
    - Test requests exceeding limit throw 429
    - Test rate limit resets after TTL window
    - _Requirements: 14.1, 14.2_

- [x] 6. Create ChatController with DTOs
  - [x] 6.1 Create DTOs for chat API
    - Create SendMessageDto with validation (message, optional sessionId)
    - Create ChatResponseDto with response structure
    - Add class-validator decorators (@IsString, @IsNotEmpty, @MaxLength(2000))
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 8.2, 8.3_
  
  - [x] 6.2 Implement ChatController POST /api/chat endpoint
    - Create ChatController with @Controller('chat')
    - Implement sendMessage() with @Post() decorator
    - Apply @UseGuards(RateLimitGuard) for rate limiting
    - Apply @UsePipes(ValidationPipe) for input validation
    - Inject ChatbotCoreService and SessionManager
    - _Requirements: 5.1, 5.2, 5.6, 5.11_
  
  - [x] 6.3 Add request processing logic
    - Get or create session using SessionManager
    - Call ChatbotCoreService.processMessage() with channel='web'
    - Update session with message and response
    - Return ChatResponseDto with success, response, sessionId, suggestions, timestamp
    - _Requirements: 5.7, 7.3, 7.4, 7.9_
  
  - [x] 6.4 Add error handling
    - Handle validation errors (return 400)
    - Handle rate limit errors (return 429)
    - Handle processing errors (return 500 with generic message)
    - Log errors internally without exposing details
    - _Requirements: 5.8, 5.9, 5.10, 8.5, 8.6, 9.6, 9.7, 9.8_

- [x] 7. Create PublicController for telemetry
  - [x] 7.1 Create TelemetryDto
    - Define TelemetryDto with voltage, current, power, energyToday, timestamp, status
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 11.4_
  
  - [x] 7.2 Implement PublicController GET /api/public/telemetry endpoint
    - Create PublicController with @Controller('public')
    - Implement getCurrentTelemetry() with @Get('telemetry')
    - Apply @UseInterceptors(CacheInterceptor) with 5-second TTL
    - Apply @UseGuards(RateLimitGuard)
    - Inject EnergyService
    - _Requirements: 11.1, 11.2, 11.7, 11.10_
  
  - [x] 7.3 Add telemetry data retrieval
    - Call EnergyService.getTodayEnergyTotal()
    - Map to TelemetryDto format
    - Return HTTP 200 with JSON data when available
    - Return HTTP 503 when data unavailable
    - _Requirements: 3.6, 3.8, 11.5, 11.6, 11.8_

- [x] 8. Configure security and middleware
  - [x] 8.1 Configure CORS in main.ts
    - Set allowed origins from FRONTEND_URL and PRODUCTION_URL env vars
    - Allow GET and POST methods
    - Set allowed headers (Content-Type, Accept)
    - Disable credentials for public API
    - _Requirements: 5.11, 8.10, 11.10, 15.1_
  
  - [x] 8.2 Add Helmet.js security headers
    - Install and configure helmet middleware
    - Set Content-Security-Policy directives
    - Configure for API usage
    - _Requirements: 8.11_
  
  - [x] 8.3 Configure global validation pipe
    - Add ValidationPipe to main.ts with whitelist: true
    - Enable forbidNonWhitelisted
    - Enable transform
    - _Requirements: 8.1_
  
  - [x] 8.4 Add Swagger API documentation
    - Configure Swagger module in main.ts
    - Add @ApiTags, @ApiOperation decorators to controllers
    - Add @ApiBody, @ApiResponse decorators with examples
    - Document error codes and responses
    - _Requirements: 16.1, 16.2, 16.3_

- [x] 9. Checkpoint - Backend integration testing
  - Ensure all backend tests pass
  - Test POST /api/chat with various commands
  - Test GET /api/public/telemetry endpoint
  - Verify Messenger integration unchanged
  - Check rate limiting works
  - Ask the user if questions arise

- [x] 10. Create frontend ChatInterface component
  - [x] 10.1 Create ChatInterface component structure
    - Create frontend/src/features/chat/components/ChatInterface.tsx
    - Define ChatState interface (messages, sessionId, isLoading, error, suggestions)
    - Define ChatMessage interface (id, role, text, timestamp)
    - Set up useState hooks for state management
    - _Requirements: 4.1, 4.2_
  
  - [x] 10.2 Implement message display
    - Create MessageList subcomponent with scrollable container
    - Create Message component with role-based styling (user/bot)
    - Implement auto-scroll to latest message
    - Add timestamp display for each message
    - _Requirements: 4.2, 4.3, 12.6, 12.7, 12.8, 12.9_
  
  - [x] 10.3 Implement chat input
    - Create ChatInput subcomponent with textarea and send button
    - Handle Enter key to submit (Shift+Enter for newline)
    - Implement 1-second debounce on send
    - Disable input while loading
    - _Requirements: 4.4, 4.5, 4.6, 4.7, 13.7_
  
  - [x] 10.4 Add loading and typing indicator
    - Create TypingIndicator component with animated dots
    - Show during API requests
    - Hide when response received
    - _Requirements: 4.8, 12.12_
  
  - [x] 10.5 Add suggested actions/follow-up questions
    - Create SuggestedActions component
    - Display suggestions as clickable buttons
    - Auto-populate input when clicked
    - _Requirements: 10.10_

- [x] 11. Implement API client and message handling
  - [x] 11.1 Create API client utility
    - Create frontend/src/lib/api.ts
    - Implement chat.sendMessage() with fetch()
    - Implement telemetry.getCurrent() with fetch()
    - Read API_BASE_URL from environment variables
    - _Requirements: 4.10, 5.11, 11.10, 15.4_
  
  - [x] 11.2 Implement sendMessage logic in ChatInterface
    - Call api.chat.sendMessage() with text and sessionId
    - Add user message to UI immediately
    - Show loading indicator
    - Handle successful response (add bot message, update sessionId, show suggestions)
    - Persist sessionId in sessionStorage
    - _Requirements: 7.7, 7.8_
  
  - [x] 11.3 Add error handling
    - Display 429 rate limit errors with wait time
    - Display connection errors with retry option
    - Display generic errors with friendly message
    - Show error in chat as bot message
    - _Requirements: 4.9, 9.4, 9.10_
  
  - [x] 11.4 Add markdown rendering
    - Install marked and DOMPurify packages
    - Render bot messages as markdown
    - Sanitize HTML with DOMPurify (allow p, br, strong, em, ul, ol, li, code, pre, a)
    - _Requirements: 10.9_

- [x] 12. Create TelemetryDisplay component
  - [x] 12.1 Create TelemetryDisplay component structure
    - Create frontend/src/features/landing/components/TelemetryDisplay.tsx
    - Define TelemetryData interface (voltage, current, power, energyToday, timestamp, status)
    - Set up useState for telemetry data and loading state
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  
  - [x] 12.2 Implement polling logic
    - Set up useEffect with 10-second interval
    - Call api.telemetry.getCurrent() on mount and interval
    - Update state with response data
    - Cleanup interval on unmount
    - _Requirements: 3.9_
  
  - [x] 12.3 Implement offline/error handling
    - Handle 503 responses (show offline state)
    - Implement exponential backoff on errors
    - Display last updated timestamp ("Updated X ago")
    - _Requirements: 3.8, 9.2_
  
  - [x] 12.4 Add telemetry card layout
    - Create grid layout for telemetry values
    - Display voltage, current, power, energy with units and icons
    - Add online/offline status indicator
    - Style with glass morphism matching EcoStep design
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 13. Style components with EcoStep design system
  - [x] 13.1 Apply EcoStep color palette to ChatInterface
    - Use #1A312C for user message backgrounds
    - Use #428475 for bot message backgrounds
    - Use #89D7B7 for interactive elements (send button, suggestions)
    - Support light and dark theme variants
    - _Requirements: 12.1, 12.2, 12.3, 12.10_
  
  - [x] 13.2 Style chat UI elements
    - Add EcoStep logo to chat header
    - Create rounded message bubbles with appropriate padding
    - Add smooth scroll animation for new messages
    - Use existing EcoStep font family and sizes
    - _Requirements: 12.4, 12.5, 12.6, 12.11_
  
  - [x] 13.3 Make components responsive
    - Add mobile-friendly styling (stack on small screens)
    - Ensure touch-friendly button sizes
    - Test on various screen sizes
    - _Requirements: 4.12_

- [x] 14. Update LandingPage to integrate new components
  - [x] 14.1 Add ChatInterface and TelemetryDisplay to LandingPage
    - Import ChatInterface and TelemetryDisplay components
    - Create split-section layout (Telemetry left, Chat right)
    - Implement responsive stacking for mobile
    - _Requirements: 3.9, 4.1_
  
  - [x] 14.2 Add privacy notice and feature descriptions
    - Add privacy notice about chat data handling
    - Add section describing chat functionality
    - _Requirements: 19.5_

- [x] 15. Implement accessibility features for floating chat
  - [x] 15.1 Add ARIA labels and keyboard navigation to FloatingChatButton
    - Add ARIA labels to chat toggle button and all interactive elements
    - Implement keyboard navigation (Tab, Enter, Escape to close)
    - Maintain focus management when chat opens/closes
    - Add proper focus trap when chat is expanded
    - _Requirements: 18.1, 18.2, 18.4, 18.8_
  
  - [x] 15.2 Add screen reader support to floating chat
    - Announce new messages with ARIA live regions
    - Announce chat open/close state changes
    - Provide descriptive error messages
    - _Requirements: 18.3, 18.10_
  
  - [x] 15.3 Verify accessibility compliance
    - Test color contrast (WCAG AA minimum)
    - Test text resizing up to 200%
    - Test with keyboard only (no mouse)
    - Test with screen reader (NVDA/JAWS)
    - Verify reduced motion support
    - _Requirements: 18.5, 18.6, 18.7, 18.9_

- [x] 16. Checkpoint - Frontend integration testing
  - Ensure all frontend tests pass
  - Test chat message flow end-to-end
  - Test telemetry display updates
  - Test error scenarios (rate limit, offline, validation)
  - Test responsive layout on mobile
  - Ask the user if questions arise

- [x] 17. Create FloatingChatButton component with expand/collapse functionality
  - [x] 17.1 Create FloatingChatButton component structure
    - Create frontend/src/components/FloatingChatButton.tsx
    - Define component state (isExpanded, messages, sessionId, isLoading, error)
    - Import and integrate existing ChatInterface logic
    - Add floating button with chat icon (fixed position bottom-right)
    - _Requirements: 4.1, 4.2, 12.4_
  
  - [x] 17.2 Implement expand/collapse animation
    - Add smooth slide-up/fade-in animation when expanded
    - Add slide-down/fade-out animation when collapsed
    - Set expanded chat size (400px width, 600px height on desktop)
    - Make responsive (full screen on mobile)
    - Add close button in chat header
    - _Requirements: 4.12, 12.10_
  
  - [x] 17.3 Integrate ChatInterface into expandable panel
    - Render ChatInterface component inside expanded panel
    - Maintain all existing chat functionality (messages, input, suggestions)
    - Preserve session state when collapsed/expanded
    - Add EcoStep branding to chat header
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 7.7, 7.8_
  
  - [x] 17.4 Add floating button styling
    - Use EcoStep green (#89D7B7) for button background
    - Add chat bubble icon or bot icon
    - Add hover and focus states
    - Add notification badge for unread messages (future enhancement)
    - Ensure button is touch-friendly (minimum 44px touch target)
    - _Requirements: 12.1, 12.2, 12.3, 12.11_

- [x] 18. Integrate FloatingChatButton globally across routes
  - [x] 18.1 Add FloatingChatButton to App.tsx
    - Import FloatingChatButton component
    - Render FloatingChatButton outside main routing container
    - Ensure it appears on all routes (Home and Dashboard)
    - Position with z-index to stay above other content
    - _Requirements: 4.1_
  
  - [x] 18.2 Implement chat session persistence across navigation
    - Store sessionId in sessionStorage
    - Restore session when component mounts
    - Maintain chat history when navigating between routes
    - Clear session only on browser close or manual clear
    - _Requirements: 7.7, 7.8, 7.9_
  
  - [x] 18.3 Test chat availability on both Home and Dashboard routes
    - Verify chat button appears on / (Home)
    - Verify chat button appears on /dashboard/* routes
    - Verify chat state persists when switching routes
    - Verify no duplicate chat instances
    - _Requirements: 4.1_

- [x] 19. Update navigation to Home | Dashboard structure
  - [x] 19.1 Update main navigation component
    - Modify frontend navigation to show "Home" and "Dashboard" links
    - Home link routes to / (landing/marketing page)
    - Dashboard link routes to /dashboard (unified dashboard)
    - Remove any old navigation to embedded chat page
    - Style navigation with EcoStep design system
    - _Requirements: 12.1_
  
  - [x] 19.2 Ensure navigation is accessible and responsive
    - Add proper ARIA labels to navigation links
    - Add active state styling for current route
    - Make navigation mobile-friendly (hamburger menu if needed)
    - Test keyboard navigation
    - _Requirements: 18.1, 18.2, 4.12_

- [x] 20. Convert Home page to marketing/informational content
  - [x] 20.1 Update Home page layout
    - Remove embedded ChatInterface and TelemetryDisplay from Home
    - Create hero section describing EcoStep energy monitoring system
    - Add features section highlighting key capabilities
    - Add call-to-action encouraging users to explore dashboard
    - Add privacy notice about data handling
    - _Requirements: 19.5_
  
  - [x] 20.2 Add TelemetryDisplay component to Home page
    - Add TelemetryDisplay as a featured section on Home
    - Show real-time energy data as a preview
    - Style as marketing element with descriptive text
    - Link to Dashboard for full details
    - _Requirements: 3.9, 11.2_
  
  - [x] 20.3 Ensure FloatingChatButton is the only chat interface
    - Verify no embedded chat on Home page
    - Verify FloatingChatButton works on Home page
    - Test user can chat from Home without navigation
    - _Requirements: 4.1_

- [ ] 21. Implement role-based feature visibility in unified Dashboard
  - [ ] 21.1 Update Dashboard to support public and admin views
    - Keep existing /dashboard/* routes (analytics, devices, reports, settings)
    - Add role detection logic (check user authentication state)
    - Define public features (view telemetry, basic analytics)
    - Define admin-only features (device management, settings, alerts)
    - _Requirements: User story context_
  
  - [ ] 21.2 Conditionally render dashboard sections based on role
    - Show only telemetry and basic analytics to public users
    - Show full dashboard navigation to authenticated admin users
    - Add "Login to access more features" message for public users
    - Hide or disable admin-only navigation items for public users
    - _Requirements: User story context_
  
  - [ ] 21.3 Style public vs admin dashboard views
    - Add visual indicator showing current user role (Public or Admin)
    - Ensure consistent EcoStep design across both views
    - Add smooth transitions when switching views
    - _Requirements: 12.1, 12.10_
  
  - [ ] 21.4 Test role-based access control
    - Test public user sees limited dashboard
    - Test admin user sees full dashboard
    - Test navigation restrictions work correctly
    - Verify FloatingChatButton works for both roles
    - _Requirements: User story context_

- [ ] 22. Write unit tests for new components
  - [ ]* 22.1 Write FloatingChatButton component tests
    - Test button renders in collapsed state by default
    - Test clicking button expands chat panel
    - Test close button collapses chat panel
    - Test session persists across expand/collapse
    - Test chat functionality works when expanded
    - _Requirements: 14.5, 14.6_
  
  - [ ]* 22.2 Write navigation component tests
    - Test Home and Dashboard links render correctly
    - Test active state styling applies to current route
    - Test navigation is keyboard accessible
    - _Requirements: 18.1, 18.2_
  
  - [ ]* 22.3 Write role-based dashboard tests
    - Test public user sees limited features
    - Test admin user sees all features
    - Test FloatingChatButton appears in both views
    - _Requirements: 14.10_

- [ ] 23. Write end-to-end tests for new UX flow
  - [ ]* 23.1 Write E2E test for floating chat across routes
    - Test user opens chat on Home page and sends message
    - Test user navigates to Dashboard with chat open
    - Test chat session persists and history remains
    - Test user can continue conversation on Dashboard
    - _Requirements: 14.10_
  
  - [ ]* 23.2 Write E2E test for public vs admin dashboard
    - Test public user accesses Dashboard and sees limited view
    - Test admin user accesses Dashboard and sees full view
    - Test both users can use FloatingChatButton
    - _Requirements: 14.10_
  
  - [ ]* 23.3 Write E2E test for Home to Dashboard navigation
    - Test user lands on Home page
    - Test user views TelemetryDisplay on Home
    - Test user clicks Dashboard link in navigation
    - Test user sees appropriate dashboard content
    - Test FloatingChatButton remains accessible
    - _Requirements: 14.10_

- [ ] 24. Update documentation and final verification
  - [ ] 24.1 Update README with new architecture
    - Document floating chat button feature
    - Document global chat availability across routes
    - Document Home page (marketing) vs Dashboard (data) separation
    - Document role-based dashboard access
    - Add navigation structure diagram
    - _Requirements: 16.5, 16.6, 16.7_
  
  - [ ] 24.2 Update component documentation
    - Document FloatingChatButton component API
    - Document session persistence implementation
    - Document role-based rendering logic
    - Add usage examples for future developers
    - _Requirements: 16.8, 16.9_
  
  - [ ] 24.3 Final checkpoint - Verify new architecture works end-to-end
    - Test complete user journey: Home → FloatingChat → Dashboard → Chat persists
    - Test public user dashboard experience
    - Test admin user dashboard experience
    - Test chat works on all routes without issues
    - Test accessibility compliance for floating chat
    - Verify Messenger integration still works
    - Ask the user if ready to deploy
    - _Requirements: 20.2, 20.5, 20.6_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- The existing Messenger integration remains completely unchanged
- Backend uses NestJS with TypeScript, frontend uses React with TypeScript
- Both channels share the same ChatbotCoreService for consistency
- **New Architecture**: Floating expandable chat button replaces embedded chat interface
- **Global Availability**: Chat is accessible on both Home (/) and Dashboard (/dashboard/*) routes
- **Session Persistence**: Chat state persists when navigating between routes
- **Unified Dashboard**: Single dashboard with role-based feature visibility (admin vs public)
- **Marketing Home**: Home page focuses on marketing/informational content, not chat embedding

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "4.1", "5.1", "6.1", "7.1"] },
    { "id": 2, "tasks": ["2.2", "4.2", "5.2", "6.2", "7.2", "8.1"] },
    { "id": 3, "tasks": ["2.3", "3.1", "4.3", "6.3", "7.3", "8.2"] },
    { "id": 4, "tasks": ["3.2", "6.4", "8.3"] },
    { "id": 5, "tasks": ["3.3", "8.4"] },
    { "id": 6, "tasks": ["10.1", "12.1"] },
    { "id": 7, "tasks": ["10.2", "10.3", "11.1", "12.2"] },
    { "id": 8, "tasks": ["10.4", "10.5", "11.2", "12.3"] },
    { "id": 9, "tasks": ["11.3", "11.4", "12.4", "13.1"] },
    { "id": 10, "tasks": ["13.2", "13.3", "14.1"] },
    { "id": 11, "tasks": ["14.2", "15.1"] },
    { "id": 12, "tasks": ["15.2"] },
    { "id": 13, "tasks": ["17.1", "19.1"] },
    { "id": 14, "tasks": ["17.2", "17.3", "19.2", "20.1"] },
    { "id": 15, "tasks": ["17.4", "18.1", "20.2"] },
    { "id": 16, "tasks": ["18.2", "18.3", "20.3", "21.1"] },
    { "id": 17, "tasks": ["21.2", "21.3"] },
    { "id": 18, "tasks": ["21.4", "22.1", "22.2"] },
    { "id": 19, "tasks": ["22.3", "23.1", "23.2"] },
    { "id": 20, "tasks": ["23.3", "24.1"] },
    { "id": 21, "tasks": ["24.2", "24.3"] }
  ]
}
```
