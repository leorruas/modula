---
description: A definitive guide to typographic hierarchy, rhythm, and rendering. Mixing "Elements of Style" (Readability) with Ellen Lupton's "Type on Screen" (Impact).
---

# Typography Skill

> "Typography is the craft of endowing human language with a durable visual form." — Robert Bringhurst
> "Typography is what language looks like." — Ellen Lupton

This skill enables the agent to use type as both a **vessel for content** (Readability) and an **interface element** (Impact). We aim for "Editorial Intelligence"—a balance of quiet, accessible reading experiences and loud, structural typographic moments.

## 1. The Strategy: Scale & Texture

We think of typography in two modes: **Micro** (Reading) and **Macro** (Structure).

### Type as Interface (Macro)
Text is not just content; it is structure.
- **Scale**: Don't be afraid of HUGE type. A `text-6xl` or `text-7xl` number is often better than a chart.
- **Weight**: Use extreme weights for contrast. `font-light` vs `font-black`.
- **The "Squint Test"**: If you squint, does the typography form a clear shape or grid?

### Type as Content (Micro)
- **Measure**: 45-75 characters per line.
- **Rhythm**: Consistent vertical flow.
- **Legibility**: High contrast, open leading.

## 2. The Power Couple: Sans & Mono

We use a dual-font system to separate **Narrative** from **Data**.

| Font | Variable | Role | feeling |
| :--- | :--- | :--- | :--- |
| **Geist Sans** | `var(--font-geist-sans)` | **Narrative** | Human, Flowing, Variable width. Used for storytelling, UI labels, buttons. |
| **Geist Mono** | `var(--font-geist-mono)` | **Data** | Machine, Precise, Tabular. Used for code, IDs, financial data, timestamps. |

### Pairing Rules
- **The "Editorial" Header**: Use Sans for the title, Mono for the eyebrow/meta.
    - *Example*: `text-xs font-mono uppercase text-muted` (Eyebrow) + `text-4xl font-bold tracking-tight` (Title).
- **The "Financial" Display**: Use Sans for the label, Mono for the big number.
    - *Example*: "Total Revenue" (Sans) + "$4,200.00" (Mono).

## 3. Scale & Hierarchy (The Modular Scale)

| Role | Class | Specs | Notes |
| :--- | :--- | :--- | :--- |
| **Display/Hero** | `text-6xl md:text-8xl font-black tracking-tighter` | **Impact** | For "Type as Image". Use sparingly. |
| **Headline** | `text-4xl md:text-5xl font-bold tracking-tight` | Tight | Page Titles. |
| **Section** | `text-2xl font-semibold tracking-tight` | Balanced | Sub-sections. |
| **Body** | `text-base leading-relaxed` | Readable | Long-form text. |
| **UI Label** | `text-sm font-medium` | Functional | Buttons, inputs. |
| **Aux/Meta** | `text-xs font-mono uppercase tracking-widest text-muted` | Technical | Dates, tags, citations. |

## 4. Micro-Typography & Refining Details

### Uppercase Tracking
**Rule**: Uppercase letters need more space.
- **Action**: `uppercase` **MUST** be paired with `tracking-wider` or `tracking-widest`.

### Numbers & Tabular Data
- Always use `font-mono` or `tabular-nums` for data tables or comparison lists so numbers align vertically.

### Contrast & Rendering
- **Off-Black**: Avoid `#000`. Use `text-foreground` (usually `#1a1a1a` or similar).
- **Antialiasing**: Start with `antialiased` for a clean, digital feel.

### 4.b Infographic Proportional Scaling (Smart Hierarchy)
In data-heavy infographic modes, typography should move beyond fixed sizes:
- **High Values (80%+ of Max)**: **2.0x size**, `font-black`, `uppercase`, `tracking-tighter`.
- **Medium Values (50-80% of Max)**: **1.5x size**, `font-semibold`, normal case.
- **Low Values (<50% of Max)**: **1.0x size**, `font-normal`, normal case, muted opacity (0.6).
- **Manual Hero Override**: Provide a 1.3x "boost" factor for user-selected focal points.

## 5. Tailwind Utility Maps (The "Cheatsheet")

To achieve the "Premium/Editorial" Look:

*   **The "Lupton" Hero**: `text-7xl font-black tracking-tighter leading-none`
*   **Editorial Eyebrow**: `font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground`
*   **Data Highlight**: `font-mono text-4xl font-medium tracking-tight`
*   **Body Paragraph**: `text-base leading-7 text-pretty max-w-prose` (Note: `text-pretty` prevents orphans).

## 6. Implementation Checklist

When creating a UI:
1.  [ ] **Am I being boring?** Can I make the title 3x bigger?
2.  [ ] **Is Data distinct?** Are numbers/IDs in Mono?
3.  [ ] **Is the rhythm clear?** ample whitespace (`mb-8`, `mb-12`) between sections?
4.  [ ] **Is it readable?** Line length constrained?
