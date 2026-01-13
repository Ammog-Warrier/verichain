import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import { PrivateRoute, ProducerRoute } from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateAsset from './pages/CreateAsset';
import AssetDetail from './pages/AssetDetail';
import Verify from './pages/Verify';
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
                  <Route path="/verify" element={<Verify />} />
                  <Route path="/verify/:assetId" element={<Verify />} />

                  {/* Protected Routes */}
                  <Route element={<PrivateRoute />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/assets/:id" element={<AssetDetail />} />
                    <Route path="/portal" element={<BusinessPortal />} />
                    <Route path="/retailer" element={<RetailerTerminal />} />
                  </Route>

                  {/* Producer-Only Routes */}
                  <Route element={<ProducerRoute />}>
                    <Route path="/create" element={<CreateAsset />} />
                  </Route>
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
