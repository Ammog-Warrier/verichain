import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { assetsAPI } from '../services/api';
import { Plus, Package, Leaf, Pill, RefreshCw } from 'lucide-react';

export default function Dashboard() {
    const { user, getCollection, isProducer } = useAuth();
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const isAgri = user?.orgName === 'Org1';
    const collection = getCollection();

    // Note: Backend doesn't have a "list all assets" endpoint yet
    // This is a placeholder showing recently created assets from localStorage
    const loadAssets = useCallback(() => {
        const storedAssets = localStorage.getItem(`verichain_assets_${user?.orgName}`);
        if (storedAssets) {
            setAssets(JSON.parse(storedAssets));
        }
    }, [user?.orgName]);

    useEffect(() => {
        loadAssets();
    }, [loadAssets]);

    const fetchAsset = async (assetId) => {
        try {
            const response = await assetsAPI.getPrivate(assetId, collection);
            return response.data;
        } catch {
            return null;
        }
    };

    return (
        <div className="page">
            <div className="container">
                <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 className="page-title">Dashboard</h1>
                        <p className="page-subtitle">
                            {isAgri ? 'Agriculture' : 'Pharmaceutical'} Assets · {user?.orgName}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {isProducer() && (
                            <Link to="/create" className="btn btn-primary">
                                <Plus size={18} />
                                Create Asset
                            </Link>
                        )}
                        <button className="btn btn-ghost" onClick={loadAssets}>
                            <RefreshCw size={16} />
                        </button>
                    </div>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                {assets.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            {isAgri ? <Leaf size={48} /> : <Pill size={48} />}
                        </div>
                        <h3 className="empty-state-title">No assets yet</h3>
                        <p>Create your first asset to get started.</p>
                        {isProducer() && (
                            <Link to="/create" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                                <Plus size={18} />
                                Create Asset
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-3">
                        {assets.map((asset) => (
                            <Link to={`/assets/${asset.ID || asset.assetId}`} key={asset.ID || asset.assetId} style={{ textDecoration: 'none' }}>
                                <div className="asset-card">
                                    <div className="asset-card-header">
                                        <div>
                                            <div className="asset-id">{asset.ID || asset.assetId}</div>
                                            <div className="asset-type">
                                                {isAgri ? asset.cropType || 'Agri' : asset.drugName || 'Pharma'}
                                            </div>
                                        </div>
                                        <span className={`badge ${asset.status === 'HARVESTED' || asset.status === 'MANUFACTURED' ? 'badge-success' : 'badge-neutral'}`}>
                                            {asset.status || 'Pending'}
                                        </span>
                                    </div>
                                    <div className="asset-card-body">
                                        {isAgri ? (
                                            <>
                                                {asset.farmLocation && <div>📍 {asset.farmLocation}</div>}
                                                {asset.quantity && <div>📦 {asset.quantity} units</div>}
                                            </>
                                        ) : (
                                            <>
                                                {asset.manufacturer && <div>🏭 {asset.manufacturer}</div>}
                                                {asset.batchSize && <div>📦 {asset.batchSize} units</div>}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {isProducer() && (
                    <Link to="/create" className="fab">
                        <Plus size={24} />
                    </Link>
                )}
            </div>
        </div>
    );
}
