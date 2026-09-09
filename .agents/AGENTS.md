<!-- BEGIN:auto-commit-rule -->
# Auto-Commit Code Changes
Every time you finish making code changes or implementing a feature, you MUST run `git add .`, `git commit -m "..."`, and `git push` to GitHub immediately, without waiting for the user to instruct you to do so.
<!-- END:auto-commit-rule -->

<!-- BEGIN:direct-execution-rule -->
# Direct Execution Mode (No Blocking Confirmations)
- Do NOT pause or block to ask for approval on implementation plans or trivial decisions.
- Do NOT set RequestFeedback to true on artifacts unless the user explicitly requests an approval step.
- Do NOT use ask_question tool for routine preferences.
- When the user gives a request or feature, execute it directly from start to finish, verify with build, auto-commit, and report the result.
<!-- END:direct-execution-rule -->
