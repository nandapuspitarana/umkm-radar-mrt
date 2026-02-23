import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Products from './pages/Products';
import Vouchers from './pages/Vouchers';
import AdminVendors from './pages/AdminVendors';
import Assets from './pages/Assets';
import Categories from './pages/Categories';
import Navigation from './pages/Navigation';
import Destinations from './pages/Destinations';
import PublikBanner from './pages/PublikBanner';
import AtmBanners from './pages/AtmBanners';
import KulinerBanners from './pages/KulinerBanners';
import NgopiBanners from './pages/NgopiBanners';
import WisataBanner from './pages/WisataBanner';
import QuickAccessBanners from './pages/QuickAccessBanners';
import WfaBanners from './pages/WfaBanners';
import FavoriteBanners from './pages/FavoriteBanners';
import StationCategories from './pages/StationCategories';
import MainMenu from './pages/MainMenu';
import TransportIcons from './pages/TransportIcons';
import SubKategori from './pages/SubKategori';
import UserManagement from './pages/UserManagement';
import AuditLogs from './pages/AuditLogs';

function PrivateRoute({ children }) {
  const auth = JSON.parse(localStorage.getItem('grocries_auth'));
  return auth ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/products"
          element={
            <PrivateRoute>
              <Products />
            </PrivateRoute>
          }
        />
        <Route
          path="/vouchers"
          element={
            <PrivateRoute>
              <Vouchers />
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <Settings />
            </PrivateRoute>
          }
        />
        <Route
          path="/vendors"
          element={
            <PrivateRoute>
              <AdminVendors />
            </PrivateRoute>
          }
        />
        <Route
          path="/assets"
          element={
            <PrivateRoute>
              <Assets />
            </PrivateRoute>
          }
        />
        <Route
          path="/categories"
          element={
            <PrivateRoute>
              <Categories />
            </PrivateRoute>
          }
        />
        <Route
          path="/navigation"
          element={
            <PrivateRoute>
              <Navigation />
            </PrivateRoute>
          }
        />
        <Route
          path="/destinations"
          element={
            <PrivateRoute>
              <Destinations />
            </PrivateRoute>
          }
        />
        <Route
          path="/publik-banner"
          element={
            <PrivateRoute>
              <PublikBanner />
            </PrivateRoute>
          }
        />
        <Route
          path="/atm-banners"
          element={
            <PrivateRoute>
              <AtmBanners />
            </PrivateRoute>
          }
        />
        <Route
          path="/kuliner-banners"
          element={
            <PrivateRoute>
              <KulinerBanners />
            </PrivateRoute>
          }
        />
        <Route
          path="/ngopi-banners"
          element={
            <PrivateRoute>
              <NgopiBanners />
            </PrivateRoute>
          }
        />
        <Route
          path="/wisata-banner"
          element={
            <PrivateRoute>
              <WisataBanner />
            </PrivateRoute>
          }
        />
        <Route
          path="/quick-access-banners"
          element={
            <PrivateRoute>
              <QuickAccessBanners />
            </PrivateRoute>
          }
        />
        <Route
          path="/wfa-banners"
          element={
            <PrivateRoute>
              <WfaBanners />
            </PrivateRoute>
          }
        />
        <Route
          path="/favorite-banners"
          element={
            <PrivateRoute>
              <FavoriteBanners />
            </PrivateRoute>
          }
        />
        <Route
          path="/station-categories"
          element={
            <PrivateRoute>
              <StationCategories />
            </PrivateRoute>
          }
        />
        <Route
          path="/main-menu"
          element={
            <PrivateRoute>
              <MainMenu />
            </PrivateRoute>
          }
        />
        <Route
          path="/transport-icons"
          element={
            <PrivateRoute>
              <TransportIcons />
            </PrivateRoute>
          }
        />
        <Route
          path="/sub-kategori"
          element={
            <PrivateRoute>
              <SubKategori />
            </PrivateRoute>
          }
        />
        <Route
          path="/users"
          element={
            <PrivateRoute>
              <UserManagement />
            </PrivateRoute>
          }
        />
        <Route
          path="/audit-logs"
          element={
            <PrivateRoute>
              <AuditLogs />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
