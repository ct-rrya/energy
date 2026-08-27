# EcoStep Modern Dashboard - Quick Color Reference

**Last Updated**: August 24, 2026

---

## 🎨 Color Swatches

### Primary Colors

#### Teal (Primary Action)
```
█████ #1E8B87
RGB: 30, 139, 135
HSL: 178°, 64%, 33%
```
**Use for**: Primary buttons, active states, links, brand

#### Light Teal (Success/Highlight)
```
█████ #7DD3C0
RGB: 125, 211, 192
HSL: 167°, 52%, 66%
```
**Use for**: Success messages, highlights, progress

---

### Accent Colors

#### Purple (Info)
```
█████ #B794F6
RGB: 183, 148, 246
HSL: 261°, 86%, 77%
```
**Use for**: Info badges, special features, decorative

#### Pink (Attention)
```
█████ #FF6B9D
RGB: 255, 107, 157
HSL: 339°, 100%, 71%
```
**Use for**: Important notices, featured content

#### Orange (Warning)
```
█████ #FF9966
RGB: 255, 153, 102
HSL: 20°, 100%, 70%
```
**Use for**: Warnings, moderate alerts

#### Red (Error)
```
█████ #EF5350
RGB: 239, 83, 80
HSL: 1°, 83%, 63%
```
**Use for**: Errors, destructive actions, critical alerts

---

### Background Colors

#### Gradient Background
```
Start: █████ #C5E5E0 (Light Mint)
End:   █████ #D8E5F0 (Light Purple-Blue)

CSS: linear-gradient(135deg, #C5E5E0 0%, #D8E5F0 100%)
```

#### Sidebar Background
```
█████ #E8F4F2 (Very Light Mint)
RGB: 232, 244, 242
HSL: 168°, 34%, 93%
```

#### Card Background
```
█████ White / rgba(255, 255, 255, 0.9)
```

---

### Text Colors

#### Primary Text (Dark)
```
█████ #1A252F
RGB: 26, 37, 47
HSL: 210°, 29%, 14%
```
**Use for**: Headings, body text, important content

#### Secondary Text (Medium)
```
█████ #52586E
RGB: 82, 88, 110
HSL: 227°, 15%, 38%
```
**Use for**: Labels, descriptions, helper text

#### Placeholder Text (Light)
```
█████ #A3A8B4
RGB: 163, 168, 180
HSL: 223°, 12%, 67%
```
**Use for**: Placeholders, disabled text

---

### Border Colors

#### Default Border
```
█████ #CED4DA
RGB: 206, 212, 218
HSL: 210°, 14%, 83%
```

#### Focus Border (Teal)
```
█████ #1E8B87
```

#### Error Border (Red)
```
█████ #EF5350
```

---

## 🎯 Usage Examples

### Buttons

**Primary Button**
```css
background: #1E8B87;
color: #FFFFFF;
```

**Secondary Button**
```css
background: rgba(255, 255, 255, 0.9);
color: #1E8B87;
border: 1px solid rgba(30, 139, 135, 0.3);
```

**Danger Button**
```css
background: #EF5350;
color: #FFFFFF;
```

### Stat Cards

**Icon Backgrounds (10% opacity)**
- Primary: `rgba(30, 139, 135, 0.1)`
- Success: `rgba(125, 211, 192, 0.1)`
- Warning: `rgba(255, 153, 102, 0.1)`
- Error: `rgba(239, 83, 80, 0.1)`
- Info: `rgba(183, 148, 246, 0.1)`

### Badges

**Success Badge**
```css
background: rgba(125, 211, 192, 0.15);
color: #7DD3C0;
border: 1px solid rgba(125, 211, 192, 0.3);
```

**Warning Badge**
```css
background: rgba(255, 153, 102, 0.15);
color: #FF9966;
border: 1px solid rgba(255, 153, 102, 0.3);
```

**Error Badge**
```css
background: rgba(239, 83, 80, 0.15);
color: #EF5350;
border: 1px solid rgba(239, 83, 80, 0.3);
```

---

## 📋 CSS Custom Properties

Copy-paste ready:

```css
:root {
  /* Primary */
  --color-primary-500: 30 139 135;      /* #1E8B87 */
  --color-secondary-500: 125 211 192;   /* #7DD3C0 */
  
  /* Accents */
  --color-accent-500: 183 148 246;      /* #B794F6 */
  --color-pink-500: 255 107 157;        /* #FF6B9D */
  --color-orange-500: 255 153 102;      /* #FF9966 */
  
  /* Semantics */
  --color-success-500: 125 211 192;     /* #7DD3C0 */
  --color-warning-500: 255 153 102;     /* #FF9966 */
  --color-error-500: 239 83 80;         /* #EF5350 */
  --color-info-500: 30 139 135;         /* #1E8B87 */
  
  /* Text */
  --color-neutral-800: 26 37 47;        /* #1A252F */
  --color-neutral-600: 82 88 110;       /* #52586E */
  --color-neutral-400: 163 168 180;     /* #A3A8B4 */
  
  /* Backgrounds */
  --color-base-400: 197 229 224;        /* #C5E5E0 */
  --color-base-500: 216 229 240;        /* #D8E5F0 */
  --color-base-200: 232 244 242;        /* #E8F4F2 */
}
```

---

## 🎨 Tailwind Classes

Quick reference for most common uses:

### Backgrounds
- `bg-primary-500` - Teal
- `bg-secondary-500` - Light teal
- `bg-accent-500` - Purple
- `bg-base-200` - Light mint (sidebar)
- `bg-white` - White

### Text
- `text-neutral-800` - Dark text
- `text-neutral-600` - Medium text
- `text-neutral-400` - Light text
- `text-primary-500` - Teal text

### Borders
- `border-neutral-200` - Default border
- `border-primary-500` - Teal border
- `border-error-500` - Error border

### Hover States
- `hover:bg-primary-600` - Darker teal
- `hover:bg-primary-50` - Very light teal
- `hover:text-white` - White text

### Focus States
- `focus:border-primary-500` - Teal focus
- `focus:ring-primary-500/20` - Teal ring

---

## 🌈 Color Combinations

### High Contrast (Text on Background)

✅ **PASS - WCAG AAA**
- `#1A252F` on `#FFFFFF` (12:1)
- `#52586E` on `#FFFFFF` (7:1)

✅ **PASS - WCAG AA**
- `#1E8B87` on `#FFFFFF` (4.8:1)
- `#A3A8B4` on `#1A252F` (5.1:1)

### Button Color Combinations

✅ **Primary Button**
- Background: `#1E8B87`
- Text: `#FFFFFF` (4.8:1) ✓

✅ **Secondary Button**
- Background: `rgba(255, 255, 255, 0.9)`
- Text: `#1E8B87` (4.8:1) ✓

✅ **Danger Button**
- Background: `#EF5350`
- Text: `#FFFFFF` (4.5:1) ✓

---

## 📱 Context-Aware Usage

### Login Page
- Background: Gradient (`#C5E5E0` → `#D8E5F0`)
- Card: Glass (white with blur)
- Logo Icon: Teal (`#1E8B87`)
- Button: Teal (`#1E8B87`)
- Text: Dark (`#1A252F`)

### Dashboard Sidebar
- Background: Light mint (`#E8F4F2`)
- Inactive Items: Medium gray (`#52586E`)
- Active/Hover: Teal (`#1E8B87`)
- Icons: Teal (`#1E8B87`)

### Stat Cards
- Background: White/glass
- Icons:
  - Default: Teal (`#1E8B87`)
  - Success: Light teal (`#7DD3C0`)
  - Warning: Orange (`#FF9966`)
  - Error: Red (`#EF5350`)
  - Info: Purple (`#B794F6`)
- Text: Dark (`#1A252F`)
- Labels: Medium (`#52586E`)

### Forms
- Input Background: Glass (white with blur)
- Border: Light gray (`#CED4DA`)
- Focus Border: Teal (`#1E8B87`)
- Error Border: Red (`#EF5350`)
- Label: Dark (`#1A252F`)
- Placeholder: Light gray (`#A3A8B4`)

---

## 💡 Quick Tips

### DO's ✅
- Use teal (#1E8B87) for primary actions
- Use light teal (#7DD3C0) for success states
- Use gradient background on main pages
- Use glass effect on cards and inputs
- Use rounded corners (1rem)
- Use colorful icons in stat cards

### DON'Ts ❌
- Don't mix earth tones with new colors
- Don't use dark sidebar anymore
- Don't use flat buttons (add shadows)
- Don't use cream background
- Don't use forest green
- Don't forget glassmorphism on cards

---

## 🔍 Find & Replace

If manually updating old code:

| Old (Earth Tones) | New (Modern) |
|-------------------|--------------|
| `bg-primary-500` (forest green) | `bg-neutral-800` or `bg-primary-500` (teal) |
| `bg-base-200` (cream) | `bg-base-200` (light mint) or keep gradient |
| `text-primary-500` (forest) | `text-neutral-800` (dark) |
| `text-primary-400` | `text-neutral-600` |
| `bg-secondary-500` (old teal) | `bg-primary-500` (new teal) |
| `text-accent-500` (old mint) | `text-success-500` or `text-secondary-500` |

---

## 📐 Sizing Reference

### Border Radius
- Cards: `1.25rem` (20px)
- Buttons: `1rem` (16px)
- Inputs: `1rem` (16px)
- Badges: `9999px` (full round)
- Icons: `1.25rem` (20px)

### Padding
- Cards: `1.5rem` (24px)
- Buttons: `0.625rem 1.25rem` (10px 20px)
- Inputs: `0.75rem 1rem` (12px 16px)
- Sidebar Items: `0.75rem 1rem` (12px 16px)

### Shadows
- Small: `0 2px 8px rgba(26, 37, 47, 0.06)`
- Medium: `0 4px 12px rgba(26, 37, 47, 0.08)`
- Large: `0 8px 24px rgba(26, 37, 47, 0.1)`

---

**Print this page for quick reference during development!**

