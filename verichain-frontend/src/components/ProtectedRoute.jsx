import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function PrivateRoute() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="loading" style={{ minHeight: '60vh' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    return user ? <Outlet /> : <Navigate to="/login" replace />;
}

export function ProducerRoute() {
    const { user, isProducer, loading } = useAuth();

    if (loading) {
        return (
            <div className="loading" style={{ minHeight: '60vh' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return isProducer() ? <Outlet /> : <Navigate to="/dashboard" replace />;
}
