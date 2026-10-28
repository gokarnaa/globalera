// Local-first TVET Database with Automatic Cascading & Realistic Seed Data

export const SHIFT_DEFINITIONS = [
  { code: 'A', name: 'Shift A', time: '07:00 AM – 09:00 AM', startTime: '07:00', endTime: '09:00' },
  { code: 'B', name: 'Shift B', time: '10:00 AM – 12:00 PM', startTime: '10:00', endTime: '12:00' },
  { code: 'C', name: 'Shift C', time: '12:00 PM – 02:00 PM', startTime: '12:00', endTime: '14:00' },
  { code: 'D', name: 'Shift D', time: '02:00 PM – 04:00 PM', startTime: '14:00', endTime: '16:00' },
  { code: 'E', name: 'Shift E', time: '04:00 PM – 06:00 PM', startTime: '16:00', endTime: '18:00' },
];

export function calculateExpectedEndDate(startDateStr, durationValue, durationUnit) {
  if (!startDateStr) return '';
  const date = new Date(startDateStr);
  if (isNaN(date.getTime())) return '';
  const val = Number(durationValue) || 1;
  const unit = (durationUnit || 'months').toLowerCase();

  if (unit.startsWith('month')) {
    date.setMonth(date.getMonth() + val);
  } else if (unit.startsWith('week')) {
    date.setDate(date.getDate() + val * 7);
  } else if (unit.startsWith('day')) {
    date.setDate(date.getDate() + val);
  }
  return date.toISOString().slice(0, 10);
}

export function generateDefaultUsers(trainers = [], students = []) {
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

  const trainerUsers = trainers.map((t, idx) => ({
    id: `USR-${t.id}`,
    username: (t.name.split(' ')[0] || `trainer${idx + 1}`).toLowerCase(),
    phone: t.phone || `984100000${idx + 1}`,
    name: t.name,
    role: 'TRAINER',
    trainerId: t.id,
    pin: t.pin || '1234',
    status: t.status === 'Inactive' ? 'Suspended' : 'Active',
    specialization: t.specialization || 'Instructor',
    createdAt: '2026-01-01'
  }));

  const studentUsers = students.map((s, idx) => ({
    id: `USR-${s.id}`,
    username: (s.tgid || `std${idx + 1}`).toLowerCase().replace(/[^a-z0-9]/g, ''),
    phone: s.phone || `986000000${idx + 1}`,
    name: s.name,
    role: 'STUDENT',
    studentId: s.id,
    pin: s.pin || '1234',
    status: s.status === 'Dropout' ? 'Suspended' : 'Active',
    tgid: s.tgid,
    groupId: s.groupId,
    createdAt: s.admissionDate || '2026-01-01'
  }));

  const initialAgents = [
    {
      id: 'AGT-01',
      code: 'AGE-101',
      name: 'रमेश श्रेष्ठ (Ramesh Shrestha)',
      phone: '9841234567',
      email: 'ramesh.agent@gmail.com',
      address: 'चाबहिल, काठमाडौं',
      pin: '1234',
      status: 'Active',
      commissionType: 'FIXED', // 'FIXED' or 'PERCENTAGE'
      defaultRate: 1000,
      paymentInfo: 'eSewa: 9841234567',
      joinedDate: '2026-01-15'
    },
    {
      id: 'AGT-02',
      code: 'AGE-102',
      name: 'सुनिता गुरुङ (Sunita Gurung)',
      phone: '9851234567',
      email: 'sunita.edupath@gmail.com',
      address: 'पोखरा / काठमाडौं',
      pin: '1234',
      status: 'Active',
      commissionType: 'PERCENTAGE',
      defaultRate: 10,
      paymentInfo: 'Khalti: 9851234567',
      joinedDate: '2026-02-01'
    }
  ];

  const agentUsers = initialAgents.map((a, idx) => ({
    id: `USR-${a.id}`,
    username: (a.code || `agent${idx + 1}`).toLowerCase(),
    phone: a.phone,
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
  occupations: [
    { id: 'OCC-01', name: 'Beautician', status: 'Active' },
    { id: 'OCC-02', name: 'Care Giver', status: 'Active' },
    { id: 'OCC-03', name: 'Tailoring & Garment', status: 'Active' },
    { id: 'OCC-04', name: 'Bakery & Confectionery', status: 'Active' },
    { id: 'OCC-05', name: 'Mobile Repair', status: 'Active' },
    { id: 'OCC-06', name: 'Electrician', status: 'Active' },
  ],

  courses: [
    {
      id: 'CRS-01',
      occupationId: 'OCC-01',
      title: 'Basic Beautician',
      level: 'Level 1',
      durationValue: 3,
      durationUnit: 'Months',
      totalHours: 390,
      price: 15000,
      status: 'Active',
      description: 'Foundations of skincare, makeup, threading, facial, and haircare.'
    },
    {
      id: 'CRS-02',
      occupationId: 'OCC-02',
      title: 'Professional Caregiver (Home & Geriatric)',
      level: 'Level 2',
      durationValue: 3,
      durationUnit: 'Months',
      totalHours: 420,
      price: 25000,
      status: 'Active',
      description: 'Comprehensive elderly care, patient vitals monitoring, first aid, palliative care.'
    },
    {
      id: 'CRS-03',
      occupationId: 'OCC-03',
      title: 'Basic Tailoring & Dress Making',
      level: 'Level 1',
      durationValue: 3,
      durationUnit: 'Months',
      totalHours: 390,
      price: 16000,
      status: 'Active',
      description: 'Garment measurement, cutting, machine handling, Kurtha-Suruwal and Blouse drafting.'
    },
    {
      id: 'CRS-04',
      occupationId: 'OCC-04',
      title: 'Commercial Bakery & Pastry Production',
      level: 'Level 1',
      durationValue: 2,
      durationUnit: 'Months',
      totalHours: 260,
      price: 22000,
      status: 'Active',
      description: 'Artisanal bread, cakes, pastries, hygiene standards and oven operations.'
    }
  ],

  trainers: [
    {
      id: 'TRN-01',
      biometricId: '2001',
      name: 'Pooja Rajbanshi',
      phone: '9841234567',
      occupationId: 'OCC-01',
      pin: '1234',
      status: 'Active',
      specialization: 'Cosmetology & Hair Styling',
      remunerationType: 'COMMISSION',
      monthlySalary: 0,
      photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'TRN-02',
      biometricId: '2002',
      name: 'Sister Anita Thapa',
      phone: '9851098765',
      occupationId: 'OCC-02',
      pin: '2345',
      status: 'Active',
      specialization: 'Senior Care & Nursing Fundamentals',
      remunerationType: 'SALARY',
      monthlySalary: 25000,
      photo: 'https://images.unsplash.com/photo-1594824813576-9658f86f780e?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'TRN-03',
      biometricId: '2003',
      name: 'Suresh Shrestha',
      phone: '9860112233',
      occupationId: 'OCC-03',
      pin: '3456',
      status: 'Active',
      specialization: 'Fashion Drafting & Pattern Cutting',
      remunerationType: 'COMMISSION',
      monthlySalary: 0,
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'TRN-04',
      biometricId: '2004',
      name: 'Chef Bikram Gurung',
      phone: '9813445566',
      occupationId: 'OCC-04',
      pin: '4567',
      status: 'Active',
      specialization: 'Pastry Arts & Baking Science',
      remunerationType: 'BOTH',
      monthlySalary: 15000,
      photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
    }
  ],

  trainingGroups: [
    {
      id: 'GRP-01',
      groupCode: 'BT-01',
      courseId: 'CRS-01',
      trainerId: 'TRN-01',
      shift: 'A',
      startTime: '07:00 AM',
      endTime: '09:00 AM',
      startDate: '2026-09-01',
      expectedEndDate: '2026-12-01',
      trainerCommissionPercent: 25,
      status: 'Running'
    },
    {
      id: 'GRP-02',
      groupCode: 'CG-01',
      courseId: 'CRS-02',
      trainerId: 'TRN-02',
      shift: 'B',
      startTime: '10:00 AM',
      endTime: '12:00 PM',
      startDate: '2026-09-15',
      expectedEndDate: '2026-12-15',
      trainerCommissionPercent: 20,
      status: 'Running'
    },
    {
      id: 'GRP-03',
      groupCode: 'TL-01',
      courseId: 'CRS-03',
      trainerId: 'TRN-03',
      shift: 'C',
      startTime: '12:00 PM',
      endTime: '02:00 PM',
      startDate: '2026-08-01',
      expectedEndDate: '2026-11-01',
      trainerCommissionPercent: 30,
      status: 'OJT Phase'
    }
  ],

  syllabi: [
    // Beautician
    { id: 'SYL-01', courseId: 'CRS-01', unitNo: 1, title: 'Facial Anatomy & Skin Analysis', theoryHours: 15, practicalHours: 35, totalHours: 50, learningOutcome: 'Understand skin types, identify contraindications, hygiene protocol.' },
    { id: 'SYL-02', courseId: 'CRS-01', unitNo: 2, title: 'Eyebrow Threading & Shaping', theoryHours: 5, practicalHours: 45, totalHours: 50, learningOutcome: 'Perform painless threading on brows, upper lip and forehead.' },
    { id: 'SYL-03', courseId: 'CRS-01', unitNo: 3, title: 'Bleaching & Cleansing Facials', theoryHours: 10, practicalHours: 50, totalHours: 60, learningOutcome: 'Cleanse, steam, blackhead extraction, massage, pack application.' },
    { id: 'SYL-04', courseId: 'CRS-01', unitNo: 4, title: 'Hair Treatment, Straightening & Styling', theoryHours: 20, practicalHours: 80, totalHours: 100, learningOutcome: 'Hair spa, keratin smoothening, iron pressing, blow dry.' },
    { id: 'SYL-05', courseId: 'CRS-01', unitNo: 5, title: 'Bridal & Party Makeup Application', theoryHours: 15, practicalHours: 75, totalHours: 90, learningOutcome: 'Base blending, contouring, eye makeup, saree draping.' },
    { id: 'SYL-06', courseId: 'CRS-01', unitNo: 6, title: 'Salon Hygiene, Sanitation & Client Care', theoryHours: 20, practicalHours: 20, totalHours: 40, learningOutcome: 'Sterilization of tools, customer communication, ethics.' },

    // Caregiver
    { id: 'SYL-07', courseId: 'CRS-02', unitNo: 1, title: 'Vital Signs Monitoring (BP, Pulse, Sugar)', theoryHours: 20, practicalHours: 60, totalHours: 80, learningOutcome: 'Accurate sphygmomanometer reading, glucometer, digital thermometer.' },
    { id: 'SYL-08', courseId: 'CRS-02', unitNo: 2, title: 'Patient Mobility, Lifting & Transferring', theoryHours: 15, practicalHours: 65, totalHours: 80, learningOutcome: 'Wheelchair transfer, bed repositioning without back injury.' },
    { id: 'SYL-09', courseId: 'CRS-02', unitNo: 3, title: 'Personal Hygiene & Sponge Bathing', theoryHours: 15, practicalHours: 55, totalHours: 70, learningOutcome: 'Bed bath, oral hygiene, catheter care, adult diaper changing.' },
    { id: 'SYL-10', courseId: 'CRS-02', unitNo: 4, title: 'Nutrition, Feeding & Medication Reminder', theoryHours: 25, practicalHours: 45, totalHours: 70, learningOutcome: 'Diet for diabetic/hypertensive patients, RT feeding basics.' },
    { id: 'SYL-11', courseId: 'CRS-02', unitNo: 5, title: 'Emergency First Aid & CPR Protocol', theoryHours: 20, practicalHours: 50, totalHours: 70, learningOutcome: 'Choking intervention, basic CPR, burn care, fall management.' },
    { id: 'SYL-12', courseId: 'CRS-02', unitNo: 6, title: 'Dementia Care & Psychological Support', theoryHours: 25, practicalHours: 25, totalHours: 50, learningOutcome: 'Empathetic communication, dealing with agitation and wandering.' }
  ],

  students: [
    {
      id: 'STD-01',
      biometricId: '1001',
      tgid: 'TGID-101',
      name: 'Sunita Sharma',
      phone: '9841987654',
      secondaryPhone: '9803123456',
      email: 'sunita.sharma@gmail.com',
      gender: 'Female',
      dateOfBirth: '2002-05-14',
      citizenshipNumber: '27-01-76-01234',
      citizenshipDistrict: 'Kathmandu',
      permanentAddress: 'Chabahil, Kathmandu',
      currentAddress: 'MitraPark, Kathmandu',
      fatherName: 'Ram Kumar Sharma',
      motherName: 'Sita Devi Sharma',
      guardianContact: '9841987655',
      groupId: 'GRP-01',
      admissionDate: '2026-09-01',
      expectedEndDate: '2026-12-01',
      status: 'Active',
      photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'STD-02',
      biometricId: '1002',
      tgid: 'TGID-102',
      name: 'Alina Rai',
      phone: '9818554433',
      secondaryPhone: '',
      email: 'alina.rai@gmail.com',
      gender: 'Female',
      dateOfBirth: '2001-08-20',
      citizenshipNumber: '14-02-74-05678',
      citizenshipDistrict: 'Solukhumbu',
      permanentAddress: 'Salleri, Solukhumbu',
      currentAddress: 'Gaushala, Kathmandu',
      fatherName: 'Dawa Rai',
      motherName: 'Pasang Lhamu Rai',
      guardianContact: '9818554400',
      groupId: 'GRP-01',
      admissionDate: '2026-09-01',
      expectedEndDate: '2026-12-01',
      status: 'Active',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'STD-03',
      biometricId: '1003',
      tgid: 'TGID-103',
      name: 'Manish Adhikari',
      phone: '9861223344',
      secondaryPhone: '',
      email: 'manish.adhikari@gmail.com',
      gender: 'Male',
      dateOfBirth: '1999-11-10',
      citizenshipNumber: '32-01-72-09876',
      citizenshipDistrict: 'Kaski',
      permanentAddress: 'Pokhara-8, Kaski',
      currentAddress: 'Baneshwor, Kathmandu',
      fatherName: 'Hari Prasad Adhikari',
      motherName: 'Kamala Adhikari',
      guardianContact: '9861223300',
      groupId: 'GRP-02',
      admissionDate: '2026-09-15',
      expectedEndDate: '2026-12-15',
      status: 'Active',
      photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'STD-04',
      biometricId: '1004',
      tgid: 'TGID-104',
      name: 'Pabitra Magar',
      phone: '9808332211',
      secondaryPhone: '',
      email: 'pabitra.magar@gmail.com',
      gender: 'Female',
      dateOfBirth: '2003-01-25',
      citizenshipNumber: '44-01-78-03456',
      citizenshipDistrict: 'Palpa',
      permanentAddress: 'Tansen, Palpa',
      currentAddress: 'Koteshwor, Kathmandu',
      fatherName: 'Bir Bahadur Magar',
      motherName: 'Yam Kumari Magar',
      guardianContact: '9808332200',
      groupId: 'GRP-02',
      admissionDate: '2026-09-15',
      expectedEndDate: '2026-12-15',
      status: 'Active',
      photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'STD-05',
      biometricId: '1005',
      tgid: 'TGID-105',
      name: 'Kopila Tamang',
      phone: '9843667788',
      secondaryPhone: '',
      email: 'kopila.tamang@gmail.com',
      gender: 'Female',
      dateOfBirth: '2000-07-18',
      citizenshipNumber: '28-02-75-01122',
      citizenshipDistrict: 'Kavre',
      permanentAddress: 'Banepa, Kavre',
      currentAddress: 'Chabahil, Kathmandu',
      fatherName: 'Sombir Tamang',
      motherName: 'Maya Tamang',
      guardianContact: '9843667700',
      groupId: 'GRP-03',
      admissionDate: '2026-08-01',
      expectedEndDate: '2026-11-01',
      status: 'Active',
      photoUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80'
    }
  ],

  workPlans: [
    {
      id: 'WP-01',
      groupId: 'GRP-01',
      syllabusId: 'SYL-02',
      planDate: '2026-10-10',
      dayName: 'Friday',
      theoryAspect: 'Principles of facial symmetry and eyebrow arching techniques.',
      practicalAspect: 'Hand positioning and thread holding practice on arms & forehead.',
      plannedHours: 2,
      status: 'Completed'
    },
    {
      id: 'WP-02',
      groupId: 'GRP-01',
      syllabusId: 'SYL-02',
      planDate: '2026-10-11',
      dayName: 'Saturday',
      theoryAspect: 'Sanitation before threading and post-soothing antiseptic lotion.',
      practicalAspect: 'Live model eyebrow threading under trainer supervision.',
      plannedHours: 2,
      status: 'Pending'
    },
    {
      id: 'WP-03',
      groupId: 'GRP-02',
      syllabusId: 'SYL-07',
      planDate: '2026-10-11',
      dayName: 'Saturday',
      theoryAspect: 'Hypertension stages, systolic/diastolic measurement landmarks.',
      practicalAspect: 'Manual BP cuff stethoscope practice on peers (3 trials each).',
      plannedHours: 2,
      status: 'Pending'
    }
  ],

  lessonPlans: [
    {
      id: 'LP-01',
      workPlanId: 'WP-01',
      groupId: 'GRP-01',
      objectives: 'Students will accurately thread upper lip without skin pinching.',
      materialsNeeded: 'Organic cotton thread #40, Talcum powder, Astringent, Scissors.',
      methodology: 'Trainer demo 15 min, Peer buddy practice 75 min, Assessment 15 min.',
      assessmentMethod: 'Observation checklist: Thread tension, grip, smoothness.',
      homework: 'Practice thread holding loop 50 times at home.',
      notes: 'Ensure students wash hands thoroughly before touching facial skin.'
    }
  ],

  logBooks: [
    {
      id: 'LOG-01',
      lessonPlanId: 'LP-01',
      groupId: 'GRP-01',
      deliveryDate: '2026-10-10',
      topicsCovered: 'Eyebrow upper lip threading grip and thread tension management.',
      materialsUsed: 'Threading thread, antiseptic toner, cotton swabs.',
      skillsLearned: 'Painless hair extraction technique, post-thread calming.',
      actualHours: 2,
      isDelivered: true,
      trainerNotes: 'Sunita and Alina showed excellent grip. Need more practice on brow tail.'
    }
  ],

  attendances: [
    { id: 'ATT-1', groupId: 'GRP-01', date: '2026-10-09', studentId: 'STD-01', status: 'present', source: 'BIOMETRIC', checkInTime: '06:58:20 AM', biometricId: '1001', verifiedBy: 'Global Era ZKTeco K40 WiFi', remarks: 'On time' },
    { id: 'ATT-2', groupId: 'GRP-01', date: '2026-10-09', studentId: 'STD-02', status: 'present', source: 'BIOMETRIC', checkInTime: '07:04:15 AM', biometricId: '1002', verifiedBy: 'Global Era ZKTeco K40 WiFi', remarks: 'On time' },
    { id: 'ATT-3', groupId: 'GRP-01', date: '2026-10-10', studentId: 'STD-01', status: 'present', source: 'BIOMETRIC', checkInTime: '06:55:10 AM', biometricId: '1001', verifiedBy: 'Global Era ZKTeco K40 WiFi', remarks: 'Active in class' },
    { id: 'ATT-4', groupId: 'GRP-01', date: '2026-10-10', studentId: 'STD-02', status: 'late', source: 'BIOMETRIC', checkInTime: '07:22:45 AM', biometricId: '1002', verifiedBy: 'Global Era ZKTeco K40 WiFi', remarks: '15 mins late' },
    { id: 'ATT-5', groupId: 'GRP-02', date: '2026-10-10', studentId: 'STD-03', status: 'present', source: 'TRAINER_MANUAL', checkInTime: '07:15:00 AM', verifiedBy: 'Pooja Rajbanshi (प्रशिक्षक)', remarks: 'प्रशिक्षक म्यानुअल हाजिरी' },
    { id: 'ATT-6', groupId: 'GRP-02', date: '2026-10-10', studentId: 'STD-04', status: 'absent', source: 'TRAINER_MANUAL', remarks: 'Sick leave' }
  ],

  biometricLogs: [
    {
      id: 'LOG-001',
      biometricId: '1001',
      name: 'Sunita Sharma',
      role: 'STUDENT',
      date: new Date().toISOString().slice(0, 10),
      timestamp: '06:58:20 AM',
      device: 'Main Gate - ZKTeco K40 WiFi',
      matched: true,
      status: 'success'
    },
    {
      id: 'LOG-002',
      biometricId: '2001',
      name: 'Pooja Rajbanshi (Trainer)',
      role: 'TRAINER',
      date: new Date().toISOString().slice(0, 10),
      timestamp: '06:52:10 AM',
      device: 'Main Gate - ZKTeco K40 WiFi',
      matched: true,
      status: 'success'
    },
    {
      id: 'LOG-003',
      biometricId: '1002',
      name: 'Alina Rai',
      role: 'STUDENT',
      date: new Date().toISOString().slice(0, 10),
      timestamp: '07:22:45 AM',
      device: 'Main Gate - ZKTeco K40 WiFi',
      matched: true,
      status: 'success'
    },
    {
      id: 'LOG-004',
      biometricId: '3001',
      name: 'Admin / Reception Desk Staff',
      role: 'STAFF',
      date: new Date().toISOString().slice(0, 10),
      timestamp: '06:45:00 AM',
      device: 'Main Gate - ZKTeco K40 WiFi',
      matched: true,
      status: 'success'
    }
  ],

  evaluations: [
    {
      id: 'EVL-01',
      groupId: 'GRP-01',
      studentId: 'STD-01',
      syllabusId: 'SYL-01',
      mastered: true,
      areasToImprove: 'Faster skin assessment',
      trainerPlan: 'Give 3 rapid client case studies next week',
      evaluatorName: 'Pooja Rajbanshi',
      evaluatedAt: '2026-09-28'
    },
    {
      id: 'EVL-02',
      groupId: 'GRP-01',
      studentId: 'STD-01',
      syllabusId: 'SYL-02',
      mastered: true,
      areasToImprove: 'Fine arch hair extraction',
      trainerPlan: 'Individual one-on-one brow shape coaching',
      evaluatorName: 'Pooja Rajbanshi',
      evaluatedAt: '2026-10-08'
    },
    {
      id: 'EVL-03',
      groupId: 'GRP-01',
      studentId: 'STD-02',
      syllabusId: 'SYL-01',
      mastered: true,
      areasToImprove: 'Hygiene setup time',
      trainerPlan: 'Daily station prep routine drill',
      evaluatorName: 'Pooja Rajbanshi',
      evaluatedAt: '2026-09-28'
    },
    {
      id: 'EVL-04',
      groupId: 'GRP-02',
      studentId: 'STD-03',
      syllabusId: 'SYL-07',
      mastered: true,
      areasToImprove: 'Korotkoff sound identification',
      trainerPlan: 'Practice with audio pulse amplifier',
      evaluatorName: 'Sister Anita Thapa',
      evaluatedAt: '2026-10-05'
    }
  ],

  employers: [
    {
      id: 'EMP-01',
      name: 'Norvic International Hospital',
      industry: 'Healthcare & Geriatric Care',
      location: 'Thapathali, Kathmandu',
      contactPerson: 'Dr. Praveen Shrestha',
      phone: '01-4258554',
      email: 'hr@norvichospital.com',
      status: 'Active',
      remarks: 'MoU signed for 10 Caregiver OJT & Staff placement yearly.'
    },
    {
      id: 'EMP-02',
      name: 'Arogya Care Home & Hospice',
      industry: 'Elderly Home Care Services',
      location: 'Sanepa, Lalitpur',
      contactPerson: 'Sushila Poudel (Matron)',
      phone: '9851088776',
      email: 'contact@arogyacare.org',
      status: 'Active',
      remarks: 'Requires 24-hour shift caregivers with competitive salary.'
    },
    {
      id: 'EMP-03',
      name: 'Lakme Beauty Salon & Spa',
      industry: 'Aesthetics & Hair Design',
      location: 'Durbar Marg, Kathmandu',
      contactPerson: 'Reema Manandhar',
      phone: '9841889900',
      email: 'reema@lakmesalon.com',
      status: 'Active',
      remarks: 'Prefers Level 1 Beauticians with strong client handling.'
    },
    {
      id: 'EMP-04',
      name: 'Boutique Elegance',
      industry: 'Bespoke Tailoring & Garments',
      location: 'New Road, Kathmandu',
      contactPerson: 'Binod Shakya',
      phone: '9851033445',
      email: 'elegance@boutique.com',
      status: 'Active',
      remarks: 'Employs tailoring graduates on piece-rate + basic salary.'
    }
  ],

  ojts: [
    {
      id: 'OJT-01',
      studentId: 'STD-05',
      employerId: 'EMP-04',
      startDate: '2026-10-01',
      endDate: '2026-10-31',
      relatedPerson: 'Binod Shakya (Master Tailor)',
      contactNumber: '9851033445',
      status: 'Ongoing',
      remarks: 'Assigned to Kurtha pattern cutting and overlock machine section.'
    }
  ],

  placements: [
    {
      id: 'PLC-01',
      studentId: 'STD-05',
      employerId: 'EMP-04',
      targetJob: 'Assistant Tailoring Specialist',
      preferredLocation: 'New Road, Kathmandu',
      expectedSalary: 'NPR 22,000 / month',
      employmentType: 'Full-Time Employee',
      workSchedule: '10:00 AM – 06:00 PM',
      paymentType: 'Monthly Salary',
      status: 'Planned',
      remarks: 'Conditional offer given pending final OJT performance report.'
    }
  ],

  jobOpenings: [
    {
      id: 'JOB-01',
      employerId: 'EMP-01',
      occupationId: 'OCC-02',
      title: 'Geriatric Caregiver / Patient Assistant',
      description: 'Looking for TVET certified caregivers for inpatient and home visit care. Hands-on experience with vital signs monitoring, feeding, and mobility assistance required.',
      requiredSkills: 'Vital Signs (BP, Pulse, Temp), Patient Hygiene, Mobility Transfer, Emergency First Aid',
      vacancies: 4,
      salaryRange: 'NPR 25,000 – 32,000 / month',
      location: 'Thapathali & Lalitpur, Kathmandu',
      employmentType: 'Full-Time',
      status: 'Open',
      postedDate: '2026-10-10'
    },
    {
      id: 'JOB-02',
      employerId: 'EMP-03',
      occupationId: 'OCC-01',
      title: 'Junior Aesthetician & Beautician',
      description: 'Lakme Salon seeks passionate beautician graduates for bridal makeup, skin facial treatments, threading, and nail grooming.',
      requiredSkills: 'Skin Analysis, Organic Facial, Clean-up, Threading, Manicure/Pedicure',
      vacancies: 2,
      salaryRange: 'NPR 18,000 – 24,000 / month + commission',
      location: 'Durbar Marg, Kathmandu',
      employmentType: 'Full-Time',
      status: 'Open',
      postedDate: '2026-10-12'
    },
    {
      id: 'JOB-03',
      employerId: 'EMP-04',
      occupationId: 'OCC-03',
      title: 'Pattern Drafter & Sewing Machine Operator',
      description: 'Immediate opening for tailoring graduates. Work with Kurtha-Suruwal, Blouse pattern cutting, and overlock industrial machines.',
      requiredSkills: 'Body Measurement, Fabric Cutting, Overlock Machine, Kurtha & Blouse Finishing',
      vacancies: 3,
      salaryRange: 'NPR 20,000 – 26,000 / month',
      location: 'New Road, Kathmandu',
      employmentType: 'Full-Time',
      status: 'Open',
      postedDate: '2026-10-14'
    },
    {
      id: 'JOB-04',
      employerId: 'EMP-02',
      occupationId: 'OCC-02',
      title: 'Home Care Nurse Aide (Rotational Shift)',
      description: 'Provide compassionate palliative and daily living support for elderly residents in private home settings.',
      requiredSkills: 'Medication Administration Record, Bedside Care, Range of Motion Exercises',
      vacancies: 5,
      salaryRange: 'NPR 28,000 – 35,000 / month (Meals included)',
      location: 'Sanepa / Jhamsikhel, Lalitpur',
      employmentType: 'Full-Time',
      status: 'Open',
      postedDate: '2026-10-16'
    }
  ],

  jobApplications: [
    {
      id: 'APP-01',
      jobId: 'JOB-03',
      studentId: 'STD-05',
      status: 'Shortlisted',
      applyDate: '2026-10-15',
      coverNote: 'I am completing my tailoring course with 95% attendance and have mastered Kurtha cutting and stitching.',
      isCurrentlyTraining: true,
      employerNotes: 'Impressive practical skills during preliminary review. Scheduled for interview.'
    }
  ],

  studentTimelines: [
    {
      id: 'TL-01',
      studentId: 'STD-01',
      eventType: 'Admission',
      title: 'Enrolled in Basic Beautician',
      description: 'Enrolled into Group BT-01 (Shift A). Admission fee cleared.',
      createdAt: '2026-09-01T08:00:00Z'
    },
    {
      id: 'TL-02',
      studentId: 'STD-01',
      eventType: 'Evaluation',
      title: 'Skill Mastered: Facial Anatomy',
      description: 'Passed Level 1 Skin Analysis assessment with score 92%.',
      createdAt: '2026-09-28T10:30:00Z'
    },
    {
      id: 'TL-03',
      studentId: 'STD-05',
      eventType: 'OJT',
      title: 'OJT Started at Boutique Elegance',
      description: 'Commenced 1-month hands-on OJT under Master Tailor Binod Shakya.',
      createdAt: '2026-10-01T09:00:00Z'
    }
  ],

  studentNotes: [
    {
      id: 'NOTE-01',
      studentId: 'STD-01',
      text: 'Student demonstrates exceptional discipline and aptitude in practical workshop sessions.',
      author: 'Pooja Rajbanshi (Trainer)',
      createdAt: '2026-09-15T11:00:00Z'
    }
  ],

  certificates: [
    {
      id: 'CERT-01',
      certificateNo: 'GETS-2026-0001',
      studentId: 'STD-01',
      groupId: 'GRP-01',
      courseId: 'CRS-01',
      issueDate: '2026-10-15',
      status: 'Active',
      createdAt: '2026-10-15T10:00:00Z'
    },
    {
      id: 'CERT-02',
      certificateNo: 'GETS-2026-0002',
      studentId: 'STD-02',
      groupId: 'GRP-01',
      courseId: 'CRS-01',
      issueDate: '2026-10-15',
      status: 'Active',
      createdAt: '2026-10-15T10:05:00Z'
    }
  ],

  holidays: [
    {
      id: 'HOL-01',
      title: 'Dashain Festival Vacation (दशैँ बिदा)',
      startDate: '2026-10-18',
      endDate: '2026-10-25',
      type: 'Public Festival',
      description: 'National festival holiday across all TVET batches.'
    },
    {
      id: 'HOL-02',
      title: 'Tihar & Chhath Holidays (तिहार तथा छठ)',
      startDate: '2026-11-08',
      endDate: '2026-11-13',
      type: 'Public Festival',
      description: 'Deepawali and Chhath Parva official holiday.'
    },
    {
      id: 'HOL-03',
      title: 'Constitution Day (संविधान दिवस)',
      startDate: '2026-09-19',
      endDate: '2026-09-19',
      type: 'National Holiday',
      description: 'National Day of Nepal.'
    }
  ],

  notices: [
    {
      id: 'NOT-01',
      title: 'CTEVT NSTB Skills Audit on Friday',
      content: 'All trainers must finalize log books and student evaluation records for batch CG-01 and BT-01 before Thursday 4:00 PM for official CTEVT inspection.',
      targetRole: 'TRAINERS',
      priority: 'Urgent',
      author: 'Principal / Admin',
      createdAt: '2026-10-10T10:00:00Z',
      status: 'Active'
    },
    {
      id: 'NOT-02',
      title: 'Dashain Vacation Schedule Notice',
      content: 'Physical training sessions will remain suspended from Kartik 02 to Kartik 09. Classes resume normally from Kartik 10 in regular shifts.',
      targetRole: 'ALL',
      priority: 'Normal',
      author: 'Administration',
      createdAt: '2026-10-11T09:00:00Z',
      status: 'Active'
    }
  ],

  smsTemplates: [
    {
      id: 'TPL-01',
      title: 'Attendance Warning (अनुपस्थिति चेतावनी)',
      category: 'Attendance',
      content: 'नमस्ते {parent}, तपाईंको छोरा/छोरी {name} आज मिति {date} मा {course} कक्षामा अनुपस्थित हुनुभएको जानकारी गराउँदछौँ। - {institute}'
    },
    {
      id: 'TPL-02',
      title: 'Training Commencement (कक्षा सुरु सूचना)',
      category: 'Class',
      content: 'नमस्ते {name}, तपाईंको {course} तालिम मिति {date} बाट Shift {shift} मा सुरु हुँदैछ। कृपया समयमै उपस्थित हुनुहोला। - {institute}'
    },
    {
      id: 'TPL-03',
      title: 'Certificate Ready (प्रमाणपत्र तयार सूचना)',
      category: 'Certificate',
      content: 'बधाई छ {name}! तपाईंको {course} को व्यावसायिक तालिम समापन प्रमाणपत्र (नं. {certNo}) तयार भएको छ। कार्यालयबाट बुझिलिनुहोला। - {institute}'
    },
    {
      id: 'TPL-04',
      title: 'OJT Briefing Notice (स्थलगत तालिम सिफारिस)',
      category: 'OJT',
      content: 'नमस्ते {name}, तपाईंको OJT तालिम {employer} मा मिति {date} देखि सुरु हुँदैछ। सुपरभाइजर: {supervisor} ({phone})। - {institute}'
    },
    {
      id: 'TPL-05',
      title: 'Placement Interview (रोजगारी अन्तर्वार्ता)',
      category: 'Placement',
      content: 'नमस्ते {name}, तपाईंको {jobTitle} पदका लागि {employer} मा अन्तर्वार्ता तय भएको छ। मिति: {date}, समय: {time}। सम्पर्क: {phone}। - {institute}'
    }
  ],

  communicationLogs: [
    {
      id: 'COMM-01',
      recipientType: 'Student',
      recipientId: 'STD-01',
      recipientName: 'Sunita Sharma',
      recipientPhone: '9841987654',
      channel: 'WhatsApp',
      templateId: 'TPL-03',
      messageText: 'बधाई छ Sunita Sharma! तपाईंको Basic Beautician को प्रमाणपत्र (नं. GETS-2026-0001) तयार भएको छ।',
      callStatus: 'Connected',
      sentBy: 'Admin',
      sentAt: '2026-10-10T11:30:00Z'
    },
    {
      id: 'COMM-02',
      recipientType: 'Student',
      recipientId: 'STD-04',
      recipientName: 'Pabitra Magar',
      recipientPhone: '9808332211',
      channel: 'SMS',
      templateId: 'TPL-01',
      messageText: 'नमस्ते Yam Kumari Magar, तपाईंको छोरी Pabitra Magar आज मिति 2026-10-10 मा कक्षामा अनुपस्थित हुनुभएको जानकारी गराउँदछौँ।',
      callStatus: 'N/A',
      sentBy: 'Admin',
      sentAt: '2026-10-10T10:15:00Z'
    }
  ],

  snapshots: [
    {
      id: 'SNAP-01',
      entityType: 'WorkPlan',
      entityId: 'WP-01',
      version: 1,
      title: 'Work Plan V1 - BT-01 Unit 2 Baseline',
      dataPayload: {
        groupId: 'GRP-01',
        syllabusId: 'SYL-02',
        planDate: '2026-10-10',
        plannedHours: 2,
        status: 'Completed'
      },
      reasonForRevision: 'Official baseline approved by Lead Trainer',
      author: 'Pooja Rajbanshi',
      createdAt: '2026-10-10T09:00:00Z',
      isImmutable: true
    },
    {
      id: 'SNAP-02',
      entityType: 'Certificate',
      entityId: 'CERT-01',
      version: 1,
      title: 'Official Certificate GETS-2026-0001',
      dataPayload: {
        certificateNo: 'GETS-2026-0001',
        studentId: 'STD-01',
        courseId: 'CRS-01',
        issueDate: '2026-10-15',
        status: 'Active'
      },
      reasonForRevision: 'Original issue under CTEVT guidelines',
      author: 'Principal / Admin',
      createdAt: '2026-10-15T10:00:00Z',
      isImmutable: true
    }
  ],

  auditLogs: [
    {
      id: 'AUD-01',
      action: 'CREATE',
      entityType: 'TrainingGroup',
      entityId: 'GRP-01',
      description: 'Training Batch BT-01 created for Basic Beautician with Trainer Pooja Rajbanshi',
      performedBy: 'Admin (Superuser)',
      timestamp: '2026-09-01T07:30:00Z'
    },
    {
      id: 'AUD-02',
      action: 'ISSUE_CERTIFICATE',
      entityType: 'Certificate',
      entityId: 'CERT-01',
      description: 'Certificate GETS-2026-0001 issued to Sunita Sharma with QR verification',
      performedBy: 'Principal / Admin',
      timestamp: '2026-10-15T10:00:00Z'
    },
    {
      id: 'AUD-03',
      action: 'DEPLOY_OJT',
      entityType: 'OJT',
      entityId: 'OJT-01',
      description: 'Student Kopila Tamang deployed to Boutique Elegance under Binod Shakya',
      performedBy: 'Admin',
      timestamp: '2026-10-01T09:00:00Z'
    }
  ],

  leads: [
    {
      id: 'L0001',
      name: 'Anjali Shrestha',
      phone: '9841876543',
      address: 'Jorpati, Kathmandu',
      subject: 'Beautician',
      course: 'Basic Beautician',
      duration: '3 Months (390 hrs)',
      price: 15000,
      source: 'Facebook',
      priority: 'High',
      stage: 'Interested',
      notes: 'Interested in morning shift 7-9 AM. Wants to open salon.',
      followUpDate: '2026-10-27',
      timeline: [
        { date: '2026-10-20T10:30:00Z', note: 'Inquiry via Facebook Ad. Sent course syllabus.', staffName: 'Counselor Rita' },
        { date: '2026-10-22T14:15:00Z', note: 'Phone call discussion. Visited center with mother. Confirmed interest in Morning Shift.', staffName: 'Counselor Rita' }
      ],
      createdAt: '2026-10-20T10:30:00Z'
    },
    {
      id: 'L0002',
      name: 'Ramesh BK',
      phone: '9801234567',
      address: 'Boudha, Kathmandu',
      subject: 'Mobile Repair',
      course: 'Smartphone Hardware & Software',
      duration: '2 Months (260 hrs)',
      price: 18000,
      source: 'Walk-in',
      priority: 'High',
      stage: 'Follow-up',
      notes: 'Needs practical lab training. Wants installment payment option.',
      followUpDate: '2026-10-26',
      timeline: [
        { date: '2026-10-24T11:00:00Z', note: 'Walk-in inquiry. Inspected repair lab. Informed about 2 installment scheme.', staffName: 'Admin' }
      ],
      createdAt: '2026-10-24T11:00:00Z'
    },
    {
      id: 'L0003',
      name: 'Sarita Karki',
      phone: '9843112233',
      address: 'Chabahil, Kathmandu',
      subject: 'Care Giver',
      course: 'Professional Caregiver (Home & Geriatric)',
      duration: '3 Months (420 hrs)',
      price: 25000,
      source: 'Referral',
      priority: 'High',
      stage: 'Converted',
      notes: 'Referred by Sunita Sharma. Admitted and paid registration fee.',
      followUpDate: '',
      convertedToStudentId: 'STD-01',
      timeline: [
        { date: '2026-10-15T09:00:00Z', note: 'Referred by alumni student. Wants Israel/Japan caregiver orientation.', staffName: 'Counselor Rita' },
        { date: '2026-10-18T13:00:00Z', note: 'Admission confirmed. Converted to Batch CG-01.', staffName: 'Admin' }
      ],
      createdAt: '2026-10-15T09:00:00Z'
    },
    {
      id: 'L0004',
      name: 'Bikash Tamang',
      phone: '9860998877',
      address: 'Sankhu, Kathmandu',
      subject: 'Bakery & Confectionery',
      course: 'Commercial Bakery & Pastry Production',
      duration: '2 Months (260 hrs)',
      price: 22000,
      source: 'Instagram',
      priority: 'Medium',
      stage: 'Contacted',
      notes: 'Asked for evening shift or weekend batch.',
      followUpDate: '2026-10-28',
      timeline: [
        { date: '2026-10-25T16:20:00Z', note: 'Sent prospectus via WhatsApp. Waiting for schedule confirmation.', staffName: 'Admin' }
      ],
      createdAt: '2026-10-25T16:20:00Z'
    },
    {
      id: 'L0005',
      name: 'Pooja Thapa',
      phone: '9812445566',
      address: 'Kapan, Kathmandu',
      subject: 'Tailoring & Garment',
      course: 'Basic Tailoring & Dress Making',
      duration: '3 Months (390 hrs)',
      price: 16000,
      source: 'Website',
      priority: 'Low',
      stage: 'New Lead',
      notes: 'Online website form submission.',
      followUpDate: '2026-10-26',
      timeline: [
        { date: '2026-10-26T08:00:00Z', note: 'Lead captured from Website Inquiry Form.', staffName: 'System' }
      ],
      createdAt: '2026-10-26T08:00:00Z'
    },
    {
      id: 'L0006',
      name: 'दिनेश अधिकारी (Dinesh Adhikari)',
      phone: '9841998811',
      address: 'कोटेश्वर, काठमाडौं',
      subject: 'Mobile Repair',
      course: 'Smartphone Hardware & Software',
      duration: '2 Months (260 hrs)',
      price: 18000,
      source: 'एजेन्ट रेफ़रल (रमेश श्रेष्ठ - AGE-101)',
      agentId: 'AGT-01',
      agentCode: 'AGE-101',
      agentName: 'रमेश श्रेष्ठ (Ramesh Shrestha)',
      priority: 'High',
      stage: 'Contacted',
      notes: 'एजेन्ट रमेशजी मार्फत सिफारिस। अनलाइनबाट बुझेको।',
      commissionType: 'FIXED',
      commissionRate: 1000,
      potentialCommission: 1000,
      commissionStatus: 'pending',
      followUpDate: '2026-10-29',
      timeline: [
        { date: '2026-10-27T10:00:00Z', note: 'एजेन्ट पोर्टलबाट लिड प्राप्त भयो: रमेश श्रेष्ठ (AGE-101)', staffName: 'Agent Portal' }
      ],
      createdAt: '2026-10-27T10:00:00Z'
    }
  ],

  agents: [
    {
      id: 'AGT-01',
      code: 'AGE-101',
      name: 'रमेश श्रेष्ठ (Ramesh Shrestha)',
      phone: '9841234567',
      email: 'ramesh.agent@gmail.com',
      address: 'चाबहिल, काठमाडौं',
      pin: '1234',
      status: 'Active',
      commissionType: 'FIXED',
      defaultRate: 1000,
      paymentInfo: 'eSewa: 9841234567',
      joinedDate: '2026-01-15'
    },
    {
      id: 'AGT-02',
      code: 'AGE-102',
      name: 'सुनिता गुरुङ (Sunita Gurung)',
      phone: '9851234567',
      email: 'sunita.edupath@gmail.com',
      address: 'पोखरा / काठमाडौं',
      pin: '1234',
      status: 'Active',
      commissionType: 'PERCENTAGE',
      defaultRate: 10,
      paymentInfo: 'Khalti: 9851234567',
      joinedDate: '2026-02-01'
    }
  ],

  payments: [
    {
      id: 'PAY-0001',
      receiptNo: 'REC-2026-0001',
      studentId: 'STD-01',
      studentName: 'Sunita Sharma',
      tgid: 'TGID-101',
      groupId: 'GRP-01',
      courseName: 'Basic Beautician',
      originalFee: 30000,
      discountPercent: 60,
      discountAmount: 18000,
      admissionFee: 1700,
      lockedCourseFee: 11865,
      amount: 6000,
      paymentDate: '2026-09-01',
      paymentMonth: '2026-09',
      paymentMethod: 'Fonepay / QR',
      installmentNo: 1,
      remarks: 'पहिलो किस्ता (50% upfront admission)',
      receivedBy: 'Admin / Cashier',
      createdAt: '2026-09-01T10:30:00Z'
    },
    {
      id: 'PAY-0002',
      receiptNo: 'REC-2026-0002',
      studentId: 'STD-01',
      studentName: 'Sunita Sharma',
      tgid: 'TGID-101',
      groupId: 'GRP-01',
      courseName: 'Basic Beautician',
      originalFee: 30000,
      discountPercent: 60,
      discountAmount: 18000,
      admissionFee: 1700,
      lockedCourseFee: 11865,
      amount: 5865,
      paymentDate: '2026-10-01',
      paymentMonth: '2026-10',
      paymentMethod: 'Cash',
      installmentNo: 2,
      remarks: 'दोस्रो किस्ता (Remaining 50% cleared)',
      receivedBy: 'Admin / Cashier',
      createdAt: '2026-10-01T11:15:00Z'
    },
    {
      id: 'PAY-0003',
      receiptNo: 'REC-2026-0003',
      studentId: 'STD-02',
      studentName: 'Aarati Chaudhary',
      tgid: 'TGID-102',
      groupId: 'GRP-01',
      courseName: 'Basic Beautician',
      originalFee: 30000,
      discountPercent: 60,
      discountAmount: 18000,
      admissionFee: 1700,
      lockedCourseFee: 11865,
      amount: 6000,
      paymentDate: '2026-09-01',
      paymentMonth: '2026-09',
      paymentMethod: 'eSewa',
      installmentNo: 1,
      remarks: 'पहिलो किस्ता भर्ना शुल्क',
      receivedBy: 'Accountant',
      createdAt: '2026-09-01T14:00:00Z'
    },
    {
      id: 'PAY-0004',
      receiptNo: 'REC-2026-0004',
      studentId: 'STD-03',
      studentName: 'Manish Adhikari',
      tgid: 'TGID-103',
      groupId: 'GRP-02',
      courseName: 'Professional Caregiver (Home & Geriatric)',
      originalFee: 35000,
      discountPercent: 40,
      discountAmount: 14000,
      admissionFee: 2000,
      lockedCourseFee: 23000,
      amount: 12000,
      paymentDate: '2026-09-15',
      paymentMonth: '2026-09',
      paymentMethod: 'Bank Transfer',
      installmentNo: 1,
      remarks: 'पहिलो किस्ता (50% Deposit)',
      receivedBy: 'Accountant',
      createdAt: '2026-09-15T09:30:00Z'
    }
  ],

  trainerPayouts: [
    {
      id: 'TRP-0001',
      voucherNo: 'VCH-2026-0001',
      trainerId: 'TRN-01',
      trainerName: 'Pooja Rajbanshi',
      payoutType: 'COMMISSION',
      groupId: 'GRP-01',
      groupName: 'BT-01 (Basic Beautician)',
      amount: 4466,
      payoutDate: '2026-10-05',
      payoutMonth: '2026-10',
      paymentMethod: 'Bank Transfer',
      remarks: 'ब्याच BT-01 संकलित शुल्कबाट २५% कमिसन निकासा',
      disbursedBy: 'Admin',
      createdAt: '2026-10-05T15:00:00Z'
    },
    {
      id: 'TRP-0002',
      voucherNo: 'VCH-2026-0002',
      trainerId: 'TRN-02',
      trainerName: 'Dr. Anita Joshi',
      payoutType: 'SALARY',
      groupId: '',
      groupName: '',
      amount: 25000,
      payoutDate: '2026-10-01',
      payoutMonth: '2026-09',
      paymentMethod: 'Bank Transfer',
      remarks: 'असोज महिनाको मासिक तलब (September Salary)',
      disbursedBy: 'Admin',
      createdAt: '2026-10-01T12:00:00Z'
    }
  ],

  // -------------------------------------------------------------
  // CENTRAL DOUBLE-ENTRY ACCOUNTING & FINANCIAL MANAGEMENT MODULE
  // -------------------------------------------------------------
  chartOfAccounts: [
    { code: '1010', name: 'Cash on Hand (Counter Petty Cash)', type: 'ASSET', normalBalance: 'DEBIT', balance: 44000 },
    { code: '1020', name: 'Bank & Digital QR (Fonepay / eSewa)', type: 'ASSET', normalBalance: 'DEBIT', balance: 135000 },
    { code: '1200', name: 'Student Accounts Receivable', type: 'ASSET', normalBalance: 'DEBIT', balance: 18500 },
    { code: '1250', name: 'Municipal & Institutional Project Receivables', type: 'ASSET', normalBalance: 'DEBIT', balance: 0 },
    { code: '1500', name: 'Vocational Training Equipment & Assets', type: 'ASSET', normalBalance: 'DEBIT', balance: 120000 },
    { code: '2010', name: 'Accounts Payable (Suppliers / Vendors)', type: 'LIABILITY', normalBalance: 'CREDIT', balance: 0 },
    { code: '2110', name: 'Trainer Commission Payable', type: 'LIABILITY', normalBalance: 'CREDIT', balance: 1500 },
    { code: '2120', name: 'Staff Salary Payable', type: 'LIABILITY', normalBalance: 'CREDIT', balance: 0 },
    { code: '2200', name: 'Advance / Unearned Student Fees', type: 'LIABILITY', normalBalance: 'CREDIT', balance: 0 },
    { code: '2300', name: 'TDS & Tax Withholding Payable', type: 'LIABILITY', normalBalance: 'CREDIT', balance: 0 },
    { code: '3010', name: "Owner's Capital", type: 'EQUITY', normalBalance: 'CREDIT', balance: 250000 },
    { code: '3020', name: 'Retained Earnings', type: 'EQUITY', normalBalance: 'CREDIT', balance: 19135 },
    { code: '4100', name: 'Vocational Course Training Revenue', type: 'REVENUE', normalBalance: 'CREDIT', balance: 35730 },
    { code: '4110', name: 'Student Admission Fees', type: 'REVENUE', normalBalance: 'CREDIT', balance: 5100 },
    { code: '4200', name: 'Municipality & Ward Project Revenue', type: 'REVENUE', normalBalance: 'CREDIT', balance: 0 },
    { code: '4300', name: 'Certificate & Skill Testing Fees', type: 'REVENUE', normalBalance: 'CREDIT', balance: 2500 },
    { code: '5100', name: 'Trainer Commission Expense', type: 'EXPENSE', normalBalance: 'DEBIT', balance: 5966 },
    { code: '5110', name: 'Trainer Fixed Salary Expense', type: 'EXPENSE', normalBalance: 'DEBIT', balance: 25000 },
    { code: '5200', name: 'Staff Payroll & Office Wages', type: 'EXPENSE', normalBalance: 'DEBIT', balance: 20000 },
    { code: '5300', name: 'Practical Raw Materials & Supplies', type: 'EXPENSE', normalBalance: 'DEBIT', balance: 14200 },
    { code: '5400', name: 'Center Rent & Electricity / Water', type: 'EXPENSE', normalBalance: 'DEBIT', balance: 37200 },
    { code: '5500', name: 'Marketing, Counseling & Social Ads', type: 'EXPENSE', normalBalance: 'DEBIT', balance: 6500 },
    { code: '5600', name: 'Repairs, Equipment Maintenance & IT', type: 'EXPENSE', normalBalance: 'DEBIT', balance: 3000 }
  ],

  journalEntries: [
    {
      id: 'JV-2026-0001',
      entryNumber: 'JV-2026-0001',
      entryDate: '2026-09-01',
      narration: 'संस्था स्थापना पुँजी दाखिला (Owner Capital Injection into Cash & Bank)',
      sourceModule: 'CAPITAL',
      sourceId: 'CAP-01',
      status: 'POSTED',
      postedBy: 'Super Admin',
      createdAt: '2026-09-01T08:00:00Z',
      lines: [
        { accountCode: '1010', accountName: 'Cash on Hand', debit: 50000, credit: 0, lineNarration: 'Initial petty cash' },
        { accountCode: '1020', accountName: 'Bank & Digital QR', debit: 200000, credit: 0, lineNarration: 'Nabil Bank opening balance' },
        { accountCode: '3010', accountName: "Owner's Capital", debit: 0, credit: 250000, lineNarration: 'Founder equity contribution' }
      ]
    },
    {
      id: 'JV-2026-0002',
      entryNumber: 'JV-2026-0002',
      entryDate: '2026-09-01',
      narration: 'विद्यार्थी Sunita Sharma भर्ना किस्ता संकलन (REC-2026-0001)',
      sourceModule: 'STUDENT_FEE',
      sourceId: 'REC-2026-0001',
      status: 'POSTED',
      postedBy: 'Cashier',
      createdAt: '2026-09-01T10:30:00Z',
      lines: [
        { accountCode: '1020', accountName: 'Bank & Digital QR', debit: 6000, credit: 0, lineNarration: 'Fonepay QR Collection' },
        { accountCode: '4100', accountName: 'Vocational Course Training Revenue', debit: 0, credit: 6000, lineNarration: 'Basic Beautician 1st Installment' }
      ]
    },
    {
      id: 'JV-2026-0003',
      entryNumber: 'JV-2026-0003',
      entryDate: '2026-09-01',
      narration: 'प्रशिक्षक Pooja Rajbanshi २५% कमिसन दायित्व खर्च (Accrual on REC-0001)',
      sourceModule: 'TRAINER_COMMISSION',
      sourceId: 'REC-2026-0001',
      status: 'POSTED',
      postedBy: 'System',
      createdAt: '2026-09-01T10:30:00Z',
      lines: [
        { accountCode: '5100', accountName: 'Trainer Commission Expense', debit: 1500, credit: 0, lineNarration: '25% on Rs. 6000 cash collection' },
        { accountCode: '2110', accountName: 'Trainer Commission Payable', debit: 0, credit: 1500, lineNarration: 'Liability payable to Pooja Rajbanshi' }
      ]
    },
    {
      id: 'JV-2026-0004',
      entryNumber: 'JV-2026-0004',
      entryDate: '2026-09-05',
      narration: 'जोरपाटी तालिम केन्द्र भवन भाडा तथा बत्ती भुक्तानी',
      sourceModule: 'EXPENSE',
      sourceId: 'EXP-001',
      status: 'POSTED',
      postedBy: 'Admin',
      createdAt: '2026-09-05T14:00:00Z',
      lines: [
        { accountCode: '5400', accountName: 'Center Rent & Electricity', debit: 35000, credit: 0, lineNarration: 'Rent & Electricity September' },
        { accountCode: '1020', accountName: 'Bank & Digital QR', debit: 0, credit: 35000, lineNarration: 'Bank cheque payment' }
      ]
    },
    {
      id: 'JV-2026-0005',
      entryNumber: 'JV-2026-0005',
      entryDate: '2026-09-10',
      narration: 'सिलाई तथा ब्युटिसियन प्रयोगात्मक कच्चा सामग्री खरिद',
      sourceModule: 'EXPENSE',
      sourceId: 'EXP-002',
      status: 'POSTED',
      postedBy: 'Admin',
      createdAt: '2026-09-10T16:00:00Z',
      lines: [
        { accountCode: '5300', accountName: 'Practical Raw Materials & Supplies', debit: 12000, credit: 0, lineNarration: 'Fabrics, thread, facial creams' },
        { accountCode: '1010', accountName: 'Cash on Hand', debit: 0, credit: 12000, lineNarration: 'Counter cash paid' }
      ]
    }
  ],

  expenses: [
    {
      id: 'EXP-001',
      voucherNo: 'EXP-2026-0001',
      date: '2026-09-05',
      category: 'Rent & Facilities',
      payee: 'Gokarneshwor Building Owner',
      amount: 35000,
      paymentMethod: 'Bank Transfer',
      accountCode: '5400',
      description: 'Prabidhik School Jorpati 3rd floor training center rent and water charges',
      status: 'Paid',
      recordedBy: 'Admin'
    },
    {
      id: 'EXP-002',
      voucherNo: 'EXP-2026-0002',
      date: '2026-09-10',
      category: 'Training Materials',
      payee: 'Newroad Wholesale Fabrics & Beauty Supplies',
      amount: 12000,
      paymentMethod: 'Cash',
      accountCode: '5300',
      description: 'Kurtha-suruwal fabrics, sewing machine needles, bleaching creams, and makeup sponges',
      status: 'Paid',
      recordedBy: 'Admin'
    },
    {
      id: 'EXP-003',
      voucherNo: 'EXP-2026-0003',
      date: '2026-09-20',
      category: 'Utilities & Internet',
      payee: 'WorldLink Communications',
      amount: 2200,
      paymentMethod: 'Fonepay / QR',
      accountCode: '5400',
      description: 'High-speed fiber internet subscription for computer lab and office',
      status: 'Paid',
      recordedBy: 'Cashier'
    },
    {
      id: 'EXP-004',
      voucherNo: 'EXP-2026-0004',
      date: '2026-10-02',
      category: 'Marketing & Counseling',
      payee: 'Facebook Ads / Creative Media',
      amount: 6500,
      paymentMethod: 'Bank Transfer',
      accountCode: '5500',
      description: 'Social media campaign for Autumn Caregiver and Beautician admissions',
      status: 'Paid',
      recordedBy: 'Admin'
    }
  ],

  projectContracts: [
    {
      id: 'PRJ-001',
      code: 'PRJ-GOKARNA-05',
      name: 'गोकर्णेश्वर नगरपालिका वडा नं. ५ महिला सीपमूलक तालिम (सिलाई तथा ब्युटिसियन)',
      fundingAgency: 'Gokarneshwor Municipality Ward 5 Office',
      contractValue: 450000,
      targetTrainees: 40,
      startDate: '2026-08-15',
      endDate: '2026-11-15',
      status: 'Ongoing',
      invoicedAmount: 225000,
      receivedAmount: 225000,
      pendingReceivable: 0,
      milestones: [
        { name: 'पहिलो किस्ता (तालिम सम्झौता तथा विद्यार्थी छनोट - ५०%)', amount: 225000, status: 'Received', date: '2026-08-20' },
        { name: 'दोस्रो किस्ता (अन्तिम परीक्षा तथा प्रमाणपत्र वितरण - ५०%)', amount: 225000, status: 'Pending', date: '2026-11-20' }
      ]
    }
  ],

  cashClosings: [
    {
      id: 'CSH-CLOSE-001',
      closingDate: '2026-10-25',
      openingBalance: 32000,
      cashReceived: 18000,
      cashPaid: 6000,
      expectedClosing: 44000,
      physicalCount: 44000,
      variance: 0,
      notes: 'दैनिक काउन्टर नगद मिलान पूर्ण रूपमा मिलेको (Matched)',
      closedBy: 'Cashier Staff'
    }
  ],

  settings: {
    instituteName: 'GLOBAL ERA MULTI SERVICE PVT. LTD. / GLOBAL ERA TECHNICAL SCHOOL',
    instituteSub: 'ग्लोबल एरा प्राविधिक स्कुल',
    location: 'Jorpati, Gokarneshwor-05, Kathmandu, Nepal',
    contactPhone: '+977-1-4915678 / 9851234567',
    email: 'info@globalera.edu.np',
    aakashSmsToken: '',
    enableAutoSmsOnAbsent: true,
    enableWhatsAppDirect: true,
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL || 'https://yycybsmwuixixfmocrcz.supabase.co',
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_e8g5bAQNbCGpuI3aC0P1SA_Lb02m1cO',
    companyProfile: {
      companyNameEnglish: 'GLOBAL ERA MULTI SERVICE PVT. LTD. / GLOBAL ERA TECHNICAL SCHOOL',
      companyNameNepali: 'ग्लोबल एरा प्राविधिक स्कुल',
      address: 'Jorpati, Gokarneshwor-05, Kathmandu, Nepal',
      contactPhone: '+977-1-4915678 / 9851234567',
      email: 'info@globalera.edu.np',
      website: 'https://globalera.edu.np',
      companyRegNo: '184920/078/079',
      ctevtCode: '4208',
      panNo: '609823412',
      directorName: 'गोकर्ण थापा (Gokarna Thapa)',
      directorTitle: 'क्याम्पस प्रमुख / निर्देशक (Managing Director)',
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
      lastSyncTime: 'आज, ०७:४५ AM',
      morningShiftStart: '07:00',
      dayShiftStart: '11:00',
      eveningShiftStart: '15:00',
      lateGraceMinutes: 15,
      allowTrainerManualOverride: true,
      autoSmsOnAbsent: true
    }
  },
  parties: [
    {
      id: 'PRT-LANDLORD-01',
      name: 'राम कुमार श्रेष्ठ (घरधनी - मुख्य भवन)',
      category: 'LANDLORD',
      contactPerson: 'राम कुमार श्रेष्ठ',
      phone: '9851011122',
      panNumber: '302918273',
      address: 'Jorpati-05, Gokarneshwor, Kathmandu',
      bankName: 'Global IME Bank',
      accountNumber: '01201010049281',
      accountHolderName: 'Ram Kumar Shrestha',
      monthlyRent: 50000,
      securityDeposit: 150000,
      tdsPercent: 10,
      advanceRentBalance: 50000,
      totalPurchases: 600000,
      totalPaid: 550000,
      currentDue: 50000,
      notes: 'मुख्य इन्स्टिच्युट भवन भाडा सम्झौता (साउन-असार). हरेक महिना १ गते भाडा बिल आउने।'
    },
    {
      id: 'PRT-SUPPLIER-01',
      name: 'न्यू महालक्ष्मी हार्डवेयर तथा मेसिनरी स्टोर',
      category: 'TECHNICAL_SUPPLIER',
      contactPerson: 'महेश महर्जन',
      phone: '9841887766',
      panNumber: '601928374',
      address: 'Chabahil, Kathmandu',
      bankName: 'Nabil Bank',
      accountNumber: '0010009281928',
      accountHolderName: 'New Mahalaxmi Hardware Store',
      totalPurchases: 85000,
      totalPaid: 65000,
      currentDue: 20000,
      notes: 'वेल्डिङ, प्लम्बिङ र इलेक्ट्रिकल प्राविधिक तालिमका औजार तथा कच्चा पदार्थ आपूर्तिकर्ता'
    },
    {
      id: 'PRT-UTILITY-01',
      name: 'वर्ल्डलिङ्क कम्युनिकेशन्स प्रा.लि. (इन्टरनेट)',
      category: 'UTILITY_SERVICE',
      contactPerson: 'ग्राहक सेवा (Customer Support)',
      phone: '01-4911222',
      panNumber: '300182910',
      address: 'Jawalakhel, Lalitpur',
      bankName: 'ConnectIPS / eSewa Online',
      accountNumber: 'WLINK-CORP-4820',
      accountHolderName: 'WorldLink Communications Ltd.',
      totalPurchases: 42000,
      totalPaid: 38500,
      currentDue: 3500,
      notes: 'कम्प्युटर ल्याब तथा कार्यालय २०० Mbps डेडिकेटेड फाइबर इन्टरनेट (मासिक बिल रु. ३,५००)'
    },
    {
      id: 'PRT-STATIONERY-01',
      name: 'क्रिएटिभ प्रिन्टिङ तथा स्टेशनरी सप्लायर्स',
      category: 'STATIONERY_MEDIA',
      contactPerson: 'दिनेश कार्की',
      phone: '9851098765',
      panNumber: '601293847',
      address: 'Bagbazar, Kathmandu',
      bankName: 'NIC Asia Bank',
      accountNumber: '2450091827364',
      accountHolderName: 'Creative Printing & Stationery',
      totalPurchases: 35000,
      totalPaid: 28000,
      currentDue: 7000,
      notes: 'विद्यार्थी परिचयपत्र, पाठ्यक्रम नोटबही र फ्लेक्स ब्यानर मुद्रण'
    }
  ],
  users: []
};

// Auto-seed default users in seed data
INITIAL_SEED_DATA.users = generateDefaultUsers(INITIAL_SEED_DATA.trainers, INITIAL_SEED_DATA.students);

const DB_KEY = 'kite_tvet_erp_data_v1';

export function loadDB() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) {
      localStorage.setItem(DB_KEY, JSON.stringify(INITIAL_SEED_DATA));
      return INITIAL_SEED_DATA;
    }
    const parsed = JSON.parse(raw);
    const existingUsers = (parsed.users && parsed.users.length > 0)
      ? parsed.users
      : generateDefaultUsers(parsed.trainers || INITIAL_SEED_DATA.trainers, parsed.students || INITIAL_SEED_DATA.students);

    return {
      ...INITIAL_SEED_DATA,
      ...parsed,
      biometricLogs: (parsed.biometricLogs && parsed.biometricLogs.length > 0)
        ? parsed.biometricLogs
        : INITIAL_SEED_DATA.biometricLogs || [],
      students: (parsed.students || INITIAL_SEED_DATA.students).map((s, idx) => ({
        ...s,
        biometricId: s.biometricId || String(1001 + idx)
      })),
      trainers: (parsed.trainers || INITIAL_SEED_DATA.trainers).map((t, idx) => ({
        ...t,
        biometricId: t.biometricId || String(2001 + idx)
      })),
      users: existingUsers,
      jobOpenings: parsed.jobOpenings || INITIAL_SEED_DATA.jobOpenings || [],
      jobApplications: parsed.jobApplications || INITIAL_SEED_DATA.jobApplications || [],
      holidays: parsed.holidays || INITIAL_SEED_DATA.holidays,
      notices: parsed.notices || INITIAL_SEED_DATA.notices,
      smsTemplates: parsed.smsTemplates || INITIAL_SEED_DATA.smsTemplates,
      communicationLogs: parsed.communicationLogs || INITIAL_SEED_DATA.communicationLogs,
      snapshots: parsed.snapshots || INITIAL_SEED_DATA.snapshots,
      auditLogs: parsed.auditLogs || INITIAL_SEED_DATA.auditLogs,
      studentNotes: parsed.studentNotes || INITIAL_SEED_DATA.studentNotes || [],
      leads: parsed.leads || INITIAL_SEED_DATA.leads || [],
      agents: (parsed.agents && parsed.agents.length > 0) ? parsed.agents : INITIAL_SEED_DATA.agents || [],
      admissions: parsed.admissions || INITIAL_SEED_DATA.admissions || [],
      parties: (parsed.parties && parsed.parties.length > 0) ? parsed.parties : INITIAL_SEED_DATA.parties || [],
      payments: parsed.payments || INITIAL_SEED_DATA.payments || [],
      trainerPayouts: parsed.trainerPayouts || INITIAL_SEED_DATA.trainerPayouts || [],
      chartOfAccounts: parsed.chartOfAccounts || INITIAL_SEED_DATA.chartOfAccounts || [],
      journalEntries: parsed.journalEntries || INITIAL_SEED_DATA.journalEntries || [],
      expenses: parsed.expenses || INITIAL_SEED_DATA.expenses || [],
      projectContracts: parsed.projectContracts || INITIAL_SEED_DATA.projectContracts || [],
      cashClosings: parsed.cashClosings || INITIAL_SEED_DATA.cashClosings || [],
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
  } catch (err) {
    console.error('Error loading database:', err);
    return INITIAL_SEED_DATA;
  }
}

export function saveDB(data) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event('kite_db_updated'));
  } catch (err) {
    console.error('Error saving database:', err);
  }
}

export function resetDB() {
  localStorage.setItem(DB_KEY, JSON.stringify(INITIAL_SEED_DATA));
  window.dispatchEvent(new Event('kite_db_updated'));
  return INITIAL_SEED_DATA;
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
    return { isHoliday: true, name: 'शनिबार (Saturday Regular Holiday)', type: 'Weekly Off' };
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
