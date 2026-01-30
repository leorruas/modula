# Modula Architecture 🏗️

This document describes the high-level architecture of the Modula project, a chart rendering and layout engine.

## 1. System Overview

Modula is built on **Next.js** and is designed to create highly customizable, geometrically precise chart layouts. The core philosophy is **"Smart Layout"**, where the system automatically calculates optimal positions and dimensions to prevent clipping and ensure visual harmony.

### Core Components

- **Smart Layout Engine** (`src/services/smartLayout`): The brain of the application. It receives chart configuration and data, and outputs precise geometric coordinates. It uses a constraint-based approach to ensure labels, axes, and legends coexist without overlap. **Radial Intelligence**: Implements advanced Y-sorting and relaxation algorithms to manage high-density circular layouts.
- **Chart Components** (`src/features/charts`): React components that render specific chart types (Bar, Line, Pie, etc.). They consume the output of the Layout Engine.
- **Editor** (`src/features/editor`): The user interface for manipulating data and chart properties.

## 2. Directory Structure

```
src/
├── features/           # Feature-Sliced Design modules
│   ├── charts/         # Chart implementations
│   ├── editor/         # Editor UI and logic
│   └── ...
├── services/           # Core business logic (Layout Engine, etc.)
├── utils/              # Shared utilities (Formatting, Colors)
├── hooks/              # Shared React hooks
├── types/              # TypeScript definitions
└── app/                # Next.js App Router
```

## 3. Key Technologies

- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **State Management**: React Context / Hooks

## 4. Design Principles

1.  **Geometric Correctness**: Layouts must be mathematically verified. Clipping is considered a bug.
2.  **Visual Excellence**: Default styles should look premium and "ready for publication".
3.  **Atomic Components**: Charts are composed of smaller atoms (Axis, Grid, Legend) to share logic.
