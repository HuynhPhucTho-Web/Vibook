---
name: Futuristic Tech
colors:
  surface: '#12131a'
  surface-dim: '#12131a'
  surface-bright: '#383941'
  surface-container-lowest: '#0d0e15'
  surface-container-low: '#1a1b22'
  surface-container: '#1e1f27'
  surface-container-high: '#292931'
  surface-container-highest: '#34343c'
  on-surface: '#e3e1ec'
  on-surface-variant: '#cdc3d6'
  inverse-surface: '#e3e1ec'
  inverse-on-surface: '#2f3038'
  outline: '#968d9f'
  outline-variant: '#4b4454'
  surface-tint: '#d5baff'
  primary: '#d5baff'
  on-primary: '#42008a'
  primary-container: '#8e54e9'
  on-primary-container: '#fffeff'
  inverse-primary: '#7639d0'
  secondary: '#b2c5ff'
  on-secondary: '#002b74'
  secondary-container: '#054aba'
  on-secondary-container: '#b2c5ff'
  tertiary: '#ffb955'
  on-tertiary: '#452b00'
  tertiary-container: '#a26a00'
  on-tertiary-container: '#fffeff'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ecdcff'
  primary-fixed-dim: '#d5baff'
  on-primary-fixed: '#270057'
  on-primary-fixed-variant: '#5d15b7'
  secondary-fixed: '#dae2ff'
  secondary-fixed-dim: '#b2c5ff'
  on-secondary-fixed: '#001849'
  on-secondary-fixed-variant: '#003fa3'
  tertiary-fixed: '#ffddb4'
  tertiary-fixed-dim: '#ffb955'
  on-tertiary-fixed: '#291800'
  on-tertiary-fixed-variant: '#633f00'
  background: '#12131a'
  on-background: '#e3e1ec'
  surface-variant: '#34343c'
  neon-purple: '#8e54e9'
  electric-blue: '#4776e6'
  glass-surface: rgba(255, 255, 255, 0.03)
  glass-border: rgba(255, 255, 255, 0.12)
  bg-deep: '#0c0d14'
typography:
  headline-xl:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
---

## Brand & Style
The design system is engineered for a high-performance, futuristic tech environment. It targets a tech-savvy audience that values innovation, speed, and cutting-edge aesthetics. 

The visual style is **Glassmorphism**, characterized by translucent surfaces, multi-layered depth, and vibrant background blurs. The interface should feel like a high-end digital cockpit, utilizing deep blacks for grounding and neon-infused gradients to direct attention. The emotional response is one of sophistication and technical mastery. High-contrast interactions and subtle glow effects reinforce the "living" nature of the software.

## Colors
The palette is rooted in a "void-black" foundation to maximize the luminosity of the primary accents. 

- **Primary & Secondary:** A gradient transition between Purple and Blue serves as the core brand identifier, used for active states, primary actions, and "glow" light sources.
- **Surface Strategy:** Backgrounds are deep and opaque, while interactive layers use varying levels of transparency to create the glass effect.
- **Functional Colors:** Success, warning, and error states should be tinted with the primary hue's saturation level to maintain visual harmony within the futuristic theme.

## Typography
This design system utilizes **Hanken Grotesk** as its primary typeface to provide a clean, sharp, and contemporary feel that balances the organic nature of glass textures. 

To reinforce the technical and developer-friendly nature of the product, **JetBrains Mono** is used for labels, metadata, and technical readouts. Headlines should use tight letter spacing and heavy weights to command attention against vibrant backgrounds. Body text maintains high legibility with generous line heights to ensure comfort during long reading sessions.

## Layout & Spacing
The layout follows a **fluid grid** system based on an 8px rhythmic scale. This ensures all components align perfectly across different screen sizes.

- **Desktop:** A 12-column grid with 24px gutters and 64px side margins.
- **Tablet:** An 8-column grid with 16px gutters and 32px side margins.
- **Mobile:** A 4-column grid with 16px gutters and 20px side margins.

Content is organized into modular "glass units." Vertical spacing between major sections should be generous (80px+) to allow the background blurs and ambient glows to breathe.

## Elevation & Depth
Depth is conveyed through **Glassmorphism** and light-source simulation rather than traditional shadows.

1.  **Backdrop Blurs:** Every floating container must apply a `backdrop-filter: blur(20px)`.
2.  **Tonal Stacking:** Surfaces closer to the user are lighter and more transparent; those further away are darker and more opaque.
3.  **Neon Glow Borders:** Use 1px semi-transparent borders. For high-priority elements, apply a subtle outer glow (box-shadow) using the primary or secondary brand colors with a high spread and low opacity.
4.  **Z-Index Logic:** Higher elevation elements should have a slightly higher border opacity to simulate light catching the "edge" of the glass.

## Shapes
The shape language is "Softly Geometric." All containers and buttons use a **0.5rem (8px)** base radius. This prevents the UI from feeling too aggressive while maintaining a structural, engineered look. Larger components like cards and modals should scale up to **1.5rem (24px)** to emphasize their presence as floating glass panes.

## Components

### Buttons
Primary buttons use a linear gradient from `#8e54e9` to `#4776e6` with a subtle white inner-top border to simulate a light highlight. Secondary buttons use the "ghost" style: a transparent body with a glass-border and white text.

### Glass Cards
Cards are the heart of the system. They feature a `20px` background blur, a `rgba(255, 255, 255, 0.05)` fill, and a `1px` border. On hover, the border color should shift toward the brand purple to create a "charging" effect.

### Input Fields
Inputs are dark and recessed. They use a solid `bg-deep` fill but feature a "neon-glow" focus state where the entire border illuminates in electric blue.

### Chips & Badges
Small, pill-shaped indicators using the monospaced font. They should have a high-contrast background (either full brand color or a very subtle tinted glass) to stand out against the deep background.

### Scrollbars & Indicators
Scrollbars should be minimized and styled as thin, glowing lines that only appear on interaction, maintaining the clean "head-up display" aesthetic.

## Standard Layout & Container Widths
Để đồng bộ bố cục giữa các trang (Home, Blog, Group, Profile, v.v.), mọi trang dùng layout chính (`MainLayout` với `Sidebar` + `Main`) nên tuân theo kích thước container chuẩn dưới đây.

### Container chuẩn
Mọi container trang (ví dụ: `.home-container`, `.blog-container`) phải dùng pattern:

```css
.container-page {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--vb-space-2) var(--vb-space-2) var(--vb-space-4);
}
```

| Biến | Giá trị | Ghi chú |
|------|---------|---------|
| `--vb-space-1` | `4px` | Khoảng cách vi mô |
| `--vb-space-2` | `8px` | Khoảng cách nhỏ |
| `--vb-space-3` | `16px` | Khoảng cách vừa |
| `--vb-space-4` | `24px` | Khoảng cách lớn |

### Breakpoints chuẩn
- **Mobile:** `≤ 820px` → `max-width: 100%`, `padding: 0.5rem`.
- **Tablet:** `821px – 1023px` → container full, giữa.
- **Desktop:** `1024px – 1200px` → `max-width: 1200px`, căn giữa.
- **Ultra-wide:** `> 1200px` → container giới hạn tối đa `1200px`, căn giữa (không tràn full màn hình).

### Bảng quy đổi container mẫu
| Loại | max-width | Căn giữa | Padding |
|------|-----------|----------|---------|
| Trang chính (Home/Blog/Profile) | `1200px` | `margin: 0 auto` | `--vb-space-2` |
| Bảng điều khiển (Dashboard) | `1400px` | `margin: 0 auto` | `--vb-space-2` |
| Modal | `680px` | `margin: x auto` | `--vb-space-3` |
| Mobile | `100%` | — | `0.5rem` |

### Quy tắc áp dụng
1. **Right-aligned grid:** Các card/khối con bên trong container dùng `width: 100%` + `max-width: 100%` để không tràn.
2. **Không hardcode width nhỏ** (như `680px`) cho container trang; chỉ dùng `680px` cho modal.
3. **Responsive:** Luôn có `@media (max-width: 820px)` để chuyển về `max-width: 100%` + padding phù hợp.
4. **Box-sizing:** Mọi container dùng `box-sizing: border-box` để padding không làm nở vượt viewport.
