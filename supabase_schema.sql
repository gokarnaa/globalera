-- ==============================================================================
-- GLOBAL ERA TECHNICAL SCHOOL & KITE TVET MANAGEMENT SYSTEM
-- COMPLETE SUPABASE POSTGRESQL PRODUCTION RELATIONAL SCHEMA
-- Multi-Tenant, Fully Relational, Cascading Foreign Keys & RLS Enabled
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- SECTION 1: CORE SYSTEM & MULTI-TENANCY
-- ==============================================================================

-- 1. Organizations Master
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY DEFAULT ('ORG-' || substr(md5(random()::text), 1, 8)),
  name TEXT NOT NULL,
  sub_name TEXT,
  code TEXT NOT NULL UNIQUE,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  logo_url TEXT,
  stamp_url TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Default Organization
INSERT INTO organizations (id, name, sub_name, code, contact_phone, address)
VALUES (
  'ORG-GLOBALERA-01',
  'GLOBAL ERA MULTI SERVICE PVT. LTD. / GLOBAL ERA TECHNICAL SCHOOL',
  'Global Era Technical School',
  'GETS',
  '+977-1-4915678 / 9851234567',
  'Jorpati, Gokarneshwor-05, Kathmandu, Nepal'
) ON CONFLICT (id) DO NOTHING;

-- 2. System Settings & Institute Profile
CREATE TABLE IF NOT EXISTS system_settings (
  id TEXT PRIMARY KEY DEFAULT 'GLOBAL_CONFIG',
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  institute_name TEXT,
  institute_sub TEXT,
  location TEXT,
  contact_phone TEXT,
  email TEXT,
  company_profile JSONB DEFAULT '{}'::jsonb,
  biometric_settings JSONB DEFAULT '{}'::jsonb,
  certificate_format JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. System Users & Role Profiles (Admin, Staff, Trainer, Student, Agent, Employer)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  phone TEXT,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'STAFF', 'TRAINER', 'STUDENT', 'AGENT', 'EMPLOYER')),
  pin TEXT NOT NULL DEFAULT '1234',
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Suspended', 'Inactive')),
  title TEXT,
  trainer_id TEXT,
  student_id TEXT,
  agent_id TEXT,
  specialization TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_org_username UNIQUE (organization_id, username)
);

-- ==============================================================================
-- SECTION 2: ACADEMIC & CURRICULUM ARCHITECTURE
-- ==============================================================================

-- 4. Occupations Master
CREATE TABLE IF NOT EXISTS occupations (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  category TEXT DEFAULT 'Vocational',
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Courses Master (Curricula)
CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  occupation_id TEXT REFERENCES occupations(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  course_code TEXT,
  level TEXT DEFAULT 'Level 1',
  duration_value INT NOT NULL DEFAULT 3,
  duration_unit TEXT DEFAULT 'Months',
  total_hours INT NOT NULL DEFAULT 390,
  theory_hours INT DEFAULT 90,
  practical_hours INT DEFAULT 300,
  price NUMERIC DEFAULT 0,
  description TEXT,
  entry_qualification TEXT DEFAULT 'Class 8 or 10 pass',
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Trainers Master
CREATE TABLE IF NOT EXISTS trainers (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  occupation_id TEXT REFERENCES occupations(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  pin TEXT NOT NULL DEFAULT '1234',
  biometric_id TEXT,
  specialization TEXT,
  tot_certified BOOLEAN DEFAULT TRUE,
  remuneration_type TEXT DEFAULT 'COMMISSION' CHECK (remuneration_type IN ('SALARY', 'COMMISSION')),
  salary_amount NUMERIC DEFAULT 0,
  commission_percent NUMERIC DEFAULT 15,
  qualification TEXT,
  photo TEXT,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Training Groups (Batches)
CREATE TABLE IF NOT EXISTS training_groups (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  group_code TEXT NOT NULL,
  course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,
  trainer_id TEXT REFERENCES trainers(id) ON DELETE SET NULL,
  shift TEXT NOT NULL CHECK (shift IN ('A', 'B', 'C', 'D', 'E')),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  start_date DATE NOT NULL,
  expected_end_date DATE NOT NULL,
  classroom_lab TEXT,
  max_capacity INT DEFAULT 25,
  status TEXT DEFAULT 'Running' CHECK (status IN ('Upcoming', 'Running', 'OJT Phase', 'Completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Syllabus Units Master
CREATE TABLE IF NOT EXISTS syllabi (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,
  unit_no INT NOT NULL,
  title TEXT NOT NULL,
  theory_hours INT DEFAULT 0,
  practical_hours INT DEFAULT 0,
  total_hours INT NOT NULL,
  learning_outcome TEXT,
  tools_and_materials TEXT,
  assessment_criteria TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- SECTION 3: CTEVT INSTRUCTIONAL OPERATIONS (WORK PLANS, LESSON PLANS, LOGBOOKS)
-- ==============================================================================

-- 9. Work Plans (Calendarized Session Scheduling)
CREATE TABLE IF NOT EXISTS work_plans (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  group_id TEXT REFERENCES training_groups(id) ON DELETE CASCADE,
  syllabus_id TEXT REFERENCES syllabi(id) ON DELETE CASCADE,
  plan_date DATE NOT NULL,
  day_name TEXT NOT NULL,
  theory_aspect TEXT,
  practical_aspect TEXT,
  planned_hours INT DEFAULT 2,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed', 'Rescheduled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Lesson Plans (CTEVT 4-Step Instructional Studio)
CREATE TABLE IF NOT EXISTS lesson_plans (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  work_plan_id TEXT REFERENCES work_plans(id) ON DELETE CASCADE,
  group_id TEXT REFERENCES training_groups(id) ON DELETE CASCADE,
  objectives TEXT NOT NULL,
  materials_needed TEXT,
  methodology TEXT,
  assessment_method TEXT,
  homework TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Daily Log Books (Verified Instructional Delivery)
CREATE TABLE IF NOT EXISTS log_books (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lesson_plan_id TEXT REFERENCES lesson_plans(id) ON DELETE SET NULL,
  group_id TEXT REFERENCES training_groups(id) ON DELETE CASCADE,
  delivery_date DATE NOT NULL,
  topics_covered TEXT NOT NULL,
  materials_used TEXT,
  skills_learned TEXT,
  actual_hours INT DEFAULT 2,
  is_delivered BOOLEAN DEFAULT TRUE,
  trainer_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- SECTION 4: TRAINEES & ATTENDANCE
-- ==============================================================================

-- 12. Students Master
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  group_id TEXT REFERENCES training_groups(id) ON DELETE SET NULL,
  tgid TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  secondary_phone TEXT,
  email TEXT,
  pin TEXT NOT NULL DEFAULT '1234',
  biometric_id TEXT,
  gender TEXT CHECK (gender IN ('Female', 'Male', 'Other')),
  date_of_birth DATE,
  citizenship_number TEXT,
  citizenship_district TEXT,
  municipality TEXT,
  ward_no TEXT,
  permanent_address TEXT,
  current_address TEXT,
  father_name TEXT,
  mother_name TEXT,
  guardian_contact TEXT,
  education_level TEXT,
  funding_type TEXT DEFAULT 'Self-Financed (Paid)',
  fee_amount NUMERIC DEFAULT 0,
  fee_paid NUMERIC DEFAULT 0,
  admission_date DATE NOT NULL,
  expected_end_date DATE,
  photo_url TEXT,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'Dropout', 'OJT', 'Placed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Daily Attendance (Idempotent: Group + Student + Date is Unique)
CREATE TABLE IF NOT EXISTS attendances (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  group_id TEXT REFERENCES training_groups(id) ON DELETE CASCADE,
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late')),
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_attendance_entry UNIQUE (group_id, student_id, date)
);

-- 14. Biometric Machine Hardware Logs (Fingerprint & RFID Cards)
CREATE TABLE IF NOT EXISTS biometric_logs (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  biometric_id TEXT NOT NULL,
  user_type TEXT CHECK (user_type IN ('STUDENT', 'TRAINER', 'STAFF')),
  user_id TEXT,
  user_name TEXT,
  timestamp TIMESTAMPTZ NOT NULL,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  verify_mode TEXT DEFAULT 'Fingerprint / RFID',
  device_serial TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- SECTION 5: CRM LEADS, REFERRAL AGENTS & ADMISSIONS CONTRACTS
-- ==============================================================================

-- 15. Referral Partners / Agents
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  commission_rate NUMERIC DEFAULT 10,
  payment_info TEXT,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Suspended')),
  total_leads INT DEFAULT 0,
  total_enrolled INT DEFAULT 0,
  total_earnings NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. CRM Student Inquiries & Leads
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  course_id TEXT REFERENCES courses(id) ON DELETE SET NULL,
  agent_id TEXT REFERENCES agents(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  source TEXT DEFAULT 'Walk-in',
  status TEXT DEFAULT 'New' CHECK (status IN ('New', 'Contacted', 'Visiting', 'Admitted', 'Dropped')),
  priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
  counselor TEXT,
  follow_up_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Formal Admissions Contracts & Fee Agreements
CREATE TABLE IF NOT EXISTS admissions (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  student_id TEXT REFERENCES students(id) ON DELETE SET NULL,
  lead_id TEXT REFERENCES leads(id) ON DELETE SET NULL,
  course_id TEXT REFERENCES courses(id) ON DELETE SET NULL,
  group_id TEXT REFERENCES training_groups(id) ON DELETE SET NULL,
  agreement_no TEXT NOT NULL UNIQUE,
  agreement_date DATE NOT NULL,
  total_fee NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  agreed_fee NUMERIC NOT NULL DEFAULT 0,
  payment_plan TEXT DEFAULT 'INSTALLMENT_2',
  status TEXT DEFAULT 'Enrolled',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- SECTION 6: DOUBLE-ENTRY ACCOUNTING & FINANCIAL MANAGEMENT
-- ==============================================================================

-- 18. Chart of Accounts (COA Master)
CREATE TABLE IF NOT EXISTS chart_of_accounts (
  code TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE')),
  normal_balance TEXT NOT NULL CHECK (normal_balance IN ('DEBIT', 'CREDIT')),
  balance NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. Vendors, Landlords & Parties Master
CREATE TABLE IF NOT EXISTS parties (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN (
    'LANDLORD',
    'TECHNICAL_SUPPLIER',
    'TAILORING_SUPPLIER',
    'BEAUTICIAN_SUPPLIER',
    'BAKERY_SUPPLIER',
    'UTILITY_SERVICE',
    'STATIONERY_MEDIA'
  )),
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  bank_name TEXT,
  account_number TEXT,
  account_holder TEXT,
  pan_vat TEXT,
  monthly_rent NUMERIC DEFAULT 0,
  security_deposit NUMERIC DEFAULT 0,
  address TEXT,
  notes TEXT,
  total_purchases NUMERIC DEFAULT 0,
  total_paid NUMERIC DEFAULT 0,
  current_due NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. Student Fee Payments & Collection Receipts
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  receipt_no TEXT NOT NULL UNIQUE,
  student_id TEXT REFERENCES students(id) ON DELETE SET NULL,
  group_id TEXT REFERENCES training_groups(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  net_amount NUMERIC NOT NULL DEFAULT 0,
  payment_date DATE NOT NULL,
  payment_method TEXT DEFAULT 'Cash',
  collector_name TEXT,
  remarks TEXT,
  installment_no INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 21. Trainer Payroll & Commission Disbursement Vouchers
CREATE TABLE IF NOT EXISTS trainer_payouts (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  voucher_no TEXT NOT NULL UNIQUE,
  trainer_id TEXT REFERENCES trainers(id) ON DELETE SET NULL,
  group_id TEXT REFERENCES training_groups(id) ON DELETE SET NULL,
  payout_type TEXT CHECK (payout_type IN ('SALARY', 'COMMISSION')),
  amount NUMERIC NOT NULL DEFAULT 0,
  payout_date DATE NOT NULL,
  payment_method TEXT DEFAULT 'Bank Transfer',
  disbursed_by TEXT,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 22. Double-Entry General Journal Entries
CREATE TABLE IF NOT EXISTS journal_entries (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  entry_type TEXT NOT NULL,
  voucher_no TEXT,
  description TEXT NOT NULL,
  total_debit NUMERIC NOT NULL DEFAULT 0,
  total_credit NUMERIC NOT NULL DEFAULT 0,
  lines JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_balanced BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 23. Operating Expenses & Direct Vendor Purchases
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  party_id TEXT REFERENCES parties(id) ON DELETE SET NULL,
  expense_date DATE NOT NULL,
  category TEXT NOT NULL,
  bill_no TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT DEFAULT 'Cash',
  paid_to TEXT,
  description TEXT,
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 24. Project & Municipal Grant Accounting
CREATE TABLE IF NOT EXISTS project_contracts (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  funding_agency TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  received_amount NUMERIC DEFAULT 0,
  receivable_amount NUMERIC DEFAULT 0,
  start_date DATE,
  end_date DATE,
  target_students INT DEFAULT 0,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 25. Daily Counter Cash Closing & Denomination Audit
CREATE TABLE IF NOT EXISTS cash_closings (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  closing_date DATE NOT NULL,
  closing_time TEXT NOT NULL,
  opening_cash NUMERIC NOT NULL DEFAULT 0,
  cash_inflow NUMERIC NOT NULL DEFAULT 0,
  cash_outflow NUMERIC NOT NULL DEFAULT 0,
  expected_cash NUMERIC NOT NULL DEFAULT 0,
  physical_cash NUMERIC NOT NULL DEFAULT 0,
  variance NUMERIC NOT NULL DEFAULT 0,
  denominations JSONB DEFAULT '{}'::jsonb,
  cashier_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- SECTION 7: EMPLOYERS, JOBS, OJT & PLACEMENTS
-- ==============================================================================

-- 26. Industry Employers Master
CREATE TABLE IF NOT EXISTS employers (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  industry TEXT,
  location TEXT,
  contact_person TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  pin TEXT DEFAULT '1234',
  status TEXT DEFAULT 'Active' CHECK (status IN ('Pending', 'Active', 'Inactive', 'Blocked')),
  mou_signed BOOLEAN DEFAULT FALSE,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 27. Job Openings
CREATE TABLE IF NOT EXISTS job_openings (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  employer_id TEXT REFERENCES employers(id) ON DELETE CASCADE,
  occupation_id TEXT REFERENCES occupations(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  required_skills TEXT,
  vacancies INT DEFAULT 1,
  salary_range TEXT,
  location TEXT,
  employment_type TEXT DEFAULT 'Full-Time',
  deadline DATE,
  status TEXT DEFAULT 'Open' CHECK (status IN ('Open', 'Closed', 'Paused')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 28. Job Applications
CREATE TABLE IF NOT EXISTS job_applications (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  job_id TEXT REFERENCES job_openings(id) ON DELETE CASCADE,
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'Applied',
  apply_date DATE DEFAULT CURRENT_DATE,
  cover_note TEXT,
  is_currently_training BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_job_student_app UNIQUE (job_id, student_id)
);

-- 29. On-the-Job Training (OJT) Records
CREATE TABLE IF NOT EXISTS ojts (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  employer_id TEXT REFERENCES employers(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  related_person TEXT,
  contact_number TEXT,
  status TEXT DEFAULT 'Ongoing',
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 30. Graduate Placements & Employment Tracking (EPP)
CREATE TABLE IF NOT EXISTS placements (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  employer_id TEXT REFERENCES employers(id) ON DELETE SET NULL,
  target_job TEXT NOT NULL,
  preferred_location TEXT,
  actual_salary NUMERIC,
  employment_type TEXT DEFAULT 'Full-Time Employee',
  status TEXT DEFAULT 'Planned',
  retention_3_month_verified BOOLEAN DEFAULT FALSE,
  retention_6_month_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 31. Trainee Competency Evaluations
CREATE TABLE IF NOT EXISTS evaluations (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  group_id TEXT REFERENCES training_groups(id) ON DELETE CASCADE,
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  syllabus_id TEXT REFERENCES syllabi(id) ON DELETE CASCADE,
  mastered BOOLEAN DEFAULT FALSE,
  areas_to_improve TEXT,
  trainer_plan TEXT,
  evaluator_name TEXT,
  evaluated_at DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- SECTION 8: CERTIFICATES, NOTICES & AUDITS
-- ==============================================================================

-- 32. Formal Certificates Master
CREATE TABLE IF NOT EXISTS certificates (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  certificate_no TEXT NOT NULL UNIQUE,
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  course_id TEXT REFERENCES courses(id) ON DELETE SET NULL,
  group_id TEXT REFERENCES training_groups(id) ON DELETE SET NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  grade_division TEXT DEFAULT 'Distinction',
  verification_code TEXT NOT NULL UNIQUE,
  qr_code_url TEXT,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Revoked', 'Archived')),
  certificate_payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 33. Academic Calendar & Holidays
CREATE TABLE IF NOT EXISTS holidays (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  type TEXT DEFAULT 'Public Holiday',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 34. Notices & Announcements
CREATE TABLE IF NOT EXISTS notices (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target_role TEXT DEFAULT 'ALL',
  publish_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_urgent BOOLEAN DEFAULT FALSE,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 35. Communication & SMS Logs
CREATE TABLE IF NOT EXISTS communication_logs (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  channel TEXT DEFAULT 'SMS',
  recipient_name TEXT,
  recipient_phone TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'Sent',
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- 36. System Audit Trails & Security Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY DEFAULT ('AUD-' || substr(md5(random()::text), 1, 8)),
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  details TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- SECTION 9: INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_users_org ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_students_group ON students(group_id);
CREATE INDEX IF NOT EXISTS idx_students_phone ON students(phone);
CREATE INDEX IF NOT EXISTS idx_students_tgid ON students(tgid);
CREATE INDEX IF NOT EXISTS idx_trainers_phone ON trainers(phone);
CREATE INDEX IF NOT EXISTS idx_groups_course ON training_groups(course_id);
CREATE INDEX IF NOT EXISTS idx_attendance_lookup ON attendances(group_id, date);
CREATE INDEX IF NOT EXISTS idx_biometric_lookup ON biometric_logs(biometric_id, date);
CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_receipt ON payments(receipt_no);
CREATE INDEX IF NOT EXISTS idx_expenses_party ON expenses(party_id);
CREATE INDEX IF NOT EXISTS idx_cert_verify ON certificates(certificate_no);

-- ==============================================================================
-- SECTION 10: ROW LEVEL SECURITY (RLS) & PUBLIC ACCESS POLICIES
-- ==============================================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE occupations ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE syllabi ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE biometric_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_closings ENABLE ROW LEVEL SECURITY;
ALTER TABLE employers ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_openings ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ojts ENABLE ROW LEVEL SECURITY;
ALTER TABLE placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Grant Full Permissive Access for Frontend Anon Key & Service Role
DO $$ 
DECLARE
  tbl TEXT;
  tbls TEXT[] := ARRAY[
    'organizations', 'system_settings', 'users', 'occupations', 'courses',
    'trainers', 'training_groups', 'syllabi', 'work_plans', 'lesson_plans',
    'log_books', 'students', 'attendances', 'biometric_logs', 'agents',
    'leads', 'admissions', 'chart_of_accounts', 'parties', 'payments',
    'trainer_payouts', 'journal_entries', 'expenses', 'project_contracts',
    'cash_closings', 'employers', 'job_openings', 'job_applications',
    'ojts', 'placements', 'evaluations', 'certificates', 'holidays',
    'notices', 'communication_logs', 'audit_logs'
  ];
BEGIN
  FOREACH tbl IN ARRAY tbls LOOP
    BEGIN
      EXECUTE format('DROP POLICY IF EXISTS "Public access on %I" ON %I;', tbl, tbl);
      EXECUTE format('CREATE POLICY "Public access on %I" ON %I FOR ALL USING (true) WITH CHECK (true);', tbl, tbl);
    EXCEPTION WHEN OTHERS THEN
      -- Ignore if policy manipulation encounters error
    END;
  END LOOP;
END $$;
