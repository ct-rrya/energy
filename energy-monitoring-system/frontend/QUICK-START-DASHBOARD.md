# Dashboard Quick Start Guide

## 🚀 Start the Application

### 1. Start the Backend (Terminal 1)
```bash
cd energy-monitoring-system
npm run start:dev
```
Backend will run on: `http://localhost:3000`

### 2. Start the Frontend (Terminal 2)
```bash
cd energy-monitoring-system/frontend
npm run dev
```
Frontend will run on: `http://localhost:5173` or `http://localhost:5174`

## 🔐 Login Credentials
- **Email**: `admin@energymonitor.com`
- **Password**: `Admin@2024!`

## 📊 Dashboard Features

### Statistics Cards (8)
1. Energy Generated - Total energy with trend
2. Voltage - Current voltage (V)
3. Current - Current amperage (A)
4. Power - Current power (W)
5. Battery Level - Battery percentage with color coding
6. Estimated Daily Energy - Projected daily generation
7. Active Sensors - Connected sensor count
8. Connected Devices - Device count

### Widget Cards (4)
1. **System Status** - API, Database, WebSocket health
2. **Live Sensor Data** - Most recent sensor reading
3. **Recent Activity** - Last 5 system events
4. **Quick Actions** - Navigation shortcuts

### Interactive Elements
- **Refresh Button** - Manually refresh all data
- **WebSocket Status** - Live connection indicator
- **Quick Actions** - Navigate to Sensors, Analytics, Reports
- **Auto-refresh** - Data updates every 30-60 seconds

## 🔄 Data Flow

### API Endpoints
- `GET /dashboard/metrics` - Dashboard metrics (auto-refresh: 30s)
- `GET /health` - System health check (auto-refresh: 60s)

### WebSocket Events (When Enabled)
- `dashboard:metrics` - Real-time dashboard updates
- `sensor:reading` - Live sensor data
- `system:status` - System status changes

## 🎨 Responsive Layout
- **Mobile**: 1 column
- **Tablet**: 2 columns
- **Desktop**: 4 columns (stats), 2 columns (widgets)

## 🐛 Troubleshooting

### Backend Not Connecting
- Ensure backend is running on `http://localhost:3000`
- Check `.env` file: `CORS_ORIGIN=http://localhost:5173`
- Verify MongoDB is running

### Dashboard Shows "Unable to Load"
- Backend must be running
- Check browser console for API errors
- Verify login credentials are correct

### No Real Data Showing
- Mock data is displayed until hardware is connected
- Backend returns empty/zero values initially
- Dashboard gracefully handles empty states

## 📁 Key Files
- **Main Page**: `src/features/dashboard/pages/DashboardPage.tsx`
- **Components**: `src/features/dashboard/components/`
- **Hooks**: `src/features/dashboard/hooks/`
- **Types**: `src/features/dashboard/types/dashboard.types.ts`
- **WebSocket**: `src/contexts/SocketContext.tsx`

## ✅ Verification Checklist
- [ ] Backend running on port 3000
- [ ] Frontend running on port 5173/5174
- [ ] Login successful
- [ ] Dashboard loads without errors
- [ ] All 8 statistics cards visible
- [ ] All 4 widget cards visible
- [ ] System status shows API/DB connected
- [ ] Refresh button works
- [ ] Quick actions navigate correctly

## 🔧 Next Development Steps
1. **Enable WebSocket** - Uncomment `connect()` in SocketContext.tsx
2. **Connect Hardware** - ESP32 sensors transmit data
3. **Real Activities** - Implement backend activities API
4. **Phase 5** - Build Sensor Management module
