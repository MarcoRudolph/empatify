# Unit Test Generator

1.  Analyze the currently open file.
2.  Identify all public functions and their edge cases.
3.  Generate a unit test file (using the project's existing testing framework, e.g., Jest, Pytest, Vitest).
4.  Include:
    * **Happy Path:** Tests with expected valid inputs.
    * **Edge Cases:** Tests with nulls, empty strings, boundary numbers, etc.
    * **Error Handling:** Tests that verify specific errors are thrown when appropriate.
5.  Do not mock internal logic unless necessary; prefer testing public behavior.