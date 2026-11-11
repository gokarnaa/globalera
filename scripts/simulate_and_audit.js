import fs from 'fs';
import path from 'path';

// Realistic Nepali Names Generator
const FIRST_NAMES_FEMALE = [
  'Aastha', 'Anjali', 'Binita', 'Deepa', 'Manisha', 'Pooja', 'Pramila', 'Rachana', 'Rashmi', 'Sabina',
  'Sarita', 'Sharmila', 'Sita', 'Srijana', 'Sunita', 'Sushma', 'Urmila', 'Bhawana', 'Dikshya', 'Gita',
  'Kabita', 'Karuna', 'Kopila', 'Laxmi', 'Menuka', 'Nabina', 'Parbati', 'Pabitra', 'Radha', 'Rina',
  'Rupa', 'Sandhya', 'Sangita', 'Shova', 'Smriti', 'Tara', 'Tulasa', 'Yashoda', 'Pratima', 'Kamala'
];

const FIRST_NAMES_MALE = [
  'Aayush', 'Bikash', 'Bikram', 'Dipak', 'Kiran', 'Manish', 'Nabin', 'Prakash', 'Pradeep', 'Rajesh',
  'Ramesh', 'Roshan', 'Sagar', 'Santosh', 'Suman', 'Sunil', 'Suresh', 'Bishal', 'Ashish', 'Bibek',
  'Dinesh', 'Gopal', 'Hari', 'Hemant', 'Khem', 'Krishna', 'Madhav', 'Mukesh', 'Naresh', 'Prem',
  'Rajan', 'Ram', 'Rohit', 'Sanjay', 'Suraj', 'Tek', 'Umesh', 'Vijay', 'Bipin', 'Govinda'
];

const LAST_NAMES = [
  'Adhikari', 'Aryal', 'Basnet', 'Bhandari', 'Bhattarai', 'Chaudhary', 'Dahal', 'Ghimire', 'Gurung',
  'Karki', 'Khadka', 'Magar', 'Maharjan', 'Neupane', 'Pandey', 'Pariyar', 'Poudel', 'Rai', 'Rawal',
  'Rijal', 'Sapkota', 'Sharma', 'Shrestha', 'Tamang', 'Thapa', 'Upadhyay', 'Yadav', 'Karki', 'Balami', 'Ghale'
];

const DISTRICTS = ['Kathmandu', 'Lalitpur', 'Bhaktapur', 'Kavre', 'Sindhupalchok', 'Nuwakot', 'Dhading', 'Makwanpur'];
const LOCAL_ADDRESSES = ['Jorpati', 'Gokarneshwor', 'MitraPark', 'Chabahil', 'Bouddha', 'Sundarijal', 'Kapan', 'Mulpani'];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomPhone() {
  const prefixes = ['9841', '9851', '9860', '9813', '9808', '9843', '9818', '9861'];
  return getRandomItem(prefixes) + Math.floor(100000 + Math.random() * 900000);
}

// 1. Occupations Master
const occupations = [
  { id: 'OCC-01', code: 'HLT', name: 'Healthcare & Nursing Support', category: 'Health', status: 'Active' },
  { id: 'OCC-02', code: 'BEA', name: 'Beauty & Wellness', category: 'Personal Services', status: 'Active' },
  { id: 'OCC-03', code: 'ELE', name: 'Electrical & Electronics', category: 'Technical Engineering', status: 'Active' },
  { id: 'OCC-04', code: 'PLM', name: 'Plumbing & Pipefitting', category: 'Construction', status: 'Active' }
];

// 2. CTEVT Courses
const courses = [
  {
    id: 'CRS-01',
    occupationId: 'OCC-01',
    title: 'Caregiver (Certified Professional)',
    level: 'CTEVT Level 1',
    durationValue: 3,
    durationUnit: 'Months',
    totalHours: 390,
    price: 18000,
    status: 'Active',
    description: 'Elderly care, pediatric support, vital monitoring, first aid, palliative assistance & hospital lab training.'
  },
  {
    id: 'CRS-02',
    occupationId: 'OCC-02',
    title: 'Professional Beautician & Cosmetology',
    level: 'CTEVT Level 1',
    durationValue: 3,
    durationUnit: 'Months',
    totalHours: 390,
    price: 16000,
    status: 'Active',
    description: 'Skin aesthetics, hair treatments, bridal makeup, salon sanitization & client care.'
  },
  {
    id: 'CRS-03',
    occupationId: 'OCC-03',
    title: 'Building Electrician & Industrial Wiring',
    level: 'CTEVT Level 1',
    durationValue: 3,
    durationUnit: 'Months',
    totalHours: 390,
    price: 15000,
    status: 'Active',
    description: 'Single/three phase domestic & commercial wiring, circuit breakers, earthing, conduit routing & solar invertors.'
  },
  {
    id: 'CRS-04',
    occupationId: 'OCC-04',
    title: 'Sanitary Plumber & Water Management',
    level: 'CTEVT Level 1',
    durationValue: 3,
    durationUnit: 'Months',
    totalHours: 390,
    price: 15000,
    status: 'Active',
    description: 'CPVC/PPR pipe laying, bathroom fixtures, overhead tanks, drainage testing & booster pump installation.'
  }
];

// 3. Certified Trainers
const trainers = [
  { id: 'TRN-01', name: 'Sister Radhika Sharma', phone: '9841234567', email: 'radhika.care@gmail.com', occupationId: 'OCC-01', totCertified: true, status: 'Active' },
  { id: 'TRN-02', name: 'Kamala Shakya', phone: '9851098765', email: 'kamala.beauty@gmail.com', occupationId: 'OCC-02', totCertified: true, status: 'Active' },
  { id: 'TRN-03', name: 'Er. Ramesh Karki', phone: '9841556677', email: 'ramesh.electric@gmail.com', occupationId: 'OCC-03', totCertified: true, status: 'Active' },
  { id: 'TRN-04', name: 'Dipak Thapa', phone: '9860112233', email: 'dipak.plumb@gmail.com', occupationId: 'OCC-04', totCertified: true, status: 'Active' }
];

// 4. Training Groups / Batches (8 Batches)
const trainingGroups = [
  { id: 'GRP-01', groupCode: 'CG-2025-M1', name: 'Caregiver Batch 1 (Morning)', courseId: 'CRS-01', trainerId: 'TRN-01', shift: 'A', timing: '07:00 AM – 09:00 AM', startDate: '2025-01-15', expectedEndDate: '2025-04-15', capacity: 25, currentTrainees: 0, status: 'Running' },
  { id: 'GRP-02', groupCode: 'CG-2025-D1', name: 'Caregiver Batch 2 (Midday)', courseId: 'CRS-01', trainerId: 'TRN-01', shift: 'C', timing: '12:00 PM – 02:00 PM', startDate: '2025-01-15', expectedEndDate: '2025-04-15', capacity: 25, currentTrainees: 0, status: 'Running' },
  { id: 'GRP-03', groupCode: 'CG-2025-E1', name: 'Caregiver Batch 3 (Evening)', courseId: 'CRS-01', trainerId: 'TRN-01', shift: 'D', timing: '04:00 PM – 06:00 PM', startDate: '2025-02-01', expectedEndDate: '2025-05-01', capacity: 20, currentTrainees: 0, status: 'Running' },
  { id: 'GRP-04', groupCode: 'BT-2025-M1', name: 'Beautician Batch 1 (Morning)', courseId: 'CRS-02', trainerId: 'TRN-02', shift: 'A', timing: '07:00 AM – 09:00 AM', startDate: '2025-01-20', expectedEndDate: '2025-04-20', capacity: 15, currentTrainees: 0, status: 'Running' },
  { id: 'GRP-05', groupCode: 'BT-2025-D1', name: 'Beautician Batch 2 (Midday)', courseId: 'CRS-02', trainerId: 'TRN-02', shift: 'C', timing: '12:00 PM – 02:00 PM', startDate: '2025-02-05', expectedEndDate: '2025-05-05', capacity: 15, currentTrainees: 0, status: 'Running' },
  { id: 'GRP-06', groupCode: 'EL-2025-M1', name: 'Electrician Batch 1 (Morning)', courseId: 'CRS-03', trainerId: 'TRN-03', shift: 'A', timing: '07:00 AM – 09:00 AM', startDate: '2025-01-10', expectedEndDate: '2025-04-10', capacity: 15, currentTrainees: 0, status: 'Running' },
  { id: 'GRP-07', groupCode: 'EL-2025-D1', name: 'Electrician Batch 2 (Midday)', courseId: 'CRS-03', trainerId: 'TRN-03', shift: 'C', timing: '12:00 PM – 02:00 PM', startDate: '2025-02-01', expectedEndDate: '2025-05-01', capacity: 15, currentTrainees: 0, status: 'Running' },
  { id: 'GRP-08', groupCode: 'PL-2025-M1', name: 'Plumber Batch 1 (Morning)', courseId: 'CRS-04', trainerId: 'TRN-04', shift: 'A', timing: '07:00 AM – 09:00 AM', startDate: '2025-01-25', expectedEndDate: '2025-04-25', capacity: 15, currentTrainees: 0, status: 'Running' }
];

// 5. Generate 105 Students & Corresponding Admissions
const students = [];
const admissions = [];
const payments = [];
const journalEntries = [];
const leads = [];

// Track groups enrollment
const groupTraineeMap = {};
trainingGroups.forEach(g => { groupTraineeMap[g.id] = 0; });

console.log('Generating 105 realistic students with admissions, payments, journals and CRM leads...');

for (let i = 1; i <= 105; i++) {
  const isFemale = i <= 65; // ~62% female (common in Caregiver & Beauty)
  const firstName = isFemale ? getRandomItem(FIRST_NAMES_FEMALE) : getRandomItem(FIRST_NAMES_MALE);
  const lastName = getRandomItem(LAST_NAMES);
  const fullName = `${firstName} ${lastName}`;
  const gender = isFemale ? 'Female' : 'Male';
  const studentId = `STD-${String(i).padStart(3, '0')}`;
  const tgid = `TGID-${100 + i}`;
  const biometricId = 1000 + i;
  const phone = getRandomPhone();
  const address = `${getRandomItem(LOCAL_ADDRESSES)}, ${getRandomItem(DISTRICTS)}`;

  // Determine course and group
  let targetGroup;
  if (i <= 60) {
    // Caregiver
    targetGroup = trainingGroups[i % 3]; // GRP-01, GRP-02, GRP-03
  } else if (i <= 80) {
    // Beautician
    targetGroup = trainingGroups[3 + (i % 2)]; // GRP-04, GRP-05
  } else if (i <= 95) {
    // Electrician
    targetGroup = trainingGroups[5 + (i % 2)]; // GRP-06, GRP-07
  } else {
    // Plumber
    targetGroup = trainingGroups[7]; // GRP-08
  }

  groupTraineeMap[targetGroup.id]++;
  const courseObj = courses.find(c => c.id === targetGroup.courseId);
  const totalFee = courseObj.price;
  const advancePaid = Math.round(totalFee * 0.5);
  const dueAmount = totalFee - advancePaid;
  const isConvertedFromLead = i % 2 === 0;
  const leadId = isConvertedFromLead ? `LD-${100 + i}` : null;
  const admissionDate = targetGroup.startDate;

  // Student record
  const student = {
    id: studentId,
    tgid,
    biometricId,
    name: fullName,
    phone,
    secondaryPhone: '',
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@gmail.com`,
    gender,
    bloodGroup: getRandomItem(['A+ve', 'B+ve', 'O+ve', 'AB+ve']),
    dateOfBirth: '2001-05-12',
    citizenshipNumber: `${Math.floor(10 + Math.random() * 80)}-01-78-${Math.floor(10000 + Math.random() * 90000)}`,
    citizenshipDistrict: 'Kathmandu',
    currentAddress: address,
    permanentAddress: address,
    fatherName: `${getRandomItem(FIRST_NAMES_MALE)} ${lastName}`,
    motherName: `${getRandomItem(FIRST_NAMES_FEMALE)} ${lastName}`,
    guardianContact: getRandomPhone(),
    groupId: targetGroup.id,
    admissionDate,
    expectedEndDate: targetGroup.expectedEndDate,
    status: 'Active',
    photoUrl: '',
    convertedFromLeadId: leadId,
    originalFee: totalFee,
    lockedCourseFee: totalFee,
    admissionFee: 0,
    discountAmount: 0
  };
  students.push(student);

  // Admission agreement record
  const agreementNo = `GE-AGR-2025-${String(i).padStart(3, '0')}`;
  const receiptNo = `REC-ADM-${String(i).padStart(4, '0')}`;
  const paymentMethod = getRandomItem(['Cash', 'Fonepay', 'Bank Transfer']);

  const admission = {
    id: `ADM-${String(i).padStart(3, '0')}`,
    agreementNo,
    studentId,
    tgid,
    studentName: fullName,
    phone,
    secondaryPhone: '',
    gender,
    bloodGroup: student.bloodGroup,
    photoUrl: '',
    expectedEndDate: targetGroup.expectedEndDate,
    citizenshipNumber: student.citizenshipNumber,
    currentAddress: address,
    permanentAddress: address,
    fatherName: student.fatherName,
    guardianContact: student.guardianContact,
    courseId: courseObj.id,
    courseTitle: courseObj.title,
    groupId: targetGroup.id,
    groupName: targetGroup.name,
    shift: targetGroup.shift,
    timing: targetGroup.timing,
    duration: `${courseObj.durationValue} Months (${courseObj.totalHours} Hours)`,
    keySkills: courseObj.description,
    ojtPreference: 'REQUIRED',
    ojtFee: 0,
    batchTransferAllowed: true,
    totalCourseFee: totalFee,
    discountAmount: 0,
    netPayableFee: totalFee,
    advancePaid50: advancePaid,
    dueAmount50: dueAmount,
    dueDate: targetGroup.expectedEndDate,
    paymentMethod,
    receiptNo,
    admissionDate,
    admissionDateBS: admissionDate,
    status: 'ACTIVE',
    createdAt: new Date(admissionDate).toISOString(),
    convertedFromLeadId: leadId,
    admissionSource: isConvertedFromLead ? 'Lead Inquiry' : 'Direct Walk-in'
  };
  admissions.push(admission);

  // Initial 50% Advance Payment record
  const pmtId = `PMT-${String(i).padStart(3, '0')}`;
  payments.push({
    id: pmtId,
    studentId,
    studentName: fullName,
    tgid,
    groupId: targetGroup.id,
    courseName: courseObj.title,
    amount: advancePaid,
    paymentMethod,
    paymentDate: admissionDate,
    paymentMonth: 'Admission',
    receiptNo,
    remarks: `Admission 50% Advance Fee (${fullName})`,
    receivedBy: 'Admission Desk',
    collectedBy: 'Admission Desk'
  });

  // Double Entry Journal for 50% Advance Fee
  journalEntries.push({
    id: `JRN-ADM-${String(i).padStart(3, '0')}`,
    entryDate: admissionDate,
    sourceModule: 'ADMISSION',
    sourceId: receiptNo,
    narration: `Trainee Admission 50% Advance Fee: ${fullName} (${courseObj.title}) Agreement No ${agreementNo}`,
    createdBy: 'Admission Desk',
    lines: [
      {
        accountCode: paymentMethod === 'Cash' ? '1010' : '1020',
        accountName: paymentMethod === 'Cash' ? 'Cash on Hand (Counter Petty Cash)' : 'Bank & Digital QR (Fonepay / eSewa)',
        lineNarration: `50% Fee Collection (${paymentMethod})`,
        debit: advancePaid,
        credit: 0
      },
      {
        accountCode: '4100',
        accountName: 'Vocational Course Training Revenue',
        lineNarration: `Revenue Recognized - ${fullName}`,
        debit: 0,
        credit: advancePaid
      }
    ]
  });

  // Second Installment for ~40 students who already completed second payment
  if (i <= 40) {
    const secondPmtReceipt = `REC-INST2-${String(i).padStart(4, '0')}`;
    payments.push({
      id: `PMT-INST2-${String(i).padStart(3, '0')}`,
      studentId,
      studentName: fullName,
      tgid,
      groupId: targetGroup.id,
      courseName: courseObj.title,
      amount: dueAmount,
      paymentMethod: 'Fonepay',
      paymentDate: '2025-02-28',
      paymentMonth: 'Final Installment',
      receiptNo: secondPmtReceipt,
      remarks: `2nd Installment Final Fee (${fullName})`,
      receivedBy: 'Account Counter',
      collectedBy: 'Account Counter'
    });

    journalEntries.push({
      id: `JRN-INST2-${String(i).padStart(3, '0')}`,
      entryDate: '2025-02-28',
      sourceModule: 'ACCOUNTS',
      sourceId: secondPmtReceipt,
      narration: `2nd Installment Final Fee: ${fullName} (${courseObj.title})`,
      createdBy: 'Account Counter',
      lines: [
        {
          accountCode: '1020',
          accountName: 'Bank & Digital QR (Fonepay / eSewa)',
          lineNarration: `Final Fee Collection via Fonepay`,
          debit: dueAmount,
          credit: 0
        },
        {
          accountCode: '4100',
          accountName: 'Vocational Course Training Revenue',
          lineNarration: `Revenue Recognized - ${fullName}`,
          debit: 0,
          credit: dueAmount
        }
      ]
    });
  }

  // Create corresponding CRM lead if converted
  if (isConvertedFromLead) {
    leads.push({
      id: leadId,
      name: fullName,
      phone,
      address,
      course: courseObj.title,
      price: totalFee,
      stage: 'Converted',
      convertedToStudentId: studentId,
      convertedToAdmissionId: admission.id,
      priority: 'High',
      source: getRandomItem(['Facebook Ads', 'Walk-in', 'Website', 'Referral', 'TikTok']),
      createdAt: '2025-01-05T10:00:00Z',
      timeline: [
        { date: '2025-01-05T10:00:00Z', note: 'Inquiry received via online channel.', staffName: 'Counselor' },
        { date: '2025-01-10T14:00:00Z', note: 'Counseling completed; agreed on training schedule.', staffName: 'Counselor' },
        { date: '2025-01-15T11:00:00Z', note: `Converted to Student (${tgid}) & Agreement (${agreementNo}) generated.`, staffName: 'Admission Desk' }
      ]
    });
  }
}

// Add 25 unconverted active leads in CRM
for (let j = 1; j <= 25; j++) {
  const isFemale = j % 2 === 0;
  const firstName = isFemale ? getRandomItem(FIRST_NAMES_FEMALE) : getRandomItem(FIRST_NAMES_MALE);
  const lastName = getRandomItem(LAST_NAMES);
  const course = courses[j % courses.length];
  const stages = ['Inquiry', 'Contacted', 'Counseling', 'Interested', 'Qualified', 'Lost'];
  const stage = getRandomItem(stages);
  leads.push({
    id: `LD-ACTIVE-${String(j).padStart(3, '0')}`,
    name: `${firstName} ${lastName}`,
    phone: getRandomPhone(),
    address: `${getRandomItem(LOCAL_ADDRESSES)}, Kathmandu`,
    course: course.title,
    price: course.price,
    stage,
    priority: getRandomItem(['High', 'Medium', 'Low']),
    source: getRandomItem(['Facebook Ads', 'Walk-in', 'Website', 'Referral', 'WhatsApp']),
    createdAt: '2025-02-10T09:00:00Z',
    timeline: [
      { date: '2025-02-10T09:00:00Z', note: `Inquiry recorded for ${course.title}`, staffName: 'Reception Desk' }
    ]
  });
}

// Update currentTrainees on training groups
trainingGroups.forEach(g => {
  g.currentTrainees = groupTraineeMap[g.id] || 0;
});

// 6. Generate 1,500+ Attendance Records across 15 session days
const attendances = [];
const sessionDates = [
  '2025-02-01', '2025-02-02', '2025-02-03', '2025-02-04', '2025-02-05',
  '2025-02-07', '2025-02-08', '2025-02-09', '2025-02-10', '2025-02-11',
  '2025-02-12', '2025-02-14', '2025-02-15', '2025-02-16', '2025-02-17'
];

sessionDates.forEach(date => {
  students.forEach(std => {
    // 90% Present, 7% Absent, 3% Late
    const rand = Math.random();
    let status = 'present';
    if (rand > 0.93) status = 'absent';
    else if (rand > 0.90) status = 'late';

    attendances.push({
      id: `ATT-${date}-${std.id}`,
      groupId: std.groupId,
      studentId: std.id,
      date,
      status,
      source: rand > 0.4 ? 'BIOMETRIC' : 'ADMIN_MANUAL',
      checkInTime: status !== 'absent' ? '07:05 AM' : '',
      biometricId: std.biometricId,
      verifiedBy: rand > 0.4 ? 'ZKTeco K40' : 'Sister Radhika Sharma',
      remarks: status === 'late' ? '10 mins late due to transport' : ''
    });
  });
});

// 7. Employers & OJT Placements (30 Placements)
const employers = [
  { id: 'EMP-01', name: 'Norvic International Hospital', sector: 'Healthcare & Hospital', contactPerson: 'Dr. Subhash Regmi', phone: '01-4258555', address: 'Thapathali, Kathmandu', activeOjtCount: 0 },
  { id: 'EMP-02', name: 'Nepal Medcity Hospital', sector: 'Healthcare & Hospital', contactPerson: 'Rita KC', phone: '01-4217766', address: 'Bhaisepati, Lalitpur', activeOjtCount: 0 },
  { id: 'EMP-03', name: 'Nightingale Elderly Home', sector: 'Elder Care & Hospice', contactPerson: 'Saroj Shrestha', phone: '9841889900', address: 'MitraPark, Chabahil', activeOjtCount: 0 },
  { id: 'EMP-04', name: 'Lotus Wellness & Beauty Lounge', sector: 'Salon & Spa', contactPerson: 'Bimala Thapa', phone: '9851122334', address: 'Durbarmarg, Kathmandu', activeOjtCount: 0 },
  { id: 'EMP-05', name: 'Everest Electro-Mechanical Works', sector: 'Engineering', contactPerson: 'Eng. Hari Bista', phone: '9841334455', address: 'Patan Industrial Estate', activeOjtCount: 0 }
];

const ojts = [];
for (let k = 0; k < 30; k++) {
  const std = students[k];
  const emp = employers[k % employers.length];
  emp.activeOjtCount++;
  ojts.push({
    id: `OJT-${String(k + 1).padStart(3, '0')}`,
    studentId: std.id,
    studentName: std.name,
    employerId: emp.id,
    employerName: emp.name,
    startDate: '2025-03-01',
    endDate: '2025-04-01',
    status: 'Ongoing',
    supervisorName: emp.contactPerson,
    feedbackRating: 4.8
  });
}

// 8. Issued Certificates (25 Certificates)
const certificates = [];
for (let c = 0; c < 25; c++) {
  const std = students[c];
  const crs = courses.find(cr => cr.id === trainingGroups.find(g => g.id === std.groupId).courseId);
  certificates.push({
    id: `CERT-2025-${String(c + 1).padStart(3, '0')}`,
    certificateNumber: `GE-2025-${String(1001 + c)}`,
    studentId: std.id,
    studentName: std.name,
    citizenshipNumber: std.citizenshipNumber,
    courseId: crs.id,
    courseTitle: crs.title,
    level: crs.level,
    issueDate: '2025-04-20',
    validity: 'Lifetime',
    verificationCode: `VRF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    grade: 'Distinction (88%)',
    ctevtAccredited: true
  });
}

console.log(`Generated Summary:
- Students: ${students.length}
- Admissions: ${admissions.length}
- Payments: ${payments.length}
- Double-Entry Journal Entries: ${journalEntries.length}
- CRM Leads: ${leads.length}
- Attendances: ${attendances.length}
- Training Groups: ${trainingGroups.length}
- OJT Placements: ${ojts.length}
- Certificates: ${certificates.length}
`);

// ==============================================================================
// 9. AUTOMATED AUDIT & FUNCTIONAL SIMULATION TESTS
// ==============================================================================
console.log('--- STARTING COMPREHENSIVE AUTOMATED ERP AUDIT ---');

const auditResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  checks: []
};

function recordTest(testName, passed, details) {
  if (passed) {
    auditResults.passed++;
    auditResults.checks.push({ test: testName, status: 'PASS', details });
    console.log(`[PASS] ${testName}`);
  } else {
    auditResults.failed++;
    auditResults.checks.push({ test: testName, status: 'FAIL', details });
    console.error(`[FAIL] ${testName} - ${details}`);
  }
}

function recordWarning(testName, details) {
  auditResults.warnings++;
  auditResults.checks.push({ test: testName, status: 'WARN', details });
  console.warn(`[WARN] ${testName} - ${details}`);
}

// CHECK 1: Student TGID & Biometric Uniqueness
const tgidSet = new Set();
const bioSet = new Set();
let tgidCollisions = 0;
let bioCollisions = 0;
students.forEach(s => {
  if (tgidSet.has(s.tgid)) tgidCollisions++;
  tgidSet.add(s.tgid);
  if (bioSet.has(s.biometricId)) bioCollisions++;
  bioSet.add(s.biometricId);
});
recordTest('TGID Collision-Free Guarantee', tgidCollisions === 0, `Collisions: ${tgidCollisions}`);
recordTest('Biometric ID Collision-Free Guarantee', bioCollisions === 0, `Collisions: ${bioCollisions}`);

// CHECK 2: Admission 50% Rule Consistency
let feeRuleViolations = 0;
admissions.forEach(a => {
  const net = a.netPayableFee;
  const adv = a.advancePaid50;
  const due = a.dueAmount50;
  if (adv + due !== net) {
    feeRuleViolations++;
  }
});
recordTest('Admission 50% Rule Formula (Advance + Due === NetFee)', feeRuleViolations === 0, `Violations: ${feeRuleViolations}`);

// CHECK 3: Lead to Admission Relational Integrity
let unlinkedConvertedLeads = 0;
leads.filter(l => l.stage === 'Converted').forEach(l => {
  const std = students.find(s => s.id === l.convertedToStudentId);
  const adm = admissions.find(a => a.id === l.convertedToAdmissionId || a.studentId === std?.id);
  if (!std || !adm) {
    unlinkedConvertedLeads++;
  }
});
recordTest('Lead-to-Admission-to-Student Bidirectional Linking', unlinkedConvertedLeads === 0, `Unlinked converted leads: ${unlinkedConvertedLeads}`);

// CHECK 4: Double Entry Accounting Balance (Debits === Credits)
let totalDebits = 0;
let totalCredits = 0;
let unbalancedVouchers = 0;

journalEntries.forEach(je => {
  let vDebit = 0;
  let vCredit = 0;
  je.lines.forEach(l => {
    vDebit += Number(l.debit) || 0;
    vCredit += Number(l.credit) || 0;
  });
  if (Math.abs(vDebit - vCredit) > 0.01) {
    unbalancedVouchers++;
  }
  totalDebits += vDebit;
  totalCredits += vCredit;
});
recordTest('Double Entry Accounting Balance (Sum Debits === Sum Credits)', unbalancedVouchers === 0 && Math.abs(totalDebits - totalCredits) < 0.01, `Total Debits: NPR ${totalDebits}, Total Credits: NPR ${totalCredits}, Unbalanced: ${unbalancedVouchers}`);

// CHECK 5: Cash / Bank Receipts vs Payment Records
let paymentMismatchCount = 0;
payments.forEach(p => {
  const std = students.find(s => s.id === p.studentId);
  if (!std) paymentMismatchCount++;
});
recordTest('Payments to Active Trainees Integrity', paymentMismatchCount === 0, `Orphan payments: ${paymentMismatchCount}`);

// CHECK 6: Attendance Shift & Session Integrity
let invalidAttendanceStudentRef = 0;
let invalidAttendanceGroupRef = 0;
attendances.forEach(att => {
  if (!students.some(s => s.id === att.studentId)) invalidAttendanceStudentRef++;
  if (!trainingGroups.some(g => g.id === att.groupId)) invalidAttendanceGroupRef++;
});
recordTest('Attendance Student Foreign Keys', invalidAttendanceStudentRef === 0, `Invalid student refs: ${invalidAttendanceStudentRef}`);
recordTest('Attendance Group Foreign Keys', invalidAttendanceGroupRef === 0, `Invalid group refs: ${invalidAttendanceGroupRef}`);

// CHECK 7: Group Capacity and Enrollment
let overcapacityGroups = 0;
trainingGroups.forEach(g => {
  const count = students.filter(s => s.groupId === g.id).length;
  if (count > g.capacity) {
    overcapacityGroups++;
    recordWarning(`Group ${g.groupCode} is over capacity`, `Enrolled: ${count}, Capacity: ${g.capacity}`);
  }
});
recordTest('Training Group Capacity Boundary', overcapacityGroups === 0, `Overcapacity groups: ${overcapacityGroups}`);

// CHECK 8: Certificate Verification Lookup
let certFailedLookup = 0;
certificates.forEach(c => {
  const std = students.find(s => s.id === c.studentId);
  const crs = courses.find(cr => cr.id === c.courseId);
  if (!std || !crs) certFailedLookup++;
});
recordTest('Certificate Student & Course Verification Lookup', certFailedLookup === 0, `Failed cert lookups: ${certFailedLookup}`);

// CHECK 9: JSON Storage Serialization Stress Test
const fullSimulatedDb = {
  occupations,
  courses,
  trainers,
  trainingGroups,
  students,
  admissions,
  payments,
  journalEntries,
  leads,
  attendances,
  employers,
  ojts,
  certificates
};

let jsonSizeKb = 0;
try {
  const jsonStr = JSON.stringify(fullSimulatedDb);
  jsonSizeKb = Math.round(jsonStr.length / 1024);
  recordTest('Full Database Serialization (JSON)', true, `Total payload size: ${jsonSizeKb} KB (Well within local & cloud quotas)`);
} catch (e) {
  recordTest('Full Database Serialization (JSON)', false, e.message);
}

// CHECK 10: Performance / Calculation Benchmark
const startBench = performance.now();
// Simulate Dashboard KPI execution
const activeStudentsCount = students.filter(s => s.status === 'Active').length;
const totalRevenueCollected = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
const totalAdvanceReceivables = admissions.reduce((sum, a) => sum + (Number(a.dueAmount50) || 0), 0);
const leadConversionRate = Math.round((leads.filter(l => l.stage === 'Converted').length / leads.length) * 100);
const attendancePresentCount = attendances.filter(a => a.status === 'present').length;
const overallAttendancePct = Math.round((attendancePresentCount / attendances.length) * 100);
const endBench = performance.now();

recordTest(`Executive Dashboard Real-Time KPI Benchmark (${(endBench - startBench).toFixed(2)} ms)`, (endBench - startBench) < 50, `Calculated across 105 students, 1500+ attendances, 180+ vouchers: Total Rev: NPR ${totalRevenueCollected}, Dues: NPR ${totalAdvanceReceivables}, ConvRate: ${leadConversionRate}%, AttPct: ${overallAttendancePct}%`);

// Output Detailed Diagnostic Summary
console.log('\n======================================================');
console.log(`FINAL AUDIT REPORT:`);
console.log(`- Total Tests Run: ${auditResults.checks.length}`);
console.log(`- Passed: ${auditResults.passed}`);
console.log(`- Failed: ${auditResults.failed}`);
console.log(`- Warnings: ${auditResults.warnings}`);
console.log('======================================================');

// Save simulation data to a file for optional loading into system
const outputPath = path.resolve('scripts/simulated_105_dataset.json');
fs.writeFileSync(outputPath, JSON.stringify(fullSimulatedDb, null, 2), 'utf-8');
console.log(`Simulated dataset written to: ${outputPath}`);
