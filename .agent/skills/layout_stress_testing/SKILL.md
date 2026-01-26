---
name: Layout Stress Testing Protocol
description: Methodology for ensuring layout robustness by testing against "worst-case" data and container scenarios.
---

# Layout Stress Testing Protocol

A layout that looks good with "dummy data" often breaks in production with "unruly data". This skill defines the mandatory protocol for stress-testing UI components (especially charts) to ensure they never clip, overlap, or crash.

## 1. The "Worst-Case" Scenarios

When developing or verifying, you MUST test with the following extremes:

### A. The "Wall of Text" (String Extremes)
- **Longest Possible Label**: Use a string with 200+ characters or many words.
- **Word with No Spaces**: Use a single word of 50+ characters (to test overflow/truncation).
- **Narrow Strings**: High count of narrow characters (e.g., "iiiiiiiiii") vs. wide ones (e.g., "WWWWWWWWWW").

### B. The "Millionaire" (Numeric Extremes)
- **Large Magnitude**: Values in the millions or billions (e.g., `1,250,500.00`).
- **High Precision**: Values with many decimal places (e.g., `0.000000123`).
- **Signs and Symbols**: Extreme negatives or values with complex currency symbols.

### C. The "Squash" (Geometric Extremes)
- **Ultra-Narrow Container**: Height is normal, but Width is < 300px.
- **Ultra-Short Container**: Width is normal, but Height is < 200px.
- **Extreme Aspect Ratios**: Super wide (10:1) or super tall (1:10).

## 2. When to Use

**MANDATORY FOR:**
- Final verification of any layout engine change.
- Bug fixes related to "cropping", "clipping", or "squashing".
- New component development.

## 3. Combinations with Other Skills

- **Combination with `vrt`**: Use Stress Testing to *create* the screenshots for VRT. Don't just screenshot the happy path; screenshot the "Wall of Text".
- **Combination with `geometric_constraints`**: Identifies where constraints are too weak or missing.
- **Combination with `testing`**: Add "Stress Cases" to your `*.test.ts`. 
    ```typescript
    it('should handle extreme numbers without overlap', () => {
      const layout = engine.compute({ maxValue: 999999999999 });
      // Verify margins adapted
    });
    ```

## 4. Workflow Integration

### Planning Phase
- List the "Stress Scenarios" in the `implementation_plan.md` under the Verification section.
- Define what constitutes a "success" (e.g., "The charts should wrap, never clip").

### Verification Phase
- Document the results of the stress tests in `walkthrough.md`.
- **Proactive AI Step**: The AI should say: *"Vou agora testar este layout com valores extremos (stress test) para garantir que ele não quebre em situações reais."*

## 5. Stress Testing "Red Flags"

- **Ellipses appearing too early**: Truncation should be the LAST resort after wrapping and scaling.
- **Zero-width zones**: If the plot area disappears entirely under stress, the engine needs a `LEGIBILITY_FLOOR`.
- **Font size decreasing below 8px**: Use Level of Detail (LOD) strategies instead of making text unreadable.
