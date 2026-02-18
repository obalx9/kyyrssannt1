/*
  Add Telegram Bot for Authentication

  This script adds the Telegram bot configuration.

  Bot Details:
  - bot_token: 8485758380:AAG2AjJwRYpjqNX6qmHzFEEcUB5oyyA1e7o
  - bot_username: mqmqmmqbot
  - channel_id: -1003542737204
  - webhook_secret: a16f3c03-3201-438d-b953-df3b6298934b
*/

-- First, check if channel_id column exists, if not add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'telegram_bots' AND column_name = 'channel_id'
  ) THEN
    ALTER TABLE telegram_bots ADD COLUMN channel_id text;
    RAISE NOTICE 'Added channel_id column to telegram_bots table';
  END IF;
END $$;

-- Check the current structure of telegram_bots
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'telegram_bots'
ORDER BY ordinal_position;

-- Option 1: If you already have a seller profile
-- Replace 'YOUR_SELLER_ID' with your actual seller ID
/*
INSERT INTO telegram_bots (
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
  'YOUR_SELLER_ID'::uuid,
  '8485758380:AAG2AjJwRYpjqNX6qmHzFEEcUB5oyyA1e7o',
  'mqmqmmqbot',
  '-1003542737204',
  'a16f3c03-3201-438d-b953-df3b6298934b',
  true,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  bot_token = EXCLUDED.bot_token,
  bot_username = EXCLUDED.bot_username,
  channel_id = EXCLUDED.channel_id,
  webhook_secret = EXCLUDED.webhook_secret,
  is_active = EXCLUDED.is_active;
*/

-- Option 2: Create a temporary seller and bot (for testing/setup)
-- This will create everything needed

-- Step 1: Create seller profile if not exists
INSERT INTO sellers (
  id,
  user_id,
  business_name,
  description,
  is_approved,
  created_at
) VALUES (
  '9f8e7d6c-5b4a-3c2d-1e0f-abcdef123456'::uuid,
  '4860f71c-ad1d-49d3-af82-d769220e9135'::uuid,
  'Default Seller',
  'Platform administrator seller account',
  true,
  now()
)
ON CONFLICT (user_id) DO NOTHING;

-- Step 2: Assign seller role if not exists
INSERT INTO user_roles (
  user_id,
  role,
  created_at
) VALUES (
  '4860f71c-ad1d-49d3-af82-d769220e9135'::uuid,
  'seller',
  now()
)
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 3: Get the seller_id
DO $$
DECLARE
  v_seller_id uuid;
BEGIN
  -- Get seller_id for the user
  SELECT id INTO v_seller_id
  FROM sellers
  WHERE user_id = '4860f71c-ad1d-49d3-af82-d769220e9135'::uuid;

  IF v_seller_id IS NOT NULL THEN
    -- Insert telegram bot
    INSERT INTO telegram_bots (
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
      v_seller_id,
      '8485758380:AAG2AjJwRYpjqNX6qmHzFEEcUB5oyyA1e7o',
      'mqmqmmqbot',
      '-1003542737204',
      'a16f3c03-3201-438d-b953-df3b6298934b',
      true,
      now()
    )
    ON CONFLICT (id) DO UPDATE SET
      bot_token = EXCLUDED.bot_token,
      bot_username = EXCLUDED.bot_username,
      channel_id = EXCLUDED.channel_id,
      webhook_secret = EXCLUDED.webhook_secret,
      is_active = EXCLUDED.is_active;

    RAISE NOTICE '✅ Telegram bot added successfully!';
    RAISE NOTICE 'Seller ID: %', v_seller_id;
  ELSE
    RAISE EXCEPTION 'Seller not found for user';
  END IF;
END $$;

-- Verify the setup
SELECT
  tb.id,
  tb.seller_id,
  tb.bot_username,
  tb.channel_id,
  tb.is_active,
  s.business_name as seller_name,
  u.telegram_username as owner_username
FROM telegram_bots tb
JOIN sellers s ON s.id = tb.seller_id
JOIN users u ON u.id = s.user_id
WHERE tb.bot_username = 'mqmqmmqbot';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🤖 Telegram Bot Configuration:';
  RAISE NOTICE '    Username: @mqmqmmqbot';
  RAISE NOTICE '    Channel: -1003542737204';
  RAISE NOTICE '    Status: Active';
  RAISE NOTICE '';
  RAISE NOTICE '🔗 Next steps:';
  RAISE NOTICE '    1. Bot is linked to your seller account';
  RAISE NOTICE '    2. Login to the app with Telegram';
  RAISE NOTICE '    3. Bot will be used for authentication';
END $$;
