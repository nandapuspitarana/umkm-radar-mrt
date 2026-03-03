import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Kuliner from './pages/Kuliner';
import Ngopi from './pages/Ngopi';
import Publik from './pages/Publik';
import Wisata from './pages/Wisata';
import DestinationDetail from './pages/DestinationDetail';
import Atm from './pages/Atm';
import Vendor from './pages/Vendor';
import TransportasiUmum from './pages/TransportasiUmum';
import CartSheet from './components/CartSheet';
import { ShoppingBag } from 'lucide-react';

import StaticPage from './pages/StaticPage';

// Default station - bisa diganti nanti via UI
const DEFAULT_STATION = 'Blok M';

export default function App() {
  const [currentVendor, setCurrentVendor] = useState(null);
  const [vendors, setVendors] = useState([]);               // flat list — Home & legacy
  const [vendorsByCategory, setVendorsByCategory] = useState({ // ✅ pre-grouped per stasiun
    kuliner: [],
    ngopi: [],
    atm: [],
    lainnya: [],
    _loaded: false,
  });
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [stationCategory, setStationCategory] = useState(() => {
    return localStorage.getItem('umkm_station') || DEFAULT_STATION;
  });

  const handleStationChange = (station) => {
    setStationCategory(station);
    localStorage.setItem('umkm_station', station);
  };

  // ── localStorage cache helper (TTL 10 menit — mirror Redis TTL backend) ──
  const CACHE_DURATION = 10 * 60 * 1000;

  const getCache = (key) => {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp > CACHE_DURATION) {
        localStorage.removeItem(key);
        return null;
      }
      return data;
    } catch {
      return null;
    }
  };

  const setCache = (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
    } catch (e) {
      console.warn('LocalStorage full or disabled', e);
    }
  };

  // ── Fetch GROUPED vendors setiap kali stasiun berubah ─────────────────────
  // Endpoint /api/vendors/grouped?station=X mengembalikan data yang sudah:
  //   1. Dikelompokkan per kategori (kuliner / ngopi / atm / lainnya)
  //   2. Disort: vendor yg dekat stasiun muncul duluan
  //   3. Di-cache di Redis 10 menit oleh backend
  // Frontend meng-mirror cache ini di localStorage (TTL sama = 10 menit).
  // Saat dashboard simpan/edit vendor → backend flush Redis → request berikutnya compute ulang.
  useEffect(() => {
    const GROUPED_KEY = `umkm_vendors_grouped_v1_${stationCategory}`;
    const FLAT_KEY = `grocries_vendors_v2_${stationCategory}`;

    // ⚡ Coba localStorage mirror dulu (instant — 0 network round-trip)
    const cachedGrouped = getCache(GROUPED_KEY);
    if (cachedGrouped && cachedGrouped._loaded) {
      setVendorsByCategory(cachedGrouped);
      const flat = [
        ...(cachedGrouped.kuliner || []),
        ...(cachedGrouped.ngopi || []),
        ...(cachedGrouped.atm || []),
        ...(cachedGrouped.lainnya || []),
      ];
      setVendors(flat);
      return;
    }

    // Fetch dari backend (backend sudah cache di Redis)
    const stationEncoded = encodeURIComponent(stationCategory);
    fetch(`/api/vendors/grouped?station=${stationEncoded}`)
      .then(res => {
        if (!res.ok) throw new Error(`grouped API ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (data && Array.isArray(data.kuliner)) {
          const grouped = {
            kuliner: data.kuliner || [],
            ngopi: data.ngopi || [],
            atm: data.atm || [],
            lainnya: data.lainnya || [],
            _loaded: true,
            _cachedAt: data._cachedAt,
          };
          setVendorsByCategory(grouped);
          setCache(GROUPED_KEY, grouped);

          // Flat list untuk Home + backward compat
          const flat = [
            ...grouped.kuliner,
            ...grouped.ngopi,
            ...grouped.atm,
            ...grouped.lainnya,
          ];
          setVendors(flat);
          if (flat.length > 0) setCache(FLAT_KEY, flat);
        } else {
          throw new Error('Grouped API returned unexpected shape');
        }
      })
      .catch(err => {
        console.warn('[App] Grouped vendors API gagal, fallback ke flat list:', err);
        // Fallback 1: localStorage flat cache
        const cachedFlat = getCache(FLAT_KEY);
        if (cachedFlat && cachedFlat.length > 0) {
          setVendors(cachedFlat);
          return;
        }
        // Fallback 2: legacy flat API
        fetch(`/api/vendors?station=${stationEncoded}`)
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data)) {
              setVendors(data);
              if (data.length > 0) setCache(FLAT_KEY, data);
            } else {
              setVendors([]);
            }
          })
          .catch(err2 => {
            console.error('[App] Failed to fetch vendors:', err2);
            setVendors([]);
          });
      });

    // Restore cart dari localstorage
    const saved = localStorage.getItem('grocries_cart');
    if (saved) setCart(JSON.parse(saved));
  }, [stationCategory]);


  // Fetch Products when a Vendor is selected
  useEffect(() => {
    if (currentVendor) {
      const cacheKey = `grocries_products_${currentVendor.id}`;
      const cachedProducts = getCache(cacheKey);

      if (cachedProducts) {
        setProducts(cachedProducts);
      } else {
        fetch(`/api/products?vendorId=${currentVendor.id}`)
          .then(res => res.json())
          .then(data => {
            setProducts(data);
            setCache(cacheKey, data);
          })
          .catch(err => console.error('Failed to fetch products:', err));
      }
    }
  }, [currentVendor]);

  useEffect(() => {
    localStorage.setItem('grocries_cart', JSON.stringify(cart));
  }, [cart]);

  const handleAddToCart = (product) => {
    setCart(prev => {
      // Multi-Vendor Check
      if (prev.length > 0 && prev[0].vendorId !== product.vendorId) {
        const confirm = window.confirm('Keranjang hanya bisa memuat produk dari satu toko. Ganti toko dan hapus keranjang saat ini?');
        if (confirm) {
          return [{ ...product, qty: 1 }];
        } else {
          return prev;
        }
      }

      const existing = prev.find(p => p.id === product.id);
      if (existing) {
        return prev.map(p => p.id === product.id ? { ...p, qty: p.qty + 1 } : p);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const handleUpdateQty = (productId, delta) => {
    setCart(prev => {
      const updated = prev.map(p =>
        p.id === productId ? { ...p, qty: Math.max(0, p.qty + delta) } : p
      );
      return updated.filter(p => p.qty > 0);
    });
  };

  const handleRemoveItem = (productId) => {
    setCart(prev => prev.filter(p => p.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
    setIsCartOpen(false);
  };

  const handleCheckout = async (name, note, voucher, discountValue) => {
    if (!currentVendor) return;

    let message = `Halo ${currentVendor.name}, saya ingin memesan:\n\n`;
    let subtotal = 0;
    cart.forEach(item => {
      const price = item.discountPrice || item.price;
      message += `- ${item.name} (${item.qty}x) = ${new Intl.NumberFormat('id-ID').format(price * item.qty)}\n`;
      subtotal += price * item.qty;
    });

    message += `\nSubtotal: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(subtotal)}`;

    if (voucher && discountValue > 0) {
      message += `\nVoucher (${voucher.code}): -${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(discountValue)}`;
    }

    const finalTotal = Math.max(0, subtotal - (discountValue || 0));
    message += `\nTotal Bayar: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(finalTotal)}`;

    message += `\n\nNama: ${name}`;
    if (note) message += `\nCatatan: ${note}`;
    message += `\n\nMohon konfirmasinya. Terima kasih!`;

    // Save Order to API
    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId: currentVendor.id,
          customer: name,
          total: finalTotal,
          items: cart.map(i => ({ ...i, finalPrice: i.discountPrice || i.price })),
          status: 'pending',
          voucherCode: voucher ? voucher.code : null,
          discount: discountValue || 0
        })
      });
    } catch (err) {
      console.error('Failed to create order:', err);
      alert('Gagal membuat pesanan di sistem, tapi akan lanjut ke WA.');
    }

    // Clear & Close
    setCart([]);
    setIsCartOpen(false);

    // Redirect ke WA
    let phone = currentVendor.whatsapp || '6281234567890';
    phone = phone.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = '62' + phone.slice(1);
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // ── Floating Cart Button (reusable) ─────────────────────────────────────
  const FloatingCart = () => cart.length > 0 && !isCartOpen ? (
    <div className="fixed bottom-6 left-0 right-0 px-4 flex justify-center z-40 pointer-events-none">
      <button
        onClick={() => setIsCartOpen(true)}
        className="bg-primary hover:bg-primary-dark text-white pl-4 pr-6 py-3 rounded-full shadow-xl shadow-blue-900/30 flex items-center gap-3 transition-transform hover:scale-105 pointer-events-auto"
      >
        <div className="bg-white/20 px-2 py-0.5 rounded text-sm font-bold">
          {cart.reduce((a, b) => a + b.qty, 0)}
        </div>
        <span className="font-bold text-sm">Lihat Keranjang</span>
        <ShoppingBag size={18} />
      </button>
    </div>
  ) : null;

  const CartLayer = () => (
    <CartSheet
      isOpen={isCartOpen}
      onClose={() => setIsCartOpen(false)}
      cart={cart}
      vendor={currentVendor}
      onCheckout={handleCheckout}
      onUpdateQty={handleUpdateQty}
      onRemoveItem={handleRemoveItem}
      onClearCart={handleClearCart}
    />
  );

  const VendorView = ({ onBack }) => (
    <Vendor
      vendor={currentVendor}
      products={products}
      onBack={onBack}
      onAddToCart={handleAddToCart}
      cart={cart}
    />
  );

  const MainView = () => (
    <div className="antialiased text-gray-800">
      {currentVendor ? (
        <VendorView onBack={() => setCurrentVendor(null)} />
      ) : (
        <Home
          vendors={vendors}
          onSelectVendor={setCurrentVendor}
          stationCategory={stationCategory}
          onStationChange={handleStationChange}
        />
      )}
      <FloatingCart />
      <CartLayer />
    </div>
  );

  return (
    <Routes>
      <Route path="/" element={<MainView />} />

      {/* ── /kuliner — menerima vendors yang sudah pre-sorted ── */}
      <Route path="/kuliner" element={
        <div className="antialiased text-gray-800">
          {currentVendor ? (
            <VendorView onBack={() => setCurrentVendor(null)} />
          ) : (
            <Kuliner
              vendors={vendorsByCategory.kuliner}
              allVendors={vendors}
              preSorted={vendorsByCategory._loaded}
              onSelectVendor={setCurrentVendor}
            />
          )}
          <FloatingCart />
          <CartLayer />
        </div>
      } />

      {/* ── /ngopi — menerima vendors yang sudah pre-sorted ── */}
      <Route path="/ngopi" element={
        <div className="antialiased text-gray-800">
          {currentVendor ? (
            <VendorView onBack={() => setCurrentVendor(null)} />
          ) : (
            <Ngopi
              vendors={vendorsByCategory.ngopi}
              allVendors={vendors}
              preSorted={vendorsByCategory._loaded}
              onSelectVendor={setCurrentVendor}
            />
          )}
          <FloatingCart />
          <CartLayer />
        </div>
      } />

      {/* ── /atm — menerima vendors yang sudah pre-sorted ── */}
      <Route path="/atm" element={
        <div className="antialiased text-gray-800">
          {currentVendor ? (
            <VendorView onBack={() => setCurrentVendor(null)} />
          ) : (
            <Atm
              vendors={vendorsByCategory.atm}
              allVendors={vendors}
              preSorted={vendorsByCategory._loaded}
              onSelectVendor={setCurrentVendor}
            />
          )}
          <FloatingCart />
          <CartLayer />
        </div>
      } />

      <Route path="/publik" element={
        <div className="antialiased text-gray-800">
          {currentVendor ? (
            <VendorView onBack={() => setCurrentVendor(null)} />
          ) : (
            <Publik vendors={vendors} onSelectVendor={setCurrentVendor} />
          )}
          <FloatingCart />
          <CartLayer />
        </div>
      } />

      <Route path="/wisata" element={<div className="antialiased text-gray-800"><Wisata /></div>} />
      <Route path="/wisata/:id" element={<div className="antialiased text-gray-800"><DestinationDetail /></div>} />
      <Route path="/publik/:id" element={<div className="antialiased text-gray-800"><DestinationDetail /></div>} />
      <Route path="/transportasi-umum" element={<div className="antialiased text-gray-800"><TransportasiUmum /></div>} />

      <Route path="/terms" element={<StaticPage title="Syarat & Ketentuan" pageKey="page_terms" />} />
      <Route path="/about" element={<StaticPage title="Tentang Kami" pageKey="page_about" />} />
      <Route path="/privacy" element={<StaticPage title="Kebijakan Privasi" pageKey="page_privacy" />} />
    </Routes>
  );
}
