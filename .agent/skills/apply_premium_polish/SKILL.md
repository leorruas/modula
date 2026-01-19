---
description: A rigid checklist and guide to enforcing "Premium Aesthetics" and fixing "Basic" UI.
---

# Apply Premium Polish Skill

This skill is the "Art Director" of the agent. It is not just about making things work; it's about making them feel expensive, tangible, and high-quality. If the UI looks like a default Bootstrap or HTML page, it has FAILED.

## The Philosophy
**"If it doesn't move, it feels dead. If it's flat, it feels cheap."**

## The Checklist

### 1. Depth & Materials (Glassmorphism)
- [ ] **No Flat Backgrounds**: Are you using a solid hex color for a modal or sidebar?
    - *Fix*: Use `backdrop-filter: blur(12px)` with a semi-transparent `rgba` or `hsla` background.
    - *Fix*: Add a subtle `box-shadow` to lift the element.
    - *Fix*: Add a 1px border with low opacity (`border-white/10`) to define edges.

### 2. Interaction (The "Alive" Factor)
- [ ] **Hover States**: Does the element react when the mouse touches it?
    - *Fix*: `hover:scale-105`, `hover:bg-white/5`, or `hover:brightness-110`.
    - *Fix*: `transition-all duration-200 ease-out`.
- [ ] **Active States**: Does it feel tactile when clicked?
    - *Fix*: `active:scale-95`.
- [ ] **Focus Rings**: Are you using the default blue browser ring?
    - *Fix*: `focus:ring-2 focus:ring-offset-2 focus:ring-brand-500` (or theme equivalent).

### 3. Typography & Spacing
- [ ] **Breathing Room**: Is everything crammed together?
    - *Fix*: Increase `gap`, `padding`, and `margin`. Premium UI has whitespace.
- [ ] **Hierarchy**: Is the title the same visual weight as the body?
    - *Fix*: Use `font-bold`, `text-lg` for headers. Use `text-muted-foreground` for secondary text.
    - *Fix*: Use `tracking-tight` for large headings to make them feel modern.

### 4. Borders & Radius
- [ ] **Sharp Edges**: Are buttons square?
    - *Fix*: Use `rounded-full` for icon buttons, `rounded-lg` or `rounded-xl` for cards/modals.
- [ ] **Harsh Borders**: heavy 2px borders?
    - *Fix*: Use thin, subtle borders (`border-[0.5px]`) or rely on shadow/color difference.

## Example Transformation

**Basic (Bad):**
```tsx
<button style={{ backgroundColor: 'blue', color: 'white' }}>Save</button>
```

**Premium (Good):**
```tsx
<button className="
    px-4 py-2 rounded-lg font-medium tracking-wide
    bg-blue-600 text-white shadow-lg shadow-blue-500/30
    hover:bg-blue-500 hover:scale-[1.02] hover:shadow-blue-500/50
    active:scale-95 transition-all duration-300 ease-out
    backdrop-blur-sm border border-blue-400/20
">
    Save
</button>
```

## Critical Rule for Checks
When verifying a UI task, if you cannot confirm these traits, assume it is **BASIC** and needs another pass using this skill.
