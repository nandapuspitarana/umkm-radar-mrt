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
      </Routes>
    </BrowserRouter>
  );
}
