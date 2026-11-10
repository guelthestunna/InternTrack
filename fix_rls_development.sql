-- ============================================================================
-- TEMPORARY RLS FIX - Allow access without Supabase Auth
-- This is for development/testing only. Production should use proper Auth.
-- ============================================================================

-- Drop ALL existing policies first
DROP POLICY IF EXISTS "Service role full access to students" ON students;
DROP POLICY IF EXISTS "Authenticated users can read students" ON students;
DROP POLICY IF EXISTS "Students can update own profile" ON students;

DROP POLICY IF EXISTS "Service role full access to attendance" ON attendance;
DROP POLICY IF EXISTS "Authenticated users can read attendance" ON attendance;
DROP POLICY IF EXISTS "Authenticated users can create attendance" ON attendance;
DROP POLICY IF EXISTS "Authenticated users can update attendance" ON attendance;

DROP POLICY IF EXISTS "Service role full access to reports" ON reports;
DROP POLICY IF EXISTS "Authenticated users can read reports" ON reports;
DROP POLICY IF EXISTS "Authenticated users can create reports" ON reports;
DROP POLICY IF EXISTS "Authenticated users can update reports" ON reports;

-- ============================================================================
-- STUDENTS TABLE - Allow all access (development only)
-- ============================================================================

CREATE POLICY "Allow all access to students"
ON students FOR ALL
USING (true)
WITH CHECK (true);

-- ============================================================================
-- ATTENDANCE TABLE - Allow all access (development only)
-- ============================================================================

CREATE POLICY "Allow all access to attendance"
ON attendance FOR ALL
USING (true)
WITH CHECK (true);

-- ============================================================================
-- REPORTS TABLE - Allow all access (development only)
-- ============================================================================

CREATE POLICY "Allow all access to reports"
ON reports FOR ALL
USING (true)
WITH CHECK (true);

-- ============================================================================
-- COMPLETE
-- ============================================================================
