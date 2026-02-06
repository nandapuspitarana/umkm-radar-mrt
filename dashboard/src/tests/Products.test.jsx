
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { expect, test, vi, beforeEach } from 'vitest';
import Products from '../pages/Products';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';

// Mocks
vi.mock('../components/Sidebar', () => ({
    default: () => <div data-testid="sidebar">Sidebar</div>
}));

vi.mock('lucide-react', () => ({
    Plus: () => <span>Plus</span>,
    Trash2: () => <span>Trash2</span>,
    Edit2: () => <span>Edit2</span>,
    Search: () => <span>Search</span>,
    Package: () => <span>Package</span>,
    Save: () => <span>Save</span>
}));

global.fetch = vi.fn();
// Mock localStorage
const localStorageMock = (function () {
    let store = {};
    return {
        getItem: function (key) {
            return store[key] || null;
        },
        setItem: function (key, value) {
            store[key] = value.toString();
        },
        clear: function () {
            store = {};
        },
        removeItem: function (key) {
            delete store[key];
        }
    };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });


test('Products: can add new product', async () => {
    // Setup login auth
    localStorage.setItem('grocries_auth', JSON.stringify({ vendorId: 1, role: 'vendor' }));

    // Mock initial fetch
    fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
    });

    render(
        <BrowserRouter>
            <Products />
        </BrowserRouter>
    );

    await waitFor(() => expect(fetch).toHaveBeenCalled());

    // Open Modal
    const addBtn = screen.getByText(/Tambah Produk/i);
    fireEvent.click(addBtn);

    expect(screen.getByText(/Tambah Produk Baru/i)).toBeInTheDocument();

    // Fill Form
    fireEvent.change(screen.getByLabelText(/Nama Produk/i), { target: { value: 'Apel' } });
    fireEvent.change(screen.getByLabelText(/Harga Asli/i), { target: { value: '5000' } });
    fireEvent.change(screen.getByLabelText(/URL Gambar/i), { target: { value: 'http://img.com/a.jpg' } });

    // Mock Submit response
    fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 10, name: 'Apel' })
    });
    // And refetch
    fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 10, name: 'Apel', image: 'http://img.com/a.jpg', price: 5000, category: 'Buah' }]
    });

    const submitBtn = screen.getByText('Simpan');
    fireEvent.click(submitBtn);

    await waitFor(() => expect(fetch).toHaveBeenCalledWith(
        '/api/products',
        expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('"name":"Apel"')
        })
    ));
});
