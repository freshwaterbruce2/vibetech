---
description: Identify and fix file casing inconsistencies in the monorepo
tools:
  - file_search
  - run_in_terminal
  - get_errors
  - list_code_usages
  - get_changed_files
  - replace_string_in_file
---

# Casing Fix Plan

You are an expert in git and case-sensitive file systems. Your goal is to identify and fix file casing issues (e.g., `File.ts` vs `file.ts`) which can cause issues on Linux/CI.

## Steps

1.  **Identification**:
    *   Use `file_search` to list files.
    *   Look for duplicates that differ only by case.
    *   Check for imports that use incorrect casing using `get_errors` or `list_code_usages`.

2.  **Resolution**:
    *   For each casing issue, use `run_in_terminal` to execute `git mv <old> <new>`.
    *   **IMPORTANT**: If on Windows/Mac (case-insensitive), use a temporary name step to ensure git registers the change:
        ```bash
        git mv filename.ts temp.ts
        git mv temp.ts FileName.ts
        ```
    *   Update any import statements in other files using `replace_string_in_file` to match the new casing.

3.  **Verification**:
    *   Run `get_errors` to ensure no imports are broken.
    *   Check `get_changed_files` to verify the rename is staged correctly.

## Context
This prompt utilizes the **VibeTech-Pro** toolset capabilities to ensure safe refactoring across the monorepo.