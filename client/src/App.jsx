import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Kuliner from './pages/Kuliner';
import Ngopi from './pages/Ngopi';
import Publik from './pages/Publik';
import Wisata from './pages/Wisata';
import Atm from './pages/Atm';
import Vendor from './pages/Vendor';
import CartSheet from './components/CartSheet';
import { ShoppingBag } from 'lucide-react';

import StaticPage from './pages/StaticPage';

export default function App() {
  const [currentVendor, setCurrentVendor] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Cache helper
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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
    } catch (e) {
      return null;
    }
  };

  const setCache = (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
    } catch (e) {
      console.warn("LocalStorage full or disabled", e);
    }
  };

  // Fetch Vendors on Load
  useEffect(() => {
    // Added version suffix to force invalidate old cache
    const CACHE_KEY = 'grocries_vendors_v2';
    const cachedVendors = getCache(CACHE_KEY);

    if (cachedVendors && cachedVendors.length > 0) {
      setVendors(cachedVendors);
    } else {
      fetch('/api/vendors')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setVendors(data);
            // Only cache if we actually got data
            if (data.length > 0) {
              setCache(CACHE_KEY, data);
            }
          } else {
            console.error("API returned non-array vendors:", data);
            setVendors([]);
          }
        })
        .catch(err => {
          console.error("Failed to fetch vendors:", err);
          setVendors([]);
        });
    }

    // Restore cart from localstorage
    const saved = localStorage.getItem('grocries_cart');
    if (saved) setCart(JSON.parse(saved));
  }, []);

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
          .catch(err => console.error("Failed to fetch products:", err));
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
        const confirm = window.confirm("Keranjang hanya bisa memuat produk dari satu toko. Ganti toko dan hapus keranjang saat ini?");
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
          items: cart.map(i => ({ ...i, finalPrice: i.discountPrice || i.price })), // Store snapshot of price
          status: 'pending',
          voucherCode: voucher ? voucher.code : null,
          discount: discountValue || 0
        })
      });
    } catch (err) {
      console.error("Failed to create order:", err);
      alert("Gagal membuat pesanan di sistem, tapi akan lanjut ke WA.");
    }

    // Clear & Close
    setCart([]);
    setIsCartOpen(false);

    // Redirect
    let phone = currentVendor.whatsapp || "6281234567890"; // Fallback demo phone
    // Strip non-numeric chars first
    phone = phone.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = '62' + phone.slice(1);

    // Use window.open for better mobile support or fallback
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const MainView = () => (
    <div className="antialiased text-gray-800">
      {currentVendor ? (
        <Vendor
          vendor={currentVendor}
          products={products}
          onBack={() => setCurrentVendor(null)}
          onAddToCart={handleAddToCart}
          cart={cart}
        />
      ) : (
        <Home
          vendors={vendors}
          onSelectVendor={setCurrentVendor}
        />
      )}

      {/* Floating Cart Button */}
      {cart.length > 0 && !isCartOpen && (
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
      )}

      <CartSheet
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        vendor={currentVendor}
        onCheckout={handleCheckout}
      />


    </div>
  );

  return (
    <Routes>
      <Route path="/" element={<MainView />} />
      <Route path="/kuliner" element={
        <div className="antialiased text-gray-800">
          {currentVendor ? (
            <Vendor
              vendor={currentVendor}
              products={products}
              onBack={() => { setCurrentVendor(null); }}
              onAddToCart={handleAddToCart}
              cart={cart}
            />
          ) : (
            <Kuliner
              vendors={vendors}
              onSelectVendor={setCurrentVendor}
            />
          )}
          {cart.length > 0 && !isCartOpen && (
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
          )}
          <CartSheet
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            cart={cart}
            vendor={currentVendor}
            onCheckout={handleCheckout}
          />

        </div>
      } />
      <Route path="/ngopi" element={
        <div className="antialiased text-gray-800">
          {currentVendor ? (
            <Vendor
              vendor={currentVendor}
              products={products}
              onBack={() => { setCurrentVendor(null); }}
              onAddToCart={handleAddToCart}
              cart={cart}
            />
          ) : (
            <Ngopi
              vendors={vendors}
              onSelectVendor={setCurrentVendor}
            />
          )}
          {cart.length > 0 && !isCartOpen && (
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
          )}
          <CartSheet
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            cart={cart}
            vendor={currentVendor}
            onCheckout={handleCheckout}
          />

        </div>
      } />
      <Route path="/publik" element={
        <div className="antialiased text-gray-800">
          {currentVendor ? (
            <Vendor
              vendor={currentVendor}
              products={products}
              onBack={() => { setCurrentVendor(null); }}
              onAddToCart={handleAddToCart}
              cart={cart}
            />
          ) : (
            <Publik
              vendors={vendors}
              onSelectVendor={setCurrentVendor}
            />
          )}
          {cart.length > 0 && !isCartOpen && (
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
          )}
          <CartSheet
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            cart={cart}
            vendor={currentVendor}
            onCheckout={handleCheckout}
          />

        </div>
      } />
      <Route path="/wisata" element={
        <div className="antialiased text-gray-800">
          <Wisata />

        </div>
      } />
      <Route path="/atm" element={
        <div className="antialiased text-gray-800">
          {currentVendor ? (
            <Vendor
              vendor={currentVendor}
              products={products}
              onBack={() => { setCurrentVendor(null); }}
              onAddToCart={handleAddToCart}
              cart={cart}
            />
          ) : (
            <Atm
              vendors={vendors}
              onSelectVendor={setCurrentVendor}
            />
          )}
          {cart.length > 0 && !isCartOpen && (
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
          )}
          <CartSheet
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            cart={cart}
            vendor={currentVendor}
            onCheckout={handleCheckout}
          />

        </div>
      } />
      <Route path="/terms" element={<StaticPage title="Syarat & Ketentuan" pageKey="page_terms" />} />
      <Route path="/about" element={<StaticPage title="Tentang Kami" pageKey="page_about" />} />
      <Route path="/privacy" element={<StaticPage title="Kebijakan Privasi" pageKey="page_privacy" />} />
    </Routes>
  );
}
