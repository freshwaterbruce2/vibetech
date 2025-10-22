---
project_name: "[Project Name]"
version: "[Version]"
status: "[Development|Production]"
tech_stack:
  - "[Tech 1]"
  - "[Tech 2]"
  - "[Tech 3]"
primary_agent: "[@agent-name]"
port: "[Default port if applicable]"
database: "[Database type/location if applicable]"
---

# [Project Name] - Claude Development Guide

**PRIMARY DIRECTIVE:** [A clear, concise, and actionable directive for Claude]

## 1. Getting Started

**Prerequisites:**

- [Tool 1] (version)
- [Tool 2] (version)

**Installation:**

```bash
# Step 1
# Step 2
```

**Running the App:**

```bash
# Start development server
```

## 2. Key Commands

- `dev`: [description]
- `build`: [description]
- `test`: [description]
- `lint`: [description]

## 3. Architecture Overview

- **Frontend:** [Brief description]
- **Backend:** [Brief description]
- **Database:** [Brief description]

## 4. File Structure (Key Paths Only)

- `src/`: Main source code
- `tests/`: Test files
- `config/`: Configuration files

## 5. Critical Rules & Patterns

- **Rule 1:** [A critical rule for Claude to follow]
- **Rule 2:** [Another critical rule]
- **Pattern 1:** [A common code pattern with a brief example]

## 6. Token Optimization Instructions for Claude

- **Be Concise:** Provide brief and direct responses.
- **Use `read_file` for context:** Before making changes, use `read_file` to understand the existing code.
- **Use `search_file_content` for discovery:** Use `search_file_content` to find relevant code snippets.
- **Limit `read_file` output:** Use the `limit` parameter with `read_file` to avoid reading large files.
- **Ask for clarification:** If the request is ambiguous, ask for clarification instead of making assumptions.
