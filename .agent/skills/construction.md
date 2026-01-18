---
description: Guidelines for constructing and refactoring components with a focus on Premium Design and Robust Build
---

# Construction Skill

This skill outlines the process for creating or modifying components. 
**CRITICAL**: You must apply **Premium Aesthetics** to the App UI, while keeping Chart Outputs **Strictly Static** and **Editiorial**.

## 1. Design & Aesthetics (Premium First)

### Subsection: App UI (The Tool)
- **Visual Impact**: Using default styles is a failure. The UI (Sidebar, Modals, Menus) must look "App-Like" and expensive.
- **Glassmorphism & Depth**: Use subtle backdrops, blurs, and shadows to create depth.
- **Micro-animations**: mandatory.
  - *Hover*: Scale (1.02) or Brightness filter.
  - *Active*: Scale down (0.98).
  - *Transition*: `transition-all duration-300 ease-in-out`.
- **Colors**: Use the curated palette in `style-guide.md`. Never use raw hexes like `#CCCCCC` or `#0000FF`.

### Subsection: Chart Output (The Product)
- **ZERO ANIMATIONS**: Charts must render instantly for bulk PDF export. No growing bars, no fading lines.
- **Editorial Quality**: Focus on typography (Kerning, Weights), spacing, and high-contrast lines.
- **Export Safety**: Avoid complex CSS filters (blur, backdrop-filter) on chart elements as they often fail in `html2canvas` or `jsPDF`.

## 2. Component Structure
- Use **Functional Components** with TypeScript interfaces.
- Place components in `src/features/[feature]/components`.
- Use `src/components` only for truly global generic UI (atoms/molecules).

## 3. Styling
- Prefer **CSS Modules** (`styles.module.css`) or standard CSS variables defined in globals.
- Avoid inline styles for static layouts; use them only for dynamic values (e.g., chart coordinates).
- Respect the Design System (Tokens, Typography) in `docs/style-guide.md`.

## 4. Architecture
- **Separation of Concerns**: Logic should be in hooks (`src/hooks` or `use[Feature].ts`).
- **Data Fetching**: Use Services (`src/services`) for API/Firebase calls. Do not fetch directly in components.
- **State**: Use stores (Zustand) for global state; `useState` for local UI state.

## 5. Process Checklist (Do not skip)

### Step 1: Visual Planning
- [ ] Before coding, visualizing the outcome.
- [ ] **Interactive Elements**: Define hover/active states immediately.
- [ ] **Chart Elements**: Confirm they are static and printable.

### Step 2: Quality Philosophy
- [ ] **Robustness First**: Do not implement "quick fixes" or hardcoded patches.
- [ ] **Systemic Thinking**: Solve the root cause. If a value is used in 3 places, create a constant or theme configuration.
- [ ] **Scalability**: Write code that handles future growth.

## 6. Self-Correction
- **"Does this look basic?"** -> If yes, add a gradient, a shadow, or better spacing.
- **"Will this break PDF export?"** -> If it moves/animates, remove it from the Chart layer.
