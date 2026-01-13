import { useState } from 'react';
import { transitAPI } from '../services/api';

export default function PublicVerify() {
    const [batchId, setBatchId] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const handleVerify = async (e) => {
        e?.preventDefault();
        if (!batchId.trim()) return;

        setLoading(true);
        setError('');
        setResult(null);

        try {
            const response = await transitAPI.publicVerify(batchId.trim());
            setResult(response.data);
        } catch (err) {
            if (err.response?.status === 404) {
                setResult({
                    verified: false,
                    status: 'NOT_FOUND',
                    message: 'Batch not found in the verification system'
                });
            } else if (err.response?.status === 400) {
                setResult({
                    verified: false,
                    status: 'PENDING',
                    message: err.response.data.message || 'Verification pending'
                });
            } else {
                setError('Unable to connect to verification service');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleScanQR = () => {
        // Placeholder for QR scanning
        alert('QR Scanner would open here. For demo, enter Batch ID manually.');
    };

    return (
        <div className="page">
            <div className="container" style={{ maxWidth: '600px' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
                        VeriChain
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>
                        Pharmaceutical Verification Portal
                    </p>
                </div>

                {/* Search Box */}
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                        Verify Your Medicine
                    </h2>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                        Enter the Batch ID from your medicine package to verify its authenticity and cold-chain compliance.
                    </p>

                    <form onSubmit={handleVerify}>
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <input
                                type="text"
                                value={batchId}
                                onChange={(e) => setBatchId(e.target.value)}
                                placeholder="Enter Batch ID (e.g., VAX-123456)"
                                className="form-input"
                                style={{ fontSize: '1rem' }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading || !batchId.trim()}
                                style={{ flex: 1 }}
                            >
                                {loading ? 'Verifying...' : 'Verify'}
                            </button>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={handleScanQR}
                            >
                                Scan QR
                            </button>
                        </div>
                    </form>

                    {error && (
                        <div className="alert alert-error" style={{ marginTop: '1rem' }}>
                            {error}
                        </div>
                    )}
                </div>

                {/* Result Display */}
                {result && (
                    <div className="card" style={{
                        background: result.verified ? '#ecfdf5' : '#fef2f2',
                        borderColor: result.verified ? 'var(--color-success)' : 'var(--color-error)'
                    }}>
                        {result.verified ? (
                            <>
                                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                                    <div style={{
                                        width: '64px',
                                        height: '64px',
                                        borderRadius: '50%',
                                        background: 'var(--color-success)',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '2rem',
                                        margin: '0 auto 1rem'
                                    }}>✓</div>
                                    <h2 style={{ fontSize: '1.5rem', color: 'var(--color-success)', marginBottom: '0.25rem' }}>
                                        Certified Safe
                                    </h2>
                                    <p style={{ color: 'var(--color-text-muted)' }}>
                                        Batch {result.batchId}
                                    </p>
                                </div>

                                <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--color-text-muted)' }}>Status</span>
                                        <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>{result.status}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--color-text-muted)' }}>Compliance Range</span>
                                        <span>{result.complianceRange}</span>
                                    </div>
                                </div>

                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                                    <div><strong>Proof Hash:</strong></div>
                                    <code style={{ fontSize: '0.7rem', wordBreak: 'break-all' }}>
                                        {result.proofHash?.slice(0, 20)}...{result.proofHash?.slice(-10)}
                                    </code>
                                </div>

                                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                                    Verified using zero-knowledge cryptographic proof on public blockchain.
                                    Your medicine's cold-chain integrity has been mathematically proven
                                    without revealing private logistics data.
                                </p>
                            </>
                        ) : (
                            <>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{
                                        width: '64px',
                                        height: '64px',
                                        borderRadius: '50%',
                                        background: result.status === 'PENDING' ? 'var(--color-warning)' : 'var(--color-error)',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '2rem',
                                        margin: '0 auto 1rem'
                                    }}>{result.status === 'PENDING' ? '?' : '×'}</div>
                                    <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                                        {result.status === 'PENDING' ? 'Verification Pending' : 'Not Verified'}
                                    </h2>
                                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>{result.message}</p>

                                    {result.status === 'PENDING' && (
                                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                            This batch is currently in transit. Please check back later
                                            once the shipment has been verified by the distributor.
                                        </p>
                                    )}

                                    {result.status === 'NOT_FOUND' && (
                                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                            Please verify you have entered the correct Batch ID from your
                                            medicine packaging. If the issue persists, contact the manufacturer.
                                        </p>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Info Footer */}
                <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    <p>
                        <strong>How it works:</strong> This verification uses Hyperledger Fabric for
                        secure private data storage and ZK-SNARKs to prove compliance without
                        revealing sensitive supply chain information.
                    </p>
                    <p style={{ marginTop: '0.5rem' }}>
                        Powered by Hyperledger Fabric + ZK-SNARKs
                    </p>
                </div>
            </div>
        </div>
    );
}
