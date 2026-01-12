import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { assetsAPI } from '../services/api';
import { ArrowLeft, QrCode, Download } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

export default function AssetDetail() {
    const { id } = useParams();
    const { user, getCollection } = useAuth();
    const [asset, setAsset] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showQR, setShowQR] = useState(false);

    const isAgri = user?.orgName === 'Org1';
    const collection = getCollection();
    const verifyUrl = `${window.location.origin}/verify/${id}`;

    useEffect(() => {
        const fetchAsset = async () => {
            try {
                const response = await assetsAPI.getPrivate(id, collection);
                setAsset(response.data);
            } catch (err) {
                setError(err.response?.data?.error || 'Failed to load asset details.');
            } finally {
                setLoading(false);
            }
        };

        fetchAsset();
    }, [id, collection]);

    const downloadQR = () => {
        const canvas = document.getElementById('qr-code');
        if (canvas) {
            const url = canvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = url;
            a.download = `qr-${id}.png`;
            a.click();
        }
    };

    if (loading) {
        return (
            <div className="page">
                <div className="container">
                    <div className="loading">
                        <div className="spinner"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page">
                <div className="container">
                    <Link to="/dashboard" className="btn btn-ghost" style={{ marginBottom: '1rem' }}>
                        <ArrowLeft size={16} />
                        Back to Dashboard
                    </Link>
                    <div className="alert alert-error">{error}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="container">
                <div className="form-page">
                    <Link to="/dashboard" className="btn btn-ghost" style={{ marginBottom: '1rem' }}>
                        <ArrowLeft size={16} />
                        Back to Dashboard
                    </Link>

                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                            <div>
                                <h1 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                                    {asset?.ID}
                                </h1>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                                    {isAgri ? 'Agriculture' : 'Pharmaceutical'} Asset
                                </p>
                            </div>
                            <span className={`badge ${asset?.status === 'HARVESTED' || asset?.status === 'MANUFACTURED' ? 'badge-success' : 'badge-neutral'}`}>
                                {asset?.status}
                            </span>
                        </div>

                        <div className="verify-details">
                            {isAgri ? (
                                <>
                                    {asset?.cropType && <div className="verify-row"><span className="verify-label">Crop Type</span><span className="verify-value">{asset.cropType}</span></div>}
                                    {asset?.variety && <div className="verify-row"><span className="verify-label">Variety</span><span className="verify-value">{asset.variety}</span></div>}
                                    {asset?.harvestDate && <div className="verify-row"><span className="verify-label">Harvest Date</span><span className="verify-value">{asset.harvestDate}</span></div>}
                                    {asset?.farmLocation && <div className="verify-row"><span className="verify-label">Farm Location</span><span className="verify-value">{asset.farmLocation}</span></div>}
                                    {asset?.farmerName && <div className="verify-row"><span className="verify-label">Farmer Name</span><span className="verify-value">{asset.farmerName}</span></div>}
                                    {asset?.quantity && <div className="verify-row"><span className="verify-label">Quantity</span><span className="verify-value">{asset.quantity} units</span></div>}
                                    <div className="verify-row"><span className="verify-label">Organic Certified</span><span className="verify-value">{asset?.organicCertified ? 'Yes' : 'No'}</span></div>
                                    {asset?.soilPH > 0 && <div className="verify-row"><span className="verify-label">Soil pH</span><span className="verify-value">{asset.soilPH}</span></div>}
                                </>
                            ) : (
                                <>
                                    {asset?.drugName && <div className="verify-row"><span className="verify-label">Drug Name</span><span className="verify-value">{asset.drugName}</span></div>}
                                    {asset?.genericName && <div className="verify-row"><span className="verify-label">Generic Name</span><span className="verify-value">{asset.genericName}</span></div>}
                                    {asset?.dosageForm && <div className="verify-row"><span className="verify-label">Dosage Form</span><span className="verify-value">{asset.dosageForm}</span></div>}
                                    {asset?.strength && <div className="verify-row"><span className="verify-label">Strength</span><span className="verify-value">{asset.strength}</span></div>}
                                    {asset?.mfgDate && <div className="verify-row"><span className="verify-label">Mfg Date</span><span className="verify-value">{asset.mfgDate}</span></div>}
                                    {asset?.expiryDate && <div className="verify-row"><span className="verify-label">Expiry Date</span><span className="verify-value">{asset.expiryDate}</span></div>}
                                    {asset?.batchSize && <div className="verify-row"><span className="verify-label">Batch Size</span><span className="verify-value">{asset.batchSize}</span></div>}
                                    {asset?.manufacturer && <div className="verify-row"><span className="verify-label">Manufacturer</span><span className="verify-value">{asset.manufacturer}</span></div>}
                                    {asset?.labTestResult && <div className="verify-row"><span className="verify-label">Lab Test Result</span><span className="verify-value">{asset.labTestResult}</span></div>}
                                </>
                            )}
                        </div>

                        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)' }}>
                            <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => setShowQR(!showQR)}>
                                <QrCode size={18} />
                                {showQR ? 'Hide QR Code' : 'Generate QR Code'}
                            </button>

                            {showQR && (
                                <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                                    <div style={{ backgroundColor: '#fff', padding: '1rem', display: 'inline-block', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                                        <QRCodeCanvas id="qr-code" value={verifyUrl} size={200} level="H" />
                                    </div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.75rem' }}>
                                        Scan to verify this asset
                                    </p>
                                    <button className="btn btn-ghost" style={{ marginTop: '0.5rem' }} onClick={downloadQR}>
                                        <Download size={16} />
                                        Download
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
