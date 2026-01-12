# VeriChain Frontend Specification

## Overview
VeriChain is a secure, blockchain-based supply chain transparency platform. It bridges the gap between opaque supply chains and consumer trust by leveraging Hyperledger Fabric for immutable record-keeping and a modern, responsive React frontend for accessibility.

### Public & Private Access Model
The application operates on a hybrid access model:
*   **Public Access**: Unauthenticated users (Consumers) can verify asset provenance by scanning QR codes or entering Asset IDs. They see a sanitized "Public Summary" of the asset.
*   **Private Access**: Authenticated users (Farmers, Manufacturers, Regulators) access a secure Dashboard to create, manage, and inspect assets. Data visibility is strictly controlled by Organization (MSP) and Role.

## App Shell
The App Shell provides the persistent structure for the application.
*   **Layout**:
    *   **Header**: Contains the Logo ("VeriChain"), Navigation Menu (context-aware based on auth state), and User Profile/Logout dropdown.
    *   **Main Content Area**: Dynamic viewport for routing.
    *   **Footer**: Copyright, Links to Privacy/Terms, and Network Status Indicator (Green/Red dot).
*   **Responsive Design**: Mobile-first approach using Tailwind CSS. Sidebar navigation for mobile, top-bar for desktop.
*   **Theme**: "Eco-Futurism".
    *   *Primary*: Deep Emerald Green (Agriculture).
    *   *Secondary*: Clean Clinical Blue (Pharma).
    *   *Accents*: Neon Green (Success), Alert Red (Error), Glassmorphism effects for cards/modals.

## Features

### Landing / Public Verify Access
*   **Hero Section**: High-impact visual (video/animation) of supply chain flow. Tagline: "Trust, Verified."
*   **Call to Action**: Large "Verify Product" button and "Partner Login" link.
*   **Quick Scan**: Embedded QR Code scanner button for mobile users.

### Public Verify (PublicVerify)
*   **Route**: `/verify/:assetId` or `/verify` (with input).
*   **Functionality**:
    *   Accepts Asset ID via URL param or manual input.
    *   Fetches data from `GET /api/assets/public/:id`.
    *   **Display**:
        *   **Status Badge**: (e.g., "HARVESTED", "MANUFACTURED").
        *   **Timeline**: Visual journey of the asset.
        *   **Attributes**: Displays *only* public fields (ID, Status, DocType, Submitter). Private fields (Prices, Lab Results) are hidden.
*   **Guest Login**: Behind the scenes, the app performs a "Guest Login" to get a read-only JWT for API access.

### Authentication (Login / Register)
*   **Login**:
    *   Fields: User ID, Organization (Dropdown: Org1, Org2).
    *   Action: `POST /api/login`.
    *   Result: Stores JWT in LocalStorage. Decodes JWT to determine Role (`admin`, `client`) and Org.
*   **Register**:
    *   Fields: User ID, Organization, Role (Producer, Distributor, Retailer).
    *   Action: `POST /api/register`.
    *   Note: "Admin Secret" required for registration (simulated via env var in backend).

### Demo Login Feature
*   **Purpose**: Quick access for evaluators/judges.
*   **UI**: "Try Demo" button on Login page.
*   **Options**:
    *   *Login as Farmer (Org1)* -> Pre-fills credentials.
    *   *Login as Pharma (Org2)* -> Pre-fills credentials.
    *   *Login as Auditor* -> Pre-fills credentials.

### Dashboard (Private)
*   **Route**: `/dashboard`.
*   **Layout**: Grid view of Assets belonging to the user's Organization.
*   **Filtering**: By Status (Harvested, Processed, Shipped) or Type (Agri/Pharma).
*   **Cards**: Each asset card shows ID, Status, and a "View Details" button.
*   **FAB (Floating Action Button)**: "+" button to Mint New Asset (Visible only to `producer` role).

### Create Asset (CreateAsset)
*   **Route**: `/create-asset`.
*   **Dynamic Form**: Renders fields based on User's Organization (derived from JWT).
    *   **If Org1 (Agri)**:
        *   Fields: `Crop Type`, `Variety`, `Harvest Date`, `Farm Location`, `Farmer Name`, `Quantity`, `Organic Certified` (Checkbox), `Soil PH`.
    *   **If Org2 (Pharma)**:
        *   Fields: `Drug Name`, `Generic Name`, `Dosage Form`, `Strength`, `Mfg Date`, `Expiry Date`, `Batch Size`, `Lab Test Result`.
*   **Submission**: `POST /api/assets`.
*   **Feedback**: Success modal with generated Asset ID.

### Asset Detail (AssetDetail)
*   **Route**: `/assets/:id`.
*   **Data Fetching**: `GET /api/assets/:id?collection={CollectionName}`.
    *   *CollectionName* is derived from Org (Org1 -> AgriCollection, Org2 -> PharmaCollection).
*   **Display**: Full view of all private data fields.
*   **QR Code**: "Generate QR" button. Renders a downloadable QR code containing the Public Verify URL (`https://.../verify/:id`).

### Public QR Scanning / Scanning
*   **Library**: `react-qr-reader`.
*   **Flow**:
    1.  User grants Camera permission.
    2.  Scanner overlay appears.
    3.  On detect: Redirects to `/verify/:scanned_id`.

## User Flows

### Primary: Public Verification Flow
1.  User lands on Homepage.
2.  Clicks "Verify Product" or scans QR.
3.  Enters Asset ID (e.g., `asset_1768...`).
4.  System performs background Guest Login.
5.  System fetches Public Asset Summary.
6.  User views "Verified" badge and basic info.

### Primary: Producer Asset Creation Flow
1.  Producer (Farmer/Manufacturer) logs in.
2.  Redirected to Dashboard.
3.  Clicks "+" (Create Asset).
4.  Fills out domain-specific form (Agri or Pharma).
5.  Submits form.
6.  Backend mints asset on Hyperledger Fabric.
7.  User sees new asset in Dashboard.

### Primary: Regulator Asset Inspection Flow
1.  Regulator logs in.
2.  Browses Dashboard.
3.  Selects an Asset.
4.  Views full private details (e.g., Lab Results, Pesticide Compliance) to ensure safety standards.

### Operational Scenarios (Pre-configured)
*   **Scenario A (Agri)**: Farmer creates "Sweet Corn". Distributor verifies "Harvested" status. Retailer sells to Consumer. Consumer scans QR to see "Farm Location".
*   **Scenario B (Pharma)**: Manufacturer creates "Paracetamol". Auditor checks "Lab Results". Pharmacy dispenses. Patient scans QR to check "Expiry Date".

## State Management
*   **Global State (Context API / Zustand)**:
    *   `AuthContext`: Stores `user`, `token`, `role`, `org`.
    *   `ThemeContext`: Manages Dark/Light mode preferences.
*   **Local State**: Form inputs, loading spinners, error messages.
*   **Persistence**: `localStorage` for JWT to persist login across refreshes.

## API / Integration (Concise)

### Authentication
*   `POST /login`: `{ userId, orgName }` -> Returns JWT.
*   `POST /register`: `{ userId, orgName, role, adminId }` -> Returns JWT.

### Assets (Protected)
*   `POST /assets`: Creates asset. Payload depends on Org schema.
*   `GET /assets/:id`: Fetches full private details. Requires `collection` query param.
*   `GET /assets/public/:id`: Fetches public summary.

## Enhancement Request Implementation

### Backend Access & Access Control
#### 1. Access Control Concept (Token Decoding)
*   **Frontend Responsibility**: The frontend MUST decode the JWT (using `jwt-decode`) to read the `role` and `orgName`.
*   **UI Logic**:
    *   If `role !== 'producer'`, HIDE the "Create Asset" button.
    *   If `orgName === 'Org1'`, SHOW Agri form fields.
    *   If `orgName === 'Org2'`, SHOW Pharma form fields.

#### 2. Role-Based Routing Logic
*   **PrivateRoutes**: Wrapper component that checks for valid Token. Redirects to `/login` if missing.
*   **RoleRoutes**: Wrapper that checks `user.role`. Redirects to `/unauthorized` if user lacks permission (e.g., a 'viewer' trying to access `/create-asset`).

## Enhancement Request URL Configuration
*   **Base URL**: `https://unparked-yareli-nonmaterialistically.ngrok-free.dev/api`
*   **Credential Note**:
    *   **JWT_SECRET**: Configured in backend `.env`.
    *   **ADMIN_PASSWORD**: Configured in backend `.env`.
    *   **Frontend Config**: Store Base URL in `.env.local` (`VITE_API_BASE_URL`).
