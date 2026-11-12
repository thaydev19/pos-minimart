-- ============================================================================
-- Seed Data for Lao Minimart POS (ມິນິມາດ ລາວຈະເລີນ)
-- Run this in Supabase SQL Editor: Dashboard -> SQL Editor -> New Query -> Run
-- Contains 100% Real Image URLs, Conversion Units, and FEFO Batches
-- ============================================================================

-- 1. Create Default Store (ຮ້ານຄ້າ)
INSERT INTO public.stores (id, name_lo, name_en, address_lo, phone, tax_code, currency)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'ມິນິມາດ ລາວຈະເລີນ',
    'Lao Chaleun Minimart',
    'ສາຂາ: ດົງໂດກ, ນະຄອນຫຼວງວຽງຈັນ',
    '020 5555 8888',
    '0102030405',
    'LAK'
) 
ON CONFLICT (id) DO UPDATE SET
    name_lo = EXCLUDED.name_lo,
    address_lo = EXCLUDED.address_lo,
    phone = EXCLUDED.phone;

-- 2. Create Staff & Test Accounts
-- Creates accounts in auth.users and public.users (Password: password123)
-- Manager PIN: "123456"

DO $$
BEGIN
    -- 2.1 Insert into auth.users if available
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    )
    VALUES
        (
            '00000000-0000-0000-0000-000000000000',
            'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
            'authenticated',
            'authenticated',
            'admin@laochaleun.la',
            crypt('password123', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"full_name":"ຜູ້ຈັດການໃຫຍ່ (Admin)","role":"owner"}',
            NOW(),
            NOW(),
            '', '', '', ''
        ),
        (
            '00000000-0000-0000-0000-000000000000',
            'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c33',
            'authenticated',
            'authenticated',
            'manager@laochaleun.la',
            crypt('password123', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"full_name":"ສົມພອນ (Somphone)","role":"store_manager"}',
            NOW(),
            NOW(),
            '', '', '', ''
        ),
        (
            '00000000-0000-0000-0000-000000000000',
            'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22',
            'authenticated',
            'authenticated',
            'cashier@laochaleun.la',
            crypt('password123', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"full_name":"ສຸລິວັນ (Sourivanh)","role":"cashier"}',
            NOW(),
            NOW(),
            '', '', '', ''
        )
    ON CONFLICT (email) DO UPDATE SET
        encrypted_password = crypt('password123', gen_salt('bf')),
        raw_user_meta_data = EXCLUDED.raw_user_meta_data;

    -- 2.2 Insert into auth.identities
    INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
    )
    VALUES
        (
            'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
            'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
            jsonb_build_object('sub', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'email', 'admin@laochaleun.la'),
            'email',
            'admin@laochaleun.la',
            NOW(), NOW(), NOW()
        ),
        (
            'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c33',
            'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c33',
            jsonb_build_object('sub', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', 'email', 'manager@laochaleun.la'),
            'email',
            'manager@laochaleun.la',
            NOW(), NOW(), NOW()
        ),
        (
            'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22',
            'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22',
            jsonb_build_object('sub', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'email', 'cashier@laochaleun.la'),
            'email',
            'cashier@laochaleun.la',
            NOW(), NOW(), NOW()
        )
    ON CONFLICT (provider, provider_id) DO NOTHING;

EXCEPTION WHEN OTHERS THEN
    -- If auth.users insert is restricted by environment, continue to public.users
    RAISE NOTICE 'Notice: Auth users creation skipped or partially handled: %', SQLERRM;
END $$;

-- 2.3 Insert into public.users
INSERT INTO public.users (id, store_id, username, email, full_name_lo, role, pin_hash)
VALUES 
    (
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        'admin',
        'admin@laochaleun.la',
        'ຜູ້ຈັດການໃຫຍ່ (Admin)',
        'owner',
        '123456'
    ),
    (
        'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c33',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        'somphone',
        'manager@laochaleun.la',
        'ສົມພອນ (Somphone)',
        'store_manager',
        '123456'
    ),
    (
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        'sourivanh',
        'cashier@laochaleun.la',
        'ສຸລິວັນ (Sourivanh)',
        'cashier',
        NULL
    ) 
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    full_name_lo = EXCLUDED.full_name_lo,
    pin_hash = EXCLUDED.pin_hash;

-- 3. Create Categories (ໝວດໝູ່)
INSERT INTO public.categories (id, store_id, name_lo, name_en, icon, sort_order)
VALUES
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d01', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'ເຄື່ອງດື່ມ & ເບຍ', 'Drinks & Beer', 'Beer', 1),
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d02', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'ໝີ່ & ອາຫານແຫ້ງ', 'Snacks & Noodles', 'Utensils', 2),
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d03', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'ນົມ & ເຄື່ອງດື່ມບຳລຸງ', 'Dairy & Nutrition', 'Milk', 3),
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d04', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'ສິນຄ້າສົດ & ຊັ່ງກິໂລ', 'Fresh & Scale Items', 'Scale', 4),
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d05', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'ກາເຟ & ເຄື່ອງໃຊ້', 'Coffee & Goods', 'Coffee', 5),
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d06', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'ຂາຍດ່ວນ / ບໍ່ມີບາໂຄດ', 'Quick Non-barcode', 'Zap', 6)
ON CONFLICT (id) DO UPDATE SET
    name_lo = EXCLUDED.name_lo,
    icon = EXCLUDED.icon,
    sort_order = EXCLUDED.sort_order;

-- 4. Products, Units, and Batches with Real Image URLs

-- 4.1 Beerlao Lager 330ml Can
INSERT INTO public.products (id, store_id, category_id, barcode, sku, name_lo, name_en, base_unit, cost_price, selling_price, is_perishable, warning_days_before_expiry, is_weighing, image_url, is_active)
VALUES (
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e01',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d01',
    '8850029100018',
    'BL-330',
    'ເບຍລາວ ລາເກີ 330ມລ (Beerlao Lager)',
    'Beerlao Lager 330ml Can',
    'ປ໋ອງ',
    11500,
    14000,
    TRUE,
    30,
    FALSE,
    'https://upload.wikimedia.org/wikipedia/commons/9/94/Beerlao_lager.jpg',
    TRUE
)
ON CONFLICT (store_id, barcode) DO UPDATE SET
    image_url = EXCLUDED.image_url,
    selling_price = EXCLUDED.selling_price,
    cost_price = EXCLUDED.cost_price,
    name_lo = EXCLUDED.name_lo;

INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, selling_price, barcode, is_base_unit)
VALUES
    ('6b12f3ea-26bb-4640-a2d0-604f29fa920f', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e01', 'ປ໋ອງ', 1, 14000, '8850029100018', TRUE),
    ('65c4ed04-3230-492c-befa-7e55b909537b', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e01', 'ແພັກ (6 ປ໋ອງ)', 6, 82000, '8850029100018-P6', FALSE),
    ('42f20274-55f9-4f79-aec0-095a9743b886', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e01', 'ແກັດ (24 ປ໋ອງ)', 24, 320000, '8850029100018-C24', FALSE)
ON CONFLICT (id) DO UPDATE SET selling_price = EXCLUDED.selling_price;

INSERT INTO public.product_batches (id, store_id, product_id, batch_number, expiry_date, quantity_on_hand, cost_price, is_clearance)
VALUES (
    '942fdff1-7f56-41e7-ba0b-c5cbe875aa69',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e01',
    'BL-2026-B1',
    '2027-08-15',
    148,
    11500,
    FALSE
)
ON CONFLICT (id) DO UPDATE SET quantity_on_hand = EXCLUDED.quantity_on_hand;

-- 4.2 Tigerhead Drinking Water 600ml
INSERT INTO public.products (id, store_id, category_id, barcode, sku, name_lo, name_en, base_unit, cost_price, selling_price, is_perishable, warning_days_before_expiry, is_weighing, image_url, is_active)
VALUES (
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e02',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d01',
    '8850029100025',
    'TH-600',
    'ນ້ຳດື່ມຫົວເສືອ 600ມລ (Tigerhead Water)',
    'Tigerhead Water 600ml',
    'ຕຸກ',
    3800,
    5000,
    TRUE,
    60,
    FALSE,
    'https://www.beerlao.la/media/r5cflnvf/tgh-600ml.png',
    TRUE
)
ON CONFLICT (store_id, barcode) DO UPDATE SET
    image_url = EXCLUDED.image_url,
    selling_price = EXCLUDED.selling_price;

INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, selling_price, barcode, is_base_unit)
VALUES
    ('6b12f3ea-26bb-4640-a2d0-604f29fa9210', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e02', 'ຕຸກ', 1, 5000, '8850029100025', TRUE),
    ('6b12f3ea-26bb-4640-a2d0-604f29fa9211', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e02', 'ແພັກ (12 ຕຸກ)', 12, 55000, '8850029100025-P12', FALSE)
ON CONFLICT (id) DO UPDATE SET selling_price = EXCLUDED.selling_price;

INSERT INTO public.product_batches (id, store_id, product_id, batch_number, expiry_date, quantity_on_hand, cost_price, is_clearance)
VALUES (
    '942fdff1-7f56-41e7-ba0b-c5cbe875aa70',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e02',
    'TH-26A',
    '2027-11-20',
    280,
    3800,
    FALSE
)
ON CONFLICT (id) DO NOTHING;

-- 4.3 Lactasoy Soy Milk 250ml (Near Expiry Clearance Showcase)
INSERT INTO public.products (id, store_id, category_id, barcode, sku, name_lo, name_en, base_unit, cost_price, selling_price, is_perishable, warning_days_before_expiry, is_weighing, image_url, is_active)
VALUES (
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e03',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d03',
    '8850029100032',
    'LS-250',
    'ນົມຖົ່ວເຫຼືອງ ແລັກຕາຊອຍ 250ມລ (Lactasoy)',
    'Lactasoy Soy Milk 250ml',
    'ກ່ອງ',
    5200,
    7000,
    TRUE,
    15,
    FALSE,
    'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80',
    TRUE
)
ON CONFLICT (store_id, barcode) DO UPDATE SET
    image_url = EXCLUDED.image_url,
    selling_price = EXCLUDED.selling_price;

INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, selling_price, barcode, is_base_unit)
VALUES
    ('6b12f3ea-26bb-4640-a2d0-604f29fa9212', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e03', 'ກ່ອງ', 1, 7000, '8850029100032', TRUE),
    ('6b12f3ea-26bb-4640-a2d0-604f29fa9213', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e03', 'ແພັກ (6 ກ່ອງ)', 6, 39000, '8850029100032-P6', FALSE)
ON CONFLICT (id) DO UPDATE SET selling_price = EXCLUDED.selling_price;

INSERT INTO public.product_batches (id, store_id, product_id, batch_number, expiry_date, quantity_on_hand, cost_price, is_clearance, clearance_price)
VALUES 
    (
        '942fdff1-7f56-41e7-ba0b-c5cbe875aa71',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e03',
        'LS-EXP-08D',
        CURRENT_DATE + INTERVAL '8 days',
        14,
        4500,
        TRUE,
        5000
    ),
    (
        '942fdff1-7f56-41e7-ba0b-c5cbe875aa72',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e03',
        'LS-FRESH',
        '2027-05-10',
        96,
        5200,
        FALSE,
        NULL
    )
ON CONFLICT (id) DO NOTHING;

-- 4.4 Red Bull Extra Laos 150ml
INSERT INTO public.products (id, store_id, category_id, barcode, sku, name_lo, name_en, base_unit, cost_price, selling_price, is_perishable, warning_days_before_expiry, is_weighing, image_url, is_active)
VALUES (
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e04',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d01',
    '8850029100049',
    'RB-150',
    'ກະທິງແດງ ເອັກສະຕຣ້າ 150ມລ (Red Bull Extra)',
    'Red Bull Extra 150ml',
    'ຕຸກ',
    7800,
    10000,
    TRUE,
    45,
    FALSE,
    'https://images.unsplash.com/photo-1622543925917-763c34d1a86e?auto=format&fit=crop&w=400&q=80',
    TRUE
)
ON CONFLICT (store_id, barcode) DO UPDATE SET
    image_url = EXCLUDED.image_url,
    selling_price = EXCLUDED.selling_price;

INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, selling_price, barcode, is_base_unit)
VALUES
    ('6b12f3ea-26bb-4640-a2d0-604f29fa9214', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e04', 'ຕຸກ', 1, 10000, '8850029100049', TRUE),
    ('6b12f3ea-26bb-4640-a2d0-604f29fa9215', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e04', 'ແພັກ (10 ຕຸກ)', 10, 95000, '8850029100049-P10', FALSE)
ON CONFLICT (id) DO UPDATE SET selling_price = EXCLUDED.selling_price;

INSERT INTO public.product_batches (id, store_id, product_id, batch_number, expiry_date, quantity_on_hand, cost_price, is_clearance)
VALUES (
    '942fdff1-7f56-41e7-ba0b-c5cbe875aa73',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e04',
    'RB-2026-X',
    '2027-09-01',
    72,
    7800,
    FALSE
)
ON CONFLICT (id) DO NOTHING;

-- 4.5 Mama Instant Noodles Creamy Tom Yum
INSERT INTO public.products (id, store_id, category_id, barcode, sku, name_lo, name_en, base_unit, cost_price, selling_price, is_perishable, warning_days_before_expiry, is_weighing, image_url, is_active)
VALUES (
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e05',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d02',
    '8850029100056',
    'MAMA-TY',
    'ໝີ່ ມາມ່າ ຕົ້ມຍຳກຸ້ງນ້ຳຂົ້ນ (Mama Tom Yum)',
    'Mama Instant Noodles Shrimp Creamy Tom Yum',
    'ຊອງ',
    4600,
    6000,
    TRUE,
    30,
    FALSE,
    'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=400&q=80',
    TRUE
)
ON CONFLICT (store_id, barcode) DO UPDATE SET
    image_url = EXCLUDED.image_url,
    selling_price = EXCLUDED.selling_price;

INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, selling_price, barcode, is_base_unit)
VALUES
    ('6b12f3ea-26bb-4640-a2d0-604f29fa9216', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e05', 'ຊອງ', 1, 6000, '8850029100056', TRUE),
    ('6b12f3ea-26bb-4640-a2d0-604f29fa9217', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e05', 'ແພັກ (10 ຊອງ)', 10, 57000, '8850029100056-P10', FALSE),
    ('6b12f3ea-26bb-4640-a2d0-604f29fa9218', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e05', 'ແກັດ (30 ຊອງ)', 30, 165000, '8850029100056-C30', FALSE)
ON CONFLICT (id) DO UPDATE SET selling_price = EXCLUDED.selling_price;

INSERT INTO public.product_batches (id, store_id, product_id, batch_number, expiry_date, quantity_on_hand, cost_price, is_clearance)
VALUES (
    '942fdff1-7f56-41e7-ba0b-c5cbe875aa74',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e05',
    'MM-TY-99',
    '2027-04-18',
    210,
    4600,
    FALSE
)
ON CONFLICT (id) DO NOTHING;

-- 4.6 Dao Coffee 3-in-1 Original
INSERT INTO public.products (id, store_id, category_id, barcode, sku, name_lo, name_en, base_unit, cost_price, selling_price, is_perishable, warning_days_before_expiry, is_weighing, image_url, is_active)
VALUES (
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e06',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d05',
    '8850029100063',
    'DAO-30',
    'ກາເຟ ດາວ 3-in-1 ສູດດັ້ງເດີມ (Dao Coffee)',
    'Dao Coffee 3-in-1 Original 30 Sachets',
    'ຖົງ',
    52000,
    65000,
    TRUE,
    45,
    FALSE,
    'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80',
    TRUE
)
ON CONFLICT (store_id, barcode) DO UPDATE SET
    image_url = EXCLUDED.image_url,
    selling_price = EXCLUDED.selling_price;

INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, selling_price, barcode, is_base_unit)
VALUES
    ('6b12f3ea-26bb-4640-a2d0-604f29fa9219', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e06', 'ຖົງ (30 ຊອງນ້ອຍ)', 1, 65000, '8850029100063', TRUE)
ON CONFLICT (id) DO UPDATE SET selling_price = EXCLUDED.selling_price;

INSERT INTO public.product_batches (id, store_id, product_id, batch_number, expiry_date, quantity_on_hand, cost_price, is_clearance)
VALUES (
    '942fdff1-7f56-41e7-ba0b-c5cbe875aa75',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e06',
    'DAO-26',
    '2027-10-12',
    45,
    52000,
    FALSE
)
ON CONFLICT (id) DO NOTHING;

-- 4.7 Weighing Scale: Lao Sticky Rice per Kg
INSERT INTO public.products (id, store_id, category_id, barcode, sku, name_lo, name_en, base_unit, cost_price, selling_price, is_perishable, warning_days_before_expiry, is_weighing, image_url, is_active)
VALUES (
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e07',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d04',
    '00105',
    'SCALE-RICE',
    'ເຂົ້າໜຽວລາວຄຸນນະພາບດີ (ຊັ່ງກິໂລ)',
    'Lao Sticky Rice (Per Kg)',
    'ກິໂລ',
    17000,
    22000,
    TRUE,
    90,
    TRUE,
    'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80',
    TRUE
)
ON CONFLICT (store_id, barcode) DO UPDATE SET
    image_url = EXCLUDED.image_url,
    selling_price = EXCLUDED.selling_price;

INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, selling_price, barcode, is_base_unit)
VALUES
    ('6b12f3ea-26bb-4640-a2d0-604f29fa9220', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e07', 'ກິໂລ', 1, 22000, '00105', TRUE)
ON CONFLICT (id) DO UPDATE SET selling_price = EXCLUDED.selling_price;

INSERT INTO public.product_batches (id, store_id, product_id, batch_number, expiry_date, quantity_on_hand, cost_price, is_clearance)
VALUES (
    '942fdff1-7f56-41e7-ba0b-c5cbe875aa76',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e07',
    'RICE-L26',
    '2027-12-31',
    85,
    17000,
    FALSE
)
ON CONFLICT (id) DO NOTHING;

-- 4.8 Weighing Scale: Fresh Cavendish Banana per Kg
INSERT INTO public.products (id, store_id, category_id, barcode, sku, name_lo, name_en, base_unit, cost_price, selling_price, is_perishable, warning_days_before_expiry, is_weighing, image_url, is_active)
VALUES (
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e08',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d04',
    '00108',
    'SCALE-BANANA',
    'ກ້ວຍຫອມທອງ ສົດໃໝ່ (ຊັ່ງກິໂລ)',
    'Fresh Cavendish Banana (Per Kg)',
    'ກິໂລ',
    11000,
    16000,
    TRUE,
    5,
    TRUE,
    'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=400&q=80',
    TRUE
)
ON CONFLICT (store_id, barcode) DO UPDATE SET
    image_url = EXCLUDED.image_url,
    selling_price = EXCLUDED.selling_price;

INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, selling_price, barcode, is_base_unit)
VALUES
    ('6b12f3ea-26bb-4640-a2d0-604f29fa9221', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e08', 'ກິໂລ', 1, 16000, '00108', TRUE)
ON CONFLICT (id) DO UPDATE SET selling_price = EXCLUDED.selling_price;

INSERT INTO public.product_batches (id, store_id, product_id, batch_number, expiry_date, quantity_on_hand, cost_price, is_clearance)
VALUES (
    '942fdff1-7f56-41e7-ba0b-c5cbe875aa77',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e08',
    'BNN-04',
    CURRENT_DATE + INTERVAL '4 days',
    25.4,
    11000,
    FALSE
)
ON CONFLICT (id) DO NOTHING;

-- 4.9 Quick Sell Non-Barcode Item: Ice Bag (ນ້ຳກ້ອນອະນາໄມ)
INSERT INTO public.products (id, store_id, category_id, barcode, sku, name_lo, name_en, base_unit, cost_price, selling_price, is_perishable, warning_days_before_expiry, is_weighing, image_url, is_active)
VALUES (
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e09',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d06',
    'QUICK_ICE',
    'ICE-BAG',
    'ນ້ຳກ້ອນອະນາໄມ (ຖົງ)',
    'Clean Tube Ice Bag',
    'ຖົງ',
    2500,
    5000,
    TRUE,
    1,
    FALSE,
    'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=400&q=80',
    TRUE
)
ON CONFLICT (store_id, barcode) DO UPDATE SET
    image_url = EXCLUDED.image_url,
    selling_price = EXCLUDED.selling_price;

INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, selling_price, barcode, is_base_unit)
VALUES
    ('6b12f3ea-26bb-4640-a2d0-604f29fa9222', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e09', 'ຖົງ', 1, 5000, 'QUICK_ICE', TRUE)
ON CONFLICT (id) DO UPDATE SET selling_price = EXCLUDED.selling_price;

INSERT INTO public.product_batches (id, store_id, product_id, batch_number, expiry_date, quantity_on_hand, cost_price, is_clearance)
VALUES (
    '942fdff1-7f56-41e7-ba0b-c5cbe875aa78',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e09',
    'ICE-TODAY',
    CURRENT_DATE,
    100,
    2500,
    FALSE
)
ON CONFLICT (id) DO NOTHING;

-- 4.10 Quick Sell Non-Barcode Item: Minimart Shopping Bag
INSERT INTO public.products (id, store_id, category_id, barcode, sku, name_lo, name_en, base_unit, cost_price, selling_price, is_perishable, warning_days_before_expiry, is_weighing, image_url, is_active)
VALUES (
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e10',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d06',
    'QUICK_BAG',
    'PLASTIC-BAG',
    'ຖົງຢາງມິນິມາດ (ຂະໜາດກາງ)',
    'Minimart Shopping Bag',
    'ໃບ',
    400,
    1000,
    FALSE,
    999,
    FALSE,
    'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=400&q=80',
    TRUE
)
ON CONFLICT (store_id, barcode) DO UPDATE SET
    image_url = EXCLUDED.image_url,
    selling_price = EXCLUDED.selling_price;

INSERT INTO public.product_units (id, product_id, unit_name, conversion_rate, selling_price, barcode, is_base_unit)
VALUES
    ('6b12f3ea-26bb-4640-a2d0-604f29fa9223', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e10', 'ໃບ', 1, 1000, 'QUICK_BAG', TRUE)
ON CONFLICT (id) DO UPDATE SET selling_price = EXCLUDED.selling_price;

INSERT INTO public.product_batches (id, store_id, product_id, batch_number, expiry_date, quantity_on_hand, cost_price, is_clearance)
VALUES (
    '942fdff1-7f56-41e7-ba0b-c5cbe875aa79',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e10',
    'BAG-STOCK',
    '2030-12-31',
    1000,
    400,
    FALSE
)
ON CONFLICT (id) DO NOTHING;
