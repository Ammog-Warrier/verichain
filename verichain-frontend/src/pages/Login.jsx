import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const DEMO_ACCOUNTS = [
    { label: 'Pharma1', userId: 'pharma1-cert', orgName: 'Org1' },
    { label: 'Pharma2', userId: 'pharma2-cert', orgName: 'Org2' },
    { label: 'Distributor', userId: 'distributor-cert', orgName: 'Org3' },
    { label: 'Retailer', userId: 'retailer-cert', orgName: 'Org4' }
];

export default function Login() {
    const [userId, setUserId] = useState('');
    const [orgName, setOrgName] = useState('Org1');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();

    const getRedirectPath = (org) => {
        if (org === 'Org4') return '/retailer';
        return '/portal';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await login(userId, orgName);
            navigate(getRedirectPath(orgName));
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleDemoLogin = async (demo) => {
        setUserId(demo.userId);
        setOrgName(demo.orgName);
        setLoading(true);
        setError('');

        try {
            await login(demo.userId, demo.orgName);
            navigate(getRedirectPath(demo.orgName));
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page">
            <div className="form-page">
                <div className="card">
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                            Partner Login
                        </h1>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                            Access your organization's dashboard
                        </p>
                    </div>

                    {error && <div className="alert alert-error">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">User ID</label>
                            <input
                                type="text"
                                className="form-input"
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                placeholder="Enter your user ID"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Organization</label>
                            <select
                                className="form-input"
                                value={orgName}
                                onChange={(e) => setOrgName(e.target.value)}
                            >
                                <option value="Org1">Org1 - Pharma1 (Manufacturer)</option>
                                <option value="Org2">Org2 - Pharma2 (Manufacturer)</option>
                                <option value="Org3">Org3 - Distributor (Cold Chain)</option>
                                <option value="Org4">Org4 - Retailer (Hospital/Pharmacy)</option>
                            </select>
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--color-border)' }}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center', marginBottom: '1rem' }}>
                            Quick Demo Access
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {DEMO_ACCOUNTS.map((demo) => (
                                <button
                                    key={demo.label}
                                    type="button"
                                    className="btn btn-secondary"
                                    style={{ flex: 1, fontSize: '0.75rem', minWidth: '80px' }}
                                    onClick={() => handleDemoLogin(demo)}
                                    disabled={loading}
                                >
                                    {demo.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
