import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem('verichain_token');
        if (storedToken) {
            try {
                const decoded = jwtDecode(storedToken);
                if (decoded.exp * 1000 > Date.now()) {
                    setToken(storedToken);
                    setUser({
                        userId: decoded.userId,
                        orgName: decoded.orgName,
                        role: decoded.role
                    });
                } else {
                    localStorage.removeItem('verichain_token');
                }
            } catch (err) {
                localStorage.removeItem('verichain_token');
            }
        }
        setLoading(false);
    }, []);

    const login = (newToken) => {
        localStorage.setItem('verichain_token', newToken);
        setToken(newToken);
        const decoded = jwtDecode(newToken);
        setUser({
            userId: decoded.userId,
            orgName: decoded.orgName,
            role: decoded.role
        });
    };

    const logout = () => {
        localStorage.removeItem('verichain_token');
        setToken(null);
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
        <AuthContext.Provider value={{ user, token, loading, login, logout, getCollection, isProducer }}>
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
