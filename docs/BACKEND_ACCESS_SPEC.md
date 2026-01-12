# Backend Access & Access Control Specification

## 1. Access Control Concept (The "Huge Paragraph")

In the VeriChain system, **Access Control is a shared responsibility** between the Frontend (UI) and the Backend (API/Blockchain). The Backend issues a **JWT (JSON Web Token)** upon login which contains the user's `role` (e.g., `producer`, `regulator`, `client`). **Crucially, the Frontend must decode this token to enforce UI navigation rules.** A common issue where a Regulator sees the Producer flow (e.g., "Create Asset" screen) happens because the UI fails to check this `role` claim. **The Rule is Strict:** If `role === 'producer'`, show the Dashboard with the "Mint Asset" button. If `role === 'regulator'`, show the Dashboard with the "Asset List" ONLY. If `role === 'client'`, show only the Public Verify interface. While the backend validates the *validity* of the token for all requests, the **Frontend is the primary gatekeeper for the User Experience**, ensuring that users never see buttons or pages irrelevant to their role.

## 2. Role-Based Routing Logic

To fix the "Regulator -> Producer Flow" issue, implement the following logic in your `AuthContext` or Router:

| Role | Allowed Routes | Forbidden Routes | UI Elements |
| :--- | :--- | :--- | :--- |
| **Producer** | `/dashboard`, `/create`, `/assets/:id` | None | "Mint Asset" Button: **VISIBLE** |
| **Regulator** | `/dashboard`, `/assets/:id` | `/create` | "Mint Asset" Button: **HIDDEN** |
| **Client/Guest** | `/verify/:id` | `/dashboard`, `/create` | Dashboard: **HIDDEN** |

> **Implementation Note**: When a user logs in, decode the JWT (`jwt-decode` library). Extract `decoded.role`. Store this in your global state. Use this state to conditionally render the Navbar links and protect the `/create` route (redirect to `/dashboard` if accessed by non-producer).

## 3. API Endpoints & Contracts

**Base URL**: `https://unparked-yareli-nonmaterialistically.ngrok-free.dev/api`

### A. Authentication

#### 1. Register
*   **Endpoint**: `POST /auth/register`
*   **Purpose**: Create a new user and get a token.
*   **Payload**:
    ```json
    {
      "userId": "farmer01",
      "orgName": "Org1",
      "adminId": "admin",
      "role": "producer" // CRITICAL: This sets the role in the token
    }
    ```
*   **Response**:
    ```json
    {
      "message": "Successfully registered...",
      "token": "eyJhbGci..." // Contains role: 'producer'
    }
    ```

#### 2. Login
*   **Endpoint**: `POST /auth/login`
*   **Purpose**: Authenticate existing user.
*   **Payload**:
    ```json
    {
      "userId": "farmer01",
      "orgName": "Org1"
    }
    ```
*   **Response**:
    ```json
    {
      "message": "Login successful",
      "token": "eyJhbGci..."
    }
    ```
    > **Note**: The `role` is NOT in the JSON body. You **MUST** decode the `token` to get the role.

### B. Assets (Protected)

**Headers Required**: `Authorization: Bearer <token>`

#### 1. Create Asset (Producer Only)
*   **Endpoint**: `POST /assets`
*   **Payload**:
    ```json
    {
      "assetId": "corn_01",
      "color": "Yellow",
      "size": 50,
      "owner": "Farmer Joe",
      "appraisedValue": 1000,
      "collection": "AgriCollection"
    }
    ```
*   **Response**: `{ "message": "Asset corn_01 created..." }`

#### 2. Get Asset Details (Private)
*   **Endpoint**: `GET /assets/:id?collection=AgriCollection`
*   **Response**:
    ```json
    {
      "ID": "corn_01",
      "Color": "Yellow",
      "Size": 50,
      "Owner": "Farmer Joe",
      "AppraisedValue": 1000 // Visible only if authorized
    }
    ```

#### 3. Get Public Summary
*   **Endpoint**: `GET /assets/public/:id`
*   **Note**: Currently requires a token. Frontend must use a "Guest Token" or force a background login if the user is unauthenticated.
*   **Response**:
    ```json
    {
      "ID": "corn_01",
      "Color": "Yellow",
      "Size": 50,
      "Owner": "Farmer Joe"
      // AppraisedValue is MISSING (Privacy Preserved)
    }
    ```
