# Implementation Plan

## Bug 1: Incorrect Audit Action in listAdministrators()

- [ ] 1. Write bug condition exploration test for incorrect audit action
  - **Property 1: Bug Condition** - Incorrect Audit Action Logged
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope the property to the concrete failing case: GET /admin-management/administrators endpoint
  - Test that when SUPER_ADMIN requests administrator list via GET /admin-management/administrators, the audit log action equals 'LIST_ADMINISTRATORS' (not 'VIEW_AUDIT_LOGS')
  - Test implementation: Verify auditLog.action = 'LIST_ADMINISTRATORS' AND auditLog.details.view = 'admin_list' AND response.administrators is an array
  - Run test on UNFIXED code (admin-management.controller.ts line 93 has 'VIEW_AUDIT_LOGS')
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists, showing auditLog.action = 'VIEW_AUDIT_LOGS' instead of 'LIST_ADMINISTRATORS')
  - Document counterexamples found: Request to GET /admin-management/administrators logs wrong action type
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 2.1, 2.2_

- [~] 2. Write preservation property tests for Bug 1 (BEFORE implementing fix)
  - **Property 2: Preservation** - Other Admin Endpoints Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs (other admin management endpoints)
  - Write property-based tests capturing observed behavior patterns:
    - Create administrator endpoint continues to log 'CREATE_ADMINISTRATOR'
    - Get administrator details endpoint continues to log 'VIEW_ADMINISTRATOR_DETAILS'
    - Update administrator status endpoint continues to log 'UPDATE_ADMINISTRATOR_STATUS'
    - Delete administrator endpoint continues to log 'DELETE_ADMINISTRATOR'
    - Reset access code endpoint continues to log 'RESET_ACCESS_CODE'
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.2, 3.7_

- [ ] 3. Fix incorrect audit action in listAdministrators()

  - [~] 3.1 Change audit action from 'VIEW_AUDIT_LOGS' to 'LIST_ADMINISTRATORS'
    - Open src/admin-management/admin-management.controller.ts
    - Locate line 93 in listAdministrators() method
    - Change auditAction from 'VIEW_AUDIT_LOGS' to 'LIST_ADMINISTRATORS'
    - Ensure auditDetails.view remains 'admin_list'
    - _Bug_Condition: isBugCondition1(X) where X.endpoint = '/admin-management/administrators' AND X.method = 'GET'_
    - _Expected_Behavior: auditLog.action = 'LIST_ADMINISTRATORS' AND auditLog.details.view = 'admin_list'_
    - _Preservation: Other admin management endpoints continue to log correct action types (CREATE_ADMINISTRATOR, VIEW_ADMINISTRATOR_DETAILS, UPDATE_ADMINISTRATOR_STATUS, DELETE_ADMINISTRATOR, RESET_ACCESS_CODE)_
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.2, 3.3, 3.7_

  - [~] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Correct Audit Action Logged
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed - auditLog.action now correctly shows 'LIST_ADMINISTRATORS')
    - _Requirements: 2.1, 2.2_

  - [~] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Other Admin Endpoints Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions - other endpoints still log correct action types)
    - Confirm all tests still pass after fix (no regressions)

## Bug 2: Missing Return Statement in resetAccessCode()

- [~] 4. Write bug condition exploration test for missing return statement
  - **Property 1: Bug Condition** - Missing Response After Reset
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope the property to the concrete failing case: POST /admin-management/administrators/:id/reset-code with valid admin ID
  - Test that when SUPER_ADMIN resets access code via POST /admin-management/administrators/:id/reset-code, the response is returned with message 'Access code reset successfully and sent via email'
  - Test implementation: Verify response.message exists AND response.status = 200 AND response is returned (not undefined)
  - Run test on UNFIXED code (admin-management.controller.ts line 318 missing return statement)
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists, showing undefined response or timeout)
  - Document counterexamples found: Request to POST /admin-management/administrators/:id/reset-code hangs with no response
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.3, 1.4, 2.3, 2.4_

- [~] 5. Write preservation property tests for Bug 2 (BEFORE implementing fix)
  - **Property 2: Preservation** - Reset Functionality Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy aspects of reset functionality
  - Write property-based tests capturing observed behavior patterns:
    - New access code is generated when reset is called
    - Email is sent with new access code
    - Old access code is invalidated immediately
    - Audit entry is logged with action 'RESET_ACCESS_CODE'
    - Invalid admin ID returns proper error response (this works correctly)
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve - the bug only affects the return statement, not the underlying functionality)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.4, 3.5, 3.6_

- [ ] 6. Fix missing return statement in resetAccessCode()

  - [~] 6.1 Add return statement after audit logging
    - Open src/admin-management/admin-management.controller.ts
    - Locate line 318 in resetAccessCode() method (after audit logging)
    - Add return statement: `return { message: 'Access code reset successfully and sent via email' }`
    - Ensure return statement comes after the audit logging call
    - _Bug_Condition: isBugCondition2(X) where X.endpoint = '/admin-management/administrators/:id/reset-code' AND X.method = 'POST' AND X.validAdminId = true_
    - _Expected_Behavior: response.message = 'Access code reset successfully and sent via email' AND response.status = 200 AND response is returned_
    - _Preservation: Access code generation, email sending, old code invalidation, and audit logging continue to function correctly_
    - _Requirements: 1.3, 1.4, 2.3, 2.4, 3.4, 3.5, 3.6_

  - [~] 6.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Response Returned After Reset
    - **IMPORTANT**: Re-run the SAME test from task 4 - do NOT write a new test
    - The test from task 4 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 4
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed - response now returned with success message)
    - _Requirements: 2.3, 2.4_

  - [~] 6.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Reset Functionality Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 5 - do NOT write new tests
    - Run preservation property tests from step 5
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions - access code generation, email sending, invalidation, and audit logging still work correctly)
    - Confirm all tests still pass after fix (no regressions)

- [~] 7. Checkpoint - Ensure all tests pass
  - Run all exploration tests (tasks 1 and 4) - both should now PASS
  - Run all preservation tests (tasks 2 and 5) - both should still PASS
  - Verify both bugs are fixed and no regressions were introduced
  - Test the endpoints manually to confirm frontend receives proper responses
  - Ask the user if questions arise
