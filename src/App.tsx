import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { initTelegramWebApp } from './services/telegram/telegramService';

// Public Luxury Pages
import { HomePage } from './pages/public/HomePage';
import { ShopPage } from './pages/public/ShopPage';
import { CollectionsPage } from './pages/public/CollectionsPage';
import { ProductDetailPage } from './pages/public/ProductDetailPage';
import { BrandInfoPage } from './pages/public/BrandInfoPage';

// Admin Pages & Layout
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';

export function App() {
  useEffect(() => {
    // Initialize Telegram Mini App viewport & theme expansion if inside Telegram
    initTelegramWebApp();
  }, []);

  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Luxury Boutique Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/catalogue" element={<ShopPage />} />
          <Route path="/collections" element={<CollectionsPage />} />
          <Route path="/brand" element={<BrandInfoPage />} />
          <Route path="/maison" element={<BrandInfoPage />} />
          <Route path="/contact" element={<BrandInfoPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          
          {/* Legacy fallback routes preserved for compatibility */}
          <Route path="/profiles" element={<ShopPage />} />
          <Route path="/profile/:id" element={<ProductDetailPage />} />

          {/* Admin Authentication */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Protected Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="products" element={<AdminDashboardPage />} />
            <Route path="categories" element={<AdminDashboardPage />} />
            <Route path="brand" element={<AdminDashboardPage />} />
            <Route path="*" element={<AdminDashboardPage />} />
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
