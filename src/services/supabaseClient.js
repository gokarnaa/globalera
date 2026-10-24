import { createClient } from '@supabase/supabase-js';

const ENV_URL = import.meta.env.VITE_SUPABASE_URL || 'https://yycybsmwuixixfmocrcz.supabase.co';
const ENV_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_e8g5bAQNbCGpuI3aC0P1SA_Lb02m1cO';

let cachedClient = null;

export function getSupabaseClient(customUrl, customKey) {
  const url = customUrl || ENV_URL;
  const key = customKey || ENV_KEY;
  if (!url || !key) return null;

  try {
    return createClient(url, key);
  } catch (err) {
    console.error('Supabase client error:', err);
    return null;
  }
}

export const supabase = getSupabaseClient();

export async function testSupabaseConnection(url = ENV_URL, key = ENV_KEY) {
  try {
    const client = getSupabaseClient(url, key);
    if (!client) return { ok: false, message: 'Invalid URL or Key format.' };

    // Quick lightweight query on organizations or server health
    const { data, error } = await client.from('organizations').select('id, name').limit(1);
    if (error) {
      // Table might not exist yet if migration hasn't been run
      if (error.code === '42P01') {
        return {
          ok: true,
          tableMissing: true,
          message: 'Connected to Supabase successfully! Run the migration script in Supabase SQL Editor.'
        };
      }
      return { ok: false, message: error.message };
    }
    return { ok: true, data, message: 'Successfully connected to Supabase PostgreSQL Cloud!' };
  } catch (err) {
    return { ok: false, message: err.message || 'Network connection failed.' };
  }
}

/**
 * Pushes all current LocalStorage TVET collections into Supabase Cloud
 */
export async function pushLocalDBToSupabase(db, orgId = 'ORG-GLOBALERA-01') {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not initialized. Check your credentials.');

  const results = {
    organizations: 0,
    occupations: 0,
    courses: 0,
    trainers: 0,
    training_groups: 0,
    syllabi: 0,
    students: 0,
    work_plans: 0,
    lesson_plans: 0,
    log_books: 0,
    attendances: 0,
    evaluations: 0,
    employers: 0,
    job_openings: 0,
    job_applications: 0,
    ojts: 0,
    placements: 0,
    certificates: 0
  };

  // 1. Organization
  await client.from('organizations').upsert({
    id: orgId,
    name: db.settings?.instituteName || 'ग्लोबल एरा प्राविधिक स्कुल',
    sub_name: db.settings?.instituteSub || 'KITE CAREGIVER TRAINING CENTER',
    code: 'GETS',
    contact_phone: db.settings?.contactPhone || '+977-1-4488990',
    address: db.settings?.location || 'MitraPark, Chabahil, Kathmandu'
  });
  results.organizations = 1;

  // 2. Occupations
  if (db.occupations?.length) {
    const occPayload = db.occupations.map((o) => ({
      id: o.id,
      organization_id: orgId,
      name: o.name,
      status: o.status || 'Active'
    }));
    const { error } = await client.from('occupations').upsert(occPayload);
    if (error) console.warn('Occupations sync notice:', error.message);
    else results.occupations = occPayload.length;
  }

  // 3. Courses
  if (db.courses?.length) {
    const crsPayload = db.courses.map((c) => ({
      id: c.id,
      organization_id: orgId,
      occupation_id: c.occupationId,
      title: c.title,
      level: c.level || 'Level 1',
      duration_value: c.durationValue || 3,
      duration_unit: c.durationUnit || 'Months',
      total_hours: c.totalHours || 390,
      price: c.price || 0,
      description: c.description,
      status: c.status || 'Active'
    }));
    const { error } = await client.from('courses').upsert(crsPayload);
    if (error) console.warn('Courses sync notice:', error.message);
    else results.courses = crsPayload.length;
  }

  // 4. Trainers
  if (db.trainers?.length) {
    const trnPayload = db.trainers.map((t) => ({
      id: t.id,
      organization_id: orgId,
      name: t.name,
      phone: t.phone,
      occupation_id: t.occupationId,
      pin: t.pin || '1234',
      specialization: t.specialization,
      photo: t.photo,
      status: t.status || 'Active'
    }));
    const { error } = await client.from('trainers').upsert(trnPayload);
    if (error) console.warn('Trainers sync notice:', error.message);
    else results.trainers = trnPayload.length;
  }

  // 5. Training Groups
  if (db.trainingGroups?.length) {
    const grpPayload = db.trainingGroups.map((g) => ({
      id: g.id,
      organization_id: orgId,
      group_code: g.groupCode || g.code,
      course_id: g.courseId,
      trainer_id: g.trainerId,
      shift: g.shift || 'A',
      start_time: g.startTime || '07:00',
      end_time: g.endTime || '09:00',
      start_date: g.startDate || new Date().toISOString().slice(0, 10),
      expected_end_date: g.expectedEndDate || new Date().toISOString().slice(0, 10),
      status: g.status || 'Running'
    }));
    const { error } = await client.from('training_groups').upsert(grpPayload);
    if (error) console.warn('Groups sync notice:', error.message);
    else results.training_groups = grpPayload.length;
  }

  // 6. Syllabi
  if (db.syllabi?.length) {
    const sylPayload = db.syllabi.map((s) => ({
      id: s.id,
      organization_id: orgId,
      course_id: s.courseId,
      unit_no: s.unitNo,
      title: s.title,
      theory_hours: s.theoryHours || 0,
      practical_hours: s.practicalHours || 0,
      total_hours: s.totalHours || (s.theoryHours || 0) + (s.practicalHours || 0),
      learning_outcome: s.learningOutcome,
      tools_and_materials: s.toolsAndMaterials
    }));
    const { error } = await client.from('syllabi').upsert(sylPayload);
    if (error) console.warn('Syllabi sync notice:', error.message);
    else results.syllabi = sylPayload.length;
  }

  // 7. Students
  if (db.students?.length) {
    const stdPayload = db.students.map((s) => ({
      id: s.id,
      organization_id: orgId,
      tgid: s.tgid,
      name: s.name,
      phone: s.phone,
      secondary_phone: s.secondaryPhone,
      email: s.email,
      pin: s.pin || '1234',
      gender: s.gender,
      date_of_birth: s.dateOfBirth,
      citizenship_number: s.citizenshipNumber,
      citizenship_district: s.citizenshipDistrict,
      municipality: s.municipality || 'Gokarneshwor',
      ward_no: s.wardNo || '5',
      permanent_address: s.permanentAddress,
      current_address: s.currentAddress,
      father_name: s.fatherName,
      mother_name: s.motherName,
      guardian_contact: s.guardianContact,
      group_id: s.groupId,
      admission_date: s.admissionDate || new Date().toISOString().slice(0, 10),
      expected_end_date: s.expectedEndDate,
      photo_url: s.photoUrl,
      status: s.status || 'Active'
    }));
    const { error } = await client.from('students').upsert(stdPayload);
    if (error) console.warn('Students sync notice:', error.message);
    else results.students = stdPayload.length;
  }

  // 8. Work Plans
  if (db.workPlans?.length) {
    const wpPayload = db.workPlans.map((w) => ({
      id: w.id,
      organization_id: orgId,
      group_id: w.groupId,
      syllabus_id: w.syllabusId,
      plan_date: w.planDate,
      day_name: w.dayName || 'Day',
      theory_aspect: w.theoryAspect,
      practical_aspect: w.practicalAspect,
      planned_hours: w.plannedHours || 2,
      status: w.status || 'Pending'
    }));
    const { error } = await client.from('work_plans').upsert(wpPayload);
    if (error) console.warn('Work plans sync notice:', error.message);
    else results.work_plans = wpPayload.length;
  }

  // 9. Lesson Plans
  if (db.lessonPlans?.length) {
    const lpPayload = db.lessonPlans.map((l) => ({
      id: l.id,
      organization_id: orgId,
      work_plan_id: l.workPlanId,
      group_id: l.groupId,
      objectives: l.objectives || 'Competency objectives',
      materials_needed: l.materialsNeeded,
      methodology: l.methodology,
      assessment_method: l.assessmentMethod,
      homework: l.homework,
      notes: l.notes
    }));
    const { error } = await client.from('lesson_plans').upsert(lpPayload);
    if (error) console.warn('Lesson plans sync notice:', error.message);
    else results.lesson_plans = lpPayload.length;
  }

  // 10. Log Books
  if (db.logBooks?.length) {
    const logPayload = db.logBooks.map((lb) => ({
      id: lb.id,
      organization_id: orgId,
      lesson_plan_id: lb.lessonPlanId,
      group_id: lb.groupId,
      delivery_date: lb.deliveryDate,
      topics_covered: lb.topicsCovered || 'Topics delivered',
      materials_used: lb.materialsUsed,
      skills_learned: lb.skillsLearned,
      actual_hours: lb.actualHours || 2,
      is_delivered: lb.isDelivered !== false,
      trainer_notes: lb.trainerNotes
    }));
    const { error } = await client.from('log_books').upsert(logPayload);
    if (error) console.warn('Log books sync notice:', error.message);
    else results.log_books = logPayload.length;
  }

  // 11. Attendances
  if (db.attendances?.length) {
    const attPayload = db.attendances.map((a) => ({
      id: a.id,
      organization_id: orgId,
      group_id: a.groupId,
      student_id: a.studentId,
      date: a.date,
      status: a.status,
      remarks: a.remarks
    }));
    const { error } = await client.from('attendances').upsert(attPayload, { onConflict: 'group_id,student_id,date' });
    if (error) console.warn('Attendance sync notice:', error.message);
    else results.attendances = attPayload.length;
  }

  // 12. Evaluations
  if (db.evaluations?.length) {
    const evalPayload = db.evaluations.map((ev) => ({
      id: ev.id,
      organization_id: orgId,
      group_id: ev.groupId,
      student_id: ev.studentId,
      syllabus_id: ev.syllabusId,
      mastered: Boolean(ev.mastered),
      areas_to_improve: ev.areasToImprove,
      trainer_plan: ev.trainerPlan,
      evaluator_name: ev.evaluatorName,
      evaluated_at: ev.evaluatedAt || new Date().toISOString().slice(0, 10)
    }));
    const { error } = await client.from('evaluations').upsert(evalPayload);
    if (error) console.warn('Evaluations sync notice:', error.message);
    else results.evaluations = evalPayload.length;
  }

  // 13. Employers
  if (db.employers?.length) {
    const empPayload = db.employers.map((em) => ({
      id: em.id,
      organization_id: orgId,
      name: em.name,
      industry: em.industry,
      location: em.location,
      contact_person: em.contactPerson,
      phone: em.phone || '9800000000',
      email: em.email,
      pin: em.pin || '1234',
      status: em.status || 'Active',
      remarks: em.remarks
    }));
    const { error } = await client.from('employers').upsert(empPayload);
    if (error) console.warn('Employers sync notice:', error.message);
    else results.employers = empPayload.length;
  }

  // 14. Job Openings
  if (db.jobOpenings?.length) {
    const jobPayload = db.jobOpenings.map((j) => ({
      id: j.id,
      organization_id: orgId,
      employer_id: j.employerId,
      occupation_id: j.occupationId,
      title: j.title,
      description: j.description,
      required_skills: j.requiredSkills,
      vacancies: j.vacancies || 1,
      salary_range: j.salaryRange,
      location: j.location,
      employment_type: j.employmentType || 'Full-Time',
      status: j.status || 'Open'
    }));
    const { error } = await client.from('job_openings').upsert(jobPayload);
    if (error) console.warn('Job openings sync notice:', error.message);
    else results.job_openings = jobPayload.length;
  }

  // 15. Job Applications
  if (db.jobApplications?.length) {
    const appPayload = db.jobApplications.map((ja) => ({
      id: ja.id,
      organization_id: orgId,
      job_id: ja.jobId,
      student_id: ja.studentId,
      status: ja.status || 'Applied',
      apply_date: ja.applyDate || new Date().toISOString().slice(0, 10),
      cover_note: ja.coverNote,
      is_currently_training: ja.isCurrentlyTraining !== false
    }));
    const { error } = await client.from('job_applications').upsert(appPayload, { onConflict: 'job_id,student_id' });
    if (error) console.warn('Job applications sync notice:', error.message);
    else results.job_applications = appPayload.length;
  }

  // 16. Certificates
  if (db.certificates?.length) {
    const certPayload = db.certificates.map((c) => ({
      id: c.id,
      organization_id: orgId,
      certificate_no: c.certificateNo,
      student_id: c.studentId,
      course_id: c.courseId,
      group_id: c.groupId,
      issue_date: c.issueDate || new Date().toISOString().slice(0, 10),
      grade_division: c.grade || 'Distinction',
      verification_code: c.verificationCode || c.certificateNo,
      status: c.status || 'Active',
      certificate_payload: c
    }));
    const { error } = await client.from('certificates').upsert(certPayload, { onConflict: 'certificate_no' });
    if (error) console.warn('Certificates sync notice:', error.message);
    else results.certificates = certPayload.length;
  }

  return results;
}

/**
 * Live Certificate Verification Query (Cloud-first, Local-fallback)
 */
export async function verifyCertificateRemote(certNo) {
  if (!certNo) return null;
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('certificates')
        .select(`
          id,
          certificate_no,
          issue_date,
          grade_division,
          status,
          certificate_payload,
          students (id, name, phone, tgid, citizenship_number, permanent_address, photo_url),
          courses (id, title, level, total_hours, occupations(name)),
          training_groups (id, group_code, start_date, expected_end_date, shift)
        `)
        .ilike('certificate_no', certNo.trim())
        .maybeSingle();

      if (data && !error) {
        return {
          found: true,
          source: 'Supabase PostgreSQL Cloud',
          certificate: {
            id: data.id,
            certificateNo: data.certificate_no,
            issueDate: data.issue_date,
            grade: data.grade_division,
            status: data.status,
            ...data.certificate_payload
          },
          student: data.students,
          course: data.courses,
          group: data.training_groups
        };
      }
    } catch (err) {
      console.warn('Supabase remote lookup failed, falling back to local DB:', err);
    }
  }
  return null;
}

export function generateSupabaseSQLSchema() {
  return `-- ==============================================================================
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

-- Indexes for lightning fast queries & reporting
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

-- Allow public read/write for development / anon key
DO $$ 
BEGIN
  EXECUTE 'CREATE POLICY "Allow anon all on organizations" ON organizations FOR ALL USING (true) WITH CHECK (true)';
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
EXCEPTION WHEN OTHERS THEN 
  -- Policies might already exist
END $$;
`;
}
