# Supervisor and Coordinator Auth Linking

## Current State

Currently, supervisors and coordinators are **NOT** linked to Supabase Auth users. This means:

1. **company_supervisors** table has `user_id = NULL`
2. **ojt_coordinators** table has `user_id = NULL`
3. **users** table only contains student interns
4. Supervisors and coordinators cannot log in with email/password yet

## RLS Policy Impact

The RLS policies in `interntrack_rls_policies.sql` account for this limitation:

- **Supervisors**: Cannot read their own assignments (since they're not linked to auth)
- **Coordinators**: Have full access (assumed to be service role or linked to auth)

## Required Work

To enable supervisor and coordinator login with RLS enforcement, the following must be done:

### 1. Link Supervisors to Auth Users

For each supervisor in `company_supervisors`:

```sql
-- Step 1: Create auth user
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
VALUES (
  gen_random_uuid(),
  'supervisor@example.com',
  crypt('password123', gen_salt('bf')),
  now()
);

-- Step 2: Create users table entry
INSERT INTO users (id, email, user_id, role, account_status, first_login)
VALUES (
  <auth_user_id>,
  'supervisor@example.com',
  <supervisor_id>,
  'company_supervisor',
  'active',
  true
);

-- Step 3: Update company_supervisors table
UPDATE company_supervisors
SET user_id = <auth_user_id>
WHERE id = <supervisor_id>;
```

### 2. Link Coordinators to Auth Users

For each coordinator in `ojt_coordinators`:

```sql
-- Step 1: Create auth user
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
VALUES (
  gen_random_uuid(),
  'coordinator@example.com',
  crypt('password123', gen_salt('bf')),
  now()
);

-- Step 2: Create users table entry
INSERT INTO users (id, email, user_id, role, account_status, first_login)
VALUES (
  <auth_user_id>,
  'coordinator@example.com',
  <admin_id>,
  'ojt_coordinator',
  'active',
  true
);

-- Step 3: Update ojt_coordinators table
UPDATE ojt_coordinators
SET user_id = <auth_user_id>
WHERE id = <coordinator_id>;
```

### 3. Update RLS Policies

After linking, update the following policies in `interntrack_rls_policies.sql`:

**Company Supervisors:**
```sql
-- Supervisors can read their own record
CREATE POLICY "Supervisors can read own record"
ON company_supervisors FOR SELECT
USING (user_id = auth.uid());

-- Supervisors can update their own record
CREATE POLICY "Supervisors can update own record"
ON company_supervisors FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
```

**OJT Coordinators:**
```sql
-- Coordinators can read own record
CREATE POLICY "Coordinators can read own record"
ON ojt_coordinators FOR SELECT
USING (user_id = auth.uid());

-- Coordinators can update own record
CREATE POLICY "Coordinators can update own record"
ON ojt_coordinators FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
```

**Intern Supervisor Assignments:**
```sql
-- Supervisors can read their own assignments
CREATE POLICY "Supervisors can read own assignments"
ON intern_supervisor_assignments FOR SELECT
USING (
  is_supervisor() AND
  supervisor_id IN (
    SELECT id FROM company_supervisors 
    WHERE user_id = auth.uid()
  )
);
```

### 4. Update Auth Service

The auth service needs to handle email/password login for supervisors and coordinators (not just student ID login).

## Recommended Approach

**Option A: Manual Linking (for testing)**
- Manually create auth users for 1-2 supervisors and 1 coordinator
- Test the RLS policies with these accounts
- Verify supervisor can see assigned interns
- Verify coordinator can see everything

**Option B: Coordinator Registration System**
- Build a coordinator registration page
- Coordinators register new supervisor accounts
- Automates the auth linking process
- Part of the coordinator features implementation

**Option C: Service Role Migration Script**
- Create a migration script that:
  - Reads all supervisors/coordinators from their tables
  - Creates auth users for each
  - Links them in the users table
  - Updates the supervisor/coordinator tables
- Run once to migrate existing data

## Current RLS Policy Behavior

Without auth linking:

| Role | Students | Attendance | Reports | Assignments |
|------|----------|------------|---------|-------------|
| **Student** | Own only | Own only | Own only | None |
| **Supervisor** | None (not linked) | None (not linked) | None (not linked) | None (not linked) |
| **Coordinator** | All | All | All | All (CRUD) |

With auth linking (after completing steps above):

| Role | Students | Attendance | Reports | Assignments |
|------|----------|------------|---------|-------------|
| **Student** | Own only | Own only | Own only | None |
| **Supervisor** | Assigned only | Assigned only | Assigned only | Own only |
| **Coordinator** | All | All | All | All (CRUD) |

## Priority

This is **medium priority** because:

1. **Students work fine** - The current RLS policies fully support student interns
2. **Coordinators work fine** - They have full access via coordinator policies
3. **Supervisors limited** - They can't log in yet, but their web app is still mock data anyway

**Recommended:** Complete supervisor/coordinator auth linking **after** implementing the supervisor web app features, as both are dependent on each other.
