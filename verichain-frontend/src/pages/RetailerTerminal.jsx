import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { transitAPI } from '../services/api';

const INVENTORY_KEY = 'verichain_retailer_inventory';

export default function RetailerTerminal() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('pending');
    const [verifying, setVerifying] = useState(null);
    const [pendingShipments, setPendingShipments] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [verificationResults, setVerificationResults] = useState({});
    const [error, setError] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        // Load pending shipments (from manufacturers)
        const allAssets = [];
        ['Org1', 'Org2'].forEach(org => {
            const stored = localStorage.getItem(`verichain_assets_${org}`);
            if (stored) {
                try {
                    const assets = JSON.parse(stored);
                    allAssets.push(...assets.map(a => ({ ...a, fromOrg: org })));
                } catch (e) { }
            }
        });

        // Load inventory (accepted items)
        const storedInventory = localStorage.getItem(INVENTORY_KEY);
        const inventoryItems = storedInventory ? JSON.parse(storedInventory) : [];
        setInventory(inventoryItems);

        // Filter out already accepted items from pending
        const inventoryIds = new Set(inventoryItems.map(item => item.ID || item.assetId));
        const pending = allAssets.filter(asset => !inventoryIds.has(asset.ID || asset.assetId));

        setPendingShipments(pending.slice(0, 20));
    };

    const handleVerifyAndAccept = async (shipment) => {
        const batchId = shipment.ID || shipment.assetId;
        setVerifying(batchId);
        setError('');

        try {
            const response = await transitAPI.verify(batchId);

            setVerificationResults(prev => ({
                ...prev,
                [batchId]: {
                    success: response.data.verified,
                    data: response.data
                }
            }));

            if (response.data.verified) {
                setPendingShipments(prev =>
                    prev.map(s =>
                        (s.ID || s.assetId) === batchId
                            ? { ...s, verified: true }
                            : s
                    )
                );
            }
        } catch (err) {
            if (err.response?.status === 404) {
                setVerificationResults(prev => ({
                    ...prev,
                    [batchId]: {
                        success: false,
                        pending: true,
                        message: 'Transit data not available'
                    }
                }));
            } else {
                setError(err.response?.data?.error || 'Verification failed');
            }
        } finally {
            setVerifying(null);
        }
    };

    const handleConfirmStock = (shipment) => {
        const batchId = shipment.ID || shipment.assetId;

        // Add to inventory
        const inventoryItem = {
            ...shipment,
            acceptedAt: new Date().toISOString(),
            status: 'STOCKED'
        };

        const updatedInventory = [inventoryItem, ...inventory];
        setInventory(updatedInventory);
        localStorage.setItem(INVENTORY_KEY, JSON.stringify(updatedInventory));

        // Remove from pending
        setPendingShipments(prev => prev.filter(s => (s.ID || s.assetId) !== batchId));

        // Clear verification results for this item
        setVerificationResults(prev => {
            const newResults = { ...prev };
            delete newResults[batchId];
            return newResults;
        });
    };

    return (
        <div className="page">
            <div className="container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h1 className="page-title">Retailer Terminal</h1>
                        <p className="page-subtitle">Hospital/Pharmacy · {user?.orgName || 'Org4'}</p>
                    </div>
                    <button className="btn btn-secondary" onClick={loadData}>
                        Refresh
                    </button>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                    <button
                        className={`btn ${activeTab === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveTab('pending')}
                    >
                        Pending Shipments ({pendingShipments.length})
                    </button>
                    <button
                        className={`btn ${activeTab === 'inventory' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveTab('inventory')}
                    >
                        Inventory ({inventory.length})
                    </button>
                </div>

                <div className="card">
                    {activeTab === 'pending' ? (
                        <>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>
                                Pending Shipments
                            </h2>

                            {pendingShipments.length === 0 ? (
                                <div className="empty-state">
                                    <h3 className="empty-state-title">No Pending Shipments</h3>
                                    <p>New shipments will appear here</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {pendingShipments.map((shipment) => {
                                        const batchId = shipment.ID || shipment.assetId;
                                        const result = verificationResults[batchId];
                                        const isVerified = result?.success;
                                        const isPending = result?.pending;

                                        return (
                                            <div
                                                key={batchId}
                                                className="card"
                                                style={{
                                                    background: isVerified ? '#f0fdf4' : 'white',
                                                    borderColor: isVerified ? 'var(--color-success)' : 'var(--color-border)'
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                                    <strong style={{ fontSize: '1rem' }}>{batchId}</strong>
                                                    <span className={`badge ${isVerified ? 'badge-success' : 'badge-neutral'}`}>
                                                        {isVerified ? 'VERIFIED' : 'PENDING'}
                                                    </span>
                                                </div>

                                                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                                                    <div>Drug: {shipment.drugName || 'Unknown'}</div>
                                                    <div>From: {shipment.manufacturer || shipment.fromOrg}</div>
                                                    <div>Batch Size: {shipment.batchSize?.toLocaleString() || 'N/A'} units</div>
                                                </div>

                                                {result && (
                                                    <div className={`alert ${isVerified ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: '1rem' }}>
                                                        {isVerified ? (
                                                            <>
                                                                <strong>Thermal Compliance Verified</strong>
                                                                <div style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
                                                                    Range: {result.data.stats?.min}°C - {result.data.stats?.max}°C
                                                                </div>
                                                            </>
                                                        ) : isPending ? (
                                                            <span>{result.message}</span>
                                                        ) : (
                                                            <span>Verification failed</span>
                                                        )}
                                                    </div>
                                                )}

                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    {!isVerified && (
                                                        <button
                                                            className="btn btn-primary"
                                                            onClick={() => handleVerifyAndAccept(shipment)}
                                                            disabled={verifying === batchId}
                                                        >
                                                            {verifying === batchId ? 'Verifying...' : 'Verify'}
                                                        </button>
                                                    )}

                                                    {isVerified && (
                                                        <button
                                                            className="btn btn-primary"
                                                            style={{ background: 'var(--color-success)' }}
                                                            onClick={() => handleConfirmStock(shipment)}
                                                        >
                                                            Accept to Inventory
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>
                                Current Inventory
                            </h2>

                            {inventory.length === 0 ? (
                                <div className="empty-state">
                                    <h3 className="empty-state-title">No Items in Inventory</h3>
                                    <p>Accepted shipments will appear here</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {inventory.map((item) => {
                                        const batchId = item.ID || item.assetId;
                                        return (
                                            <div key={batchId} className="card" style={{ background: '#ecfdf5', borderColor: 'var(--color-success)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                                    <strong style={{ fontSize: '1rem' }}>{batchId}</strong>
                                                    <span className="badge badge-success">STOCKED</span>
                                                </div>

                                                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                                    <div>Drug: {item.drugName}</div>
                                                    <div>Manufacturer: {item.manufacturer || item.fromOrg}</div>
                                                    <div>Batch Size: {item.batchSize?.toLocaleString()} units</div>
                                                    <div>Accepted: {new Date(item.acceptedAt).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
