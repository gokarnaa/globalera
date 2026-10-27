import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  Typography,
  Box,
  IconButton,
  Alert,
  Divider,
  Paper,
  Chip,
  RadioGroup,
  FormControlLabel,
  Radio,
  Stack,
  FormControl,
  FormLabel,
  Avatar
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import SchoolIcon from '@mui/icons-material/School';
import PaymentsIcon from '@mui/icons-material/Payments';
import WorkIcon from '@mui/icons-material/Work';
import confetti from 'canvas-confetti';

import { saveDB, calculateExpectedEndDate, postDoubleEntryJournal } from '../../services/storage';

export default function NewAdmissionModal({ open, onClose, db, setDb, showToast, onAdmissionCreated }) {
  // Personal Info
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [secondaryPhone, setSecondaryPhone] = useState('');
  const [gender, setGender] = useState('Female');
  const [bloodGroup, setBloodGroup] = useState('O+ve');
  const [photoUrl, setPhotoUrl] = useState('https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80');
  const [citizenshipNumber, setCitizenshipNumber] = useState('');
  const [currentAddress, setCurrentAddress] = useState('Gokarneshwor, Kathmandu');
  const [permanentAddress, setPermanentAddress] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [guardianContact, setGuardianContact] = useState('');

  // Course & Batch
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [keySkills, setKeySkills] = useState('');
  const [ojtPreference, setOjtPreference] = useState('REQUIRED');

  // Fee & 50% Rule
  const [totalCourseFee, setTotalCourseFee] = useState(15000);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [advancePaid, setAdvancePaid] = useState(7500);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [remarks, setRemarks] = useState('भर्ना सम्झौता - ५०% अग्रिम शुल्क');

  const [errorMsg, setErrorMsg] = useState('');

  // Dates
  const todayStr = new Date().toISOString().slice(0, 10);
  const [admissionDate, setAdmissionDate] = useState(todayStr);

  // 30 days due date calculation
  const calculatedDueDate = React.useMemo(() => {
    try {
      const d = new Date(admissionDate);
      d.setDate(d.getDate() + 30);
      return d.toISOString().slice(0, 10);
    } catch {
      return todayStr;
    }
  }, [admissionDate, todayStr]);

  // Net payable fee
  const netPayableFee = Math.max(0, (Number(totalCourseFee) || 0) - (Number(discountAmount) || 0));
  const dueAmount50 = Math.max(0, netPayableFee - (Number(advancePaid) || 0));
  const selectedCourseObj = (db.courses || []).find((c) => c.id === selectedCourseId);
  const isFullOnlyCourse = selectedCourseObj?.feeStructure?.paymentMode === 'FULL_ONLY';

  // Auto-select first course on open
  useEffect(() => {
    if (!open) return;
    setErrorMsg('');
    if (db.courses && db.courses.length > 0 && !selectedCourseId) {
      const firstCourse = db.courses[0];
      setSelectedCourseId(firstCourse.id);
      const fs = firstCourse.feeStructure;
      const price = firstCourse.price || 15000;
      setTotalCourseFee(price);
      setKeySkills(firstCourse.description || '');
      if (fs?.paymentMode === 'FULL_ONLY') {
        setDiscountAmount(0);
        setAdvancePaid(price);
      } else {
        setAdvancePaid(Math.round(price * 0.5));
      }
    }
  }, [open, db.courses]);

  // When course changes, update groups and price
  const handleCourseChange = (courseId) => {
    setSelectedCourseId(courseId);
    const crs = (db.courses || []).find((c) => c.id === courseId);
    if (crs) {
      const fs = crs.feeStructure;
      const price = crs.price || 15000;
      setTotalCourseFee(price);
      setKeySkills(crs.description || '');
      if (fs?.paymentMode === 'FULL_ONLY') {
        setDiscountAmount(0);
        setAdvancePaid(price);
      } else {
        const net = Math.max(0, price - discountAmount);
        setAdvancePaid(Math.round(net * 0.5));
      }

      // Find matching group
      const matchingGroup = (db.trainingGroups || []).find((g) => g.courseId === courseId);
      if (matchingGroup) {
        setSelectedGroupId(matchingGroup.id);
      } else {
        setSelectedGroupId('');
      }
    }
  };

  // When discount changes, update 50% advance automatically
  const handleDiscountChange = (val) => {
    const disc = Number(val) || 0;
    setDiscountAmount(disc);
    const net = Math.max(0, (Number(totalCourseFee) || 0) - disc);
    setAdvancePaid(Math.round(net * 0.5));
  };

  // Matching groups for selected course
  const availableGroups = (db.trainingGroups || []).filter(
    (g) => !selectedCourseId || g.courseId === selectedCourseId
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('विद्यार्थीको पूरा नाम अनिवार्य छ।');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('मोबाइल नम्बर अनिवार्य छ।');
      return;
    }
    if (!selectedCourseId) {
      setErrorMsg('कृपया तालिम / कोर्स छनोट गर्नुहोस्।');
      return;
    }

    const courseObj = (db.courses || []).find((c) => c.id === selectedCourseId);
    const groupObj = (db.trainingGroups || []).find((g) => g.id === selectedGroupId) || availableGroups[0] || {};

    // Auto-generate TGID
    const existingTgids = (db.students || [])
      .map((s) => {
        const match = s.tgid && s.tgid.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    const nextNum = existingTgids.length ? Math.max(...existingTgids) + 1 : 101;
    const generatedTgid = `TGID-${nextNum}`;
    const studentId = `STD-${String(nextNum).padStart(2, '0')}`;

    // Expected End Date
    const endDate = groupObj.endDate || calculateExpectedEndDate(admissionDate, courseObj?.durationValue || 3, courseObj?.durationUnit || 'Months');

    // 1. Create Student record
    const newStudent = {
      id: studentId,
      tgid: generatedTgid,
      name: name.trim(),
      phone: phone.trim(),
      secondaryPhone: secondaryPhone.trim(),
      gender,
      bloodGroup,
      photoUrl,
      expectedEndDate: endDate,
      citizenshipNumber: citizenshipNumber.trim(),
      citizenshipDistrict: 'Kathmandu',
      currentAddress: currentAddress.trim(),
      permanentAddress: permanentAddress.trim() || currentAddress.trim(),
      fatherName: fatherName.trim(),
      motherName: '',
      guardianContact: guardianContact.trim() || phone.trim(),
      groupId: groupObj.id || 'GRP-01',
      admissionDate,
      status: 'Active'
    };

    // 2. Create Receipt & Payment Record (50% Advance)
    const receiptNo = `REC-ADM-${Date.now().toString().slice(-6)}`;
    const newPayment = {
      id: `PMT-${Date.now()}`,
      studentId,
      groupId: groupObj.id || 'GRP-01',
      amount: Number(advancePaid) || 0,
      paymentMethod,
      paymentDate: admissionDate,
      receiptNo,
      remarks: `${remarks} (${name.trim()})`,
      collectedBy: 'Admission Desk'
    };

    // 3. Create Admission Agreement Record
    const agreementCount = (db.admissions || []).length + 1;
    const agreementNo = `GE-AGR-2081-${String(agreementCount).padStart(3, '0')}`;

    const newAdmission = {
      id: `ADM-${Date.now()}`,
      agreementNo,
      studentId,
      tgid: generatedTgid,
      studentName: name.trim(),
      phone: phone.trim(),
      secondaryPhone: secondaryPhone.trim(),
      gender,
      bloodGroup,
      photoUrl,
      expectedEndDate: endDate,
      citizenshipNumber: citizenshipNumber.trim(),
      currentAddress: currentAddress.trim(),
      permanentAddress: permanentAddress.trim() || currentAddress.trim(),
      fatherName: fatherName.trim(),
      guardianContact: guardianContact.trim(),

      courseId: courseObj?.id || selectedCourseId,
      courseTitle: courseObj?.title || 'व्यावसायिक तालिम',
      groupId: groupObj.id || 'GRP-01',
      groupName: groupObj.name || 'Batch 1',
      shift: groupObj.shift || 'Shift A',
      timing: groupObj.timing || '07:00 AM – 09:00 AM',
      duration: `${courseObj?.durationValue || 3} ${courseObj?.durationUnit || 'Months'} (${courseObj?.totalHours || 390} घण्टा)`,
      keySkills: keySkills.trim() || courseObj?.description || '',

      ojtPreference,
      ojtFee: 0,
      batchTransferAllowed: true,

      totalCourseFee: Number(totalCourseFee) || 0,
      discountAmount: Number(discountAmount) || 0,
      netPayableFee,
      advancePaid50: Number(advancePaid) || 0,
      dueAmount50,
      dueDate: calculatedDueDate,
      paymentMethod,
      receiptNo,

      admissionDate,
      admissionDateBS: '२०८१/' + admissionDate.slice(5).replace('-', '/'),
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    };

    // 4. Update Database
    const updatedStudents = [newStudent, ...(db.students || [])];
    const updatedPayments = [newPayment, ...(db.payments || [])];
    const updatedAdmissions = [newAdmission, ...(db.admissions || [])];

    // Update group enrollment count
    const updatedGroups = (db.trainingGroups || []).map((g) => {
      if (g.id === groupObj.id) {
        return { ...g, currentTrainees: (g.currentTrainees || 0) + 1 };
      }
      return g;
    });

    const nextDb = {
      ...db,
      students: updatedStudents,
      payments: updatedPayments,
      trainingGroups: updatedGroups,
      admissions: updatedAdmissions
    };

    // Post double entry journal for 50% advance fee
    try {
      postDoubleEntryJournal(
        nextDb,
        {
          date: admissionDate,
          voucherType: 'RECEIPT',
          referenceNo: receiptNo,
          narration: `विद्यार्थी भर्ना ५०% अग्रिम शुल्क: ${name.trim()} (${courseObj?.title || ''}) सम्झौता नं ${agreementNo}`,
          createdBy: 'Admission Desk',
          lines: [
            {
              accountCode: paymentMethod === 'Bank' ? '1020' : '1010', // Bank or Cash
              description: `५०% भर्ना शुल्क संकलन (${paymentMethod})`,
              debit: Number(advancePaid) || 0,
              credit: 0
            },
            {
              accountCode: '4010', // Student Tuition & Training Revenue
              description: `विद्यार्थी भर्ना आम्दानी - ${name.trim()}`,
              debit: 0,
              credit: Number(advancePaid) || 0
            }
          ]
        },
        () => {}
      );
    } catch (err) {
      console.warn('Journal post notice:', err);
    }

    saveDB(nextDb);
    setDb(nextDb);

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    if (showToast) {
      showToast(`विद्यार्थी ${name} को भर्ना तथा सम्झौता सफलतापूर्वक सम्पन्न भयो!`, 'success');
    }

    if (onAdmissionCreated) {
      onAdmissionCreated(newAdmission);
    }

    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle
        sx={{
          background: 'linear-gradient(135deg, #0F2E5A 0%, #1E40AF 100%)',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          py: 2.2,
          px: 3,
          borderBottom: '3px solid #F59E0B'
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.15)', color: '#F59E0B', width: 44, height: 44, borderRadius: 2.5, border: '1px solid rgba(255, 255, 255, 0.25)' }}>
            <HowToRegIcon sx={{ fontSize: 26 }} />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900, fontSize: '1.05rem', lineHeight: 1.2 }}>
              नयाँ विद्यार्थी भर्ना तथा तालिम सम्झौता (New Admission)
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.74rem' }}>
              ५०% अग्रिम भुक्तानी, OJT रोजाइ र २-प्रति A4 सम्झौता पत्र प्रणाली
            </Typography>
          </Box>
        </Stack>
        <IconButton onClick={onClose} sx={{ color: 'rgba(255, 255, 255, 0.85)', bgcolor: 'rgba(255, 255, 255, 0.1)', '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.25)', color: '#ffffff' } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 2, sm: 3.5 }, bgcolor: '#f8fafc' }}>
        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2.5 }}>
            {errorMsg}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          {/* Section 1: Student Personal Details */}
          <Paper elevation={0} sx={{ p: 2.5, mb: 3, border: '1px solid #e2e8f0', borderRadius: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <SchoolIcon sx={{ color: '#0f2e5a' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f2e5a' }}>
                १. विद्यार्थीको व्यक्तिगत विवरण (Student Details)
              </Typography>
            </Stack>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="विद्यार्थीको पूरा नाम (Full Name)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="उदा: सुनिता शर्मा"
                  size="small"
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  required
                  label="मोबाइल नं (Mobile No)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="98XXXXXXXX"
                  size="small"
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="वैकल्पिक फोन (Secondary Phone)"
                  value={secondaryPhone}
                  onChange={(e) => setSecondaryPhone(e.target.value)}
                  size="small"
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  select
                  fullWidth
                  label="लिङ्ग (Gender)"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  size="small"
                >
                  <MenuItem value="Female">महिला (Female)</MenuItem>
                  <MenuItem value="Male">पुरुष (Male)</MenuItem>
                  <MenuItem value="Other">अन्य (Other)</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  select
                  fullWidth
                  label="रक्त समूह (Blood Group)"
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  size="small"
                >
                  <MenuItem value="O+ve">O +ve (O Positive)</MenuItem>
                  <MenuItem value="A+ve">A +ve (A Positive)</MenuItem>
                  <MenuItem value="B+ve">B +ve (B Positive)</MenuItem>
                  <MenuItem value="AB+ve">AB +ve (AB Positive)</MenuItem>
                  <MenuItem value="O-ve">O -ve (O Negative)</MenuItem>
                  <MenuItem value="A-ve">A -ve (A Negative)</MenuItem>
                  <MenuItem value="B-ve">B -ve (B Negative)</MenuItem>
                  <MenuItem value="AB-ve">AB -ve (AB Negative)</MenuItem>
                  <MenuItem value="Unknown">थाहा छैन (Unknown)</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="नागरिकता / परिचयपत्र नं"
                  value={citizenshipNumber}
                  onChange={(e) => setCitizenshipNumber(e.target.value)}
                  placeholder="उदा: २७-०१-७६-०१२३४"
                  size="small"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="हालको ठेगाना (Current Address)"
                  value={currentAddress}
                  onChange={(e) => setCurrentAddress(e.target.value)}
                  placeholder="उदा: जोरपाटी, काठमाडौँ"
                  size="small"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="स्थायी ठेगाना (Permanent Address)"
                  value={permanentAddress}
                  onChange={(e) => setPermanentAddress(e.target.value)}
                  placeholder="उदा: मेलम्ची-०३, सिन्धुपाल्चोक"
                  size="small"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="बुबा वा आमाको नाम (Guardian / Parent Name)"
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  size="small"
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Section 2: Course, Batch & OJT Details */}
          <Paper elevation={0} sx={{ p: 2.5, mb: 3, border: '1px solid #e2e8f0', borderRadius: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <WorkIcon sx={{ color: '#0f2e5a' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f2e5a' }}>
                २. तालिम, ब्याच तथा OJT प्राथमिकता (Course & Training Details)
              </Typography>
            </Stack>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  required
                  label="तालिम / कोर्स छनोट (Select Course)"
                  value={selectedCourseId}
                  onChange={(e) => handleCourseChange(e.target.value)}
                  size="small"
                >
                  {(db.courses || []).map((crs) => (
                    <MenuItem key={crs.id} value={crs.id}>
                      {crs.title} — रु. {(crs.price || 0).toLocaleString()} ({crs.totalHours || 390} घण्टा)
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="ब्याच / समूह (Training Group / Batch)"
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  size="small"
                >
                  {availableGroups.length > 0 ? (
                    availableGroups.map((grp) => (
                      <MenuItem key={grp.id} value={grp.id}>
                        {grp.name} — {grp.shift} ({grp.timing})
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem value="">कुनै समूह उपलब्ध छैन (नयाँ सिर्जना हुनेछ)</MenuItem>
                  )}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  type="date"
                  fullWidth
                  label="भर्ना मिति (Admission Date)"
                  value={admissionDate}
                  onChange={(e) => setAdmissionDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 1, border: '1px solid #e2e8f0', borderRadius: 1, bgcolor: '#f8fafc' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', display: 'block' }}>
                    OJT (On-the-Job Training) इन्टर्नशिप सुविधा रोजाइ:
                  </Typography>
                  <RadioGroup
                    row
                    value={ojtPreference}
                    onChange={(e) => setOjtPreference(e.target.value)}
                  >
                    <FormControlLabel
                      value="REQUIRED"
                      control={<Radio size="small" color="primary" />}
                      label={<Typography variant="body2" sx={{ fontWeight: 700, color: '#065f46' }}>आवश्यक छ (निःशुल्क)</Typography>}
                    />
                    <FormControlLabel
                      value="NOT_REQUIRED"
                      control={<Radio size="small" color="secondary" />}
                      label={<Typography variant="body2" sx={{ color: '#64748b' }}>आवश्यक छैन</Typography>}
                    />
                  </RadioGroup>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="तालिममा सिकाइने मुख्य सीपहरू (Curriculum / Key Skills to Learn)"
                  value={keySkills}
                  onChange={(e) => setKeySkills(e.target.value)}
                  size="small"
                  helperText="यो विवरण सम्झौता पत्रको खण्ड २ मा छापिनेछ।"
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Section 3: Fee Structure & 50% Rule */}
          <Paper elevation={0} sx={{ p: 2.5, mb: 1, border: '1.5px solid #0f2e5a', borderRadius: 2, bgcolor: '#ffffff' }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <PaymentsIcon sx={{ color: '#0f2e5a' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f2e5a' }}>
                ३. शुल्क संरचना तथा भुक्तानी सर्त (५०% अग्रिम र बाँकी १ महिनाभित्र)
              </Typography>
            </Stack>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="कुल तोकिएको कोर्स शुल्क (Rs.)"
                  value={totalCourseFee}
                  onChange={(e) => {
                    const price = Number(e.target.value) || 0;
                    setTotalCourseFee(price);
                    const net = Math.max(0, price - discountAmount);
                    setAdvancePaid(Math.round(net * 0.5));
                  }}
                  size="small"
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="स्वीकृत छुट रकम (Discount Rs.)"
                  value={discountAmount}
                  onChange={(e) => handleDiscountChange(e.target.value)}
                  size="small"
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <Box sx={{ p: 1, bgcolor: '#f1f5f9', borderRadius: 1, border: '1px solid #cbd5e1' }}>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>खुद तिर्नुपर्ने शुल्क (Net Payable):</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f2e5a' }}>
                    रु. {netPayableFee.toLocaleString()}
                  </Typography>
                </Box>
              </Grid>

              {/* Advance Payment Box (50% or 100% Full Upfront for Basic Course) */}
              <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 2, bgcolor: isFullOnlyCourse ? '#eff6ff' : '#ecfdf5', border: `1.5px solid ${isFullOnlyCourse ? '#3b82f6' : '#10b981'}`, borderRadius: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isFullOnlyCourse ? '#1d4ed8' : '#065f46', mb: 1 }}>
                    {isFullOnlyCourse ? '⚡ एकमुष्ट भुक्तानी (१००% भर्नामै तिर्नुपर्ने):' : 'पहिलो किस्ता (भर्नाको समयमा ५०% अग्रिम रकम):'}
                  </Typography>
                  <TextField
                    fullWidth
                    type="number"
                    required
                    value={advancePaid}
                    onChange={(e) => setAdvancePaid(Number(e.target.value) || 0)}
                    size="small"
                    sx={{ bgcolor: '#ffffff', borderRadius: 1 }}
                  />
                  <Typography variant="caption" sx={{ color: isFullOnlyCourse ? '#1e40af' : '#047857', display: 'block', mt: 0.8, fontWeight: 700 }}>
                    {isFullOnlyCourse
                      ? '⚡ यो बेसिक कोर्समा किस्ता सुविधा छैन, भर्नाकै समयमा पूरा रकम चुक्ता हुन्छ।'
                      : `* विद्यार्थीले ५०% (रु. ${Math.round(netPayableFee * 0.5).toLocaleString()}) वा सोभन्दा बढी रकम बुझाउनुपर्नेछ।`}
                  </Typography>
                </Paper>
              </Grid>

              {/* Remaining Due Box */}
              <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 2, bgcolor: isFullOnlyCourse && dueAmount50 === 0 ? '#f0fdf4' : '#fff1f2', border: `1.5px solid ${isFullOnlyCourse && dueAmount50 === 0 ? '#22c55e' : '#f43f5e'}`, borderRadius: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isFullOnlyCourse && dueAmount50 === 0 ? '#15803d' : '#9f1239', mb: 1 }}>
                    {isFullOnlyCourse ? 'बाँकी बक्यौता (बेसिक कोर्स):' : 'दोस्रो किस्ता (बाँकी ५०% रकम):'}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 900, color: isFullOnlyCourse && dueAmount50 === 0 ? '#15803d' : '#be123c', mb: 0.5 }}>
                    रु. {dueAmount50.toLocaleString()}
                  </Typography>
                  <Box sx={{ bgcolor: '#ffffff', p: 0.8, borderRadius: 1, border: `1px solid ${isFullOnlyCourse && dueAmount50 === 0 ? '#bbf7d0' : '#fecdd3'}` }}>
                    {isFullOnlyCourse && dueAmount50 === 0 ? (
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#16a34a', display: 'block' }}>
                        ✓ सम्पूर्ण शुल्क चुक्ता (Full Paid at Admission)
                      </Typography>
                    ) : (
                      <>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#9f1239', display: 'block' }}>
                          भुक्तानी गरिसक्नुपर्ने अन्तिम मिति: {calculatedDueDate}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#e11d48' }}>
                          (तालिम सुरु भएको ३० दिन / १ महिना भित्र अनिवार्य)
                        </Typography>
                      </>
                    )}
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="भुक्तानी माध्यम (Payment Method)"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  size="small"
                >
                  <MenuItem value="Cash">नगद (Cash)</MenuItem>
                  <MenuItem value="eSewa">eSewa</MenuItem>
                  <MenuItem value="Khalti">Khalti</MenuItem>
                  <MenuItem value="Fonepay">Fonepay QR</MenuItem>
                  <MenuItem value="Bank">Bank Deposit / Transfer</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="भुक्तानी कैफियत (Payment Remarks)"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  size="small"
                />
              </Grid>
            </Grid>
          </Paper>

          <DialogActions sx={{ px: 0, pt: 3, justifyContent: 'space-between' }}>
            <Button onClick={onClose} color="inherit" sx={{ fontWeight: 600 }}>
              रद्द गर्नुहोस् (Cancel)
            </Button>
            <Button
              type="submit"
              variant="contained"
              size="large"
              startIcon={<HowToRegIcon />}
              sx={{
                bgcolor: '#0f2e5a',
                color: '#ffffff',
                fontWeight: 800,
                px: 4,
                '&:hover': { bgcolor: '#1e3a8a' }
              }}
            >
              भर्ना सुरक्षित गरी सम्झौता तयार गर्नुहोस् (Enroll & Generate Agreement)
            </Button>
          </DialogActions>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
