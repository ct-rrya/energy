# Messenger Bot - Quick Start Guide

## Available Commands

### 📊 Analytics

```
help          Show this menu
status        Complete energy overview
today         Today's energy summary
week          This week's energy summary
month         This month's energy summary
peak          Peak generation this month
impact        Environmental impact analysis
savings       Cost savings analysis
```

### 🔔 Notifications

```
subscribe     Get daily energy updates
unsubscribe   Stop receiving updates
```

---

## Example Conversations

### Get Today's Energy

**You**: `today`

**Bot**:
```
🌞 Today's Energy (2026-07-18)
Friday

⚡ Generation:
• Total Energy: 12.345 kWh
• Average Power: 500.25 W
• Peak Power: 1200.50 W
• Minimum Power: 50.10 W

📊 Activity:
• Readings: 144

💡 Type "week" for weekly summary or "month" for monthly.
```

### Get Complete Status

**You**: `status`

**Bot**:
```
📊 Energy Status

🌞 Today:
• Energy: 12.345 kWh
• Average Power: 500.25 W
• Peak: 1200.50 W

📅 This Week:
• Energy: 86.415 kWh
• Readings: 1008

📆 This Month:
• Energy: 345.678 kWh
• Days with data: 18/31

⚡ Peak Generation:
• 1500.75 W on 2026-07-15 at 13:30:00

🌳 Environmental Impact:
• CO₂ Avoided: 172.84 kg
• Trees Equivalent: 8.2 trees/year

💰 Cost Savings:
• This Month: $41.48
• Yearly Projection: $498.97

📈 Trend: 📈 UP (+12.5%)
```

### Check Environmental Impact

**You**: `impact`

**Bot**:
```
🌳 Environmental Impact This Month

🌍 CO₂ Emissions Avoided:
• 172.84 kg of CO₂

🌲 Equivalent Impact:
• 8.2 trees planted (for a year)
• 155.35 kg of coal not burned
• 11.5 home-days of power
• 28,807 phone charges

✨ Every kWh you generate helps fight climate change!

💡 Type "savings" to see your cost savings.
```

### Subscribe to Updates

**You**: `subscribe`

**Bot**:
```
🔔 Subscribed Successfully!

You will now receive:
• Daily energy summaries
• Weekly reports
• Important alerts

To unsubscribe, type "unsubscribe" anytime.

💡 Type "status" to see your current energy stats.
```

---

## Setup Instructions

### For Users

1. Search for your Energy Monitor Bot on Facebook Messenger
2. Click "Get Started" or type `help`
3. Start asking questions!
4. Type `subscribe` to get daily updates

### For Admins

See [PHASE-9-MESSENGER-SUMMARY.md](PHASE-9-MESSENGER-SUMMARY.md) for complete setup instructions.

---

## Tips

- Commands are **case-insensitive** (`HELP` = `help`)
- Use **aliases** for convenience (`stats` = `status`, `weekly` = `week`)
- Type `help` anytime to see available commands
- Bot responds within seconds
- All data is **real-time** from your energy monitoring system

---

## Troubleshooting

### Bot Not Responding?

1. Check if bot is online (should auto-respond to any message)
2. Try typing `help` to reset conversation
3. Check if your webhook is configured correctly

### No Data Available?

1. Ensure IoT devices are sending data
2. Check if sensors are registered in the system
3. Verify database connection

### Want More Features?

The bot supports extensibility. New commands can be added in:
- `src/messenger/messenger.service.ts`
- `handleMessage()` method

---

## Support

For technical support, contact your system administrator.

For Facebook Messenger issues, visit: https://www.facebook.com/help/messenger-app
