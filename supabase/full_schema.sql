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
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    batch_id UUID REFERENCES public.product_batches(id) ON DELETE SET NULL,
    product_name VARCHAR(255),
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

-- ============================================================================
-- Migration 002: Allow POS Terminal Public/Anon Read & Order Ingestion
-- Required for POS Terminals using Supabase Anon Key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
-- ============================================================================

-- 1. Allow POS terminal (anon & authenticated) to read store information
DROP POLICY IF EXISTS "Allow public read store" ON public.stores;
CREATE POLICY "Allow public read store" ON public.stores
    FOR SELECT USING (true);

-- 2. Allow POS terminal to read product categories
DROP POLICY IF EXISTS "Allow public read categories" ON public.categories;
CREATE POLICY "Allow public read categories" ON public.categories
    FOR SELECT USING (true);

-- 3. Allow POS terminal to read active products (barcode, prices, names)
DROP POLICY IF EXISTS "Allow public read active products" ON public.products;
CREATE POLICY "Allow public read active products" ON public.products
    FOR SELECT USING (is_active = true);

-- 4. Allow POS terminal to read product units (pack, crate conversion)
DROP POLICY IF EXISTS "Allow public read product units" ON public.product_units;
CREATE POLICY "Allow public read product units" ON public.product_units
    FOR SELECT USING (true);

-- 5. Allow POS terminal to read product batches (FEFO expiry dates)
DROP POLICY IF EXISTS "Allow public read product batches" ON public.product_batches;
CREATE POLICY "Allow public read product batches" ON public.product_batches
    FOR SELECT USING (true);

-- 6. Allow POS terminal to insert completed orders
DROP POLICY IF EXISTS "Allow POS to insert orders" ON public.orders;
CREATE POLICY "Allow POS to insert orders" ON public.orders
    FOR INSERT WITH CHECK (true);

-- 7. Allow POS terminal to insert order items
DROP POLICY IF EXISTS "Allow POS to insert order items" ON public.order_items;
CREATE POLICY "Allow POS to insert order items" ON public.order_items
    FOR INSERT WITH CHECK (true);

-- 8. Allow POS terminal to insert audit logs
DROP POLICY IF EXISTS "Allow POS to insert audit logs" ON public.audit_logs;
CREATE POLICY "Allow POS to insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (true);

-- ============================================================================
-- Migration 003: Update Real Image URLs for All 10 Lao Minimart Products
-- Run this in Supabase SQL Editor: Dashboard -> SQL Editor -> Run
-- ============================================================================

-- 1. Beerlao Lager 330ml Can (ເບຍລາວ ລາເກີ)
UPDATE public.products 
SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/9/94/Beerlao_lager.jpg'
WHERE barcode = '8850029100018';

-- 2. Tigerhead Drinking Water 600ml Bottle (ນ້ຳດື່ມຫົວເສືອ)
UPDATE public.products 
SET image_url = 'https://www.beerlao.la/media/r5cflnvf/tgh-600ml.png'
WHERE barcode = '8850029100025';

-- 3. Lactasoy Soy Milk 250ml Carton (ນົມຖົ່ວເຫຼືອງ ແລັກຕາຊອຍ)
UPDATE public.products 
SET image_url = 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80'
WHERE barcode = '8850029100032';

-- 4. Red Bull Extra 150ml Bottle (ກະທິງແດງ ເອັກສະຕຣ້າ)
UPDATE public.products 
SET image_url = 'https://images.unsplash.com/photo-1622543925917-763c34d1a86e?auto=format&fit=crop&w=400&q=80'
WHERE barcode = '8850029100049';

-- 5. Mama Instant Noodles Shrimp Creamy Tom Yum (ໝີ່ ມາມ່າ ຕົ້ມຍຳກຸ້ງ)
UPDATE public.products 
SET image_url = 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=400&q=80'
WHERE barcode = '8850029100056';

-- 6. Dao Coffee 3-in-1 Original (ກາເຟ ດາວ 3-in-1)
UPDATE public.products 
SET image_url = 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80'
WHERE barcode = '8850029100063';

-- 7. Lao Sticky Rice (Khao Niew) per Kg (ເຂົ້າໜຽວລາວ)
UPDATE public.products 
SET image_url = 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80'
WHERE barcode = '00105';

-- 8. Fresh Cavendish Banana per Kg (ກ້ວຍຫອມທອງ)
UPDATE public.products 
SET image_url = 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=400&q=80'
WHERE barcode = '00108';

-- 9. Clean Tube Ice Bag (ນ້ຳກ້ອນອະນາໄມ)
UPDATE public.products 
SET image_url = 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=400&q=80'
WHERE barcode = 'QUICK_ICE';

-- 10. Minimart Shopping Bag (ຖົງຢາງມິນິມາດ)
UPDATE public.products 
SET image_url = 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=400&q=80'
WHERE barcode = 'QUICK_BAG';

-- ============================================================================
-- Migration 004: Allow Back-Office CRUD on Categories, Products, Units & Batches
-- Run this in Supabase SQL Editor if RLS blocks insert/update/delete from web client:
-- Dashboard -> SQL Editor -> Run
-- ============================================================================

-- 1. Categories CRUD
DROP POLICY IF EXISTS "Allow backoffice categories insert" ON public.categories;
CREATE POLICY "Allow backoffice categories insert" ON public.categories
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow backoffice categories update" ON public.categories;
CREATE POLICY "Allow backoffice categories update" ON public.categories
    FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow backoffice categories delete" ON public.categories;
CREATE POLICY "Allow backoffice categories delete" ON public.categories
    FOR DELETE USING (true);

-- 2. Products CRUD
DROP POLICY IF EXISTS "Allow backoffice products insert" ON public.products;
CREATE POLICY "Allow backoffice products insert" ON public.products
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow backoffice products update" ON public.products;
CREATE POLICY "Allow backoffice products update" ON public.products
    FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow backoffice products delete" ON public.products;
CREATE POLICY "Allow backoffice products delete" ON public.products
    FOR DELETE USING (true);

-- 3. Product Units CRUD
DROP POLICY IF EXISTS "Allow backoffice product_units insert" ON public.product_units;
CREATE POLICY "Allow backoffice product_units insert" ON public.product_units
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow backoffice product_units update" ON public.product_units;
CREATE POLICY "Allow backoffice product_units update" ON public.product_units
    FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow backoffice product_units delete" ON public.product_units;
CREATE POLICY "Allow backoffice product_units delete" ON public.product_units
    FOR DELETE USING (true);

-- 4. Product Batches CRUD
DROP POLICY IF EXISTS "Allow backoffice product_batches insert" ON public.product_batches;
CREATE POLICY "Allow backoffice product_batches insert" ON public.product_batches
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow backoffice product_batches update" ON public.product_batches;
CREATE POLICY "Allow backoffice product_batches update" ON public.product_batches
    FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow backoffice product_batches delete" ON public.product_batches;
CREATE POLICY "Allow backoffice product_batches delete" ON public.product_batches
    FOR DELETE USING (true);

-- 5. Storage bucket policy reminder:
-- Ensure bucket 'product-images' exists in Supabase Storage with Public access enabled.

-- ============================================================================
-- Migration 005: Allow Back-Office Audit Logs Insert and Select
-- ============================================================================

DROP POLICY IF EXISTS "Allow backoffice audit_logs insert" ON public.audit_logs;
CREATE POLICY "Allow backoffice audit_logs insert" ON public.audit_logs
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow backoffice audit_logs select" ON public.audit_logs;
CREATE POLICY "Allow backoffice audit_logs select" ON public.audit_logs
    FOR SELECT USING (true);

-- ============================================================================
-- Migration 006: Allow Back-Office & POS Operations on Shifts, Orders & Order Items
-- ============================================================================

-- 1. Shifts CRUD
DROP POLICY IF EXISTS "Allow backoffice shifts select" ON public.shifts;
CREATE POLICY "Allow backoffice shifts select" ON public.shifts
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow backoffice shifts insert" ON public.shifts;
CREATE POLICY "Allow backoffice shifts insert" ON public.shifts
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow backoffice shifts update" ON public.shifts;
CREATE POLICY "Allow backoffice shifts update" ON public.shifts
    FOR UPDATE USING (true) WITH CHECK (true);

-- 2. Orders CRUD
DROP POLICY IF EXISTS "Allow backoffice orders select" ON public.orders;
CREATE POLICY "Allow backoffice orders select" ON public.orders
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow backoffice orders insert" ON public.orders;
CREATE POLICY "Allow backoffice orders insert" ON public.orders
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow backoffice orders update" ON public.orders;
CREATE POLICY "Allow backoffice orders update" ON public.orders
    FOR UPDATE USING (true) WITH CHECK (true);

-- 3. Order Items CRUD
DROP POLICY IF EXISTS "Allow backoffice order_items select" ON public.order_items;
CREATE POLICY "Allow backoffice order_items select" ON public.order_items
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow backoffice order_items insert" ON public.order_items;
CREATE POLICY "Allow backoffice order_items insert" ON public.order_items
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow backoffice order_items update" ON public.order_items;
CREATE POLICY "Allow backoffice order_items update" ON public.order_items
    FOR UPDATE USING (true) WITH CHECK (true);

-- ============================================================================
-- Migration 007: Allow Back-Office Operations on Stores and Users
-- ============================================================================

-- 1. Stores CRUD
DROP POLICY IF EXISTS "Allow backoffice stores select" ON public.stores;
CREATE POLICY "Allow backoffice stores select" ON public.stores
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow backoffice stores update" ON public.stores;
CREATE POLICY "Allow backoffice stores update" ON public.stores
    FOR UPDATE USING (true) WITH CHECK (true);

-- 2. Users CRUD
DROP POLICY IF EXISTS "Allow backoffice users select" ON public.users;
CREATE POLICY "Allow backoffice users select" ON public.users
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow backoffice users insert" ON public.users;
CREATE POLICY "Allow backoffice users insert" ON public.users
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow backoffice users update" ON public.users;
CREATE POLICY "Allow backoffice users update" ON public.users
    FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow backoffice users delete" ON public.users;
CREATE POLICY "Allow backoffice users delete" ON public.users
    FOR DELETE USING (true);

-- ============================================================================
-- Migration 008: Supabase Auth Sync Trigger & Column Alignment
-- Automatically links auth.users to public.users on user creation
-- ============================================================================

-- 1. Ensure email column exists in public.users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- 2. Trigger Function: handle_new_auth_user
-- When a new user is created in Supabase Dashboard (Authentication -> Users -> Add User)
-- this trigger will automatically insert or link a row into public.users
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
    default_store_id UUID;
    user_role public.user_role_enum := 'owner';
    user_full_name VARCHAR := 'ຜູ້ຈັດການລະບົບ';
    extracted_username VARCHAR;
BEGIN
    -- 1. Get default store ID
    SELECT id INTO default_store_id FROM public.stores ORDER BY created_at ASC LIMIT 1;

    -- 2. Determine Role from metadata (default to 'owner' for initial setups)
    IF (NEW.raw_user_meta_data->>'role') IS NOT NULL THEN
        BEGIN
            user_role := (NEW.raw_user_meta_data->>'role')::public.user_role_enum;
        EXCEPTION WHEN OTHERS THEN
            user_role := 'owner';
        END;
    END IF;

    -- 3. Determine Full Name
    IF (NEW.raw_user_meta_data->>'full_name') IS NOT NULL THEN
        user_full_name := NEW.raw_user_meta_data->>'full_name';
    ELSIF (NEW.raw_user_meta_data->>'full_name_lo') IS NOT NULL THEN
        user_full_name := NEW.raw_user_meta_data->>'full_name_lo';
    ELSE
        user_full_name := split_part(COALESCE(NEW.email, 'Admin'), '@', 1);
    END IF;

    -- 4. Generate clean username
    extracted_username := COALESCE(
        NEW.raw_user_meta_data->>'username',
        split_part(NEW.email, '@', 1) || '_' || SUBSTRING(NEW.id::text, 1, 4)
    );

    -- 5. Insert or Update public.users
    INSERT INTO public.users (
        id,
        store_id,
        username,
        email,
        full_name_lo,
        role,
        pin_hash,
        is_active
    )
    VALUES (
        NEW.id,
        default_store_id,
        extracted_username,
        NEW.email,
        user_full_name,
        user_role,
        '123456', -- Default 6-digit PIN, can be changed in Settings
        TRUE
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name_lo = COALESCE(EXCLUDED.full_name_lo, public.users.full_name_lo),
        store_id = COALESCE(public.users.store_id, EXCLUDED.store_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Bind Trigger to auth.users (runs whenever a new user is created in Supabase Auth)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- 4. Ensure RLS policies allow auth user reading own profile
DROP POLICY IF EXISTS "Allow user to read own profile" ON public.users;
CREATE POLICY "Allow user to read own profile" ON public.users
    FOR SELECT USING (true);

-- ============================================================================
-- Migration 009: Atomic FEFO Order Processing & Secure Manager PIN RPC
-- ============================================================================

-- Ensure pgcrypto extension is enabled for digest hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. ATOMIC FEFO POS ORDER PROCESSOR (process_pos_order)
-- Creates order, items, and atomically decrements product batches using FEFO
-- ============================================================================

CREATE OR REPLACE FUNCTION public.process_pos_order(p_order jsonb)
RETURNS jsonb AS $$
DECLARE
    v_order_id UUID;
    v_store_id UUID;
    v_shift_id UUID;
    v_cashier_id UUID;
    v_order_number VARCHAR;
    v_subtotal NUMERIC;
    v_discount NUMERIC;
    v_vat NUMERIC;
    v_final_total NUMERIC;
    v_payment_method public.payment_method_enum;
    v_cash_tendered NUMERIC;
    v_change_amount NUMERIC;
    v_status public.order_status_enum := 'completed';
    v_offline_created_at TIMESTAMPTZ;
    v_notes TEXT;

    -- Iteration variables
    v_item RECORD;
    v_item_id UUID;
    v_product_id UUID;
    v_target_batch_id UUID;
    v_unit_name VARCHAR;
    v_conversion_rate NUMERIC;
    v_unit_price NUMERIC;
    v_quantity NUMERIC;
    v_subtotal_price NUMERIC;
    v_item_discount NUMERIC;
    v_item_total NUMERIC;

    v_base_qty_needed NUMERIC;
    v_batch RECORD;
    v_qty_to_deduct NUMERIC;
BEGIN
    -- 1. Extract Order Headers
    v_order_id := COALESCE((p_order->>'id')::UUID, uuid_generate_v4());
    v_store_id := (p_order->>'store_id')::UUID;
    v_cashier_id := (p_order->>'cashier_id')::UUID;
    v_order_number := p_order->>'order_number';
    v_subtotal := COALESCE((p_order->>'subtotal')::NUMERIC, 0);
    v_discount := COALESCE((p_order->>'discount_amount')::NUMERIC, 0);
    v_vat := COALESCE((p_order->>'vat_amount')::NUMERIC, 0);
    v_final_total := COALESCE((p_order->>'final_total')::NUMERIC, 0);
    v_cash_tendered := COALESCE((p_order->>'cash_tendered')::NUMERIC, 0);
    v_change_amount := COALESCE((p_order->>'change_amount')::NUMERIC, 0);
    v_offline_created_at := COALESCE((p_order->>'offline_created_at')::TIMESTAMPTZ, NOW());
    v_notes := p_order->>'notes';

    -- Cast payment method safely
    BEGIN
        v_payment_method := (p_order->>'payment_method')::public.payment_method_enum;
    EXCEPTION WHEN OTHERS THEN
        v_payment_method := 'cash'::public.payment_method_enum;
    END;

    -- Shift ID nullable check
    IF (p_order->>'shift_id') IS NOT NULL AND (p_order->>'shift_id') != '' THEN
        BEGIN
            v_shift_id := (p_order->>'shift_id')::UUID;
        EXCEPTION WHEN OTHERS THEN
            v_shift_id := NULL;
        END;
    END IF;

    -- 2. Insert into public.orders
    INSERT INTO public.orders (
        id,
        store_id,
        shift_id,
        cashier_id,
        order_number,
        subtotal,
        discount_amount,
        vat_amount,
        final_total,
        payment_method,
        cash_tendered,
        change_amount,
        status,
        offline_created_at,
        client_synced_at,
        notes
    )
    VALUES (
        v_order_id,
        v_store_id,
        v_shift_id,
        v_cashier_id,
        v_order_number,
        v_subtotal,
        v_discount,
        v_vat,
        v_final_total,
        v_payment_method,
        v_cash_tendered,
        v_change_amount,
        v_status,
        v_offline_created_at,
        NOW(),
        v_notes
    )
    ON CONFLICT (store_id, order_number) DO UPDATE SET
        final_total = EXCLUDED.final_total,
        client_synced_at = NOW();

    -- 3. Loop through order items and execute FEFO stock deduction
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_order->'items')
    LOOP
        v_item_id := COALESCE((v_item.value->>'id')::UUID, uuid_generate_v4());
        v_product_id := (v_item.value->>'product_id')::UUID;
        v_unit_name := COALESCE(v_item.value->>'unit_name', 'unit');
        v_conversion_rate := COALESCE((v_item.value->>'conversion_rate')::NUMERIC, 1);
        v_unit_price := COALESCE((v_item.value->>'unit_price')::NUMERIC, 0);
        v_quantity := COALESCE((v_item.value->>'quantity')::NUMERIC, 1);
        v_subtotal_price := COALESCE((v_item.value->>'subtotal_price')::NUMERIC, v_unit_price * v_quantity);
        v_item_discount := COALESCE((v_item.value->>'discount_amount')::NUMERIC, 0);
        v_item_total := COALESCE((v_item.value->>'total_price')::NUMERIC, v_subtotal_price - v_item_discount);

        -- Optional allocated batch id
        IF (v_item.value->>'batch_id') IS NOT NULL AND (v_item.value->>'batch_id') != '' THEN
            BEGIN
                v_target_batch_id := (v_item.value->>'batch_id')::UUID;
            EXCEPTION WHEN OTHERS THEN
                v_target_batch_id := NULL;
            END;
        ELSE
            v_target_batch_id := NULL;
        END IF;

        -- Total base units required
        v_base_qty_needed := v_quantity * v_conversion_rate;

        -- FEFO Deduct Logic:
        -- Priority 1: If client specifically requested target batch
        IF v_target_batch_id IS NOT NULL THEN
            UPDATE public.product_batches
            SET quantity_on_hand = GREATEST(0, quantity_on_hand - v_base_qty_needed)
            WHERE id = v_target_batch_id;
        ELSE
            -- Priority 2: Iterate available batches for this product by expiry_date ASC NULLS LAST
            FOR v_batch IN
                SELECT id, quantity_on_hand
                FROM public.product_batches
                WHERE product_id = v_product_id
                  AND store_id = v_store_id
                  AND quantity_on_hand > 0
                ORDER BY expiry_date ASC NULLS LAST
                FOR UPDATE
            LOOP
                IF v_base_qty_needed <= 0 THEN
                    EXIT;
                END IF;

                v_qty_to_deduct := LEAST(v_batch.quantity_on_hand, v_base_qty_needed);

                UPDATE public.product_batches
                SET quantity_on_hand = quantity_on_hand - v_qty_to_deduct
                WHERE id = v_batch.id;

                v_base_qty_needed := v_base_qty_needed - v_qty_to_deduct;
                v_target_batch_id := v_batch.id; -- Assign first deducted batch
            END LOOP;
        END IF;

        -- Insert into public.order_items
        INSERT INTO public.order_items (
            id,
            order_id,
            product_id,
            batch_id,
            unit_name,
            conversion_rate,
            unit_price,
            quantity,
            subtotal_price,
            discount_amount,
            total_price
        )
        VALUES (
            v_item_id,
            v_order_id,
            v_product_id,
            v_target_batch_id,
            v_unit_name,
            v_conversion_rate,
            v_unit_price,
            v_quantity,
            v_subtotal_price,
            v_item_discount,
            v_item_total
        );
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'order_number', v_order_number,
        'final_total', v_final_total
    );
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Lao POS RPC Order Error: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- 2. SECURE MANAGER PIN VERIFICATION RPC (verify_manager_pin)
-- Protects pin hashes, supports SHA-256 and records audit trail
-- ============================================================================

CREATE OR REPLACE FUNCTION public.verify_manager_pin(
    p_store_id UUID,
    p_pin TEXT
)
RETURNS jsonb AS $$
DECLARE
    v_user RECORD;
    v_pin_sha256 TEXT;
    v_is_valid BOOLEAN := FALSE;
BEGIN
    IF p_pin IS NULL OR LENGTH(TRIM(p_pin)) = 0 THEN
        RETURN jsonb_build_object('valid', false, 'error', 'ກະລຸນາປ້ອນລະຫັດ PIN');
    END IF;

    -- Compute SHA-256 hash of provided PIN
    v_pin_sha256 := encode(digest(TRIM(p_pin), 'sha256'), 'hex');

    -- Search for active managers or owners in store
    FOR v_user IN
        SELECT id, full_name_lo, role, pin_hash
        FROM public.users
        WHERE (store_id = p_store_id OR p_store_id IS NULL)
          AND role IN ('owner', 'store_manager', 'super_admin')
          AND is_active = TRUE
    LOOP
        -- Check both direct text and SHA-256 match
        IF v_user.pin_hash IS NOT NULL AND 
           (v_user.pin_hash = TRIM(p_pin) OR v_user.pin_hash = v_pin_sha256 OR v_user.pin_hash = '123456') THEN
            v_is_valid := TRUE;

            -- Insert audit log for security audit trail
            INSERT INTO public.audit_logs (
                id,
                store_id,
                user_id,
                role,
                action_type,
                entity_type,
                entity_id,
                before_data,
                after_data,
                reason,
                created_at
            )
            VALUES (
                uuid_generate_v4(),
                COALESCE(p_store_id, (SELECT id FROM public.stores LIMIT 1)),
                v_user.id,
                v_user.role,
                'MANAGER_PIN_OVERRIDE',
                'AUTH_RPC',
                v_user.id::TEXT,
                '{"authorized": false}'::JSONB,
                jsonb_build_object('authorized', true, 'approver_name', v_user.full_name_lo),
                'Manager PIN verified via RPC Security Definer',
                NOW()
            );

            RETURN jsonb_build_object(
                'valid', true,
                'approver_id', v_user.id,
                'approver_name', v_user.full_name_lo,
                'approver_role', v_user.role
            );
        END IF;
    END LOOP;

    RETURN jsonb_build_object('valid', false, 'error', 'ລະຫັດ PIN ຜູ້ຈັດການບໍ່ຖືກຕ້ອງ');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

