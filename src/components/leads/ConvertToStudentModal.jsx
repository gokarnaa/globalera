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
  Chip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import SchoolIcon from '@mui/icons-material/School';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import PersonIcon from '@mui/icons-material/Person';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import confetti from 'canvas-confetti';
import {
  saveDB,
  calculateExpectedEndDate,
  getNextSequentialId,
  getNextBiometricId,
  postDoubleEntryJournal
} from '../../services/storage';

export default function ConvertToStudentModal({
  open,
  onClose,
  lead,
  db,
  onConverted,
  onNavigateToAdmission
}) {
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [tgid, setTgid] = useState('');
  const [gender, setGender] = useState('Female');
  const [admissionDate, setAdmissionDate] = useState(new Date().toISOString().slice(0, 10));
  const [expectedEndDate, setExpectedEndDate] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [guardianContact, setGuardianContact] = useState('');
  const [totalCourseFee, setTotalCourseFee] = useState(15000);
  const [advancePaid, setAdvancePaid] = useState(7500);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-generate TGID, fee and suggest matching training group
  useEffect(() => {
    if (!open || !lead) return;

    // Generate next collision-free TGID
    setTgid(getNextSequentialId(db.students || [], 'TGID-', 3, 'tgid', 101));

    // Try to auto-match Training Group by course
    const activeGroups = (db.trainingGroups || []).filter(
      (g) => g.status === 'Running' || g.status === 'Ongoing' || g.status === 'Upcoming' || !g.status
    );
    let matchedGroup = null;
    let matchedCourse = null;
    if (lead.course) {
      matchedCourse = (db.courses || []).find(
        (c) => (c.title || '').toLowerCase() === lead.course.toLowerCase() || c.id === lead.course
      );
      if (matchedCourse) {
        matchedGroup = activeGroups.find((g) => g.courseId === matchedCourse.id);
      }
    }
    const defaultGroup = matchedGroup || activeGroups[0] || (db.trainingGroups || [])[0];
    if (defaultGroup) {
      setSelectedGroupId(defaultGroup.id);
      const grpEnd = defaultGroup.expectedEndDate || defaultGroup.endDate;
      if (grpEnd) {
        setExpectedEndDate(grpEnd);
      } else {
        setExpectedEndDate(calculateExpectedEndDate(admissionDate, 3, 'Months'));
      }
    }

    const price = Number(lead.price) || matchedCourse?.price || 15000;
    setTotalCourseFee(price);
    const disc = Number(lead.discount) || 0;
    const net = Math.max(0, price - disc);
    setAdvancePaid(Math.round(net * 0.5));

    setErrorMsg('');
  }, [open, lead, db]);

  // When group changes, auto-set expected end date
  const handleGroupChange = (grpId) => {
    setSelectedGroupId(grpId);
    const grp = (db.trainingGroups || []).find((g) => g.id === grpId);
    const grpEnd = grp?.expectedEndDate || grp?.endDate;
    if (grpEnd) {
      setExpectedEndDate(grpEnd);
    }
  };

  const handleConvert = (e) => {
    e.preventDefault();
    if (!selectedGroupId) {
      setErrorMsg('Please select a Training Batch.');
      return;
    }
    if (!tgid.trim()) {
      setErrorMsg('Please enter a Student Registration Code (TGID).');
      return;
    }

    const selectedGroup = (db.trainingGroups || []).find((g) => g.id === selectedGroupId) || {};
    const courseObj = (db.courses || []).find((c) => c.id === selectedGroup.courseId) || {};
    const studentId = getNextSequentialId(db.students || [], 'STD-', 2, 'id', 1);
    const biometricId = getNextBiometricId(db.students || [], 1001);

    // 1. Create new student record
    const newStudent = {
      id: studentId,
      tgid: tgid.trim(),
      biometricId,
      name: lead.name.trim(),
      phone: lead.phone.trim(),
      secondaryPhone: '',
      email: '',
      gender: gender || 'Female',
      dateOfBirth: '2002-01-01',
      citizenshipNumber: '',
      citizenshipDistrict: 'Kathmandu',
      permanentAddress: lead.address || '',
      currentAddress: lead.address || '',
      fatherName: fatherName.trim(),
      motherName: motherName.trim(),
      guardianContact: guardianContact.trim() || lead.phone,
      groupId: selectedGroupId,
      admissionDate: admissionDate,
      expectedEndDate: expectedEndDate || calculateExpectedEndDate(admissionDate, 3, 'Months'),
      status: 'Active',
      photoUrl: '',
      convertedFromLeadId: lead.id,
      originalFee: Number(totalCourseFee) || 15000,
      lockedCourseFee: Number(totalCourseFee) || 15000,
      admissionFee: 0,
      discountAmount: 0
    };

    // 2. Create Receipt & Payment Record (50% Advance)
    const receiptNo = `REC-ADM-${Date.now().toString().slice(-6)}`;
    const newPayment = {
      id: `PMT-${Date.now()}`,
      studentId,
      studentName: lead.name.trim(),
      tgid: tgid.trim(),
      groupId: selectedGroupId,
      courseName: courseObj?.title || 'Vocational Training',
      amount: Number(advancePaid) || 0,
      paymentMethod,
      paymentDate: admissionDate,
      paymentMonth: 'Admission',
      receiptNo,
      remarks: `Lead Admission - 50% Advance Fee (${lead.name.trim()})`,
      receivedBy: 'Admission Desk',
      collectedBy: 'Admission Desk'
    };

    // 3. Create Admission Agreement Record (db.admissions)
    const agreementCount = (db.admissions || []).length + 1;
    const agreementNo = `GE-AGR-2025-${String(agreementCount).padStart(3, '0')}`;
    const netFee = Number(totalCourseFee) || 15000;
    const advPaid = Number(advancePaid) || 0;
    const dueAmt = Math.max(0, netFee - advPaid);

    const newAdmission = {
      id: `ADM-${Date.now()}`,
      agreementNo,
      studentId,
      tgid: tgid.trim(),
      studentName: lead.name.trim(),
      phone: lead.phone.trim(),
      secondaryPhone: '',
      gender: gender || 'Female',
      bloodGroup: 'O+ve',
      photoUrl: '',
      expectedEndDate: expectedEndDate || '',
      citizenshipNumber: '',
      currentAddress: lead.address || '',
      permanentAddress: lead.address || '',
      fatherName: fatherName.trim(),
      guardianContact: guardianContact.trim() || lead.phone,

      courseId: courseObj?.id || selectedGroup.courseId || 'CRS-01',
      courseTitle: courseObj?.title || 'Vocational Training',
      groupId: selectedGroupId,
      groupName: selectedGroup.groupCode || selectedGroup.name || 'Batch 1',
      shift: selectedGroup.shift || 'Shift A',
      timing: selectedGroup.timing || '07:00 AM – 09:00 AM',
      duration: `${courseObj?.durationValue || 3} ${courseObj?.durationUnit || 'Months'}`,
      keySkills: courseObj?.description || '',

      ojtPreference: 'REQUIRED',
      ojtFee: 0,
      batchTransferAllowed: true,

      totalCourseFee: netFee,
      discountAmount: 0,
      netPayableFee: netFee,
      advancePaid50: advPaid,
      dueAmount50: dueAmt,
      dueDate: expectedEndDate || '',
      paymentMethod,
      receiptNo,

      admissionDate,
      admissionDateBS: admissionDate,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      convertedFromLeadId: lead.id,
      admissionSource: 'Lead Inquiry'
    };

    // 4. Update lead status to Converted and append timeline
    const batchLabel = selectedGroup?.groupCode || selectedGroup?.name || selectedGroupId;
    const updatedTimeline = [
      ...(lead.timeline || []),
      {
        date: new Date().toISOString(),
        note: `Admission Completed (Agreement #${agreementNo}, TGID: ${tgid} in Batch: ${batchLabel}) with 50% advance fee paid.`,
        staffName: 'Admin / Counselor'
      }
    ];

    const updatedLeads = (db.leads || []).map((l) => {
      if (l.id === lead.id) {
        return {
          ...l,
          stage: 'Converted',
          commissionStatus: (l.agentId || l.agentCode) ? 'approved' : l.commissionStatus,
          convertedToStudentId: newStudent.id,
          convertedToAdmissionId: newAdmission.id,
          timeline: updatedTimeline
        };
      }
      return l;
    });

    const updatedStudents = [newStudent, ...(db.students || [])];
    const updatedAdmissions = [newAdmission, ...(db.admissions || [])];
    const updatedPayments = [newPayment, ...(db.payments || [])];

    // Update group trainees count
    const updatedGroups = (db.trainingGroups || []).map((g) => {
      if (g.id === selectedGroupId) {
        return { ...g, currentTrainees: (g.currentTrainees || 0) + 1 };
      }
      return g;
    });

    let nextDb = {
      ...db,
      students: updatedStudents,
      admissions: updatedAdmissions,
      payments: updatedPayments,
      trainingGroups: updatedGroups,
      leads: updatedLeads
    };

    // Post double entry journal for 50% advance fee
    if (advPaid > 0) {
      try {
        const { nextDb: dbWithJournal } = postDoubleEntryJournal(nextDb, {
          entryDate: admissionDate,
          sourceModule: 'ADMISSION',
          sourceId: receiptNo,
          narration: `Lead Converted Admission 50% Advance Fee: ${lead.name.trim()} Agreement No ${agreementNo}`,
          createdBy: 'Admission Desk',
          lines: [
            {
              accountCode: paymentMethod !== 'Cash' ? '1020' : '1010',
              lineNarration: `50% Admission Fee Collection (${paymentMethod})`,
              debit: advPaid,
              credit: 0
            },
            {
              accountCode: '4100',
              lineNarration: `Trainee Admission Revenue - ${lead.name.trim()}`,
              debit: 0,
              credit: advPaid
            }
          ]
        });
        if (dbWithJournal) {
          nextDb = dbWithJournal;
        }
      } catch (err) {
        console.warn('Journal post notice:', err);
      }
    }

    saveDB(nextDb);

    // Fire celebration confetti!
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // ignore
    }

    onConverted(newStudent);
    onClose();
  };

  if (!lead) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      scroll="paper"
      PaperProps={{
        sx: {
          borderRadius: 3.5,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 60px rgba(15, 23, 42, 0.25)',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle
        sx={{
          m: 0,
          p: 2.2,
          flexShrink: 0,
          background: 'linear-gradient(135deg, #065F46 0%, #047857 100%)',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2,
              bgcolor: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF'
            }}
          >
            <HowToRegIcon />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem', lineHeight: 1.2 }}>
              Convert Lead to Student Admission
            </Typography>
            <Typography variant="caption" sx={{ color: '#A7F3D0', fontWeight: 500 }}>
              {lead.name} • {lead.id}
            </Typography>
          </Box>
        </Box>
        <IconButton
          onClick={onClose}
          sx={{ color: '#A7F3D0', '&:hover': { color: '#FFFFFF', bgcolor: 'rgba(255,255,255,0.1)' } }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Box
        component="form"
        onSubmit={handleConvert}
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
            p: { xs: 2, sm: 3 },
            bgcolor: '#F8FAFC',
            flex: 1,
            overflowY: 'auto',
            '&::-webkit-scrollbar': { width: 7 },
            '&::-webkit-scrollbar-track': { background: '#F1F5F9' },
            '&::-webkit-scrollbar-thumb': { background: '#CBD5E1', borderRadius: 4 },
            '&::-webkit-scrollbar-thumb:hover': { background: '#94A3B8' }
          }}
        >
          {errorMsg && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
              {errorMsg}
            </Alert>
          )}

          {/* Lead Summary Info */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 3,
              borderRadius: 2.5,
              border: '1px solid #D1FAE5',
              bgcolor: '#ECFDF5'
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#065F46', mb: 1 }}>
              Lead Overview
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="caption" sx={{ color: '#047857', display: 'block' }}>Name:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#064E3B' }}>{lead.name}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" sx={{ color: '#047857', display: 'block' }}>Phone:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#064E3B' }}>{lead.phone}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" sx={{ color: '#047857', display: 'block' }}>Address:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#064E3B' }}>{lead.address || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" sx={{ color: '#047857', display: 'block' }}>Course:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#064E3B' }}>{lead.course || 'N/A'}</Typography>
              </Grid>
            </Grid>
          </Paper>

          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#334155', mb: 2 }}>
            Admission & Batch Setup
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Student Registration Code (TGID)"
                value={tgid}
                onChange={(e) => setTgid(e.target.value)}
                helperText="Unique Student Identification Code"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <MenuItem value="Female">Female</MenuItem>
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                required
                label="Training Batch"
                value={selectedGroupId}
                onChange={(e) => handleGroupChange(e.target.value)}
              >
                {(db.trainingGroups || []).map((grp) => {
                  const courseObj = (db.courses || []).find((c) => c.id === grp.courseId);
                  return (
                    <MenuItem key={grp.id} value={grp.id}>
                      {grp.groupCode || grp.name || grp.id} — {courseObj?.title || grp.courseId} (Shift: {grp.shift || 'A'})
                    </MenuItem>
                  );
                })}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Admission Date"
                InputLabelProps={{ shrink: true }}
                value={admissionDate}
                onChange={(e) => setAdmissionDate(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Expected End Date"
                InputLabelProps={{ shrink: true }}
                value={expectedEndDate}
                onChange={(e) => setExpectedEndDate(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Father's Name"
                placeholder="Optional"
                value={fatherName}
                onChange={(e) => setFatherName(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Guardian Phone"
                placeholder="Optional"
                value={guardianContact}
                onChange={(e) => setGuardianContact(e.target.value)}
              />
            </Grid>

            {/* Fee & Payment Details */}
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Total Course Fee (NPR)"
                value={totalCourseFee}
                onChange={(e) => {
                  const val = Number(e.target.value) || 0;
                  setTotalCourseFee(val);
                  setAdvancePaid(Math.round(val * 0.5));
                }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="50% Advance Paid (NPR)"
                value={advancePaid}
                onChange={(e) => setAdvancePaid(Number(e.target.value) || 0)}
                helperText={`Due: NPR ${Math.max(0, (Number(totalCourseFee) || 0) - (Number(advancePaid) || 0))}`}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                label="Payment Method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <MenuItem value="Cash">Cash (Counter)</MenuItem>
                <MenuItem value="Fonepay">Fonepay / QR</MenuItem>
                <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                <MenuItem value="eSewa">eSewa</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2,
            bgcolor: '#FFFFFF',
            borderTop: '1px solid #E2E8F0',
            flexShrink: 0,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 -4px 12px rgba(0,0,0,0.03)',
            zIndex: 10
          }}
        >
          <Stack direction="row" spacing={1}>
            <Button onClick={onClose} sx={{ color: '#64748B', fontWeight: 700 }}>
              Cancel
            </Button>
            {onNavigateToAdmission && (
              <Button
                variant="outlined"
                color="primary"
                startIcon={<OpenInNewIcon />}
                onClick={() => {
                  onClose();
                  onNavigateToAdmission(lead);
                }}
                sx={{ fontWeight: 800, textTransform: 'none', borderRadius: 2 }}
              >
                Open Full Admission Desk
              </Button>
            )}
          </Stack>

          <Button
            type="submit"
            variant="contained"
            startIcon={<HowToRegIcon />}
            sx={{
              background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
              fontWeight: 800,
              px: 3.5,
              py: 1,
              borderRadius: 2.5,
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
            }}
          >
            Confirm Admission & Generate Agreement
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
