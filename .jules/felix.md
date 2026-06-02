## 2026-05-28 - Clean Commits require cleaning up scratchpad files
**Learning:** If temporary scripts (e.g., `patch_something.js`, `test_api.ts`) are created to assist with file modifications or testing during the workflow, they must be explicitly removed before requesting code review or submitting the final code. Otherwise, the repository is polluted, which violates the clean commit instruction.
**Action:** Always add a dedicated cleanup step or run `rm` on any scratchpad files created during execution before invoking `request_code_review` or submitting a PR.
