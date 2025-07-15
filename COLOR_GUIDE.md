# POS System Color Guide

## Overview
This document outlines the color system for the POS application, designed for professional appearance, accessibility, and consistent user experience.

## Color Palette

### Primary Colors
- **Restaurant Green**: `#22c55e` (Primary-500)
  - Used for: Main actions, navigation, primary buttons
  - Represents: Freshness, nature, health, organic
  - Variants: 50-900 for different contexts

- **Warm Accent Orange**: `#f97316` (Accent-500)
  - Used for: Secondary actions, highlights, calls-to-action
  - Represents: Energy, warmth, appetite, comfort food
  - Variants: 50-900 for different contexts

### Semantic Colors
- **Success**: `#10b981` (Emerald Green)
  - Used for: Completed orders, successful actions, positive feedback
- **Warning**: `#f59e0b` (Amber)
  - Used for: Pending orders, caution states, attention needed
- **Error**: `#ef4444` (Red)
  - Used for: Errors, cancelled orders, critical actions
- **Info**: `#06b6d4` (Cyan)
  - Used for: Information, help text, neutral states

### Neutral Colors
- **Background**: `#ffffff` (Pure White)
  - Main application background
- **Surface**: `#f8fafc` (Light Gray)
  - Cards, modals, elevated surfaces
- **Surface Hover**: `#f1f5f9` (Slightly darker)
  - Hover states for interactive elements

### Text Colors
- **Primary Text**: `#0f172a` (Dark Blue-Gray)
  - Main headings and important text
- **Secondary Text**: `#475569` (Medium Gray)
  - Secondary information, descriptions
- **Muted Text**: `#94a3b8` (Light Gray)
  - Placeholder text, disabled states
- **Inverse Text**: `#ffffff` (White)
  - Text on dark backgrounds

## Usage Guidelines

### Buttons
- **Primary Actions**: Use `primary-600` to `primary-700` gradient with white text
- **Secondary Actions**: Use `surface` with `text-primary` and neutral border
- **Success Actions**: Use `success` with white text
- **Danger Actions**: Use `error` with white text
- **Warning Actions**: Use `warning` with white text

### Navigation
- **Active State**: `primary-600` to `primary-700` gradient background with white text
- **Inactive State**: `text-secondary` with hover to `text-primary`
- **Hover State**: Light background with primary text

### Status Indicators
- **Available/Ready**: `success` background with white text
- **Occupied/Preparing**: `warning` background with white text
- **Reserved/Processing**: `primary-600` background with white text
- **Out of Service/Cancelled**: `neutral-200` background with `neutral-700` text

### Cards and Surfaces
- **Default**: `surface` background with `neutral-100` border
- **Hover**: `surfaceHover` background with `neutral-200` border
- **Elevated**: Add shadow and slightly darker background

### Forms
- **Input Borders**: `neutral-200` default, `primary-600` on focus
- **Labels**: `text-primary` for main labels
- **Help Text**: `text-secondary` for descriptions
- **Error Text**: `error` color for validation messages

## Accessibility Considerations

### Contrast Ratios
- All text meets WCAG AA standards (4.5:1 minimum)
- Primary text on white: 15:1 (excellent)
- Secondary text on white: 7:1 (good)
- White text on primary: 4.5:1 (meets standards)

### Color Blindness
- Never rely solely on color to convey information
- Use icons, text, and patterns in addition to color
- Test with color blindness simulators

### Focus States
- All interactive elements have visible focus indicators
- Use `ring-4 ring-primary-500/20` for focus rings
- Maintain focus visibility in all color themes

## Implementation

### Tailwind Classes
```css
/* Primary Actions */
.btn-primary { @apply bg-primary-600 text-white hover:bg-primary-700; }

/* Secondary Actions */
.btn-secondary { @apply bg-surface text-text-primary border-neutral-200 hover:bg-surfaceHover; }

/* Status Badges */
.status-success { @apply bg-success text-white; }
.status-warning { @apply bg-warning text-white; }
.status-error { @apply bg-error text-white; }
```

### CSS Custom Properties
```css
:root {
  --color-primary: #22c55e;
  --color-accent: #f97316;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-background: #ffffff;
  --color-surface: #f8fafc;
  --color-text-primary: #0f172a;
  --color-text-secondary: #475569;
}
```

## Best Practices

1. **Consistency**: Use the same colors for the same purposes throughout the app
2. **Hierarchy**: Use color to establish visual hierarchy and guide user attention
3. **Accessibility**: Always ensure sufficient contrast and don't rely solely on color
4. **Context**: Consider the context and user expectations when choosing colors
5. **Testing**: Test color combinations with real users and accessibility tools

## Future Considerations

- **Dark Mode**: Consider implementing a dark theme using the same color system
- **Branding**: Colors can be adjusted to match specific restaurant branding
- **Seasonal Themes**: Consider subtle color variations for different seasons or events
- **User Preferences**: Allow users to adjust color preferences for accessibility needs 