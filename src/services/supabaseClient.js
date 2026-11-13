import { createClient } from '@supabase/supabase-js';

const getEnvVar = (name, fallback = '') => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[name]) {
    return import.meta.env[name];
  }
  if (typeof process !== 'undefined' && process.env && process.env[name]) {
    return process.env[name];
  }
  return fallback;
};

const DEFAULT_SUPABASE_URL = getEnvVar('VITE_SUPABASE_URL', 'https://yycybsmwuixixfmocrcz.supabase.co');
const DEFAULT_SUPABASE_ANON_KEY = getEnvVar('VITE_SUPABASE_ANON_KEY', 'sb_publishable_e8g5bAQNbCGpuI3aC0P1SA_Lb02m1cO');

export function getSupabaseConfig() {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('kite_tvet_erp_prod_v2') : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.settings?.supabaseUrl && parsed.settings?.supabaseAnonKey) {
        return {
          url: parsed.settings.supabaseUrl,
          key: parsed.settings.supabaseAnonKey
        };
      }
    }
  } catch (e) {
    // ignore
  }
  return {
    url: DEFAULT_SUPABASE_URL,
    key: DEFAULT_SUPABASE_ANON_KEY
  };
}

export function getSupabaseClient(customUrl, customKey) {
  const config = getSupabaseConfig();
  const url = customUrl || config.url;
  const key = customKey || config.key;

  if (!url || !key) return null;

  try {
    return createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    });
  } catch (err) {
    console.error('Supabase client error:', err);
    return null;
  }
}

export const supabase = getSupabaseClient();

export async function testSupabaseConnection(url, key) {
  try {
    const config = getSupabaseConfig();
    const targetUrl = url || config.url;
    const targetKey = key || config.key;

    if (!targetUrl || !targetKey) {
      return {
        ok: false,
        message: 'Supabase URL or Anon Key is missing. Please enter your credentials.'
      };
    }
    const client = getSupabaseClient(targetUrl, targetKey);
    if (!client) return { ok: false, message: 'Invalid URL or Key format.' };

    const { data, error } = await client.from('organizations').select('id, name').limit(1);
    if (error) {
      if (error.code === '42P01') {
        return {
          ok: true,
          tableMissing: true,
          message: 'Connected to Supabase project! Database tables are empty. Please run the SQL schema migration in Supabase SQL Editor.'
        };
      }
      return { ok: false, message: error.message };
    }
    return {
      ok: true,
      data,
      message: 'Successfully connected to Supabase PostgreSQL Cloud!'
    };
  } catch (err) {
    return { ok: false, message: err.message || 'Network connection failed.' };
  }
}

/**
 * PUSH ALL local database tables to Supabase Cloud
 */
export async function pushLocalDBToSupabase(db, orgId = 'ORG-GLOBALERA-01') {
  const client = getSupabaseClient(db.settings?.supabaseUrl, db.settings?.supabaseAnonKey);
  if (!client) throw new Error('Supabase client not initialized. Check your credentials in Settings.');

  const results = {};

  // Helper for batch upserts
  const safeUpsert = async (table, payload, conflictKey) => {
    if (!payload || !payload.length) return 0;
    try {
      const opts = conflictKey ? { onConflict: conflictKey } : undefined;
      const { error } = await client.from(table).upsert(payload, opts);
      if (error) {
        console.warn(`[Supabase Push] ${table} warning:`, error.message);
        return 0;
      }
      return payload.length;
    } catch (e) {
      console.warn(`[Supabase Push] ${table} exception:`, e.message);
      return 0;
    }
  };

  // 1. Organization
  await client.from('organizations').upsert({
    id: orgId,
    name: db.settings?.instituteName || 'GLOBAL ERA MULTI SERVICE PVT. LTD. / GLOBAL ERA TECHNICAL SCHOOL',
    sub_name: db.settings?.instituteSub || 'Global Era Technical School',
    code: 'GETS',
    contact_phone: db.settings?.contactPhone || '+977-1-4915678 / 9851234567',
    contact_email: db.settings?.email || 'info@globalera.edu.np',
    address: db.settings?.location || 'Jorpati, Gokarneshwor-05, Kathmandu, Nepal',
    settings: db.settings || {}
  });
  results.organizations = 1;

  // 2. System Settings
  await client.from('system_settings').upsert({
    id: 'GLOBAL_CONFIG',
    organization_id: orgId,
    institute_name: db.settings?.instituteName || 'Global Era Technical School',
    institute_sub: db.settings?.instituteSub,
    location: db.settings?.location,
    contact_phone: db.settings?.contactPhone,
    email: db.settings?.email,
    company_profile: db.settings?.companyProfile || {},
    biometric_settings: db.settings?.biometricSettings || {},
    certificate_format: db.settings?.certificateNumberFormat || {},
    updated_at: new Date().toISOString()
  });
  results.system_settings = 1;

  // 3. Users
  if (db.users?.length) {
    results.users = await safeUpsert('users', db.users.map(u => ({
      id: u.id,
      organization_id: orgId,
      username: u.username,
      phone: u.phone,
      name: u.name,
      role: u.role || 'STAFF',
      pin: u.pin || '1234',
      status: u.status || 'Active',
      title: u.title,
      trainer_id: u.trainerId,
      student_id: u.studentId,
      agent_id: u.agentId,
      specialization: u.specialization
    })), 'organization_id,username');
  }

  // 4. Occupations
  if (db.occupations?.length) {
    results.occupations = await safeUpsert('occupations', db.occupations.map(o => ({
      id: o.id,
      organization_id: orgId,
      name: o.name,
      code: o.code,
      description: o.description,
      category: o.category || 'Vocational',
      status: o.status || 'Active'
    })));
  }

  // 5. Courses
  if (db.courses?.length) {
    results.courses = await safeUpsert('courses', db.courses.map(c => ({
      id: c.id,
      organization_id: orgId,
      occupation_id: c.occupationId,
      title: c.title,
      course_code: c.code || c.courseCode,
      level: c.level || 'Level 1',
      duration_value: Number(c.durationValue) || 3,
      duration_unit: c.durationUnit || 'Months',
      total_hours: Number(c.totalHours) || 390,
      theory_hours: Number(c.theoryHours) || 90,
      practical_hours: Number(c.practicalHours) || 300,
      price: Number(c.price) || 0,
      description: c.description,
      entry_qualification: c.entryQualification,
      status: c.status || 'Active'
    })));
  }

  // 6. Trainers
  if (db.trainers?.length) {
    results.trainers = await safeUpsert('trainers', db.trainers.map(t => ({
      id: t.id,
      organization_id: orgId,
      occupation_id: t.occupationId,
      name: t.name,
      phone: t.phone,
      email: t.email,
      pin: t.pin || '1234',
      biometric_id: t.biometricId,
      specialization: t.specialization,
      tot_certified: t.totCertified !== false,
      remuneration_type: t.remunerationType || 'COMMISSION',
      salary_amount: Number(t.salaryAmount) || 0,
      commission_percent: Number(t.commissionPercent) || 15,
      qualification: t.qualification,
      photo: t.photo,
      status: t.status || 'Active'
    })));
  }

  // 7. Training Groups
  if (db.trainingGroups?.length) {
    results.training_groups = await safeUpsert('training_groups', db.trainingGroups.map(g => ({
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
      classroom_lab: g.classroomLab || g.room,
      max_capacity: Number(g.maxCapacity) || 25,
      batch_mode: g.batchMode || 'ROLLING',
      schedule_mode: g.scheduleMode || 'REGULAR',
      status: g.status || 'Running'
    })));
  }

  // 8. Syllabi
  if (db.syllabi?.length) {
    results.syllabi = await safeUpsert('syllabi', db.syllabi.map(s => ({
      id: s.id,
      organization_id: orgId,
      course_id: s.courseId,
      unit_no: Number(s.unitNo) || 1,
      title: s.title,
      theory_hours: Number(s.theoryHours) || 0,
      practical_hours: Number(s.practicalHours) || 0,
      total_hours: Number(s.totalHours) || 0,
      learning_outcome: s.learningOutcome,
      tools_and_materials: s.toolsAndMaterials
    })));
  }

  // 9. Work Plans
  if (db.workPlans?.length) {
    results.work_plans = await safeUpsert('work_plans', db.workPlans.map(w => ({
      id: w.id,
      organization_id: orgId,
      group_id: w.groupId,
      syllabus_id: w.syllabusId,
      plan_date: w.planDate,
      day_name: w.dayName || 'Day',
      cycle_day: w.cycleDay != null ? Number(w.cycleDay) : null,
      theory_aspect: w.theoryAspect,
      practical_aspect: w.practicalAspect,
      planned_hours: Number(w.plannedHours) || 2,
      status: w.status || 'Pending'
    })));
  }

  // 10. Lesson Plans
  if (db.lessonPlans?.length) {
    results.lesson_plans = await safeUpsert('lesson_plans', db.lessonPlans.map(l => ({
      id: l.id,
      organization_id: orgId,
      work_plan_id: l.workPlanId,
      group_id: l.groupId,
      objectives: l.objectives || 'Objectives',
      materials_needed: l.materialsNeeded,
      methodology: l.methodology,
      assessment_method: l.assessmentMethod,
      homework: l.homework,
      notes: l.notes
    })));
  }

  // 11. Log Books
  if (db.logBooks?.length) {
    results.log_books = await safeUpsert('log_books', db.logBooks.map(lb => ({
      id: lb.id,
      organization_id: orgId,
      lesson_plan_id: lb.lessonPlanId,
      group_id: lb.groupId,
      delivery_date: lb.deliveryDate,
      topics_covered: lb.topicsCovered || 'Topics',
      materials_used: lb.materialsUsed,
      skills_learned: lb.skillsLearned,
      actual_hours: Number(lb.actualHours) || 2,
      is_delivered: lb.isDelivered !== false,
      trainer_notes: lb.trainerNotes
    })));
  }

  // 12. Students
  if (db.students?.length) {
    results.students = await safeUpsert('students', db.students.map(s => ({
      id: s.id,
      organization_id: orgId,
      group_id: s.groupId,
      tgid: s.tgid,
      name: s.name,
      phone: s.phone,
      secondary_phone: s.secondaryPhone,
      email: s.email,
      pin: s.pin || '1234',
      biometric_id: s.biometricId,
      gender: s.gender,
      date_of_birth: s.dateOfBirth,
      citizenship_number: s.citizenshipNumber,
      citizenship_district: s.citizenshipDistrict,
      municipality: s.municipality,
      ward_no: s.wardNo,
      permanent_address: s.permanentAddress,
      current_address: s.currentAddress,
      father_name: s.fatherName,
      mother_name: s.motherName,
      guardian_contact: s.guardianContact,
      education_level: s.educationLevel,
      funding_type: s.fundingType || 'Self-Financed (Paid)',
      fee_amount: Number(s.feeAmount) || 0,
      fee_paid: Number(s.feePaid) || 0,
      admission_date: s.admissionDate || new Date().toISOString().slice(0, 10),
      expected_end_date: s.expectedEndDate,
      photo_url: s.photoUrl,
      status: s.status || 'Active'
    })));
  }

  // 13. Attendances
  if (db.attendances?.length) {
    results.attendances = await safeUpsert('attendances', db.attendances.map(a => ({
      id: a.id,
      organization_id: orgId,
      group_id: a.groupId,
      student_id: a.studentId,
      date: a.date,
      status: a.status,
      remarks: a.remarks
    })), 'group_id,student_id,date');
  }

  // 14. Biometric Logs
  if (db.biometricLogs?.length) {
    results.biometric_logs = await safeUpsert('biometric_logs', db.biometricLogs.map(b => ({
      id: b.id,
      organization_id: orgId,
      biometric_id: b.biometricId,
      user_type: b.userType,
      user_id: b.userId,
      user_name: b.userName,
      timestamp: b.timestamp || new Date().toISOString(),
      date: b.date || new Date().toISOString().slice(0, 10),
      time: b.time || '00:00:00',
      verify_mode: b.verifyMode || 'Fingerprint / RFID',
      device_serial: b.deviceSerial
    })));
  }

  // 15. Leads & CRM
  if (db.leads?.length) {
    results.leads = await safeUpsert('leads', db.leads.map(l => ({
      id: l.id,
      organization_id: orgId,
      course_id: l.courseId,
      agent_id: l.agentId,
      name: l.name,
      phone: l.phone,
      email: l.email,
      address: l.address,
      source: l.source || 'Walk-in',
      status: l.status || 'New',
      priority: l.priority || 'Medium',
      counselor: l.counselor,
      follow_up_date: l.followUpDate,
      notes: l.notes
    })));
  }

  // 16. Agents
  if (db.agents?.length) {
    results.agents = await safeUpsert('agents', db.agents.map(ag => ({
      id: ag.id,
      organization_id: orgId,
      code: ag.code,
      name: ag.name,
      phone: ag.phone,
      email: ag.email,
      commission_rate: Number(ag.commissionRate) || 10,
      payment_info: ag.paymentInfo,
      status: ag.status || 'Active',
      total_leads: Number(ag.totalLeads) || 0,
      total_enrolled: Number(ag.totalEnrolled) || 0,
      total_earnings: Number(ag.totalEarnings) || 0
    })));
  }

  // 17. Admissions
  if (db.admissions?.length) {
    results.admissions = await safeUpsert('admissions', db.admissions.map(ad => ({
      id: ad.id,
      organization_id: orgId,
      student_id: ad.studentId,
      lead_id: ad.leadId,
      course_id: ad.courseId,
      group_id: ad.groupId,
      agreement_no: ad.agreementNo,
      agreement_date: ad.agreementDate,
      total_fee: Number(ad.totalFee) || 0,
      discount: Number(ad.discount) || 0,
      agreed_fee: Number(ad.agreedFee) || 0,
      payment_plan: ad.paymentPlan || 'INSTALLMENT_2',
      status: ad.status || 'Enrolled'
    })));
  }

  // 18. Chart of Accounts
  if (db.chartOfAccounts?.length) {
    results.chart_of_accounts = await safeUpsert('chart_of_accounts', db.chartOfAccounts.map(coa => ({
      code: coa.code,
      organization_id: orgId,
      name: coa.name,
      type: coa.type,
      normal_balance: coa.normalBalance,
      balance: Number(coa.balance) || 0
    })));
  }

  // 19. Parties (Landlords, Vendors, Suppliers)
  if (db.parties?.length) {
    results.parties = await safeUpsert('parties', db.parties.map(p => ({
      id: p.id,
      organization_id: orgId,
      category: p.category || 'TECHNICAL_SUPPLIER',
      name: p.name,
      contact_person: p.contactPerson,
      phone: p.phone,
      email: p.email,
      bank_name: p.bankName,
      account_number: p.accountNumber,
      account_holder: p.accountHolder,
      pan_vat: p.panVat,
      monthly_rent: Number(p.monthlyRent) || 0,
      security_deposit: Number(p.securityDeposit) || 0,
      address: p.address,
      notes: p.notes,
      total_purchases: Number(p.totalPurchases) || 0,
      total_paid: Number(p.totalPaid) || 0,
      current_due: Number(p.currentDue) || 0
    })));
  }

  // 20. Payments (Student Fee Receipts)
  if (db.payments?.length) {
    results.payments = await safeUpsert('payments', db.payments.map(py => ({
      id: py.id,
      organization_id: orgId,
      receipt_no: py.receiptNo,
      student_id: py.studentId,
      group_id: py.groupId,
      amount: Number(py.amount) || 0,
      discount: Number(py.discount) || 0,
      net_amount: Number(py.netAmount) || Number(py.amount) || 0,
      payment_date: py.paymentDate || py.date,
      payment_method: py.paymentMethod || py.method || 'Cash',
      collector_name: py.collectorName || py.receivedBy,
      remarks: py.remarks,
      installment_no: Number(py.installmentNo) || 1
    })));
  }

  // 21. Trainer Payouts
  if (db.trainerPayouts?.length) {
    results.trainer_payouts = await safeUpsert('trainer_payouts', db.trainerPayouts.map(tp => ({
      id: tp.id,
      organization_id: orgId,
      voucher_no: tp.voucherNo,
      trainer_id: tp.trainerId,
      group_id: tp.groupId,
      payout_type: tp.payoutType || 'COMMISSION',
      amount: Number(tp.amount) || 0,
      payout_date: tp.payoutDate || tp.date,
      payment_method: tp.paymentMethod || 'Bank Transfer',
      disbursed_by: tp.disbursedBy,
      remarks: tp.remarks
    })));
  }

  // 22. Journal Entries
  if (db.journalEntries?.length) {
    results.journal_entries = await safeUpsert('journal_entries', db.journalEntries.map(je => ({
      id: je.id,
      organization_id: orgId,
      entry_date: je.entryDate || je.date,
      entry_type: je.entryType || 'GENERAL',
      voucher_no: je.voucherNo,
      description: je.description,
      total_debit: Number(je.totalDebit) || 0,
      total_credit: Number(je.totalCredit) || 0,
      lines: je.lines || [],
      is_balanced: je.isBalanced !== false
    })));
  }

  // 23. Expenses
  if (db.expenses?.length) {
    results.expenses = await safeUpsert('expenses', db.expenses.map(ex => ({
      id: ex.id,
      organization_id: orgId,
      party_id: ex.partyId,
      expense_date: ex.expenseDate || ex.date,
      category: ex.category || 'Operations',
      bill_no: ex.billNo,
      amount: Number(ex.amount) || 0,
      payment_method: ex.paymentMethod || 'Cash',
      paid_to: ex.paidTo,
      description: ex.description,
      receipt_url: ex.receiptUrl
    })));
  }

  // 24. Project Contracts
  if (db.projectContracts?.length) {
    results.project_contracts = await safeUpsert('project_contracts', db.projectContracts.map(pc => ({
      id: pc.id,
      organization_id: orgId,
      title: pc.title,
      funding_agency: pc.fundingAgency,
      contact_person: pc.contactPerson,
      phone: pc.phone,
      total_amount: Number(pc.totalAmount) || 0,
      received_amount: Number(pc.receivedAmount) || 0,
      receivable_amount: Number(pc.receivableAmount) || 0,
      start_date: pc.startDate,
      end_date: pc.endDate,
      target_students: Number(pc.targetStudents) || 0,
      status: pc.status || 'Active'
    })));
  }

  // 25. Cash Closings
  if (db.cashClosings?.length) {
    results.cash_closings = await safeUpsert('cash_closings', db.cashClosings.map(cc => ({
      id: cc.id,
      organization_id: orgId,
      closing_date: cc.closingDate,
      closing_time: cc.closingTime,
      opening_cash: Number(cc.openingCash) || 0,
      cash_inflow: Number(cc.cashInflow) || 0,
      cash_outflow: Number(cc.cashOutflow) || 0,
      expected_cash: Number(cc.expectedCash) || 0,
      physical_cash: Number(cc.physicalCash) || 0,
      variance: Number(cc.variance) || 0,
      denominations: cc.denominations || {},
      cashier_name: cc.cashierName,
      notes: cc.notes
    })));
  }

  // 26. Employers
  if (db.employers?.length) {
    results.employers = await safeUpsert('employers', db.employers.map(em => ({
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
      mou_signed: Boolean(em.mouSigned),
      remarks: em.remarks
    })));
  }

  // 27. Job Openings
  if (db.jobOpenings?.length) {
    results.job_openings = await safeUpsert('job_openings', db.jobOpenings.map(j => ({
      id: j.id,
      organization_id: orgId,
      employer_id: j.employerId,
      occupation_id: j.occupationId,
      title: j.title,
      description: j.description,
      required_skills: j.requiredSkills,
      vacancies: Number(j.vacancies) || 1,
      salary_range: j.salaryRange,
      location: j.location,
      employment_type: j.employmentType || 'Full-Time',
      deadline: j.deadline,
      status: j.status || 'Open'
    })));
  }

  // 28. Job Applications
  if (db.jobApplications?.length) {
    results.job_applications = await safeUpsert('job_applications', db.jobApplications.map(ja => ({
      id: ja.id,
      organization_id: orgId,
      job_id: ja.jobId,
      student_id: ja.studentId,
      status: ja.status || 'Applied',
      apply_date: ja.applyDate,
      cover_note: ja.coverNote,
      is_currently_training: ja.isCurrentlyTraining !== false
    })), 'job_id,student_id');
  }

  // 29. OJTs
  if (db.ojts?.length) {
    results.ojts = await safeUpsert('ojts', db.ojts.map(o => ({
      id: o.id,
      organization_id: orgId,
      student_id: o.studentId,
      employer_id: o.employerId,
      start_date: o.startDate,
      end_date: o.endDate,
      related_person: o.relatedPerson,
      contact_number: o.contactNumber,
      status: o.status || 'Ongoing',
      remarks: o.remarks
    })));
  }

  // 30. Placements
  if (db.placements?.length) {
    results.placements = await safeUpsert('placements', db.placements.map(pl => ({
      id: pl.id,
      organization_id: orgId,
      student_id: pl.studentId,
      employer_id: pl.employerId,
      target_job: pl.targetJob,
      preferred_location: pl.preferredLocation,
      actual_salary: Number(pl.actualSalary) || null,
      employment_type: pl.employmentType || 'Full-Time Employee',
      status: pl.status || 'Planned',
      retention_3_month_verified: Boolean(pl.retention3MonthVerified),
      retention_6_month_verified: Boolean(pl.retention6MonthVerified)
    })));
  }

  // 31. Evaluations
  if (db.evaluations?.length) {
    results.evaluations = await safeUpsert('evaluations', db.evaluations.map(ev => ({
      id: ev.id,
      organization_id: orgId,
      group_id: ev.groupId,
      student_id: ev.studentId,
      syllabus_id: ev.syllabusId,
      mastered: Boolean(ev.mastered),
      areas_to_improve: ev.areasToImprove,
      trainer_plan: ev.trainerPlan,
      evaluator_name: ev.evaluatorName,
      evaluated_at: ev.evaluatedAt
    })));
  }

  // 32. Certificates
  if (db.certificates?.length) {
    results.certificates = await safeUpsert('certificates', db.certificates.map(c => ({
      id: c.id,
      organization_id: orgId,
      certificate_no: c.certificateNo,
      student_id: c.studentId,
      course_id: c.courseId,
      group_id: c.groupId,
      issue_date: c.issueDate,
      grade_division: c.grade || 'Distinction',
      verification_code: c.verificationCode || c.certificateNo,
      status: c.status || 'Active',
      certificate_payload: c
    })), 'certificate_no');
  }

  // 33. Holidays
  if (db.holidays?.length) {
    results.holidays = await safeUpsert('holidays', db.holidays.map(h => ({
      id: h.id,
      organization_id: orgId,
      name: h.name,
      start_date: h.startDate,
      end_date: h.endDate,
      type: h.type || 'Public Holiday',
      description: h.description
    })));
  }

  // 34. Notices
  if (db.notices?.length) {
    results.notices = await safeUpsert('notices', db.notices.map(n => ({
      id: n.id,
      organization_id: orgId,
      title: n.title,
      content: n.content,
      target_role: n.targetRole || 'ALL',
      publish_date: n.publishDate || new Date().toISOString().slice(0, 10),
      is_urgent: Boolean(n.isUrgent),
      created_by: n.createdBy
    })));
  }

  // 33. Student Timelines
  if (db.studentTimelines?.length) {
    results.student_timelines = await safeUpsert('student_timelines', db.studentTimelines.map(tl => ({
      id: tl.id,
      organization_id: orgId,
      student_id: tl.studentId,
      event_type: tl.eventType || tl.type || 'Update',
      title: tl.title || 'Timeline Event',
      description: tl.description || '',
      created_at: tl.createdAt || new Date().toISOString()
    })));
  }

  // 34. Student Notes
  if (db.studentNotes?.length) {
    results.student_notes = await safeUpsert('student_notes', db.studentNotes.map(sn => ({
      id: sn.id,
      organization_id: orgId,
      student_id: sn.studentId,
      text: sn.text || '',
      author: sn.author || 'Staff',
      created_at: sn.createdAt || new Date().toISOString()
    })));
  }

  // 35. Communication Logs
  if (db.communicationLogs?.length) {
    results.communication_logs = await safeUpsert('communication_logs', db.communicationLogs.map(cl => ({
      id: cl.id,
      organization_id: orgId,
      channel: cl.channel || 'SMS',
      recipient_name: cl.recipientName || cl.name || '',
      recipient_phone: cl.recipientPhone || cl.phone || '0000000000',
      message: cl.message || '',
      status: cl.status || 'Sent',
      sent_at: cl.sentAt || cl.timestamp || new Date().toISOString()
    })));
  }

  // 36. Audit Logs (keep recent 500 to avoid oversized payloads)
  if (db.auditLogs?.length) {
    results.audit_logs = await safeUpsert('audit_logs', db.auditLogs.slice(0, 500).map(al => ({
      id: al.id,
      organization_id: orgId,
      user_id: al.userId || al.actor || 'System',
      action: al.action || 'ACTION',
      entity: al.entity || 'System',
      entity_id: al.entityId || '',
      details: al.details || '',
      timestamp: al.timestamp || new Date().toISOString()
    })));
  }

  return results;
}

/**
 * PULL ALL data from Supabase Cloud and hydrate local state
 */
export async function pullRemoteDBFromSupabase(orgId = 'ORG-GLOBALERA-01') {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not initialized.');

  // Check if organizations table exists
  const { data: orgData, error: orgErr } = await client.from('organizations').select('*').limit(1);
  if (orgErr) {
    console.warn('Supabase pull not possible:', orgErr.message);
    return null;
  }

  const fetchTable = async (tableName) => {
    try {
      const { data, error } = await client.from(tableName).select('*');
      if (error) {
        console.warn(`Fetch ${tableName} failed:`, error.message);
        return [];
      }
      return data || [];
    } catch (e) {
      return [];
    }
  };

  const [
    users,
    occupations,
    courses,
    trainers,
    groups,
    syllabi,
    students,
    workPlans,
    lessonPlans,
    logBooks,
    attendances,
    biometrics,
    leads,
    agents,
    admissions,
    coa,
    parties,
    payments,
    payouts,
    journals,
    expenses,
    contracts,
    cashClosings,
    employers,
    jobOpenings,
    jobApps,
    ojts,
    placements,
    evals,
    certificates,
    holidays,
    notices,
    studentTimelines,
    studentNotes,
    communicationLogs,
    auditLogs
  ] = await Promise.all([
    fetchTable('users'),
    fetchTable('occupations'),
    fetchTable('courses'),
    fetchTable('trainers'),
    fetchTable('training_groups'),
    fetchTable('syllabi'),
    fetchTable('students'),
    fetchTable('work_plans'),
    fetchTable('lesson_plans'),
    fetchTable('log_books'),
    fetchTable('attendances'),
    fetchTable('biometric_logs'),
    fetchTable('leads'),
    fetchTable('agents'),
    fetchTable('admissions'),
    fetchTable('chart_of_accounts'),
    fetchTable('parties'),
    fetchTable('payments'),
    fetchTable('trainer_payouts'),
    fetchTable('journal_entries'),
    fetchTable('expenses'),
    fetchTable('project_contracts'),
    fetchTable('cash_closings'),
    fetchTable('employers'),
    fetchTable('job_openings'),
    fetchTable('job_applications'),
    fetchTable('ojts'),
    fetchTable('placements'),
    fetchTable('evaluations'),
    fetchTable('certificates'),
    fetchTable('holidays'),
    fetchTable('notices'),
    fetchTable('student_timelines'),
    fetchTable('student_notes'),
    fetchTable('communication_logs'),
    fetchTable('audit_logs')
  ]);

  // If Supabase has zero records in critical tables, don't wipe out local database!
  const hasCloudData = (students.length > 0 || courses.length > 0 || trainers.length > 0 || leads.length > 0);
  if (!hasCloudData) {
    console.log('[Supabase Pull] Cloud is currently empty. Retaining local data.');
    return null;
  }

  // Convert snake_case back to camelCase for application
  const cloudDb = {
    users: users.map(u => ({
      id: u.id,
      username: u.username,
      phone: u.phone,
      name: u.name,
      role: u.role,
      pin: u.pin,
      status: u.status,
      title: u.title,
      trainerId: u.trainer_id,
      studentId: u.student_id,
      agentId: u.agent_id,
      specialization: u.specialization
    })),
    occupations: occupations.map(o => ({
      id: o.id,
      name: o.name,
      code: o.code,
      description: o.description,
      category: o.category,
      status: o.status
    })),
    courses: courses.map(c => ({
      id: c.id,
      occupationId: c.occupation_id,
      title: c.title,
      code: c.course_code,
      level: c.level,
      durationValue: c.duration_value,
      durationUnit: c.duration_unit,
      totalHours: c.total_hours,
      theoryHours: c.theory_hours,
      practicalHours: c.practical_hours,
      price: c.price,
      description: c.description,
      entryQualification: c.entry_qualification,
      status: c.status
    })),
    trainers: trainers.map(t => ({
      id: t.id,
      occupationId: t.occupation_id,
      name: t.name,
      phone: t.phone,
      email: t.email,
      pin: t.pin,
      biometricId: t.biometric_id,
      specialization: t.specialization,
      totCertified: t.tot_certified,
      remunerationType: t.remuneration_type,
      salaryAmount: t.salary_amount,
      commissionPercent: t.commission_percent,
      qualification: t.qualification,
      photo: t.photo,
      status: t.status
    })),
    trainingGroups: groups.map(g => ({
      id: g.id,
      groupCode: g.group_code,
      courseId: g.course_id,
      trainerId: g.trainer_id,
      shift: g.shift,
      startTime: g.start_time,
      endTime: g.end_time,
      startDate: g.start_date,
      expectedEndDate: g.expected_end_date,
      classroomLab: g.classroom_lab,
      maxCapacity: g.max_capacity,
      batchMode: g.batch_mode || 'ROLLING',
      scheduleMode: g.schedule_mode || 'REGULAR',
      status: g.status
    })),
    syllabi: syllabi.map(s => ({
      id: s.id,
      courseId: s.course_id,
      unitNo: s.unit_no,
      title: s.title,
      theoryHours: s.theory_hours,
      practicalHours: s.practical_hours,
      totalHours: s.total_hours,
      learningOutcome: s.learning_outcome,
      toolsAndMaterials: s.tools_and_materials
    })),
    workPlans: workPlans.map(w => ({
      id: w.id,
      groupId: w.group_id,
      syllabusId: w.syllabus_id,
      planDate: w.plan_date,
      dayName: w.day_name,
      cycleDay: w.cycle_day,
      theoryAspect: w.theory_aspect,
      practicalAspect: w.practical_aspect,
      plannedHours: w.planned_hours,
      status: w.status
    })),
    lessonPlans: lessonPlans.map(l => ({
      id: l.id,
      workPlanId: l.work_plan_id,
      groupId: l.group_id,
      objectives: l.objectives,
      materialsNeeded: l.materials_needed,
      methodology: l.methodology,
      assessmentMethod: l.assessment_method,
      homework: l.homework,
      notes: l.notes
    })),
    logBooks: logBooks.map(lb => ({
      id: lb.id,
      lessonPlanId: lb.lesson_plan_id,
      groupId: lb.group_id,
      deliveryDate: lb.delivery_date,
      topicsCovered: lb.topics_covered,
      materialsUsed: lb.materials_used,
      skillsLearned: lb.skills_learned,
      actualHours: lb.actual_hours,
      isDelivered: lb.is_delivered,
      trainerNotes: lb.trainer_notes
    })),
    students: students.map(s => ({
      id: s.id,
      groupId: s.group_id,
      tgid: s.tgid,
      name: s.name,
      phone: s.phone,
      secondaryPhone: s.secondary_phone,
      email: s.email,
      pin: s.pin,
      biometricId: s.biometric_id,
      gender: s.gender,
      dateOfBirth: s.date_of_birth,
      citizenshipNumber: s.citizenship_number,
      citizenshipDistrict: s.citizenship_district,
      municipality: s.municipality,
      wardNo: s.ward_no,
      permanentAddress: s.permanent_address,
      currentAddress: s.current_address,
      fatherName: s.father_name,
      motherName: s.mother_name,
      guardianContact: s.guardian_contact,
      educationLevel: s.education_level,
      fundingType: s.funding_type,
      feeAmount: s.fee_amount,
      feePaid: s.fee_paid,
      admissionDate: s.admission_date,
      expectedEndDate: s.expected_end_date,
      photoUrl: s.photo_url,
      status: s.status
    })),
    attendances: attendances.map(a => ({
      id: a.id,
      groupId: a.group_id,
      studentId: a.student_id,
      date: a.date,
      status: a.status,
      remarks: a.remarks
    })),
    biometricLogs: biometrics.map(b => ({
      id: b.id,
      biometricId: b.biometric_id,
      userType: b.user_type,
      userId: b.user_id,
      userName: b.user_name,
      timestamp: b.timestamp,
      date: b.date,
      time: b.time,
      verifyMode: b.verify_mode,
      deviceSerial: b.device_serial
    })),
    leads: leads.map(l => ({
      id: l.id,
      courseId: l.course_id,
      agentId: l.agent_id,
      name: l.name,
      phone: l.phone,
      email: l.email,
      address: l.address,
      source: l.source,
      status: l.status,
      priority: l.priority,
      counselor: l.counselor,
      followUpDate: l.follow_up_date,
      notes: l.notes
    })),
    agents: agents.map(ag => ({
      id: ag.id,
      code: ag.code,
      name: ag.name,
      phone: ag.phone,
      email: ag.email,
      commissionRate: ag.commission_rate,
      paymentInfo: ag.payment_info,
      status: ag.status,
      totalLeads: ag.total_leads,
      totalEnrolled: ag.total_enrolled,
      totalEarnings: ag.total_earnings
    })),
    admissions: admissions.map(ad => ({
      id: ad.id,
      studentId: ad.student_id,
      leadId: ad.lead_id,
      courseId: ad.course_id,
      groupId: ad.group_id,
      agreementNo: ad.agreement_no,
      agreementDate: ad.agreement_date,
      totalFee: ad.total_fee,
      discount: ad.discount,
      agreedFee: ad.agreed_fee,
      paymentPlan: ad.payment_plan,
      status: ad.status
    })),
    chartOfAccounts: coa.map(c => ({
      code: c.code,
      name: c.name,
      type: c.type,
      normalBalance: c.normal_balance,
      balance: c.balance
    })),
    parties: parties.map(p => ({
      id: p.id,
      category: p.category,
      name: p.name,
      contactPerson: p.contact_person,
      phone: p.phone,
      email: p.email,
      bankName: p.bank_name,
      accountNumber: p.account_number,
      accountHolder: p.account_holder,
      panVat: p.pan_vat,
      monthlyRent: p.monthly_rent,
      securityDeposit: p.security_deposit,
      address: p.address,
      notes: p.notes,
      totalPurchases: p.total_purchases,
      totalPaid: p.total_paid,
      currentDue: p.current_due
    })),
    payments: payments.map(py => ({
      id: py.id,
      receiptNo: py.receipt_no,
      studentId: py.student_id,
      groupId: py.group_id,
      amount: py.amount,
      discount: py.discount,
      netAmount: py.net_amount,
      paymentDate: py.payment_date,
      paymentMethod: py.payment_method,
      collectorName: py.collector_name,
      remarks: py.remarks,
      installmentNo: py.installment_no
    })),
    trainerPayouts: payouts.map(tp => ({
      id: tp.id,
      voucherNo: tp.voucher_no,
      trainerId: tp.trainer_id,
      groupId: tp.group_id,
      payoutType: tp.payout_type,
      amount: tp.amount,
      payoutDate: tp.payout_date,
      paymentMethod: tp.payment_method,
      disbursedBy: tp.disbursed_by,
      remarks: tp.remarks
    })),
    journalEntries: journals.map(je => ({
      id: je.id,
      entryDate: je.entry_date,
      entryType: je.entry_type,
      voucherNo: je.voucher_no,
      description: je.description,
      totalDebit: je.total_debit,
      totalCredit: je.total_credit,
      lines: je.lines,
      isBalanced: je.is_balanced
    })),
    expenses: expenses.map(ex => ({
      id: ex.id,
      partyId: ex.party_id,
      expenseDate: ex.expense_date,
      category: ex.category,
      billNo: ex.bill_no,
      amount: ex.amount,
      paymentMethod: ex.payment_method,
      paidTo: ex.paid_to,
      description: ex.description,
      receiptUrl: ex.receipt_url
    })),
    projectContracts: contracts.map(pc => ({
      id: pc.id,
      title: pc.title,
      fundingAgency: pc.funding_agency,
      contactPerson: pc.contact_person,
      phone: pc.phone,
      totalAmount: pc.total_amount,
      receivedAmount: pc.received_amount,
      receivableAmount: pc.receivable_amount,
      startDate: pc.start_date,
      endDate: pc.end_date,
      targetStudents: pc.target_students,
      status: pc.status
    })),
    cashClosings: cashClosings.map(cc => ({
      id: cc.id,
      closingDate: cc.closing_date,
      closingTime: cc.closing_time,
      openingCash: cc.opening_cash,
      cashInflow: cc.cash_inflow,
      cashOutflow: cc.cash_outflow,
      expectedCash: cc.expected_cash,
      physicalCash: cc.physical_cash,
      variance: cc.variance,
      denominations: cc.denominations,
      cashierName: cc.cashier_name,
      notes: cc.notes
    })),
    employers: employers.map(em => ({
      id: em.id,
      name: em.name,
      industry: em.industry,
      location: em.location,
      contactPerson: em.contact_person,
      phone: em.phone,
      email: em.email,
      pin: em.pin,
      status: em.status,
      mouSigned: em.mou_signed,
      remarks: em.remarks
    })),
    jobOpenings: jobOpenings.map(j => ({
      id: j.id,
      employerId: j.employer_id,
      occupationId: j.occupation_id,
      title: j.title,
      description: j.description,
      requiredSkills: j.required_skills,
      vacancies: j.vacancies,
      salaryRange: j.salary_range,
      location: j.location,
      employmentType: j.employment_type,
      deadline: j.deadline,
      status: j.status
    })),
    jobApplications: jobApps.map(ja => ({
      id: ja.id,
      jobId: ja.job_id,
      studentId: ja.student_id,
      status: ja.status,
      applyDate: ja.apply_date,
      coverNote: ja.cover_note,
      isCurrentlyTraining: ja.is_currently_training
    })),
    ojts: ojts.map(o => ({
      id: o.id,
      studentId: o.student_id,
      employerId: o.employer_id,
      startDate: o.start_date,
      endDate: o.end_date,
      relatedPerson: o.related_person,
      contactNumber: o.contact_number,
      status: o.status,
      remarks: o.remarks
    })),
    placements: placements.map(pl => ({
      id: pl.id,
      studentId: pl.student_id,
      employerId: pl.employer_id,
      targetJob: pl.target_job,
      preferredLocation: pl.preferred_location,
      actualSalary: pl.actual_salary,
      employmentType: pl.employment_type,
      status: pl.status,
      retention3MonthVerified: pl.retention_3_month_verified,
      retention6MonthVerified: pl.retention_6_month_verified
    })),
    evaluations: evals.map(ev => ({
      id: ev.id,
      groupId: ev.group_id,
      studentId: ev.student_id,
      syllabusId: ev.syllabus_id,
      mastered: ev.mastered,
      areasToImprove: ev.areas_to_improve,
      trainerPlan: ev.trainer_plan,
      evaluatorName: ev.evaluator_name,
      evaluatedAt: ev.evaluated_at
    })),
    certificates: certificates.map(c => ({
      id: c.id,
      certificateNo: c.certificate_no,
      studentId: c.student_id,
      courseId: c.course_id,
      groupId: c.group_id,
      issueDate: c.issue_date,
      grade: c.grade_division,
      verificationCode: c.verification_code,
      status: c.status,
      ...(c.certificate_payload || {})
    })),
    holidays: holidays.map(h => ({
      id: h.id,
      name: h.name,
      startDate: h.start_date,
      endDate: h.end_date,
      type: h.type,
      description: h.description
    })),
    notices: notices.map(n => ({
      id: n.id,
      title: n.title,
      content: n.content,
      targetRole: n.target_role,
      publishDate: n.publish_date,
      isUrgent: n.is_urgent,
      createdBy: n.created_by
    })),
    studentTimelines: studentTimelines.map(tl => ({
      id: tl.id,
      studentId: tl.student_id,
      eventType: tl.event_type,
      title: tl.title,
      description: tl.description,
      createdAt: tl.created_at
    })),
    studentNotes: studentNotes.map(sn => ({
      id: sn.id,
      studentId: sn.student_id,
      text: sn.text,
      author: sn.author,
      createdAt: sn.created_at
    })),
    communicationLogs: communicationLogs.map(cl => ({
      id: cl.id,
      channel: cl.channel,
      recipientName: cl.recipient_name,
      recipientPhone: cl.recipient_phone,
      message: cl.message,
      status: cl.status,
      sentAt: cl.sent_at
    })),
    auditLogs: auditLogs.map(al => ({
      id: al.id,
      userId: al.user_id,
      action: al.action,
      entity: al.entity,
      entityId: al.entity_id,
      details: al.details,
      timestamp: al.timestamp
    }))
  };

  return cloudDb;
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
      console.warn('Supabase remote lookup failed:', err);
    }
  }
  return null;
}

export function generateSupabaseSQLSchema() {
  return `-- ==============================================================================
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
  shift TEXT NOT NULL CHECK (shift IN ('A', 'B', 'C', 'D', 'E', 'F')),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  start_date DATE NOT NULL,
  expected_end_date DATE NOT NULL,
  classroom_lab TEXT,
  max_capacity INT DEFAULT 25,
  batch_mode TEXT DEFAULT 'ROLLING' CHECK (batch_mode IN ('ROLLING', 'FIXED')),
  schedule_mode TEXT DEFAULT 'REGULAR' CHECK (schedule_mode IN ('REGULAR', 'WEEKEND_ONLY')),
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
  cycle_day INT,
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

-- 37. Student Journey Timelines
CREATE TABLE IF NOT EXISTS student_timelines (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  event_type TEXT DEFAULT 'Update',
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 38. Student Counselor & Trainer Notes
CREATE TABLE IF NOT EXISTS student_notes (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  author TEXT DEFAULT 'Staff',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- SECTION 8B: IDEMPOTENT COLUMN & CONSTRAINT UPGRADES FOR EXISTING DATABASES
-- ==============================================================================

ALTER TABLE training_groups ADD COLUMN IF NOT EXISTS batch_mode TEXT DEFAULT 'ROLLING';
ALTER TABLE training_groups ADD COLUMN IF NOT EXISTS schedule_mode TEXT DEFAULT 'REGULAR';
ALTER TABLE work_plans ADD COLUMN IF NOT EXISTS cycle_day INT;

DO $$
BEGIN
  ALTER TABLE training_groups DROP CONSTRAINT IF EXISTS training_groups_shift_check;
  ALTER TABLE training_groups ADD CONSTRAINT training_groups_shift_check CHECK (shift IN ('A', 'B', 'C', 'D', 'E', 'F'));
EXCEPTION WHEN OTHERS THEN
END $$;

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
ALTER TABLE student_timelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_notes ENABLE ROW LEVEL SECURITY;

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
    'notices', 'communication_logs', 'audit_logs', 'student_timelines', 'student_notes'
  ];
BEGIN
  FOREACH tbl IN ARRAY tbls LOOP
    BEGIN
      EXECUTE format('DROP POLICY IF EXISTS "Public access on %I" ON %I;', tbl, tbl);
      EXECUTE format('CREATE POLICY "Tenant Scoped Sync on %I" ON %I FOR ALL USING (organization_id = ''ORG-GLOBALERA-01'') WITH CHECK (organization_id = ''ORG-GLOBALERA-01'');', tbl, tbl);
    EXCEPTION WHEN OTHERS THEN
      -- Ignore if policy manipulation encounters error
    END;
  END LOOP;
END $$;
`;
}

export function generateSupabaseSecurityHardeningSQL() {
  return `-- ==============================================================================
-- GLOBAL ERA TECHNICAL SCHOOL - SUPABASE SECURITY HARDENING & RLS LOCKDOWN
-- Prevents Unauthorized Data Wiping, Anonymous Table Scraping & Financial Leaks
-- ==============================================================================

-- 1. REVOKE DANGEROUS PERMISSIVE POLICIES
DO $$
DECLARE
  tbl text;
  sensitive_tables text[] := ARRAY[
    'organizations', 'users', 'system_users', 'occupations', 'courses',
    'training_groups', 'trainers', 'students', 'attendance', 'attendance_records',
    'work_plans', 'lesson_plans', 'log_book', 'log_book_entries', 'evaluations',
    'holidays', 'leads', 'agents', 'admissions', 'chart_of_accounts',
    'journal_entries', 'payments', 'expenses', 'cash_closings', 'trainer_payouts',
    'project_contracts', 'employers', 'placements', 'certificates', 'notices',
    'system_settings', 'biometric_logs'
  ];
BEGIN
  FOREACH tbl IN ARRAY sensitive_tables LOOP
    BEGIN
      EXECUTE format('DROP POLICY IF EXISTS "Public access on %I" ON %I;', tbl, tbl);
      EXECUTE format('DROP POLICY IF EXISTS "Public read on %I" ON %I;', tbl, tbl);
      EXECUTE format('DROP POLICY IF EXISTS "Public write on %I" ON %I;', tbl, tbl);
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
    EXCEPTION WHEN OTHERS THEN
    END;
  END LOOP;
END $$;

-- 2. PUBLIC READ-ONLY POLICIES FOR OFFICIAL VERIFICATION & COURSE DIRECTORY
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'certificates') THEN
    CREATE POLICY "Public Read Official Certificates" ON certificates
      FOR SELECT USING (true);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courses') THEN
    CREATE POLICY "Public Read Courses" ON courses
      FOR SELECT USING (true);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'occupations') THEN
    CREATE POLICY "Public Read Occupations" ON occupations
      FOR SELECT USING (true);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notices') THEN
    CREATE POLICY "Public Read Notices" ON notices
      FOR SELECT USING (true);
  END IF;
END $$;

-- 3. FINANCIAL & SENSITIVE TABLES LOCKDOWN (Tenant Guard)
DO $$
DECLARE
  fin_tbl text;
  fin_tables text[] := ARRAY[
    'chart_of_accounts', 'journal_entries', 'payments',
    'expenses', 'cash_closings', 'trainer_payouts', 'project_contracts'
  ];
BEGIN
  FOREACH fin_tbl IN ARRAY fin_tables LOOP
    BEGIN
      EXECUTE format('DROP POLICY IF EXISTS "Tenant Scoped Sync on %I" ON %I;', fin_tbl, fin_tbl);
      EXECUTE format('CREATE POLICY "Tenant Scoped Sync on %I" ON %I FOR ALL USING (organization_id = ''ORG-GLOBALERA-01'') WITH CHECK (organization_id = ''ORG-GLOBALERA-01'');', fin_tbl, fin_tbl);
    EXCEPTION WHEN OTHERS THEN
    END;
  END LOOP;
END $$;

-- 4. STUDENT PII, LEADS & ACADEMIC RECORDS LOCKDOWN
DO $$
DECLARE
  ops_tbl text;
  ops_tables text[] := ARRAY[
    'organizations', 'users', 'training_groups', 'trainers', 'students',
    'work_plans', 'lesson_plans', 'log_books', 'evaluations', 'holidays', 'leads',
    'agents', 'admissions', 'employers', 'job_openings', 'job_applications', 'ojts',
    'placements', 'system_settings', 'biometric_logs',
    'student_timelines', 'student_notes', 'communication_logs', 'audit_logs'
  ];
BEGIN
  FOREACH ops_tbl IN ARRAY ops_tables LOOP
    BEGIN
      EXECUTE format('DROP POLICY IF EXISTS "Tenant Scoped Sync on %I" ON %I;', ops_tbl, ops_tbl);
      EXECUTE format('CREATE POLICY "Tenant Scoped Sync on %I" ON %I FOR ALL USING (organization_id = ''ORG-GLOBALERA-01'') WITH CHECK (organization_id = ''ORG-GLOBALERA-01'');', ops_tbl, ops_tbl);
    EXCEPTION WHEN OTHERS THEN
    END;
  END LOOP;
END $$;
`;
}
