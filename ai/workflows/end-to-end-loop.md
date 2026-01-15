# End-to-End AI Workflow Loop

This document describes the complete Review → Fix → QA → Loop workflow.

---

## Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AI DEVELOPMENT LOOP                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐              │
│  │  INPUT  │────►│  CODEX  │────►│ CLAUDE  │────►│ GEMINI  │              │
│  │ (Human) │     │ Review  │     │  Fix    │     │   QA    │              │
│  └─────────┘     └────┬────┘     └────┬────┘     └────┬────┘              │
│                       │               │               │                    │
│                       ▼               ▼               ▼                    │
│                  review.md    implementation   test-results.md            │
│                  tasks.json     -notes.md      bug-report.md              │
│                                traceability.md                            │
│                                                                           │
│                       │                              │                     │
│                       │                              ▼                     │
│                       │                       ┌───────────┐               │
│                       │                       │  PASS?    │               │
│                       │                       └─────┬─────┘               │
│                       │                             │                     │
│                       │              NO             │           YES       │
│                       ◄─────────────────────────────┤                     │
│                                                     │                     │
│                                                     ▼                     │
│                                              ┌───────────┐               │
│                                              │   MERGE   │               │
│                                              └───────────┘               │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Run ID Convention

Every workflow execution gets a unique Run ID:

```
Format: YYYYMMDD-HHMMSS[-description]

Examples:
- 20250115-143022
- 20250115-143022-auth-fix
- 20250115-143022-PR-456
```

---

## Output Folder Convention

All run outputs go to:

```
ai-runs/
└── <run-id>/
    ├── inputs.md                    # Step 0: Human input
    ├── review.md                    # Step 1: Codex output
    ├── tasks.json                   # Step 1: Task list (updated throughout)
    ├── implementation-notes.md      # Step 2: Claude output
    ├── traceability.md              # Step 2: Code change map
    ├── test-plan.md                 # Step 3: Gemini test plan
    ├── test-results.md              # Step 3: Gemini results
    └── bug-reports/                 # Step 3: Bug reports
        ├── BUG-001.md
        ├── BUG-002.md
        └── ...
```

---

## Workflow Steps

### Step 0: Initialize Run (Human)

**Actor**: Human developer

**Actions**:
1. Create run directory
2. Fill in inputs.md with:
   - PR/ticket reference
   - Code changes scope
   - Known risks
   - Affected services

**Commands**:
```bash
# Create new run
RUN_ID=$(date +%Y%m%d-%H%M%S)
mkdir -p ai-runs/$RUN_ID

# Copy templates
cp ai/templates/inputs.template.md ai-runs/$RUN_ID/inputs.md
cp ai/templates/review.template.md ai-runs/$RUN_ID/review.md
cp ai/templates/tasks.template.json ai-runs/$RUN_ID/tasks.json
cp ai/templates/implementation-notes.template.md ai-runs/$RUN_ID/implementation-notes.md
cp ai/templates/traceability.template.md ai-runs/$RUN_ID/traceability.md
cp ai/templates/test-plan.template.md ai-runs/$RUN_ID/test-plan.md
cp ai/templates/test-results.template.md ai-runs/$RUN_ID/test-results.md

# Edit inputs
vi ai-runs/$RUN_ID/inputs.md
```

**Output**: `inputs.md` (filled)

**Gate**: Proceed when inputs.md is complete

---

### Step 1: Codex Review

**Actor**: Codex (Architect/Reviewer)

**Inputs**:
- `inputs.md`
- Source code (via repository access)
- `ai/policies.md`
- `ai/review-checklist.md`

**Actions**:
1. Read inputs.md to understand scope
2. Review affected code files
3. Check against policies.md
4. Apply review-checklist.md
5. Generate findings
6. Create tasks for each finding
7. Assign severity per severity-rules.md

**Outputs**:
- `review.md` - Detailed findings
- `tasks.json` - Actionable task list

**Commands**:
```
# In Codex:
"Review the code changes described in ai-runs/<run-id>/inputs.md.
Use ai/prompts/codex-techlead-review.prompt.md for instructions.
Output review to ai-runs/<run-id>/review.md
Output tasks to ai-runs/<run-id>/tasks.json"
```

**Gate**:
- STOP if review cannot be completed
- PROCEED to Step 2 if tasks generated

---

### Step 2: Claude Implementation

**Actor**: Claude Code (Developer)

**Inputs**:
- `tasks.json`
- `review.md` (for context)
- Source code (for modifications)
- `ai/policies.md`

**Actions**:
1. Read tasks.json
2. For each task (in priority order):
   a. Understand the requirement
   b. Locate affected files
   c. Implement fix/change
   d. Write tests
   e. Update traceability.md
   f. Mark task as completed
3. Update implementation-notes.md

**Outputs**:
- Code changes (committed or staged)
- `implementation-notes.md` - What was done
- `traceability.md` - Code change mapping
- Updated `tasks.json` (status changes)

**Commands**:
```
# In Claude Code:
"Implement the tasks in ai-runs/<run-id>/tasks.json.
Use ai/prompts/claude-developer-fix.prompt.md for instructions.
Update ai-runs/<run-id>/implementation-notes.md
Update ai-runs/<run-id>/traceability.md
Mark completed tasks in ai-runs/<run-id>/tasks.json"
```

**Gate**:
- STOP and ESCALATE if task is unclear or conflicts with policies
- PROCEED to Step 3 when all tasks attempted

---

### Step 3: Gemini QA

**Actor**: Gemini CLI (QA Lead)

**Inputs**:
- `tasks.json` (to know what was fixed)
- `implementation-notes.md` (to know what changed)
- `traceability.md` (to know which files changed)
- Code changes

**Actions**:
1. Generate test-plan.md based on changes
2. Execute tests:
   - Unit tests
   - Integration tests
   - Tenant isolation tests
   - Auth tests
   - Checkout idempotency tests
3. Record results in test-results.md
4. For any failures:
   - Create bug report
   - Add new task to tasks.json

**Outputs**:
- `test-plan.md` - Test coverage plan
- `test-results.md` - Pass/fail results
- `bug-reports/BUG-XXX.md` - Bug details
- Updated `tasks.json` (new bugs as tasks)

**Commands**:
```
# In Gemini CLI:
"Execute QA for ai-runs/<run-id>/.
Use ai/prompts/gemini-qa-tester.prompt.md for instructions.
Create ai-runs/<run-id>/test-plan.md
Create ai-runs/<run-id>/test-results.md
Log bugs to ai-runs/<run-id>/bug-reports/"
```

**Gate**:
- If ALL PASS and no P0/P1 → PROCEED to MERGE
- If ANY FAIL → LOOP back to Step 1

---

### Step 4: Loop Decision

**Decision Logic**:

```
IF test-results.md shows ALL PASS
   AND tasks.json has no P0 or P1 tasks with status != completed
   AND bug-reports/ is empty or all bugs are P2+
THEN
   → READY FOR MERGE
ELSE
   → LOOP: Return to Step 1 (Codex reviews new findings)
```

**Loop Actions**:
1. Codex receives:
   - Previous review.md
   - Updated tasks.json (with new bugs)
   - Bug reports
2. Codex adds new findings to review.md
3. Codex updates tasks.json
4. Process continues from Step 2

---

### Step 5: Merge (Human)

**Actor**: Human developer

**Prerequisites**:
- All tests passing
- No P0/P1 tasks remaining
- Definition of Done met (see definition-of-done.md)

**Actions**:
1. Final human review
2. Squash/merge PR
3. Archive run folder

**Commands**:
```bash
# Archive completed run
mv ai-runs/<run-id> ai-runs/archive/<run-id>

# Tag completion
echo "Completed: $(date)" >> ai-runs/archive/<run-id>/COMPLETED.txt
```

---

## Loop Limits

To prevent infinite loops:

| Metric | Limit | Action at Limit |
|--------|-------|-----------------|
| Total iterations | 5 | Escalate to human |
| Same bug recurring | 3 | Escalate to human |
| Time elapsed | 4 hours | Checkpoint and pause |
| P0 not resolved | 2 iterations | Block until human review |

---

## Status Tracking

### Run Status

Track in `ai-runs/<run-id>/STATUS.txt`:

```
RUN_ID: 20250115-143022
STATUS: IN_PROGRESS | BLOCKED | COMPLETED | ESCALATED
ITERATION: 1
LAST_STEP: GEMINI_QA
LAST_UPDATE: 2025-01-15T14:45:00Z
BLOCKER: [if applicable]
```

### Task Status in tasks.json

```json
{
  "status": "pending | in_progress | completed | blocked | escalated"
}
```

---

## Quick Start Script

```bash
#!/bin/bash
# ai-new-run.sh

set -e

RUN_ID=$(date +%Y%m%d-%H%M%S)
RUN_DIR="ai-runs/$RUN_ID"

echo "Creating new AI run: $RUN_ID"

mkdir -p "$RUN_DIR"
mkdir -p "$RUN_DIR/bug-reports"

# Copy all templates
cp ai/templates/inputs.template.md "$RUN_DIR/inputs.md"
cp ai/templates/review.template.md "$RUN_DIR/review.md"
cp ai/templates/tasks.template.json "$RUN_DIR/tasks.json"
cp ai/templates/implementation-notes.template.md "$RUN_DIR/implementation-notes.md"
cp ai/templates/traceability.template.md "$RUN_DIR/traceability.md"
cp ai/templates/test-plan.template.md "$RUN_DIR/test-plan.md"
cp ai/templates/test-results.template.md "$RUN_DIR/test-results.md"

# Initialize status
cat > "$RUN_DIR/STATUS.txt" << EOF
RUN_ID: $RUN_ID
STATUS: IN_PROGRESS
ITERATION: 1
LAST_STEP: INITIALIZED
LAST_UPDATE: $(date -u +%Y-%m-%dT%H:%M:%SZ)
EOF

echo ""
echo "Run directory created: $RUN_DIR"
echo ""
echo "Next steps:"
echo "1. Edit $RUN_DIR/inputs.md with your PR/ticket details"
echo "2. Run Codex review"
echo "3. Run Claude implementation"
echo "4. Run Gemini QA"
```
