# VeriChain Frontend Specification

> **Version:** 1.0.0
> **Last Updated:** 2026-01-13
> **Status:** Production-Ready

## 1. Overview

VeriChain Frontend is a React-based Single Page Application (SPA) built with Vite. It serves as the user interface for the pharmaceutical supply chain verification system, interacting with a Node.js/Express backend that bridges Hyperledger Fabric (private data) and Shardeum (public verification).

### Tech Stack
- **Framework:** React 18
- **Build Tool:** Vite
- **Styling:** Vanilla CSS (CSS Variables + Utility Classes)
- **Routing:** React Router DOM v6
- **HTTP Client:** Axios (with Interceptors)
- **Charts:** Recharts (for temperature data)
- **QR Scanning:** html5-qrcode
- **State Management:** React Context API (AuthContext)

---

## 2. Project Structure

```
src/
├── assets/                 # Static assets (images, svg)
├── components/             # Reusable UI components
│   ├── Header.jsx          # Navigation bar with role-based links
│   └── ProtectedRoute.jsx  # Route guard for authenticated pages
├── contexts/               # Global state contexts
│   └── AuthContext.jsx     # Authentication & User Session management
├── pages/                  # Main page views
│   ├── Login.jsx           # Role selection & login
│   ├── BusinessPortal.jsx  # Pharma (Mint) & Distributor (Transit) view
│   ├── RetailerTerminal.jsx# Hospital/Pharmacy verification view
│   └── PublicVerify.jsx    # Public patient verification (QR Scan)
├── services/               # API integration layer
│   └── api.js              # Centralized Axios instance & endpoints
├── App.jsx                 # Main router configuration
├── main.jsx                # Entry point
└── index.css               # Global styles & Design System
```

---

## 3. Design System

The application uses a consistent design system defined in `index.css` via CSS variables.

### Color Palette
| Variable | Value | Usage |
|----------|-------|-------|
| `--color-primary` | `#0f766e` (Teal-700) | Primary buttons, active states, branding |
| `--color-bg` | `#fafafa` (Neutral-50) | App background |
| `--color-surface` | `#ffffff` (White) | Cards, headers, inputs |
| `--color-text` | `#1a1a1a` (Gray-900) | Primary text |
| `--color-text-muted` | `#6b7280` (Gray-500) | Secondary text, labels |
| `--color-success` | `#059669` (Emerald-600) | Success states, verified badges |
| `--color-error` | `#dc2626` (Red-600) | Error states, alerts |
| `--color-warning` | `#d97706` (Amber-600) | Pending states, notices |

### Typography
- **Font Family:** `IBM Plex Sans`, sans-serif
- **Base Size:** 16px
- **Weights:** 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold)

### Common Components (CSS Classes)
- `.card`: White surface with border and shadow.
- `.btn`: Base button style.
    - `.btn-primary`: Teal background, white text.
    - `.btn-secondary`: Transparent background, border.
- `.form-input`: Standardized text input with focus ring.
- `.badge`: Pill-shaped status indicator (`.badge-success`, `.badge-error`).

---

## 4. Authentication Flow

Authentication is handled via **HTTP-Only Cookies** (Secure, SameSite). `localStorage` is NOT used for sensitive tokens.

### AuthContext (`src/contexts/AuthContext.jsx`)
- **State:** `user` (Object), `loading` (Boolean)
- **Initialization:** Calls `GET /api/me` on app mount to check for an existing session cookie.
- **Login:** Calls `POST /api/login`. The server sets the `token` cookie. Context updates `user` state.
- **Logout:** Calls `POST /api/logout`. Server clears cookie. Context clears `user`.

---

## 5. API Layer Specification

All API calls are centralized in `src/services/api.js`.
**Base URL:** `/api` (Proxied in Vite config or absolute URL in production)
**Config:** `withCredentials: true` (Required for cookies)

### 5.1 Auth API (`authAPI`)

| Method | Function | Endpoint | Payload | Response |
|--------|----------|----------|---------|----------|
| POST | `login` | `/login` | `{ userId, orgName }` | `{ token, user: { ... } }` |
| POST | `logout` | `/logout` | `{}` | `{ message: "Logged out" }` |
| GET | `me` | `/me` | - | `{ user: { ... } }` |

### 5.2 Assets API (`assetsAPI`)

| Method | Function | Endpoint | Payload | Response |
|--------|----------|----------|---------|----------|
| POST | `create` | `/assets` | `{ assetId, drugName, ... }` | `{ success: true, assetId }` |
| GET | `list` | `/assets` | Query: `?org=Org1` | `[{ id, drugName, status... }]` |
| GET | `getPrivate` | `/assets/:id` | Query: `?collection=...` | `{ id, ...privateData }` |
| GET | `getPublic` | `/assets/public/:id` | - | `{ id, status, owner }` |

### 5.3 Transit API (`transitAPI`)

| Method | Function | Endpoint | Payload | Response |
|--------|----------|----------|---------|----------|
| POST | `simulate` | `/transit/simulate` | `{ batchId, scenario }` | `{ readings: [...], stats: {...} }` |
| POST | `generateProof` | `/transit/generate-proof` | `{ batchId }` | `{ proofHash, verified: true }` |
| POST | `notarize` | `/transit/notarize` | `{ assetId, proofHash, isValid }` | `{ txHash, qrCodeUrl, explorerUrl }` |
| POST | `verify` | `/transit/verify` | `{ batchId, proofHash }` | `{ verified: true, complianceStatus }` |
| GET | `publicVerify` | `/transit/public/:batchId` | - | `{ verified: true, shardeumQrCodeUrl... }` |

### 5.4 Inventory API (`inventoryAPI`)

| Method | Function | Endpoint | Payload | Response |
|--------|----------|----------|---------|----------|
| GET | `getPending` | `/inventory/pending` | - | `[{ id, status: 'IN_TRANSIT' }]` |
| GET | `getInventory` | `/inventory` | - | `[{ id, status: 'STOCKED' }]` |
| POST | `accept` | `/inventory` | `{ assetId }` | `{ success: true }` |

---

## 6. Page Specifications

### 6.1 Login Page (`/login`)
- **Route:** `/login` (Public)
- **Features:**
    - Card selection for roles: "Pharma Manufacturer", "Distributor", "Retailer/Hospital".
    - Pre-filled credentials for demo purposes (e.g., `admin-org1`, `distributor-cert`).
    - Redirects to `/portal` or `/retailer` upon success.

### 6.2 Business Portal (`/portal`)
- **Route:** `/portal` (Protected: Org1, Org2, Org3)
- **Conditional Rendering:**
    - **Pharma View (Org1/Org2):**
        - Form to Mint New Asset.
        - Fields: Batch ID, Drug Name, License No, Batch Size.
        - Action: Calls `assetsAPI.create`.
    - **Distributor View (Org3):**
        - Input: Batch ID.
        - **Tab 1: Simulation:**
            - "Simulate Transit" button.
            - Renders live `AreaChart` (Recharts) showing 30 data points.
            - Visual indicators for Min (2°C) and Max (8°C) thresholds.
        - **Tab 2: Proof Generation:**
            - "Generate ZK Proof" button (only if compliant).
            - Displays Proof Hash and Verification Time.
        - **Tab 3: Notarization:**
            - "Notarize to Shardeum" button.
            - Displays Shardeum Transaction Hash (link to Explorer).
            - Displays Product QR Code (generated from Batch ID).

### 6.3 Retailer Terminal (`/retailer`)
- **Route:** `/retailer` (Protected: Org4)
- **Features:**
    - **Pending Shipments:** List of assets with status `IN_TRANSIT`.
    - **Verification Action:**
        - "Verify & Accept" button.
        - Calls `transitAPI.verify`.
        - Displays "Math-Verified" badge (Green Shield).
    - **Stock Action:**
        - "Confirm Stock" button.
        - Calls `inventoryAPI.accept`.
        - Moves item to "Current Inventory" list.

### 6.4 Public Verification (`/public`)
- **Route:** `/public` (Public, No Auth)
- **Features:**
    - **Search:** Input field for Batch ID.
    - **QR Scanner:**
        - "Scan QR" button toggles `Html5QrcodeScanner`.
        - On scan success, auto-populates Batch ID and triggers verification.
    - **Result Display:**
        - **Verified:** Green Checkmark, "Certified Safe".
        - **Details:** Compliance Range (2-8°C), Proof Hash (truncated).
        - **Blockchain Proof:** Displays QR Code image and link to Shardeum Explorer.
        - **Failed:** Red X, "Not Verified" or "Temperature Breach".

---

## 7. Routing Configuration (`App.jsx`)

```jsx
<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/public" element={<PublicVerify />} />
  <Route path="/public/:batchId" element={<PublicVerify />} />
  
  {/* Protected Routes */}
  <Route element={<ProtectedRoute />}>
    <Route path="/portal" element={<BusinessPortal />} />
    <Route path="/retailer" element={<RetailerTerminal />} />
    <Route path="/" element={<Navigate to="/login" />} />
  </Route>
</Routes>
```
