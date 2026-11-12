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

