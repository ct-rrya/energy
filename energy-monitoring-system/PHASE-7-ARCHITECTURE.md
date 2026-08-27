# Phase 7 – Messenger Bot Notification & Subscriber Management Module
## Architecture Design Document

**Status**: Design Phase  
**Created**: 2026-07-19  
**Module**: Messenger Notifications & Subscriber Management

---

## 1. EXECUTIVE SUMMARY

Phase 7 transforms the existing Messenger Bot foundation into a complete notification platform. The system will automatically notify subscribed users about important energy events, send scheduled summaries, and provide administrators with comprehensive subscriber management tools.

### Current Foundation (Already Implemented)
- ✅ Messenger webhook verification and event handling
- ✅ Basic command processing (help, status, today, week, month, peak, impact, savings, subscribe, unsubscribe)
- ✅ Integration with Analytics, Energy, and Subscribers services
- ✅ Facebook Graph API message sending
- ✅ Subscriber schema with basic fields and preferences

### Phase 7 Additions
- 🆕 Enhanced Subscriber schema with tags, status tracking, and notification history
- 🆕 Automated notifications triggered by energy/battery/sensor events
- 🆕 Scheduled daily and weekly summary reports (cron-based)
- 🆕 Notifications module with event listeners and broadcast system
- 🆕 Admin dashboard for subscriber management and broadcasting
- 🆕 Notification logging and analytics tracking
- 🆕 New bot commands: energy, battery, about

---

## 2. CURRENT ARCHITECTURE ANALYSIS

### 2.1 Existing Modules Integration

**Subscribers Module** (`src/subscribers/`)
- **Current Schema**: facebookUserId, firstName, lastName, isSubscribed, subscribedAt, unsubscribedAt, lastInteractionAt, preferences (dailyReport, weeklyReport, alerts)
- **Service Methods**: subscribe(), unsubscribe(), updateLastInteraction(), getSubscriber(), getActiveSubscribers(), getSubscriberCount(), updatePreferences()
- **Status**: ✅ Solid foundation, needs enhancement for Phase 7

**Messenger Module** (`src/messenger/`)
- **Service**: Handles command parsing, service calls, response formatting, message sending via Graph API
- **Controller**: Webhook verification (GET), event handling (POST)
- **Commands**: 10 commands already working
- **Architecture Pattern**: Never accesses DB directly, consumes Analytics/Energy/Subscribers services
- **Status**: ✅ Well-architected, ready for expansion

**IoT Module** (`src/iot/`)
- **Event Sources**: New readings, power thresholds
- **WebSocket Integration**: Broadcasts via DashboardGateway
- **Notification Opportunities**: Energy milestones, battery alerts, sensor online/offline
- **Status**: ✅ Ready to emit notification events

**Analytics Module** (`src/analytics/`)
- **Service**: Provides comprehensive analytics data for notifications
- **Status**: ✅ Already consumed by Messenger service

**Dashboard Gateway** (`src/dashboard/`)
- **WebSocket Server**: Handles real-time dashboard updates
- **Events**: reading:new, sensor:update, statistics:update, alert:power, sensor:online, sensor:offline
- **Status**: ✅ Event infrastructure exists, can be mirrored for notifications

### 2.2 Integration Points

```
┌─────────────────────────────────────────────────────────────────┐
│                     PHASE 7 ARCHITECTURE                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────┐         ┌──────────────────┐
│  IoT Service    │────────>│  Notifications   │
│                 │ Events  │     Service      │
│ • New Reading   │         │                  │
│ • Power Alert   │         │ • Event Listener │
└─────────────────┘         │ • Rule Engine    │
                            │ • Send Messages  │
┌─────────────────┐         └──────────────────┘
│  Analytics      │────────>│                  │
│   Service       │ Data    │                  │
└─────────────────┘         └──────────────────┘

                                    │
┌─────────────────┐         ┌──────▼───────────┐
│   Scheduler     │────────>│  Messenger       │
│   (Cron Jobs)   │ Trigger │    Service       │
│                 │         │                  │
│ • Daily Report  │         │ • Send Message   │
│ • Weekly Report │         │ • Graph API      │
└─────────────────┘         └──────────────────┘
                                    │
┌─────────────────┐         ┌──────▼───────────┐
│  Subscribers    │<────────│  Notification    │
│    Service      │ Query   │      Logs        │
│                 │         │                  │
│ • Active Users  │         │ • History        │
│ • Preferences   │         │ • Delivery Status│
└─────────────────┘         └──────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    ADMIN DASHBOARD (FRONTEND)                   │
│                                                                 │
│  Subscriber Table | Notification Logs | Broadcast Center       │
│  Bot Statistics   | Message Metrics   | Subscriber Analytics   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. ENHANCED SUBSCRIBER SCHEMA DESIGN

### 3.1 New Fields to Add

```typescript
@Schema({
  timestamps: true,
  collection: 'subscribers',
})
export class Subscriber {
  // EXISTING FIELDS (Keep as-is)
  facebookUserId: string;
  firstName?: string;
  lastName?: string;
  isSubscribed: boolean;
  subscribedAt: Date;
  unsubscribedAt?: Date;
  lastInteractionAt?: Date;
  preferences: {
    dailyReport: boolean;
    weeklyReport: boolean;
    alerts: boolean;
  };

  // NEW FIELDS FOR PHASE 7
  
  // Status tracking
  @Prop({ type: String, enum: ['active', 'inactive', 'blocked'], default: 'active' })
  status: 'active' | 'inactive' | 'blocked';
  
  // Tags for segmentation
  @Prop({ type: [String], default: [] })
  tags: string[];
  
  // Enhanced preferences
  @Prop({
    type: Object,
    default: {
      dailyReport: true,
      weeklyReport: true,
      alerts: true,
      energyMilestones: true,
      batteryAlerts: true,
      sensorEvents: true,
      systemAlerts: true,
    },
  })
  notificationPreferences: {
    dailyReport: boolean;
    weeklyReport: boolean;
    alerts: boolean;
    energyMilestones: boolean;
    batteryAlerts: boolean;
    sensorEvents: boolean;
    systemAlerts: boolean;
  };
  
  // Notification history counters
  @Prop({ type: Number, default: 0 })
  totalNotificationsReceived: number;
  
  @Prop({ type: Date })
  lastNotificationAt?: Date;
  
  // Blocked reason (if status is 'blocked')
  @Prop({ type: String })
  blockedReason?: string;
  
  @Prop({ type: Date })
  blockedAt?: Date;
}
```

### 3.2 Migration Strategy

**Approach**: Add new fields with sensible defaults, existing subscribers will automatically receive them.

**Default Values**:
- `status`: 'active' (all existing subscribers remain active)
- `tags`: [] (empty array, admin can add later)
- `notificationPreferences`: Merge with existing `preferences`
- `totalNotificationsReceived`: 0
- `lastNotificationAt`: undefined

**Backward Compatibility**: ✅ No breaking changes, existing code continues to work.

---

## 4. NOTIFICATIONS MODULE ARCHITECTURE

### 4.1 Module Structure

```
src/notifications/
├── notifications.module.ts
├── notifications.service.ts
├── notifications.controller.ts (admin endpoints)
├── dto/
│   ├── notification-event.dto.ts
│   ├── broadcast-message.dto.ts
│   ├── notification-log.dto.ts
│   └── notification-query.dto.ts
├── schemas/
│   └── notification-log.schema.ts
└── listeners/
    ├── energy-event.listener.ts
    ├── battery-event.listener.ts
    └── sensor-event.listener.ts
```


### 4.2 NotificationsService Responsibilities

**Core Functions**:
1. **Event Processing**: Listen to IoT/Analytics events and trigger notifications
2. **Rule Engine**: Evaluate notification rules (thresholds, milestones, preferences)
3. **Message Composition**: Format notification messages
4. **Delivery**: Send via MessengerService
5. **Logging**: Record all notifications sent
6. **Broadcast**: Send messages to multiple subscribers

**Key Methods**:
```typescript
// Automated notifications
async sendEnergyMilestone(milestone: number, totalEnergy: number): Promise<void>
async sendBatteryAlert(level: number, sensorName: string): Promise<void>
async sendSensorOnline(sensorName: string, location: string): Promise<void>
async sendSensorOffline(sensorName: string, location: string): Promise<void>
async sendSystemAlert(alertType: string, message: string): Promise<void>

// Scheduled summaries
async sendDailySummary(): Promise<void>
async sendWeeklySummary(): Promise<void>

// Broadcast system
async broadcastMessage(message: string, targetTags?: string[]): Promise<BroadcastResult>
async broadcastToAll(message: string): Promise<BroadcastResult>

// Logging
async logNotification(subscriberId: string, type: string, content: string, status: string): Promise<void>
async getNotificationLogs(query: NotificationQueryDto): Promise<NotificationLog[]>
async getNotificationStats(): Promise<NotificationStats>
```

### 4.3 Event-Driven Notification Triggers


**Energy Milestones**:
- Listen to IoT Service readings
- Track cumulative energy per day
- Trigger when thresholds reached: 100Wh, 500Wh, 1kWh, 5kWh
- Check subscriber preferences: `notificationPreferences.energyMilestones`

**Battery Alerts**:
- Listen to IoT Service readings
- Monitor batteryPercentage field
- Trigger when: <20%, <10%, >=100%
- Check subscriber preferences: `notificationPreferences.batteryAlerts`
- Throttle: Max 1 alert per threshold per 30 minutes

**Sensor Events**:
- Listen to Dashboard Gateway events: `sensor:online`, `sensor:offline`
- Trigger immediately
- Check subscriber preferences: `notificationPreferences.sensorEvents`

**System Alerts**:
- Listen to application events: startup, shutdown, errors
- Trigger for critical events
- Check subscriber preferences: `notificationPreferences.systemAlerts`

### 4.4 Event Listener Implementation Strategy

**Option A: NestJS EventEmitter** (Recommended)
```typescript
// In IoT Service
this.eventEmitter.emit('energy.milestone.reached', {
  milestone: 1000,
  totalEnergy: 1000,
  timestamp: new Date(),
});

// In Notifications Listener
@OnEvent('energy.milestone.reached')
async handleEnergyMilestone(payload: EnergyMilestoneEvent) {
  await this.notificationsService.sendEnergyMilestone(
    payload.milestone,
    payload.totalEnergy
  );
}
```

**Benefits**:
- ✅ Decoupled architecture
- ✅ Easy to test
- ✅ No circular dependencies
- ✅ Built-in to NestJS


**Option B: Direct Service Injection** (Not Recommended)
- Would create circular dependencies
- IoT → Notifications → Messenger → IoT
- Harder to maintain

**Decision**: Use NestJS EventEmitter2 pattern.

---

## 5. NOTIFICATION LOGGING SCHEMA

### 5.1 NotificationLog Schema

```typescript
@Schema({
  timestamps: true,
  collection: 'notification_logs',
})
export class NotificationLog {
  // Recipient
  @Prop({ required: true, index: true })
  subscriberId: string; // Reference to Subscriber.facebookUserId
  
  // Notification details
  @Prop({ required: true, type: String, enum: ['milestone', 'battery', 'sensor', 'system', 'daily_summary', 'weekly_summary', 'broadcast'] })
  type: string;
  
  @Prop({ required: true })
  content: string; // Message text sent
  
  // Delivery tracking
  @Prop({ required: true, type: String, enum: ['pending', 'sent', 'delivered', 'failed'], default: 'pending' })
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  
  @Prop({ type: Date })
  sentAt?: Date;
  
  @Prop({ type: String })
  errorMessage?: string;
  
  // Metadata
  @Prop({ type: Object })
  metadata?: {
    milestone?: number;
    batteryLevel?: number;
    sensorName?: string;
    broadcastId?: string;
  };
}
```

### 5.2 Logging Strategy

**When to Log**:
- Before sending: Create log with status='pending'
- After successful send: Update status='sent', set sentAt
- On delivery confirmation: Update status='delivered' (future: webhook from Facebook)
- On error: Update status='failed', set errorMessage

**Retention**:
- Keep logs for 90 days
- Archive older logs for analytics
- Implement cleanup cron job


---

## 6. SCHEDULED SUMMARIES (CRON JOBS)

### 6.1 Daily Summary

**Schedule**: Every day at 8:00 PM (configurable)
**Cron Expression**: `0 20 * * *`

**Content**:
```
🌞 Daily Energy Report - [Date]

⚡ Today's Generation:
• Total Energy: X.XXX kWh
• Average Power: XX.XX W
• Peak Power: XX.XX W
• Active Hours: X hours

📊 Highlights:
• Best Hour: XX:00 - XX:00 (XX.XX W)
• Readings: XXX

🔋 Battery Status: XX%
🌡️ Average Temperature: XX°C

💡 Tomorrow's weather: [Future enhancement]
```

**Implementation**:
```typescript
@Cron('0 20 * * *', { name: 'daily-summary', timeZone: 'Asia/Manila' })
async sendDailySummaries() {
  const subscribers = await this.subscribersService.getActiveSubscribers();
  
  for (const subscriber of subscribers) {
    // Check preference
    if (!subscriber.notificationPreferences?.dailyReport) continue;
    
    // Get today's analytics
    const summary = await this.analyticsService.getDailySummary(new Date());
    
    // Format message
    const message = this.formatDailySummary(summary);
    
    // Send via Messenger
    await this.messengerService.sendMessage(subscriber.facebookUserId, message);
    
    // Log notification
    await this.logNotification(subscriber.facebookUserId, 'daily_summary', message, 'sent');
  }
}
```

### 6.2 Weekly Summary

**Schedule**: Every Monday at 9:00 AM
**Cron Expression**: `0 9 * * 1`


**Content**:
```
📅 Weekly Energy Report - Week XX

⚡ This Week:
• Total Energy: X.XXX kWh
• Average Daily: X.XXX kWh
• Peak Power: XX.XX W
• Total Readings: XXX

🏆 Best Production Day:
• [Day]: X.XXX kWh

📊 Daily Breakdown:
• Mon: X.XXX kWh
• Tue: X.XXX kWh
• Wed: X.XXX kWh
• Thu: X.XXX kWh
• Fri: X.XXX kWh
• Sat: X.XXX kWh
• Sun: X.XXX kWh

📈 Trend: [UP/DOWN/STABLE] vs last week

💰 Estimated Savings: $XX.XX

🌳 CO₂ Avoided: XX.XX kg
```

### 6.3 Cron Configuration

**Dependencies**:
```bash
npm install @nestjs/schedule
```

**Module Setup**:
```typescript
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(), // Enable scheduling
    // ... other imports
  ],
})
export class NotificationsModule {}
```

---

## 7. NEW BOT COMMANDS

### 7.1 Command: `energy`

**Purpose**: Get current energy generation status
**Response**:
```
⚡ Current Energy Status

📊 Today's Progress:
• Energy Generated: X.XXX kWh
• Current Power: XX.XX W
• Time: XX:XX AM/PM

🎯 Next Milestone:
• XXX Wh (XX% to goal)

💡 Type "today" for full daily report
```


### 7.2 Command: `battery`

**Purpose**: Get current battery status
**Response**:
```
🔋 Battery Status

📊 Current Status:
• Battery Level: XX%
• Status: [Charging/Discharging/Full]
• Temperature: XX°C

⚡ Power Info:
• Voltage: XX.XX V
• Current: X.XXX A

⏱️ Last Updated: X minutes ago

💡 Type "status" for complete system overview
```

### 7.3 Command: `about`

**Purpose**: System information and bot capabilities
**Response**:
```
🌞 Energy Monitor Bot v2.0

📋 About This System:
• Platform: Piezoelectric Energy Monitoring
• Powered by: ESP32 + NestJS + React
• Real-time monitoring & analytics
• Automated notifications

✨ Features:
• Live energy tracking
• Battery monitoring
• Daily & weekly reports
• Environmental impact
• Cost savings analysis

📞 Support:
• Type "help" for commands
• Report issues: admin@energymonitor.com

🔗 Dashboard: https://dashboard.energymonitor.com
```

---

## 8. BROADCAST SYSTEM ARCHITECTURE

### 8.1 Broadcast API Endpoints

**POST /api/notifications/broadcast**
- Admin only (requires JWT authentication + admin role)
- Send message to all subscribers or filtered by tags
- Return broadcast ID and delivery status

**Request Body**:
```typescript
{
  message: string; // Required
  targetTags?: string[]; // Optional: ['vip', 'testers']
  targetAll?: boolean; // Optional: true = all subscribers
  scheduleAt?: Date; // Optional: schedule for later
}
```

**Response**:
```typescript
{
  broadcastId: string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  status: 'completed' | 'in_progress' | 'scheduled';
}
```


### 8.2 Broadcast Implementation

**Process Flow**:
1. Admin submits broadcast via API
2. System validates admin permissions
3. Query subscribers based on filters (tags/all)
4. Create broadcast log entry
5. Send messages asynchronously (queue-based)
6. Update broadcast status
7. Log individual delivery status

**Rate Limiting**:
- Facebook Graph API: 2000 messages/hour per page
- Implement queue with rate limiting
- Batch processing: 50 messages at a time
- Delay between batches: 100ms

**Broadcast Types**:
- **Announcement**: System updates, new features
- **Maintenance Notice**: Scheduled downtime
- **Energy Report**: Special reports, achievements
- **Emergency Alert**: Critical system issues

---

## 9. ADMIN DASHBOARD DESIGN

### 9.1 Frontend Pages Structure

```
frontend/src/features/messenger/
├── pages/
│   ├── SubscribersPage.tsx
│   ├── NotificationLogsPage.tsx
│   ├── BroadcastCenterPage.tsx
│   └── BotStatisticsPage.tsx
├── components/
│   ├── SubscriberTable.tsx
│   ├── SubscriberFilters.tsx
│   ├── NotificationLogTable.tsx
│   ├── BroadcastForm.tsx
│   ├── BotStatsCards.tsx
│   └── MessageDeliveryChart.tsx
├── api/
│   └── messenger.service.ts
└── types/
    └── messenger.types.ts
```

### 9.2 Subscriber Management Page

**Features**:
- Sortable table with all subscribers
- Search by name or PSID
- Filter by status (active/inactive/blocked)
- Filter by tags
- View notification preferences
- View statistics per subscriber
- Export to CSV

**Table Columns**:
- Facebook User ID
- Name
- Status Badge
- Tags
- Subscribed Date
- Last Interaction
- Total Notifications
- Actions (View, Edit, Block)


### 9.3 Notification Logs Page

**Features**:
- Real-time log viewer
- Filter by type, status, date range
- Search by subscriber
- View message content
- Delivery status indicators
- Error messages for failed notifications
- Export logs

**Table Columns**:
- Timestamp
- Subscriber Name
- Type Badge
- Content Preview
- Status Badge (Pending/Sent/Delivered/Failed)
- Actions (View Details, Retry)

### 9.4 Broadcast Center Page

**Features**:
- Compose new broadcast
- Rich text editor for message
- Recipient targeting (all/tags)
- Preview before sending
- Schedule for later
- View broadcast history
- View delivery statistics per broadcast

**Form Fields**:
- Message (textarea, 640 chars max)
- Target: All / By Tags
- Tags selector (multi-select)
- Schedule date/time (optional)
- Send button with confirmation

### 9.5 Bot Statistics Page

**Metrics to Display**:

**Subscriber Metrics**:
- Total Subscribers
- Active Subscribers
- Growth This Week/Month
- Subscription Chart (line chart)

**Message Metrics**:
- Total Messages Sent
- Messages Today/Week/Month
- Delivery Rate (%)
- Failed Messages

**Engagement Metrics**:
- Most Used Commands (bar chart)
- Active Users (last 7 days)
- Average Response Time
- Notification Open Rate (future)

**System Health**:
- Webhook Status
- Last Webhook Event
- API Response Time
- Error Rate

---

## 10. ADMIN API ENDPOINTS

### 10.1 Subscriber Management APIs


```typescript
GET    /api/subscribers              // List all subscribers (paginated)
GET    /api/subscribers/:id           // Get subscriber details
PATCH  /api/subscribers/:id           // Update subscriber (tags, status)
POST   /api/subscribers/:id/block     // Block subscriber
POST   /api/subscribers/:id/unblock   // Unblock subscriber
DELETE /api/subscribers/:id           // Delete subscriber (soft delete)
GET    /api/subscribers/stats         // Subscriber statistics
```

### 10.2 Notification Logs APIs

```typescript
GET    /api/notifications/logs             // List notification logs (paginated, filtered)
GET    /api/notifications/logs/:id         // Get log details
POST   /api/notifications/logs/:id/retry   // Retry failed notification
GET    /api/notifications/stats            // Notification statistics
```

### 10.3 Broadcast APIs

```typescript
POST   /api/notifications/broadcast        // Send broadcast
GET    /api/notifications/broadcasts       // List all broadcasts
GET    /api/notifications/broadcasts/:id   // Get broadcast details
GET    /api/notifications/broadcasts/:id/logs // Get delivery logs for broadcast
```

### 10.4 Bot Analytics APIs

```typescript
GET    /api/messenger/analytics/subscribers    // Subscriber growth over time
GET    /api/messenger/analytics/messages       // Message volume over time
GET    /api/messenger/analytics/commands       // Command usage statistics
GET    /api/messenger/analytics/engagement     // Engagement metrics
```

---

## 11. SECURITY IMPLEMENTATION

### 11.1 Webhook Validation

**Current**: Basic verify token check ✅
**Enhancement**: Add Facebook signature validation

```typescript
// Verify X-Hub-Signature-256 header
private verifyWebhookSignature(body: any, signature: string): boolean {
  const hmac = crypto.createHmac('sha256', this.appSecret);
  const expectedSignature = 'sha256=' + hmac.update(JSON.stringify(body)).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

### 11.2 Duplicate Prevention

**Strategy**: Track message IDs in Redis cache
```typescript
// Store message ID for 24 hours
await this.redis.setex(`msg:${messageId}`, 86400, '1');

// Check before processing
if (await this.redis.exists(`msg:${messageId}`)) {
  return; // Already processed
}
```


### 11.3 Retry Mechanisms

**Exponential Backoff**:
- 1st retry: 5 seconds
- 2nd retry: 15 seconds
- 3rd retry: 60 seconds
- Max retries: 3

**Implementation**:
```typescript
async sendWithRetry(recipientId: string, message: string, retries = 3): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      await this.messengerService.sendMessage(recipientId, message);
      return; // Success
    } catch (error) {
      if (i === retries - 1) throw error; // Last retry failed
      await this.delay(Math.pow(2, i) * 5000); // Exponential backoff
    }
  }
}
```

### 11.4 Admin Route Protection

**Guard Implementation**:
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('subscribers')
export class SubscribersController {
  // All routes require admin role
}
```

**Frontend Protection**:
- Check user role from JWT token
- Hide admin menu items from non-admins
- Redirect to dashboard if unauthorized access attempt

---

## 12. ANALYTICS & TRACKING

### 12.1 Metrics to Track

**Subscriber Metrics**:
```typescript
interface SubscriberMetrics {
  totalSubscribers: number;
  activeSubscribers: number;
  inactiveSubscribers: number;
  blockedSubscribers: number;
  newSubscribersToday: number;
  newSubscribersThisWeek: number;
  newSubscribersThisMonth: number;
  unsubscribesThisWeek: number;
  growthRate: number; // Percentage
}
```

**Message Metrics**:
```typescript
interface MessageMetrics {
  totalMessagesSent: number;
  messagesDelivered: number;
  messagesFailed: number;
  deliveryRate: number; // Percentage
  messagesToday: number;
  messagesThisWeek: number;
  messagesThisMonth: number;
  averageResponseTime: number; // Milliseconds
}
```

**Command Usage**:
```typescript
interface CommandUsage {
  command: string;
  count: number;
  percentage: number;
  lastUsed: Date;
}
```


**Notification Breakdown**:
```typescript
interface NotificationBreakdown {
  type: string;
  count: number;
  deliveryRate: number;
  lastSent: Date;
}

// Types: milestone, battery, sensor, system, daily_summary, weekly_summary, broadcast
```

### 12.2 Analytics Implementation

**Aggregation Pipeline**:
```typescript
// Get subscriber growth over time
async getSubscriberGrowth(days: number = 30): Promise<GrowthData[]> {
  return this.subscriberModel.aggregate([
    {
      $match: {
        subscribedAt: {
          $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$subscribedAt' } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
}
```

---

## 13. IMPLEMENTATION PHASES

### Phase 7.1: Backend Foundation (Priority 1)
**Estimated Time**: 4-6 hours

**Tasks**:
1. ✅ Create architecture document
2. 🔲 Enhance Subscriber schema
3. 🔲 Create NotificationLog schema
4. 🔲 Install @nestjs/schedule and @nestjs/event-emitter
5. 🔲 Create Notifications module structure
6. 🔲 Implement NotificationsService core methods
7. 🔲 Add new bot commands (energy, battery, about)
8. 🔲 Implement notification logging

**Deliverables**:
- Enhanced schemas migrated
- Notifications module created
- New commands working
- Logging functional

### Phase 7.2: Event-Driven Notifications (Priority 2)
**Estimated Time**: 3-4 hours

**Tasks**:
1. 🔲 Install EventEmitter2
2. 🔲 Add event emission in IoT Service
3. 🔲 Create event listeners
4. 🔲 Implement energy milestone tracking
5. 🔲 Implement battery alert logic
6. 🔲 Implement sensor online/offline notifications
7. 🔲 Test automated notifications

**Deliverables**:
- Energy milestones trigger notifications
- Battery alerts working
- Sensor events trigger notifications


### Phase 7.3: Scheduled Summaries (Priority 3)
**Estimated Time**: 2-3 hours

**Tasks**:
1. 🔲 Configure ScheduleModule
2. 🔲 Implement daily summary cron job
3. 🔲 Implement weekly summary cron job
4. 🔲 Format summary messages
5. 🔲 Test scheduled jobs (manual trigger)
6. 🔲 Add timezone support

**Deliverables**:
- Daily summaries sent at 8 PM
- Weekly summaries sent Monday 9 AM
- Respects subscriber preferences

### Phase 7.4: Admin Backend APIs (Priority 4)
**Estimated Time**: 3-4 hours

**Tasks**:
1. 🔲 Create admin subscribers controller
2. 🔲 Implement subscriber CRUD endpoints
3. 🔲 Implement notification logs endpoints
4. 🔲 Implement broadcast endpoints
5. 🔲 Implement analytics endpoints
6. 🔲 Add admin guards and role checks
7. 🔲 Test all endpoints with Postman

**Deliverables**:
- All admin APIs functional
- Proper authentication and authorization
- API documentation updated

### Phase 7.5: Frontend Admin Dashboard (Priority 5)
**Estimated Time**: 6-8 hours

**Tasks**:
1. 🔲 Create messenger feature structure
2. 🔲 Build SubscribersPage with table
3. 🔲 Build NotificationLogsPage
4. 🔲 Build BroadcastCenterPage
5. 🔲 Build BotStatisticsPage
6. 🔲 Create API service layer
7. 🔲 Add routing and navigation
8. 🔲 Style with Tailwind CSS
9. 🔲 Add loading/error states
10. 🔲 Test all features

**Deliverables**:
- Complete admin dashboard
- All pages functional
- Responsive design
- Production-ready UI

### Phase 7.6: Testing & Documentation (Priority 6)
**Estimated Time**: 2-3 hours

**Tasks**:
1. 🔲 Test webhook verification
2. 🔲 Test all bot commands
3. 🔲 Test subscribe/unsubscribe flow
4. 🔲 Test automated notifications
5. 🔲 Test scheduled summaries
6. 🔲 Test broadcast system
7. 🔲 Test admin pages
8. 🔲 Create user documentation
9. 🔲 Create admin guide
10. 🔲 Update API documentation
11. 🔲 Create PHASE-7-COMPLETE.md

**Deliverables**:
- All features tested and verified
- Documentation complete
- Ready for production


---

## 14. DATABASE QUERIES & INDEXES

### 14.1 Required Indexes

**Subscribers Collection**:
```typescript
// Existing
{ facebookUserId: 1 } // unique

// New indexes for Phase 7
{ status: 1, isSubscribed: 1 } // Filter active subscribers
{ tags: 1 } // Filter by tags for broadcasts
{ subscribedAt: 1 } // Sort by subscription date
{ lastInteractionAt: 1 } // Sort by activity
```

**NotificationLogs Collection**:
```typescript
{ subscriberId: 1, createdAt: -1 } // Get logs per subscriber
{ type: 1, createdAt: -1 } // Filter by notification type
{ status: 1 } // Filter by delivery status
{ createdAt: -1 } // Sort by date (most recent first)
{ 'metadata.broadcastId': 1 } // Get logs per broadcast
```

### 14.2 Common Queries

**Get Active Subscribers for Broadcast**:
```typescript
db.subscribers.find({
  isSubscribed: true,
  status: 'active',
  'notificationPreferences.alerts': true
}).sort({ subscribedAt: -1 });
```

**Get Recent Notification Logs**:
```typescript
db.notification_logs.find({
  subscriberId: 'USER_PSID'
}).sort({ createdAt: -1 }).limit(50);
```

**Get Failed Notifications**:
```typescript
db.notification_logs.find({
  status: 'failed',
  createdAt: { $gte: new Date(Date.now() - 24*60*60*1000) }
});
```

---

## 15. ENVIRONMENT VARIABLES

### 15.1 New Configuration

Add to `.env`:
```bash
# Messenger Bot Configuration (existing)
MESSENGER_PAGE_ACCESS_TOKEN=your_page_access_token
MESSENGER_VERIFY_TOKEN=your_verify_token
MESSENGER_APP_SECRET=your_app_secret

# Notification Settings (new)
NOTIFICATION_DAILY_SUMMARY_HOUR=20  # 8 PM
NOTIFICATION_WEEKLY_SUMMARY_DAY=1   # Monday
NOTIFICATION_WEEKLY_SUMMARY_HOUR=9  # 9 AM
NOTIFICATION_TIMEZONE=Asia/Manila
NOTIFICATION_RATE_LIMIT=50          # Messages per batch
NOTIFICATION_BATCH_DELAY=100        # Milliseconds between batches

# Energy Milestones (new)
MILESTONE_100WH=true
MILESTONE_500WH=true
MILESTONE_1KWH=true
MILESTONE_5KWH=true

# Battery Thresholds (new)
BATTERY_ALERT_LOW_1=20      # First warning
BATTERY_ALERT_LOW_2=10      # Critical warning
BATTERY_ALERT_FULL=100      # Full battery

# Redis (for duplicate prevention - optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```


---

## 16. DEPENDENCIES TO INSTALL

### 16.1 Backend Dependencies

```bash
# Scheduling support
npm install @nestjs/schedule

# Event emitter
npm install @nestjs/event-emitter

# Optional: Redis for duplicate prevention
npm install ioredis @nestjs/ioredis
```

### 16.2 Frontend Dependencies

No new dependencies required. Using existing:
- React 18
- TypeScript
- Tailwind CSS v4
- Axios (for API calls)
- React Router (for navigation)

---

## 17. TESTING STRATEGY

### 17.1 Unit Tests

**NotificationsService**:
- Test sendEnergyMilestone()
- Test sendBatteryAlert()
- Test sendDailySummary()
- Test broadcastMessage()
- Test notification logging

**Event Listeners**:
- Test energy milestone detection
- Test battery threshold detection
- Test event payload parsing

### 17.2 Integration Tests

**Webhook Flow**:
- Test webhook verification
- Test message processing
- Test command routing
- Test subscriber updates

**Scheduled Jobs**:
- Test cron job execution
- Test summary message formatting
- Test preference filtering

### 17.3 Manual Testing Checklist

**Bot Commands**:
- [ ] `help` - Shows command list
- [ ] `status` - Shows comprehensive analytics
- [ ] `today` - Shows today's summary
- [ ] `week` - Shows weekly summary
- [ ] `month` - Shows monthly summary
- [ ] `peak` - Shows peak generation
- [ ] `impact` - Shows environmental impact
- [ ] `savings` - Shows cost savings
- [ ] `energy` - Shows current energy status (NEW)
- [ ] `battery` - Shows battery status (NEW)
- [ ] `about` - Shows system info (NEW)
- [ ] `subscribe` - Subscribes user
- [ ] `unsubscribe` - Unsubscribes user

**Automated Notifications**:
- [ ] Energy milestone (100Wh)
- [ ] Energy milestone (500Wh)
- [ ] Energy milestone (1kWh)
- [ ] Energy milestone (5kWh)
- [ ] Battery alert (<20%)
- [ ] Battery alert (<10%)
- [ ] Battery full (100%)
- [ ] Sensor online notification
- [ ] Sensor offline notification
- [ ] System alert

**Scheduled Summaries**:
- [ ] Daily summary sends at correct time
- [ ] Weekly summary sends on Monday
- [ ] Respects subscriber preferences
- [ ] Correct data formatting

**Admin Dashboard**:
- [ ] Subscriber table loads
- [ ] Filter by status works
- [ ] Search subscribers works
- [ ] Edit subscriber works
- [ ] Block/unblock works
- [ ] Notification logs load
- [ ] Filter logs by type/status works
- [ ] Broadcast form works
- [ ] Tag targeting works
- [ ] Broadcast history shows
- [ ] Bot statistics display correctly


---

## 18. INNOVATION & COMPETITIVE ADVANTAGES

### 18.1 What Makes This Special

**Real-Time Intelligence**:
- Unlike traditional monitoring dashboards, users receive proactive notifications
- Energy milestones create gamification and engagement
- Battery alerts prevent system downtime
- Sensor health monitoring ensures reliability

**Conversational Interface**:
- No app installation required (Messenger is already on phones)
- Natural language commands (type "energy" instead of navigating menus)
- Instant responses without opening dashboard
- Accessible to non-technical users

**Personalization**:
- Granular notification preferences (7 different types)
- Tag-based targeting for broadcasts
- Custom scheduling per timezone
- Preference-aware delivery

**Admin Intelligence**:
- Complete visibility into subscriber engagement
- Delivery tracking and retry mechanisms
- Broadcast system for announcements
- Command usage analytics for feature planning

**Scalability**:
- Event-driven architecture (decoupled)
- Queue-based broadcast delivery
- Rate limiting compliance with Facebook API
- Efficient database queries with proper indexing

### 18.2 Future Enhancements (Post Phase 7)

**Phase 8 Possibilities**:
- AI-powered energy predictions ("Tomorrow will be sunny, expect +20% generation")
- Weather integration for forecasting
- Anomaly detection ("Unusual drop in voltage detected")
- Multi-language support
- Voice command integration
- WhatsApp/Telegram support
- SMS fallback for critical alerts
- Rich media messages (charts, graphs)
- Interactive quick replies and buttons
- Subscription tiers (basic/premium)

---

## 19. RISK MITIGATION

### 19.1 Identified Risks

**Risk**: Facebook API rate limits exceeded
**Mitigation**: Implement queue with rate limiting, batch processing, delay between batches

**Risk**: Notification spam overwhelming users
**Mitigation**: Granular preferences, throttling (max 1 per threshold per 30 min), unsubscribe option

**Risk**: Failed message delivery
**Mitigation**: Retry mechanism with exponential backoff, logging, admin visibility

**Risk**: Circular dependencies (IoT → Notifications → Messenger → IoT)
**Mitigation**: Use EventEmitter2 for decoupled event-driven architecture

**Risk**: Database performance with large notification logs
**Mitigation**: Proper indexing, pagination, log retention policy, archival

**Risk**: Admin dashboard unauthorized access
**Mitigation**: JWT authentication, role-based guards, frontend route protection

**Risk**: Webhook security vulnerabilities
**Mitigation**: Signature verification, duplicate prevention, HTTPS only

### 19.2 Monitoring & Alerts

**Health Checks**:
- Webhook endpoint availability
- Facebook Graph API response time
- Failed notification rate
- Cron job execution status
- Database connection health

**Alerts to Admin** (via system notifications):
- Webhook verification failure
- High failed notification rate (>10%)
- Cron job missed execution
- Database connection issues
- Facebook API errors


---

## 20. DEPLOYMENT CONSIDERATIONS

### 20.1 Production Checklist

**Environment**:
- [ ] Set MESSENGER_APP_SECRET for signature verification
- [ ] Configure NOTIFICATION_TIMEZONE correctly
- [ ] Set production CORS_ORIGIN
- [ ] Enable HTTPS for webhook
- [ ] Configure Redis for duplicate prevention (optional)

**Facebook Configuration**:
- [ ] Verify webhook URL with Facebook
- [ ] Subscribe to messaging webhook events
- [ ] Set page access token with correct permissions
- [ ] Configure page response time settings
- [ ] Enable "Get Started" button

**Database**:
- [ ] Create required indexes
- [ ] Set up log retention policy
- [ ] Configure automated backups
- [ ] Monitor collection sizes

**Monitoring**:
- [ ] Set up application logging
- [ ] Configure error tracking (Sentry)
- [ ] Set up uptime monitoring
- [ ] Configure performance monitoring

**Cron Jobs**:
- [ ] Verify cron schedule with timezone
- [ ] Test manual cron execution
- [ ] Set up cron job monitoring
- [ ] Configure failure alerts

---

## 21. SUCCESS METRICS

### 21.1 Key Performance Indicators (KPIs)

**Adoption Metrics**:
- Total subscribers
- Monthly active users (sent at least 1 command)
- Subscription growth rate
- Unsubscribe rate (<5% target)

**Engagement Metrics**:
- Commands per user per week
- Most popular commands
- Response time (target: <2s)
- Message open rate (future with read receipts)

**Delivery Metrics**:
- Notification delivery rate (target: >95%)
- Failed notification rate (target: <5%)
- Average retry attempts
- Broadcast success rate

**System Health**:
- Webhook uptime (target: 99.9%)
- API response time (target: <500ms)
- Cron job execution success (target: 100%)
- Database query performance

### 21.2 Launch Goals (First 30 Days)

- [ ] 50+ active subscribers
- [ ] 95%+ delivery success rate
- [ ] <2s average response time
- [ ] 100% cron job execution
- [ ] Zero security incidents
- [ ] <5% unsubscribe rate

---

## 22. CONCLUSION

Phase 7 transforms the Piezoelectric Energy Monitoring System from a passive dashboard into an intelligent notification platform. By leveraging Facebook Messenger's ubiquity and implementing event-driven automation, users receive proactive energy insights without needing to open the dashboard.

The architecture is designed for:
- ✅ **Scalability**: Event-driven, queue-based, rate-limited
- ✅ **Reliability**: Retry mechanisms, logging, monitoring
- ✅ **Security**: Authentication, signature verification, admin guards
- ✅ **Maintainability**: Clean separation of concerns, well-documented
- ✅ **User Experience**: Personalized, conversational, non-intrusive
- ✅ **Innovation**: Proactive notifications, gamification, admin intelligence

**Total Estimated Time**: 20-28 hours
**Complexity**: High (multiple integrations, event-driven, cron jobs, admin dashboard)
**Impact**: Revolutionary (transforms passive monitoring into active engagement)

---

## NEXT STEPS

Ready to begin implementation:

1. **Phase 7.1**: Backend Foundation (enhance schemas, create notifications module)
2. **Phase 7.2**: Event-Driven Notifications (listeners, automated triggers)
3. **Phase 7.3**: Scheduled Summaries (cron jobs, daily/weekly reports)
4. **Phase 7.4**: Admin Backend APIs (CRUD, broadcast, analytics)
5. **Phase 7.5**: Frontend Admin Dashboard (pages, components, routing)
6. **Phase 7.6**: Testing & Documentation (verification, docs, completion)

**Architecture Review Complete** ✅

Awaiting confirmation to proceed with Phase 7.1 implementation.
