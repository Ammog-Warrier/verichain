# Onboarding & Testing Guide

This document outlines the exact data to collect in frontend forms and provides credentials for testing the VeriChain application.

> **Note**: The current API configuration supports **Org1 (Agriculture)**.

## 1. Form Data Specifications

### A. Registration (Onboarding)
Used to create a new identity in the wallet.

| Field | Type | Required | Description / Value |
| :--- | :--- | :--- | :--- |
| **User ID** | Text | Yes | Unique username (e.g., `farmer_joe`). No spaces. |
| **Organization** | Dropdown | Yes | Fixed to **`Org1`** (Current support). |
| **Role** | Dropdown | Yes | Options: `client` (Default), `producer`, `regulator`. |
| **Admin ID** | Hidden | Yes | Hardcode to **`admin`** (The CA admin used to register new users). |

### B. Login
Used to authenticate an existing identity.

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| **User ID** | Text | Yes | The username registered previously. |
| **Organization** | Dropdown | Yes | Fixed to **`Org1`**. |

### C. Create Asset (Producer Only)
Used to mint a new asset on the blockchain.

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| **Asset ID** | Text | Yes | Unique ID (e.g., `asset_01`). Auto-generate if possible. |
| **Color** | Text | Yes | e.g., `Red`, `Green`. |
| **Size** | Number | Yes | e.g., `10`, `50`. |
| **Owner** | Text | Yes | The name of the current user (e.g., `Farmer Joe`). |
| **Appraised Value** | Number | Yes | **Private Data**. e.g., `1000`. |
| **Collection** | Hidden | Yes | Hardcode to **`AgriCollection`** for Org1. |

---

## 2. Test Credentials & Scenarios

Since this is a decentralized system, "credentials" are identities stored in the wallet. You can use the **Pre-configured Admin** or **Register New Users**.

### Scenario A: The Super Admin (Immediate Access)
Use this identity to test the system immediately without registration. It has full permissions.

*   **User ID**: `OrgAdmin`
*   **Organization**: `Org1`
*   **Role**: `admin` (Implicit)

**Action**: Go to `/login`, enter `OrgAdmin` / `Org1`. You will get a token and access the dashboard.

### Scenario B: The Producer (Farmer Flow)
Register a new user to simulate a farmer creating assets.

1.  **Go to `/register`**
2.  **Form Data**:
    *   User ID: `farmer01`
    *   Organization: `Org1`
    *   Role: `producer`
3.  **Click Register** -> Success! You are now logged in.
4.  **Go to Dashboard** -> Click "Create Asset".
5.  **Create Asset Data**:
    *   Asset ID: `corn_batch_99`
    *   Color: `Yellow`
    *   Size: `500`
    *   Owner: `Farmer 01`
    *   Appraised Value: `2500` (This will be private)

### Scenario C: The Auditor (Regulator Flow)
Register a user to simulate an auditor inspecting assets.

1.  **Go to `/register`**
2.  **Form Data**:
    *   User ID: `auditor01`
    *   Organization: `Org1`
    *   Role: `regulator`
3.  **Click Register** -> Success!
4.  **Go to Dashboard** -> View the asset `corn_batch_99`.
5.  **Result**: You should see the **Appraised Value** (2500) because Auditors have read access to `AgriCollection`.

### Scenario D: The Public Verifier (Guest)
Simulate a consumer scanning a QR code.

1.  **Logout** (if logged in).
2.  **Go to `/verify/corn_batch_99`**.
3.  **Result**:
    *   You see: ID (`corn_batch_99`), Color (`Yellow`), Size (`500`), Owner (`Farmer 01`).
    *   You do **NOT** see: Appraised Value (Hidden).
