---
description: Strategies and tools for debugging the application
---

# Debugging Skill

This skill outlines effective strategies for debugging issues within the codebase.

## 1. Log Checking
- **Terminal Output**: Check the output of the running `npm run dev` command for server-side errors or build warnings.
- **Browser Console**: When dealing with frontend issues, always check the browser console for runtime errors, hydration mismatches, or network failures.

## 2. Searching the Codebase
- Use `grep_search` to locate error messages, specific variable names, or component usages.
- Use `find_by_name` to locate files if you are unsure of the path.

## 3. Component Inspection
- Verify if the component is receiving the expected props.
- Add temporary `console.log` (or `logger.log`) to trace data flow.
- Check `src/utils/logger.ts` for centralized logging usage.

## 4. Fix Philosophy
- **No Quick Fixes**: Do not apply band-aid solutions. Understand *why* it broke.
- **Root Cause**: If a value is undefined, find out why it wasn't passed, don't just add a `|| 0` check without understanding.
- **Robustness**: The fix should prevent similar issues in the future, not just silence the current error.

## 5. Holistic Diagnosis
- **Analyze Context**: Do not debug in isolation. MAPPING THE ECOSYSTEM IS CRITICAL.
- **Files to Check Strategy**:
    - **Logic/Service**: Where is the heavy lifting done? (e.g., `PDFExportService.ts`)
    - **UI/Component**: Where is the visual structure defined? (e.g., `Canvas.tsx`, `BaseChart.tsx`)
    - **Data/State**: Where does the data come from? (e.g., `editorStore.ts`, chart data objects)
    - **Utils/Helpers**: Are there shared transformation functions? (e.g., `exportUtils.ts`)
- **Trace the Flow**: Follow the data path from user action -> state update -> component render -> service execution.
- **Formulate Plan**: Write down exactly which files interact and might be contributing to the bug.

## 6. Library Specifics (Know Your Tools)
- **RTFM**: Check specific limitations of the library functions you are using.
- **Defaults**: Identify the library's default behaviors (e.g., fallback fonts or themes) when an input is missing or invalid.
- **Mappings**: Check if the library requires explicit mapping for standard properties (like converting CSS weights to internal enum values).
- **Defaults**: Identify the library's default behaviors (e.g., fallback values or themes) when an input is missing or invalid.
- **Mappings**: Check if the library requires explicit mapping for standard properties (like converting generic values to internal enum values).
- **Input Strictness**: Libraries often expect exact internal keys rather than loose standards (e.g., requiring a specific ID string instead of a generic identifier). Ensure inputs match the library's strict requirements.
- **Global Defaults**: If a library has a fragile fallback (e.g., reverting to an unwanted default on error), configure the global instance to use a safer, desired default.

## 7. Environment & Logs (Listen to the Machine)
- **Console Warnings**: Pay attention to library-specific warnings in the console, as they often flag strictness violations that don't throw hard errors.
- **Environment Parity**: Ensure the debugging environment (e.g., browser) matches the production target.
- **Version Awareness**: Distinct library versions may have breaking changes or different default behaviors; verify installed versions match documentation.
