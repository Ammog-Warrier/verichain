# VeriChain Setup Guide

VeriChain is a blockchain-based pharmaceutical supply chain tracking system using Hyperledger Fabric, Node.js, and React.

## Prerequisites

- **OS:** Linux (Ubuntu/WSL2 recommended) or macOS
- **Docker:** v20.10+ (with Docker Compose v2.x or v1.29+)
- **Node.js:** v16.x or v18.x (v20+ might have OpenSSL issues with older Fabric SDKs)
- **Hyperledger Fabric Binaries:** v2.5.x (installed in `./bin`)

## 1. Network Setup (Hyperledger Fabric)

The network consists of 4 Organizations (Pharma1, Pharma2, Distributor, Retailer) and 1 Orderer.

1.  **Navigate to the project root:**
    ```bash
    cd verichain
    ```

2.  **Start the Network:**
    This script will bring down any existing network, generate crypto material, create the channel `verichain-channel`, and deploy the chaincode.
    ```bash
    ./setup_verichain.sh
    ```
    *Note: This might take a few minutes.*

3.  **Verify Chaincode Deployment:**
    Ensure the chaincode `basic` is deployed to `verichain-channel`.
    ```bash
    export PATH=$PWD/bin:$PATH
    peer lifecycle chaincode querycommitted --channelID verichain-channel --name basic
    ```

## 2. Database Setup (PostgreSQL)

VeriChain uses PostgreSQL for off-chain data (inventory, ZK proofs) and caching.

1.  **Start PostgreSQL:**
    ```bash
    docker-compose up -d postgres
    ```
    *Port:* 5433 (mapped to container 5432)
    *User:* verichain
    *Password:* verichain_secret
    *Database:* verichain

2.  **Verify Schema:**
    The database initializes with `verichain-api/src/db/schema.sql`.

## 3. Backend API Setup

The Node.js API interacts with the Fabric network and PostgreSQL.

1.  **Navigate to API directory:**
    ```bash
    cd verichain-api
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Restore Identities (Important for Fresh Network):**
    If you restarted the network, you must import the new admin/user certificates into the wallet.
    ```bash
    node restore_identities.js
    ```

4.  **Start the Server:**
    ```bash
    npm start
    ```
    *URL:* http://localhost:3000

## 4. Frontend Setup

The React frontend provides the user interface.

1.  **Navigate to Frontend directory:**
    ```bash
    cd verichain-frontend
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Start the Development Server:**
    ```bash
    npm run dev
    ```
    *URL:* http://localhost:5173

## 5. Usage Flow

1.  **Login:**
    -   **Pharma:** Use the "Pharma 1" demo button.
    -   **Distributor:** Use the "Distributor" demo button.
    -   **Retailer:** Use the "Retailer" demo button.

2.  **Create Asset (Pharma):**
    -   Go to "Create Asset".
    -   Enter details (e.g., ID: `VAX-001`, Drug: `Covid-19 Vaccine`).
    -   Click "Create Asset".

3.  **Simulate Transit (Pharma/Distributor):**
    -   Go to "Dashboard".
    -   Click "Simulate Transit" on the asset.
    -   This generates a ZK Proof (mocked/simulated) and transfers ownership to Distributor.

4.  **Accept Shipment (Retailer):**
    -   Login as Retailer.
    -   Go to "Inventory".
    -   Click "Accept Shipment" for pending assets.
    -   This transfers ownership to Retailer and updates status to `STOCKED`.

5.  **Query Ledger:**
    -   Use the script to see the full history of an asset:
    ```bash
    ./query_ledger.sh VAX-001
    ```

## Troubleshooting

-   **"Peer endorsements do not match":**
    -   This usually means the chaincode is non-deterministic. We fixed this by using transaction timestamps. Redeploy chaincode if this recurs.

-   **"Connect ECONNREFUSED 127.0.0.1:5433":**
    -   PostgreSQL is not running. Run `docker-compose up -d postgres`.

-   **"User not found in wallet":**
    -   Run `node restore_identities.js` in `verichain-api` to restore demo users.

-   **"Collection not found":**
    -   Chaincode was deployed without `collections_config.json`. Redeploy with the `-cccg` flag.
