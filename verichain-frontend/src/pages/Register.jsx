import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import { UserPlus, User, Building2, Shield, ArrowLeft } from 'lucide-react';

export default function Register() {
    const [userId, setUserId] = useState('');
    const [orgName, setOrgName] = useState('Org1');
    const [role, setRole] = useState('producer');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await authAPI.register(userId, orgName, role);
            login(response.data.token);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page">
            <div className="form-page">
                <Link to="/login" className="btn btn-ghost" style={{ marginBottom: '1rem' }}>
                    <ArrowLeft size={16} />
                    Back to Login
                </Link>

                <div className="card">
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                            Create Account
                        </h1>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                            Join the VeriChain network
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
                                placeholder="Choose a unique User ID"
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

                        <div className="form-group">
                            <label className="form-label">
                                <Shield size={14} style={{ display: 'inline', marginRight: '0.5rem' }} />
                                Role
                            </label>
                            <select
                                className="form-input"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                            >
                                <option value="producer">Producer (Can create assets)</option>
                                <option value="auditor">Auditor (Read-only access)</option>
                                <option value="verifier">Verifier (Public access)</option>
                            </select>
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                            <UserPlus size={18} />
                            {loading ? 'Creating Account...' : 'Register'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
