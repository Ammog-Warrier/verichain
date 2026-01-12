import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, LayoutDashboard, LogOut, Package } from 'lucide-react';

export default function Header() {
    const { user, logout } = useAuth();
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    return (
        <header className="header">
            <div className="container">
                <div className="header-inner">
                    <Link to="/" className="logo" style={{ textDecoration: 'none' }}>
                        <div className="logo-icon">
                            <Shield size={16} />
                        </div>
                        VeriChain
                    </Link>

                    <nav className="nav">
                        <Link to="/verify" className={`nav-link ${isActive('/verify') ? 'active' : ''}`}>
                            <Package size={16} style={{ marginRight: '0.25rem' }} />
                            Verify
                        </Link>

                        {user ? (
                            <>
                                <Link to="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}>
                                    <LayoutDashboard size={16} style={{ marginRight: '0.25rem' }} />
                                    Dashboard
                                </Link>
                                <div className="user-menu">
                                    <div className="user-info">
                                        <div className="user-name">{user.userId}</div>
                                        <div className="user-org">{user.orgName}</div>
                                    </div>
                                    <button className="btn btn-ghost" onClick={logout} style={{ padding: '0.5rem' }}>
                                        <LogOut size={18} />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <Link to="/login" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
                                Login
                            </Link>
                        )}
                    </nav>
                </div>
            </div>
        </header>
    );
}
