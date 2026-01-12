# VeriChain Frontend Specification

## 1. Project Overview
**VeriChain Frontend** is the user interface for a privacy-preserving supply chain verification platform. It connects to a Hyperledger Fabric backend to allow:
1.  **Public Users**: To verify product authenticity via QR codes without logging in.
2.  **Producers**: To mint new assets and generate QR codes.
3.  **Regulators**: To inspect full asset details including private data.

## 2. Technical Stack
*   **Framework**: React.js (Vite).
*   **Styling**: Tailwind CSS (Utility-first).
*   **Animations**: `framer-motion` (for page transitions and card effects).
*   **Icons**: `lucide-react`.
*   **HTTP Client**: `axios`.
*   **QR Tools**: `react-qr-reader` (scanning), `qrcode.react` (generation).
*   **Router**: `react-router-dom`.

## 3. Design System ("Eco-Futurism")
*   **Color Palette**:
    *   **Primary**: Emerald Green (`#10B981`) - Buttons, Highlights, Badges.
    *   **Secondary**: Slate Blue (`#64748B`) - Text, Borders.
    *   **Background**: Light Gray (`#F3F4F6`) to White (`#FFFFFF`).
    *   **Dark Mode**: Deep Slate (`#0F172A`) with Emerald accents.
*   **Typography**: `Inter` or `Outfit` (Clean, modern sans-serif).
*   **Components**:
    *   **Glass Card**: White background with 70% opacity, `backdrop-blur-md`, thin white border.
    *   **Primary Button**: Emerald gradient, rounded-xl, shadow-lg, hover scale effect.
    *   **Input Field**: Transparent background, bottom border or soft gray fill, focus ring.

## 4. App Architecture & Navigation

### 4.1 Routing
| Route | Component | Access | Description |
| :--- | :--- | :--- | :--- |
| `/` | `LandingPage` | Public | Hero, Scan CTA, Nav to Login. |
| `/login` | `LoginPage` | Public | User Login. |
| `/register` | `RegisterPage` | Public | New User Registration. |
| `/verify/:assetId` | `PublicVerify` | Public | Public asset summary. |
| `/dashboard` | `Dashboard` | Private | Main hub for authenticated users. |
| `/create` | `CreateAsset` | Private | Asset creation form (Producer only). |
| `/assets/:id` | `AssetDetail` | Private | Full asset details. |

### 4.2 Global Components
*   **Navbar**:
    *   **Public State**: Logo (Left), "Login" / "Register" (Right).
    *   **Private State**: Logo (Left), "Dashboard", "Logout" (Right).
*   **Footer**: Simple copyright and links.
*   **ToastContainer**: For displaying success/error messages (e.g., "Login Failed", "Asset Created").

## 5. Detailed Page Specifications

### 5.1 Landing Page (`/`)
*   **Hero Section**: Large title "Trust, Verified.", Subtitle "Blockchain-backed supply chain transparency."
*   **Action Area**:
    *   **Big Button**: "Scan QR Code" (Opens Camera Modal).
    *   **Input Field**: "Or enter Asset ID" + "Verify" button.
*   **Camera Modal**: Overlay with QR scanner. On success -> Navigate to `/verify/:id`.

### 5.2 Login Page (`/login`)
*   **Card**: Centered glass card.
*   **Fields**:
    *   `User ID` (Text Input).
    *   `Organization` (Dropdown: "Org1" - *Backend currently supports only Org1*).
*   **Actions**:
    *   "Sign In" button.
    *   "Don't have an account? **Register**" link.
*   **Logic**: POST `/api/login`. On success, save token, redirect to `/dashboard`.

### 5.3 Register Page (`/register`)
*   **Card**: Centered glass card.
*   **Fields**:
    *   `User ID` (Text Input).
    *   `Organization` (Dropdown: "Org1").
    *   `Admin ID` (Text Input, default "admin").
    *   `Role` (Dropdown: "client", "producer", "regulator", "partner").
*   **Actions**:
    *   "Create Account" button.
    *   "Already have an account? **Login**" link.
*   **Logic**: POST `/api/register`.
    *   **Success**: Backend returns `{ token }`.
    *   **Auto-Login**: Save token immediately and redirect to `/dashboard` (Required for "Partner" flow).

### 5.4 Dashboard (`/dashboard`)
*   **Header**: "Welcome, {userId}".
*   **Stats Row**: "Total Assets", "Recent Activity".
*   **Action Bar**:
    *   **"Create New Asset"** button (Visible **ONLY** if role == 'producer').
*   **Asset List**:
    *   Grid or Table of assets fetched from API.
    *   *Note*: Since API doesn't have "List All", maintain a local list of *recently accessed/created* assets in localStorage or fetch specific known IDs for demo.
    *   Each item has a "View Details" button -> Navigates to `/assets/:id`.

### 5.5 Create Asset Page (`/create`)
*   **Form**:
    *   `Asset ID` (Text Input - User must enter unique ID).
    *   `Color` (Text).
    *   `Size` (Number).
    *   `Owner` (Text).
    *   `Appraised Value` (Number) - **Marked as "Private Data"**.
    *   `Collection` (Hidden/Default: "AgriCollection").
*   **Actions**: "Mint Asset" button.
*   **Success State**:
    *   Show **QR Code Modal** generated from the new Asset ID.
    *   "Print QR" and "Done" buttons.

### 5.6 Asset Detail Page (`/assets/:id`)
*   **Header**: "Asset Details: {id}".
*   **Content**:
    *   **Public Section**: Color, Size, Owner.
    *   **Private Section** (Highlighted): Appraised Value.
*   **Actions**: "Back to Dashboard", "Generate QR".

### 5.7 Public Verify Page (`/verify/:assetId`)
*   **State**:
    *   *Loading*: Spinner.
    *   *Success*: Green Badge "Verified by VeriChain".
*   **Card**:
    *   Display **ONLY** Public Data: ID, Color, Size, Owner.
    *   **Appraised Value**: Should NOT be shown or should say "Confidential".
*   **Logic**:
    *   **Guest Login Requirement**: The backend requires a token for public endpoints.
    *   **Flow**: On load, check for token. If none, perform background login as a generic guest (e.g., `guest_user` / `Org1` - *Frontend must handle this registration/login if user doesn't exist, or use a hardcoded guest token*).
    *   Fetch data from `/api/assets/public/:id`.

## 6. API Integration

**Base URL**: `https://unparked-yareli-nonmaterialistically.ngrok-free.dev/api`

### 6.1 Auth Endpoints
*   **Login**: `POST /login`
    *   Payload: `{ "userId": "...", "orgName": "Org1" }`
    *   Response: `{ "token": "..." }`
*   **Register**: `POST /register`
    *   Payload: `{ "userId": "...", "orgName": "Org1", "adminId": "admin", "role": "..." }`
    *   Response: `{ "token": "..." }`

### 6.2 Asset Endpoints
*   **Create**: `POST /assets`
    *   Header: `Authorization: Bearer <token>`
    *   Payload: `{ "assetId": "...", "color": "...", "size": 10, "owner": "...", "appraisedValue": 100, "collection": "AgriCollection" }`
*   **Read Private**: `GET /assets/:id?collection=AgriCollection`
    *   Header: `Authorization: Bearer <token>`
*   **Read Public**: `GET /assets/public/:id?orgName=Org1&userId=guest`
    *   Header: `Authorization: Bearer <token>` (Use Guest Token if not logged in)

## 7. State Management (Context API)

### `AuthContext`
*   `user`: { userId, orgName, role } | null
*   `token`: string | null
*   `login(userId, orgName)`: Call API -> setToken -> setUser.
*   `register(formData)`: Call API -> setToken -> setUser.
*   `logout()`: clearToken -> setUser(null).

## 8. Implementation Checklist for AI
1.  [ ] Setup Vite + React + Tailwind.
2.  [ ] Implement `AuthContext` with Axios Interceptor.
3.  [ ] Build `LoginPage` and `RegisterPage` with forms.
4.  [ ] Build `Dashboard` with "Create" button.
5.  [ ] Build `CreateAsset` form with QR generation.
6.  [ ] Build `PublicVerify` page with "Guest Login" logic.
7.  [ ] Test full flow: Register -> Create -> Logout -> Scan QR -> Verify.
