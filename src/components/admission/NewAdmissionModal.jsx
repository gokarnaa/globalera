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
  Avatar,
  useTheme,
  useMediaQuery
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
import { PhotoUploadField } from '../common';

export default function NewAdmissionModal({ open, onClose, db, setDb, showToast, onAdmissionCreated, initialLead = null }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Personal Info
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [secondaryPhone, setSecondaryPhone] = useState('');
  const [gender, setGender] = useState('Female');
  const [bloodGroup, setBloodGroup] = useState('O+ve');
  const [photoUrl, setPhotoUrl] = useState('');
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

  // Initialize or pre-populate on open
  useEffect(() => {
    if (!open) return;
    setErrorMsg('');

    if (initialLead) {
      setName(initialLead.name || '');
      setPhone(initialLead.phone || '');
      setCurrentAddress(initialLead.address || 'Gokarneshwor, Kathmandu');
      setPermanentAddress(initialLead.address || '');
      setFatherName(initialLead.fatherName || '');
      setGuardianContact(initialLead.guardianContact || initialLead.phone || '');
      if (initialLead.gender) setGender(initialLead.gender);

      // Match course by title or id
      let matchedCourse = null;
      if (initialLead.course) {
        matchedCourse = (db.courses || []).find(
          (c) => (c.title || '').toLowerCase() === (initialLead.course || '').toLowerCase() || c.id === initialLead.course
        );
      }
      const courseToUse = matchedCourse || (db.courses && db.courses[0]);
      if (courseToUse) {
        setSelectedCourseId(courseToUse.id);
        const price = Number(initialLead.price) || courseToUse.price || 15000;
        setTotalCourseFee(price);
        setKeySkills(courseToUse.description || '');
        const disc = Number(initialLead.discount) || 0;
        setDiscountAmount(disc);
        const net = Math.max(0, price - disc);
        if (courseToUse.feeStructure?.paymentMode === 'FULL_ONLY') {
          setAdvancePaid(net);
        } else {
          setAdvancePaid(Math.round(net * 0.5));
        }

        const matchingGroup = (db.trainingGroups || []).find((g) => g.courseId === courseToUse.id);
        setSelectedGroupId(matchingGroup?.id || '');
      }
    } else {
      setName('');
      setPhone('');
      setSecondaryPhone('');
      setGender('Female');
      setBloodGroup('O+ve');
      setCitizenshipNumber('');
      setCurrentAddress('Gokarneshwor, Kathmandu');
      setPermanentAddress('');
      setFatherName('');
      setGuardianContact('');
      setOjtPreference('REQUIRED');
      setPaymentMethod('Cash');
      setRemarks('Admission Agreement - 50% Advance Fee');

      if (db.courses && db.courses.length > 0) {
        const firstCourse = db.courses[0];
        setSelectedCourseId(firstCourse.id);
        const fs = firstCourse.feeStructure;
        const price = firstCourse.price || 15000;
        setTotalCourseFee(price);
        setDiscountAmount(0);
        setKeySkills(firstCourse.description || '');
        if (fs?.paymentMode === 'FULL_ONLY') {
          setAdvancePaid(price);
        } else {
          setAdvancePaid(Math.round(price * 0.5));
        }
        const matchingGroup = (db.trainingGroups || []).find((g) => g.courseId === firstCourse.id);
        setSelectedGroupId(matchingGroup?.id || '');
      }
    }
  }, [open, initialLead, db.courses, db.trainingGroups]);

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

    // Expected End Date (Rolling Batch uses student's own enrollDate + Course Duration + Holidays; Fixed Batch uses batch end date)
    const isFixedBatch = groupObj.batchMode === 'FIXED';
    const endDate =
      (isFixedBatch && (groupObj.expectedEndDate || groupObj.endDate)) ||
      calculateExpectedEndDate(
        admissionDate,
        courseObj?.durationValue || 3,
        courseObj?.durationUnit || 'Months',
        db.holidays || [],
        groupObj.scheduleMode || 'REGULAR'
      );

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
      convertedFromLeadId: initialLead?.id || null,
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
      createdAt: new Date().toISOString(),
      convertedFromLeadId: initialLead?.id || null,
      admissionSource: initialLead ? 'Lead Inquiry' : 'Direct Walk-in'
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

    // Update lead stage to Converted if admitted from lead
    let updatedLeads = db.leads || [];
    if (initialLead) {
      const batchLabel = groupObj.groupCode || groupObj.name || groupObj.id || 'Batch 1';
      updatedLeads = (db.leads || []).map((l) => {
        if (l.id === initialLead.id) {
          const updatedTimeline = [
            ...(l.timeline || []),
            {
              date: new Date().toISOString(),
              note: `Formal Admission Agreement Generated (#${agreementNo}) in Batch: ${batchLabel} with 50% advance fee paid.`,
              staffName: 'Admission Desk'
            }
          ];
          return {
            ...l,
            stage: 'Converted',
            commissionStatus: (l.agentId || l.agentCode) ? 'approved' : l.commissionStatus,
            convertedToStudentId: studentId,
            convertedToAdmissionId: newAdmission.id,
            timeline: updatedTimeline
          };
        }
        return l;
      });
    }

    let finalDb = {
      ...db,
      students: updatedStudents,
      payments: updatedPayments,
      trainingGroups: updatedGroups,
      admissions: updatedAdmissions,
      leads: updatedLeads
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
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      scroll="paper"
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
          maxHeight: isMobile ? '100vh' : '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle
        sx={{
          m: 0,
          px: { xs: 2, sm: 2.5 },
          py: 1.75,
          flexShrink: 0,
          background: 'linear-gradient(135deg, #0F2C59 0%, #1E3A8A 100%)',
          color: '#FFFFFF',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '3px solid #F59E0B'
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.14)',
              color: '#F59E0B',
              width: 40,
              height: 40,
              borderRadius: 2,
              border: '1px solid rgba(245, 158, 11, 0.35)'
            }}
          >
            <HowToRegIcon sx={{ fontSize: 22 }} />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: { xs: '1rem', sm: '1.1rem' }, lineHeight: 1.2 }}>
              New Student Admission & Training Agreement
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.74rem', display: 'block' }}>
              50% advance collection, OJT preference & dual-copy A4 agreement system
            </Typography>
          </Box>
        </Stack>
        <IconButton
          aria-label="Close admission dialog"
          onClick={onClose}
          sx={{
            color: 'rgba(255, 255, 255, 0.85)',
            bgcolor: 'rgba(255, 255, 255, 0.1)',
            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.25)', color: '#FFFFFF' }
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
          overflow: 'hidden'
        }}
      >
        <DialogContent
          dividers
          sx={{
            p: { xs: 1.5, sm: 2.5 },
            bgcolor: '#F8FAFC',
            flex: 1,
            overflowY: 'auto'
          }}
        >
          {initialLead && (
            <Alert
              severity="info"
              icon={<HowToRegIcon fontSize="small" sx={{ color: '#1D4ED8' }} />}
              sx={{
                mb: 2,
                borderRadius: 2,
                border: '1px solid #BFDBFE',
                bgcolor: '#EFF6FF',
                fontWeight: 700,
                color: '#1E3A8A'
              }}
            >
              Admitting from Lead Inquiry #{initialLead.id} ({initialLead.name}) — Information pre-populated. Confirming will generate Agreement #{`GE-AGR-2025-${String((db.admissions || []).length + 1).padStart(3, '0')}`} and automatically update lead stage to Converted.
            </Alert>
          )}

          {errorMsg && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {errorMsg}
            </Alert>
          )}

          {/* Section 1: Student Personal Details */}
          <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2 }, mb: 2, border: '1px solid #E2E8F0', borderRadius: 2, bgcolor: '#FFFFFF' }}>
            <Box sx={{ mb: 1.5 }}>
              <PhotoUploadField
                label="Student Passport Photo (Used on ID Card & Certificate)"
                value={photoUrl}
                onChange={setPhotoUrl}
                folder="students"
                entityId={phone || name || 'admission'}
                name={name}
              />
            </Box>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
              <SchoolIcon sx={{ color: '#0F2C59', fontSize: 18 }} />
              <Typography
                sx={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  color: '#64748B',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase'
                }}
              >
                1. Student Personal & Contact Details
              </Typography>
            </Stack>

            <Grid container spacing={1.75}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Student Full Name"
                  size="small"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
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

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Secondary Phone"
                  value={secondaryPhone}
                  onChange={(e) => setSecondaryPhone(e.target.value)}
                  size="small"
                />
              </Grid>

              <Grid item xs={12} sm={4}>
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

              <Grid item xs={12} sm={4}>
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

              <Grid item xs={12} sm={6}>
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
                  label="Guardian / Parent Name"
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
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
            </Grid>
          </Paper>

          {/* Section 2: Course, Batch & OJT Details */}
          <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2 }, mb: 2, border: '1px solid #E2E8F0', borderRadius: 2, bgcolor: '#FFFFFF' }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
              <WorkIcon sx={{ color: '#0F2C59', fontSize: 18 }} />
              <Typography
                sx={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  color: '#64748B',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase'
                }}
              >
                2. Course, Batch & OJT Preference
              </Typography>
            </Stack>

            <Grid container spacing={1.75}>
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
                <Box sx={{ p: 1, border: '1px solid #E2E8F0', borderRadius: 1.5, bgcolor: '#F8FAFC' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', display: 'block' }}>
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
                      label={<Typography variant="body2" sx={{ fontWeight: 700, color: '#065F46' }}>Required (Complimentary)</Typography>}
                    />
                    <FormControlLabel
                      value="NOT_REQUIRED"
                      control={<Radio size="small" color="secondary" />}
                      label={<Typography variant="body2" sx={{ color: '#64748B' }}>Not Required</Typography>}
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
          <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2 }, border: '1px solid #E2E8F0', borderRadius: 2, bgcolor: '#FFFFFF' }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
              <PaymentsIcon sx={{ color: '#0F2C59', fontSize: 18 }} />
              <Typography
                sx={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  color: '#64748B',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase'
                }}
              >
                3. Fee Structure & Terms (50% Advance & Remaining within 30 Days)
              </Typography>
            </Stack>

            <Grid container spacing={1.75}>
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
                <Box sx={{ p: 1, bgcolor: '#F1F5F9', borderRadius: 1.5, border: '1px solid #CBD5E1' }}>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>Net Payable Fee:</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F2C59', lineHeight: 1.2 }}>
                    Rs. {netPayableFee.toLocaleString()}
                  </Typography>
                </Box>
              </Grid>

              {/* Advance Payment Box (50% or 100% Full Upfront for Basic Course) */}
              <Grid item xs={12} sm={6}>
                <Paper elevation={0} sx={{ p: 1.5, bgcolor: isFullOnlyCourse ? '#EFF6FF' : '#ECFDF5', border: `1.5px solid ${isFullOnlyCourse ? '#3B82F6' : '#10B981'}`, borderRadius: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isFullOnlyCourse ? '#1D4ED8' : '#065F46', mb: 1 }}>
                    {isFullOnlyCourse ? '⚡ Lump Sum Payment (100% Due on Enrollment):' : '1st Installment (50% Advance at Enrollment):'}
                  </Typography>
                  <TextField
                    fullWidth
                    type="number"
                    required
                    value={advancePaid}
                    onChange={(e) => setAdvancePaid(Number(e.target.value) || 0)}
                    size="small"
                    sx={{ bgcolor: '#FFFFFF', borderRadius: 1 }}
                  />
                  <Typography variant="caption" sx={{ color: isFullOnlyCourse ? '#1E40AF' : '#047857', display: 'block', mt: 0.8, fontWeight: 700 }}>
                    {isFullOnlyCourse
                      ? '⚡ Installments are not available for this basic course. Full fee is settled at enrollment.'
                      : `* Student must pay at least 50% (Rs. ${Math.round(netPayableFee * 0.5).toLocaleString()}) at registration.`}
                  </Typography>
                </Paper>
              </Grid>

              {/* Remaining Due Box */}
              <Grid item xs={12} sm={6}>
                <Paper elevation={0} sx={{ p: 1.5, bgcolor: isFullOnlyCourse && dueAmount50 === 0 ? '#F0FDF4' : '#FFF1F2', border: `1.5px solid ${isFullOnlyCourse && dueAmount50 === 0 ? '#22C55E' : '#F43F5E'}`, borderRadius: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isFullOnlyCourse && dueAmount50 === 0 ? '#15803D' : '#9F1239', mb: 1 }}>
                    {isFullOnlyCourse ? 'Remaining Balance:' : '2nd Installment (Remaining 50%):'}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 900, color: isFullOnlyCourse && dueAmount50 === 0 ? '#15803D' : '#BE123C', mb: 0.5 }}>
                    Rs. {dueAmount50.toLocaleString()}
                  </Typography>
                  <Box sx={{ bgcolor: '#FFFFFF', p: 0.8, borderRadius: 1, border: `1px solid ${isFullOnlyCourse && dueAmount50 === 0 ? '#BBF7D0' : '#FECDD3'}` }}>
                    {isFullOnlyCourse && dueAmount50 === 0 ? (
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#16A34A', display: 'block' }}>
                        ✓ Full Paid at Admission
                      </Typography>
                    ) : (
                      <>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#9F1239', display: 'block' }}>
                          Due Date: {calculatedDueDate}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#E11D48' }}>
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
        </DialogContent>

        <DialogActions
          sx={{
            px: 2.5,
            py: 1.5,
            bgcolor: '#FFFFFF',
            borderTop: '1px solid #E2E8F0',
            flexShrink: 0,
            justifyContent: 'space-between'
          }}
        >
          <Button onClick={onClose} size="small" sx={{ color: '#64748B', fontWeight: 700, py: 0.8 }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            size="small"
            startIcon={<HowToRegIcon />}
            sx={{
              bgcolor: '#0F2C59',
              color: '#FFFFFF',
              fontWeight: 800,
              px: 3,
              py: 0.8,
              borderRadius: 2,
              '&:hover': { bgcolor: '#1E3A8A' }
            }}
          >
            Enroll & Generate Agreement
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
