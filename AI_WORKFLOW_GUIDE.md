# 🤖 AI Agent Workflow Guide

This guide explains how to effectively use AI coding agents (like Antigravity, Cursor, Claude Code, or Copilot) to build this project efficiently, without hallucinations, and with maximum success.

## 🎯 The Strategy

AI agents are incredibly powerful, but they fail when given too much to do at once, or when they don't have enough context. To prevent hallucinations and mistakes:

1.  **Feed them ONE task at a time.**
2.  **Point them to the source of truth.**
3.  **Review, test, and verify before moving on.**

## 📂 The Structure

The project root contains all the rules and instructions for the agents, and the `planning/` folder contains the detailed architecture and tasks.

-   **`AGENTS.md`** (Symlinked to `.cursorrules`, `CLAUDE.md`, `GEMINI.md`): This is the master rulebook. Agents read this automatically and learn how to behave in this project (e.g., "Don't guess," "No fallback hardcoding," "Check plan files first").
-   **`planning/final/`**: Contains the complete, approved plan. Agents are instructed to refer to these files as the source of truth instead of guessing.
-   **`planning/final/06-tasks.md`**: Your roadmap. It breaks the entire project down into atomic, self-contained tasks.

## 🛠️ Step-by-Step Workflow

When you are ready to start coding, follow this loop:

### Step 1: Pick a Task
Open `planning/final/06-tasks.md` and copy the text for ONE task block (e.g., Task 0.1).

### Step 2: Prompt the Agent
Paste the task block directly into the agent's chat interface.

*Example Prompt:*
> Please complete the following task:
> GOAL: Create the monorepo root with npm workspaces
> READ: planning/final/02-folder-structure.md (just the root level)
> DO:
> 1. Create root package.json with workspaces: ["packages/*", "apps/*"]
> 2. Create root tsconfig.base.json with strict mode
> ...

**Pro-Tip (Antigravity Specific):** Use the `/goal` slash command when providing the task if it's a bit larger and you want the agent to be extra thorough and persistent until the exact criteria are met.

*Example:*
> `/goal` Complete Task 1.2: Implement Google OAuth login backend. Read `planning/final/04-api-routes.md` for the details.

### Step 3: Let the Agent Work
The agent will read the necessary files, plan its actions, write the code, and hopefully run the necessary commands (like `npm run lint`).

### Step 4: Verify and Test
Once the agent finishes:
1.  Review the code changes briefly.
2.  Run the application or tests locally to ensure it works exactly as intended.
3.  If there's an error, copy the error message and feed it back to the agent: *"I got this error when running `npm run dev`: [error message]. Please fix it."*

### Step 5: Mark Complete
Once it works perfectly, check off the box `[x]` in `planning/final/06-tasks.md` and move to the next task.

## 💡 Best Practices & Tips

*   **Never say "Build the authentication system."** Say "Complete Task 1.2." Vague prompts lead to hallucinations.
*   **Keep context fresh.** If an agent starts making mistakes or acting weird after a long session, start a *new chat session*. The `AGENTS.md` and plan files will quickly catch the new session up to speed.
*   **Enforce the rules.** If the agent breaks a rule (like adding a random dependency), scold it: *"You broke the rule in AGENTS.md. Revert that and follow the project constraints."*
*   **Use `/plan` for complex mid-task changes.** If you suddenly decide to change how a feature works while in the middle of a task, use `/plan` to make the agent stop and write down the new architecture before touching the code.
*   **Where to create files:** The agent should ONLY create project files inside the `apps/` or `packages/` directories as defined in `planning/final/02-folder-structure.md`. No code should live in the root directory (except config files).

By following this disciplined approach, you treat the AI like a Junior Developer working tickets from a sprint board. It will write excellent code, and you won't have to spend hours untangling hallucinated spaghetti logic!
