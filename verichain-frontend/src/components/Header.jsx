import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, LayoutDashboard, LogOut, Package, Building2, ShoppingBag, Globe } from 'lucide-react';

export default function Header() {
    const { user, logout } = useAuth();
    const location = useLocation();

    const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

    // Determine user role for conditional nav items
    const isPharmaOrDistributor = user?.orgName === 'Org1' || user?.orgName === 'Org2' || user?.orgName === 'Org3';
    const isRetailer = user?.orgName === 'Org4';

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
                        <Link to="/public" className={`nav-link ${isActive('/public') ? 'active' : ''}`}>
                            <Globe size={16} style={{ marginRight: '0.25rem' }} />
                            Public Verify
                        </Link>

                        {user ? (
                            <>
                                {isPharmaOrDistributor && (
                                    <Link to="/portal" className={`nav-link ${isActive('/portal') ? 'active' : ''}`}>
                                        <Building2 size={16} style={{ marginRight: '0.25rem' }} />
                                        Business Portal
                                    </Link>
                                )}

                                {(isRetailer || isPharmaOrDistributor) && (
                                    <Link to="/retailer" className={`nav-link ${isActive('/retailer') ? 'active' : ''}`}>
                                        <ShoppingBag size={16} style={{ marginRight: '0.25rem' }} />
                                        Retailer
                                    </Link>
                                )}

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
