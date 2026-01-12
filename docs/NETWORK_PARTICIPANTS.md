# VeriChain Network Participants & Governance

This document outlines the organizational structure, roles, and access control policies of the VeriChain Hyperledger Fabric network.

## 1. Network Topology

*   **Consensus Protocol**: EtcdRaft (Crash Fault Tolerant).
*   **Channel Name**: `verichain-channel`.
*   **Ordering Service**: `OrdererOrg` (Solo/Raft node: `orderer.example.com`).

## 2. Organizations (Members)

The consortium consists of 5 distinct organizations, each with its own Membership Service Provider (MSP).

### A. Orderer Organization
*   **Name**: `OrdererOrg`
*   **MSP ID**: `OrdererMSP`
*   **Role**: Maintains the ordering service, packages transactions into blocks, and distributes them to peers. Does not hold ledger state.

### B. Peer Organizations

| Org Name | MSP ID | Domain | Role |
| :--- | :--- | :--- | :--- |
| **Org1** | `Org1MSP` | **Agriculture** | Producer/Supplier. Mints agricultural assets. |
| **Org2** | `Org2MSP` | **Pharma** | Processor/Manufacturer. Mints pharmaceutical assets. |
| **Org3** | `Org3MSP` | **Regulator/Auditor** | Verifier. Has read access to verify compliance across domains. |
| **Org4** | `Org4MSP` | **Retailer/Logistics** | Distributor. Tracks assets through the supply chain. |

## 3. Roles & Identities

Within each organization, identities are issued by the Fabric CA with specific attributes/OUs (Organizational Units).

*   **Admin (`OU=admin`)**:
    *   **Capabilities**: Install/Upgrade Chaincode, Configure Channel, Register Users.
    *   **Example**: `Admin@org1.example.com`.
*   **Peer (`OU=peer`)**:
    *   **Capabilities**: Maintain Ledger, Execute Chaincode, Endorse Transactions.
    *   **Example**: `peer0.org1.example.com`.
*   **Client (`OU=client`)**:
    *   **Capabilities**: Invoke Chaincode, Query Ledger.
    *   **Example**: `apiUser1` (The API acts on behalf of clients).
*   **Orderer (`OU=orderer`)**:
    *   **Capabilities**: Order transactions.

## 4. Access Control Policies (RBAC)

Policies are defined in `configtx.yaml` and enforced at the Channel and Application levels.

### Standard Policies
*   **Readers**: `OR('OrgMSP.admin', 'OrgMSP.peer', 'OrgMSP.client')` - Can read the ledger.
*   **Writers**: `OR('OrgMSP.admin', 'OrgMSP.client')` - Can submit transactions.
*   **Admins**: `OR('OrgMSP.admin')` - Can modify configuration.
*   **Endorsement**: `OR('OrgMSP.peer')` - Can endorse transactions.

### Channel Policies
*   **LifecycleEndorsement**: `MAJORITY Endorsement` (Requires >50% of orgs to approve chaincode definitions).
*   **BlockValidation**: `ANY Writers` (Any valid orderer can produce blocks).

## 5. Data Privacy & Isolation (Private Data Collections)

VeriChain uses **Private Data Collections (PDC)** to ensure sensitive business data is shared *only* with authorized parties, even on the same channel.

### Collection: `AgriCollection`
*   **Purpose**: Stores sensitive agricultural data (e.g., Appraised Value, Supplier Costs).
*   **Members**: `Org1` (Owner), `Org3` (Auditor), `Org4` (Distributor).
*   **Policy**: `OR('Org1MSP.member', 'Org3MSP.member', 'Org4MSP.member')`.
*   **Exclusion**: `Org2` (Pharma) **CANNOT** read this data.

### Collection: `PharmaCollection`
*   **Purpose**: Stores sensitive pharmaceutical data (e.g., Formula Secrets, Batch Costs).
*   **Members**: `Org2` (Owner), `Org3` (Auditor), `Org4` (Distributor).
*   **Policy**: `OR('Org2MSP.member', 'Org3MSP.member', 'Org4MSP.member')`.
*   **Exclusion**: `Org1` (Agri) **CANNOT** read this data.

## 6. Smart Contract (Chaincode)

*   **Name**: `verichain-contract`.
*   **Language**: Node.js.
*   **Endorsement Policy**: Default (Majority).
*   **Logic**:
    *   **CreateAsset**: Mints asset + Private Data.
    *   **ReadAsset**: Reads public data.
    *   **ReadPrivateAsset**: Reads private data (enforced by PDC policy).
    *   **VerifyAsset**: Zero-Knowledge Proof verification (Future Scope).
