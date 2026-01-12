# Gap Analysis: Frontend Spec vs. Current Backend

This document outlines the discrepancies between the proposed **VeriChain Frontend Specification** and the current **Backend Implementation**.

## 1. Critical Mismatches

### A. Public Verification Access
*   **Spec**: States "Public Verify page... accessible without authentication".
*   **Current Backend**: The endpoint `GET /api/assets/public/:id` is **Protected** by `authenticateToken`. It requires a valid JWT.
*   **Impact**: The "Scan QR -> Verify" flow will fail for unauthenticated users (401 Unauthorized).
*   **Fix Required**:
    *   **Option 1 (Backend)**: Remove `authenticateToken` middleware from the public route.
    *   **Option 2 (Frontend)**: Implement "Guest Login" (auto-login as a generic user) to get a token before fetching data.

### B. RBAC Enforcement (Minting)
*   **Spec**: States "Create Asset" is **Producer Only**.
*   **Current Backend**: The endpoint `POST /api/assets` checks for a valid token but **does NOT enforce the role**. Any logged-in user (including `client` or `regulator`) can currently create assets.
*   **Impact**: Security vulnerability. Non-producers can mint assets.
*   **Fix Required**: Apply `requireRole('producer')` middleware to the `POST /assets` route.

### C. Organization Support
*   **Spec**: Mentions "Org1", "Org2" (Pharma), and "Partner" (Org4).
*   **Current Backend**: Only `connection-org1.json` exists.
*   **Impact**: Attempting to Login/Register with "Org2" or "Org4" will fail with "Connection profile not found".
*   **Fix Required**: Add connection profiles for Org2, Org3, and Org4 to `verichain-api/src/config/`.

### D. "Partner" Role & Credentials
*   **Spec**: Mentions a "Partner" role and `partner01` test user.
*   **Current Backend**:
    *   The `partner` role string is accepted by `/register`.
    *   However, `partner01` is not pre-registered, and no specific logic exists for "Partner" auto-login (frontend concern, but backend supports it).
*   **Fix Required**: Register `partner01` in the `ONBOARDING_AND_TESTING.md` guide or script.

## 2. Minor Discrepancies

### A. Asset ID Generation
*   **Spec**: "Asset ID (auto-generated if possible)".
*   **Current Backend**: Expects `assetId` in the request body.
*   **Resolution**: Frontend must generate a UUID or timestamp-based ID.

### B. Demo Login Buttons
*   **Spec**: Requires "Login as Farmer", "Login as Auditor", etc.
*   **Current Backend**: Fully supports this via `/login`, but the **Frontend** must implement the hardcoded credentials mapping.

## 3. Recommended Action Plan

1.  **Update Backend**:
    *   Unprotect `GET /api/assets/public/:id` OR create a specific "Guest" user.
    *   Add `requireRole('producer')` to `POST /api/assets`.
2.  **Update Config**:
    *   Add `connection-org2.json` etc. if multi-org support is immediate priority.
3.  **Update Documentation**:
    *   Add `partner01` credentials to `ONBOARDING_AND_TESTING.md`.
