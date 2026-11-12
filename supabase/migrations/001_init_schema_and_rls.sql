-- ============================================================================
-- Enterprise Retail POS Schema & Row Level Security (RLS) - Minimart Laos
-- Localization: Lao Kip (LAK - ກີບ) | Script: Lao (ພາສາລາວ)
-- Multi-tenant isolation by store_id, Role-Based Access Control (RBAC)
-- ============================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Custom ENUM types
DO $$ BEGIN
    CREATE TYPE user_role_enum AS ENUM ('cashier', 'store_manager', 'owner');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method_enum AS ENUM ('cash', 'lao_qr', 'mixed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status_enum AS ENUM ('completed', 'cancelled', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE shift_status_enum AS ENUM ('open', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. STORES (ຮ້ານຄ້າ)
CREATE TABLE IF NOT EXISTS public.stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_lo VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    address_lo TEXT,
    phone VARCHAR(50),
    tax_code VARCHAR(50),
    currency VARCHAR(10) DEFAULT 'LAK',
    receipt_footer_lo TEXT DEFAULT 'ຂອບໃຈທີ່ໃຊ້ນຳບໍລິການ / Thank you for shopping with us',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. USERS & STAFF (ພະນັກງານ ແລະ ຜູ້ຈັດການ)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    username VARCHAR(100) NOT NULL UNIQUE,
    full_name_lo VARCHAR(255) NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'cashier',
    pin_hash VARCHAR(255), -- SHA-256 hashed 6-digit PIN for manager overrides
    failed_pin_attempts INT DEFAULT 0,
    pin_locked_until TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CATEGORIES (ໝວດໝູ່ສິນຄ້າ)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    name_lo VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    icon VARCHAR(100),
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PRODUCTS (ສິນຄ້າ)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    barcode VARCHAR(100) NOT NULL,
    sku VARCHAR(100),
    name_lo VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    base_unit VARCHAR(50) NOT NULL DEFAULT 'ອັນ', -- Cặp/Cái/Lon (ອັນ, ປ໋ອງ, ຕຸກ...)
    cost_price NUMERIC(15, 2) NOT NULL DEFAULT 0, -- ລາຄາຕົ້ນທຶນ (RESTRICTED: manager/owner only)
    selling_price NUMERIC(15, 2) NOT NULL DEFAULT 0, -- ລາຄາຂາຍ (Kip)
    is_perishable BOOLEAN DEFAULT FALSE,
    warning_days_before_expiry INT DEFAULT 15,
    is_weighing BOOLEAN DEFAULT FALSE, -- For electronic scale EAN-13 barcodes (prefix 20-29)
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_product_barcode_store UNIQUE (store_id, barcode)
);

-- 7. PRODUCT UNITS & CONVERSION (ການແປງຫົວໜ່ວຍ: ປ໋ອງ -> ແພັກ -> ແກັດ)
CREATE TABLE IF NOT EXISTS public.product_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    unit_name VARCHAR(50) NOT NULL, -- e.g. ປ໋ອງ (Lon), ແພັກ (Lốc 6), ແກັດ (Thùng 24)
    conversion_rate NUMERIC(10, 2) NOT NULL DEFAULT 1, -- e.g. 1, 6, 24
    selling_price NUMERIC(15, 2) NOT NULL, -- Giá bán riêng theo đơn vị
    barcode VARCHAR(100), -- Barcode riêng nếu thùng/lốc có mã riêng
    is_base_unit BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. PRODUCT BATCHES & EXPIRY FEFO (ລັອດສິນຄ້າ ແລະ ວັນໝົດອາຍຸ)
CREATE TABLE IF NOT EXISTS public.product_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    batch_number VARCHAR(100) NOT NULL,
    expiry_date DATE NOT NULL,
    quantity_on_hand NUMERIC(12, 2) NOT NULL DEFAULT 0,
    cost_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
    is_clearance BOOLEAN DEFAULT FALSE,
    clearance_price NUMERIC(15, 2), -- Giá xả hàng cận date
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast FEFO batch allocation
CREATE INDEX IF NOT EXISTS idx_batches_fefo ON public.product_batches(product_id, expiry_date ASC) 
WHERE quantity_on_hand > 0;

-- 9. CASHIER SHIFTS (ກະຂາຍເຄື່ອງ)
CREATE TABLE IF NOT EXISTS public.shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id),
    opening_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closing_time TIMESTAMPTZ,
    opening_cash NUMERIC(15, 2) NOT NULL DEFAULT 0,
    expected_closing_cash NUMERIC(15, 2),
    actual_closing_cash NUMERIC(15, 2), -- Entered in Blind Close (ປິດກະແບບບໍ່ຮູ້ຍອດ)
    discrepancy NUMERIC(15, 2), -- Chênh lệch tiền mặt
    status shift_status_enum NOT NULL DEFAULT 'open',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. ORDERS & BILLS (ໃບບິນຂາຍ)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    shift_id UUID REFERENCES public.shifts(id),
    cashier_id UUID NOT NULL REFERENCES public.users(id),
    order_number VARCHAR(50) NOT NULL,
    subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    vat_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    final_total NUMERIC(15, 2) NOT NULL DEFAULT 0,
    payment_method payment_method_enum NOT NULL DEFAULT 'cash',
    cash_tendered NUMERIC(15, 2) DEFAULT 0,
    change_amount NUMERIC(15, 2) DEFAULT 0,
    status order_status_enum NOT NULL DEFAULT 'completed',
    offline_created_at TIMESTAMPTZ NOT NULL,
    client_synced_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    CONSTRAINT uq_order_number_store UNIQUE (store_id, order_number)
);

-- 11. ORDER ITEMS (ລາຍການສິນຄ້າໃນໃບບິນ)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    batch_id UUID REFERENCES public.product_batches(id),
    unit_name VARCHAR(50) NOT NULL,
    conversion_rate NUMERIC(10, 2) NOT NULL DEFAULT 1,
    unit_price NUMERIC(15, 2) NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL,
    subtotal_price NUMERIC(15, 2) NOT NULL,
    discount_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_price NUMERIC(15, 2) NOT NULL
);

-- 12. AUDIT LOGS (ບັນທຶກການກວດສອບລະບົບ - Immutable)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id),
    role user_role_enum NOT NULL,
    device_id VARCHAR(100),
    action_type VARCHAR(100) NOT NULL, -- VOID_ORDER, REFUND, MANUAL_DISCOUNT, OPEN_CASH_DRAWER, PRICE_OVERRIDE
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    before_data JSONB,
    after_data JSONB,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function: get current authenticated user role and store_id
CREATE OR REPLACE FUNCTION public.get_auth_user_claim()
RETURNS TABLE (store_id UUID, role user_role_enum) AS $$
BEGIN
    RETURN QUERY
    SELECT u.store_id, u.role
    FROM public.users u
    WHERE u.id = auth.uid() AND u.is_active = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Public catalog read for active store staff
CREATE POLICY "Staff can view store products" ON public.products
    FOR SELECT USING (
        store_id IN (SELECT store_id FROM public.get_auth_user_claim())
    );

-- 2. Prevent cashiers from accessing cost_price via View
CREATE OR REPLACE VIEW public.cashier_products AS
    SELECT 
        id, store_id, category_id, barcode, sku, name_lo, name_en,
        base_unit, selling_price, is_perishable, warning_days_before_expiry,
        is_weighing, image_url, is_active
    FROM public.products;

-- 3. Only managers and owners can modify products
CREATE POLICY "Managers can insert/update products" ON public.products
    FOR ALL USING (
        store_id IN (
            SELECT store_id FROM public.get_auth_user_claim()
            WHERE role IN ('store_manager', 'owner')
        )
    );

-- 4. Shifts: Cashiers can view and manage their own shifts; managers can view all store shifts
CREATE POLICY "Staff shift access" ON public.shifts
    FOR ALL USING (
        store_id IN (SELECT store_id FROM public.get_auth_user_claim())
    );

-- 5. Orders & Order items: Staff can insert completed orders and view store orders
CREATE POLICY "Staff can insert orders" ON public.orders
    FOR INSERT WITH CHECK (
        store_id IN (SELECT store_id FROM public.get_auth_user_claim())
    );

CREATE POLICY "Staff can view store orders" ON public.orders
    FOR SELECT USING (
        store_id IN (SELECT store_id FROM public.get_auth_user_claim())
    );

CREATE POLICY "Staff can insert order items" ON public.order_items
    FOR INSERT WITH CHECK (
        order_id IN (SELECT id FROM public.orders WHERE store_id IN (SELECT store_id FROM public.get_auth_user_claim()))
    );

CREATE POLICY "Staff can view order items" ON public.order_items
    FOR SELECT USING (
        order_id IN (SELECT id FROM public.orders WHERE store_id IN (SELECT store_id FROM public.get_auth_user_claim()))
    );

-- 6. Audit Logs: Append-only for all staff, read-only for store_manager and owner
CREATE POLICY "Staff can insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (
        store_id IN (SELECT store_id FROM public.get_auth_user_claim())
    );

CREATE POLICY "Managers can view audit logs" ON public.audit_logs
    FOR SELECT USING (
        store_id IN (
            SELECT store_id FROM public.get_auth_user_claim()
            WHERE role IN ('store_manager', 'owner')
        )
    );

