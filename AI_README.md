# Cursor AI System — Superclaude-Style Modular Setup

This document explains the structure and purpose of your custom Cursor AI configuration.  
The setup mirrors a **Superclaude-style multi-layer architecture**, providing:

- **Context-aware understanding** of your project  
- **UI inspiration & "Magic" component ideas**  
- **Multi-step reasoning & planning**  
- **Token-driven visual design**  
- **Clean React/Next.js architecture**  
- **High-quality, production-ready code**  
- **Layout-first workflow for UI**  

All behavior is controlled through modular `.mdc` files.

---

# 1. Directory Overview

Your `.cursor` folder structure:

.cursor/
prompt.json
tokens.json

rules/
core.mdc
architecture.mdc
design.mdc
design.checklist.mdc
workflow.mdc
perplexity-tool.mdc


Each file represents a “brain” in your multi-agent AI system.

---

# 2. Rule Files & Their Responsibilities

## 2.1 `core.mdc` — Root Personality & Global Reasoning

Defines the assistant’s **identity**, **reasoning**, and **rule hierarchy**:

- Acts as a senior product engineer + UI/UX designer  
- Sets rule precedence  
- Defines how to use tools  
- Controls chain-of-thought (internal reasoning)  
- Establishes communication and clarification rules  
- Handles safety constraints  

This is the **root behavior layer**.

---

## 2.2 `architecture.mdc` — Engineering, Folder Structure, Patterns

Defines the project's **technical architecture**:

- React / Next.js structure with TS (strict mode)  
- Clear folder organization (`src/components/ui`, `src/features`, etc.)  
- Path aliases (`@components`, `@lib`, `@services`)  
- Zod validation + derived types  
- Drizzle ORM usage  
- Error/Loading/Empty state requirements  
- Accessibility and security rules  
- Testing strategy  
- Performance considerations  

This file embodies your **principal engineer brain**.

---

## 2.3 `design.mdc` — Design System, Tokens & UI Patterns

Defines **how UI should look and feel**:

- Uses `tokens.json` for:
  - Colors
  - Typography
  - Spacing
  - Radius
  - Shadows
  - Component tokens  
- Enforces shadcn/ui usage  
- Avoids plain HTML or unstyled layouts  
- Defines common sections:
  - Hero
  - Features
  - Testimonials
  - Pricing
  - FAQ  
- Ensures hierarchy, spacing, and visual rhythm  
- Guarantees focus states (never removed)  
- Enforces visual accessibility  

This is your **Design Director brain**.

---

## 2.4 `design.checklist.mdc` — UI Quality Control

A strict UI checklist that must be followed for all UI code:

- Research → Sketch → Implementation → Review  
- Enforce typography rules  
- Enforce token usage  
- Enforce spacing and alignment  
- Ensure hover/focus/active/disabled states  
- Accessibility validation  
- Anti-pattern detection  
- Component-specific layout checks  
- Automatically fix violations  

This is your **QC layer**, similar to Superclaude's self-review system.

---

## 2.5 `workflow.mdc` — Task Flow & Tool Orchestration

Defines **how** the assistant executes tasks:

- Classifies tasks:
  - UI / design
  - Architecture / backend
  - Mixed
  - Context analysis  
- Standard workflow:
  1. Understand  
  2. Gather context  
  3. Research  
  4. Plan  
  5. Implement  
  6. Review  
- UI-specific workflow:
  - Perform research (internal + external)
  - Create text-based layout sketch
  - Implement with shadcn/ui + tokens
  - Review using checklist  
- Architecture workflow  
- Context-extraction workflow  
- Tool fallback rules  

This is your **process brain**.

---

## 2.6 `perplexity-tool.mdc` — External Research Rules

Controls how the `perplexity_ask` MCP is used:

- When research is allowed  
- When it is required  
- How to extract patterns  
- How to avoid copy-pasting  
- Ensures research cannot override:
  - `core.mdc`
  - `architecture.mdc`
  - `design.mdc`
  - `workflow.mdc`
  - `tokens.json`  

This file is your **research brain**.

---

## 2.7 `tokens.json` — Full Design Token System

Defines the visual language:

- Color tokens  
- Spacing scale  
- Radius scale  
- Shadow system  
- Typography scale  
- Layout tokens  
- Component-level tokens  
- Utility tokens for cards/buttons/overlines  

All styling **must** be expressed through tokens.

---

# 3. MCP Servers & Their Roles

Your system integrates **four key MCP servers**:

## 3.1 `perplexity_ask`
External research engine:

- UI inspiration  
- Technical documentation  
- Pattern extraction  
- Competitive analysis  

Used heavily in:
- `workflow.mdc`  
- `perplexity-tool.mdc`

---

## 3.2 `magic-ui`
UI inspiration / “Magic UI” component generator:

- Bento grids  
- Hero structures  
- 3D-style sections  
- Docked navbars  
- Card patterns  
- Interactive UI concepts  

Always adapted to:
- shadcn/ui  
- Tailwind  
- `tokens.json`  

---

## 3.3 `perplexity-ask`
Multi-step reasoning engine:

- Deep planning  
- Complex migrations  
- Architecture refactors  
- Step-by-step problem-solving  

Used in architecture & complex UI logic.

---

## 3.4 `@context7`
Codebase-aware analyzer:

- Extracts patterns  
- Understands folder structure  
- Summarizes functions/components  
- Traces data flow  
- Helps replicate existing conventions  

This is your **Context7 equivalent**.

---

# 4. How Cursor Behaves with This System

Your assistant becomes a **multi-agent system**, where each `.mdc` file is one “brain”:

| Brain | File |
|-------|------|
| Root identity | `core.mdc` |
| Engineering | `architecture.mdc` |
| Design system | `design.mdc` |
| UI QC | `design.checklist.mdc` |
| Workflow engine | `workflow.mdc` |
| Research rules | `perplexity-tool.mdc` |
| Visual language | `tokens.json` |

The result:  
A deterministic, high-quality generative system like **Superclaude**.

---

# 5. Philosophy of the System

The system is built on these principles:

- **Modular brains** instead of one giant prompt  
- **Separation of concerns** → each `.mdc` has a single purpose  
- **Deterministic UI** → styles must come from tokens  
- **Layout-first UI design** → always sketch before coding  
- **Tool-assisted creativity**  
- **Architecture discipline**  
- **Safe operations** → no git/deletes without explicit instructions  

---

# 6. Extending the System

You can add more rule modules, such as:

- `content.mdc` → tone & copywriting  
- `api.mdc` → REST/RPC conventions  
- `testing.mdc` → test architecture  
- `migration.mdc` → refactor strategies  

Cursor immediately incorporates them.

---

# 7. Updating the System

You can evolve the system by:

1. Editing `.mdc` behavior files  
2. Updating `tokens.json`  
3. Adding/removing MCP servers

Cursor will adapt automatically.

---

# 8. Summary

This `.cursor` configuration creates a **Superclaude-inspired, modular, production-grade AI system** inside Cursor, with:

- Strong design consistency  
- Clean architecture rules  
- Multistep reasoning  
- Context awareness  
- High-quality UI & code output  
- Deterministic token-driven styling  

This enables Cursor to behave as a **senior engineer and design partner**, not a generic code generator.
