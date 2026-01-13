import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { transitAPI } from '../services/api';

export default function RetailerTerminal() {
    const { user } = useAuth();
    const [verifying, setVerifying] = useState(null);
    const [pendingShipments, setPendingShipments] = useState([]);
    const [verificationResults, setVerificationResults] = useState({});
    const [error, setError] = useState('');

    // Load pending shipments from localStorage (in production: API call)
    useEffect(() => {
        loadPendingShipments();
    }, []);

    const loadPendingShipments = () => {
        // Simulate loading shipments that have been dispatched
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

        // Filter for recent assets as "pending shipments"
        setPendingShipments(allAssets.slice(0, 10));
    };

    const handleVerifyAndAccept = async (shipment) => {
        const batchId = shipment.ID || shipment.assetId;
        setVerifying(batchId);
        setError('');

        try {
            // Verify the ZK proof
            const response = await transitAPI.verify(batchId);

            setVerificationResults(prev => ({
                ...prev,
                [batchId]: {
                    success: response.data.verified,
                    data: response.data
                }
            }));

            if (response.data.verified) {
                // Update shipment status
                setPendingShipments(prev =>
                    prev.map(s =>
                        (s.ID || s.assetId) === batchId
                            ? { ...s, status: 'VERIFIED', verified: true }
                            : s
                    )
                );
            }
        } catch (err) {
            // If no transit data, check if it's a valid batch
            if (err.response?.status === 404) {
                setVerificationResults(prev => ({
                    ...prev,
                    [batchId]: {
                        success: false,
                        pending: true,
                        message: 'Transit data not yet available - awaiting distributor'
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
        setPendingShipments(prev =>
            prev.map(s =>
                (s.ID || s.assetId) === batchId
                    ? { ...s, status: 'STOCKED', confirmed: true }
                    : s
            )
        );
    };

    return (
        <div className="page">
            <div className="container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h1 className="page-title">Retailer Terminal</h1>
                        <p className="page-subtitle">Hospital/Pharmacy Receiving · {user?.orgName || 'Retailer'}</p>
                    </div>
                    <button className="btn btn-secondary" onClick={loadPendingShipments}>
                        Refresh
                    </button>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                <div className="card">
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>
                        Pending Shipments
                    </h2>

                    {pendingShipments.length === 0 ? (
                        <div className="empty-state">
                            <h3 className="empty-state-title">No Pending Shipments</h3>
                            <p>Shipments will appear here when manufacturers dispatch products</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {pendingShipments.map((shipment) => {
                                const batchId = shipment.ID || shipment.assetId;
                                const result = verificationResults[batchId];
                                const isVerified = result?.success;
                                const isConfirmed = shipment.confirmed;
                                const isPending = result?.pending;

                                return (
                                    <div
                                        key={batchId}
                                        className="card"
                                        style={{
                                            background: isConfirmed ? '#ecfdf5' : (isVerified ? '#f0fdf4' : 'white'),
                                            borderColor: isVerified ? 'var(--color-success)' : 'var(--color-border)'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                            <div>
                                                <strong style={{ fontSize: '1rem' }}>{batchId}</strong>
                                            </div>
                                            <span className={`badge ${isConfirmed ? 'badge-success' : (isVerified ? 'badge-success' : 'badge-neutral')}`}>
                                                {isConfirmed ? 'STOCKED' : (isVerified ? 'VERIFIED' : (shipment.status || 'IN_TRANSIT'))}
                                            </span>
                                        </div>

                                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                                            <div>Drug: {shipment.drugName || 'Unknown'}</div>
                                            <div>From: {shipment.manufacturer || shipment.fromOrg}</div>
                                            <div>Batch Size: {shipment.batchSize?.toLocaleString() || 'N/A'} units</div>
                                        </div>

                                        {/* Verification Result */}
                                        {result && (
                                            <div
                                                className={`alert ${isVerified ? 'alert-success' : 'alert-error'}`}
                                                style={{ marginBottom: '1rem' }}
                                            >
                                                {isVerified ? (
                                                    <>
                                                        <strong>Math-Verified: 100% Thermal Compliance</strong>
                                                        <div style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
                                                            ZK proof validated · {result.data.stats?.min}°C - {result.data.stats?.max}°C
                                                        </div>
                                                    </>
                                                ) : isPending ? (
                                                    <span>{result.message}</span>
                                                ) : (
                                                    <span>Verification failed</span>
                                                )}
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            {!isVerified && !isConfirmed && (
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={() => handleVerifyAndAccept(shipment)}
                                                    disabled={verifying === batchId}
                                                >
                                                    {verifying === batchId ? 'Verifying...' : 'Verify & Accept'}
                                                </button>
                                            )}

                                            {isVerified && !isConfirmed && (
                                                <button
                                                    className="btn btn-primary"
                                                    style={{ background: 'var(--color-success)' }}
                                                    onClick={() => handleConfirmStock(shipment)}
                                                >
                                                    Confirm Stock
                                                </button>
                                            )}

                                            {isConfirmed && (
                                                <span style={{ color: 'var(--color-success)', fontWeight: 500 }}>
                                                    Added to Inventory
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
