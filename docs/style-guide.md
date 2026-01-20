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

#### Palettes: Full Range (18 Presets)
O sistema agora oferece 18 paletas segmentadas por intenção editorial (Economist, Financial Times, Guardian, Vibrant, Pastel, CB-Safe, etc.), acessíveis via `src/utils/chartTheme.ts`.

#### Maximum Color Usage Rule
For **Single Series Bar/Column Charts, Pictograms, Histograms, Mixed Charts, and Bubble Charts**, the system maximizes the use of the palette.
*   **Smart Color Logic**: When a chart has only one data column (single series), it cycles through the entire palette to distinct each data point (bar/column).
*   **Multi-Series**: When multiple datasets exist, standard color-per-series logic applies for comparison.
*   Instead of a single primary color, these charts cycle through the entire selected palette.
*   **Purpose**: To create more vibrant and distinguishable data points, especially in infographic modes.

#### Hierarquia de Aplicação (Loading Hierarchy)
Os estilos seguem a precedência: **Edição do Gráfico > Padrão do Projeto > Preferências do Usuário > Fallback do Sistema**.


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

### Hierarchy (Infographic Mode - Proportional Scaling)
- **High Values (80%+ of Max)**: **2.0x** relative size, `font-black`, `uppercase`, `tracking-tighter`.
- **Medium Values (50-80% of Max)**: **1.5x** relative size, `font-semibold`, normal case.
- **Low Values (<50% of Max)**: **1.0x** relative size, `font-normal`, muted opacity (0.6).
- **Manual Hero Highlight**: **1.3x extra boost** over calculated hierarchy.
- **Titles/Annotations**: `text-xs font-mono uppercase tracking-widest`.

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

### Layering & Stacking
The interface uses a depth-based layering system to ensure controls never overlap content unexpectedly.
*   **Surface**: The infinite gray canvas.
*   **Paper**: The white A4/A3/A5 page.
*   **Interaction Layer**: Selection outlines and chart handles.
*   **Control Layer**: The fixed right Sidebar and Header.
*   **Overlay Layer**: Dropdowns and Modals (always utilize portals/high z-index).

### Chart Specific Optimizations
*   **Radar Chart**:
    *   **Classic Margin**: `35px` (Maximized size, fitting only labels).
    *   **Infographic Margin**: `60px` (Accommodates large "Hero" values on top).
*   **Bar Chart (Infographic)**:
    *   **Margin Right**: `80px` (Space for huge numbers).
    *   **Margin Left**: `140px` (Space for large category labels).
*   **Line/Area Charts (Infographic)**:
    *   **Margin Top**: `60px` (Prevents hero numbers from clipping at the top).
*   **Pie/Donut Charts (Infographic)**:
    *   **Padding**: `80px` (Space for external labels and huge percentages).

---

## 4. Visual Styles

### Shadows
The design uses shadows very sparingly, primarily for depth in editing modes ("lifting" an object).
*   **Drop Shadow**: `0 4px 12px rgba(0,0,0,0.1)` (Modals, Popovers)
*   **Chart Shadow**: `0 4px 20px rgba(0,0,0,0.1)` (Page container)
*   **Premium Effects Shadow**: Filtro SVG `chartShadow` aplicado aos elementos de dados (STD Deviation: 3, Slope: 0.1).
*   **Gradients Premium**:
    *   **Radiais**: Opacidade 1.0 → 0.85 → 0.6.
    *   **Lineares**: Opacidade 1.0 → 0.7.
*   **Acabamento Cristal (Liquid Glass)**:
    *   **Conceito**: Efeito "Gummy" ou "Vidro Líquido".
    *   **Técnica**: Não usa bordas físicas (strokes). Usa um filtro SVG (`iosGlassFilter`) que cria um *Rim Light* (luz de borda) interno através de erosão morfológica.
    *   **Aplicação**: Barras, Fatias de Pizza, Áreas Preenchidas.
    *   **Linhas**: Usa uma variação (`glassLineFilter`) com erosão reduzida (0.5px) para manter a visibilidade de traços finos.


### Radius
*   **Small**: `4px` (Inputs, Buttons)
*   **Medium**: `6px` (Cards, Groups)
*   **Large**: `8px - 12px` (Modals)
*   **Round**: `50%` (Circular Actions, Gauges)

---

## 5. Specific Chart Guidelines

### Gauge Chart (Goal Chart)
- **Concept**: Visualizes progress toward a single numerical target.
- **Center Value**: Bold, large percentage centered within the semi-circle.
- **Stroke**: Thick, rounded linecaps for both track and progress.
- **Sub-Labels**: Secondary text below the percentage showing absolute values (e.g., "75 of 100").
- **Premium Touch**: Subtle drop shadows on the progress arc and vibrant gradients.
- **Mode Differences**:
    - *Classic*: Stroke: 12-16px, Center Value: 32px, Sub-labels: visible.
    - *Infographic*: Stroke: 24-32px, Center Value: 56px+ (Hero Number), Sub-labels: hidden for maximum impact.

### Pictogram Chart
- **Mode Differences**:
    - *Classic*: Icon size: 24px, row-based labels, legend visible.
    - *Infographic*: Icon size: 36px, larger gaps, labels bolded, focus on large "Hero" values if applicable.

---

## 6. Components

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
