import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Package, ArrowRight } from 'lucide-react';

export default function Home() {
    const { user } = useAuth();

    return (
        <div className="hero">
            <div className="logo-icon" style={{ width: 64, height: 64, margin: '0 auto 1.5rem', fontSize: '1.5rem' }}>
                <Shield size={32} />
            </div>
            <h1 className="hero-title">VeriChain</h1>
            <p className="hero-subtitle">
                Verify the authenticity and cold-chain compliance of pharmaceutical products with blockchain-backed ZK-proofs and real-time tracking.
            </p>
            <div className="hero-actions">
                <Link to="/verify" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1rem' }}>
                    <Package size={20} />
                    Verify Product
                </Link>
                {user ? (
                    <Link to="/dashboard" className="btn btn-secondary" style={{ padding: '1rem 2rem', fontSize: '1rem' }}>
                        Go to Dashboard
                        <ArrowRight size={20} />
                    </Link>
                ) : (
                    <Link to="/login" className="btn btn-secondary" style={{ padding: '1rem 2rem', fontSize: '1rem' }}>
                        Partner Login
                        <ArrowRight size={20} />
                    </Link>
                )}
            </div>
        </div>
    );
}
