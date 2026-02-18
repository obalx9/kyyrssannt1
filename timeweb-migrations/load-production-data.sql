/*
  Production Data Setup (Fixed for TimeWeb Schema)

  This script loads:
  1. Super admin user (telegram_id: 428817128, username: crypget)
  2. Telegram bot configuration
  3. User roles and permissions

  IMPORTANT: Compatible with TimeWeb PostgreSQL schema
*/

-- ============================================
-- 1. Create Super Admin User
-- ============================================

INSERT INTO public.users (
  id,
  telegram_id,
  telegram_username,
  first_name,
  created_at
) VALUES (
  '4860f71c-ad1d-49d3-af82-d769220e9135'::uuid,
  428817128,
  'crypget',
  'Se',
  now()
)
ON CONFLICT (telegram_id)
DO UPDATE SET
  telegram_username = EXCLUDED.telegram_username,
  first_name = EXCLUDED.first_name;

-- ============================================
-- 2. Assign Super Admin Role
-- ============================================

INSERT INTO public.user_roles (
  id,
  user_id,
  role,
  created_at
) VALUES (
  'f76f39de-ff1e-4189-85c4-3503c3ee9998'::uuid,
  '4860f71c-ad1d-49d3-af82-d769220e9135'::uuid,
  'super_admin',
  now()
)
ON CONFLICT (user_id, role)
DO NOTHING;

-- ============================================
-- 3. Create Telegram Bot Integration
-- ============================================

-- First, check if telegram_bots table has course_id column
DO $$
BEGIN
  -- Insert bot configuration
  -- Note: If your schema requires seller_id instead of course_id, adjust accordingly
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'telegram_bots' AND column_name = 'seller_id'
  ) THEN
    -- Schema uses seller_id
    INSERT INTO public.telegram_bots (
      id,
      seller_id,
      bot_token,
      bot_username,
      channel_id,
      webhook_secret,
      is_active,
      created_at
    ) VALUES (
      'b820491e-6fd7-4346-ad19-0b50a82307d0'::uuid,
      NULL, -- You'll need to set this later when you create a seller
      '8485758380:AAG2AjJwRYpjqNX6qmHzFEEcUB5oyyA1e7o',
      'mqmqmmqbot',
      '-1003542737204',
      'a16f3c03-3201-438d-b953-df3b6298934b',
      true,
      now()
    )
    ON CONFLICT (id)
    DO UPDATE SET
      bot_token = EXCLUDED.bot_token,
      bot_username = EXCLUDED.bot_username,
      channel_id = EXCLUDED.channel_id,
      webhook_secret = EXCLUDED.webhook_secret,
      is_active = EXCLUDED.is_active;
  ELSE
    -- Schema might not have seller_id either, use minimal fields
    INSERT INTO public.telegram_bots (
      id,
      bot_token,
      bot_username,
      channel_id,
      webhook_secret,
      is_active,
      created_at
    ) VALUES (
      'b820491e-6fd7-4346-ad19-0b50a82307d0'::uuid,
      '8485758380:AAG2AjJwRYpjqNX6qmHzFEEcUB5oyyA1e7o',
      'mqmqmmqbot',
      '-1003542737204',
      'a16f3c03-3201-438d-b953-df3b6298934b',
      true,
      now()
    )
    ON CONFLICT (id)
    DO UPDATE SET
      bot_token = EXCLUDED.bot_token,
      bot_username = EXCLUDED.bot_username,
      channel_id = EXCLUDED.channel_id,
      webhook_secret = EXCLUDED.webhook_secret,
      is_active = EXCLUDED.is_active;
  END IF;
END $$;

-- ============================================
-- 4. Verify Setup
-- ============================================

-- Show created user
SELECT
  u.id,
  u.telegram_id,
  u.telegram_username,
  u.first_name,
  ur.role
FROM public.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
WHERE u.telegram_id = 428817128;

-- Show bot configuration
SELECT
  tb.id,
  tb.bot_username,
  tb.channel_id,
  tb.is_active
FROM public.telegram_bots tb
WHERE tb.bot_username = 'mqmqmmqbot';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Production data loaded successfully!';
  RAISE NOTICE '';
  RAISE NOTICE '👤 Super Admin:';
  RAISE NOTICE '    Telegram: @crypget (ID: 428817128)';
  RAISE NOTICE '    User ID: 4860f71c-ad1d-49d3-af82-d769220e9135';
  RAISE NOTICE '    Role: super_admin';
  RAISE NOTICE '';
  RAISE NOTICE '🤖 Telegram Bot:';
  RAISE NOTICE '    Username: @mqmqmmqbot';
  RAISE NOTICE '    Channel ID: -1003542737204';
  RAISE NOTICE '    Status: Active';
  RAISE NOTICE '';
  RAISE NOTICE '🔗 Next steps:';
  RAISE NOTICE '    1. Login to app with Telegram @crypget';
  RAISE NOTICE '    2. Create a seller profile';
  RAISE NOTICE '    3. Create a course';
  RAISE NOTICE '    4. Link bot to course in admin panel';
END $$;
