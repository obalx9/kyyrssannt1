/*
  # Create Custom Authentication System for Timeweb

  ## Overview
  This migration creates a custom authentication system to replace Supabase auth.

  ## Tables Created

  1. **auth_sessions**
     - Stores user sessions with JWT tokens
     - Fields: id, user_id, token, expires_at, created_at

  ## Functions Created

  1. **current_user_id()** - Returns the current user's ID from session context
  2. **set_session_user(user_uuid)** - Sets the current user in the session

  ## Security
  - RLS will be configured in subsequent migrations
*/

-- Create auth_sessions table
CREATE TABLE IF NOT EXISTS auth_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_token ON auth_sessions(token);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions(user_id);

-- Function to get current user ID from session variable
-- This will be set by the application layer when making requests
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS uuid AS $$
DECLARE
  user_uuid uuid;
BEGIN
  -- Try to get user_id from session variable set by application
  user_uuid := current_setting('app.current_user_id', true)::uuid;
  RETURN user_uuid;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to set current user (called by application layer)
CREATE OR REPLACE FUNCTION set_session_user(user_uuid uuid)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_user_id', user_uuid::text, false);
END;
$$ LANGUAGE plpgsql;

-- Function to validate and set user from token
CREATE OR REPLACE FUNCTION authenticate_with_token(auth_token text)
RETURNS uuid AS $$
DECLARE
  session_user_id uuid;
BEGIN
  -- Get user_id from valid, non-expired session
  SELECT user_id INTO session_user_id
  FROM auth_sessions
  WHERE token = auth_token
  AND expires_at > now();

  -- If valid session found, set it as current user
  IF session_user_id IS NOT NULL THEN
    PERFORM set_session_user(session_user_id);
  END IF;

  RETURN session_user_id;
END;
$$ LANGUAGE plpgsql;

-- Cleanup expired sessions periodically
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM auth_sessions WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;
