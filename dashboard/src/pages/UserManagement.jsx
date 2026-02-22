import React, { useState, useEffect } from 'react';
import {
    Users, Plus, Edit2, Trash2, ToggleLeft, ToggleRight,
    Key, Search, Shield, Store, RefreshCcw, CheckCircle, AlertCircle, X, Save, Eye, EyeOff
} from 'lucide-react';
import Sidebar from '../components/Sidebar';

// ─── Role badge ──────────────────────────────────────────────────────────────
const ROLE_STYLE = {
    admin: 'bg-purple-100 text-purple-700 border border-purple-200',
    vendor: 'bg-blue-100 text-blue-700 border border-blue-200',
};
const ROLE_ICON = { admin: Shield, vendor: Store };

// ─── Toast ──────────────────────────────────────────────────────────────────
function Toast({ msg, type }) {
    if (!msg) return null;
    return (
        <div className={`fixed bottom-6 right-6 z-[999] flex items-center gap-2 px-5 py-3 rounded-xl shadow-xl text-sm font-medium transition-all
            ${type === 'success' ? 'bg-green-600 text-white' : 'bg-red-500 text-white'}`}>
            {type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {msg}
        </div>
    );
}

// ─── Modal Tambah/Edit User ──────────────────────────────────────────────────
function UserModal({ user, vendors, onSave, onClose, saving }) {
    const isEdit = !!user?.id;
    const [form, setForm] = useState({
        name: user?.name || '',
        email: user?.email || '',
        password: '',
        role: user?.role || 'vendor',
        vendorId: user?.vendor_id || '',
        notes: user?.notes || '',
        isActive: user?.is_active !== false,
    });
    const [showPass, setShowPass] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        const data = { ...form, vendorId: form.vendorId ? parseInt(form.vendorId) : null };
        if (isEdit && !data.password) delete data.password; // don't send empty password on edit
        onSave(data);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h3 className="font-bold text-gray-900 text-lg">
                        {isEdit ? '✏️ Edit User' : '👤 Tambah User Baru'}
                    </h3>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Nama Lengkap *</label>
                        <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Contoh: Andi Wirawan" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Email *</label>
                        <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="nama@email.com" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                            Password {isEdit ? '(kosongkan jika tidak ingin ganti)' : '*'}
                        </label>
                        <div className="relative">
                            <input
                                type={showPass ? 'text' : 'password'}
                                required={!isEdit}
                                value={form.password}
                                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder={isEdit ? '(tidak diubah)' : 'Password'}
                            />
                            <button type="button" onClick={() => setShowPass(p => !p)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Role *</label>
                            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value, vendorId: e.target.value === 'admin' ? '' : f.vendorId }))}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                                <option value="vendor">🏪 Mitra Penjual</option>
                                <option value="admin">🛡️ Admin</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Toko Mitra</label>
                            <select
                                disabled={form.role === 'admin'}
                                value={form.vendorId}
                                onChange={e => setForm(f => ({ ...f, vendorId: e.target.value }))}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <option value="">— Tidak ada —</option>
                                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Catatan (opsional)</label>
                        <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Catatan internal..." />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                            className="w-4 h-4 text-blue-600 rounded" />
                        <span className="text-sm font-medium text-gray-700">User aktif</span>
                    </label>
                    <div className="flex gap-3 pt-2 border-t">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100 font-medium text-sm transition">Batal</button>
                        <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition disabled:opacity-60 flex items-center justify-center gap-2">
                            <Save size={14} />{saving ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Reset Password Modal ─────────────────────────────────────────────────────
function ResetPasswordModal({ user, onReset, onClose, saving }) {
    const [pw, setPw] = useState('');
    const [show, setShow] = useState(false);
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
                <h3 className="font-bold text-gray-900 mb-1">🔑 Reset Password</h3>
                <p className="text-sm text-gray-500 mb-4">User: <strong>{user.name}</strong></p>
                <div className="relative mb-4">
                    <input type={show ? 'text' : 'password'} value={pw} onChange={e => setPw(e.target.value)}
                        placeholder="Password baru..."
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    <button type="button" onClick={() => setShow(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {show ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                </div>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2 rounded-xl text-gray-600 hover:bg-gray-100 text-sm font-medium">Batal</button>
                    <button onClick={() => pw && onReset(pw)} disabled={!pw || saving}
                        className="flex-1 py-2 bg-orange-500 text-white rounded-xl font-bold text-sm hover:bg-orange-600 transition disabled:opacity-50">
                        {saving ? 'Mereset...' : 'Reset'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [modal, setModal] = useState(null);       // null | 'add' | user
    const [resetModal, setResetModal] = useState(null); // null | user
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    // Cek apakah user yang login adalah super admin
    const auth = JSON.parse(localStorage.getItem('grocries_auth') || '{}');
    const isSuperAdmin = auth.isSuperAdmin === true;

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [uRes, vRes] = await Promise.all([
                fetch('/api/users').then(r => r.json()),
                fetch('/api/vendors').then(r => r.json()),
            ]);
            setUsers(Array.isArray(uRes) ? uRes : []);
            setVendors(Array.isArray(vRes) ? vRes : []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchAll(); }, []);

    const handleSave = async (data) => {
        setSaving(true);
        const isEdit = !!modal?.id;
        try {
            const res = await fetch(isEdit ? `/api/users/${modal.id}` : '/api/users', {
                method: isEdit ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Actor-Name': auth.name || 'Admin',
                    'X-Is-Super-Admin': isSuperAdmin ? 'true' : 'false',
                },
                body: JSON.stringify(data),
            });
            if (res.ok) {
                showToast(isEdit ? 'User berhasil diperbarui!' : 'User berhasil ditambahkan!');
                setModal(null);
                fetchAll();
            } else {
                const err = await res.json();
                showToast(err.error || 'Gagal menyimpan', 'error');
            }
        } finally { setSaving(false); }
    };

    const handleDelete = async (user) => {
        if (!confirm(`Hapus user "${user.name}"?\nAksi ini tidak dapat dibatalkan.`)) return;
        const res = await fetch(`/api/users/${user.id}`, {
            method: 'DELETE',
            headers: { 'X-Actor-Name': auth.name || 'Admin' }
        });
        if (res.ok) { showToast('User dihapus'); fetchAll(); }
        else showToast('Gagal menghapus', 'error');
    };

    const handleToggle = async (user) => {
        const res = await fetch(`/api/users/${user.id}/toggle-active`, {
            method: 'PATCH',
            headers: { 'X-Actor-Name': auth.name || 'Admin' }
        });
        if (res.ok) {
            showToast(`User ${user.is_active ? 'dinonaktifkan' : 'diaktifkan'}`);
            fetchAll();
        } else showToast('Gagal mengubah status', 'error');
    };

    const handleResetPassword = async (newPassword) => {
        if (!isSuperAdmin) {
            showToast('Hanya Super Admin yang dapat mereset password', 'error');
            return;
        }
        setSaving(true);
        try {
            const res = await fetch(`/api/users/${resetModal.id}/reset-password`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Actor-Name': auth.name || 'Admin',
                    'X-Is-Super-Admin': 'true',
                },
                body: JSON.stringify({ newPassword }),
            });
            if (res.ok) { showToast('Password direset!'); setResetModal(null); }
            else showToast('Gagal reset password', 'error');
        } finally { setSaving(false); }
    };

    const filtered = users.filter(u => {
        const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase());
        const matchRole = filterRole === 'all' || u.role === filterRole;
        return matchSearch && matchRole;
    });

    const adminCount = users.filter(u => u.role === 'admin').length;
    const vendorCount = users.filter(u => u.role === 'vendor').length;
    const activeCount = users.filter(u => u.is_active !== false).length;

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <main className="flex-1 ml-60 p-8">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Users size={24} className="text-blue-600" /> Manajemen User
                        </h1>
                        <p className="text-sm text-gray-500 mt-0.5">Kelola akun admin dan mitra penjual</p>
                    </div>
                    <button
                        onClick={() => setModal({})}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition shadow-lg shadow-blue-600/20"
                    >
                        <Plus size={16} /> Tambah User
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                    {[
                        { label: 'Total User', val: users.length, color: 'bg-gray-800', text: 'text-white', icon: Users },
                        { label: 'Admin', val: adminCount, color: 'bg-purple-600', text: 'text-white', icon: Shield },
                        { label: 'Mitra Penjual', val: vendorCount, color: 'bg-blue-600', text: 'text-white', icon: Store },
                        { label: 'Aktif', val: activeCount, color: 'bg-green-600', text: 'text-white', icon: CheckCircle },
                    ].map(({ label, val, color, text, icon: Icon }) => (
                        <div key={label} className={`${color} rounded-2xl p-5 ${text} shadow-sm`}>
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium opacity-80">{label}</p>
                                <Icon size={18} className="opacity-60" />
                            </div>
                            <p className="text-3xl font-black">{val}</p>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex items-center gap-3 mb-5">
                    <div className="relative flex-1 max-w-sm">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Cari nama atau email..."
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 bg-white rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                        {['all', 'admin', 'vendor'].map(r => (
                            <button key={r}
                                onClick={() => setFilterRole(r)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${filterRole === r ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                {r === 'all' ? 'Semua' : r === 'admin' ? '🛡️ Admin' : '🏪 Mitra'}
                            </button>
                        ))}
                    </div>
                    <button onClick={fetchAll} className="p-2 hover:bg-gray-200 rounded-xl transition" title="Refresh">
                        <RefreshCcw size={16} className="text-gray-500" />
                    </button>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="flex justify-center py-20"><div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" /></div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr className="text-xs text-gray-500 uppercase">
                                    <th className="px-6 py-3 text-left font-semibold">User</th>
                                    <th className="px-6 py-3 text-left font-semibold">Role</th>
                                    <th className="px-6 py-3 text-left font-semibold">Toko/Vendor</th>
                                    <th className="px-6 py-3 text-center font-semibold">Status</th>
                                    <th className="px-6 py-3 text-left font-semibold">Dibuat</th>
                                    <th className="px-6 py-3 text-center font-semibold">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.length === 0 ? (
                                    <tr><td colSpan={6} className="text-center py-16 text-gray-400">Tidak ada user ditemukan</td></tr>
                                ) : filtered.map(user => {
                                    const RoleIcon = ROLE_ICON[user.role] || Shield;
                                    return (
                                        <tr key={user.id} className={`hover:bg-gray-50 transition ${user.is_active === false ? 'opacity-50' : ''}`}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-sm text-gray-900 flex items-center gap-1.5">
                                                            {user.name}
                                                            {user.is_super_admin && (
                                                                <span className="text-[10px] bg-yellow-100 text-yellow-700 border border-yellow-200 px-1.5 py-0.5 rounded-full font-bold">⭐ Super Admin</span>
                                                            )}
                                                        </p>
                                                        <p className="text-xs text-gray-400">{user.email}</p>
                                                        {user.notes && <p className="text-xs text-gray-400 italic">{user.notes}</p>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${ROLE_STYLE[user.role] || 'bg-gray-100 text-gray-600'}`}>
                                                    <RoleIcon size={11} />
                                                    {user.role === 'admin' ? 'Admin' : 'Mitra Penjual'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {user.vendor_name ? (
                                                    <span className="text-sm text-gray-700">{user.vendor_name}</span>
                                                ) : (
                                                    <span className="text-xs text-gray-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full ${user.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-500'}`}>
                                                    {user.is_active !== false ? 'Aktif' : 'Nonaktif'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs text-gray-400">
                                                    {user.created_at ? new Date(user.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button onClick={() => setModal(user)} title="Edit" className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition">
                                                        <Edit2 size={14} />
                                                    </button>
                                                    {/* Reset Password — hanya super admin */}
                                                    {isSuperAdmin ? (
                                                        <button onClick={() => setResetModal(user)} title="Reset Password" className="p-1.5 hover:bg-orange-50 text-orange-500 rounded-lg transition">
                                                            <Key size={14} />
                                                        </button>
                                                    ) : (
                                                        <button disabled title="Hanya Super Admin yang bisa reset password"
                                                            className="p-1.5 text-gray-300 rounded-lg cursor-not-allowed">
                                                            <Key size={14} />
                                                        </button>
                                                    )}
                                                    <button onClick={() => handleToggle(user)} title={user.is_active !== false ? 'Nonaktifkan' : 'Aktifkan'}
                                                        className="p-1.5 hover:bg-yellow-50 text-yellow-600 rounded-lg transition">
                                                        {user.is_active !== false ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                                                    </button>
                                                    <button onClick={() => handleDelete(user)} title="Hapus" className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>

            {modal !== null && (
                <UserModal
                    user={modal?.id ? modal : null}
                    vendors={vendors}
                    saving={saving}
                    onSave={handleSave}
                    onClose={() => setModal(null)}
                />
            )}
            {resetModal && (
                <ResetPasswordModal
                    user={resetModal}
                    saving={saving}
                    onReset={handleResetPassword}
                    onClose={() => setResetModal(null)}
                />
            )}
            <Toast msg={toast?.msg} type={toast?.type} />
        </div>
    );
}
