# EcoStep Design System

## Color Palette

### Primary Colors

#### Base/Background - Warm Cream
- **#FFF4E1** - Primary background color
- Creates a warm, natural, sustainable feeling
- Used for: Page backgrounds, canvas, container backgrounds

#### Deep Forest Green - #1A312C
- Primary dark color for strong contrast
- Used for: Sidebar/navbar, headings, important text, icons, high-priority UI elements
- Represents: Nature, sustainability, stability

#### Muted Teal Green - #428475
- Primary accent for interactive elements
- Used for: Primary actions, active states, chart data, highlights, interactive components
- Represents: Energy, growth, technology

#### Fresh Mint Green - #89D7B7
- Secondary accent for positive indicators
- Used sparingly for: Success states, secondary data, badges, progress, decorative elements
- Represents: Freshness, positivity, renewable energy

---

## Color Usage Guide

### Text
- **Primary text**: #1A312C (Deep Forest Green) - headings, important text
- **Secondary text**: rgba(26, 49, 44, 0.7) - body text
- **Tertiary text**: rgba(26, 49, 44, 0.5) - helper text, labels

### Backgrounds
- **Page background**: #FFF4E1 (Warm Cream)
- **Card background**: #FFFFFF (White)
- **Sidebar**: #1A312C (Deep Forest Green)
- **Hover states**: rgba(66, 132, 117, 0.1) - light teal overlay

### Interactive Elements
- **Primary buttons**: #428475 (Muted Teal) background, white text
- **Primary button hover**: Darker shade #35695E
- **Secondary buttons**: White background, #428475 border and text
- **Links**: #428475 (Muted Teal)
- **Link hover**: Darker shade

### Status & Feedback
- **Success**: #89D7B7 (Fresh Mint) - successful operations, positive metrics
- **Warning**: #F59E0B (Amber) - warnings, attention needed
- **Error**: #EF4444 (Red) - errors, critical states
- **Info**: #3B82F6 (Blue) - informational messages

### Charts & Data Visualization
- **Primary data series**: #428475 (Muted Teal)
- **Secondary data series**: #89D7B7 (Fresh Mint)
- **Reference lines**: #1A312C (Deep Forest Green)
- **Grid lines**: rgba(26, 49, 44, 0.1)
- **Chart background**: #FFF4E1 (Warm Cream)

---

## Typography

### Font Family
- **Primary**: 'Inter', system-ui, sans-serif
- Clean, modern, highly readable

### Font Weights
- **Light**: 300 - Decorative, large text
- **Regular**: 400 - Body text
- **Medium**: 500 - Emphasized text
- **Semibold**: 600 - Subheadings
- **Bold**: 700 - Headings
- **Extra Bold**: 800-900 - Hero text

### Font Sizes
- **Hero**: 3xl-4xl (30-36px)
- **H1**: 2xl-3xl (24-30px)
- **H2**: xl-2xl (20-24px)
- **H3**: lg-xl (18-20px)
- **H4**: base-lg (16-18px)
- **Body**: base (16px)
- **Small**: sm (14px)
- **Tiny**: xs (12px)

---

## Spacing

### Padding
- **Card padding**: 1.5rem (24px)
- **Section gap**: 2rem (32px)
- **Element gap**: 1rem (16px)

### Margins
- **Section margin**: 2-3rem
- **Card margin**: 1.5rem
- **Element margin**: 0.5-1rem

---

## Borders & Shadows

### Border Radius
- **Small**: 0.5rem (8px) - badges, small elements
- **Medium**: 0.75rem (12px) - buttons, inputs
- **Large**: 1rem (16px) - cards
- **XLarge**: 1.5rem (24px) - hero cards
- **Card default**: 1rem (16px)

### Borders
- **Width**: 1-2px
- **Color**: rgba(26, 49, 44, 0.1) - subtle
- **Color (hover)**: rgba(66, 132, 117, 0.3) - more visible

### Shadows
- **Small**: 0 1px 2px rgba(26, 49, 44, 0.05)
- **Medium**: 0 4px 6px rgba(26, 49, 44, 0.08)
- **Large**: 0 10px 15px rgba(26, 49, 44, 0.1)
- **XLarge**: 0 20px 25px rgba(26, 49, 44, 0.1)
- **Card**: 0 2px 8px rgba(26, 49, 44, 0.06)
- **Card hover**: 0 8px 16px rgba(26, 49, 44, 0.1)

---

## Components

### Stat Cards
- **Background**: White
- **Border**: 1px solid rgba(26, 49, 44, 0.1)
- **Shadow**: Card shadow
- **Padding**: 1.5rem
- **Radius**: 1rem
- **Icon background**: Based on variant (teal, mint, etc.)
- **Value**: 3xl, bold, #1A312C
- **Label**: Small, uppercase, medium weight, rgba(26, 49, 44, 0.7)

### Buttons
- **Primary**: #428475 background, white text, shadow
- **Secondary**: White background, #428475 border
- **Ghost**: Transparent, #1A312C text
- **Height**: 40-48px depending on size
- **Padding**: 16-24px horizontal
- **Font**: Medium weight, 14-16px

### Inputs
- **Background**: White
- **Border**: 2px solid rgba(26, 49, 44, 0.2)
- **Border (focus)**: 2px solid #428475
- **Ring (focus)**: 4px rgba(66, 132, 117, 0.2)
- **Height**: 44-48px
- **Padding**: 12-16px
- **Font**: Regular, 16px

### Sidebar/Navigation
- **Background**: #1A312C (Deep Forest Green)
- **Text**: White with 80% opacity
- **Text (hover/active)**: White 100%
- **Icon**: #89D7B7 (Fresh Mint)
- **Hover background**: rgba(66, 132, 117, 0.2)
- **Divider**: rgba(255, 255, 255, 0.1)

### Cards
- **Background**: White
- **Border**: 1px solid rgba(26, 49, 44, 0.1)
- **Shadow**: Card shadow (default)
- **Shadow (hover)**: Card hover shadow
- **Padding**: 1.5rem
- **Radius**: 1rem
- **Transition**: all 200ms

### Badges
- **Success**: #89D7B7 background, darker text
- **Warning**: Amber background, darker text
- **Error**: Red background, white text
- **Info**: Blue background, white text
- **Padding**: 4px 12px
- **Radius**: 9999px (fully rounded)
- **Font**: 12px, medium weight

---

## Chart Configuration

### Recharts Theme
```javascript
{
  stroke: '#428475',        // Primary data line
  fill: '#89D7B7',          // Secondary data area
  grid: {
    stroke: 'rgba(26, 49, 44, 0.1)',
    strokeDasharray: '3 3'
  },
  tooltip: {
    backgroundColor: '#FFFFFF',
    border: '1px solid rgba(26, 49, 44, 0.1)',
    borderRadius: '0.5rem',
    boxShadow: '0 4px 6px rgba(26, 49, 44, 0.1)'
  },
  legend: {
    color: '#1A312C'
  }
}
```

---

## Design Principles

### Visual Hierarchy
1. Use color to establish importance
2. Deep Forest Green (#1A312C) for primary focus
3. Muted Teal (#428475) for interactive elements
4. Fresh Mint (#89D7B7) for accents only

### Whitespace
- Generous spacing between elements
- Let content breathe
- Don't overcrowd the interface

### Consistency
- Use the same colors for the same purposes
- Don't introduce random colors
- Maintain visual rhythm

### Accessibility
- Minimum 4.5:1 contrast ratio for text
- Touch targets minimum 44x44px
- Clear focus indicators
- Keyboard navigation support

### Responsive Design
- Mobile-first approach
- Breakpoints: sm(640px), md(768px), lg(1024px), xl(1280px)
- Adapt layouts, not just scale

---

## Animation & Transitions

### Duration
- **Fast**: 150ms - Hover states, simple transitions
- **Normal**: 200ms - Most transitions
- **Slow**: 300ms - Complex state changes
- **Very Slow**: 500ms - Page transitions

### Easing
- **Default**: ease-out - Most transitions
- **Bounce**: spring - Interactive elements
- **Smooth**: ease-in-out - Smooth animations

---

## Utility Classes

### Pre-defined Classes
- `.card` - Standard card styling
- `.card-hover` - Card with hover effect
- `.stat-card` - Statistics card
- `.chart-container` - Chart wrapper
- `.metric-value` - Large metric number
- `.metric-label` - Metric label text
- `.btn-primary` - Primary button
- `.btn-secondary` - Secondary button
- `.btn-ghost` - Ghost button
- `.badge` - Standard badge
- `.badge-success` - Success badge
- `.badge-warning` - Warning badge
- `.badge-error` - Error badge

---

## Examples

### Energy Metric Card
```tsx
<div className="stat-card">
  <div className="flex items-center justify-between mb-4">
    <div className="h-14 w-14 rounded-xl bg-accent-50 flex items-center justify-center">
      <Zap className="h-7 w-7 text-accent-700" />
    </div>
    <div className="badge-success">
      <TrendingUp className="h-4 w-4" />
      <span>12.5%</span>
    </div>
  </div>
  <h3 className="metric-label">Total Energy</h3>
  <div className="flex items-baseline gap-2">
    <span className="metric-value">1.234</span>
    <span className="text-lg font-semibold text-primary-400">kWh</span>
  </div>
</div>
```

### Primary Action Button
```tsx
<button className="btn-primary">
  Save Changes
</button>
```

### Chart
```tsx
<div className="chart-container">
  <LineChart data={data}>
    <Line stroke="#428475" strokeWidth={2} />
    <Area fill="#89D7B7" opacity={0.3} />
  </LineChart>
</div>
```

---

## Brand Voice

The design should communicate:
- **Sustainability**: Natural, eco-friendly colors
- **Technology**: Clean, modern interface
- **Trust**: Professional, stable design
- **Energy**: Dynamic, active elements
- **Intelligence**: Data-driven, analytical

Avoid:
- Overly futuristic/neon aesthetics
- Corporate blue/gray monotony
- Cluttered layouts
- Inconsistent color usage
- Poor contrast/readability

---

**Last Updated**: August 24, 2026
**Version**: 2.0 - EcoStep Color Palette Implementation
