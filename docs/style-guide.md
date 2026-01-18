# Style Guide - Modula

> **Design Philosophy**: Modula aims for an **Editorial & Minimalist** aesthetic. The interface should feel like a high-end design tool—unobtrusive, precise, and sophisticated. The focus is always on the user's content (charts).

---

## 1. Color System

### UI Interface
The interface uses a strictly neutral palette to avoid competing with the artwork.

*   **Canvas Background**: `#e0e0e0` (Darker neutral to define page boundaries)
*   **Page Background**: `#ffffff` (Pure white)
*   **Sidebar/Modal Background**: `#ffffff`
    *   **Usage Rule**: Use Sidebar for main configuration (always available). Use Modals for extensive libraries (like Icons) or complex data entry.
*   **Section Boxes**: `#ffffff` (White container on gray background)
    *   Used in Sidebars to group related controls.
    *   Border: `1px solid #e0e0e0`
    *   Shadow: `0 2px 8px rgba(0,0,0,0.02)`
*   **Text Primary**: `#111111` (Near black, sharp)
*   **Text Secondary**: `#666666` (Subtle metadata)
*   **Borders/Dividers**: `#e5e5e5` (Very subtle)
*   **Accents**:
    *   **Primary Action**: `#000000` (Black buttons)
    *   **Selection/Focus**: `#3b82f6` (System Blue - used only for active states)
    *   **Infographic Mode**: `#00D9FF` (Cyan - specific branding for this mode)

### Chart Palettes
Charts follow curated themes found in `src/utils/chartTheme.ts`.

#### Palette 1: Editorial Pastel (Soft, Print-like)
*   Coral: `#FF8A80`
*   Salmon: `#FFB3AD`
*   Beige: `#F5E6D3`
*   Tea Green: `#B2DFDB`
*   Light Pink: `#FFCDD2`

#### Palette 2: Vibrant Modern (Digital, Screen-first)
*   Cyan: `#00D9FF`
*   Lime: `#D4FF00`
*   Turquoise: `#00BFA6`
*   Purple: `#9C27B0`
*   Orange: `#FF6F00`

#### Palette 3: Classic Business (Trustworthy)
*   Blue: `#2563eb`
*   Emerald: `#10b981`
*   Amber: `#f59e0b`
*   Red: `#ef4444`
*   Violet: `#8b5cf6`

#### Maximum Color Usage Rule
For **Pictograms, Histograms, Mixed Charts, and Bubble Charts**, the system maximizes the use of the palette.
*   Instead of a single primary color, these charts cycle through the entire selected palette.
*   **Purpose**: To create more vibrant and distinguishable data points, especially in infographic modes.

---

## 2. Typography

The system uses specific font stacks to differentiate UI from Content.

### UI Fonts
Used for interface elements (Sidebar, Modals, Buttons).
*   **Family**: `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
*   **Weights**:
    *   Regular (400)
    *   Medium (500)
    *   Semibold (600)

### Editorial Fonts (Charts)
Used inside the chart renders. The user can switch between these.
*   **Sans-Serif**: `system-ui, sans-serif` (Clean, Modern)
*   **Serif**: `Georgia, serif` (Editorial, Classic)
*   **Monospace**: `monospace` (Data-heavy, Technical)

### Hierarchy (Infographic Mode)
*   **Big Numbers**: `56px - 96px`, Black (900) weight. The "Hero" of the visualization.
*   **Titles**: `16px`, Semibold.
*   **Labels**: `12px - 14px`, Regular or Medium.

---

## 3. Spacing & Layout

### Grid Modular System
The core layout engine.
*   **Module**: The fundamental unit defined by the user (ex: 40x40mm).
*   **Gutter**: spacing between modules.
*   **Margin**: Safe area around the page.

### Component Spacing
*   **Padding Small**: `8px`
*   **Padding Medium**: `16px`
*   **Padding Large**: `24px`
*   **Sidebar Width**: `320px` (Fixed)

### Chart Specific Optimizations
*   **Radar Chart**:
    *   **Classic Margin**: `35px` (Maximized size, fitting only labels).
    *   **Infographic Margin**: `60px` (Accommodates large "Hero" values on top).

---

## 4. Visual Styles

### Shadows
The design uses shadows very sparingly, primarily for depth in editing modes ("lifting" an object).
*   **Drop Shadow**: `0 4px 12px rgba(0,0,0,0.1)` (Modals, Popovers)
*   **Chart Shadow**: `0 4px 20px rgba(0,0,0,0.1)` (Page container)
*   **Effect Shadow**: `shadowOpacity: 0.03` (Very subtle shadow on chart bars)

### Radius
*   **Small**: `4px` (Inputs, Buttons)
*   **Medium**: `6px` (Cards, Groups)
*   **Large**: `8px - 12px` (Modals)
*   **Round**: `50%` (Circular Actions)

---

## 5. Components

### Buttons
*   **Primary**: Black background, White text, no border.
*   **Secondary**: Transparent background, Gray text, 1px border.
*   **Icon-Only**: Use `lucide-react` icons. Transparent background.

### Inputs
*   **Border**: 1px solid `#ddd`.
*   **Focus**: Blue outline `#3b82f6`.
*   **Padding**: Comfortable (8px-12px).

### Toast Notifications
*   **Library**: `sonner`.
*   **Style**: Top-right positioning, rich colors for success/error states.

---

## 6. Motion & Interaction (App UI Only)

> **Important**: Motion should ONLY apply to the Dashboard/Editor UI. Charts must remain static for export.

### Transitions
*   **Default**: `transition-all duration-300 ease-in-out`
*   **Hover**: Scale up slightly (1.02) or brighten background.
*   **Active**: Scale down slightly (0.98).

### Purpose
*   **Feedback**: Every click must have immediate visual feedback.
*   **Fluidity**: Elements should glide, not jump.
*   **Enter/Exit**: Modals should fade/scale in (`scaleIn 0.2s`). Sidebars should slide in (`translateX`).

---

## 7. Anti-Patterns (What to Avoid)

### UI Failures
*   ❌ **Default Blue**: Never use `#0000FF` or default browser styles.
*   ❌ **Flat & Dead**: Buttons without hover states or active states.
*   ❌ **Generic Grays**: Avoid `#CCCCCC` or `#999999` unless necessary; use tinted grays or opacity.

### Chart Failures
*   ❌ **Low Contrast**: Text that blends into the background.
*   ❌ **Web Aesthetics**: Shadows or glow effects that look "glitchy" when exported to PDF.
*   ❌ **Animations**: Bars growing or lines drawing themselves (breaks bulk export).
