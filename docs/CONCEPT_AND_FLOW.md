# VeriChain Concept, Flow & Permissions

**The Core Concept**: VeriChain is a "Privacy-First" supply chain platform where **Transparency** coexists with **Confidentiality**. The fundamental rule is that **Public Verifiers** (consumers) can verify *authenticity* (that an asset exists and is owned by a legitimate entity) without seeing *sensitive business data* (like costs or appraisals), while **Regulators** can see everything to ensure compliance.

**1. Role-Based Experience & "Mint" Visibility**:
The application **MUST** strictly enforce UI adaptation based on the user's role. The **"Mint Asset" (Create)** button/link in the Navbar and Dashboard is **EXCLUSIVE** to the **`producer`** role. If a user logs in as an `auditor` or `client`, this button **MUST NOT** exist in the DOM.
*   **Producer (`farmer01`)**: Sees "Mint Asset". Can create new assets. Owns the data.
*   **Regulator (`auditor01`)**: Does **NOT** see "Mint Asset". Sees "Asset List" and "View Details". Can read Private Data of others.
*   **Public/Guest**: Sees "Scan QR". Cannot login to Dashboard without credentials.

**2. The "Demo Login" Feature**:
To facilitate easy testing and demonstration, the Login Page **SHOULD** include a "Quick Access" or "Demo Login" section below the main form. This section provides one-click buttons that pre-fill credentials and auto-submit:
*   **"Login as Farmer"**: Auth as `farmer01` (Role: Producer).
*   **"Login as Auditor"**: Auth as `auditor01` (Role: Regulator).
*   **"Login as Admin"**: Auth as `OrgAdmin` (Role: Admin).
*   *Implementation Note*: These buttons simply hit the `/login` endpoint with the hardcoded test credentials defined in `ONBOARDING_AND_TESTING.md`.

**3. Data Visibility & Privacy Rules**:
The frontend must intelligently hide/show data based on the context:
*   **Public Verification Flow**: When a user scans a QR code (or visits `/verify/:id`), the app performs a "Guest" fetch. The UI displays **ONLY** the Public Fields: `Asset ID`, `Color`, `Size`, `Owner`. The `Appraised Value` field is **STRICTLY HIDDEN** or replaced with a "Confidential / Private Data" badge. This proves the asset is real without leaking value.
*   **Private Detail Flow**:
    *   **If Producer (Owner)**: Sees ALL fields, including `Appraised Value`.
    *   **If Regulator**: Sees ALL fields, including `Appraised Value` (authorized via Private Data Collection).
    *   **If Competitor (Other Producer)**: If they somehow access the detail page, they see ONLY Public Fields (enforced by Backend, reflected in UI).

**4. The Complete Lifecycle Flow**:
1.  **Creation**: A **Producer** logs in (via Demo Button), goes to Dashboard, clicks "Mint Asset". They fill the form. The `Appraised Value` input has a "Lock" icon indicating it will be encrypted. They submit. A **QR Code** is generated immediately. They print this QR.
2.  **Verification**: A **Consumer** (no login) scans that physical QR code. The app opens `/verify/:id`. It shows "Green Corn, Size 50, Owned by Farmer01". It shows a green "Verified" checkmark. It **DOES NOT** show the price.
3.  **Audit**: A **Regulator** logs in (via Demo Button), sees the asset in their list. They click "View". They see "Green Corn... Appraised Value: $2500". They verify the value matches market rates.

**5. Edge Cases**:
*   **Asset Not Found**: If a QR is scanned for a non-existent ID, show a "Counterfeit / Invalid Asset" red warning screen.
*   **Unauthorized Access**: If a non-producer tries to hit `/create` via URL, redirect to Dashboard.
*   **Network Delay**: Blockchain writes take 2 seconds. Show a "Minting on Blockchain..." skeleton/spinner state during creation to prevent double-clicks.
