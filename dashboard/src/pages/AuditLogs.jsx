import React, { useState, useEffect } from 'react';
import { ClipboardList, Filter, RefreshCcw, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import Sidebar from '../components/Sidebar';

// ─── Constants ───────────────────────────────────────────────────────────────
const ACTION_STYLE = {
    CREATE: 'bg-green-100 text-green-700',
    UPDATE: 'bg-blue-100 text-blue-700',
    DELETE: 'bg-red-100 text-red-700',
};

const ENTITY_STYLE = {
    user: 'bg-purple-100 text-purple-700',
    vendor: 'bg-orange-100 text-orange-700',
    destination: 'bg-teal-100 text-teal-700',
};

const ENTITY_LABEL = {
    user: '👤 User',
    vendor: '🏪 Vendor',
    destination: '📍 Destinasi',
};

// ─── Changes Diff Viewer ──────────────────────────────────────────────────────
function ChangesDiff({ changes }) {
    if (!changes || Object.keys(changes).length === 0) return null;
    return (
        <div className="mt-2 space-y-1">
            {Object.entries(changes).map(([field, { from, to }]) => (
                <div key={field} className="flex items-start gap-2 text-xs">
                    <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 flex-shrink-0">{field}</span>
                    <span className="text-red-400 line-through truncate max-w-[120px]">{String(from ?? '—')}</span>
                    <span className="text-gray-400">→</span>
                    <span className="text-green-600 truncate max-w-[120px]">{String(to ?? '—')}</span>
                </div>
            ))}
        </div>
    );
}

// ─── Log Row ─────────────────────────────────────────────────────────────────
function LogRow({ log }) {
    const [expanded, setExpanded] = useState(false);
    const changes = log.changes ? (typeof log.changes === 'string' ? JSON.parse(log.changes) : log.changes) : null;
    const hasDetails = changes && Object.keys(changes).length > 0;

    return (
        <tr className="hover:bg-gray-50 transition">
            <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap font-mono">
                {new Date(log.created_at).toLocaleString('id-ID', {
                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                })}
            </td>
            <td className="px-4 py-3">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ACTION_STYLE[log.action] || 'bg-gray-100 text-gray-600'}`}>
                    {log.action}
                </span>
            </td>
            <td className="px-4 py-3">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ENTITY_STYLE[log.entity] || 'bg-gray-100 text-gray-600'}`}>
                    {ENTITY_LABEL[log.entity] || log.entity}
                </span>
            </td>
            <td className="px-4 py-3">
                <p className="text-sm font-medium text-gray-900">{log.entity_name || `#${log.entity_id}`}</p>
                <p className="text-xs text-gray-400">ID: {log.entity_id}</p>
            </td>
            <td className="px-4 py-3">
                <p className="text-sm text-gray-700">{log.actor_name || '—'}</p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${log.actor_role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                    {log.actor_role || 'system'}
                </span>
            </td>
            <td className="px-4 py-3 max-w-[280px]">
                {hasDetails ? (
                    <button onClick={() => setExpanded(e => !e)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                        {expanded ? '▲ Sembunyikan' : `▼ ${Object.keys(changes).length} field berubah`}
                    </button>
                ) : (
                    <span className="text-xs text-gray-400">{log.action === 'DELETE' ? 'Record dihapus' : log.action === 'CREATE' ? 'Record dibuat' : 'Tidak ada detail'}</span>
                )}
                {expanded && hasDetails && <ChangesDiff changes={changes} />}
            </td>
        </tr>
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function AuditLogs() {
    const [logs, setLogs] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const limit = 50;

    const [filterEntity, setFilterEntity] = useState('');
    const [filterAction, setFilterAction] = useState('');
    const [searchText, setSearchText] = useState('');

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterEntity) params.set('entity', filterEntity);
            if (filterAction) params.set('action', filterAction);
            params.set('limit', limit);
            params.set('offset', page * limit);

            const res = await fetch(`/api/audit-logs?${params}`);
            const data = await res.json();
            setLogs(data.logs || []);
            setTotal(data.total || 0);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { setPage(0); }, [filterEntity, filterAction]);
    useEffect(() => { fetchLogs(); }, [page, filterEntity, filterAction]);

    const filteredLogs = searchText
        ? logs.filter(l =>
            (l.entity_name || '').toLowerCase().includes(searchText.toLowerCase()) ||
            (l.actor_name || '').toLowerCase().includes(searchText.toLowerCase())
        )
        : logs;

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <main className="flex-1 ml-60 p-8">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <ClipboardList size={24} className="text-blue-600" /> Log Aktivitas
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">Rekam jejak semua perubahan data — user, vendor, dan destinasi</p>
                </div>

                {/* Stats Bar */}
                <div className="flex items-center gap-4 mb-5 bg-white rounded-2xl border border-gray-200 px-6 py-4">
                    <div className="text-center flex-1 border-r border-gray-100">
                        <p className="text-2xl font-black text-gray-900">{total}</p>
                        <p className="text-xs text-gray-400">Total Log</p>
                    </div>
                    {['CREATE', 'UPDATE', 'DELETE'].map(a => (
                        <div key={a} className="text-center flex-1 border-r border-gray-100 last:border-r-0">
                            <p className={`text-2xl font-black ${a === 'CREATE' ? 'text-green-600' : a === 'UPDATE' ? 'text-blue-600' : 'text-red-500'}`}>
                                {logs.filter(l => l.action === a).length}
                            </p>
                            <p className="text-xs text-gray-400">{a}</p>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex items-center gap-3 mb-5 flex-wrap">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            value={searchText} onChange={e => setSearchText(e.target.value)}
                            placeholder="Cari nama..."
                            className="pl-8 pr-4 py-2 border border-gray-200 bg-white rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none w-48"
                        />
                    </div>

                    <select value={filterEntity} onChange={e => setFilterEntity(e.target.value)}
                        className="border border-gray-200 bg-white rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                        <option value="">🌐 Semua Entitas</option>
                        <option value="user">👤 User</option>
                        <option value="vendor">🏪 Vendor</option>
                        <option value="destination">📍 Destinasi</option>
                    </select>

                    <select value={filterAction} onChange={e => setFilterAction(e.target.value)}
                        className="border border-gray-200 bg-white rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                        <option value="">⚡ Semua Aksi</option>
                        <option value="CREATE">➕ CREATE</option>
                        <option value="UPDATE">✏️ UPDATE</option>
                        <option value="DELETE">🗑️ DELETE</option>
                    </select>

                    <button onClick={() => { setFilterEntity(''); setFilterAction(''); setSearchText(''); setPage(0); fetchLogs(); }}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-xl transition">
                        <RefreshCcw size={14} /> Reset
                    </button>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="text-center py-20 text-gray-400">
                            <ClipboardList size={40} className="mx-auto mb-2 opacity-30" />
                            <p>Belum ada log aktivitas</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr className="text-xs text-gray-500 uppercase">
                                    <th className="px-4 py-3 text-left font-semibold">Waktu</th>
                                    <th className="px-4 py-3 text-left font-semibold">Aksi</th>
                                    <th className="px-4 py-3 text-left font-semibold">Entitas</th>
                                    <th className="px-4 py-3 text-left font-semibold">Record</th>
                                    <th className="px-4 py-3 text-left font-semibold">Oleh</th>
                                    <th className="px-4 py-3 text-left font-semibold">Perubahan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredLogs.map(log => <LogRow key={log.id} log={log} />)}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                        <p className="text-sm text-gray-500">
                            Menampilkan {page * limit + 1}–{Math.min((page + 1) * limit, total)} dari {total} log
                        </p>
                        <div className="flex gap-2">
                            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                                className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
                                <ChevronLeft size={14} /> Prev
                            </button>
                            <span className="flex items-center px-3 py-1.5 text-sm text-gray-600 font-medium">
                                {page + 1} / {totalPages}
                            </span>
                            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                                className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
                                Next <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
