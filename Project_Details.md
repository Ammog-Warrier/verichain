# VeriChain Project Technical Breakdown

This document provides a deep dive into the internal logic of the project's critical scripts and directories.

---

## 1. Core Automation Scripts (Root Directory)

### `setup_verichain.sh`
**Role:** The "Custom Orchestrator" (Manager).
**Internal Logic:**
-   **Relationship to `network.sh`**: It is **NOT** just a wrapper.
    -   It calls `network.sh down` to ensure cleanup.
    -   **BUT** it completely **REPLACES** `network.sh up`.
    -   *Why?* Standard `network.sh` defaults to 2 Organization. This script manually handles `cryptogen` and `configtxgen` for our **4-Org Consortium** (Agri, Pharma, Distributor, Retailer).
1.  **Cleanup**: Runs `docker-compose down -v` and `network.sh down`.
2.  **Crypto Generation**: Manually calls `cryptogen` for all 5 entities (4 Peers + Orderer).
3.  **Network Start**: Launches the Docker containers defined in `compose/compose-test-net.yaml` (4 Peers, 1 Raft Orderer).
4.  **Channel Creation**:
    -   Generates the genesis block (`verichain-channel.block`) using `configtxgen`.
    -   Talks to the Orderer to officially create the channel.
    -   Joins all 4 Peers to this channel.

### `network.sh`
**Role:** The Fabric "Swiss Army Knife" (Base Framework).
**Internal Logic:**
-   **Origin**: This is the standard utility script provided by Hyperledger Fabric Samples.
-   **Usage**:
    -   USED BY `deploy_contract.sh` to run the complex Chaincode Lifecycle (Package -> Install -> Approve -> Commit).
    -   CAN be used to `up`/`down` the network, but our project prefers the custom `setup_verichain.sh` for finer control over the 4-Org setup.
    -   **Critical Function**: `deployCC` - It handles the orchestration of installing chaincode on all peers and gathering enough endorsements to commit the definition to the channel.

### `verify_pdc.sh`
**Role:** The "Unit Test" for Privacy/Security.
**Internal Logic:**
1.  **Deployment**: Packages and installs the smart contract (`verichain-contract`) on all peers.
2.  **Verification Steps**:
    -   **As Org1**: Submits a `CreatePrivateAsset` transaction with transient JSON data.
    -   **Asssertion 1 (Public)**: Checks the public ledger; verifies only the *Hash* and Public Summary exist.
    -   **Assertion 2 (Access)**: Confirms Org1 can read its own data (it has the key).
    -   **Assertion 3 (Isolation)**: Switches identity to Org2 and attempts to read Org1's data. **Must Fail**.
    -   **Assertion 4 (Cross-Check)**: Repeats the process for Org2 -> `PharmaCollection`.

---

## 2. Backend Middleware (`verichain-api/`)

This directory is the "Bridge" between the outside world (Web/Mobile Apps) and the Blockchain.

### `test-connection.js`
**Role:** Connectivity Health Check.
**Internal Logic:**
1.  **Wallet Lookup**: Finds the `admin` identity in `./wallet`.
2.  **Gateway Connect**: Uses the Fabric SDK (`Gateway`, `connect`) to initiate a TLS handshake with `peer0.org1.example.com`.
3.  **Discovery**: Asks the peer for a Service Discovery map (verifying the channel `verichain-channel` and contract `verichain-contract` exist).

### `src/enrollAdmin.js`
**Role:** The Registrar.
**Internal Logic:**
1.  **CA Connection**: Connects to the Certificate Authority container (`ca.org1.example.com`).
2.  **Enrollment**: Exchanges an ID/Secret (`admin`/`adminpw`) for a specialized **X.509 Certificate** (Admin capability).
3.  **Storage**: Saves this certificate into the filesystem wallet (`./wallet`) for other scripts to use.

### `src/registerUser.js`
**Role:** User Onboarding.
**Internal Logic:**
1.  **Auth**: Loads the `admin` identity (created above) to prove authority.
2.  **Registration**: Tells the CA to create a *new* identity (`appUser`) affiliated with `org1.department1`.
3.  **Enrollment**: Generates the crypto keys for this new user so they can sign their own transactions.

---

## 3. Smart Contract (`chaincode/src/`)

This is the "Brain" of the blockchain. It runs inside the Peer containers.

-   **`lib/assetTransfer.js`**:
    -   **`CreatePrivateAsset`**: The critical function.
        -   `ctx.stub.getTransient()`: Reads data that *never* hits the public block log.
        -   `ctx.clientIdentity.getMSPID()`: Checks if caller is "Org1MSP" (Agri) or "Org2MSP" (Pharma).
        -   `ctx.stub.putPrivateData()`: Shoves the actual data into the private SideDB (`AgriCollection` or `PharmaCollection`).
        -   `ctx.stub.putState()`: Writes a sanitized "Public Summary" to the main ledger (so everyone knows *something* happened).
-   **`package.json`**: Defines this as a Node.js project and lists dependencies (`fabric-contract-api`).

---

## 4. Helper Scripts (`scripts/`)

These are utility scripts used by the main automation tools. You rarely run these directly.

-   **`utils.sh`**: Common helper functions (colors for terminal output, error handling wrappers).
-   **`envVar.sh`**:
    -   **Role**: Context Switcher.
    -   **Logic**: When you run `setGlobals 1`, it exports all the environment variables (MSP ID, TLS Cert path, Peer Address) needed to "become" Org1 in the terminal session.
-   **`deployCC.sh`**: The heavy lifter for chaincode operations (Install -> Approve -> Commit). It handles the complex "Lifecycle" definitions of Fabric 2.0.
