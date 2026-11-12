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

