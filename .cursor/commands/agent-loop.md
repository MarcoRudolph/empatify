# Agentic Verification Loop

I want you to act as an autonomous developer.

1.  **Write:** Generate the code for the requested feature and save it to the file.
2.  **Verify:** Immediately create and run a test script (or build command) in the terminal to verify the code works.
3.  **Loop:**
    * If the terminal returns an error, read the error log, fix the code, and run the test again.
    * Repeat this process up to 3 times or until the test passes.
4.  **Completion:** Only tag me when the code runs successfully without errors.