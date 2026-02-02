---
description: Comprehensive planning workflow that mandates the use of analysis, testing, and spatial reasoning skills.
---

# Comprehensive Planning Workflow

This workflow is triggered when you need to create a plan for a complex task. It enforces the use of specific agentic skills to ensure robustness, testability, and layout integrity.

1. **Initial Requirement Analysis**
   - Read the user's request and identify the scope of work.

2. **Mandatory Skill Review**
   - You **MUST** read the following skill files using `view_file` to prime your context with the necessary methodologies:
     - **Plan Analysis**: `/Users/leoruas/Desktop/modula/.agent/skills/plan_analysis/SKILL.md`
     - **Task Breakdown**: `/Users/leoruas/Desktop/modula/.agent/skills/task_breakdown/SKILL.md`
     - **Comprehensive Testing**: `/Users/leoruas/Desktop/modula/.agent/skills/testing/SKILL.md`
     - **Visual Spatial Reasoning**: `/Users/leoruas/Desktop/modula/.agent/skills/visual_spatial_reasoning/SKILL.md`
     - **Geometric Constraints**: `/Users/leoruas/Desktop/modula/.agent/skills/geometric_constraints/SKILL.md`
     - **Layout Stress Testing**: `/Users/leoruas/Desktop/modula/.agent/skills/layout_stress_testing/SKILL.md`
     - **Visual Regression Testing (VRT)**: `/Users/leoruas/Desktop/modula/.agent/skills/vrt/SKILL.md`

3. **Develop Implementation Plan**
   - Create or update the `implementation_plan.md` artifact.
   - **Task Breakdown**: Structure your plan into clear, atomic phases as defined in the Task Breakdown skill.
   - **Testing Strategy**: Explicitly define how each phase will be tested, following the Comprehensive Testing Protocol, Layout Stress Testing, and VRT Protocol.
   - **Spatial & Geometric Checks**: For any UI/Layout work, explicitly document how you will verify layout invariants and prevent collisions/clipping, citing the Spatial Reasoning and Geometric Constraints skills.

4. **Plan Analysis & Refinement**
   - Before presenting the plan to the user, apply the **Plan Analysis** methodology to your own draft.
   - Check for:
     - Missing dependencies between phases.
     - Contradictions in the verification steps.
     - Potential visual regressions.
   - Refine the plan accordingly.

5. **User Review**
   - Present the plan to the user using `notify_user` and await approval.
