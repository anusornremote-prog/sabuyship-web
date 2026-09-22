# AI Collaboration Workflow

This directory is the shared memory for every AI or developer working on Sabuyship.

## Start of Work

1. Read the repository `AGENTS.md`.
2. Read `HANDOFF.md`, `DECISIONS.md`, and `TASKS.md`.
3. Run `git status --short --branch` and `git log --oneline -5`.
4. Claim one task in `TASKS.md` and work on a dedicated branch.
5. If work happens concurrently, use a separate `git worktree` per agent.

## During Work

- Do not modify files owned by another active task without coordination.
- Keep secrets outside Git and outside handoff documents.
- Record architecture or infrastructure decisions in `DECISIONS.md`.
- Use focused commits that can be reviewed or reverted independently.

## End of Work

1. Run relevant tests, TypeScript checks, and the production build.
2. Update `HANDOFF.md` with exact results and unresolved risks.
3. Update task ownership and status in `TASKS.md`.
4. Commit the checkpoint and share the branch and commit hash.
5. Let one integration owner review, merge, and deploy.

## Handoff Prompt

Give a new AI this instruction:

> Read `AGENTS.md` and every file in `docs/ai/` before making changes. Run `git status` first, use a dedicated branch, stay within the assigned task, run the required tests, and update `docs/ai/HANDOFF.md` before committing.
