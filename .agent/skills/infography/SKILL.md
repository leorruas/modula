---
description: A comprehensive guide to transforming data into visual stories. Covers anatomy, hierarchy, storytelling, color, icons, layout, and accessibility for impactful infographics.
---

# Infography Skill

> "A chart displays data. An infographic tells a story."  
> "Infographics transform complex datasets into easily understandable visual narratives."

This skill is about moving from *passive display* to *active storytelling*—creating **Editorial Intelligence** with data.

---

## 1. Anatomy of an Effective Infographic

Every infographic has a clear structure that guides the viewer through a narrative:

| Component | Purpose | Implementation |
| :--- | :--- | :--- |
| **Compelling Title/Hook** | Grab attention, summarize the story | Use **Typography Skill** for impact: `text-4xl md:text-6xl font-black tracking-tighter` |
| **Introduction/Context** | Set the stage, establish the "why" | Brief eyebrow text: `font-mono text-xs uppercase tracking-widest text-muted` |
| **Data-Driven Body** | Present insights through visualizations | Charts, graphs, icons—the visual "meat" of the story |
| **Key Insight/Hero Number** | The focal point, the "aha!" moment | Use extreme scale and contrast to create visual anchor |
| **Conclusion/Takeaway** | Reinforce the message | Clear, actionable statement |
| **Attribution/Sources** | Build credibility | Small footer text: `text-xs text-muted-foreground` |

### The "Story Flow"
Think of infographics as having a **beginning → middle → end**:
1. **Hook**: "What's the problem or question?"
2. **Evidence**: "Here's the data that matters."
3. **Resolution**: "Here's what it means."

---

## 2. The Core Philosophy: "Delete the Ink"

Standard charts are full of "chart junk": axes, gridlines, borders, and ticks.  
**Infographics** use whitespace as structure and let data breathe.

| Element | Standard Chart | Infographic | Why |
| :--- | :--- | :--- | :--- |
| **Gridlines** | Light Grey | **GONE** | Use alignment and white space instead |
| **Axes** | X and Y lines | **GONE** | The data shapes (bars) *are* the axis |
| **Ticks** | Small marks | **GONE** | Unnecessary noise—direct labeling instead |
| **Legends** | Side box | **GONE** | Use **Direct Labeling** on the data itself |
| **Borders** | Container lines | **MINIMAL** | Let content define boundaries |

**Tufte's Principle**: Maximize the data-ink ratio. Every pixel should tell the story.

---

## 3. Visual Hierarchy: Guiding the Eye

Visual hierarchy determines what viewers see **first**, **second**, and **third**.

### Hierarchy Techniques

| Technique | How to Apply | Example |
| :--- | :--- | :--- |
| **Size & Scale** | Larger = More important | Hero number: `text-8xl`, context: `text-base` |
| **Color & Contrast** | Stand-out colors for key data | Primary data: vibrant color, context: muted grey |
| **Weight** | Bold draws attention | `font-black` vs `font-light` |
| **Position** | Top-left is default entry point | Place the "hook" in the top third |
| **White Space** | Isolation creates importance | Generous margins around hero elements: `my-16` |
| **Typography** | Font changes signal shifts | Mono for data, Sans for narrative |

### The "Squint Test"
Squint at your infographic. Can you still identify:
- The most important element?
- The logical flow from top to bottom?
- Clear groupings of related information?

If not, increase contrast and scale.

---

## 4. Direct Labeling & The "Hero Number"

### Direct Labeling
Never make the user **look back and forth** between a color key and the data.

- **Label the Bar**: Place category names *inside* or *directly adjacent to* the bar.
- **Value Positioning (Top)**: In Infographic Column/Bar modes, prefer placing values **above** or **outside** the bar to avoid overlap with high-impact color fills.
- **Spider Collision (Radial)**: Use the "Spider Leg" algorithm for Pie/Donut charts to push labels into clean vertical columns with bent connector lines.
- **Label the Value**: Place numbers *inside* or *next to* the data point.
- **Embed Context**: Add micro-annotations directly on the visualization.

### The "Hero Number"
Infographics are poster-like. They need a **focal point**.

- **The Active Data Point**: The "star" of your story (max, min, current period)
  - Make it **BOLD**, **LARGE**, and use your **primary accent color**
  - Example: `text-6xl font-black text-primary`
  
- **The Context Data**: Supporting cast that provides comparison
  - Make it **MUTED**: lower opacity, grey tones
  - Example: `text-xl font-light text-muted-foreground/40`

**Ratio**: Aim for a 3:1 or higher contrast ratio between hero and context elements.

---

## 5. Color: Psychology & Strategy

Color is not decoration—it's **communication**.

### Color Principles

| Principle | Rule | Implementation |
| :--- | :--- | :--- |
| **Limited Palette** | Use 2-4 colors max | Primary accent + neutrals (greys) |
| **High Contrast** | Text must be readable | `text-foreground` on light bg, `text-background` on dark |
| **Semantic Color** | Color = meaning | Green = positive/growth, Red = negative/decline, Blue = neutral/information |
| **Accessibility** | WCAG AA minimum | Use contrast checkers, avoid relying solely on color |
| **Consistency** | Same data = same color | Revenue is always the same accent across charts |

### The "Accent + Neutrals" Strategy
- **One Bold Accent**: Your primary brand or data color (e.g., vibrant blue, orange)
- **Neutral Grays**: For context, backgrounds, and supporting text
- **Semantic Accents**: Red/Green for delta indicators only

**Example Palette**:
```css
--accent-primary: hsl(210, 100%, 50%);   /* Vibrant data color */
--neutral-muted: hsl(0, 0%, 60%);        /* Context data */
--semantic-positive: hsl(142, 76%, 36%); /* Growth */
--semantic-negative: hsl(0, 84%, 60%);   /* Decline */
```

---

## 6. Icons & Visual Elements

Icons and illustrations add personality and simplify complex concepts.

### Icon Guidelines

| Guideline | Explanation |
| :--- | :--- |
| **Consistent Style** | All icons should match: same line weight, same style (outline vs filled) |
| **Purposeful Use** | Icons should **reinforce** the message, not distract |
| **Custom > Stock** | Prefer custom illustrations for authenticity and brand alignment |
| **Size Harmony** | Icons should scale with typography (e.g., `size-6` with `text-base`) |
| **Avoid Redundancy** | Don't duplicate what text already says clearly |

### When to Use Icons
- ✅ To represent categories visually (e.g., ☁️ Cloud, 🏠 On-Premise)
- ✅ As visual anchors in timelines or processes
- ✅ To add emotional context (e.g., 📈 growth, ⚠️ warning)
- ❌ As decoration without meaning
- ❌ When text is clearer

---

## 7. Layout & Composition

Layout determines how scannable and memorable your infographic is.

### Layout Principles

| Principle | Technique |
| :--- | :--- |
| **Grid-Based Alignment** | Use invisible grids to align elements (`flex`, `grid` in CSS) |
| **Logical Flow** | Top → Bottom, Left → Right (in Western contexts) |
| **White Space** | Essential for clarity—don't fear empty space (`gap-8`, `my-12`) |
| **Modular Sections** | Break complex infographics into digestible "blocks" |
| **Responsive Design** | Infographics must work on mobile—consider vertical layouts |

### The "F-Pattern" & "Z-Pattern"
- **F-Pattern**: Users scan top-left → right, then down the left side. Use for text-heavy infographics.
- **Z-Pattern**: Eyes move in a Z (top-left → top-right → bottom-left → bottom-right). Use for hero-driven designs.

### Composition Checklist
1. **Is there a clear entry point?** (Title, hero number)
2. **Is there a logical reading order?** (Visual flow)
3. **Are related items grouped?** (Proximity principle)
4. **Is there breathing room?** (White space)

---

## 8. Typography as Interface

We use the **Typography Skill** to its extreme in infographics.

### The Two-Font System
| Font | Use Case | Feeling |
| :--- | :--- | :--- |
| **Geist Sans** (`var(--font-geist-sans)`) | Titles, narratives, labels | Human, editorial, flowing |
| **Geist Mono** (`var(--font-geist-mono)`) | Numbers, data, IDs, stats | Precise, tabular, technical |

### Infographic Type Scale
| Role | Classes | When to Use |
| :--- | :--- | :--- |
| **Hero Number** | `text-7xl md:text-9xl font-black tracking-tighter font-mono` | The "wow" stat |
| **Title/Hook** | `text-4xl md:text-6xl font-bold tracking-tight` | Main headline |
| **Section Header** | `text-2xl font-semibold tracking-tight` | Sub-sections |
| **Data Label** | `text-lg font-medium font-mono` | Chart labels, categories |
| **Context/Caption** | `text-sm text-muted-foreground` | Annotations, sources |

### Narrative Titles
Transform boring labels into **story-driven headlines**:
- ❌ "Revenue 2024"
- ✅ "Revenue grew by 20% in 2024"
- ✅ "Our fastest year yet: $4.2M"

---

## 9. Data Visualization Best Practices

Choosing the **right chart type** is critical.

| Data Story | Chart Type | When to Use |
| :--- | :--- | :--- |
| **Comparison** | Bar Chart | Comparing categories (e.g., sales by region) |
| **Trends Over Time** | Line Chart | Showing change (e.g., revenue growth over 5 years) |
| **Part-to-Whole** | Donut/Pie (sparingly) | Showing proportions (max 2-3 slices) |
| **Distribution** | Histogram | Frequency or distribution of values |
| **Correlation** | Scatter Plot | Relationship between two variables |
| **Single Metric** | Big Number + Sparkline | KPI dashboards, at-a-glance stats |

### Visualization Sins to Avoid
- ❌ **Truncated Y-Axis**: Always start bar charts at zero
- ❌ **3D Charts**: They distort perception—stick to 2D
- ❌ **Too Many Data Points**: Simplify—5-7 categories is ideal
- ❌ **Misleading Scales**: Keep axes consistent for comparisons

---

## 10. Accessibility & Inclusivity

Infographics must be **for everyone**.

### Accessibility Checklist
1. **Color Contrast**: Minimum 4.5:1 for text, 3:1 for UI elements (WCAG AA)
2. **Don't Rely on Color Alone**: Use patterns, labels, or icons to distinguish data
3. **Readable Fonts**: Minimum `text-sm` (14px), prefer larger for readability
4. **Alt Text**: Provide text descriptions for screen readers
5. **Mobile-Friendly**: Ensure infographics scale gracefully on small screens

---

## 11. Implementation Checklist

> **Architecture Note**: Use the **Componentization Skill** to structure the "Hero Value", "Annotation Layer", and "Decorators" as separate, reusable sub-components rather than monolithic render functions.


### Phase 1: Foundation (Chart → Infographic)
When building an Infographic Mode component:
1. [ ] **Remove Axes & Grid**: `axisOpacity: 0`, `gridOpacity: 0`. Whitespace is the grid.
2. [ ] **Hide Static Legends**: Use direct labeling or dynamic placement (Top/Bottom/Left/Right).
3. [ ] **Proportional Hierarchy**: Values 80%+ of max should be **2.0x larger**, **UPPERCASE**, and **BLACK (900)** weight. Values <50% should be muted (0.6 opacity).
4. [ ] **Maximize Data Ink**: Bars/lines should take up 70-80% of available space.

### Phase 2: Interactive Storytelling
5. [ ] **Manual Hero Override**: Provide a UI to manually designate a "Hero" value, applying a 1.3x boost over its calculate hierarchy.
6. [ ] **Delta Analysis**: Show inline percentage indicators (e.g., `+15%`) compared to the dataset average.
7. [ ] **Portal Modals**: Use React Portals for configuration modals to avoid parent z-index/clipping issues.
8. [ ] **Custom Annotations**: Support user-defined labels (e.g., "RECORD YEAR") per data point.

### Phase 3: Smart & Automatic Detection
9.  [ ] **Auto-Extremes**: Implement optional logic to automatically identify and badge the **MÁXIMO** and **MÍNIMO** values.
10. [ ] **Metadata Integration**: Allow the component to read an optional `metadata[]` array from the JSON source for automatic contextual badges.
11. [ ] **Priority Stack**: Follow the precedence: Manual Annotation > Metadata > Automatic Extremes.
12. [ ] **Squint Test**: Can you identify the hierarchy and the "story" at a glance?

---

## 12. Examples in Practice

### Before: Standard Bar Chart
- Grey gridlines, axis labels, legend box
- All bars same color and size
- Title: "Q4 Sales by Region"

### After: Infographic
- **No gridlines or axes**: Clean white space
- **Hero Bar**: Largest region in vibrant accent color (`text-primary`)
- **Context Bars**: Muted grey (`text-muted-foreground/40`)
- **Direct Labels**: Region names on bars, values at bar tops
- **Narrative Title**: "West Coast drives Q4 with $1.2M in sales"
- **Typography**: `text-6xl font-mono font-black` for $1.2M

---

**Remember**: An infographic should be **memorable**, **scannable**, and **actionable**. If it doesn't pass the "squint test" or tell a clear story in 5 seconds, keep refining.
