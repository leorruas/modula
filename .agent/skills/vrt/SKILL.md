---
name: Visual Regression Testing (VRT) Protocol
description: Manual and AI-augmented protocol to prevent unintended visual changes in UI and charts.
---

# Visual Regression Testing (VRT) Protocol

Visual regression occurs when a code change unexpectedly alters the appearance of an element. Since mathematical tests (unit tests) often miss "looks wrong" bugs (like overlapping text or tiny fonts), this protocol is mandatory for all UI and chart-related tasks.

## 1. When to Use

**MANDATORY FOR:**
- Any change to `src/features/charts/components/*.tsx`.
- Any change to global styles, themes, or icons.
- Changes to SVG geometry, filters, or gradients.
- Modifications to `SmartLayoutEngine` or `ColorService`.

## 2. The AI-User Protocol (CRITICAL)

The AI cannot "see" the live UI unless provided with screenshots. Therefore, the following flow is mandatory:

### Step A: Identify Risk
If a task involves visual elements, the AI MUST explicitly mention VRT in the `implementation_plan.md`.

### Step B: The Screenshot Request
The AI MUST proactively ask the user to provide screenshots. 
**Phrase with:** *"Para garantir que não houve regressão visual, por favor, capture e faça o upload de um screenshot do componente no estado atual (antes/depois)."*

### Step C: Visual Analysis
Once the user uploads an image, the AI uses its vision capabilities to:
1. Check for **Clipping/Cropping**: Are numbers or labels cut off?
2. Check for **Overlapping**: Are elements colliding?
3. Check for **Balance**: Are margins symmetric?
4. Check for **Export Fidelity**: Does it look "editorial" and premium?

## 3. Combinations with Other Skills

- **Combination with `testing`**: VRT complements unit tests. While unit tests check if `marginLeft` is 120, VRT checks if 120 "looks good".
- **Combination with `geometric_constraints`**: Constraints provide the "math"; VRT provides the "eyes".
- **Combination with `system_architecture`**: Ensures the "Editorial Excellence" rule is maintained across all screenshots.

## 4. Integration in Workflow

### Planning Phase
- Add a dedicated "Visual Verification" section to your plan.
- List specific scenarios to screenshot (e.g., "Classic mode with 3 series").

### Verification Phase (in `walkthrough.md`)
- Use the carousel or embedded image syntax to show the "Proof of Work".
- **Mandatory format:**
    ```markdown
    ### Visual Verification
    ![Original](/path/to/old_screenshot.png)
    *Legend: Current state before changes*
    
    ![New](/path/to/new_screenshot.png)
    *Legend: Final result showing fixed margins*
    ```

## 5. Visual "Red Flags" Checklist

When analyzing screenshots, look for:
- Text touching the edges of the container.
- Labels that wrap into unreadable vertical columns.
- Legends that overlap with axis titles.
- Inconsistent font sizes between similar charts on the same page.
- "Jaggies" or blurry SVG filters.
