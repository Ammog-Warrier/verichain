import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { assetsAPI } from '../services/api';
import { Save, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CreateAsset() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const isPharma1 = user?.orgName === 'Org1';

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Common field
    const [assetId, setAssetId] = useState(`asset_${Date.now()}`);
    const [status, setStatus] = useState('MANUFACTURED');

    // Unified Pharma fields
    const [drugName, setDrugName] = useState('');
    const [genericName, setGenericName] = useState('');
    const [dosageForm, setDosageForm] = useState('');
    const [strength, setStrength] = useState('');
    const [mfgDate, setMfgDate] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [batchSize, setBatchSize] = useState('');
    const [manufacturer, setManufacturer] = useState('');
    const [labTestResult, setLabTestResult] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        const payload = {
            assetId,
            status,
            drugName,
            genericName,
            dosageForm,
            strength,
            mfgDate,
            expiryDate,
            batchSize: parseInt(batchSize) || 0,
            manufacturer,
            labTestResult
        };

        try {
            const response = await assetsAPI.create(payload);

            // Store in localStorage for dashboard display
            const storedAssets = JSON.parse(localStorage.getItem(`verichain_assets_${user.orgName}`) || '[]');
            storedAssets.unshift({ ...payload, ID: response.data.assetId });
            localStorage.setItem(`verichain_assets_${user.orgName}`, JSON.stringify(storedAssets.slice(0, 50)));

            setSuccess(`Asset ${response.data.assetId} created successfully!`);
            setTimeout(() => navigate('/dashboard'), 1500);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create asset.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page">
            <div className="container">
                <div className="form-page">
                    <Link to="/dashboard" className="btn btn-ghost" style={{ marginBottom: '1rem' }}>
                        <ArrowLeft size={16} />
                        Back to Dashboard
                    </Link>

                    <div className="card">
                        <h1 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                            Create Pharmaceutical Asset ({isPharma1 ? 'Pharma1' : 'Pharma2'})
                        </h1>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                            Mint a new pharmaceutical asset on the blockchain
                        </p>

                        {error && <div className="alert alert-error">{error}</div>}
                        {success && <div className="alert alert-success">{success}</div>}

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Asset ID</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={assetId}
                                    onChange={(e) => setAssetId(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Status</label>
                                <select className="form-input" value={status} onChange={(e) => setStatus(e.target.value)}>
                                    <option value="MANUFACTURED">Manufactured</option>
                                    <option value="QC_PASSED">QC Passed</option>
                                    <option value="SHIPPED">Shipped</option>
                                    <option value="DELIVERED">Delivered</option>
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Drug Name</label>
                                    <input type="text" className="form-input" value={drugName} onChange={(e) => setDrugName(e.target.value)} placeholder="e.g. Paracetamol" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Generic Name</label>
                                    <input type="text" className="form-input" value={genericName} onChange={(e) => setGenericName(e.target.value)} placeholder="e.g. Acetaminophen" />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Dosage Form</label>
                                    <input type="text" className="form-input" value={dosageForm} onChange={(e) => setDosageForm(e.target.value)} placeholder="e.g. Tablet" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Strength</label>
                                    <input type="text" className="form-input" value={strength} onChange={(e) => setStrength(e.target.value)} placeholder="e.g. 500mg" />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Manufacturing Date</label>
                                    <input type="date" className="form-input" value={mfgDate} onChange={(e) => setMfgDate(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Expiry Date</label>
                                    <input type="date" className="form-input" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Batch Size</label>
                                    <input type="number" className="form-input" value={batchSize} onChange={(e) => setBatchSize(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Manufacturer</label>
                                    <input type="text" className="form-input" value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Lab Test Result</label>
                                <input type="text" className="form-input" value={labTestResult} onChange={(e) => setLabTestResult(e.target.value)} placeholder="e.g. Passed" />
                            </div>

                            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
                                <Save size={18} />
                                {loading ? 'Creating...' : 'Create Asset'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
