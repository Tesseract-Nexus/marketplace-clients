# AI Governance System - 10-Day Implementation Plan

**Start Date:** _____________
**Target Sign-off:** _____________
**Owner:** _____________

---

## Executive Summary

This plan covers the completion and sign-off of the AI governance system including:
- Test infrastructure setup
- E2E test validation and fixes
- CI/CD integration
- Team enablement

**Success Criteria:** All PR Gate tests passing, CI pipeline enforcing tests, team trained on workflow.

---

## Day-by-Day Breakdown

### Day 1: Environment Setup & Validation

**Goal:** Verify all services can run and tests can execute

#### Morning (4 hours)

- [ ] **ENV-001**: Verify local development environment
  ```bash
  # Check all services can start
  docker-compose up -d
  # Or for k8s
  skaffold dev
  ```

- [ ] **ENV-002**: Create GitHub labels for issue tracking
  ```bash
  # Run this to create all required labels
  gh label create "ai-governance" --color "0052CC" --description "AI governance workflow"
  gh label create "test-failure" --color "D93F0B" --description "Automated test failure"
  gh label create "tenant-isolation" --color "B60205" --description "Tenant isolation issue"
  gh label create "authentication" --color "B60205" --description "Auth/Keycloak issue"
  gh label create "rbac" --color "D93F0B" --description "RBAC/permissions issue"
  gh label create "idempotency" --color "D93F0B" --description "Idempotency issue"
  gh label create "priority: critical" --color "B60205" --description "P0 - Critical"
  gh label create "priority: high" --color "D93F0B" --description "P1 - High"
  gh label create "priority: medium" --color "FBCA04" --description "P2 - Medium"
  gh label create "priority: low" --color "0E8A16" --description "P3 - Low"
  ```

- [ ] **ENV-003**: Verify API endpoints are accessible
  ```bash
  # Test basic connectivity
  curl http://localhost:8080/health
  curl http://localhost:3001/api/health  # Admin
  curl http://localhost:3000/api/health  # Storefront
  curl http://localhost:3002/api/health  # Onboarding
  ```

#### Afternoon (4 hours)

- [ ] **ENV-004**: Set up test Keycloak realm
  ```bash
  # Create test realm with:
  # - Test tenant: test-tenant-a, test-tenant-b
  # - Test users: admin@test.com, viewer@test.com, manager@test.com
  # - Test roles: viewer, customer_support, store_manager, store_admin, store_owner
  ```

- [ ] **ENV-005**: Create test database seed script
  ```bash
  # Create: scripts/seed_test_data.sh
  # Should create test tenants, users, products, orders
  ```

- [ ] **ENV-006**: Install E2E test dependencies
  ```bash
  cd tests/e2e/critical-paths
  npm install
  npx playwright install
  ```

**Day 1 Deliverables:**
- [ ] All services running locally
- [ ] GitHub labels created
- [ ] Test Keycloak realm configured
- [ ] Playwright installed and ready

---

### Day 2: Tenant Isolation Tests (P0)

**Goal:** All 12 tenant isolation tests passing

#### Morning (4 hours)

- [ ] **TI-RUN-001**: Run tenant isolation tests, capture baseline
  ```bash
  cd tests/e2e/critical-paths
  npx playwright test tenant-isolation.spec.ts --reporter=json > ../../test-results/ti-baseline.json
  ```

- [ ] **TI-FIX-001**: Fix TI-001 to TI-004 (API-level isolation)
  - Verify `X-Tenant-ID` header handling
  - Check tenant_id WHERE clauses in services

- [ ] **TI-FIX-002**: Create test data fixtures for tenant tests
  ```typescript
  // Ensure TENANT_A and TENANT_B have distinct test data
  ```

#### Afternoon (4 hours)

- [ ] **TI-FIX-003**: Fix TI-005 to TI-008 (cross-tenant access)
  - Verify 403/404 responses for wrong tenant
  - Check all CRUD endpoints

- [ ] **TI-FIX-004**: Fix TI-009 to TI-012 (edge cases)
  - Missing tenant header
  - Invalid tenant ID
  - Tenant switching attempts

- [ ] **TI-VERIFY**: Re-run all tenant isolation tests
  ```bash
  npx playwright test tenant-isolation.spec.ts
  ```

**Day 2 Deliverables:**
- [ ] TI-001 to TI-012: All PASSING
- [ ] Test results documented
- [ ] Any service bugs logged as GitHub issues

---

### Day 3: Authentication Tests (P0)

**Goal:** All 15 auth flow tests passing

#### Morning (4 hours)

- [ ] **AUTH-RUN-001**: Run auth tests, capture baseline
  ```bash
  npx playwright test auth-flow.spec.ts --reporter=json > ../../test-results/auth-baseline.json
  ```

- [ ] **AUTH-FIX-001**: Configure test JWT generation
  ```typescript
  // Update fixtures/test-data.ts with valid test tokens
  // Or create JWT generation helper
  ```

- [ ] **AUTH-FIX-002**: Fix AUTH-001 to AUTH-005 (basic auth flow)
  - Login page loads
  - Valid credentials accepted
  - Invalid credentials rejected

#### Afternoon (4 hours)

- [ ] **AUTH-FIX-003**: Fix AUTH-006 to AUTH-010 (token handling)
  - Expired token rejection
  - Invalid signature rejection
  - Token refresh flow

- [ ] **AUTH-FIX-004**: Fix AUTH-011 to AUTH-015 (session management)
  - Logout functionality
  - Session timeout
  - Multi-tab session handling

- [ ] **AUTH-VERIFY**: Re-run all auth tests
  ```bash
  npx playwright test auth-flow.spec.ts
  ```

**Day 3 Deliverables:**
- [ ] AUTH-001 to AUTH-015: All PASSING
- [ ] JWT generation working for tests
- [ ] Any auth bugs logged as GitHub issues

---

### Day 4: RBAC Tests (P1)

**Goal:** All 19 RBAC permission tests passing

#### Morning (4 hours)

- [ ] **RBAC-RUN-001**: Run RBAC tests, capture baseline
  ```bash
  npx playwright test rbac-permissions.spec.ts --reporter=json > ../../test-results/rbac-baseline.json
  ```

- [ ] **RBAC-FIX-001**: Create test users for each role
  ```bash
  # In Keycloak test realm:
  # viewer@test.com (priority: 10)
  # support@test.com (priority: 50)
  # manager@test.com (priority: 70)
  # admin@test.com (priority: 90)
  # owner@test.com (priority: 100)
  ```

- [ ] **RBAC-FIX-002**: Fix RBAC-001 to RBAC-007 (permission enforcement)

#### Afternoon (4 hours)

- [ ] **RBAC-FIX-003**: Fix RBAC-008 to RBAC-012 (cross-tenant RBAC)

- [ ] **RBAC-FIX-004**: Fix RBAC-013 to RBAC-019 (UI & edge cases)

- [ ] **RBAC-VERIFY**: Re-run all RBAC tests
  ```bash
  npx playwright test rbac-permissions.spec.ts
  ```

**Day 4 Deliverables:**
- [ ] RBAC-001 to RBAC-019: All PASSING
- [ ] Role hierarchy verified
- [ ] Permission matrix documented

---

### Day 5: Checkout Idempotency Tests (P1)

**Goal:** All 9 idempotency tests passing

#### Morning (4 hours)

- [ ] **IDEM-RUN-001**: Run idempotency tests, capture baseline
  ```bash
  npx playwright test checkout-idempotency.spec.ts --reporter=json > ../../test-results/idem-baseline.json
  ```

- [ ] **IDEM-FIX-001**: Verify orders-service idempotency implementation
  - Check Idempotency-Key header handling
  - Verify duplicate detection

- [ ] **IDEM-FIX-002**: Fix IDEM-001 to IDEM-005 (order creation)

#### Afternoon (4 hours)

- [ ] **IDEM-FIX-003**: Fix IDEM-006 to IDEM-007 (payment & inventory)

- [ ] **IDEM-FIX-004**: Fix IDEM-008 to IDEM-009 (UI double-submit)

- [ ] **IDEM-VERIFY**: Re-run all idempotency tests
  ```bash
  npx playwright test checkout-idempotency.spec.ts
  ```

**Day 5 Deliverables:**
- [ ] IDEM-001 to IDEM-009: All PASSING
- [ ] Idempotency key handling verified
- [ ] Concurrent request handling tested

---

### Day 6: CI/CD Integration

**Goal:** Tests running in GitHub Actions, PR gate enforced

#### Morning (4 hours)

- [ ] **CI-001**: Create main test workflow
  ```yaml
  # .github/workflows/e2e-tests.yml
  # Should run on PR to main
  ```

- [ ] **CI-002**: Configure test environment in CI
  ```yaml
  # Set up:
  # - Docker services (postgres, keycloak)
  # - Environment variables
  # - Test secrets
  ```

- [ ] **CI-003**: Add PR Gate test job
  ```yaml
  # Must pass: tenant-isolation, auth-flow, checkout-idempotency, rbac-permissions
  ```

#### Afternoon (4 hours)

- [ ] **CI-004**: Test CI pipeline with a test PR
  ```bash
  git checkout -b test/ci-validation
  # Make small change
  git push -u origin test/ci-validation
  # Create PR and verify tests run
  ```

- [ ] **CI-005**: Configure branch protection rules
  ```bash
  # In GitHub Settings > Branches > main:
  # - Require PR reviews
  # - Require status checks: "PR Gate Tests"
  # - Require branches to be up to date
  ```

- [ ] **CI-006**: Verify auto-issue creation on failure
  ```bash
  # Intentionally fail a test to verify issue is created
  ```

**Day 6 Deliverables:**
- [ ] GitHub Actions workflow running
- [ ] PR gate enforced on main branch
- [ ] Auto-issue creation working
- [ ] Test artifacts uploaded

---

### Day 7: Extended Tests (P2) - Store Types & Regional

**Goal:** Store type and regional tests passing (best effort)

#### Morning (4 hours)

- [ ] **ST-RUN-001**: Run store type tests
  ```bash
  npx playwright test store-types.spec.ts
  ```

- [ ] **ST-FIX-001**: Fix critical store type tests (ST-001 to ST-010)

- [ ] **REG-RUN-001**: Run regional tests
  ```bash
  npx playwright test region-specific.spec.ts
  ```

#### Afternoon (4 hours)

- [ ] **REG-FIX-001**: Fix critical regional tests (REG-001 to REG-010)

- [ ] **BASIC-RUN-001**: Run basic functionality tests
  ```bash
  npx playwright test basic-functionality.spec.ts
  ```

- [ ] **BASIC-FIX-001**: Fix critical CRUD tests

**Day 7 Deliverables:**
- [ ] Store type tests: >80% passing
- [ ] Regional tests: >80% passing
- [ ] Basic functionality: >80% passing
- [ ] Remaining failures logged as issues (P3)

---

### Day 8: Three App Journey & Go Tests

**Goal:** Journey tests passing, Go test helpers validated

#### Morning (4 hours)

- [ ] **JOURNEY-RUN-001**: Run three app journey tests
  ```bash
  npx playwright test three-app-journey.spec.ts
  ```

- [ ] **JOURNEY-FIX-001**: Fix onboarding tests (ONB-*)

- [ ] **JOURNEY-FIX-002**: Fix admin tests (ADM-*)

#### Afternoon (4 hours)

- [ ] **JOURNEY-FIX-003**: Fix storefront tests (SF-*)

- [ ] **GO-TEST-001**: Run Go test helpers
  ```bash
  cd packages/go-shared/testutil
  go test -v ./...
  ```

- [ ] **GO-TEST-002**: Fix any Go test compilation issues

**Day 8 Deliverables:**
- [ ] Journey tests: >70% passing
- [ ] Go test helpers: Compiling and usable
- [ ] Integration between apps verified

---

### Day 9: Documentation & Cleanup

**Goal:** All documentation complete, technical debt addressed

#### Morning (4 hours)

- [ ] **DOC-001**: Review and update ai/README.md

- [ ] **DOC-002**: Create QUICKSTART.md for new developers
  ```markdown
  # Quick Start Guide
  1. Clone repo
  2. Run docker-compose up
  3. Run seed script
  4. Run tests
  ```

- [ ] **DOC-003**: Document all environment variables needed

#### Afternoon (4 hours)

- [ ] **CLEANUP-001**: Remove any hardcoded test values

- [ ] **CLEANUP-002**: Ensure all test IDs are unique

- [ ] **CLEANUP-003**: Update test fixtures with realistic data

- [ ] **CLEANUP-004**: Create final test report
  ```bash
  npx playwright test --reporter=html
  # Open test-results/critical-paths/index.html
  ```

**Day 9 Deliverables:**
- [ ] Documentation complete
- [ ] No hardcoded secrets
- [ ] HTML test report generated

---

### Day 10: Team Training & Sign-off

**Goal:** Team trained, sign-off complete

#### Morning (4 hours)

- [ ] **TRAIN-001**: Team walkthrough session (2 hours)
  - AI governance workflow overview
  - How to start a new run
  - How to create issues
  - How to run tests locally

- [ ] **TRAIN-002**: Hands-on practice
  - Each team member runs tests locally
  - Create a test PR to verify CI

#### Afternoon (4 hours)

- [ ] **DEMO-001**: Run complete AI governance loop
  ```
  1. Codex reviews a sample change
  2. Claude implements fixes
  3. Gemini runs QA
  4. Issues logged to GitHub
  ```

- [ ] **SIGNOFF-001**: Final checklist verification (see below)

- [ ] **SIGNOFF-002**: Stakeholder sign-off meeting

**Day 10 Deliverables:**
- [ ] Team trained and capable
- [ ] Demo completed successfully
- [ ] Sign-off checklist complete
- [ ] Go-live approved

---

## Sign-off Checklist

### PR Gate Tests (REQUIRED - Must be 100%)

| Test Suite | Tests | Passing | Owner | Sign-off |
|------------|-------|---------|-------|----------|
| Tenant Isolation | 12 | ___/12 | ______ | [ ] |
| Authentication | 15 | ___/15 | ______ | [ ] |
| RBAC Permissions | 19 | ___/19 | ______ | [ ] |
| Checkout Idempotency | 9 | ___/9 | ______ | [ ] |

### Extended Tests (TARGET - >80%)

| Test Suite | Tests | Passing | Owner | Sign-off |
|------------|-------|---------|-------|----------|
| Three App Journey | 18 | ___/18 | ______ | [ ] |
| Store Types | 17 | ___/17 | ______ | [ ] |
| Regional Config | 24 | ___/24 | ______ | [ ] |
| Basic Functionality | 45 | ___/45 | ______ | [ ] |

### Infrastructure (REQUIRED)

| Item | Status | Owner | Sign-off |
|------|--------|-------|----------|
| CI/CD pipeline running | [ ] | ______ | [ ] |
| PR gate enforced | [ ] | ______ | [ ] |
| Auto-issue creation working | [ ] | ______ | [ ] |
| Test Keycloak configured | [ ] | ______ | [ ] |
| Test database seeded | [ ] | ______ | [ ] |

### Documentation (REQUIRED)

| Item | Status | Owner | Sign-off |
|------|--------|-------|----------|
| ai/README.md complete | [ ] | ______ | [ ] |
| QUICKSTART.md created | [ ] | ______ | [ ] |
| Environment vars documented | [ ] | ______ | [ ] |
| Team training completed | [ ] | ______ | [ ] |

### Final Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Tech Lead | ____________ | ________ | _________ |
| QA Lead | ____________ | ________ | _________ |
| Product Owner | ____________ | ________ | _________ |

---

## Escalation Contacts

| Issue Type | Contact | Escalation Path |
|------------|---------|-----------------|
| Test Infrastructure | _______ | Slack: #devops |
| Service Bugs | _______ | Slack: #engineering |
| Keycloak/Auth | _______ | Slack: #security |
| CI/CD Pipeline | _______ | Slack: #devops |

---

## Daily Standup Template

```
Date: ___________
Completed Yesterday:
-

Planned Today:
-

Blockers:
-

Test Pass Rate: ___/___
```

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation | Status |
|------|------------|--------|------------|--------|
| Services not running | Medium | High | Docker-compose fallback | |
| Keycloak setup complex | Medium | Medium | Use mock JWT initially | |
| Test data conflicts | Low | Medium | Unique IDs with timestamps | |
| CI environment differs | Medium | Medium | Test in CI by Day 5 | |
| Team availability | Low | High | Identify backup resources | |

---

*Last Updated: _____________*
*Version: 1.0*
