# EcoStep Design System
## Premium Glassmorphic UI for Sustainability Platform

This document outlines the complete design system for the EcoStep dashboard, inspired by premium SaaS interfaces with a focus on sustainability and environmental technology.

---

## 🎨 Brand Color System

### Primary Color - Deep Forest Green
- **#1A312C** - Main brand color
- **Usage**: Primary text, headings, main buttons, active navigation, important icons

### Secondary Color - Teal Green  
- **#428475** - Active states and secondary actions
- **Usage**: Charts, active navigation pills, data indicators, secondary buttons

### Accent Color - Soft Mint Green
- **#89D7B7** - Highlights and positive feedback
- **Usage**: Badges, positive trends, chart accents, decorative elements, success states

### Background - Warm Cream
- **#FFF4E1** - Main page background
- **Usage**: Body background with subtle ambient glows

---

## 🌅 Background Treatment

The background uses a warm cream base (#FFF4E1) with **extremely subtle atmospheric gradients**:

```css
background-color: #FFF4E1;
background-image: 
  radial-gradient(ellipse at 20% 30%, rgba(137, 215, 183, 0.08), transparent),
  radial-gradient(ellipse at 80% 70%, rgba(66, 132, 117, 0.06), transparent);
```

The gradients are barely perceptible, creating a soft ambient atmosphere without obvious color transitions.

---

## 📦 Component System

### 1. Application Shell (`.app-shell`)
The main container that holds the entire dashboard:
- **Border radius**: 32px (2rem)
- **Background**: `rgba(255, 255, 255, 0.35)`
- **Backdrop filter**: `blur(20px)`
- **Border**: `1px solid rgba(255, 255, 255, 0.55)`
- **Shadow**: `0 20px 60px rgba(26, 49, 44, 0.08)`

### 2. Glass Cards (`.glass-card`)
Standard cards for content sections:
- **Border radius**: 20px (1.25rem)
- **Background**: `rgba(255, 255, 255, 0.45)`
- **Backdrop filter**: `blur(16px)`
- **Border**: `1px solid rgba(255, 255, 255, 0.55)`
- **Shadow**: `0 8px 30px rgba(26, 49, 44, 0.06)`
- **Padding**: 1.5rem (24px)

### 3. Metric Cards (`.metric-card`)
Compact statistics display:
- **Border radius**: 18px (1.125rem)
- **Background**: `rgba(255, 255, 255, 0.45)`
- **Backdrop filter**: `blur(16px)`
- **Padding**: 1.25rem (20px)
- **Hover effect**: Lifts 1px with increased shadow

### 4. Chart Container (`.chart-container`)
Specialized container for data visualizations:
- **Border radius**: 22px (1.375rem)
- **Background**: `rgba(255, 255, 255, 0.45)`
- **Backdrop filter**: `blur(16px)`
- **Padding**: 1.5rem (24px)

---

## 🔤 Typography System

### Font Family
**Inter** - Modern geometric sans-serif

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### Hierarchy

#### Page Title (h1)
- **Size**: 32px - 40px (responsive)
- **Weight**: 700 (Bold)
- **Color**: #1A312C
- **Letter spacing**: -0.025em

#### Section Titles (h2)
- **Size**: 24px - 30px
- **Weight**: 600 (Semibold)
- **Color**: #1A312C

#### Card Titles (h3)
- **Size**: 18px - 20px
- **Weight**: 600 (Semibold)
- **Color**: #1A312C

#### Metric Labels (`.metric-label`)
- **Size**: 13px (0.8125rem)
- **Weight**: 500 (Medium)
- **Color**: #737373 (neutral-600)
- **Transform**: uppercase
- **Letter spacing**: 0.05em

#### Metric Values (`.metric-value-large`)
- **Size**: 28px - 32px
- **Weight**: 600 (Semibold)
- **Color**: #1A312C
- **Letter spacing**: -0.025em

#### Body Text
- **Size**: 14px - 15px
- **Weight**: 400 - 500
- **Color**: #737373

---

## 🔘 Button System

### Primary Button (`.btn-primary`)
```css
background: #1A312C;
color: #FFF4E1;
padding: 0.625rem 1.5rem;
border-radius: 0.75rem; /* 12px */
font-weight: 500;
box-shadow: 0 4px 12px rgba(26, 49, 44, 0.15);
```
**Hover**: Lifts 1px, increases shadow

### Secondary Button (`.btn-secondary`)
```css
background: rgba(255, 255, 255, 0.5);
backdrop-filter: blur(8px);
color: #1A312C;
border: 1px solid rgba(26, 49, 44, 0.08);
padding: 0.625rem 1.5rem;
border-radius: 0.75rem;
font-weight: 500;
```

### Ghost Button (`.btn-ghost`)
```css
color: #1A312C;
padding: 0.625rem 1.25rem;
border-radius: 0.75rem;
```
**Hover**: `background: rgba(255, 255, 255, 0.5)`

---

## 🏷️ Badge System

### Structure
```css
display: inline-flex;
align-items: center;
padding: 0.375rem 0.875rem;
border-radius: 0.625rem; /* 10px */
font-size: 0.75rem;
font-weight: 500;
```

### Variants

#### Success Badge
- **Background**: `rgba(137, 215, 183, 0.15)`
- **Color**: #2D7A5F (accent-700)
- **Border**: `1px solid rgba(137, 215, 183, 0.3)`

#### Warning Badge
- **Background**: `rgba(234, 179, 8, 0.1)`
- **Color**: #A16207 (warning-700)
- **Border**: `1px solid rgba(234, 179, 8, 0.2)`

#### Info Badge
- **Background**: `rgba(66, 132, 117, 0.1)`
- **Color**: #1E594D (secondary-700)
- **Border**: `1px solid rgba(66, 132, 117, 0.2)`

---

## 🧭 Navigation

### Active Navigation Pill (`.nav-pill-active`)
```css
background: #428475; /* Secondary color */
color: white;
border-radius: 0.75rem; /* 12px */
box-shadow: 0 4px 12px rgba(66, 132, 117, 0.2);
```

### Inactive Navigation
```css
color: #1A312C;
transition: all 0.2s;
```
**Hover**: `background: rgba(255, 255, 255, 0.4)`

---

## 📊 Data Visualization

### Chart Colors

#### Primary Line/Area
- **Stroke**: `#428475` (Secondary teal)
- **Stroke width**: 2.5px
- **Fill gradient**: 
  - Start: `rgba(66, 132, 117, 0.25)`
  - End: `rgba(137, 215, 183, 0.05)`

#### Grid Lines
- **Color**: `rgba(26, 49, 44, 0.06)`
- **Style**: Dashed (3 3)
- **Vertical lines**: Hidden

#### Axis Labels
- **Color**: `#737373`
- **Size**: 12px
- **Weight**: 500

#### Tooltip
```css
background: rgba(255, 255, 255, 0.95);
border: 1px solid rgba(255, 255, 255, 0.6);
border-radius: 12px;
box-shadow: 0 8px 30px rgba(26, 49, 44, 0.12);
backdrop-filter: blur(16px);
```

---

## 🎯 Icon System

### Library
**Lucide React** - Thin, modern line icons

### Styling
- **Stroke width**: 2 (standard), 2.5 (emphasis)
- **Size**: 20px - 24px (most common)
- **Color**: 
  - Active: White or #428475
  - Inactive: #1A312C or #428475

### Icon Badges (Metric cards)
```css
width: 48px;
height: 48px;
border-radius: 14px; /* 0.875rem */
background: linear-gradient(135deg, primary-color, darker-shade);
box-shadow: 0 4px 12px rgba(color, 0.15);
```

---

## 🖼️ Border Radius System

Consistent rounded geometry throughout:
- **Application shell**: 32px
- **Large cards**: 22px
- **Standard cards**: 20px
- **Metric cards**: 18px
- **Buttons**: 12px
- **Navigation pills**: 12px
- **Badges**: 10px
- **Input fields**: 12px
- **Full round**: 9999px (badges, avatars)

---

## 🌊 Shadow System

### Soft Shadows (Default)
```css
box-shadow: 0 8px 30px rgba(26, 49, 44, 0.06);
```

### Elevated Shadows (Hover)
```css
box-shadow: 0 12px 40px rgba(26, 49, 44, 0.08);
```

### Button Shadows
```css
box-shadow: 0 4px 12px rgba(26, 49, 44, 0.15);
```

### Strong Shadows (Modals/Tooltips)
```css
box-shadow: 0 20px 60px rgba(26, 49, 44, 0.08);
```

---

## ✨ Animation Guidelines

### Transitions
```css
transition: all 0.2s ease;
```

### Hover Effects
- **Cards**: `translateY(-2px)` with increased shadow
- **Buttons**: `translateY(-1px)` with increased shadow
- **Icons**: `scale(1.05)`

### Durations
- **Fast**: 150ms - 200ms (hover, clicks)
- **Standard**: 200ms - 250ms (most transitions)
- **Slow**: 300ms - 400ms (page loads, slides)

### Easing
- **Default**: `ease` or `ease-out`
- **Charts**: `ease-out` with 800ms duration

---

## 🎨 EcoStep Logo

The logo is an integrated design where **a leaf's silhouette subtly resembles a footprint**.

### Colors
- **Primary**: #1A312C (Deep forest green)
- **Accents**: #428475 (Teal), #89D7B7 (Mint)

### Usage
- Logo is contained in a rounded square container
- Background: #1A312C with slight shadow
- Padding: 8px - 12px inside container

---

## 📱 Responsive Behavior

### Desktop (≥1024px)
- Full sidebar navigation (256px width)
- Multi-column grid layouts (2-4 columns)
- Large application shell with rounded corners

### Tablet (768px - 1023px)
- Narrower sidebar or collapsed sidebar
- 2-column grid layouts
- Reduced padding and spacing

### Mobile (<768px)
- Top/bottom navigation bar instead of sidebar
- Single column layouts
- Cards stack vertically
- Reduced border radius (24px → 20px)
- Smaller padding (24px → 16px)

---

## 🚦 Status Colors

### Success (Positive/Efficient)
- **Primary**: #89D7B7 (Accent mint)
- **Dark**: #2D7A5F
- **Usage**: Energy savings, efficiency improvements, goals achieved

### Warning (Attention Needed)
- **Primary**: #EAB308
- **Dark**: #A16207
- **Usage**: High usage alerts, approaching limits

### Error (Critical/Danger)
- **Primary**: #EF4444
- **Dark**: #B91C1C
- **Usage**: System errors, critical alerts, failures

### Info (Neutral Information)
- **Primary**: #428475 (Secondary teal)
- **Dark**: #1E594D
- **Usage**: General information, tips, neutral states

---

## 🎯 Design Principles

1. **Light & Airy**: Generous spacing, soft colors, avoid density
2. **Premium Feel**: Glassmorphism, soft shadows, refined typography
3. **Sustainability Focus**: Green palette, leaf/nature motifs, eco-friendly messaging
4. **Clarity**: Strong hierarchy, clear labels, readable data
5. **Calm**: No harsh contrasts, smooth animations, soft gradients
6. **Modern SaaS**: Clean design, contemporary patterns, professional appearance

---

## 📋 Component Checklist

✅ Application Shell (glassmorphic container)
✅ Sidebar Navigation (integrated design)
✅ Top Header (welcome message, search, notifications)
✅ Metric Cards (compact stat display)
✅ Glass Cards (content containers)
✅ Chart Components (soft teal aesthetic)
✅ Buttons (primary, secondary, ghost)
✅ Badges (status indicators)
✅ Typography System (Inter font with hierarchy)
✅ Icon System (Lucide React)
✅ EcoStep Logo (integrated leaf-footprint)
✅ Color System (EcoStep brand palette)
✅ Shadow System (soft diffuse shadows)
✅ Border Radius System (consistent rounded geometry)

---

## 🚀 Implementation Notes

### Key Technologies
- **React 19** with TypeScript
- **Tailwind CSS 4.0** for styling
- **Recharts** for data visualization
- **Lucide React** for icons
- **React Router** for navigation

### CSS Custom Properties
All colors are defined as CSS custom properties in `index.css` for easy theming and consistency.

### Utility Classes
Common patterns are extracted into utility classes:
- `.glass-card`
- `.metric-card`
- `.chart-container`
- `.btn-primary`, `.btn-secondary`, `.btn-ghost`
- `.badge`, `.badge-success`, `.badge-warning`
- `.metric-value`, `.metric-label`
- `.nav-pill-active`

---

**Design System Version**: 1.0  
**Last Updated**: 2026  
**Platform**: EcoStep Energy Monitoring System
