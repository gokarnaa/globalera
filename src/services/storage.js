// Local-first TVET Database with Automatic Cascading & Realistic Seed Data
import { pushLocalDBToSupabase, pullRemoteDBFromSupabase } from './supabaseClient.js';
import { generateSimulation105Dataset } from './simulationData.js';

export const SHIFT_DEFINITIONS = [
  { code: 'A', name: 'Shift A', time: '07:00 AM – 09:00 AM', startTime: '07:00', endTime: '09:00' },
  { code: 'B', name: 'Shift B', time: '10:00 AM – 12:00 PM', startTime: '10:00', endTime: '12:00' },
  { code: 'C', name: 'Shift C', time: '12:00 PM – 02:00 PM', startTime: '12:00', endTime: '14:00' },
  { code: 'D', name: 'Shift D', time: '02:00 PM – 04:00 PM', startTime: '14:00', endTime: '16:00' },
  { code: 'E', name: 'Shift E', time: '04:00 PM – 06:00 PM', startTime: '16:00', endTime: '18:00' },
  { code: 'F', name: 'Shift F', time: '06:00 PM – 08:00 PM', startTime: '18:00', endTime: '20:00' },
];

export const COURSE_TIERS = ['Basic', 'Intermediate', 'Advance', 'Master', 'CTEVT Level 1', 'CTEVT Level 2'];

export const DURATION_PRESETS = [
  { label: '7 Days', durationValue: 7, durationUnit: 'Days' },
  { label: '15 Days', durationValue: 15, durationUnit: 'Days' },
  { label: '1 Month', durationValue: 1, durationUnit: 'Months' },
  { label: '45 Days', durationValue: 45, durationUnit: 'Days' },
  { label: '2 Months', durationValue: 2, durationUnit: 'Months' },
  { label: '3 Months', durationValue: 3, durationUnit: 'Months' },
  { label: '6 Months', durationValue: 6, durationUnit: 'Months' },
];

export function calculateStudentCourseTimeline(startDateStr, durationValue, durationUnit, holidays = [], scheduleMode = 'REGULAR') {
  if (!startDateStr) return { startDate: '', baseEndDate: '', holidayDaysAdded: 0, expectedEndDate: '' };
  const date = new Date(`${startDateStr}T00:00:00`);
  if (isNaN(date.getTime())) return { startDate: startDateStr, baseEndDate: '', holidayDaysAdded: 0, expectedEndDate: '' };

  const val = Number(durationValue) || 1;
  const unit = (durationUnit || 'months').toLowerCase();

  if (unit.startsWith('month')) {
    date.setMonth(date.getMonth() + val);
  } else if (unit.startsWith('week')) {
    date.setDate(date.getDate() + val * 7);
  } else if (unit.startsWith('day')) {
    date.setDate(date.getDate() + val);
  }

  const formatYMD = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const baseEndDate = formatYMD(date);
  let holidayDaysAdded = 0;

  if (scheduleMode !== 'WEEKEND_ONLY' && Array.isArray(holidays) && holidays.length > 0) {
    const holidaySet = new Set(
      holidays
        .map((h) => h?.date)
        .filter((dStr) => {
          if (!dStr) return false;
          const hd = new Date(`${dStr}T00:00:00`);
          return !isNaN(hd.getTime()) && hd.getDay() !== 6; // Exclude Saturdays (already part of calendar duration)
        })
    );

    holidaySet.forEach((hDate) => {
      if (hDate >= startDateStr && hDate <= baseEndDate) {
        holidayDaysAdded += 1;
      }
    });

    if (holidayDaysAdded > 0) {
      date.setDate(date.getDate() + holidayDaysAdded);
    }
  }

  return {
    startDate: startDateStr,
    baseEndDate,
    holidayDaysAdded,
    expectedEndDate: formatYMD(date)
  };
}

export function calculateExpectedEndDate(startDateStr, durationValue, durationUnit, holidays = [], scheduleMode = 'REGULAR') {
  return calculateStudentCourseTimeline(startDateStr, durationValue, durationUnit, holidays, scheduleMode).expectedEndDate;
}

export function getActiveGroupTrainees(students = [], groupId, asOfDate = new Date().toISOString().slice(0, 10)) {
  return (students || []).filter((s) => {
    if (s.groupId !== groupId) return false;
    if (s.status === 'Completed' || s.status === 'Dropout') return false;
    if (s.expectedEndDate && s.expectedEndDate < asOfDate) return false;
    return true;
  });
}

export function generateDefaultUsers(trainers = [], students = [], agents = []) {
  const adminUser = {
    id: 'USR-ADMIN',
    username: 'admin',
    phone: '9851000000',
    name: 'Super Admin',
    role: 'ADMIN',
    pin: 'admin123',
    status: 'Active',
    title: 'Institute Administrator',
    createdAt: '2026-01-01'
  };

  const staffUser = {
    id: 'USR-STAFF',
    username: 'staff',
    phone: '9841000000',
    name: 'Front Desk Officer',
    role: 'STAFF',
    pin: '2222',
    status: 'Active',
    title: 'Admissions & Inquiries',
    createdAt: '2026-01-01'
  };

  const trainerUsers = (trainers || []).map((t, idx) => ({
    id: `USR-${t.id}`,
    username: ((t.name || '').split(' ')[0] || `trainer${idx + 1}`).toLowerCase(),
    phone: t.phone || '',
    name: t.name,
    role: 'TRAINER',
    trainerId: t.id,
    pin: t.pin || '1234',
    status: t.status === 'Inactive' ? 'Suspended' : 'Active',
    specialization: t.specialization || 'Instructor',
    createdAt: '2026-01-01'
  }));

  const studentUsers = (students || []).map((s, idx) => ({
    id: `USR-${s.id}`,
    username: (s.tgid || `std${idx + 1}`).toLowerCase().replace(/[^a-z0-9]/g, ''),
    phone: s.phone || '',
    name: s.name,
    role: 'STUDENT',
    studentId: s.id,
    pin: s.pin || '1234',
    status: s.status === 'Dropout' ? 'Suspended' : 'Active',
    tgid: s.tgid,
    groupId: s.groupId,
    createdAt: s.admissionDate || '2026-01-01'
  }));

  const agentUsers = (agents || []).map((a, idx) => ({
    id: `USR-${a.id}`,
    username: (a.code || `agent${idx + 1}`).toLowerCase(),
    phone: a.phone || '',
    name: a.name,
    role: 'AGENT',
    agentId: a.id,
    agentCode: a.code,
    pin: a.pin || '1234',
    status: a.status === 'Suspended' ? 'Suspended' : 'Active',
    title: 'Referral Partner / Agent',
    createdAt: a.joinedDate || '2026-01-01'
  }));

  return [adminUser, staffUser, ...trainerUsers, ...studentUsers, ...agentUsers];
}

export const INITIAL_SEED_DATA = {
  occupations: [],
  courses: [],
  trainers: [],
  trainingGroups: [],
  syllabi: [],
  students: [],
  workPlans: [],
  lessonPlans: [],
  logBooks: [],
  attendances: [],
  biometricLogs: [],
  evaluations: [],
  employers: [],
  ojts: [],
  placements: [],
  jobOpenings: [],
  jobApplications: [],
  studentTimelines: [],
  studentNotes: [],
  certificates: [],
  holidays: [],
  notices: [],

  smsTemplates: [
    {
      id: 'TPL-01',
      title: 'Attendance Warning',
      category: 'Attendance',
      content: 'Dear {parent}, this is to inform you that your ward {name} was absent from the {course} class today ({date}). - {institute}'
    },
    {
      id: 'TPL-02',
      title: 'Training Commencement Notice',
      category: 'Class',
      content: 'Dear {name}, your {course} training starts from {date} in Shift {shift}. Please attend on time. - {institute}'
    },
    {
      id: 'TPL-03',
      title: 'Certificate Ready Notice',
      category: 'Certificate',
      content: 'Congratulations {name}! Your vocational training completion certificate for {course} (No. {certNo}) is ready for collection from the office. - {institute}'
    },
    {
      id: 'TPL-04',
      title: 'OJT Briefing Notice',
      category: 'OJT',
      content: 'Dear {name}, your On-the-Job Training (OJT) at {employer} starts from {date}. Supervisor: {supervisor} ({phone}). - {institute}'
    },
    {
      id: 'TPL-05',
      title: 'Placement Interview Notice',
      category: 'Placement',
      content: 'Dear {name}, your job interview for {jobTitle} at {employer} is scheduled on {date} at {time}. Contact: {phone}. - {institute}'
    },
    {
      id: 'TPL-06',
      title: 'Lead Welcome & Course Brochure',
      category: 'Leads',
      content: 'Hello {name}! Thank you for inquiring about {course} at {institute}. Our 390-hour CTEVT curriculum features 80% practical training. Fee structure: 50% advance on admission + 50% mid-course. Reply YES for instant counseling or visit us in Jorpati.'
    },
    {
      id: 'TPL-07',
      title: 'Admission Agreement & Enrollment Voucher',
      category: 'Admission',
      content: 'Official Admission Confirmation: Dear {name}, your enrollment in {course} (Shift {shift}) at {institute} has been confirmed. Please keep this digital receipt for verification.'
    },
    {
      id: 'TPL-08',
      title: 'Fee Installment Due Notice',
      category: 'Accounts',
      content: 'Dear {name}, this is a gentle reminder that your mid-course 50% tuition installment for {course} is due. Please visit the account counter or contact {phone}. - {institute}'
    },
    {
      id: 'TPL-09',
      title: 'Trainer Batch Routine & Schedule',
      category: 'Trainers',
      content: 'Dear Trainer {name}, your {course} practical training batch is scheduled from {date} in Shift {shift} at {institute}. Trainee roster and workshop tools are ready in Lab.'
    }
  ],

  communicationLogs: [],
  snapshots: [],
  auditLogs: [],
  leads: [],
  agents: [],
  admissions: [],
  payments: [],
  trainerPayouts: [],

  // -------------------------------------------------------------
  // CENTRAL DOUBLE-ENTRY ACCOUNTING & FINANCIAL MANAGEMENT MODULE
  // -------------------------------------------------------------
  chartOfAccounts: [
    { code: '1010', name: 'Cash on Hand (Counter Petty Cash)', type: 'ASSET', normalBalance: 'DEBIT', balance: 0 },
    { code: '1020', name: 'Bank & Digital QR (Fonepay / eSewa)', type: 'ASSET', normalBalance: 'DEBIT', balance: 0 },
    { code: '1200', name: 'Student Accounts Receivable', type: 'ASSET', normalBalance: 'DEBIT', balance: 0 },
    { code: '1250', name: 'Municipal & Institutional Project Receivables', type: 'ASSET', normalBalance: 'DEBIT', balance: 0 },
    { code: '1500', name: 'Vocational Training Equipment & Assets', type: 'ASSET', normalBalance: 'DEBIT', balance: 0 },
    { code: '2010', name: 'Accounts Payable (Suppliers / Vendors)', type: 'LIABILITY', normalBalance: 'CREDIT', balance: 0 },
    { code: '2110', name: 'Trainer Commission Payable', type: 'LIABILITY', normalBalance: 'CREDIT', balance: 0 },
    { code: '2120', name: 'Staff Salary Payable', type: 'LIABILITY', normalBalance: 'CREDIT', balance: 0 },
    { code: '2200', name: 'Advance / Unearned Student Fees', type: 'LIABILITY', normalBalance: 'CREDIT', balance: 0 },
    { code: '2300', name: 'TDS & Tax Withholding Payable', type: 'LIABILITY', normalBalance: 'CREDIT', balance: 0 },
    { code: '3010', name: "Owner's Capital", type: 'EQUITY', normalBalance: 'CREDIT', balance: 0 },
    { code: '3020', name: 'Retained Earnings', type: 'EQUITY', normalBalance: 'CREDIT', balance: 0 },
    { code: '4100', name: 'Vocational Course Training Revenue', type: 'REVENUE', normalBalance: 'CREDIT', balance: 0 },
    { code: '4110', name: 'Student Admission Fees', type: 'REVENUE', normalBalance: 'CREDIT', balance: 0 },
    { code: '4200', name: 'Municipality & Ward Project Revenue', type: 'REVENUE', normalBalance: 'CREDIT', balance: 0 },
    { code: '4300', name: 'Certificate & Skill Testing Fees', type: 'REVENUE', normalBalance: 'CREDIT', balance: 0 },
    { code: '5100', name: 'Trainer Commission Expense', type: 'EXPENSE', normalBalance: 'DEBIT', balance: 0 },
    { code: '5110', name: 'Trainer Fixed Salary Expense', type: 'EXPENSE', normalBalance: 'DEBIT', balance: 0 },
    { code: '5200', name: 'Staff Payroll & Office Wages', type: 'EXPENSE', normalBalance: 'DEBIT', balance: 0 },
    { code: '5300', name: 'Practical Raw Materials & Supplies', type: 'EXPENSE', normalBalance: 'DEBIT', balance: 0 },
    { code: '5400', name: 'Center Rent & Electricity / Water', type: 'EXPENSE', normalBalance: 'DEBIT', balance: 0 },
    { code: '5500', name: 'Marketing, Counseling & Social Ads', type: 'EXPENSE', normalBalance: 'DEBIT', balance: 0 },
    { code: '5600', name: 'Repairs, Equipment Maintenance & IT', type: 'EXPENSE', normalBalance: 'DEBIT', balance: 0 }
  ],

  journalEntries: [],
  expenses: [],
  projectContracts: [],
  cashClosings: [],

  settings: {
    instituteName: 'GLOBAL ERA MULTI SERVICE PVT. LTD. / GLOBAL ERA TECHNICAL SCHOOL',
    instituteSub: 'Global Era Technical School',
    location: 'Jorpati, Gokarneshwor-05, Kathmandu, Nepal',
    contactPhone: '+977-1-4915678 / 9851234567',
    email: 'info@globalera.edu.np',
    aakashSmsToken: '',
    enableAutoSmsOnAbsent: true,
    enableWhatsAppDirect: true,
    supabaseUrl: (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) || 'https://yycybsmwuixixfmocrcz.supabase.co',
    supabaseAnonKey: (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || 'sb_publishable_e8g5bAQNbCGpuI3aC0P1SA_Lb02m1cO',
    companyProfile: {
      companyNameEnglish: 'GLOBAL ERA MULTI SERVICE PVT. LTD. / GLOBAL ERA TECHNICAL SCHOOL',
      companyNameNepali: 'Global Era Technical School',
      address: 'Jorpati, Gokarneshwor, Kathmandu, Nepal',
      contactPhone: '01410715',
      email: 'globaleramultiservice@gmail.com',
      website: 'https://globalera.edu.np',
      officeHours: '7:00 AM – 6:00 PM',
      companyRegNo: '184920/078/079',
      ctevtCode: '4208',
      panNo: '609823412',
      directorName: 'Gokarna Thapa',
      directorTitle: 'Managing Director / Campus Chief',
      logoUrl: '',
      stampUrl: ''
    },
    certificateNumberFormat: {
      formatStyle: 'year_seq',
      prefix: 'GEMS',
      yearMode: 'AD',
      seqDigits: 3,
      startSeq: 1
    },
    biometricSettings: {
      enabled: true,
      deviceName: 'Global Era ZKTeco K40 WiFi',
      deviceIp: '192.168.1.201',
      devicePort: 4370,
      serialNo: 'ZK-GE-2026-8891',
      deviceType: 'ZKTeco K40 WiFi / ADMS Push',
      cloudPushUrl: 'https://globalera.edu.np/iclock/cdata',
      status: 'Online',
      lastSyncTime: 'Standby',
      morningShiftStart: '07:00',
      dayShiftStart: '11:00',
      eveningShiftStart: '15:00',
      lateGraceMinutes: 15,
      allowTrainerManualOverride: true,
      autoSmsOnAbsent: true
    }
  },
  parties: [],
  users: []
};

// Auto-seed default system users only (Admin & Staff)
INITIAL_SEED_DATA.users = generateDefaultUsers(
  INITIAL_SEED_DATA.trainers,
  INITIAL_SEED_DATA.students,
  INITIAL_SEED_DATA.agents
);

const DB_KEY = 'kite_tvet_erp_prod_v2';

/**
 * Helper to generate safe collision-free sequential IDs (e.g. STD-09, TRN-05, TGID-108)
 */
export function getNextSequentialId(list = [], prefix = 'STD-', padDigits = 2, startNum = 1, field = 'id') {
  const nums = (list || [])
    .map((item) => {
      const val = String(item?.[field] || '');
      const match = val.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    })
    .filter((n) => !isNaN(n) && n > 0);
  const nextNum = nums.length > 0 ? Math.max(...nums) + 1 : startNum;
  return `${prefix}${String(nextNum).padStart(padDigits, '0')}`;
}

/**
 * Helper to generate collision-free Biometric Machine IDs (1001+ for students, 2001+ for trainers)
 */
export function getNextBiometricId(list = [], baseNum = 1001) {
  const nums = (list || [])
    .map((item) => parseInt(String(item?.biometricId || '').replace(/\D/g, ''), 10))
    .filter((n) => !isNaN(n) && n >= baseNum && n < baseNum + 900);
  return String(nums.length > 0 ? Math.max(...nums) + 1 : baseNum + (list || []).length);
}

/**
 * Reconcile & Two-Way Sync db.users with db.students, db.trainers, and db.agents
 */
export function reconcileUsersWithEntities(data) {
  const students = (data.students || []).map((s, idx) => ({
    ...s,
    tgid: s.tgid || `TGID-${101 + idx}`,
    biometricId: s.biometricId || String(1001 + idx),
    pin: s.pin || '1234'
  }));

  const trainers = (data.trainers || []).map((t, idx) => ({
    ...t,
    biometricId: t.biometricId || String(2001 + idx),
    pin: t.pin || '1234'
  }));

  // Heal legacy duplicate phone between AGT-01 and TRN-01
  const agents = (data.agents || []).map((a) => {
    if (a.id === 'AGT-01' && a.phone === '9841234567') {
      return { ...a, phone: '9841778899', paymentInfo: 'eSewa: 9841778899' };
    }
    return a;
  });

  const existingUsers = Array.isArray(data.users) && data.users.length > 0
    ? data.users
    : generateDefaultUsers(trainers, students);

  const studentIds = new Set(students.map((s) => s.id));
  const trainerIds = new Set(trainers.map((t) => t.id));
  const agentIds = new Set(agents.map((a) => a.id));

  // Keep Admin, Staff, and custom non-orphaned users
  const baseUsers = existingUsers.filter((u) => {
    if (u.role === 'STUDENT' && u.studentId && !studentIds.has(u.studentId)) return false;
    if (u.role === 'TRAINER' && u.trainerId && !trainerIds.has(u.trainerId)) return false;
    if (u.role === 'AGENT' && u.agentId && !agentIds.has(u.agentId)) return false;
    return true;
  });

  const userMap = new Map();
  baseUsers.forEach((u) => userMap.set(u.id, { ...u }));

  // Sync Trainers -> Users
  trainers.forEach((t, idx) => {
    const existing = Array.from(userMap.values()).find(
      (u) => u.trainerId === t.id || u.id === `USR-${t.id}`
    );
    const uid = existing?.id || `USR-${t.id}`;
    userMap.set(uid, {
      ...(existing || {}),
      id: uid,
      username: existing?.username || (t.name.split(' ')[0] || `trainer${idx + 1}`).toLowerCase().replace(/[^a-z0-9]/g, ''),
      phone: t.phone || existing?.phone || '',
      name: t.name,
      role: 'TRAINER',
      trainerId: t.id,
      biometricId: t.biometricId,
      pin: t.pin || existing?.pin || '1234',
      status: t.status === 'Inactive' || t.status === 'Suspended' ? 'Suspended' : (existing?.status || 'Active'),
      specialization: t.specialization || existing?.specialization || 'Instructor',
      createdAt: existing?.createdAt || '2026-01-01'
    });
  });

  // Sync Students -> Users
  students.forEach((s, idx) => {
    const existing = Array.from(userMap.values()).find(
      (u) => u.studentId === s.id || u.id === `USR-${s.id}`
    );
    const uid = existing?.id || `USR-${s.id}`;
    userMap.set(uid, {
      ...(existing || {}),
      id: uid,
      username: existing?.username || (s.tgid || `std${idx + 1}`).toLowerCase().replace(/[^a-z0-9]/g, ''),
      phone: s.phone || existing?.phone || '',
      name: s.name,
      role: 'STUDENT',
      studentId: s.id,
      biometricId: s.biometricId,
      pin: s.pin || existing?.pin || '1234',
      status: s.status === 'Dropout' || s.status === 'Suspended' ? 'Suspended' : (existing?.status || 'Active'),
      tgid: s.tgid,
      groupId: s.groupId,
      createdAt: existing?.createdAt || s.admissionDate || '2026-01-01'
    });
  });

  // Sync Agents -> Users
  agents.forEach((a, idx) => {
    const existing = Array.from(userMap.values()).find(
      (u) => u.agentId === a.id || u.agentCode === a.code || u.id === `USR-${a.id}`
    );
    const uid = existing?.id || `USR-${a.id}`;
    userMap.set(uid, {
      ...(existing || {}),
      id: uid,
      username: (a.code || existing?.username || `agent${idx + 1}`).toLowerCase(),
      phone: a.phone === '9841234567' && a.id === 'AGT-01' ? '9841778899' : (a.phone || existing?.phone || ''),
      name: a.name,
      role: 'AGENT',
      agentId: a.id,
      agentCode: a.code,
      pin: a.pin || existing?.pin || '1234',
      status: a.status === 'Suspended' ? 'Suspended' : 'Active',
      title: 'Referral Partner / Agent',
      createdAt: existing?.createdAt || a.joinedDate || '2026-01-01'
    });
  });

  return {
    ...data,
    students,
    trainers,
    agents,
    users: Array.from(userMap.values())
  };
}

export function loadDB() {
  try {
    if (typeof localStorage === 'undefined') {
      return INITIAL_SEED_DATA;
    }
    // Purge legacy demo storage keys if present
    if (localStorage.getItem('kite_tvet_erp_data_v1')) {
      localStorage.removeItem('kite_tvet_erp_data_v1');
    }
    if (localStorage.getItem('kite_tvet_erp_prod_v1')) {
      localStorage.removeItem('kite_tvet_erp_prod_v1');
    }
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) {
      const seeded = reconcileUsersWithEntities(INITIAL_SEED_DATA);
      localStorage.setItem(DB_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw);

    const merged = {
      ...INITIAL_SEED_DATA,
      ...parsed,
      biometricLogs: Array.isArray(parsed.biometricLogs)
        ? parsed.biometricLogs
        : INITIAL_SEED_DATA.biometricLogs || [],
      students: Array.isArray(parsed.students) ? parsed.students : INITIAL_SEED_DATA.students,
      trainers: Array.isArray(parsed.trainers) ? parsed.trainers : INITIAL_SEED_DATA.trainers,
      jobOpenings: Array.isArray(parsed.jobOpenings) ? parsed.jobOpenings : INITIAL_SEED_DATA.jobOpenings || [],
      jobApplications: Array.isArray(parsed.jobApplications) ? parsed.jobApplications : INITIAL_SEED_DATA.jobApplications || [],
      holidays: Array.isArray(parsed.holidays) ? parsed.holidays : INITIAL_SEED_DATA.holidays,
      notices: Array.isArray(parsed.notices) ? parsed.notices : INITIAL_SEED_DATA.notices,
      smsTemplates: Array.isArray(parsed.smsTemplates) ? parsed.smsTemplates : INITIAL_SEED_DATA.smsTemplates,
      communicationLogs: Array.isArray(parsed.communicationLogs) ? parsed.communicationLogs : INITIAL_SEED_DATA.communicationLogs,
      snapshots: Array.isArray(parsed.snapshots) ? parsed.snapshots : INITIAL_SEED_DATA.snapshots,
      auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : INITIAL_SEED_DATA.auditLogs,
      studentNotes: Array.isArray(parsed.studentNotes) ? parsed.studentNotes : INITIAL_SEED_DATA.studentNotes || [],
      leads: Array.isArray(parsed.leads) ? parsed.leads : INITIAL_SEED_DATA.leads || [],
      agents: Array.isArray(parsed.agents) ? parsed.agents : INITIAL_SEED_DATA.agents || [],
      admissions: Array.isArray(parsed.admissions) ? parsed.admissions : INITIAL_SEED_DATA.admissions || [],
      parties: Array.isArray(parsed.parties) ? parsed.parties : INITIAL_SEED_DATA.parties || [],
      payments: Array.isArray(parsed.payments) ? parsed.payments : INITIAL_SEED_DATA.payments || [],
      trainerPayouts: Array.isArray(parsed.trainerPayouts) ? parsed.trainerPayouts : INITIAL_SEED_DATA.trainerPayouts || [],
      chartOfAccounts: Array.isArray(parsed.chartOfAccounts) ? parsed.chartOfAccounts : INITIAL_SEED_DATA.chartOfAccounts || [],
      journalEntries: Array.isArray(parsed.journalEntries) ? parsed.journalEntries : INITIAL_SEED_DATA.journalEntries || [],
      expenses: Array.isArray(parsed.expenses) ? parsed.expenses : INITIAL_SEED_DATA.expenses || [],
      projectContracts: Array.isArray(parsed.projectContracts) ? parsed.projectContracts : INITIAL_SEED_DATA.projectContracts || [],
      cashClosings: Array.isArray(parsed.cashClosings) ? parsed.cashClosings : INITIAL_SEED_DATA.cashClosings || [],
      settings: {
        ...INITIAL_SEED_DATA.settings,
        ...(parsed.settings || {}),
        biometricSettings: {
          ...INITIAL_SEED_DATA.settings.biometricSettings,
          ...(parsed.settings?.biometricSettings || {})
        },
        companyProfile: {
          ...INITIAL_SEED_DATA.settings.companyProfile,
          ...(parsed.settings?.companyProfile || {})
        },
        certificateNumberFormat: {
          ...INITIAL_SEED_DATA.settings.certificateNumberFormat,
          ...(parsed.settings?.certificateNumberFormat || {})
        },
        supabaseUrl: parsed.settings?.supabaseUrl || INITIAL_SEED_DATA.settings.supabaseUrl,
        supabaseAnonKey: parsed.settings?.supabaseAnonKey || INITIAL_SEED_DATA.settings.supabaseAnonKey
      }
    };

    return reconcileUsersWithEntities(merged);
  } catch (err) {
    console.error('Error loading database:', err);
    return INITIAL_SEED_DATA;
  }
}

let cloudSyncDebounceTimer = null;

export function triggerBackgroundCloudPush(data) {
  if (typeof window === 'undefined') return;
  if (cloudSyncDebounceTimer) clearTimeout(cloudSyncDebounceTimer);
  cloudSyncDebounceTimer = setTimeout(async () => {
    try {
      await pushLocalDBToSupabase(data);
      console.log('[Cloud Sync] Background sync to Supabase completed.');
    } catch (e) {
      // Offline or network error - fail silently to preserve offline UX
      console.debug('[Cloud Sync] Background push notice:', e.message);
    }
  }, 2500);
}

export async function syncWithCloud(forcePush = false) {
  if (typeof window === 'undefined') return { ok: false };
  try {
    const local = loadDB();

    if (forcePush) {
      const pushed = await pushLocalDBToSupabase(local);
      return { ok: true, action: 'pushed', results: pushed };
    }

    const cloudData = await pullRemoteDBFromSupabase();
    if (cloudData) {
      const merged = reconcileUsersWithEntities({
        ...local,
        ...cloudData,
        settings: {
          ...local.settings,
          ...(cloudData.settings || {})
        }
      });
      localStorage.setItem(DB_KEY, JSON.stringify(merged));
      window.dispatchEvent(new Event('kite_db_updated'));
      console.log('[Cloud Sync] Hydrated local DB from Supabase Cloud successfully.');
      return { ok: true, action: 'pulled', data: merged };
    } else {
      // Cloud has no data yet; seed cloud with local data
      const pushed = await pushLocalDBToSupabase(local);
      return { ok: true, action: 'seeded_cloud', results: pushed };
    }
  } catch (err) {
    console.debug('[Cloud Sync] Notice:', err.message);
    return { ok: false, message: err.message };
  }
}

export function saveDB(data) {
  try {
    const reconciled = reconcileUsersWithEntities(data);
    localStorage.setItem(DB_KEY, JSON.stringify(reconciled));
    window.dispatchEvent(new Event('kite_db_updated'));
    triggerBackgroundCloudPush(reconciled);
    return reconciled;
  } catch (err) {
    console.error('Error saving database:', err);
    return data;
  }
}

export function resetDB() {
  localStorage.setItem(DB_KEY, JSON.stringify(INITIAL_SEED_DATA));
  window.dispatchEvent(new Event('kite_db_updated'));
  return INITIAL_SEED_DATA;
}

export function loadSimulationDB() {
  const current = loadDB();
  const sim = generateSimulation105Dataset();
  const merged = {
    ...current,
    ...sim,
    settings: current.settings || INITIAL_SEED_DATA.settings
  };
  saveDB(merged);
  return merged;
}

// System Helpers for Holidays, Audits, Snapshots & Communication
export function isHoliday(dateStr, holidays = []) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  // Saturday is default holiday in Nepal (day 6)
  if (d.getDay() === 6) return true;

  return (holidays || []).some((h) => {
    if (!h.startDate || !h.endDate) return false;
    return dateStr >= h.startDate && dateStr <= h.endDate;
  });
}

export function getHolidayInfo(dateStr, holidays = []) {
  if (!dateStr) return { isHoliday: false, name: null, type: null };
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return { isHoliday: false, name: null, type: null };
  if (d.getDay() === 6) {
    return { isHoliday: true, name: 'Saturday Regular Holiday', type: 'Weekly Off' };
  }
  const match = (holidays || []).find((h) => {
    if (!h.startDate || !h.endDate) return false;
    return dateStr >= h.startDate && dateStr <= h.endDate;
  });
  if (match) {
    return { isHoliday: true, name: match.title, type: match.type };
  }
  return { isHoliday: false, name: null, type: null };
}

export function logAudit(db, action, entityType, entityId, description, performedBy = 'Admin') {
  const newLog = {
    id: `AUD-${Date.now()}`,
    action,
    entityType,
    entityId,
    description,
    performedBy,
    timestamp: new Date().toISOString()
  };
  const updatedLogs = [newLog, ...(db.auditLogs || [])];
  const nextDb = { ...db, auditLogs: updatedLogs };
  saveDB(nextDb);
  return nextDb;
}

export function createSnapshot(db, entityType, entityId, title, dataPayload, reason = 'Official baseline snapshot', author = 'Admin') {
  const existingVersions = (db.snapshots || []).filter(
    (s) => s.entityType === entityType && s.entityId === entityId
  );
  const version = existingVersions.length + 1;

  const newSnapshot = {
    id: `SNAP-${Date.now()}`,
    entityType,
    entityId,
    version,
    title: `${title} (v${version})`,
    dataPayload,
    reasonForRevision: reason,
    author,
    createdAt: new Date().toISOString(),
    isImmutable: true
  };

  const updatedSnapshots = [newSnapshot, ...(db.snapshots || [])];
  const nextDb = { ...db, snapshots: updatedSnapshots };
  saveDB(nextDb);
  return nextDb;
}

export function logCommunication(db, { recipientType, recipientId, recipientName, recipientPhone, channel, templateId, messageText, callStatus = 'N/A', sentBy = 'Admin' }) {
  const newComm = {
    id: `COMM-${Date.now()}`,
    recipientType,
    recipientId,
    recipientName,
    recipientPhone,
    channel,
    templateId,
    messageText,
    callStatus,
    sentBy,
    sentAt: new Date().toISOString()
  };

  const updatedComm = [newComm, ...(db.communicationLogs || [])];
  const nextDb = { ...db, communicationLogs: updatedComm };
  saveDB(nextDb);
  return nextDb;
}

// =====================================================================
// DOUBLE-ENTRY POSTING ENGINE & FINANCIAL REPORTING (INTEGRATED)
// =====================================================================

export function postDoubleEntryJournal(db, { narration, lines, sourceModule = 'MANUAL', sourceId = '', postedBy = 'Admin', entryDate = null }) {
  if (!lines || lines.length < 2) {
    throw new Error('Double-entry journal requires at least two lines (Debit and Credit).');
  }

  let totalDebit = 0;
  let totalCredit = 0;
  const processedLines = lines.map((l) => {
    const dr = Math.round((Number(l.debit) || 0) * 100) / 100;
    const cr = Math.round((Number(l.credit) || 0) * 100) / 100;
    totalDebit += dr;
    totalCredit += cr;
    return {
      accountCode: l.accountCode,
      accountName: l.accountName || '',
      debit: dr,
      credit: cr,
      lineNarration: l.lineNarration || narration
    };
  });

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new Error(`Double-entry imbalance! Total Debit (Rs. ${totalDebit}) != Total Credit (Rs. ${totalCredit})`);
  }

  const existingJournals = db.journalEntries || [];
  const entryNumber = `JV-2026-${String(existingJournals.length + 1).padStart(4, '0')}`;

  const newEntry = {
    id: `JV-${Date.now()}`,
    entryNumber,
    entryDate: entryDate || new Date().toISOString().slice(0, 10),
    narration,
    sourceModule,
    sourceId,
    status: 'POSTED',
    postedBy,
    createdAt: new Date().toISOString(),
    lines: processedLines
  };

  // Update Account running balances
  const updatedCOA = (db.chartOfAccounts || []).map((acc) => {
    let bal = Number(acc.balance) || 0;
    processedLines.forEach((l) => {
      if (l.accountCode === acc.code) {
        if (acc.normalBalance === 'DEBIT') {
          bal += l.debit - l.credit;
        } else {
          bal += l.credit - l.debit;
        }
      }
    });
    return { ...acc, balance: bal };
  });

  const nextDb = {
    ...db,
    journalEntries: [newEntry, ...existingJournals],
    chartOfAccounts: updatedCOA
  };

  saveDB(nextDb);
  return { nextDb, newEntry };
}

export function reverseDoubleEntryJournal(db, entryId, reason, reversedBy = 'Admin') {
  const existing = (db.journalEntries || []).find((j) => j.id === entryId || j.entryNumber === entryId);
  if (!existing) throw new Error(`Journal entry ${entryId} not found.`);
  if (existing.status === 'REVERSED') throw new Error(`Journal entry ${existing.entryNumber} is already reversed.`);

  const inverseLines = existing.lines.map((l) => ({
    accountCode: l.accountCode,
    accountName: l.accountName,
    debit: l.credit, // swap
    credit: l.debit, // swap
    lineNarration: `Reversal of ${existing.entryNumber}: ${reason}`
  }));

  const { nextDb } = postDoubleEntryJournal(db, {
    narration: `REVERSAL OF ${existing.entryNumber}: ${reason}`,
    lines: inverseLines,
    sourceModule: existing.sourceModule,
    sourceId: `REV-${existing.entryNumber}`,
    postedBy: reversedBy
  });

  // Mark original as reversed
  const finalJournals = nextDb.journalEntries.map((j) => (j.id === existing.id ? { ...j, status: 'REVERSED' } : j));
  const finalDb = { ...nextDb, journalEntries: finalJournals };
  saveDB(finalDb);
  return finalDb;
}

export function getTrialBalanceReport(db) {
  const coa = db.chartOfAccounts || [];
  const lines = coa.map((acc) => {
    const bal = Number(acc.balance) || 0;
    return {
      code: acc.code,
      name: acc.name,
      type: acc.type,
      normalBalance: acc.normalBalance,
      debit: acc.normalBalance === 'DEBIT' ? Math.max(0, bal) : 0,
      credit: acc.normalBalance === 'CREDIT' ? Math.max(0, bal) : 0
    };
  });

  const totalDebit = lines.reduce((sum, l) => sum + l.debit, 0);
  const totalCredit = lines.reduce((sum, l) => sum + l.credit, 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 1;

  return {
    asOfDate: new Date().toISOString().slice(0, 10),
    lines,
    totalDebit,
    totalCredit,
    isBalanced,
    difference: Math.abs(totalDebit - totalCredit)
  };
}
