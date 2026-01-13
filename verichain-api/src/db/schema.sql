-- VeriChain PostgreSQL Schema
-- Stores cached/indexed data from Hyperledger Fabric

CREATE TABLE IF NOT EXISTS assets (
    id VARCHAR(64) PRIMARY KEY,
    drug_name VARCHAR(255) NOT NULL,
    cdsco_license_no VARCHAR(100),
    batch_size INTEGER,
    manufacturer VARCHAR(255),
    org_name VARCHAR(10) NOT NULL,
    status VARCHAR(50) DEFAULT 'MANUFACTURED',
    created_at TIMESTAMP DEFAULT NOW(),
    hlf_tx_id VARCHAR(128)
);

CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    asset_id VARCHAR(64) NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    retailer_org VARCHAR(10) NOT NULL,
    accepted_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(asset_id, retailer_org)
);

CREATE TABLE IF NOT EXISTS transit_proofs (
    id SERIAL PRIMARY KEY,
    batch_id VARCHAR(64) NOT NULL,
    proof_hash VARCHAR(128) NOT NULL,
    min_temp DECIMAL(4,1),
    max_temp DECIMAL(4,1),
    avg_temp DECIMAL(4,1),
    readings_count INTEGER DEFAULT 30,
    in_range BOOLEAN DEFAULT TRUE,
    generated_at TIMESTAMP DEFAULT NOW(),
    verified BOOLEAN DEFAULT FALSE,
    UNIQUE(batch_id)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_assets_org ON assets(org_name);
CREATE INDEX IF NOT EXISTS idx_inventory_retailer ON inventory(retailer_org);
CREATE INDEX IF NOT EXISTS idx_proofs_batch ON transit_proofs(batch_id);
