import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Store } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('vendor'); // 'admin' or 'vendor'
    const [errorMsg, setErrorMsg] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setErrorMsg(''); // Clear previous error

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, role })
            });

            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('grocries_auth', JSON.stringify(data));
                navigate('/');
            } else {
                setErrorMsg(data.error || "Gagal masuk. Periksa kembali data Anda.");
            }
        } catch (error) {
            console.error("Login Error:", error);
            setErrorMsg("Gagal menghubungi server. Pastikan backend backend berjalan.");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center mb-3">
                        <Store size={24} />
                    </div>
                    <h1 className="text-2xl font-serif font-bold text-gray-800">UMKM Radar Dashboard</h1>
                    <p className="text-gray-500">Masuk untuk mengelola pesanan</p>
                </div>

                {errorMsg && (
                    <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2 border border-red-100 animate-in fade-in slide-in-from-top-2">
                        <span className="font-bold">Error:</span> {errorMsg}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Peran</label>
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            <button
                                type="button"
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${role === 'vendor' ? 'bg-white shadow text-blue-700' : 'text-gray-500'}`}
                                onClick={() => setRole('vendor')}
                            >
                                Mitra Penjual
                            </button>
                            <button
                                type="button"
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${role === 'admin' ? 'bg-white shadow text-blue-700' : 'text-gray-500'}`}
                                onClick={() => setRole('admin')}
                            >
                                Admin
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            placeholder="nama@toko.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                            type="password"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                        <KeyRound size={18} />
                        Masuk
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-500">
                    Kredit Login (Demo):<br />
                    Admin: admin@umkmradar.com / admin<br />
                    Mitra: mitra1@umkmradar.com / mitra
                </div>
            </div>
        </div>
    );
}
