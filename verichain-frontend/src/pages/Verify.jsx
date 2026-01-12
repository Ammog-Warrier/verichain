import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { assetsAPI, authAPI } from '../services/api';
import { CheckCircle, AlertCircle, Search, ArrowLeft } from 'lucide-react';

export default function Verify() {
    const { assetId: urlAssetId } = useParams();
    const [assetId, setAssetId] = useState(urlAssetId || '');
    const [asset, setAsset] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { user, login, token } = useAuth();
    const navigate = useNavigate();

    const performGuestLogin = async () => {
        if (token) return;
        try {
            const response = await authAPI.login('OrgAdmin', 'Org1');
            login(response.data.token);
        } catch {
            // Guest login failed - user will need to login manually
        }
    };

    const searchAsset = async (id) => {
        if (!id) return;

        setLoading(true);
        setError('');
        setAsset(null);

        // Ensure we have a token for the public endpoint
        if (!token) {
            await performGuestLogin();
        }

        try {
            const response = await assetsAPI.getPublic(id);
            setAsset(response.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Asset not found. Please check the ID and try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (urlAssetId) {
            searchAsset(urlAssetId);
        }
    }, [urlAssetId]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (assetId) {
            navigate(`/verify/${assetId}`);
        }
    };

    return (
        <div className="page">
            <div className="container">
                <Link to="/" className="btn btn-ghost" style={{ marginBottom: '1rem' }}>
                    <ArrowLeft size={16} />
                    Back to Home
                </Link>

                <div className="verify-result">
                    <div className="verify-header">
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                            Verify Product
                        </h1>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                            Enter an asset ID to verify its authenticity
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="text"
                                className="form-input"
                                value={assetId}
                                onChange={(e) => setAssetId(e.target.value)}
                                placeholder="Enter Asset ID (e.g., asset_1768...)"
                                style={{ flex: 1 }}
                            />
                            <button type="submit" className="btn btn-primary" disabled={loading || !assetId}>
                                <Search size={18} />
                            </button>
                        </div>
                    </form>

                    {loading && (
                        <div className="loading">
                            <div className="spinner"></div>
                        </div>
                    )}

                    {error && (
                        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
                            <AlertCircle size={48} style={{ color: 'var(--color-error)', marginBottom: '1rem' }} />
                            <p style={{ color: 'var(--color-error)' }}>{error}</p>
                        </div>
                    )}

                    {asset && (
                        <>
                            <div className="verify-status">
                                <CheckCircle size={20} />
                                Verified on Blockchain
                            </div>
                            <p className="verify-id">{asset.ID}</p>

                            <div className="verify-details" style={{ marginTop: '1.5rem' }}>
                                <div className="verify-row">
                                    <span className="verify-label">Type</span>
                                    <span className="verify-value">{asset.docType === 'agri' ? 'Agriculture' : 'Pharmaceutical'}</span>
                                </div>
                                <div className="verify-row">
                                    <span className="verify-label">Status</span>
                                    <span className="verify-value">
                                        <span className="badge badge-success">{asset.Status || asset.status}</span>
                                    </span>
                                </div>
                                <div className="verify-row">
                                    <span className="verify-label">Collection</span>
                                    <span className="verify-value">{asset.Collection}</span>
                                </div>
                                <div className="verify-row">
                                    <span className="verify-label">Submitted By</span>
                                    <span className="verify-value">{asset.Submitter}</span>
                                </div>
                            </div>

                            <p style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                                This record is immutably stored on a Hyperledger Fabric blockchain network.
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
