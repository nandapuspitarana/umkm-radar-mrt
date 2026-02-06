
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import CartSheet from './CartSheet';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
    X: () => <span>X</span>,
    MessageCircle: () => <span>MessageCircle</span>
}));

test('CartSheet validation: button disabled when name is empty', () => {
    const onCheckout = vi.fn();
    const cart = [{ id: 1, name: 'Product', price: 10000, qty: 1 }];
    const vendor = { id: 1 };

    render(<CartSheet isOpen={true} onClose={() => { }} cart={cart} vendor={vendor} onCheckout={onCheckout} />);

    // Check if name input exists
    const nameInput = screen.getByPlaceholderText(/Nama Anda/i);
    const checkoutBtn = screen.getByText(/Pesan via WhatsApp/i).closest('button');

    // Initially name is empty, button should be disabled
    expect(checkoutBtn).toBeDisabled();

    // Type name
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    expect(checkoutBtn).not.toBeDisabled();

    // Clear name
    fireEvent.change(nameInput, { target: { value: '' } });
    expect(checkoutBtn).toBeDisabled();
});

test('CartSheet: handles special characters in form', () => {
    const onCheckout = vi.fn();
    const cart = [{ id: 1, name: 'Product', price: 10000, qty: 1 }];
    const vendor = { id: 1 };

    render(<CartSheet isOpen={true} onClose={() => { }} cart={cart} vendor={vendor} onCheckout={onCheckout} />);

    const nameInput = screen.getByPlaceholderText(/Nama Anda/i);
    const noteInput = screen.getByPlaceholderText(/Jangan pedas/i);
    const checkoutBtn = screen.getByText(/Pesan via WhatsApp/i).closest('button');

    // Input weird chars
    fireEvent.change(nameInput, { target: { value: '<script>alert(1)</script>' } });
    fireEvent.change(noteInput, { target: { value: '\'; DROP TABLE users; --' } });

    expect(checkoutBtn).not.toBeDisabled();

    // Submit
    fireEvent.click(checkoutBtn);

    // Verify callback received the weird strings exactly (sanitization happens on backend or display, input should accept it)
    expect(onCheckout).toHaveBeenCalledWith(
        '<script>alert(1)</script>',
        '\'; DROP TABLE users; --',
        null, // No voucher
        0 // No discount
    );
});
