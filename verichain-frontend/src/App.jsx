import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import { PrivateRoute } from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import BusinessPortal from './pages/BusinessPortal';
import RetailerTerminal from './pages/RetailerTerminal';
import PublicVerify from './pages/PublicVerify';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Verification - No Header, Mobile-Optimized */}
          <Route path="/public" element={<PublicVerify />} />
          <Route path="/public/:batchId" element={<PublicVerify />} />

          {/* Routes with Header */}
          <Route path="*" element={
            <>
              <Header />
              <main>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />

                  {/* Protected Routes */}
                  <Route element={<PrivateRoute />}>
                    <Route path="/portal" element={<BusinessPortal />} />
                    <Route path="/retailer" element={<RetailerTerminal />} />
                  </Route>

                  {/* Redirect old routes to portal */}
                  <Route path="/dashboard" element={<Navigate to="/portal" replace />} />
                  <Route path="/create" element={<Navigate to="/portal" replace />} />
                  <Route path="/verify" element={<Navigate to="/public" replace />} />
                  <Route path="/verify/:assetId" element={<Navigate to="/public" replace />} />
                </Routes>
              </main>
            </>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
