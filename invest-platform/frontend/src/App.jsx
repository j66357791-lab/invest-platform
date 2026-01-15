import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Home from './pages/Home';
import Market from './pages/Market';
import ProductDetail from './pages/ProductDetail';
import Wallet from './pages/Wallet';
import Profile from './pages/Profile';
import AdminDashboard from './pages/Admin/AdminDashboard';
import ProductManagement from './pages/Admin/ProductManagement';
import PriceUpdate from './pages/Admin/PriceUpdate';
import OrderAudit from './pages/Admin/OrderAudit';
import UserAudit from './pages/Admin/UserAudit';
import SystemManagement from './pages/Admin/SystemManagement';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin' || user?.role === 'superAdmin';
  return isAdmin ? children : <Navigate to="/" replace />;
};

function App() {
  return (
    <Routes>
      {/* 公开路由 */}
      <Route path="/login" element={<Login />} />
      
      {/* 受保护的路由 */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Home />} />
        <Route path="market" element={<Market />} />
        <Route path="market/:id" element={<ProductDetail />} />
        <Route path="wallet" element={<Wallet />} />
        <Route path="profile" element={<Profile />} />
        
        {/* 管理员路由 */}
        <Route
          path="admin/*"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        >
          <Route path="products" element={<ProductManagement />} />
          <Route path="price" element={<PriceUpdate />} />
          <Route path="orders" element={<OrderAudit />} />
          <Route path="users" element={<UserAudit />} />
          <Route path="system" element={<SystemManagement />} />
        </Route>
      </Route>
      
      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
