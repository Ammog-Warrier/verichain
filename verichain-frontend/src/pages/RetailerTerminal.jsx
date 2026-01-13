import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { inventoryAPI, transitAPI } from '../services/api';

export default function RetailerTerminal() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('pending');
    const [verifying, setVerifying] = useState(null);
    const [pendingShipments, setPendingShipments] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [verificationResults, setVerificationResults] = useState({});
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [pendingRes, inventoryRes] = await Promise.all([
                inventoryAPI.getPending(),
                inventoryAPI.getInventory()
            ]);
            setPendingShipments(pendingRes.data || []);
            setInventory(inventoryRes.data || []);
        } catch (err) {
            console.error('Failed to load data:', err);
            setError('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (shipment) => {
        const batchId = shipment.id;
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
                    prev.map(s => s.id === batchId ? { ...s, verified: true } : s)
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

    const handleAcceptToInventory = async (shipment) => {
        const batchId = shipment.id;
        try {
            await inventoryAPI.accept(batchId);

            // Move from pending to inventory
            const acceptedItem = { ...shipment, accepted_at: new Date().toISOString() };
            setInventory(prev => [acceptedItem, ...prev]);
            setPendingShipments(prev => prev.filter(s => s.id !== batchId));

            // Clear verification result
            setVerificationResults(prev => {
                const newResults = { ...prev };
                delete newResults[batchId];
                return newResults;
            });
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to accept shipment');
        }
    };

    if (loading) {
        return (
            <div className="page">
                <div className="container">
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

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

                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                    <button
                        className={`btn ${activeTab === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveTab('pending')}
                    >
                        Pending ({pendingShipments.length})
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
                                        const batchId = shipment.id;
                                        const result = verificationResults[batchId];
                                        const isVerified = result?.success;

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
                                                    <strong>{batchId}</strong>
                                                    <span className={`badge ${isVerified ? 'badge-success' : 'badge-neutral'}`}>
                                                        {isVerified ? 'VERIFIED' : 'PENDING'}
                                                    </span>
                                                </div>

                                                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                                                    <div>Drug: {shipment.drug_name || 'Unknown'}</div>
                                                    <div>Manufacturer: {shipment.manufacturer || shipment.org_name}</div>
                                                    <div>Batch Size: {shipment.batch_size?.toLocaleString() || 'N/A'} units</div>
                                                </div>

                                                {result && (
                                                    <div className={`alert ${isVerified ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: '1rem' }}>
                                                        {isVerified ? (
                                                            <>
                                                                <strong>Thermal Compliance Verified</strong>
                                                                <div style={{ fontSize: '0.875rem' }}>
                                                                    Range: {result.data.stats?.min}°C - {result.data.stats?.max}°C
                                                                </div>
                                                            </>
                                                        ) : result.pending ? (
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
                                                            onClick={() => handleVerify(shipment)}
                                                            disabled={verifying === batchId}
                                                        >
                                                            {verifying === batchId ? 'Verifying...' : 'Verify'}
                                                        </button>
                                                    )}

                                                    {isVerified && (
                                                        <button
                                                            className="btn btn-primary"
                                                            style={{ background: 'var(--color-success)' }}
                                                            onClick={() => handleAcceptToInventory(shipment)}
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
                                    <h3 className="empty-state-title">No Items</h3>
                                    <p>Accepted shipments will appear here</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {inventory.map((item) => (
                                        <div key={item.id} className="card" style={{ background: '#ecfdf5', borderColor: 'var(--color-success)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                                <strong>{item.id}</strong>
                                                <span className="badge badge-success">STOCKED</span>
                                            </div>
                                            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                                <div>Drug: {item.drug_name}</div>
                                                <div>Manufacturer: {item.manufacturer}</div>
                                                <div>Batch Size: {item.batch_size?.toLocaleString()} units</div>
                                                <div>Accepted: {new Date(item.accepted_at).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
