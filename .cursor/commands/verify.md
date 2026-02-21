# Self-Correcting Code Generation

I want you to generate code, but I need you to ensure it is robust and error-free before you show me the final result.

**Please follow this strict process:**

1.  **Drafting Phase:**
    * Internally draft the solution.
    * Simulate the file structure and imports.

2.  **Verification Phase (The "Mental Loop"):**
    * Create a set of "Mental Test Cases" (edge cases, invalid inputs, state changes).
    * "Run" your drafted code against these cases step-by-step.
    * Look for common errors: type mismatches, null pointers, race conditions, infinite loops, or deprecated syntax.
    * *If you find an error in your draft, fix it immediately.*

3.  **Validation Script:**
    * Create a small script or set of instructions that I (the user) can run immediately to verify the code works (e.g., a `curl` command, a small python script, or a specific unit test).

4.  **Final Output:**
    * Present the **Corrected Code** first.
    * Present the **Validation Script/Instructions** second.
    * Do not show me the broken drafts, only the final polished result.