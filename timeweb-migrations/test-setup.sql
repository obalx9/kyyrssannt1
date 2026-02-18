/*
  Test Setup Script for Timeweb PostgreSQL

  This script creates test data to verify that migrations were applied correctly.
  Run this after applying all migrations.

  Usage:
    psql -h your-host -U your-user -d your-db -f test-setup.sql
*/

-- First, clean up any existing test users to avoid conflicts
DELETE FROM auth_sessions WHERE user_id IN (
  SELECT id FROM users WHERE telegram_id IN (999999999, 888888888, 777777777)
);
DELETE FROM user_roles WHERE user_id IN (
  SELECT id FROM users WHERE telegram_id IN (999999999, 888888888, 777777777)
);
DELETE FROM sellers WHERE user_id IN (
  SELECT id FROM users WHERE telegram_id IN (999999999, 888888888, 777777777)
);
DELETE FROM users WHERE telegram_id IN (999999999, 888888888, 777777777);

-- Create test admin user
DO $$
DECLARE
  admin_id uuid;
  admin_token text := 'test-admin-token-' || substr(md5(random()::text), 1, 16);
BEGIN
  -- Insert test admin
  INSERT INTO users (telegram_id, first_name, last_name, telegram_username)
  VALUES (999999999, 'Test', 'Admin', 'testadmin')
  ON CONFLICT (telegram_id) DO NOTHING
  RETURNING id INTO admin_id;

  -- If user already existed, get their ID
  IF admin_id IS NULL THEN
    SELECT id INTO admin_id FROM users WHERE telegram_id = 999999999;
  END IF;

  -- Add super_admin role (only if not exists)
  INSERT INTO user_roles (user_id, role)
  VALUES (admin_id, 'super_admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Create session
  INSERT INTO auth_sessions (user_id, token, expires_at)
  VALUES (admin_id, admin_token, now() + interval '1 day');

  RAISE NOTICE '✓ Test admin created!';
  RAISE NOTICE 'User ID: %', admin_id;
  RAISE NOTICE 'Token: %', admin_token;
  RAISE NOTICE '';
  RAISE NOTICE 'Test authentication with:';
  RAISE NOTICE 'SELECT authenticate_with_token(''%'');', admin_token;
END $$;

-- Create test seller
DO $$
DECLARE
  seller_user_id uuid;
  seller_id uuid;
  seller_token text := 'test-seller-token-' || substr(md5(random()::text), 1, 16);
BEGIN
  -- Insert test seller user
  INSERT INTO users (telegram_id, first_name, last_name, telegram_username)
  VALUES (888888888, 'Test', 'Seller', 'testseller')
  ON CONFLICT (telegram_id) DO NOTHING
  RETURNING id INTO seller_user_id;

  -- If user already existed, get their ID
  IF seller_user_id IS NULL THEN
    SELECT id INTO seller_user_id FROM users WHERE telegram_id = 888888888;
  END IF;

  -- Add seller role (only if not exists)
  INSERT INTO user_roles (user_id, role)
  VALUES (seller_user_id, 'seller')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Create seller profile (only if not exists)
  INSERT INTO sellers (user_id, business_name, description, is_approved)
  VALUES (seller_user_id, 'Test Business', 'Test seller account', true)
  ON CONFLICT (user_id) DO UPDATE SET is_approved = true
  RETURNING id INTO seller_id;

  -- If seller already existed, get their ID
  IF seller_id IS NULL THEN
    SELECT id INTO seller_id FROM sellers WHERE user_id = seller_user_id;
  END IF;

  -- Create session
  INSERT INTO auth_sessions (user_id, token, expires_at)
  VALUES (seller_user_id, seller_token, now() + interval '1 day');

  RAISE NOTICE '✓ Test seller created!';
  RAISE NOTICE 'User ID: %', seller_user_id;
  RAISE NOTICE 'Seller ID: %', seller_id;
  RAISE NOTICE 'Token: %', seller_token;
  RAISE NOTICE '';
END $$;

-- Create test student
DO $$
DECLARE
  student_id uuid;
  student_token text := 'test-student-token-' || substr(md5(random()::text), 1, 16);
BEGIN
  -- Insert test student
  INSERT INTO users (telegram_id, first_name, last_name, telegram_username)
  VALUES (777777777, 'Test', 'Student', 'teststudent')
  ON CONFLICT (telegram_id) DO NOTHING
  RETURNING id INTO student_id;

  -- If user already existed, get their ID
  IF student_id IS NULL THEN
    SELECT id INTO student_id FROM users WHERE telegram_id = 777777777;
  END IF;

  -- Add student role (only if not exists)
  INSERT INTO user_roles (user_id, role)
  VALUES (student_id, 'student')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Create session
  INSERT INTO auth_sessions (user_id, token, expires_at)
  VALUES (student_id, student_token, now() + interval '1 day');

  RAISE NOTICE '✓ Test student created!';
  RAISE NOTICE 'User ID: %', student_id;
  RAISE NOTICE 'Token: %', student_token;
  RAISE NOTICE '';
END $$;

-- Verify tables were created
DO $$
DECLARE
  table_count integer;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';

  RAISE NOTICE '📊 Database Statistics:';
  RAISE NOTICE '  Tables created: %', table_count;

  SELECT COUNT(*) INTO table_count FROM users;
  RAISE NOTICE '  Users: %', table_count;

  SELECT COUNT(*) INTO table_count FROM user_roles;
  RAISE NOTICE '  Roles: %', table_count;

  SELECT COUNT(*) INTO table_count FROM sellers;
  RAISE NOTICE '  Sellers: %', table_count;

  SELECT COUNT(*) INTO table_count FROM auth_sessions;
  RAISE NOTICE '  Active sessions: %', table_count;

  RAISE NOTICE '';
  RAISE NOTICE '✅ Setup complete! You can now test the system.';
END $$;

-- Show sample queries to test RLS
\echo ''
\echo '📝 Sample test queries:'
\echo ''
\echo '-- Test authentication:'
\echo 'SELECT authenticate_with_token(''your-token-here'');'
\echo 'SELECT current_user_id();'
\echo ''
\echo '-- View users (should only see current user due to RLS):'
\echo 'SELECT * FROM users;'
\echo ''
\echo '-- View all sessions (should only see own sessions):'
\echo 'SELECT * FROM auth_sessions;'
\echo ''
\echo '-- Cleanup expired sessions:'
\echo 'SELECT cleanup_expired_sessions();'
\echo ''
