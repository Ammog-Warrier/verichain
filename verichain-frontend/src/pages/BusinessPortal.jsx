import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { assetsAPI, transitAPI } from '../services/api';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, ReferenceLine, Area, AreaChart
} from 'recharts';

// ============= PHARMA VIEW (Mint Assets) =============
function PharmaView() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    // Form state
    const [assetId, setAssetId] = useState(`VAX-${Date.now().toString().slice(-6)}`);
    const [drugName, setDrugName] = useState('COVID-19 Vaccine');
    const [cdscoLicenseNo, setCdscoLicenseNo] = useState('CDSCO/MFG/2024/001234');
    const [batchSize, setBatchSize] = useState('10000');
    const [manufacturer, setManufacturer] = useState(user?.orgName === 'Org1' ? 'Pharma1 Ltd.' : 'Pharma2 Corp.');

    const handleMint = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const payload = {
                assetId,
                drugName,
                cdscoLicenseNo,
                batchSize: parseInt(batchSize),
                manufacturer,
                status: 'MANUFACTURED'
            };

            await assetsAPI.create(payload);

            // Store for dashboard
            const storedAssets = JSON.parse(localStorage.getItem(`verichain_assets_${user.orgName}`) || '[]');
            storedAssets.unshift({ ...payload, ID: assetId });
            localStorage.setItem(`verichain_assets_${user.orgName}`, JSON.stringify(storedAssets.slice(0, 50)));

            setSuccess(`Asset ${assetId} successfully added to Hyperledger Fabric.`);
            setAssetId(`VAX-${Date.now().toString().slice(-6)}`);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to mint asset');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                Pharmaceutical Manufacturer
            </h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
                Mint new assets to the blockchain
            </p>

            {success && <div className="alert alert-success">{success}</div>}
            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleMint}>
                <div className="grid grid-2" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
                    <div className="form-group">
                        <label className="form-label">Batch ID</label>
                        <input type="text" className="form-input" value={assetId}
                            onChange={(e) => setAssetId(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Drug Name</label>
                        <input type="text" className="form-input" value={drugName}
                            onChange={(e) => setDrugName(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">CDSCO License No.</label>
                        <input type="text" className="form-input" value={cdscoLicenseNo}
                            onChange={(e) => setCdscoLicenseNo(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Batch Size (units)</label>
                        <input type="number" className="form-input" value={batchSize}
                            onChange={(e) => setBatchSize(e.target.value)} required />
                    </div>
                </div>

                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Minting...' : 'Mint Asset'}
                </button>
            </form>
        </div>
    );
}

// ============= DISTRIBUTOR VIEW (Transit Simulation + ZK Proof) =============
function DistributorView() {
    const [batchId, setBatchId] = useState('');
    const [loading, setLoading] = useState(false);
    const [simulating, setSimulating] = useState(false);
    const [generatingProof, setGeneratingProof] = useState(false);
    const [temperatureData, setTemperatureData] = useState([]);
    const [stats, setStats] = useState(null);
    const [proofResult, setProofResult] = useState(null);
    const [error, setError] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);

    // Simulate transit with animated data points
    const handleSimulate = async () => {
        if (!batchId) {
            setError('Please enter a Batch ID');
            return;
        }

        setSimulating(true);
        setError('');
        setTemperatureData([]);
        setProofResult(null);
        setCurrentIndex(0);

        try {
            const response = await transitAPI.simulate(batchId);
            const readings = response.data.readings;

            // Animate data points appearing one by one
            for (let i = 0; i < readings.length; i++) {
                await new Promise(resolve => setTimeout(resolve, 100));
                setTemperatureData(prev => [...prev, {
                    index: i + 1,
                    temperature: readings[i].temperature,
                    time: new Date(readings[i].timestamp).toLocaleTimeString()
                }]);
                setCurrentIndex(i + 1);
            }

            setStats(response.data.stats);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to simulate transit');
        } finally {
            setSimulating(false);
        }
    };

    // Generate ZK Proof
    const handleGenerateProof = async () => {
        setGeneratingProof(true);
        setError('');

        try {
            const response = await transitAPI.generateProof(batchId);
            setProofResult(response.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to generate proof');
        } finally {
            setGeneratingProof(false);
        }
    };

    return (
        <div className="card">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                Cold Chain Distributor
            </h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
                Monitor transit and generate compliance proofs
            </p>

            {error && <div className="alert alert-error">{error}</div>}

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Batch ID to Monitor</label>
                    <input
                        type="text"
                        className="form-input"
                        value={batchId}
                        onChange={(e) => setBatchId(e.target.value)}
                        placeholder="e.g., VAX-123456"
                    />
                </div>
                <button
                    className="btn btn-secondary"
                    onClick={handleSimulate}
                    disabled={simulating || !batchId}
                    style={{ alignSelf: 'flex-end' }}
                >
                    {simulating ? 'Simulating...' : 'Simulate Transit'}
                </button>
            </div>

            {/* Temperature Chart */}
            {temperatureData.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Live Temperature Monitoring</h3>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                Stored in Private Data Collection (PDC) – Hidden from Public
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem' }}>
                            <span>Readings: {currentIndex}/30</span>
                            {stats && (
                                <>
                                    <span>Min: {stats.min}°C</span>
                                    <span>Max: {stats.max}°C</span>
                                    <span className={`badge ${stats.inRange ? 'badge-success' : 'badge-error'}`}>
                                        {stats.inRange ? 'COMPLIANT' : 'BREACH'}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={temperatureData}>
                            <defs>
                                <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="index" stroke="#6b7280" />
                            <YAxis domain={[0, 10]} stroke="#6b7280" tickFormatter={(v) => `${v}°C`} />
                            <Tooltip formatter={(value) => [`${value}°C`, 'Temperature']} />
                            <ReferenceLine y={2} stroke="var(--color-success)" strokeDasharray="5 5" label={{ value: 'Min 2°C', fill: 'var(--color-success)', fontSize: 12 }} />
                            <ReferenceLine y={8} stroke="var(--color-error)" strokeDasharray="5 5" label={{ value: 'Max 8°C', fill: 'var(--color-error)', fontSize: 12 }} />
                            <Area type="monotone" dataKey="temperature" stroke="var(--color-primary)" fill="url(#tempGradient)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* ZK Proof Generation */}
            {stats?.inRange && !proofResult && (
                <div style={{ textAlign: 'center', padding: '1.5rem', background: 'var(--color-bg)', borderRadius: 'var(--radius)' }}>
                    <button
                        className="btn btn-primary"
                        onClick={handleGenerateProof}
                        disabled={generatingProof}
                        style={{ padding: '1rem 2rem' }}
                    >
                        {generatingProof ? 'Generating ZK-SNARK Proof...' : 'Generate ZK-Proof & Anchor to Shardeum'}
                    </button>
                    {generatingProof && (
                        <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                            Circuit analyzing 30 temperature points...
                        </p>
                    )}
                </div>
            )}

            {/* Proof Result */}
            {proofResult && (
                <div className="alert alert-success" style={{ marginTop: '1rem' }}>
                    <strong>ZK Proof Generated Successfully</strong>
                    <div style={{ marginTop: '0.75rem', fontSize: '0.875rem' }}>
                        <div><strong>Proof Hash:</strong> <code style={{ fontSize: '0.75rem' }}>{proofResult.proofHash}</code></div>
                        <div style={{ marginTop: '0.5rem' }}>
                            Generated in {proofResult.proofTimeMs}ms · Groth16 on BN128 curve
                        </div>
                        <a
                            href={proofResult.explorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: 'inline-block', marginTop: '0.5rem' }}
                        >
                            View on Shardeum Explorer →
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}

// ============= MAIN BUSINESS PORTAL =============
export default function BusinessPortal() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState(user?.orgName === 'Org3' ? 'distributor' : 'pharma');

    const isPharma = user?.orgName === 'Org1' || user?.orgName === 'Org2';
    const isDistributor = user?.orgName === 'Org3';

    return (
        <div className="page">
            <div className="container">
                <div style={{ marginBottom: '2rem' }}>
                    <h1 className="page-title">Business Portal</h1>
                    <p className="page-subtitle">
                        {isPharma ? 'Pharmaceutical Manufacturer' : 'Cold Chain Distributor'} · {user?.orgName}
                    </p>
                </div>

                {/* Tab Navigation */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    {isPharma && (
                        <button
                            className={`btn ${activeTab === 'pharma' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setActiveTab('pharma')}
                        >
                            Mint Assets
                        </button>
                    )}
                    {(isPharma || isDistributor) && (
                        <button
                            className={`btn ${activeTab === 'distributor' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setActiveTab('distributor')}
                        >
                            Transit & Proofs
                        </button>
                    )}
                </div>

                {/* Tab Content */}
                {activeTab === 'pharma' && <PharmaView />}
                {activeTab === 'distributor' && <DistributorView />}
            </div>
        </div>
    );
}
