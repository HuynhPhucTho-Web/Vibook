---
name: Vibook Content-First
description: Minimalist, readable, and content-focused social book network.
colors:
  primary: "#8e54e9"
  primary-container: "#ecdcff"
  secondary: "#4776e6"
  surface: "#12131a"
  surface-low: "#1a1b22"
  surface-container: "#1e1f27"
  on-surface: "#e3e1ec"
  on-surface-variant: "#cdc3d6"
  outline: "#968d9f"
  outline-variant: "#4b4454"
  deep: "#0c0d14"
  white: "#ffffff"
  light-bg: "#faf7f2"
  light-border: "rgba(15, 23, 42, 0.1)"
  light-text: "#162033"
typography:
  headline-xl:
    fontFamily: "Hanken Grotesk"
    fontSize: "48px"
    fontWeight: 700
    lineHeight: "56px"
    letterSpacing: "-0.02em"
  headline-lg:
    fontFamily: "Hanken Grotesk"
    fontSize: "32px"
    fontWeight: 600
    lineHeight: "40px"
    letterSpacing: "-0.01em"
  body-md:
    fontFamily: "Hanken Grotesk"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "24px"
  label-sm:
    fontFamily: "JetBrains Mono"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: "16px"
    letterSpacing: "0.05em"
rounded:
  sm: "0.25rem"
  DEFAULT: "0.5rem"
  md: "0.75rem"
  lg: "1rem"
  xl: "1.5rem"
  full: "9999px"
spacing:
  unit: "8px"
  gutter: "24px"
  margin-desktop: "64px"
  margin-mobile: "20px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.white}"
    rounded: "{rounded.DEFAULT}"
    padding: "10px 18px"
  card-glass:
    backgroundColor: "rgba(255, 255, 255, 0.03)"
    rounded: "{rounded.DEFAULT}"
    padding: "16px"
---

# Design System: Vibook

## Overview

**Creative North Star: "The Reader's Sanctuary"**

Vibook's design system centers on a Modern Clean & Content-First layout. With book cataloging, feed posts, user-written blogs, and literary event coordination being the heart of the product, the user interface acts as a quiet, functional frame. Page clutter is minimized and typography layout is maximized to ensure readability during long reading and writing sessions.

The system supports a dual-theme experience: a soft-light mode (warm, book-paper tone) for daytime reading, and a deep, low-contrast dark mode for night reading. The card-based UI divides complex structures into discrete units, simplifying grid structures and ensuring a flexible, responsive layout on mobile screens.

**Key Characteristics:**
- Content-first focus with visual elements taking a back seat.
- Structured card-based grids with subtle borders.
- Generous padding and margins (generous whitespace) to let the typography breathe.
- High legibility pairing contemporary sans-serif with metadata-focused monospace.

---

## Colors

The color palette is engineered to emphasize legibility and clear contrast boundaries in both dark and light modes.

### Primary
- **Deep Lavender** (#8e54e9): Used as the primary brand identifier for key actions, selected states, and main button backgrounds.

### Secondary
- **Electric Blue** (#4776e6): Used as a secondary interactive accent for inline focus outlines, link hover highlights, and active indicators.

### Neutral
- **Deep Canvas** (#12131a): The foundation of the dark mode interface.
- **Warm Paper** (#faf7f2): The foundation of the light mode interface.
- **Light Border** (rgba(15, 23, 42, 0.1)): Subtle gray outlines for containers in light mode.
- **Dark Border** (rgba(255, 255, 255, 0.12)): Subtle outline styling for cards and layouts in dark mode.
- **Dark Text** (#162033): High-contrast body color in light mode.
- **Light Text** (#e3e1ec): High-contrast body color in dark mode.

### Named Rules
**The Subtle Accent Rule.** Gradient accent colors (Deep Lavender to Electric Blue) must be restricted to primary interactive elements and must never exceed 10% of any page surface. Backgrounds and major structural panels must rely entirely on clean neutrals.

---

## Typography

**Display Font:** Hanken Grotesk (sans-serif)
**Body Font:** Hanken Grotesk (sans-serif)
**Label/Mono Font:** JetBrains Mono (monospace)

**Character:** Hanken Grotesk provides a contemporary and crisp typeface that ensures high readability across book blurbs and posts. JetBrains Mono is utilized for tags, statistics, and metadata counters to communicate a technical yet clean layout style.

### Hierarchy
- **Display** (700, 48px, 56px): Used on splash headers, main landings, and book detail hero elements.
- **Headline** (600, 32px, 40px): Used for primary page titles (e.g., Blog Index, Home Feed, Profile Header).
- **Title** (600, 20px, 28px): Used inside card titles, widget labels, and section groupings.
- **Body** (400, 16px, 24px): Standard text for blog articles, reviews, post descriptions, and commentary.
- **Label** (500, 12px, 16px): Used for monospaced tags, publishing dates, count statistics, and input hints.

### Named Rules
**The Reading Comfort Rule.** Long-form textual content (specifically blog posts and book reviews) must be restricted to a maximum line length of 70 characters (70ch) and a 1.5 line height (24px) to reduce tracking fatigue.

---

## Layout

The layout uses a fluid grid system driven by an 8px base spacing scale. Page structures are aligned horizontally inside standardized container blocks.

- **Standard Grid Container:** Main layouts use `width: 100%`, `max-width: 1200px`, `margin: 0 auto`, and vertical page padding.
- **Desktop Columns:** Sidebar navigation utilizes a fixed width of `200px` on desktop layouts, with a fluid content area displaying cards in a 3-column grid structure.
- **Mobile Adaptive (≤ 820px):** Content wraps into a single column with a layout width of `100%` and a standard padding of `0.5rem (8px)`.

---

## Elevation & Depth

Vibook uses a flat-by-default visual strategy. Layout depth is established via tonal layering and thin borders instead of heavy box-shadow gradients.

- **Tonal Layering (Dark Mode):** Base backgrounds use `#12131a`, cards rise to `#1e1f27` for standard grouping, and input containers sit at `#0c0d14` for a recessed input feel.
- **Tonal Layering (Light Mode):** Base backgrounds use `#faf7f2`, cards use `#ffffff`, and inputs use `#ffffff` with a thin border.
- **Elevation Shadow:** Card elements use a minimal elevated hover shadow (`box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05)`) in light mode to provide depth on interaction.

### Named Rules
**The Flat-by-Rest Rule.** Cards and elements sit flat at rest. Background blurs and glow borders appear only as hover states or structural overlays (modals) to prevent visual noise.

---

## Shapes

Shapes follow a consistent, soft-edged geometric framework based on an 8px radius scale to maintain a modern, friendly structure.

- **Buttons & Chips:** Standard radius of `0.5rem (8px)` to ensure friendly touch targets.
- **Content Cards:** Medium corner radius of `0.75rem (12px)` to frame posts and book lists cleanly.
- **Modals & Dialogs:** Large corner radius of `1.5rem (24px)` to isolate modal views from the page grid.

---

## Components

### Buttons
- **Shape:** Medium curved edges (8px radius)
- **Primary:** Lavender solid background with white text (`padding: 10px 18px`).
- **Secondary:** Ghost outline style. Translucent background with a thin border and matching primary text color.
- **Hover:** Subtle transition opacity change and light translate upward on hover.

### Content Cards
- **Corner Style:** Rounded corners (12px radius)
- **Background:** White (`#ffffff`) in light mode; Deep surface (`#1e1f27`) with a thin border in dark mode.
- **Interaction:** Shifts outline color to primary on hover.

### Input Fields
- **Style:** Flat, dark background recessed (`#0c0d14`) in dark mode; White (`#ffffff`) in light mode. Thin border.
- **Focus:** 1px glow outline in secondary Electric Blue.

---

## Do's and Don'ts

### Do:
- **Do** align all page container layouts to the standard `1200px` max-width.
- **Do** maintain a strict 8px spacing rhythm for paddings and margins.
- **Do** use `JetBrains Mono` exclusively for metadata fields, dates, and micro-counters.

### Don't:
- **Don't** use solid saturated black (#000000) or high contrast white backgrounds for main text canvas layouts; use the soft warm paper and deep canvas colors.
- **Don't** add complex gradients or shadows to background layers. Keep them flat and content-focused.
- **Don't** mix different corner border radii on sibling cards in the same grid.
