// Dynamic In-Memory 100+ Trainee Simulation Generator
// Produces 105 students, 105 admissions, 145 payments, 145 double-entry journals, 8 batches, 1500+ attendances, 77 CRM leads, 30 OJTs, 25 certificates in ~10ms

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

function getItem(arr, idx) {
  return arr[idx % arr.length];
}

function getPhone(idx) {
  const prefixes = ['9841', '9851', '9860', '9813', '9808', '9843', '9818', '9861'];
  const pfx = prefixes[idx % prefixes.length];
  return pfx + String(100000 + (idx * 7919) % 900000);
}

export function generateSimulation105Dataset() {
  const occupations = [
    { id: 'OCC-01', code: 'HLT', name: 'Healthcare & Nursing Support', category: 'Health', status: 'Active' },
    { id: 'OCC-02', code: 'BEA', name: 'Beauty & Wellness', category: 'Personal Services', status: 'Active' },
    { id: 'OCC-03', code: 'ELE', name: 'Electrical & Electronics', category: 'Technical Engineering', status: 'Active' },
    { id: 'OCC-04', code: 'PLM', name: 'Plumbing & Pipefitting', category: 'Construction', status: 'Active' }
  ];

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

  const trainers = [
    { id: 'TRN-01', name: 'Sister Radhika Sharma', phone: '9841234567', email: 'radhika.care@gmail.com', occupationId: 'OCC-01', totCertified: true, status: 'Active' },
    { id: 'TRN-02', name: 'Kamala Shakya', phone: '9851098765', email: 'kamala.beauty@gmail.com', occupationId: 'OCC-02', totCertified: true, status: 'Active' },
    { id: 'TRN-03', name: 'Er. Ramesh Karki', phone: '9841556677', email: 'ramesh.electric@gmail.com', occupationId: 'OCC-03', totCertified: true, status: 'Active' },
    { id: 'TRN-04', name: 'Dipak Thapa', phone: '9860112233', email: 'dipak.plumb@gmail.com', occupationId: 'OCC-04', totCertified: true, status: 'Active' }
  ];

  const trainingGroups = [
    { id: 'GRP-01', groupCode: 'CG-2025-M1', name: 'Caregiver Batch 1 (Morning)', courseId: 'CRS-01', trainerId: 'TRN-01', shift: 'A', timing: '07:00 AM – 09:00 AM', startDate: '2025-01-15', expectedEndDate: '2025-04-15', capacity: 25, currentTrainees: 20, status: 'Running' },
    { id: 'GRP-02', groupCode: 'CG-2025-D1', name: 'Caregiver Batch 2 (Midday)', courseId: 'CRS-01', trainerId: 'TRN-01', shift: 'C', timing: '12:00 PM – 02:00 PM', startDate: '2025-01-15', expectedEndDate: '2025-04-15', capacity: 25, currentTrainees: 20, status: 'Running' },
    { id: 'GRP-03', groupCode: 'CG-2025-E1', name: 'Caregiver Batch 3 (Evening)', courseId: 'CRS-01', trainerId: 'TRN-01', shift: 'D', timing: '04:00 PM – 06:00 PM', startDate: '2025-02-01', expectedEndDate: '2025-05-01', capacity: 25, currentTrainees: 20, status: 'Running' },
    { id: 'GRP-04', groupCode: 'BT-2025-M1', name: 'Beautician Batch 1 (Morning)', courseId: 'CRS-02', trainerId: 'TRN-02', shift: 'A', timing: '07:00 AM – 09:00 AM', startDate: '2025-01-20', expectedEndDate: '2025-04-20', capacity: 15, currentTrainees: 10, status: 'Running' },
    { id: 'GRP-05', groupCode: 'BT-2025-D1', name: 'Beautician Batch 2 (Midday)', courseId: 'CRS-02', trainerId: 'TRN-02', shift: 'C', timing: '12:00 PM – 02:00 PM', startDate: '2025-02-05', expectedEndDate: '2025-05-05', capacity: 15, currentTrainees: 10, status: 'Running' },
    { id: 'GRP-06', groupCode: 'EL-2025-M1', name: 'Electrician Batch 1 (Morning)', courseId: 'CRS-03', trainerId: 'TRN-03', shift: 'A', timing: '07:00 AM – 09:00 AM', startDate: '2025-01-10', expectedEndDate: '2025-04-10', capacity: 15, currentTrainees: 8, status: 'Running' },
    { id: 'GRP-07', groupCode: 'EL-2025-D1', name: 'Electrician Batch 2 (Midday)', courseId: 'CRS-03', trainerId: 'TRN-03', shift: 'C', timing: '12:00 PM – 02:00 PM', startDate: '2025-02-01', expectedEndDate: '2025-05-01', capacity: 15, currentTrainees: 7, status: 'Running' },
    { id: 'GRP-08', groupCode: 'PL-2025-M1', name: 'Plumber Batch 1 (Morning)', courseId: 'CRS-04', trainerId: 'TRN-04', shift: 'A', timing: '07:00 AM – 09:00 AM', startDate: '2025-01-25', expectedEndDate: '2025-04-25', capacity: 15, currentTrainees: 10, status: 'Running' }
  ];

  const students = [];
  const admissions = [];
  const payments = [];
  const journalEntries = [];
  const leads = [];

  for (let i = 1; i <= 105; i++) {
    const isFemale = i <= 65;
    const firstName = isFemale ? getItem(FIRST_NAMES_FEMALE, i) : getItem(FIRST_NAMES_MALE, i);
    const lastName = getItem(LAST_NAMES, i);
    const fullName = `${firstName} ${lastName}`;
    const gender = isFemale ? 'Female' : 'Male';
    const studentId = `STD-${String(i).padStart(3, '0')}`;
    const tgid = `TGID-${100 + i}`;
    const biometricId = 1000 + i;
    const phone = getPhone(i);
    const address = `${getItem(LOCAL_ADDRESSES, i)}, ${getItem(DISTRICTS, i)}`;

    let targetGroup;
    if (i <= 60) targetGroup = trainingGroups[(i - 1) % 3];
    else if (i <= 80) targetGroup = trainingGroups[3 + ((i - 61) % 2)];
    else if (i <= 95) targetGroup = trainingGroups[5 + ((i - 81) % 2)];
    else targetGroup = trainingGroups[7];

    const courseObj = courses.find((c) => c.id === targetGroup.courseId);
    const totalFee = courseObj.price;
    const advancePaid = Math.round(totalFee * 0.5);
    const dueAmount = totalFee - advancePaid;
    const isConvertedFromLead = i % 2 === 0;
    const leadId = isConvertedFromLead ? `LD-${100 + i}` : null;
    const admissionDate = targetGroup.startDate;

    students.push({
      id: studentId,
      tgid,
      biometricId,
      name: fullName,
      phone,
      secondaryPhone: '',
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@gmail.com`,
      gender,
      bloodGroup: getItem(['A+ve', 'B+ve', 'O+ve', 'AB+ve'], i),
      dateOfBirth: '2001-05-12',
      citizenshipNumber: `${20 + (i % 50)}-01-78-${10000 + i}`,
      citizenshipDistrict: 'Kathmandu',
      currentAddress: address,
      permanentAddress: address,
      fatherName: `${getItem(FIRST_NAMES_MALE, i + 3)} ${lastName}`,
      motherName: `${getItem(FIRST_NAMES_FEMALE, i + 5)} ${lastName}`,
      guardianContact: getPhone(i + 200),
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
    });

    const agreementNo = `GE-AGR-2025-${String(i).padStart(3, '0')}`;
    const receiptNo = `REC-ADM-${String(i).padStart(4, '0')}`;
    const paymentMethod = getItem(['Cash', 'Fonepay', 'Bank Transfer'], i);

    admissions.push({
      id: `ADM-${String(i).padStart(3, '0')}`,
      agreementNo,
      studentId,
      tgid,
      studentName: fullName,
      phone,
      secondaryPhone: '',
      gender,
      bloodGroup: getItem(['A+ve', 'B+ve', 'O+ve', 'AB+ve'], i),
      photoUrl: '',
      expectedEndDate: targetGroup.expectedEndDate,
      citizenshipNumber: `${20 + (i % 50)}-01-78-${10000 + i}`,
      currentAddress: address,
      permanentAddress: address,
      fatherName: `${getItem(FIRST_NAMES_MALE, i + 3)} ${lastName}`,
      guardianContact: getPhone(i + 200),
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
    });

    payments.push({
      id: `PMT-${String(i).padStart(3, '0')}`,
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
        convertedToAdmissionId: `ADM-${String(i).padStart(3, '0')}`,
        priority: 'High',
        source: getItem(['Facebook Ads', 'Walk-in', 'Website', 'Referral', 'TikTok'], i),
        createdAt: '2025-01-05T10:00:00Z',
        timeline: [
          { date: '2025-01-05T10:00:00Z', note: 'Inquiry received via online channel.', staffName: 'Counselor' },
          { date: '2025-01-10T14:00:00Z', note: 'Counseling completed; agreed on training schedule.', staffName: 'Counselor' },
          { date: '2025-01-15T11:00:00Z', note: `Converted to Student (${tgid}) & Agreement (${agreementNo}) generated.`, staffName: 'Admission Desk' }
        ]
      });
    }
  }

  // Add 25 active CRM leads
  for (let j = 1; j <= 25; j++) {
    const isFemale = j % 2 === 0;
    const firstName = isFemale ? getItem(FIRST_NAMES_FEMALE, j + 50) : getItem(FIRST_NAMES_MALE, j + 50);
    const lastName = getItem(LAST_NAMES, j + 20);
    const course = courses[j % courses.length];
    const stages = ['Inquiry', 'Contacted', 'Counseling', 'Interested', 'Qualified', 'Lost'];
    leads.push({
      id: `LD-ACTIVE-${String(j).padStart(3, '0')}`,
      name: `${firstName} ${lastName}`,
      phone: getPhone(j + 300),
      address: `${getItem(LOCAL_ADDRESSES, j)}, Kathmandu`,
      course: course.title,
      price: course.price,
      stage: stages[j % stages.length],
      priority: getItem(['High', 'Medium', 'Low'], j),
      source: getItem(['Facebook Ads', 'Walk-in', 'Website', 'Referral', 'WhatsApp'], j),
      createdAt: '2025-02-10T09:00:00Z',
      timeline: [
        { date: '2025-02-10T09:00:00Z', note: `Inquiry recorded for ${course.title}`, staffName: 'Reception Desk' }
      ]
    });
  }

  // Generate 1,575 Attendance records
  const attendances = [];
  const sessionDates = [
    '2025-02-01', '2025-02-02', '2025-02-03', '2025-02-04', '2025-02-05',
    '2025-02-07', '2025-02-08', '2025-02-09', '2025-02-10', '2025-02-11',
    '2025-02-12', '2025-02-14', '2025-02-15', '2025-02-16', '2025-02-17'
  ];

  sessionDates.forEach((date, dIdx) => {
    students.forEach((std, sIdx) => {
      const hash = (dIdx * 31 + sIdx) % 100;
      let status = 'present';
      if (hash > 93) status = 'absent';
      else if (hash > 90) status = 'late';

      attendances.push({
        id: `ATT-${date}-${std.id}`,
        groupId: std.groupId,
        studentId: std.id,
        date,
        status,
        source: hash % 2 === 0 ? 'BIOMETRIC' : 'ADMIN_MANUAL',
        checkInTime: status !== 'absent' ? '07:05 AM' : '',
        biometricId: std.biometricId,
        verifiedBy: hash % 2 === 0 ? 'ZKTeco K40' : 'Sister Radhika Sharma',
        remarks: status === 'late' ? 'Late due to transport' : ''
      });
    });
  });

  // Employers & OJT Placements
  const employers = [
    { id: 'EMP-01', name: 'Norvic International Hospital', sector: 'Healthcare & Hospital', contactPerson: 'Dr. Subhash Regmi', phone: '01-4258555', address: 'Thapathali, Kathmandu', activeOjtCount: 6 },
    { id: 'EMP-02', name: 'Nepal Medcity Hospital', sector: 'Healthcare & Hospital', contactPerson: 'Rita KC', phone: '01-4217766', address: 'Bhaisepati, Lalitpur', activeOjtCount: 6 },
    { id: 'EMP-03', name: 'Nightingale Elderly Home', sector: 'Elder Care & Hospice', contactPerson: 'Saroj Shrestha', phone: '9841889900', address: 'MitraPark, Chabahil', activeOjtCount: 6 },
    { id: 'EMP-04', name: 'Lotus Wellness & Beauty Lounge', sector: 'Salon & Spa', contactPerson: 'Bimala Thapa', phone: '9851122334', address: 'Durbarmarg, Kathmandu', activeOjtCount: 6 },
    { id: 'EMP-05', name: 'Everest Electro-Mechanical Works', sector: 'Engineering', contactPerson: 'Eng. Hari Bista', phone: '9841334455', address: 'Patan Industrial Estate', activeOjtCount: 6 }
  ];

  const ojts = [];
  for (let k = 0; k < 30; k++) {
    const std = students[k];
    const emp = employers[k % employers.length];
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

  // Certificates
  const certificates = [];
  for (let c = 0; c < 25; c++) {
    const std = students[c];
    const crs = courses.find((cr) => cr.id === trainingGroups.find((g) => g.id === std.groupId).courseId);
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
      verificationCode: `VRF-${(100000 + c * 31).toString(36).toUpperCase()}`,
      grade: 'Distinction (88%)',
      ctevtAccredited: true
    });
  }

  return {
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
}
