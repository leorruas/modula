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
- **High Values (80%+ of Max)**: **2.6x** relative size (2.0x base * 1.3x Hero multiplier), `font-black`, `uppercase`, `tracking-tighter`.
- **Medium Values (50-80% of Max)**: **1.5x** relative size, `font-semibold`, normal case.
- **Low Values (<50% of Max)**: **1.0x** relative size, `font-normal`, muted opacity (0.6).
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
*   **Symmetry Rule (Bar Chart Infographic)**:
    *   **Equal Margins**: Para manter o equilíbrio editorial, as margens esquerda e direita devem ser **idênticas**. O sistema reserva o mesmo espaço para os labels (esquerda) e para os valores (direita), centralizando visualmente o gráfico.
*   **Symmetry Rule (Column Chart Infographic)**:
    *   **Centered Groups**: O conteúdo (barras) deve ser centralizado geometricamente dentro do grupo, compensando o `groupGap` que naturalmente criaria assimetria à direita.
    *   **Tight Padding**: O padding lateral é reduzido para **10px** (Small) para maximizar a área de dados.
*   **Mixed Charts (Gestalt Optimized)**:
    *   **Container Intelligence (Box Rule)**: As margens são calculadas dinamicamente (`5%` ou `minPadding`) em vez de fixas, adaptando-se a qualquer tamanho de container.
    *   **Legend Proximity (Gap Rule)**: A distância entre o gráfico e a legenda deve ser minimizada para garantir associação Gestalt. O `gap` é reduzido para **8px** (BaseChart) e margens internas do MixedChart são otimizadas para eliminar espaços em branco.
    *   **Proportional Spacing (Breath Rule)**: O espaçamento vertical é derivado do `fontSize` (ex: `1.5em`), garantindo que rótulos e gráficos mantenham distância segura ao escalar a fonte.
*   **Pie/Donut Charts (Infographic)**:
    *   **Padding**: Base de **20px** (Classic) e **40px** (Infographic) para maximizar a escala do chart.
    *   **Pie Style**: "Nightingale Rose" effect - Radius varies by value intensity.
    *   **Donut Style**: "Variable Thickness" - Slice thickness varies by value (heavier values = thicker). Espessura mínima garantida de **22%** (`Thickness Floor`) do raio para evitar fatias "invisíveis".
    *   **Sorting**: Optional "Largest to Smallest" sorting (Clockwise).
    *   **Editorial Label Stack**:
        - **Valores/Percentuais**: Topo, Peso **Black (900)** para impacto máximo.
        - **Categorias (Metadata)**: Abaixo, Peso **Regular (400)**, servindo como rotulagem secundária.
        - **SVG Unification**: Ambos renderizados em um único grupo SVG para alinhamento vertical rigoroso.

### 3.4. Advanced Layout Intelligence (The Brain)
To maintain the "Editorial & Minimalist" look, the system follows these invisible rules:
*   **Anti-Wrapping Hierarchy**: When space is tight, labels evolve rather than just cutting off:
    1.  **Wrapping**: 3-line max with semantic balance.
    2.  **Staggering**: Odd/Even vertical offset for neighbor labels.
    3.  **Abbreviation**: Semantic term replacement (e.g., "Setembro" -> "Set").
    4.  **Rotation**: 45° tilt as an optical last resort.
*   **Grid Elasticity (Vacuum-Seal)**:
    *   **Vertical Fill**: If the module is tall but data is sparse, bars grow (up to 120px) to eliminate "floating chart" syndrome.
    *   **Vacuum-Seal**: The chart plot area physically expands to touch the boundaries of titles and legends (24px proximity).
*   **LOD (Level of Detail)**: Content degrades gracefully. At "Tiny" sizes (<150px), the chart becomes a **Sparkline** (axes and legends are purged to preserve the data shape).

### 3.5. Zero-Truncation Elasticity (Atomic Labels)
A core principle is the **No-Ellipsis Policy**:
*   **Atomic Word Protection**: The system measures the widest *single word* in a label. The side margin (`marginLeft`) will never shrink below this word's width + buffer.
*   **Lateral Elasticity**: If a label absolutely needs more space, the Engine will compress the Chart Plot instead of truncating the text.
*   **Hierarchy-Aware Cap**: For complex grouped headers, the Engine can expand margins up to 50% of the total width to ensure readability.
*   **Smart Positioning (Inside/Outside)**:
    *   **Logic**: Values automatically place themselves **inside** the bar if they fit horizontally and vertically.
    *   **Contrast**: When inside, text color flips (Black/White) based on bar brightness (YIQ standard).
*   **Smart Sorting (Identity Preservation)**:
    *   When enabled, bars sort descending by value.
    *   **Immutability**: Colors remain attached to their Category (Data Identity), preventing "rainbow shuffling" confusion.

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
*   **Embedded Data Controls**:
    *   **Context**: Usado no *SimpleDataEditor* para configurações granulares (ex: "Barra | Linha").
    *   **Visual**: Botões pequenos (text-xs), contorno suave, feedback de cor imediato (Cyan para Barras, Roxo para Linhas).
    *   **Location**: Inserido diretamente no cabeçalho da coluna de dados para associação cognitiva imediata.


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
