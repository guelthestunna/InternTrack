-- ============================================================================
-- COMPREHENSIVE RLS FIX FOR STUDENT FUNCTIONALITY (CORRECTED)
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
-- STUDENTS TABLE POLICIES
-- ============================================================================

CREATE POLICY "Service role full access to students"
ON students FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can read students"
ON students FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Students can update own profile"
ON students FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- ATTENDANCE TABLE POLICIES
-- ============================================================================

CREATE POLICY "Service role full access to attendance"
ON attendance FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can read attendance"
ON attendance FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create attendance"
ON attendance FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update attendance"
ON attendance FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- REPORTS TABLE POLICIES
-- ============================================================================

CREATE POLICY "Service role full access to reports"
ON reports FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can read reports"
ON reports FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create reports"
ON reports FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update reports"
ON reports FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- COMPLETE
-- ============================================================================
