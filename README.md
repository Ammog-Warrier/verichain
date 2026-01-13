# VeriChain Network

VeriChain is a Hyperledger Fabric-based blockchain network designed for a consortium supply chain. This project demonstrates a multi-org setup (Agri, Pharma, Regulators) with advanced **Private Data Collections (PDC)** for data isolation.

## 📋 Prerequisites & Requirements

Before setting up the network, ensure your environment meets the following requirements:

### Software
*   **Operating System**: Linux (Ubuntu 20.04+) or macOS.
*   **Docker**: v20.10+ (Docker Desktop or Engine)(NOT 29)
*   **Docker Compose**: v2.0+.
*   **Node.js**: v18+ (for API and Chaincode).
*   **Go** (Optional): If modifying the backend.

### Fabric Binaries
You must have the Hyperledger Fabric binaries (`peer`, `configtxgen`, `cryptogen`, `osnadmin`) installed.
1.  Download Fabric Samples (if you haven't):
    ```bash
    curl -sSL https://bit.ly/2ysbOFE | bash -s -- 2.5.11 1.5.15
    ```
2.  Add binaries to your PATH:
    ```bash
    export PATH=<path_to_fabric_samples>/bin:$PATH
    export FABRIC_CFG_PATH=<path_to_fabric_samples>/config/
    ```

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/verichain-network.git
cd verichain-network
```

### 2. Boostrap the Network
We utilize `setup_verichain.sh` to handle the heavy lifting (Generating crypto, starting containers, creating channels).

```bash
./setup_verichain.sh
```
> **What this does**:
> *   Cleans up previous containers/volumes.
> *   Runs `cryptogen` to create identities for all 4 Orgs.
> *   Starts the Docker configuration (`docker-compose up`).
> *   Joins all peers to `verichain-channel`.

### 3. Verification & Testing
To confirm the network is healthy and Privacy features are working:

```bash
./verify_pdc.sh
```

This script will automatically:
1.  **Deploy** the `verichain-contract` smart contract.
2.  **Verify** that Org1 can create private assets.
3.  **Confirm** that Org2 is BLOCKED from reading Org1's data (PDC Isolation).

## 🏗️ Architecture

### Network Topology
*   **Consensus**: Raft (EtcdRaft)
*   **Peers**: 4 Organizations (Agri, Pharma, Org3, Org4).
*   **Channel**: `verichain-channel`.

### Privacy Model (PDC)
We use SideDBs to ensure data privacy:
*   **`AgriCollection`**: Visible only to Agri (Org1) + Auditors.
*   **`PharmaCollection`**: Visible only to Pharma (Org2) + Auditors.

### Shardeum Contract Verification
The ZK-Proof Notary Contract is deployed on the Shardeum Sphinx Dappnet.
*   **Contract Address**: `0xd38AAAD7EDC17C3A46c3570A757fbfa13A04E1fa`
*   **Explorer Link**: [View on Shardeum Explorer](https://explorer-sphinx.shardeum.org/account/0xd38AAAD7EDC17C3A46c3570A757fbfa13A04E1fa)

## 🌐 Frontend Application (Powered by ThinkRoot)

The VeriChain frontend is a production-ready React application built using **[ThinkRoot](https://thinkroot.app/)**, a premier platform for rapid and scalable web application development. ThinkRoot is a key sponsor of this project, enabling us to deliver a high-quality user experience.

*   **Live Demo**: [https://verichain-v5mklw.thinkroot.app/](https://verichain-v5mklw.thinkroot.app/)
*   **Specification**: [Frontend Spec](docs/frontend_spec.md)

We leveraged ThinkRoot to rapidly prototype and deploy the interface for Pharma Manufacturers, Distributors, and Retailers.

![alt text](image.png)

![alt text](image-1.png)

## 📂 Project Structure

```
verichain-network/
├── chaincode/                 # Smart Contract Source (Node.js)
├── verichain-api/             # Backend API (Express/Fabric-Gateway)
├── collections_config.json    # Privacy Policy Definitions
├── scripts/                   # Helper scripts (envVar, utils)
├── setup_verichain.sh         # Network Infrastructure Setup
├── deploy_contract.sh         # Smart Contract Deployment
└── verify_pdc.sh              # E2E Testing Suite
```

## 🛠️ Troubleshooting

**"cryptogen not found"**:
Ensure your `PATH` includes the Fabric `bin` directory.
```bash
export PATH=${PWD}/../bin:$PATH
```

**"Permission Denied" on Config**:
If you see errors related to `msp/keystore` permissions:
```bash
sudo chown -R $USER:$USER ../config/
```
