import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { initTelegramWebApp } from './services/telegram/telegramService';
import { purgeAllMockProductsOnce, ensureCanonicalCategories } from './services/firebase/catalog';

// Public Telegram Mini App Pages
import { HomePage } from './pages/public/HomePage';
import { ShopPage } from './pages/public/ShopPage';
import { CollectionsPage } from './pages/public/CollectionsPage';
import { ProductDetailPage } from './pages/public/ProductDetailPage';
import { BrandInfoPage } from './pages/public/BrandInfoPage';
import { CartPage } from './pages/public/CartPage';
import { ReviewsPage } from './pages/public/ReviewsPage';
import { ContactPage } from './pages/public/ContactPage';
import { ProfilePage } from './pages/public/ProfilePage';
import { CartePage } from './pages/public/CartePage';

// Admin Pages & Layout
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';

export function App() {
  useEffect(() => {
    // Initialize Telegram Mini App viewport & theme immediately
    try {
      initTelegramWebApp();
    } catch (e) {
      console.warn('Telegram init skipped:', e);
    }

    // Run non-critical background maintenance without blocking the UI thread
    const timer = setTimeout(() => {
      purgeAllMockProductsOnce().catch(console.warn);
      ensureCanonicalCategories().catch(console.warn);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* 7 Core Public Tabs matching the Visual Reference from Screenshots */}
          {/* 1. ACCUEIL */}
          <Route path="/" element={<HomePage />} />

          {/* 2. INFOS */}
          <Route path="/infos" element={<BrandInfoPage />} />
          <Route path="/brand" element={<BrandInfoPage />} />
          <Route path="/maison" element={<BrandInfoPage />} />

          {/* 3. CARTE (Screenshot 2) */}
          <Route path="/carte" element={<CartePage />} />
          <Route path="/map" element={<CartePage />} />

          {/* 4. PANIER */}
          <Route path="/panier" element={<CartPage />} />
          <Route path="/cart" element={<CartPage />} />

          {/* 5. AVIS */}
          <Route path="/avis" element={<ReviewsPage />} />
          <Route path="/reviews" element={<ReviewsPage />} />

          {/* 6. CONTACT */}
          <Route path="/contact" element={<ContactPage />} />

          {/* 7. PROFIL */}
          <Route path="/profil" element={<ProfilePage />} />
          <Route path="/profile" element={<ProfilePage />} />

          {/* Catalogue & Single Product Sheet */}
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/catalogue" element={<ShopPage />} />
          <Route path="/collections" element={<CollectionsPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />

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
