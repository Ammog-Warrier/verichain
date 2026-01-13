import { createContext, useContext, useState, useEffect } from 'react';
import api, { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check session via /api/me on mount
    useEffect(() => {
        const checkSession = async () => {
            try {
                const response = await api.get('/me');
                setUser(response.data.user);
            } catch (err) {
                // Not logged in or session expired
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        checkSession();
    }, []);

    const login = async (userId, orgName) => {
        const response = await authAPI.login(userId, orgName);
        // Server sets HTTP-only cookie, we just need user data
        setUser(response.data.user);
        return response;
    };

    const logout = async () => {
        try {
            await api.post('/logout');
        } catch (err) {
            // Ignore errors
        }
        setUser(null);
    };

    const getCollection = () => {
        if (!user) return null;
        const collectionMap = {
            'Org1': 'Pharma1Collection',
            'Org2': 'Pharma2Collection',
            'Org3': 'DistributorCollection',
            'Org4': 'RetailerCollection'
        };
        return collectionMap[user.orgName] || 'Pharma1Collection';
    };

    const isProducer = () => {
        return user?.role === 'admin' || user?.role === 'producer' || user?.role === 'distributor' || user?.role === 'retailer';
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, getCollection, isProducer }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
