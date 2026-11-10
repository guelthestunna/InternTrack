-- Create student auth account for student 24-3335
-- Run this in Supabase SQL Editor

-- Step 1: Create auth user (if not exists)
-- Note: This will create the user in Supabase Auth
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at,
  is_sso_user,
  is_anonymous
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '112c5b48-56fb-45e7-8227-5c4982789483',
  'authenticated',
  'authenticated',
  'guelplayah8@gmail.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '',
  '',
  '',
  0,
  NULL,
  '',
  NULL,
  false,
  false
) ON CONFLICT (id) DO NOTHING;

-- Step 2: Insert into users table
INSERT INTO users (
  id,
  user_id,
  email,
  role,
  account_status,
  first_login,
  created_at,
  updated_at
) VALUES (
  '112c5b48-56fb-45e7-8227-5c4982789483',
  '24-3335',
  'guelplayah8@gmail.com',
  'student_intern',
  'active',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Step 3: Verify the setup
SELECT * FROM users WHERE user_id = '24-3335';
SELECT * FROM students WHERE student_id = '24-3335';
