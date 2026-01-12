import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import { LogIn, User, Building2 } from 'lucide-react';

const DEMO_ACCOUNTS = [
    { label: 'Farmer (Org1)', userId: 'admin', orgName: 'Org1' },
    { label: 'Pharma (Org2)', userId: 'admin-org2-cert', orgName: 'Org2' }
];

export default function Login() {
    const [userId, setUserId] = useState('');
    const [orgName, setOrgName] = useState('Org1');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await authAPI.login(userId, orgName);
            login(response.data.token);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Please try again.');
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
            const response = await authAPI.login(demo.userId, demo.orgName);
            login(response.data.token);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Demo login failed.');
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
                            <label className="form-label">
                                <User size={14} style={{ display: 'inline', marginRight: '0.5rem' }} />
                                User ID
                            </label>
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
                            <label className="form-label">
                                <Building2 size={14} style={{ display: 'inline', marginRight: '0.5rem' }} />
                                Organization
                            </label>
                            <select
                                className="form-input"
                                value={orgName}
                                onChange={(e) => setOrgName(e.target.value)}
                            >
                                <option value="Org1">Org1 - Agriculture</option>
                                <option value="Org2">Org2 - Pharmaceutical</option>
                            </select>
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                            <LogIn size={18} />
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--color-border)' }}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center', marginBottom: '1rem' }}>
                            Quick Demo Access
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {DEMO_ACCOUNTS.map((demo) => (
                                <button
                                    key={demo.label}
                                    type="button"
                                    className="btn btn-secondary"
                                    style={{ flex: 1, fontSize: '0.75rem' }}
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
