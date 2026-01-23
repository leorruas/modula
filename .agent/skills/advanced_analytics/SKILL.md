---
description: Guidelines for transforming raw data into "Editorial Intelligence" via smart visualization and statistical context.
---

# Advanced Analytics Skill

This skill defines the "Brain" behind the beauty. It focuses on **Editorial Intelligence**—the art of knowing *what* to show, not just *how* to show it. It prevents "Data Dumping" and ensures every chart tells a clear story.

## 1. Editorial Intelligence Rules

### The "Crowd Control" Rule
**Problem**: Too many data points make the chart unreadable (e.g., 50 bars with overlapping labels).
**Solution**:
- If `points > 20`:
    - **Hide Labels**: Show labels only for every 5th item OR only for Min/Max values.
    - **Simplify Tooltips**: Ensure tooltips are fast and don't block the view.
- If `categories > 10` (Pie/Donut):
    - **Group Others**: Automatically group smallest values into an "Outros" slice if they sum to < 10%.

### The "Context is King" Rule
Data without context is just noise.
- **Trend Lines**: For time-series (Line/Area), offer a Linear or Exponential trend line.
- **Benchmarks**: Allow adding a static "Reference Line" (e.g., "Meta: R$ 50k") that cuts across the chart.
- **Delta Indicators**: When comparing two values (e.g., "This Month" vs "Last Month"), automatically show the % change (+15% 🟢).

### The "Universal Number" Rule (Semantic Formatting)
Never show raw math.
- **Smart Scaling**: Detect large values. Scale to `k`, `M`, `B` automatically based on the highest value in the series.
- **Contextual Precision**: Drop cents for large amounts; show 1 decimal for percentages only if the variance is small (<1%).
- **Unit Extraction**: If >80% of labels share a symbol ($, %), move it to the axis title to reduce noise.

### The "Logical Rank" Rule (Smart Sorting)
- **Auto-Sort**: For non-temporal categorical charts (Bar/Column), default to `DESC` (ranking) unless the user overrides.
- **Time Protection**: Never sort temporal data (Dates/Mês) by value. Always maintain chronological order.

## 2. Data Pipeline Standards

### Pre-Processing
Never feed raw API data directly into a chart library if it's messy.
1.  **Sorting**: Always sort Categorical charts (Bar/Column) by Value (Desc) unless the category is Ordinal (e.g., Months, Days).
2.  **Date Normalization**: Ensure all dates are parsed to a standard ISO format before rendering.
3.  **Null Handling**:
    - **Line**: Break the line (gaps) or interpolate (dashed line)? *Default: Break.*
    - **Bar**: Show as 0 or empty space? *Default: Empty space.*

## 3. Visual Statistics (Overlays)

Implementation of statistical visual aids must allow them to be "Editorial" (clean, text-based) rather than "Scientific" (cluttered).

### Automatic Highlights
- **Peak/Valley**: Automatically detect the highest and lowest points in a series.
    - *Visual*: Add a specific marker (circle) and a bold label to these points.
- **Outliers**: If a value is > 2x standard deviation, flag it.
    - *Visual*: Use a distinct color or pattern.

## 4. Implementation Checklist

- [ ] **Data Check**: Are there too many points? -> Apply Crowd Control.
- [ ] **Context Check**: Is there a comparison? -> Add Delta Indicator.
- [ ] **Story Check**: Is the most important data point highlighted? -> Use Peak/Valley.
- [ ] **Crash Check**: Does the dataset contain `null`, `undefined` or `NaN`? -> Apply Null Handling.
