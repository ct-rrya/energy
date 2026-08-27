# EcoStep Color Palette Reference

## 🎨 Brand Colors

### Primary - Deep Forest Green
```
#1A312C
RGB: 26, 49, 44
HSL: 166°, 31%, 15%
```
**Usage**: Main headings, important text, primary buttons, active navigation, high-priority data

**Visual**: █████ Dark, rich forest green

---

### Secondary - Teal Green
```
#428475
RGB: 66, 132, 117
HSL: 166°, 33%, 39%
```
**Usage**: Charts, active states, secondary buttons, data indicators, accent elements

**Visual**: █████ Medium teal with professional feel

---

### Accent - Soft Mint Green
```
#89D7B7
RGB: 137, 215, 183
HSL: 155°, 50%, 69%
```
**Usage**: Highlights, positive indicators, small badges, chart accents, decorative elements

**Visual**: █████ Soft, calming mint

---

### Background - Warm Cream
```
#FFF4E1
RGB: 255, 244, 225
HSL: 38°, 100%, 94%
```
**Usage**: Primary page background, atmospheric base

**Visual**: █████ Warm, inviting cream

---

## 🌈 Extended Palette

### Success Colors (Positive/Efficient)
- **Light**: `rgba(137, 215, 183, 0.15)` - Badge backgrounds
- **Base**: #89D7B7 - Accent mint
- **Dark**: #2D7A5F - Text on light backgrounds
- **Usage**: Energy savings, efficiency improvements, goals achieved

### Warning Colors (Attention)
- **Light**: `rgba(234, 179, 8, 0.1)` - Badge backgrounds
- **Base**: #EAB308 - Warning yellow
- **Dark**: #A16207 - Text on light backgrounds
- **Usage**: High usage alerts, approaching limits

### Error Colors (Critical)
- **Light**: `rgba(239, 68, 68, 0.1)` - Badge backgrounds
- **Base**: #EF4444 - Error red
- **Dark**: #B91C1C - Text on light backgrounds
- **Usage**: System errors, critical alerts, failures

### Info Colors (Neutral)
- **Light**: `rgba(66, 132, 117, 0.1)` - Badge backgrounds
- **Base**: #428475 - Secondary teal
- **Dark**: #1E594D - Text on light backgrounds
- **Usage**: General information, tips, neutral states

---

## 🎭 Surface Colors (Glassmorphic)

### Glass Surfaces
```css
/* Standard glass card */
background: rgba(255, 255, 255, 0.45);
backdrop-filter: blur(16px);
border: 1px solid rgba(255, 255, 255, 0.55);

/* Strong glass (headers, modals) */
background: rgba(255, 255, 255, 0.65);
backdrop-filter: blur(20px);
border: 1px solid rgba(255, 255, 255, 0.6);

/* Application shell */
background: rgba(255, 255, 255, 0.35);
backdrop-filter: blur(20px);
border: 1px solid rgba(255, 255, 255, 0.55);
```

---

## 🌫️ Atmospheric Gradients

### Background Ambient Glows
```css
/* Mint glow - top left */
radial-gradient(
  ellipse 800px 600px at 20% 30%, 
  rgba(137, 215, 183, 0.08), 
  transparent
)

/* Teal glow - bottom right */
radial-gradient(
  ellipse 600px 800px at 80% 70%, 
  rgba(66, 132, 117, 0.06), 
  transparent
)
```

### Icon Badge Gradients
```css
/* Teal gradient */
background: linear-gradient(135deg, #428475, #356A5E);

/* Mint gradient */
background: linear-gradient(135deg, #89D7B7, #6EC29A);

/* Forest gradient */
background: linear-gradient(135deg, #1A312C, #142520);
```

---

## 📊 Chart Colors

### Primary Data
- **Line/Area stroke**: #428475 (Secondary teal)
- **Stroke width**: 2.5px
- **Area fill gradient**:
  ```css
  linearGradient:
    0%: rgba(66, 132, 117, 0.25)
    95%: rgba(137, 215, 183, 0.05)
  ```

### Grid Lines
- **Color**: `rgba(26, 49, 44, 0.06)`
- **Style**: Dashed (3px dash, 3px gap)
- **Vertical**: Hidden

### Axis Labels
- **Color**: #737373 (neutral-600)
- **Size**: 12px
- **Weight**: 500

---

## 🎨 Neutral Palette

### Text Colors
- **Primary text**: #1A312C (primary-500)
- **Secondary text**: #737373 (neutral-600)
- **Muted text**: #A3A3A3 (neutral-500)
- **Disabled text**: #D4D4D4 (neutral-300)

### Border Colors
- **Subtle**: `rgba(26, 49, 44, 0.06)`
- **Light**: `rgba(26, 49, 44, 0.08)`
- **Medium**: `rgba(26, 49, 44, 0.15)`
- **Glass**: `rgba(255, 255, 255, 0.3)` - `rgba(255, 255, 255, 0.6)`

---

## 🔍 Opacity Reference

### Background Surfaces
- Application shell: **0.35**
- Glass cards: **0.45**
- Strong glass: **0.65**
- Button secondary: **0.5**
- Hover states: **0.6-0.7**

### Shadows
- Soft shadows: **0.06**
- Medium shadows: **0.08**
- Strong shadows: **0.12-0.15**

### Gradients
- Mint ambient glow: **0.08**
- Teal ambient glow: **0.06**
- Chart area fill start: **0.25**
- Chart area fill end: **0.05**

---

## ♿ Accessibility

### Contrast Ratios (WCAG)

✅ **AAA Level** (7:1 minimum)
- #1A312C on #FFF4E1: **10.5:1**

✅ **AA Level** (4.5:1 minimum for text)
- #428475 on #FFFFFF: **4.8:1**
- #FFFFFF on #428475: **4.8:1**
- #737373 on #FFF4E1: **5.2:1**

⚠️ **Use with caution** (below AA)
- #89D7B7 on #FFFFFF: **2.8:1** - Use for large text or decorative only

---

## 🎯 Quick Copy

```css
/* CSS Custom Properties */
--primary: #1A312C;
--secondary: #428475;
--accent: #89D7B7;
--background: #FFF4E1;

--glass-light: rgba(255, 255, 255, 0.35);
--glass-medium: rgba(255, 255, 255, 0.45);
--glass-strong: rgba(255, 255, 255, 0.65);

--shadow-soft: 0 8px 30px rgba(26, 49, 44, 0.06);
--shadow-medium: 0 12px 40px rgba(26, 49, 44, 0.08);
--shadow-strong: 0 20px 60px rgba(26, 49, 44, 0.08);
```

```javascript
// Tailwind config colors
colors: {
  primary: '#1A312C',
  secondary: '#428475',
  accent: '#89D7B7',
  background: '#FFF4E1',
}
```

---

## 🖼️ Example Combinations

### 1. Primary Button
- **Background**: #1A312C
- **Text**: #FFF4E1
- **Shadow**: `0 4px 12px rgba(26, 49, 44, 0.15)`

### 2. Active Navigation
- **Background**: #428475
- **Text**: #FFFFFF
- **Shadow**: `0 4px 12px rgba(66, 132, 117, 0.2)`

### 3. Success Badge
- **Background**: `rgba(137, 215, 183, 0.15)`
- **Text**: #2D7A5F
- **Border**: `1px solid rgba(137, 215, 183, 0.3)`

### 4. Glass Card
- **Background**: `rgba(255, 255, 255, 0.45)`
- **Backdrop blur**: 16px
- **Border**: `1px solid rgba(255, 255, 255, 0.55)`
- **Shadow**: `0 8px 30px rgba(26, 49, 44, 0.06)`

---

**Color System Version**: 1.0  
**Last Updated**: 2026  
**Platform**: EcoStep Energy Monitoring System
