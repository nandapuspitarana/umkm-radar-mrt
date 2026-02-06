import { pgTable, serial, text, doublePrecision, integer, timestamp, jsonb, boolean } from 'drizzle-orm/pg-core';

export const vendors = pgTable('vendors', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    lat: doublePrecision('lat').notNull(),
    lng: doublePrecision('lng').notNull(),
    whatsapp: text('whatsapp').notNull(),
    address: text('address').notNull(),
    image: text('image'), // Store Logo URL
    schedule: jsonb('schedule'), // { days: [], open: "06:00", close: "21:00", holidayClosed: true }
    status: text('status').default('pending'), // approved, pending, rejected
    category: text('category').default('Umum'), // Umum, Sayur, Buah, Daging, etc.
    rating: doublePrecision('rating').default(0),
    locationTags: text('location_tags'), // e.g. "Dekat MRT BNI, Dukuh Atas"
    description: text('description'), // e.g. "Nasi uduk, Ketupat sayur, Lontong"
});

export const products = pgTable('products', {
    id: serial('id').primaryKey(),
    vendorId: integer('vendor_id').references(() => vendors.id).notNull(),
    name: text('name').notNull(),
    price: integer('price').notNull(),
    originalPrice: integer('original_price'),
    category: text('category').notNull(),
    image: text('image').notNull(),
    rating: doublePrecision('rating').default(0),
    discountPrice: integer('discount_price'), // Using this as the final sale price if present
    description: text('description'),
    isAvailable: boolean('is_available').default(true),
});

export const vouchers = pgTable('vouchers', {
    id: serial('id').primaryKey(),
    code: text('code').notNull().unique(),
    type: text('type').notNull(), // 'percentage' | 'fixed'
    value: integer('value').notNull(),
    vendorId: integer('vendor_id').references(() => vendors.id), // Null = Global
    minPurchase: integer('min_purchase').default(0),
    maxDiscount: integer('max_discount'),
    isActive: boolean('is_active').default(true),
});

export const orders = pgTable('orders', {
    id: serial('id').primaryKey(),
    vendorId: integer('vendor_id').references(() => vendors.id).notNull(),
    customerId: integer('customer_id'), // Legacy/Sync?
    customer: text('customer').notNull(),
    customerPhone: text('customer_phone'),
    customerEmail: text('customer_email'),
    total: integer('total').notNull(),
    discount: integer('discount'),
    finalTotal: integer('final_total'),
    voucherCode: text('voucher_code'),
    status: text('status').default('pending').notNull(), // pending, processing, ready, completed
    items: jsonb('items').notNull(),
    pickupCode: text('pickup_code'), // Unique 6 digit code
    createdAt: timestamp('created_at').defaultNow(),
});

export const settings = pgTable('settings', {
    id: serial('id').primaryKey(),
    key: text('key').notNull().unique(), // e.g. 'footer_text', 'footer_links'
    value: jsonb('value').notNull(),
});

export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    email: text('email').notNull().unique(),
    password: text('password').notNull(), // In real app, hash this!
    role: text('role').notNull(), // 'admin' | 'vendor'
    vendorId: integer('vendor_id').references(() => vendors.id), // Nullable for admin
    name: text('name').notNull(),
});

// Asset Management - MinIO storage metadata
export const assets = pgTable('assets', {
    id: serial('id').primaryKey(),
    filename: text('filename').notNull(), // Original filename
    storagePath: text('storage_path').notNull(), // Path in MinIO bucket
    mimeType: text('mime_type').notNull(),
    size: integer('size').notNull(), // File size in bytes
    bucket: text('bucket').default('assets'),
    category: text('category').default('general'), // banner, logo, product, etc.
    alt: text('alt'), // Alt text for accessibility
    uploadedBy: integer('uploaded_by').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow(),
});
