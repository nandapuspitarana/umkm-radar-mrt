
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { expect, test, vi, beforeEach } from 'vitest';
import AdminVendors from '../pages/AdminVendors';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';

// Mocks
vi.mock('../components/Sidebar', () => ({
    default: () => <div data-testid="sidebar">Sidebar</div>
}));

vi.mock('lucide-react', () => ({
    Plus: () => <span>Plus</span>,
    Search: () => <span>Search</span>,
    MapPin: () => <span>MapPin</span>,
    Store: () => <span>Store</span>,
    Edit: () => <span>Edit</span>,
    Trash2: () => <span>Trash2</span>
}));

global.fetch = vi.fn();

test('AdminVendors: can open modal and submit new vendor', async () => {
    // Mock fetch initial load
    fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
    });

    render(
        <BrowserRouter>
            <AdminVendors />
        </BrowserRouter>
    );

    // Initial load fetch
    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/vendors'));

    // Open Modal
    const addBtn = screen.getByTestId('add-vendor-btn');
    fireEvent.click(addBtn);

    await waitFor(() => expect(screen.getByText(/Tambah Mitra Baru/i)).toBeInTheDocument());

    // Fill form
    fireEvent.change(screen.getByTestId('input-name'), { target: { value: 'Toko Baru' } });
    fireEvent.change(screen.getByTestId('input-whatsapp'), { target: { value: '08123456789' } });
    fireEvent.change(screen.getByTestId('input-address'), { target: { value: 'Jl. Test No. 1' } });
    fireEvent.change(screen.getByTestId('input-lat'), { target: { value: '-6.2' } });
    fireEvent.change(screen.getByTestId('input-lng'), { target: { value: '106.8' } });

    // Mock Submit
    fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 2, name: 'Toko Baru' })
    });
    // And refetch
    fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{
            id: 2,
            name: 'Toko Baru',
            lat: -6.2,
            lng: 106.8,
            whatsapp: '08123456789',
            category: 'Umum',
            address: 'Jl. Test',
            locationTags: ''
        }]
    });

    // Save
    const saveBtn = screen.getByText(/Simpan Mitra/i);
    fireEvent.click(saveBtn);

    // Verify Payload
    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/vendors', expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"name":"Toko Baru"')
    })));
});
