# AI Governance & Workflow System

This folder contains the complete AI-assisted development governance system for the Tesseract Hub monorepo.

## Overview

This system orchestrates three AI agents in a repeatable quality loop:

| Agent | Role | Primary Responsibility |
|-------|------|----------------------|
| **Codex** | Architect/Reviewer | Code review, task generation, severity assessment |
| **Claude Code** | Developer/Implementor | Task implementation, code fixes, test writing |
| **Gemini CLI** | QA/Test Lead | Test execution, validation, bug reporting |

## The Loop

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐     │
│  │  Codex   │───►│  Claude  │───►│  Gemini  │───►│  Pass?   │     │
│  │  Review  │    │   Fix    │    │    QA    │    │          │     │
│  └──────────┘    └──────────┘    └──────────┘    └────┬─────┘     │
│       ▲                                               │           │
│       │                    NO                         │           │
│       └───────────────────────────────────────────────┘           │
│                                                       │           │
│                                              YES      ▼           │
│                                            ┌──────────────┐       │
│                                            │    MERGE     │       │
│                                            └──────────────┘       │
└─────────────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Start a New Run

```bash
# Create a new run directory
RUN_ID=$(date +%Y%m%d-%H%M%S)
mkdir -p ai-runs/$RUN_ID

# Copy templates
cp ai/templates/inputs.template.md ai-runs/$RUN_ID/inputs.md
cp ai/templates/review.template.md ai-runs/$RUN_ID/review.md
cp ai/templates/tasks.template.json ai-runs/$RUN_ID/tasks.json
```

### 2. Fill in Inputs

Edit `ai-runs/$RUN_ID/inputs.md` with:
- PR/ticket reference
- Scope of changes
- Known risks
- Affected services

### 3. Run Codex Review

```bash
# In Codex, run:
# "Review the code changes described in ai-runs/<run-id>/inputs.md using the prompt in ai/prompts/codex-techlead-review.prompt.md"
```

### 4. Run Claude Implementation

```bash
# In Claude Code, run:
# "Implement the tasks in ai-runs/<run-id>/tasks.json using the prompt in ai/prompts/claude-developer-fix.prompt.md"
```

### 5. Run Gemini QA

```bash
# In Gemini CLI, run:
# "Execute QA for ai-runs/<run-id>/ using the prompt in ai/prompts/gemini-qa-tester.prompt.md"
```

### 6. Loop Until Pass

Repeat steps 3-5 until all tests pass and no P0/P1 issues remain.

## Directory Structure

```
ai/
├── README.md                    # This file
├── policies.md                  # Strict development policies
├── review-checklist.md          # Code review checklist
├── repo-map.md                  # Repository service mapping
├── workflows/
│   ├── end-to-end-loop.md       # Complete workflow documentation
│   ├── codex-review.md          # Codex review process
│   ├── claude-implement.md      # Claude implementation process
│   ├── gemini-qa.md             # Gemini QA process
│   └── definition-of-done.md    # Merge criteria
├── prompts/
│   ├── codex-techlead-review.prompt.md
│   ├── claude-developer-fix.prompt.md
│   └── gemini-qa-tester.prompt.md
├── templates/
│   ├── inputs.template.md
│   ├── review.template.md
│   ├── tasks.template.json
│   ├── implementation-notes.template.md
│   ├── traceability.template.md
│   ├── test-plan.template.md
│   ├── test-results.template.md
│   └── bug-report.template.md
└── output-spec/
    ├── tasks.schema.md
    └── severity-rules.md
```

## Output Location

All run outputs go to:

```
ai-runs/
└── <run-id>/
    ├── inputs.md                # Initial context
    ├── review.md                # Codex review output
    ├── tasks.json               # Task list (updated by each agent)
    ├── implementation-notes.md  # Claude's implementation log
    ├── traceability.md          # Code change traceability
    ├── test-plan.md             # Gemini's test plan
    ├── test-results.md          # Test execution results
    └── bug-reports/             # Bug reports from QA
        └── BUG-001.md
```

## Key Documents

| Document | Purpose |
|----------|---------|
| `policies.md` | Non-negotiable rules (tenant isolation, auth, idempotency) |
| `review-checklist.md` | Comprehensive review criteria |
| `definition-of-done.md` | Hard merge gates |
| `severity-rules.md` | P0-P3 classification |

## GitHub Issue Integration

Issues discovered during AI governance workflows are automatically logged to GitHub Issues for tracking.

### Creating Issues from Tasks

```bash
# Create issues from a completed AI run
./scripts/ai_create_issues.sh <run-id>

# Dry run to preview what would be created
./scripts/ai_create_issues.sh <run-id> --dry-run
```

### Creating Issues from Test Failures

```bash
# From Playwright E2E test results
./scripts/ai_create_test_issues.sh test-results/critical-paths/results.json

# From Go test results
./scripts/ai_create_test_issues.sh test-results/go-test-results.json
```

### Quick Issue Logging

```bash
# Log an issue quickly from command line
./scripts/ai_log_issue.sh --title "Cross-tenant data leak" --type bug --severity P0 --component tenant

# Interactive mode
./scripts/ai_log_issue.sh --interactive
```

### Automatic Issue Creation

Test failures in CI/CD automatically create GitHub issues via the `create-test-issues.yml` workflow.

### Issue Labels

Issues are automatically labeled based on:
- **Type**: `bug`, `enhancement`, `fix`, `testing`, `documentation`
- **Severity**: `priority: critical`, `priority: high`, `priority: medium`, `priority: low`
- **Component**: `tenant-isolation`, `authentication`, `rbac`, `checkout`, etc.
- **Source**: `ai-governance`, `test-failure`, `automated`

### Viewing Issues

```bash
# View all AI governance issues
gh issue list --label ai-governance

# View test failures
gh issue list --label test-failure

# View critical issues
gh issue list --label "priority: critical"
```

## Service Reference

This system is configured for the Tesseract Hub multi-tenant ecommerce platform:

- **Backend**: 34 Go microservices (Gin, GORM, NATS)
- **Frontend**: Next.js admin, storefront, React Native mobile
- **Database**: PostgreSQL with tenant isolation
- **Auth**: Keycloak (OIDC/OAuth2) via auth-bff
- **Infrastructure**: GKE with Istio service mesh

See `repo-map.md` for complete service inventory.

## Test Coverage

The AI governance system includes comprehensive test coverage for critical paths:

### PR Gate Tests (Must Pass Before Merge)
- **Tenant Isolation** (`TI-*`): Cross-tenant data access prevention
- **Authentication** (`AUTH-*`): Keycloak JWT validation, session management
- **Checkout Idempotency** (`IDEM-*`): Order/payment double-submit prevention
- **RBAC Permissions** (`RBAC-*`): Role-based access control enforcement

### Extended Tests (Must Pass Before Release)
- **Three App Journey** (`ONB-*/ADM-*/SF-*`): Onboarding → Admin → Storefront flow
- **Store Types** (`ST-*`): ONLINE_STORE vs MARKETPLACE functionality
- **Regional Config** (`REG-*`): Timezone, currency, locale support
- **Basic Functionality** (`PROD-*/ORD-*/CUST-*/STAFF-*`): CRUD operations

### Running Tests

```bash
# Run PR Gate tests
cd tests/e2e/critical-paths
npx playwright test --project="PR Gate"

# Run Extended tests
npx playwright test --project="Extended"

# Run Go unit tests
go test ./packages/go-shared/testutil/...
```
