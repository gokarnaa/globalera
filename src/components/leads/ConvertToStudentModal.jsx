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
import confetti from 'canvas-confetti';
import { saveDB, calculateExpectedEndDate } from '../../services/storage';

export default function ConvertToStudentModal({
  open,
  onClose,
  lead,
  db,
  onConverted
}) {
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [tgid, setTgid] = useState('');
  const [gender, setGender] = useState('Female');
  const [admissionDate, setAdmissionDate] = useState(new Date().toISOString().slice(0, 10));
  const [expectedEndDate, setExpectedEndDate] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [guardianContact, setGuardianContact] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-generate TGID and suggest matching training group
  useEffect(() => {
    if (!open || !lead) return;

    // Generate next TGID
    const existingTgids = (db.students || [])
      .map((s) => {
        const match = s.tgid && s.tgid.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    const nextNum = existingTgids.length ? Math.max(...existingTgids) + 1 : 101;
    setTgid(`TGID-${nextNum}`);

    // Try to auto-match Training Group by course
    const activeGroups = (db.trainingGroups || []).filter((g) => g.status === 'Ongoing' || g.status === 'Upcoming' || !g.status);
    let matchedGroup = null;
    if (lead.course) {
      const courseObj = (db.courses || []).find(
        (c) => c.title.toLowerCase() === lead.course.toLowerCase()
      );
      if (courseObj) {
        matchedGroup = activeGroups.find((g) => g.courseId === courseObj.id);
      }
    }
    const defaultGroup = matchedGroup || activeGroups[0] || (db.trainingGroups || [])[0];
    if (defaultGroup) {
      setSelectedGroupId(defaultGroup.id);
      if (defaultGroup.endDate) {
        setExpectedEndDate(defaultGroup.endDate);
      } else {
        setExpectedEndDate(calculateExpectedEndDate(admissionDate, 3, 'Months'));
      }
    }

    setErrorMsg('');
  }, [open, lead, db]);

  // When group changes, auto-set expected end date
  const handleGroupChange = (grpId) => {
    setSelectedGroupId(grpId);
    const grp = (db.trainingGroups || []).find((g) => g.id === grpId);
    if (grp && grp.endDate) {
      setExpectedEndDate(grp.endDate);
    }
  };

  const handleConvert = (e) => {
    e.preventDefault();
    if (!selectedGroupId) {
      setErrorMsg('कृपया तालिम समूह / ब्याच (Training Batch) छान्नुहोस्।');
      return;
    }
    if (!tgid.trim()) {
      setErrorMsg('कृपया विद्यार्थी दर्ता नम्बर (TGID) भर्नुहोस्।');
      return;
    }

    const selectedGroup = (db.trainingGroups || []).find((g) => g.id === selectedGroupId);

    // Create new student record
    const newStudent = {
      id: `STD-${Date.now().toString().slice(-4)}`,
      tgid: tgid.trim(),
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
      originalFee: Number(lead.price) || 15000,
      lockedCourseFee: Number(lead.price) || 15000,
      admissionFee: 0,
      discountAmount: 0
    };

    // Update lead status to Converted and append to timeline
    const updatedTimeline = [
      ...(lead.timeline || []),
      {
        date: new Date().toISOString(),
        note: `भर्ना सम्पन्न (Converted to Student: ${tgid} in Batch: ${selectedGroup?.name || selectedGroupId})`,
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
          timeline: updatedTimeline
        };
      }
      return l;
    });

    const updatedStudents = [newStudent, ...(db.students || [])];

    const nextDb = {
      ...db,
      students: updatedStudents,
      leads: updatedLeads
    };

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
              सोधपुछबाट विद्यार्थी भर्ना (Convert to Student)
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
              भर्ना गरिने विद्यार्थीको जानकारी (Lead Overview)
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="caption" sx={{ color: '#047857', display: 'block' }}>नाम (Name):</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#064E3B' }}>{lead.name}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" sx={{ color: '#047857', display: 'block' }}>फोन (Phone):</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#064E3B' }}>{lead.phone}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" sx={{ color: '#047857', display: 'block' }}>ठेगाना (Address):</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#064E3B' }}>{lead.address || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" sx={{ color: '#047857', display: 'block' }}>पाठ्यक्रम (Course):</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#064E3B' }}>{lead.course || 'N/A'}</Typography>
              </Grid>
            </Grid>
          </Paper>

          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#334155', mb: 2 }}>
            भर्ना र तालिम समूह विवरण (Admission & Batch Setup)
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="विद्यार्थी दर्ता कोड (TGID)"
                value={tgid}
                onChange={(e) => setTgid(e.target.value)}
                helperText="युनिक विद्यार्थी पहिचान कोड"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="लिङ्ग (Gender)"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <MenuItem value="Female">महिला (Female)</MenuItem>
                <MenuItem value="Male">पुरुष (Male)</MenuItem>
                <MenuItem value="Other">अन्य (Other)</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                required
                label="तालिम समूह / ब्याच (Training Batch)"
                value={selectedGroupId}
                onChange={(e) => handleGroupChange(e.target.value)}
              >
                {(db.trainingGroups || []).map((grp) => {
                  const courseObj = (db.courses || []).find((c) => c.id === grp.courseId);
                  return (
                    <MenuItem key={grp.id} value={grp.id}>
                      {grp.name} — {courseObj?.title || grp.courseId} (Shift: {grp.shift || 'A'})
                    </MenuItem>
                  );
                })}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="भर्ना मिति (Admission Date)"
                InputLabelProps={{ shrink: true }}
                value={admissionDate}
                onChange={(e) => setAdmissionDate(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="समापन मिति (Expected End Date)"
                InputLabelProps={{ shrink: true }}
                value={expectedEndDate}
                onChange={(e) => setExpectedEndDate(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="बुबाको नाम (Father's Name)"
                placeholder="वैकल्पिक (Optional)"
                value={fatherName}
                onChange={(e) => setFatherName(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="अभिभावक सम्पर्क (Guardian Phone)"
                placeholder="वैकल्पिक (Optional)"
                value={guardianContact}
                onChange={(e) => setGuardianContact(e.target.value)}
              />
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
          <Button onClick={onClose} sx={{ color: '#64748B', fontWeight: 700 }}>
            रद्द गर्नुहोस् (Cancel)
          </Button>
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
            भर्ना निश्चित गर्नुहोस् (Confirm Admission)
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
