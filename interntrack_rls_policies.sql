-- ============================================================================
-- PRODUCTION RLS POLICIES FOR INTERNTRACK
-- ============================================================================
-- This file enforces role-based access control for the InternTrack system.
--
-- ROLES:
-- - student_intern: Can only see/edit their own data
-- - company_supervisor: Can see assigned interns' data
-- - ojt_coordinator: Can see all data
--
-- RUN THIS IN SUPABASE SQL EDITOR AFTER REVIEWING IT
-- ============================================================================

-- ============================================================================
-- HELPER FUNCTION: Get current user's role from users table
-- ============================================================================
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$;

-- ============================================================================
-- HELPER FUNCTION: Check if current user is a student
-- ============================================================================
CREATE OR REPLACE FUNCTION is_student()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'student_intern'
  );
$$;

-- ============================================================================
-- HELPER FUNCTION: Check if current user is a supervisor
-- ============================================================================
-- NOTE: Supervisors are not yet linked to auth.users
-- This function will return false until supervisors are linked
CREATE OR REPLACE FUNCTION is_supervisor()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'company_supervisor'
  );
$$;

-- ============================================================================
-- HELPER FUNCTION: Check if current user is a coordinator
-- ============================================================================
CREATE OR REPLACE FUNCTION is_coordinator()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'ojt_coordinator'
  );
$$;

-- ============================================================================
-- HELPER FUNCTION: Get student_id for current user (if student)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_student_id()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT user_id FROM users 
  WHERE id = auth.uid() AND role = 'student_intern';
$$;

-- ============================================================================
-- HELPER FUNCTION: Get student UUID for current user (if student)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_student_uuid()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT s.id FROM students s
  JOIN users u ON s.student_id = u.user_id
  WHERE u.id = auth.uid() AND u.role = 'student_intern';
$$;

-- ============================================================================
-- HELPER FUNCTION: Get assigned student UUIDs for current supervisor
-- ============================================================================
CREATE OR REPLACE FUNCTION get_assigned_student_uuids()
RETURNS UUID[]
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT ARRAY_AGG(student_id) 
  FROM intern_supervisor_assignments 
  WHERE supervisor_id = auth.uid();
$$;

-- ============================================================================
-- DROP EXISTING POLICIES
-- ============================================================================

-- Users table
DROP POLICY IF EXISTS "Allow all access to users" ON users;
DROP POLICY IF EXISTS "Service role full access to users" ON users;
DROP POLICY IF EXISTS "Authenticated users can read users" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Students table
DROP POLICY IF EXISTS "Allow all access to students" ON students;
DROP POLICY IF EXISTS "Service role full access to students" ON students;
DROP POLICY IF EXISTS "Authenticated users can read students" ON students;
DROP POLICY IF EXISTS "Students can update own profile" ON students;

-- Attendance table
DROP POLICY IF EXISTS "Allow all access to attendance" ON attendance;
DROP POLICY IF EXISTS "Service role full access to attendance" ON attendance;
DROP POLICY IF EXISTS "Authenticated users can read attendance" ON attendance;
DROP POLICY IF EXISTS "Authenticated users can create attendance" ON attendance;
DROP POLICY IF EXISTS "Authenticated users can update attendance" ON attendance;

-- Reports table
DROP POLICY IF EXISTS "Allow all access to reports" ON reports;
DROP POLICY IF EXISTS "Service role full access to reports" ON reports;
DROP POLICY IF EXISTS "Authenticated users can read reports" ON reports;
DROP POLICY IF EXISTS "Authenticated users can create reports" ON reports;
DROP POLICY IF EXISTS "Authenticated users can update reports" ON reports;

-- Company Supervisors table
DROP POLICY IF EXISTS "Allow all access to company_supervisors" ON company_supervisors;

-- OJT Coordinators table
DROP POLICY IF EXISTS "Allow all access to ojt_coordinators" ON ojt_coordinators;

-- Intern Supervisor Assignments table
DROP POLICY IF EXISTS "Allow all access to intern_supervisor_assignments" ON intern_supervisor_assignments;

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================

-- Users can read their own record
CREATE POLICY "Users can read own record"
ON users FOR SELECT
USING (auth.uid() = id);

-- Coordinators can read all users
CREATE POLICY "Coordinators can read all users"
ON users FOR SELECT
USING (is_coordinator());

-- Users can update their own record (limited fields)
CREATE POLICY "Users can update own record"
ON users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  -- Note: Currently allows all field updates for simplicity
  -- TODO: Restrict to specific fields after coordinator features are implemented
);

-- Coordinators can update all users
CREATE POLICY "Coordinators can update all users"
ON users FOR UPDATE
USING (is_coordinator())
WITH CHECK (is_coordinator());

-- Only service role or coordinators can insert users
CREATE POLICY "Coordinators can insert users"
ON users FOR INSERT
WITH CHECK (is_coordinator());

-- ============================================================================
-- STUDENTS TABLE POLICIES
-- ============================================================================

-- Students can read their own record
CREATE POLICY "Students can read own record"
ON students FOR SELECT
USING (id = get_student_uuid());

-- Supervisors can read assigned students
CREATE POLICY "Supervisors can read assigned students"
ON students FOR SELECT
USING (
  is_supervisor() AND
  id = ANY(get_assigned_student_uuids())
);

-- Coordinators can read all students
CREATE POLICY "Coordinators can read all students"
ON students FOR SELECT
USING (is_coordinator());

-- Students can update their own profile (limited fields)
CREATE POLICY "Students can update own profile"
ON students FOR UPDATE
USING (id = get_student_uuid())
WITH CHECK (
  id = get_student_uuid()
  -- Note: Currently allows all field updates for simplicity
  -- TODO: Restrict to specific fields after coordinator features are implemented
);

-- Coordinators can update all students
CREATE POLICY "Coordinators can update all students"
ON students FOR UPDATE
USING (is_coordinator())
WITH CHECK (is_coordinator());

-- Only service role or coordinators can insert students
CREATE POLICY "Coordinators can insert students"
ON students FOR INSERT
WITH CHECK (is_coordinator());

-- ============================================================================
-- ATTENDANCE TABLE POLICIES
-- ============================================================================

-- Students can read their own attendance
CREATE POLICY "Students can read own attendance"
ON attendance FOR SELECT
USING (student_id = get_student_id());

-- Supervisors can read assigned students' attendance
CREATE POLICY "Supervisors can read assigned attendance"
ON attendance FOR SELECT
USING (
  is_supervisor() AND
  student_id IN (
    SELECT s.student_id 
    FROM students s
    WHERE s.id = ANY(get_assigned_student_uuids())
  )
);

-- Coordinators can read all attendance
CREATE POLICY "Coordinators can read all attendance"
ON attendance FOR SELECT
USING (is_coordinator());

-- Students can create their own attendance
CREATE POLICY "Students can create own attendance"
ON attendance FOR INSERT
WITH CHECK (student_id = get_student_id());

-- Students can update their own attendance
CREATE POLICY "Students can update own attendance"
ON attendance FOR UPDATE
USING (student_id = get_student_id())
WITH CHECK (
  student_id = get_student_id()
  -- Note: Currently allows all field updates for simplicity
  -- Application layer should prevent changing verification_status
  -- TODO: Add trigger or function to restrict verification field changes
);

-- Supervisors can update assigned students' attendance (for verification)
CREATE POLICY "Supervisors can update assigned attendance"
ON attendance FOR UPDATE
USING (
  is_supervisor() AND
  student_id IN (
    SELECT s.student_id 
    FROM students s
    WHERE s.id = ANY(get_assigned_student_uuids())
  )
)
WITH CHECK (
  is_supervisor() AND
  student_id IN (
    SELECT s.student_id 
    FROM students s
    WHERE s.id = ANY(get_assigned_student_uuids())
  )
);

-- Coordinators can update all attendance
CREATE POLICY "Coordinators can update all attendance"
ON attendance FOR UPDATE
USING (is_coordinator())
WITH CHECK (is_coordinator());

-- ============================================================================
-- REPORTS TABLE POLICIES
-- ============================================================================

-- Students can read their own reports
CREATE POLICY "Students can read own reports"
ON reports FOR SELECT
USING (student_id = get_student_id());

-- Supervisors can read assigned students' reports
CREATE POLICY "Supervisors can read assigned reports"
ON reports FOR SELECT
USING (
  is_supervisor() AND
  student_id IN (
    SELECT s.student_id 
    FROM students s
    WHERE s.id = ANY(get_assigned_student_uuids())
  )
);

-- Coordinators can read all reports
CREATE POLICY "Coordinators can read all reports"
ON reports FOR SELECT
USING (is_coordinator());

-- Students can create their own reports
CREATE POLICY "Students can create own reports"
ON reports FOR INSERT
WITH CHECK (student_id = get_student_id());

-- Students can update their own reports
CREATE POLICY "Students can update own reports"
ON reports FOR UPDATE
USING (student_id = get_student_id())
WITH CHECK (
  student_id = get_student_id()
  -- Note: Currently allows all field updates for simplicity
  -- Application layer should prevent changing status from approved
  -- TODO: Add trigger or function to restrict status transitions
);

-- Supervisors can update assigned students' reports (for review)
CREATE POLICY "Supervisors can update assigned reports"
ON reports FOR UPDATE
USING (
  is_supervisor() AND
  student_id IN (
    SELECT s.student_id 
    FROM students s
    WHERE s.id = ANY(get_assigned_student_uuids())
  )
)
WITH CHECK (
  is_supervisor() AND
  student_id IN (
    SELECT s.student_id 
    FROM students s
    WHERE s.id = ANY(get_assigned_student_uuids())
  )
  -- Note: Currently allows all field updates for simplicity
  -- Application layer should enforce status transitions
  -- TODO: Add trigger or function to restrict status transitions
);

-- Coordinators can update all reports
CREATE POLICY "Coordinators can update all reports"
ON reports FOR UPDATE
USING (is_coordinator())
WITH CHECK (is_coordinator());

-- ============================================================================
-- COMPANY SUPERVISORS TABLE POLICIES
-- ============================================================================

-- NOTE: Supervisors table is not yet linked to Supabase Auth users
-- For now, only coordinators can access this table
-- TODO: Update this when supervisors are linked to auth.users

-- Coordinators can read all supervisors
CREATE POLICY "Coordinators can read all supervisors"
ON company_supervisors FOR SELECT
USING (is_coordinator());

-- Coordinators can update all supervisors
CREATE POLICY "Coordinators can update all supervisors"
ON company_supervisors FOR UPDATE
USING (is_coordinator())
WITH CHECK (is_coordinator());

-- Only service role or coordinators can insert supervisors
CREATE POLICY "Coordinators can insert supervisors"
ON company_supervisors FOR INSERT
WITH CHECK (is_coordinator());

-- ============================================================================
-- OJT COORDINATORS TABLE POLICIES
-- ============================================================================

-- NOTE: Coordinators table is not yet linked to Supabase Auth users
-- For now, only coordinators can access this table
-- TODO: Update this when coordinators are linked to auth.users

-- Coordinators can read all coordinators
CREATE POLICY "Coordinators can read all coordinators"
ON ojt_coordinators FOR SELECT
USING (is_coordinator());

-- Coordinators can update all coordinators
CREATE POLICY "Coordinators can update all coordinators"
ON ojt_coordinators FOR UPDATE
USING (is_coordinator())
WITH CHECK (is_coordinator());

-- Only service role or coordinators can insert coordinators
CREATE POLICY "Coordinators can insert coordinators"
ON ojt_coordinators FOR INSERT
WITH CHECK (is_coordinator());

-- ============================================================================
-- INTERN SUPERVISOR ASSIGNMENTS TABLE POLICIES
-- ============================================================================

-- NOTE: supervisor_id references company_supervisors.id (UUID)
-- student_id references students.id (UUID)
-- company_name is required
-- NOTE: Supervisors are not yet linked to auth.users, so they cannot read their own assignments
-- TODO: Update this when supervisors are linked to auth.users

-- Coordinators can read all assignments
CREATE POLICY "Coordinators can read all assignments"
ON intern_supervisor_assignments FOR SELECT
USING (is_coordinator());

-- Only service role or coordinators can insert assignments
CREATE POLICY "Coordinators can insert assignments"
ON intern_supervisor_assignments FOR INSERT
WITH CHECK (
  is_coordinator() AND
  company_name IS NOT NULL
);

-- Only service role or coordinators can update assignments
CREATE POLICY "Coordinators can update assignments"
ON intern_supervisor_assignments FOR UPDATE
USING (is_coordinator())
WITH CHECK (is_coordinator());

-- Only service role or coordinators can delete assignments
CREATE POLICY "Coordinators can delete assignments"
ON intern_supervisor_assignments FOR DELETE
USING (is_coordinator());

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_supervisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE ojt_coordinators ENABLE ROW LEVEL SECURITY;
ALTER TABLE intern_supervisor_assignments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- COMPLETE
-- ============================================================================
