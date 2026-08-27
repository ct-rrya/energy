# 🎨 EcoStep UI - Viewing Guide

**Date**: August 24, 2026  
**Status**: ✅ All Services Running

---

## 🚀 Quick Access

### Frontend (Main Interface)
**URL**: http://localhost:5173

### Backend API
**URL**: http://localhost:3000/api  
**Swagger Docs**: http://localhost:3000/api/docs

### Public Access (ngrok)
**URL**: https://prelusorily-trimerous-roselle.ngrok-free.dev

---

## 🔐 Login Credentials

```
Email: admin@energymonitor.com
Password: Admin@2024!
```

---

## 🎨 What You'll See

### 1. Login Page (http://localhost:5173/login)

**Visual Features:**
- ✅ Warm cream background (#FFF4E1)
- ✅ Gradient blobs (mint green and teal) - decorative
- ✅ Large centered login card with white background
- ✅ Deep forest green logo with mint green lightning icon
- ✅ Teal "Sign In" button
- ✅ Demo credentials displayed below

**Key Elements:**
```
┌────────────────────────────────────┐
│  [Gradient Background Effects]    │
│                                     │
│         🟢 Logo (Forest Green)    │
│         ⚡ (Mint Green Icon)      │
│                                     │
│         EcoStep                    │
│    Energy Monitoring Dashboard    │
│                                     │
│   ┌─────────────────────────┐     │
│   │  Email Input (Teal)     │     │
│   │  Password Input (Teal)  │     │
│   │  [Sign In - Teal]       │     │
│   └─────────────────────────┘     │
│                                     │
│      Demo Credentials Box         │
└────────────────────────────────────┘
```

---

### 2. Dashboard Page (http://localhost:5173/dashboard)

**Sidebar (Left):**
- ✅ Deep forest green background (#1A312C)
- ✅ White text with 80% opacity
- ✅ Mint green icons (#89D7B7)
- ✅ Teal hover states (#428475 with opacity)
- ✅ Navigation items with icons
- ✅ User profile section at bottom

**Main Content Area:**
- ✅ Warm cream background (#FFF4E1)
- ✅ White stat cards with shadows
- ✅ Deep forest green headings
- ✅ Teal interactive elements

**Page Header:**
- ✅ "Dashboard" title in forest green
- ✅ "Last updated" time in lighter green
- ✅ Mint green "Live" indicator (animated pulse)
- ✅ Teal "Refresh" button with border

**Stats Grid (4x2 Layout):**
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ 🟢⚡        │ │ 🟡⚡        │ │ 🔵📊        │ │ 🟢📈        │
│ Energy Gen.  │ │ Voltage      │ │ Current      │ │ Power        │
│ 1.234 kWh   │ │ 12.5 V      │ │ 1.2 A       │ │ 15.0 W      │
│ ↗ 12.5%     │ │              │ │              │ │              │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘

┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ 🔋🔋        │ │ 🟢📈        │ │ 📡📡        │ │ 📡💻        │
│ Battery      │ │ Est. Daily   │ │ Active Sen.  │ │ Connected    │
│ 89%         │ │ 2.5 kWh     │ │ 3           │ │ 2           │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

**Color Coding:**
- Icon backgrounds: Soft teal, mint, blue, yellow
- Values: Deep forest green (large, bold)
- Labels: Medium green (small, uppercase)
- Trend badges: Mint green background

---

### 3. Color Examples Throughout UI

**Primary Text:**
```css
color: #1A312C (Deep Forest Green)
```

**Interactive Buttons:**
```css
background: #428475 (Muted Teal)
hover: #35695E (Darker Teal)
```

**Success Indicators:**
```css
background: #89D7B7 (Fresh Mint)
```

**Page Background:**
```css
background: #FFF4E1 (Warm Cream)
```

**Cards:**
```css
background: #FFFFFF (White)
border: 1px rgba(26, 49, 44, 0.1)
shadow: 0 2px 8px rgba(26, 49, 44, 0.06)
```

---

## 📸 Screenshots Checklist

### Must Capture:

1. **Login Page** (Full Screen)
   - [ ] Shows warm cream background
   - [ ] Gradient blobs visible
   - [ ] Login card centered
   - [ ] Demo credentials visible

2. **Dashboard - Sidebar** (Full Height)
   - [ ] Dark forest green background
   - [ ] Mint green icons
   - [ ] White navigation text
   - [ ] User profile at bottom
   - [ ] Logo at top

3. **Dashboard - Stats Grid** (Wide View)
   - [ ] All 8 stat cards visible
   - [ ] Icon backgrounds colored
   - [ ] Trend badges visible
   - [ ] Values and labels clear

4. **Dashboard - Header** (Top Section)
   - [ ] "Dashboard" title
   - [ ] Live indicator (animated)
   - [ ] Refresh button
   - [ ] Last updated time

5. **Interactive Elements**
   - [ ] Hover state on sidebar item
   - [ ] Hover state on stat card
   - [ ] Hover state on button
   - [ ] Focus state on input

6. **Mobile View** (Responsive)
   - [ ] Login page on mobile
   - [ ] Dashboard with collapsed sidebar
   - [ ] Stat cards stacked vertically

---

## 🎥 Recording Demo Video

### Suggested Flow:

**1. Start at Login (0:00-0:05)**
- Show the warm cream background
- Highlight the logo and color scheme
- Type credentials slowly

**2. Login Animation (0:05-0:08)**
- Click Sign In button
- Show loading state
- Transition to dashboard

**3. Dashboard Tour (0:08-0:30)**
- Pan across sidebar (highlight forest green)
- Show navigation items with mint icons
- Scroll through stat cards
- Highlight the color consistency

**4. Interaction Demo (0:30-0:45)**
- Hover over sidebar items (show teal hover)
- Hover over stat cards (show shadow lift)
- Click refresh button
- Show live indicator pulsing

**5. Page Navigation (0:45-1:00)**
- Click through different pages
- Show consistent color scheme
- Return to dashboard

**6. Responsive Demo (1:00-1:15)**
- Resize browser window
- Show mobile layout
- Expand back to desktop

---

## 🎨 Color Verification

### Check These Elements:

**Background Colors:**
- [ ] Page background: #FFF4E1 (cream)
- [ ] Sidebar: #1A312C (forest green)
- [ ] Cards: #FFFFFF (white)

**Text Colors:**
- [ ] Headings: #1A312C (forest green)
- [ ] Body: rgba(26, 49, 44, 0.7)
- [ ] Sidebar text: white 80%

**Interactive Colors:**
- [ ] Primary button: #428475 (teal)
- [ ] Hover state: darker teal
- [ ] Focus ring: teal with opacity

**Accent Colors:**
- [ ] Icons in sidebar: #89D7B7 (mint)
- [ ] Success badges: mint green
- [ ] Live indicator: mint green

**Shadows:**
- [ ] Cards: soft shadow with green tint
- [ ] Hover: darker shadow
- [ ] Buttons: subtle shadow

---

## 🔍 Quality Check

### Visual Consistency:
- [ ] All headings use forest green
- [ ] All interactive elements use teal
- [ ] All success indicators use mint
- [ ] No random colors introduced

### Spacing:
- [ ] Generous whitespace between sections
- [ ] Cards have 1.5rem padding
- [ ] Section gaps are 2rem
- [ ] Elements breathe properly

### Typography:
- [ ] Headings are bold and clear
- [ ] Body text is readable
- [ ] Labels are uppercase and small
- [ ] Font sizes create hierarchy

### Shadows:
- [ ] Soft and natural
- [ ] Green tint (rgba(26, 49, 44, X))
- [ ] Lift on hover
- [ ] Not too harsh

### Borders:
- [ ] Subtle and thin
- [ ] Rounded corners (1rem)
- [ ] Consistent throughout

---

## 🖱️ Interactive Testing

### Test These Interactions:

**Sidebar:**
1. Hover over each navigation item
   - Should show teal background
   - Icon should brighten
   - Text should be 100% white

2. Click navigation items
   - Should navigate to page
   - Active state should be visible

**Stat Cards:**
1. Hover over cards
   - Shadow should lift
   - Slight scale effect (via group-hover)

**Buttons:**
1. Hover over buttons
   - Background darkens
   - Shadow increases
   - Smooth transition

2. Click buttons
   - Active state visible
   - Loading spinner if applicable

**Inputs:**
1. Focus on input
   - Teal border appears
   - Ring effect shows
   - Smooth transition

2. Type in input
   - Text is forest green
   - Placeholder is lighter

**Live Indicator:**
1. Observe pulsing animation
   - Smooth pulse
   - Mint green color
   - Outer ring fades

---

## 📱 Responsive Breakpoints

### Desktop (1024px+):
- Full sidebar visible
- 4-column stat grid
- All elements expanded

### Tablet (768px-1023px):
- Full sidebar visible
- 2-column stat grid
- Compact spacing

### Mobile (<768px):
- Sidebar collapsed/hamburger
- 1-column stat grid
- Stacked layout
- Larger touch targets

---

## 🎯 Key Selling Points

When demonstrating, emphasize:

1. **Cohesive Color Palette**
   - Earth tones communicate sustainability
   - Consistent throughout application
   - Professional and modern

2. **Visual Hierarchy**
   - Important information stands out
   - Clear distinction between sections
   - Easy to scan

3. **Generous Whitespace**
   - Not cluttered
   - Easy on the eyes
   - Professional appearance

4. **Thoughtful Interactions**
   - Smooth transitions
   - Clear hover states
   - Accessible focus indicators

5. **Responsive Design**
   - Works on all devices
   - Maintains visual identity
   - Touch-friendly

6. **Brand Identity**
   - Communicates "energy + monitoring"
   - Feels sustainable and eco-friendly
   - Modern tech aesthetic

---

## 🐛 Known Issues / Notes

### Current Status:
✅ All colors implemented correctly
✅ Layout responsive and working
✅ Interactions smooth and polished
✅ Typography hierarchy clear
✅ Shadows and borders consistent

### Browser Compatibility:
- ✅ Chrome/Edge (tested)
- ✅ Firefox (should work)
- ✅ Safari (should work)
- ❌ IE11 (not supported)

---

## 🎓 For Presentation

### Key Points to Mention:

1. **Design System**
   - Custom color palette inspired by nature
   - Forest green for stability/trust
   - Teal for energy/technology
   - Mint for growth/success

2. **User Experience**
   - Clean, modern interface
   - Easy navigation
   - Clear information hierarchy
   - Real-time updates visible

3. **Technical Implementation**
   - Tailwind CSS for styling
   - CSS custom properties for colors
   - Responsive design
   - Accessible components

4. **Consistency**
   - Color usage is systematic
   - Components follow patterns
   - Predictable interactions
   - Professional polish

---

## 📊 Comparison to Mock Data

If you don't have real sensor data yet:

### Option 1: Use Mock Data
The system will show placeholder values (0s) if no data exists

### Option 2: Inject Test Data
Use the backend API to submit test readings:
```bash
curl -X POST http://localhost:3000/api/iot/readings \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_SENSOR_API_KEY" \
  -d '{
    "sensorId": "YOUR_SENSOR_ID",
    "timestamp": "2026-08-24T20:00:00Z",
    "voltageV": 12.5,
    "currentA": 1.2,
    "powerW": 15.0
  }'
```

---

**Ready to view and demonstrate! 🎉**

**Access URL**: http://localhost:5173  
**Login**: admin@energymonitor.com / Admin@2024!
