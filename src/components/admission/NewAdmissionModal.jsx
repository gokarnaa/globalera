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

import {
  saveDB,
  calculateExpectedEndDate,
  postDoubleEntryJournal,
  getNextSequentialId,
  getNextBiometricId
} from '../../services/storage';

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
  const [remarks, setRemarks] = useState('Admission Agreement - 50% Advance Fee');

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
      setErrorMsg('Full student name is required.');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('Mobile number is required.');
      return;
    }
    if (!selectedCourseId) {
      setErrorMsg('Please select a training course.');
      return;
    }

    const courseObj = (db.courses || []).find((c) => c.id === selectedCourseId);
    const groupObj = (db.trainingGroups || []).find((g) => g.id === selectedGroupId) || availableGroups[0] || {};

    // Auto-generate collision-free TGID, Student ID, and Biometric ID
    const generatedTgid = getNextSequentialId(db.students || [], 'TGID-', 3, 'tgid', 101);
    const studentId = getNextSequentialId(db.students || [], 'STD-', 2, 'id', 1);
    const biometricId = getNextBiometricId(db.students || [], 1001);

    // Expected End Date
    const endDate =
      groupObj.expectedEndDate ||
      groupObj.endDate ||
      calculateExpectedEndDate(admissionDate, courseObj?.durationValue || 3, courseObj?.durationUnit || 'Months');

    // 1. Create Student record (with fee breakdown & biometric ID synced)
    const newStudent = {
      id: studentId,
      tgid: generatedTgid,
      biometricId,
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
      status: 'Active',
      originalFee: Number(totalCourseFee) || 0,
      discountAmount: Number(discountAmount) || 0,
      admissionFee: 0,
      lockedCourseFee: netPayableFee
    };

    // 2. Create Receipt & Payment Record (50% Advance)
    const receiptNo = `REC-ADM-${Date.now().toString().slice(-6)}`;
    const newPayment = {
      id: `PMT-${Date.now()}`,
      studentId,
      studentName: name.trim(),
      tgid: generatedTgid,
      groupId: groupObj.id || 'GRP-01',
      courseName: courseObj?.title || 'Vocational Training',
      amount: Number(advancePaid) || 0,
      paymentMethod,
      paymentDate: admissionDate,
      paymentMonth: 'Admission',
      receiptNo,
      remarks: `${remarks} (${name.trim()})`,
      receivedBy: 'Admission Desk',
      collectedBy: 'Admission Desk'
    };

    // 3. Create Admission Agreement Record
    const agreementCount = (db.admissions || []).length + 1;
    const agreementNo = `GE-AGR-2025-${String(agreementCount).padStart(3, '0')}`;

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
      courseTitle: courseObj?.title || 'Vocational Training',
      groupId: groupObj.id || 'GRP-01',
      groupName: groupObj.groupCode || groupObj.name || 'Batch 1',
      shift: groupObj.shift || 'Shift A',
      timing: groupObj.timing || '07:00 AM – 09:00 AM',
      duration: `${courseObj?.durationValue || 3} ${courseObj?.durationUnit || 'Months'} (${courseObj?.totalHours || 390} Hours)`,
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
      admissionDateBS: admissionDate,
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

    let finalDb = {
      ...db,
      students: updatedStudents,
      payments: updatedPayments,
      trainingGroups: updatedGroups,
      admissions: updatedAdmissions
    };

    // Post double entry journal for 50% advance fee without losing the journal entry
    const advanceAmt = Number(advancePaid) || 0;
    if (advanceAmt > 0) {
      try {
        const { nextDb: dbWithJournal } = postDoubleEntryJournal(finalDb, {
          entryDate: admissionDate,
          sourceModule: 'ADMISSION',
          sourceId: receiptNo,
          narration: `Trainee Admission 50% Advance Fee: ${name.trim()} (${courseObj?.title || ''}) Agreement No ${agreementNo}`,
          createdBy: 'Admission Desk',
          lines: [
            {
              accountCode: paymentMethod !== 'Cash' ? '1020' : '1010',
              lineNarration: `50% Admission Fee Collection (${paymentMethod})`,
              debit: advanceAmt,
              credit: 0
            },
            {
              accountCode: '4100',
              lineNarration: `Trainee Admission Revenue - ${name.trim()}`,
              debit: 0,
              credit: advanceAmt
            }
          ]
        });
        if (dbWithJournal) {
          finalDb = dbWithJournal;
        }
      } catch (err) {
        console.warn('Journal post notice:', err);
      }
    }

    saveDB(finalDb);
    setDb(finalDb);

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    if (showToast) {
      showToast(`Student ${name} successfully admitted with agreement created!`, 'success');
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
              New Student Admission & Training Agreement
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.74rem' }}>
              50% advance collection, OJT preference & dual-copy A4 agreement system
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
                1. Student Personal Details
              </Typography>
            </Stack>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sunita Sharma"
                  size="small"
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  required
                  label="Mobile Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="98XXXXXXXX"
                  size="small"
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Secondary Phone"
                  value={secondaryPhone}
                  onChange={(e) => setSecondaryPhone(e.target.value)}
                  size="small"
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  select
                  fullWidth
                  label="Gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  size="small"
                >
                  <MenuItem value="Female">Female</MenuItem>
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  select
                  fullWidth
                  label="Blood Group"
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
                  <MenuItem value="Unknown">Unknown</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Citizenship / ID No"
                  value={citizenshipNumber}
                  onChange={(e) => setCitizenshipNumber(e.target.value)}
                  placeholder="e.g. 27-01-76-01234"
                  size="small"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Current Address"
                  value={currentAddress}
                  onChange={(e) => setCurrentAddress(e.target.value)}
                  placeholder="e.g. Jorpati, Kathmandu"
                  size="small"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Permanent Address"
                  value={permanentAddress}
                  onChange={(e) => setPermanentAddress(e.target.value)}
                  placeholder="e.g. Melamchi-03, Sindhupalchok"
                  size="small"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Guardian / Parent Name"
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
                2. Course, Batch & OJT Preference
              </Typography>
            </Stack>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  required
                  label="Select Course"
                  value={selectedCourseId}
                  onChange={(e) => handleCourseChange(e.target.value)}
                  size="small"
                >
                  {(db.courses || []).map((crs) => (
                    <MenuItem key={crs.id} value={crs.id}>
                      {crs.title} — Rs. {(crs.price || 0).toLocaleString()} ({crs.totalHours || 390} Hours)
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Training Group / Batch"
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
                    <MenuItem value="">No group available (will auto-create)</MenuItem>
                  )}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  type="date"
                  fullWidth
                  label="Admission Date"
                  value={admissionDate}
                  onChange={(e) => setAdmissionDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 1, border: '1px solid #e2e8f0', borderRadius: 1, bgcolor: '#f8fafc' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', display: 'block' }}>
                    OJT (On-the-Job Training) Placement Preference:
                  </Typography>
                  <RadioGroup
                    row
                    value={ojtPreference}
                    onChange={(e) => setOjtPreference(e.target.value)}
                  >
                    <FormControlLabel
                      value="REQUIRED"
                      control={<Radio size="small" color="primary" />}
                      label={<Typography variant="body2" sx={{ fontWeight: 700, color: '#065f46' }}>Required (Complimentary)</Typography>}
                    />
                    <FormControlLabel
                      value="NOT_REQUIRED"
                      control={<Radio size="small" color="secondary" />}
                      label={<Typography variant="body2" sx={{ color: '#64748b' }}>Not Required</Typography>}
                    />
                  </RadioGroup>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Key Curriculum Skills to Cover"
                  value={keySkills}
                  onChange={(e) => setKeySkills(e.target.value)}
                  size="small"
                  helperText="This description appears on Section 2 of the agreement document."
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Section 3: Fee Structure & 50% Rule */}
          <Paper elevation={0} sx={{ p: 2.5, mb: 1, border: '1.5px solid #0f2e5a', borderRadius: 2, bgcolor: '#ffffff' }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <PaymentsIcon sx={{ color: '#0f2e5a' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f2e5a' }}>
                3. Fee Structure & Terms (50% Advance & Remaining within 30 Days)
              </Typography>
            </Stack>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Standard Course Fee (Rs.)"
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
                  label="Approved Discount (Rs.)"
                  value={discountAmount}
                  onChange={(e) => handleDiscountChange(e.target.value)}
                  size="small"
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <Box sx={{ p: 1, bgcolor: '#f1f5f9', borderRadius: 1, border: '1px solid #cbd5e1' }}>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>Net Payable Fee:</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f2e5a' }}>
                    Rs. {netPayableFee.toLocaleString()}
                  </Typography>
                </Box>
              </Grid>

              {/* Advance Payment Box (50% or 100% Full Upfront for Basic Course) */}
              <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 2, bgcolor: isFullOnlyCourse ? '#eff6ff' : '#ecfdf5', border: `1.5px solid ${isFullOnlyCourse ? '#3b82f6' : '#10b981'}`, borderRadius: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isFullOnlyCourse ? '#1d4ed8' : '#065f46', mb: 1 }}>
                    {isFullOnlyCourse ? '⚡ Lump Sum Payment (100% Due on Enrollment):' : '1st Installment (50% Advance at Enrollment):'}
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
                      ? '⚡ Installments are not available for this basic course. Full fee is settled at enrollment.'
                      : `* Student must pay at least 50% (Rs. ${Math.round(netPayableFee * 0.5).toLocaleString()}) at registration.`}
                  </Typography>
                </Paper>
              </Grid>

              {/* Remaining Due Box */}
              <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 2, bgcolor: isFullOnlyCourse && dueAmount50 === 0 ? '#f0fdf4' : '#fff1f2', border: `1.5px solid ${isFullOnlyCourse && dueAmount50 === 0 ? '#22c55e' : '#f43f5e'}`, borderRadius: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isFullOnlyCourse && dueAmount50 === 0 ? '#15803d' : '#9f1239', mb: 1 }}>
                    {isFullOnlyCourse ? 'Remaining Balance:' : '2nd Installment (Remaining 50%):'}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 900, color: isFullOnlyCourse && dueAmount50 === 0 ? '#15803d' : '#be123c', mb: 0.5 }}>
                    Rs. {dueAmount50.toLocaleString()}
                  </Typography>
                  <Box sx={{ bgcolor: '#ffffff', p: 0.8, borderRadius: 1, border: `1px solid ${isFullOnlyCourse && dueAmount50 === 0 ? '#bbf7d0' : '#fecdd3'}` }}>
                    {isFullOnlyCourse && dueAmount50 === 0 ? (
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#16a34a', display: 'block' }}>
                        ✓ Full Paid at Admission
                      </Typography>
                    ) : (
                      <>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#9f1239', display: 'block' }}>
                          Due Date: {calculatedDueDate}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#e11d48' }}>
                          (Mandatory within 30 days of training start)
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
                  label="Payment Method"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  size="small"
                >
                  <MenuItem value="Cash">Cash</MenuItem>
                  <MenuItem value="eSewa">eSewa</MenuItem>
                  <MenuItem value="Khalti">Khalti</MenuItem>
                  <MenuItem value="Fonepay">Fonepay QR</MenuItem>
                  <MenuItem value="Bank">Bank Deposit / Transfer</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Payment Remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  size="small"
                />
              </Grid>
            </Grid>
          </Paper>

          <DialogActions sx={{ px: 0, pt: 3, justifyContent: 'space-between' }}>
            <Button onClick={onClose} color="inherit" sx={{ fontWeight: 600 }}>
              Cancel
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
              Enroll & Generate Agreement
            </Button>
          </DialogActions>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
