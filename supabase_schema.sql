-- ==============================================================================
-- GLOBAL ERA TECHNICAL SCHOOL & KITE TRAINING SYSTEM
-- SUPABASE POSTGRESQL MULTI-TENANT PRODUCTION SCHEMA
-- Best Version: Vocational Training Management System
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Organizations Master (Multi-tenancy Support)
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY DEFAULT ('ORG-' || substr(md5(random()::text), 1, 8)),
  name TEXT NOT NULL,
  sub_name TEXT,
  code TEXT NOT NULL UNIQUE,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  logo_url TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Default Organization
INSERT INTO organizations (id, name, sub_name, code, contact_phone, address)
VALUES (
  'ORG-GLOBALERA-01',
  'ग्लोबल एरा प्राविधिक स्कुल',
  'KITE CAREGIVER TRAINING CENTER',
  'GETS',
  '+977-1-4488990',
  'MitraPark, Chabahil, Kathmandu, Nepal'
) ON CONFLICT (id) DO NOTHING;

-- 2. Funding Sources / Municipalities / Donors
CREATE TABLE IF NOT EXISTS funding_sources (
  id TEXT PRIMARY KEY DEFAULT ('FND-' || substr(md5(random()::text), 1, 8)),
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Municipality', 'Donor', 'Self-Financed', 'CSR', 'Government')),
  ward_coverage TEXT,
  contact_person TEXT,
  contact_phone TEXT,
  mou_number TEXT,
  mou_start_date DATE,
  mou_end_date DATE,
  budget_allocated NUMERIC DEFAULT 0,
  target_beneficiaries INT DEFAULT 0,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'Expired')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Occupations Master
CREATE TABLE IF NOT EXISTS occupations (
  id TEXT PRIMARY KEY DEFAULT ('OCC-' || substr(md5(random()::text), 1, 8)),
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  category TEXT DEFAULT 'Vocational',
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Courses Master (Curricula)
CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY DEFAULT ('CRS-' || substr(md5(random()::text), 1, 8)),
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  occupation_id TEXT REFERENCES occupations(id) ON DELETE CASCADE,
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

-- 5. Trainers Master
CREATE TABLE IF NOT EXISTS trainers (
  id TEXT PRIMARY KEY DEFAULT ('TRN-' || substr(md5(random()::text), 1, 8)),
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  occupation_id TEXT REFERENCES occupations(id) ON DELETE SET NULL,
  pin TEXT NOT NULL DEFAULT '1234',
  specialization TEXT,
  tot_certified BOOLEAN DEFAULT TRUE,
  qualification TEXT,
  photo TEXT,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Training Groups (Operational Core Batches)
CREATE TABLE IF NOT EXISTS training_groups (
  id TEXT PRIMARY KEY DEFAULT ('GRP-' || substr(md5(random()::text), 1, 8)),
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  group_code TEXT NOT NULL,
  course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,
  trainer_id TEXT REFERENCES trainers(id) ON DELETE SET NULL,
  funding_source_id TEXT REFERENCES funding_sources(id) ON DELETE SET NULL,
  funding_type TEXT DEFAULT 'Municipality-Sponsored (Free)' CHECK (funding_type IN ('Municipality-Sponsored (Free)', 'Self-Financed (Paid)', 'Donor-Funded')),
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

-- 7. Syllabus Units Master
CREATE TABLE IF NOT EXISTS syllabi (
  id TEXT PRIMARY KEY DEFAULT ('SYL-' || substr(md5(random()::text), 1, 8)),
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

-- 8. Students Master
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY DEFAULT ('STD-' || substr(md5(random()::text), 1, 8)),
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tgid TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  secondary_phone TEXT,
  email TEXT,
  pin TEXT NOT NULL DEFAULT '1234',
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
  gesi_category TEXT DEFAULT 'General',
  education_level TEXT,
  funding_type TEXT DEFAULT 'Municipality-Sponsored (Free)',
  fee_amount NUMERIC DEFAULT 0,
  fee_paid NUMERIC DEFAULT 0,
  group_id TEXT REFERENCES training_groups(id) ON DELETE SET NULL,
  admission_date DATE NOT NULL,
  expected_end_date DATE,
  photo_url TEXT,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'Dropout', 'OJT', 'Placed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Work Plans (योजना)
CREATE TABLE IF NOT EXISTS work_plans (
  id TEXT PRIMARY KEY DEFAULT ('WP-' || substr(md5(random()::text), 1, 8)),
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

-- 10. Lesson Plans (तयारी)
CREATE TABLE IF NOT EXISTS lesson_plans (
  id TEXT PRIMARY KEY DEFAULT ('LP-' || substr(md5(random()::text), 1, 8)),
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

-- 11. Log Books (वास्तविक डेलिभरी)
CREATE TABLE IF NOT EXISTS log_books (
  id TEXT PRIMARY KEY DEFAULT ('LOG-' || substr(md5(random()::text), 1, 8)),
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

-- 12. Daily Attendance (Idempotent: Group + Date + Student is UNIQUE)
CREATE TABLE IF NOT EXISTS attendances (
  id TEXT PRIMARY KEY DEFAULT ('ATT-' || substr(md5(random()::text), 1, 8)),
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  group_id TEXT REFERENCES training_groups(id) ON DELETE CASCADE,
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late')),
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_attendance_entry UNIQUE (group_id, student_id, date)
);

-- 13. Evaluations (Skill Competency Matrix)
CREATE TABLE IF NOT EXISTS evaluations (
  id TEXT PRIMARY KEY DEFAULT ('EVL-' || substr(md5(random()::text), 1, 8)),
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

-- 14. Employers Master (with Self-Registration Support)
CREATE TABLE IF NOT EXISTS employers (
  id TEXT PRIMARY KEY DEFAULT ('EMP-' || substr(md5(random()::text), 1, 8)),
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

-- 15. Job Openings (रोजगारका अवसरहरू)
CREATE TABLE IF NOT EXISTS job_openings (
  id TEXT PRIMARY KEY DEFAULT ('JOB-' || substr(md5(random()::text), 1, 8)),
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  employer_id TEXT REFERENCES employers(id) ON DELETE CASCADE,
  occupation_id TEXT REFERENCES occupations(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  required_skills TEXT,
  vacancies INT DEFAULT 1,
  salary_range TEXT,
  location TEXT,
  employment_type TEXT DEFAULT 'Full-Time' CHECK (employment_type IN ('Full-Time', 'Part-Time', 'OJT / Internship', 'Contract')),
  deadline DATE,
  status TEXT DEFAULT 'Open' CHECK (status IN ('Open', 'Closed', 'Paused')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Job Applications (विद्यार्थी आवेदनहरू)
CREATE TABLE IF NOT EXISTS job_applications (
  id TEXT PRIMARY KEY DEFAULT ('APP-' || substr(md5(random()::text), 1, 8)),
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  job_id TEXT REFERENCES job_openings(id) ON DELETE CASCADE,
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'Applied' CHECK (status IN ('Applied', 'Shortlisted', 'Interviewed', 'Offered', 'Hired', 'Rejected')),
  apply_date DATE DEFAULT CURRENT_DATE,
  cover_note TEXT,
  is_currently_training BOOLEAN DEFAULT TRUE,
  employer_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_job_student_app UNIQUE (job_id, student_id)
);

-- 17. OJT Records
CREATE TABLE IF NOT EXISTS ojts (
  id TEXT PRIMARY KEY DEFAULT ('OJT-' || substr(md5(random()::text), 1, 8)),
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  employer_id TEXT REFERENCES employers(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  related_person TEXT,
  contact_number TEXT,
  status TEXT DEFAULT 'Ongoing' CHECK (status IN ('Planned', 'Ongoing', 'Completed', 'Terminated')),
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. Placements / EPP
CREATE TABLE IF NOT EXISTS placements (
  id TEXT PRIMARY KEY DEFAULT ('PLC-' || substr(md5(random()::text), 1, 8)),
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  employer_id TEXT REFERENCES employers(id) ON DELETE SET NULL,
  target_job TEXT NOT NULL,
  preferred_location TEXT,
  expected_salary TEXT,
  actual_salary NUMERIC,
  employment_type TEXT DEFAULT 'Full-Time Employee',
  work_schedule TEXT DEFAULT 'Day Shift',
  payment_type TEXT DEFAULT 'Monthly Salary',
  status TEXT DEFAULT 'Planned' CHECK (status IN ('Planned', 'Placed', 'Ongoing', 'Cancelled')),
  retention_3_month_verified BOOLEAN DEFAULT FALSE,
  retention_6_month_verified BOOLEAN DEFAULT FALSE,
  retention_12_month_verified BOOLEAN DEFAULT FALSE,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. Certificates (प्रमाणपत्र & Immutable Snapshot)
CREATE TABLE IF NOT EXISTS certificates (
  id TEXT PRIMARY KEY DEFAULT ('CERT-' || substr(md5(random()::text), 1, 8)),
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

-- 20. Snapshots (Audit & Version History)
CREATE TABLE IF NOT EXISTS snapshots (
  id TEXT PRIMARY KEY DEFAULT ('SNAP-' || substr(md5(random()::text), 1, 8)),
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  version INT DEFAULT 1,
  title TEXT NOT NULL,
  data_payload JSONB NOT NULL,
  reason_for_revision TEXT,
  author TEXT DEFAULT 'Admin',
  is_immutable BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 21. Audit Trail Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY DEFAULT ('AUD-' || substr(md5(random()::text), 1, 8)),
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  description TEXT NOT NULL,
  performed_by TEXT DEFAULT 'Admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_students_group ON students(group_id);
CREATE INDEX IF NOT EXISTS idx_students_phone ON students(phone);
CREATE INDEX IF NOT EXISTS idx_attendance_lookup ON attendances(group_id, date);
CREATE INDEX IF NOT EXISTS idx_eval_lookup ON evaluations(student_id, syllabus_id);
CREATE INDEX IF NOT EXISTS idx_job_openings_occ ON job_openings(occupation_id);
CREATE INDEX IF NOT EXISTS idx_job_apps_job ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_apps_student ON job_applications(student_id);
CREATE INDEX IF NOT EXISTS idx_cert_verify ON certificates(certificate_no);

-- Row Level Security (RLS) Enablement
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE funding_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE occupations ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE syllabi ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE employers ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_openings ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ojts ENABLE ROW LEVEL SECURITY;
ALTER TABLE placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow public read/write for development / anon key
DO $$ 
BEGIN
  EXECUTE 'CREATE POLICY "Allow anon all on organizations" ON organizations FOR ALL USING (true) WITH CHECK (true)';
  EXECUTE 'CREATE POLICY "Allow anon all on funding_sources" ON funding_sources FOR ALL USING (true) WITH CHECK (true)';
  EXECUTE 'CREATE POLICY "Allow anon all on occupations" ON occupations FOR ALL USING (true) WITH CHECK (true)';
  EXECUTE 'CREATE POLICY "Allow anon all on courses" ON courses FOR ALL USING (true) WITH CHECK (true)';
  EXECUTE 'CREATE POLICY "Allow anon all on trainers" ON trainers FOR ALL USING (true) WITH CHECK (true)';
  EXECUTE 'CREATE POLICY "Allow anon all on training_groups" ON training_groups FOR ALL USING (true) WITH CHECK (true)';
  EXECUTE 'CREATE POLICY "Allow anon all on syllabi" ON syllabi FOR ALL USING (true) WITH CHECK (true)';
  EXECUTE 'CREATE POLICY "Allow anon all on students" ON students FOR ALL USING (true) WITH CHECK (true)';
  EXECUTE 'CREATE POLICY "Allow anon all on work_plans" ON work_plans FOR ALL USING (true) WITH CHECK (true)';
  EXECUTE 'CREATE POLICY "Allow anon all on lesson_plans" ON lesson_plans FOR ALL USING (true) WITH CHECK (true)';
  EXECUTE 'CREATE POLICY "Allow anon all on log_books" ON log_books FOR ALL USING (true) WITH CHECK (true)';
  EXECUTE 'CREATE POLICY "Allow anon all on attendances" ON attendances FOR ALL USING (true) WITH CHECK (true)';
  EXECUTE 'CREATE POLICY "Allow anon all on evaluations" ON evaluations FOR ALL USING (true) WITH CHECK (true)';
  EXECUTE 'CREATE POLICY "Allow anon all on employers" ON employers FOR ALL USING (true) WITH CHECK (true)';
  EXECUTE 'CREATE POLICY "Allow anon all on job_openings" ON job_openings FOR ALL USING (true) WITH CHECK (true)';
  EXECUTE 'CREATE POLICY "Allow anon all on job_applications" ON job_applications FOR ALL USING (true) WITH CHECK (true)';
  EXECUTE 'CREATE POLICY "Allow anon all on ojts" ON ojts FOR ALL USING (true) WITH CHECK (true)';
  EXECUTE 'CREATE POLICY "Allow anon all on placements" ON placements FOR ALL USING (true) WITH CHECK (true)';
  EXECUTE 'CREATE POLICY "Allow anon all on certificates" ON certificates FOR ALL USING (true) WITH CHECK (true)';
  EXECUTE 'CREATE POLICY "Allow anon all on snapshots" ON snapshots FOR ALL USING (true) WITH CHECK (true)';
  EXECUTE 'CREATE POLICY "Allow anon all on audit_logs" ON audit_logs FOR ALL USING (true) WITH CHECK (true)';
EXCEPTION WHEN OTHERS THEN 
  -- Policies might already exist
END $$;
