import React, { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  Card,
  Grid,
  TextField,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Chip,
  IconButton,
  Divider,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Avatar,
  Slider,
  Tooltip,
  Alert,
  Stack
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import PrintIcon from '@mui/icons-material/Print';
import TuneIcon from '@mui/icons-material/Tune';
import SchoolIcon from '@mui/icons-material/School';
import VerifiedIcon from '@mui/icons-material/Verified';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import PersonIcon from '@mui/icons-material/Person';
import confetti from 'canvas-confetti';
import { QRCodeSVG } from 'qrcode.react';

import { loadDB, saveDB } from '../../services/storage';
import {
  getTransliterationSuggestions,
  getGuardianRelationMeta,
  generateBilingualCertificateWording
} from '../../services/nepaliTransliteration';

// Steps definition
const WIZARD_STEPS = [
  '१. समूह (Group)',
  '२. विद्यार्थी (Students)',
  '३. हिज्जे जाँच (Spelling & Transliteration)',
  '४. डिजाइन (Template)',
  '५. पूर्वावलोकन (Preview & Calibrate)',
  '६. जारी (Issue & Lock)'
];

// Available Certificate Templates
const TEMPLATES = [
  {
    id: 'classic',
    title: 'क्लासिक फर्मल (Classic Formal Executive)',
    desc: 'सुनौलो र शाही नीलो बोर्डर, संस्थागत लोगो, वाटरमार्क तथा आधिकारिक हस्ताक्षर सहित।',
    tag: 'लोकप्रिय (Most Used)',
    border: '#c59b27'
  },
  {
    id: 'bilingual',
    title: 'पूर्ण द्विभाषी अनुच्छेद (Full Bilingual Standard)',
    desc: 'माथि अंग्रेजी र तल नेपाली औपचारिक अनुच्छेद। CTEVT मापदण्ड अनुसारको पूर्ण पाठ।',
    tag: 'CTEVT सिफारिस',
    border: '#1e40af'
  },
  {
    id: 'photo',
    title: 'आधुनिक प्राविधिक फोटो सहित (Modern TVET with Photo)',
    desc: 'प्रशिक्षार्थीको फोटो, हासिल गरेका सीप दक्षता र ग्रेड/नम्बर सहितको आधुनिक ढाँचा।',
    tag: 'फोटो युक्त',
    border: '#059669'
  },
  {
    id: 'preprinted',
    title: 'प्रि-प्रिन्टेड पेपर मोड (Pre-Printed Paper Alignment)',
    desc: 'पहिले नै छापाखानाबाट छापिएको सर्टिफिकेट पेपरमा नाम र मिति ठ्याक्कै खाली ठाउँमा प्रिन्ट गर्न।',
    tag: 'क्यालिब्रेसन सहित',
    border: '#7c3aed'
  }
];

export default function CertificateWizardModal({
  open,
  onClose,
  initialGroupId,
  onIssued
}) {
  const [db, setDb] = useState(loadDB());
  const [activeStep, setActiveStep] = useState(0);

  // 1. Group Selection
  const [selectedGroupId, setSelectedGroupId] = useState(initialGroupId || db.trainingGroups[0]?.id || '');

  // 2. Student Selection
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);

  // 3. Student Transliteration & Review States (keyed by student ID)
  // { [id]: { nameNp, guardianNameNp, relationNp, isSpellingVerified, addressNp } }
  const [studentReviewData, setStudentReviewData] = useState({});

  // 4. Template Selection & Settings
  const [selectedTemplate, setSelectedTemplate] = useState('bilingual');
  const [orientation, setOrientation] = useState('landscape'); // 'landscape' | 'portrait'
  const [signatoryName, setSignatoryName] = useState(db.settings?.directorName || 'Gokarna Thapa');
  const [signatoryDesignation, setSignatoryDesignation] = useState('Managing Director');

  // Pre-printed Offset Calibration (in mm)
  const [offsetY, setOffsetY] = useState(0); // -20 to +20 mm
  const [offsetX, setOffsetX] = useState(0); // -20 to +20 mm
  const [fontScale, setFontScale] = useState(100); // 80% to 120%

  // 5. Preview Student Index
  const [previewIndex, setPreviewIndex] = useState(0);

  // 6. Issued Certificates Results
  const [issuedResults, setIssuedResults] = useState([]);

  // Load / Sync DB
  useEffect(() => {
    if (open) {
      const currentDb = loadDB();
      setDb(currentDb);
      if (initialGroupId) {
        setSelectedGroupId(initialGroupId);
      }
    }
  }, [open, initialGroupId]);

  const selectedGroup = db.trainingGroups.find((g) => g.id === selectedGroupId);
  const selectedCourse = db.courses.find((c) => c.id === selectedGroup?.courseId);
  const trainer = db.trainers.find((t) => t.id === selectedGroup?.trainerId) || { name: 'Assigned Instructor' };
  const groupStudents = (db.students || []).filter((s) => s.groupId === selectedGroupId);
  const existingCerts = db.certificates || [];

  // Compute Students with Eligibility and Attendance
  const studentEligibilityList = useMemo(() => {
    return groupStudents.map((st) => {
      // Calculate attendance
      const stAtts = (db.attendances || []).filter((a) => a.groupId === selectedGroupId && a.studentId === st.id);
      const pCount = stAtts.filter((a) => a.status === 'present' || a.status === 'P').length;
      const lCount = stAtts.filter((a) => a.status === 'late' || a.status === 'L').length;
      const totalDays = stAtts.length;
      const attPercent = totalDays > 0 ? Math.round(((pCount + lCount * 0.5) / totalDays) * 100) : 100;

      // Check existing certificate
      const cert = existingCerts.find((c) => c.studentId === st.id && c.status !== 'REVOKED');

      // Check fee clearance
      const stPayments = (db.payments || []).filter((p) => p.studentId === st.id);
      const totalPaid = stPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const lockedFee = Number(st.lockedCourseFee) || Number(selectedCourse?.price) || 30000;
      const due = Math.max(0, lockedFee - totalPaid);
      const isFeeCleared = due === 0;

      const isEligible = attPercent >= 80;

      return {
        student: st,
        attPercent,
        isFeeCleared,
        due,
        existingCert: cert || null,
        isEligible
      };
    });
  }, [groupStudents, selectedGroupId, db.attendances, existingCerts, db.payments, selectedCourse]);

  // When step changes to Step 2, auto-select eligible students who do not already have certificates
  useEffect(() => {
    if (activeStep === 1 && selectedStudentIds.length === 0) {
      const defaultEligible = studentEligibilityList
        .filter((item) => item.isEligible && !item.existingCert)
        .map((item) => item.student.id);
      setSelectedStudentIds(defaultEligible);
    }
  }, [activeStep, studentEligibilityList, selectedStudentIds]);

  // When moving to Step 3 (Spelling & Transliteration), initialize suggestions
  useEffect(() => {
    if (activeStep === 2) {
      const nextReview = { ...studentReviewData };
      selectedStudentIds.forEach((id) => {
        const st = groupStudents.find((s) => s.id === id);
        if (!st) return;

        if (!nextReview[id]) {
          const suggestionsName = getTransliterationSuggestions(st.name);
          const suggestionsGuardian = getTransliterationSuggestions(st.guardianName || 'Hari Sharma');
          const meta = getGuardianRelationMeta(st.gender);

          nextReview[id] = {
            nameEn: st.name,
            nameNp: st.nameNp || suggestionsName[0] || st.name,
            suggestionsName,
            guardianNameEn: st.guardianName || 'Guardian',
            guardianNameNp: st.guardianNameNp || suggestionsGuardian[0] || 'अभिभावक',
            suggestionsGuardian,
            gender: st.gender || 'female',
            relationNp: meta.relationNp,
            addressEn: st.address || 'Gokarneshwor, Kathmandu',
            addressNp: st.addressNp || 'गोकर्णेश्वर, काठमाडौँ',
            isSpellingVerified: Boolean(st.nameNp)
          };
        }
      });
      setStudentReviewData(nextReview);
    }
  }, [activeStep, selectedStudentIds, groupStudents]);

  // Step Navigation handlers
  const handleNext = () => {
    if (activeStep === 1 && selectedStudentIds.length === 0) {
      alert('कृपया प्रमाणपत्र जारी गर्न कम्तीमा एकजना विद्यार्थी छान्नुहोस्।');
      return;
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  // Select / Deselect Student
  const handleToggleStudent = (id) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllEligible = () => {
    const eligibleIds = studentEligibilityList
      .filter((item) => item.isEligible && !item.existingCert)
      .map((item) => item.student.id);
    setSelectedStudentIds(eligibleIds);
  };

  // Update Review Field
  const updateReviewField = (studentId, field, value) => {
    setStudentReviewData((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
  };

  // Final Action: Issue Certificates & Create Immutable Snapshots
  const handleFinalIssue = () => {
    if (selectedStudentIds.length === 0) return;

    const currentYear = new Date().getFullYear();
    const today = new Date().toISOString().slice(0, 10);
    const existingList = [...(db.certificates || [])];
    const updatedStudents = [...(db.students || [])];
    const newIssued = [];

    selectedStudentIds.forEach((studentId, idx) => {
      const st = groupStudents.find((s) => s.id === studentId);
      const review = studentReviewData[studentId] || {};
      const nextSeq = String(existingList.length + 1).padStart(4, '0');
      const certNo = `GE-2081-${nextSeq}`;

      // Update student profile with verified Nepali names for future reuse
      const stIdx = updatedStudents.findIndex((s) => s.id === studentId);
      if (stIdx !== -1) {
        updatedStudents[stIdx] = {
          ...updatedStudents[stIdx],
          nameNp: review.nameNp || updatedStudents[stIdx].nameNp,
          guardianNameNp: review.guardianNameNp || updatedStudents[stIdx].guardianNameNp,
          addressNp: review.addressNp || updatedStudents[stIdx].addressNp
        };
      }

      // Generate Immutable Snapshot
      const wording = generateBilingualCertificateWording({
        studentNameEn: st?.name,
        studentNameNp: review.nameNp || st?.name,
        guardianNameEn: review.guardianNameEn,
        guardianNameNp: review.guardianNameNp,
        gender: review.gender,
        addressEn: review.addressEn,
        addressNp: review.addressNp,
        courseTitleEn: selectedCourse?.title || 'Vocational Training',
        courseTitleNp: selectedCourse?.titleNp || selectedCourse?.title || 'व्यावसायिक तालिम',
        trainingHours: selectedCourse?.totalHours || 390,
        startDate: selectedGroup?.startDate || '2026-06-01',
        endDate: selectedGroup?.endDate || '2026-09-01'
      });

      const newCert = {
        id: `CERT-${Date.now()}-${idx}`,
        certificateNo: certNo,
        studentId: studentId,
        groupId: selectedGroupId,
        courseId: selectedCourse?.id,
        issueDate: today,
        templateId: selectedTemplate,
        status: 'Active',
        snapshot: {
          studentNameEn: st?.name,
          studentNameNp: review.nameNp || st?.name,
          guardianNameEn: review.guardianNameEn,
          guardianNameNp: review.guardianNameNp,
          gender: review.gender,
          relationNp: review.relationNp,
          addressEn: review.addressEn,
          addressNp: review.addressNp,
          courseTitleEn: selectedCourse?.title,
          courseTitleNp: selectedCourse?.titleNp || selectedCourse?.title,
          trainingHours: selectedCourse?.totalHours || 390,
          startDate: selectedGroup?.startDate,
          endDate: selectedGroup?.endDate,
          trainerName: trainer.name,
          signatoryName: signatoryName,
          signatoryDesignation: signatoryDesignation,
          offsetY: selectedTemplate === 'preprinted' ? offsetY : 0,
          offsetX: selectedTemplate === 'preprinted' ? offsetX : 0,
          fontScale: selectedTemplate === 'preprinted' ? fontScale : 100,
          wording: wording
        },
        createdAt: new Date().toISOString()
      };

      existingList.unshift(newCert);
      newIssued.push({
        certificate: newCert,
        student: st,
        course: selectedCourse,
        group: selectedGroup
      });
    });

    const nextDb = {
      ...db,
      certificates: existingList,
      students: updatedStudents
    };

    saveDB(nextDb);
    setDb(nextDb);
    setIssuedResults(newIssued);
    setActiveStep(5); // Move to completion step

    try {
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    } catch (_) {}

    if (onIssued) onIssued(newIssued);
  };

  // Preview Student
  const currentPreviewStudentId = selectedStudentIds[previewIndex] || selectedStudentIds[0];
  const currentPreviewStudent = groupStudents.find((s) => s.id === currentPreviewStudentId);
  const currentReview = studentReviewData[currentPreviewStudentId] || {};

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth scroll="paper">
      {/* ============================================================== */}
      {/* HEADER                                                         */}
      {/* ============================================================== */}
      <DialogTitle
        sx={{
          bgcolor: '#0F2E5A',
          color: '#FFFFFF',
          p: 2.2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <WorkspacePremiumIcon sx={{ color: '#F59E0B', fontSize: 32 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900, fontSize: '1.18rem', lineHeight: 1.2 }}>
              प्रमाणपत्र जारी विसार्ड (Certificate Wizard Suite V2.0)
            </Typography>
            <Typography variant="caption" sx={{ color: '#CBD5E1' }}>
              English-नेपाली सुझाव, द्विभाषी ढाँचा, प्रि-प्रिन्टेड क्यालिब्रेसन र अपरिवर्तनीय स्न्यापसट
            </Typography>
          </Box>
        </Box>

        <IconButton onClick={onClose} sx={{ color: '#94A3B8', '&:hover': { color: '#FFFFFF' } }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Stepper Bar */}
      <Box sx={{ bgcolor: '#F8FAFC', p: 2, borderBottom: '1px solid #E2E8F0' }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {WIZARD_STEPS.map((label, idx) => (
            <Step key={idx}>
              <StepLabel
                StepIconProps={{
                  sx: {
                    '&.Mui-active': { color: '#0F2E5A' },
                    '&.Mui-completed': { color: '#059669' }
                  }
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: activeStep === idx ? 800 : 600 }}>
                  {label}
                </Typography>
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {/* ============================================================== */}
      {/* BODY CONTENT PER STEP                                          */}
      {/* ============================================================== */}
      <DialogContent sx={{ p: { xs: 2, sm: 3 }, bgcolor: '#F1F5F9', minHeight: 460 }}>
        {/* ------------------------------------------------------------ */}
        {/* STEP 1: GROUP SELECTION                                      */}
        {/* ------------------------------------------------------------ */}
        {activeStep === 0 && (
          <Box sx={{ maxWidth: 750, mx: 'auto', mt: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#0F2E5A', mb: 1 }}>
              चरण १: तालिम समूह (Batch / Group) छान्नुहोस्
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', mb: 3 }}>
              समूह छान्नासाथ सम्बन्धित पाठ्यक्रम, प्रशिक्षक, तालिम अवधि र सहभागी विद्यार्थीहरू स्वतः लोड हुनेछन्।
            </Typography>

            <Paper elevation={0} sx={{ p: 3, border: '1px solid #CBD5E1', borderRadius: 2.5, bgcolor: '#FFFFFF', mb: 3 }}>
              <TextField
                select
                fullWidth
                label="तालिम समूह (Training Batch)"
                value={selectedGroupId}
                onChange={(e) => {
                  setSelectedGroupId(e.target.value);
                  setSelectedStudentIds([]);
                }}
                sx={{ mb: 2.5 }}
              >
                {db.trainingGroups.map((grp) => {
                  const crs = db.courses.find((c) => c.id === grp.courseId);
                  const stCount = (db.students || []).filter((s) => s.groupId === grp.id).length;
                  return (
                    <MenuItem key={grp.id} value={grp.id}>
                      <strong>{grp.groupCode || grp.name}</strong> — {crs?.title || 'Course'} ({stCount} विद्यार्थी)
                    </MenuItem>
                  );
                })}
              </TextField>

              {/* Group Meta Info Cards */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: 1.5, border: '1px solid #E2E8F0' }}>
                    <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                      पाठ्यक्रम (Course):
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F2E5A' }}>
                      {selectedCourse?.title || 'Vocational Course'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#059669', fontWeight: 700 }}>
                      कुल घण्टा: {selectedCourse?.totalHours || 390} Hours (Level 1)
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: 1.5, border: '1px solid #E2E8F0' }}>
                    <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                      प्रशिक्षक र मिति:
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F2E5A' }}>
                      {trainer.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#475569' }}>
                      {selectedGroup?.startDate} देखि {selectedGroup?.endDate} सम्म
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        )}

        {/* ------------------------------------------------------------ */}
        {/* STEP 2: SELECT STUDENTS & ELIGIBILITY                        */}
        {/* ------------------------------------------------------------ */}
        {activeStep === 1 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#0F2E5A' }}>
                  चरण २: प्रमाणपत्रका लागि विद्यार्थीहरू छान्नुहोस्
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B' }}>
                  हाजिरी ८०% पुगेका र शुल्क चुक्ता भएका विद्यार्थीहरूलाई प्राथमिकताका साथ स्वतः छनोट गरिएको छ।
                </Typography>
              </Box>

              <Button
                variant="outlined"
                size="small"
                onClick={handleSelectAllEligible}
                sx={{ fontWeight: 800, borderColor: '#0F2E5A', color: '#0F2E5A' }}
              >
                सबै योग्य छान्नुहोस् ({studentEligibilityList.filter((i) => i.isEligible && !i.existingCert).length})
              </Button>
            </Box>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #CBD5E1', borderRadius: 2 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#0F2E5A' }}>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={
                          selectedStudentIds.length > 0 && selectedStudentIds.length < groupStudents.length
                        }
                        checked={groupStudents.length > 0 && selectedStudentIds.length === groupStudents.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStudentIds(groupStudents.map((s) => s.id));
                          } else {
                            setSelectedStudentIds([]);
                          }
                        }}
                        sx={{ color: '#FFFFFF', '&.Mui-checked': { color: '#F59E0B' } }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: '#FFFFFF', fontWeight: 800 }}>विद्यार्थी नाम (Name / TGID)</TableCell>
                    <TableCell sx={{ color: '#FFFFFF', fontWeight: 800 }}>हाजिरी (Attendance)</TableCell>
                    <TableCell sx={{ color: '#FFFFFF', fontWeight: 800 }}>शुल्क स्थिति (Fee Status)</TableCell>
                    <TableCell sx={{ color: '#FFFFFF', fontWeight: 800 }}>अवस्था (Status)</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {studentEligibilityList.map(({ student, attPercent, isFeeCleared, due, existingCert, isEligible }) => {
                    const isSelected = selectedStudentIds.includes(student.id);

                    return (
                      <TableRow
                        key={student.id}
                        hover
                        onClick={() => handleToggleStudent(student.id)}
                        sx={{
                          cursor: 'pointer',
                          bgcolor: isSelected ? '#EFF6FF' : existingCert ? '#F8FAFC' : '#FFFFFF'
                        }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox checked={isSelected} sx={{ '&.Mui-checked': { color: '#0F2E5A' } }} />
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F2E5A' }}>
                            {student.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B' }}>
                            {student.tgid} • {student.phone || 'No phone'}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Chip
                            label={`${attPercent}%`}
                            size="small"
                            sx={{
                              bgcolor: attPercent >= 80 ? '#ECFDF5' : '#FEF2F2',
                              color: attPercent >= 80 ? '#059669' : '#DC2626',
                              fontWeight: 800,
                              fontSize: '0.74rem'
                            }}
                          />
                        </TableCell>

                        <TableCell>
                          {isFeeCleared ? (
                            <Chip label="पूर्ण चुक्ता (Clear)" size="small" sx={{ bgcolor: '#ECFDF5', color: '#059669', fontWeight: 800, fontSize: '0.72rem' }} />
                          ) : (
                            <Chip label={`बाँकी: रु. ${due.toLocaleString()}`} size="small" sx={{ bgcolor: '#FFFBEB', color: '#B45309', fontWeight: 800, fontSize: '0.72rem' }} />
                          )}
                        </TableCell>

                        <TableCell>
                          {existingCert ? (
                            <Chip
                              label={`जारी भइसकेको: ${existingCert.certificateNo}`}
                              size="small"
                              sx={{ bgcolor: '#EFF6FF', color: '#1E40AF', fontWeight: 800, fontSize: '0.7rem' }}
                            />
                          ) : isEligible ? (
                            <Chip label="प्रमाणपत्रका लागि योग्य ✓" size="small" sx={{ bgcolor: '#ECFDF5', color: '#047857', fontWeight: 800, fontSize: '0.7rem' }} />
                          ) : (
                            <Chip label="हाजिरी नपुगेको (<८०%)" size="small" sx={{ bgcolor: '#FEF2F2', color: '#DC2626', fontWeight: 800, fontSize: '0.7rem' }} />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* ------------------------------------------------------------ */}
        {/* STEP 3: SPELLING REVIEW & PHONETIC TRANSLITERATION           */}
        {/* ------------------------------------------------------------ */}
        {activeStep === 2 && (
          <Box>
            <Alert severity="info" sx={{ mb: 2.5, borderRadius: 2 }}>
              <strong>अटो-लिप्यन्तरण इन्जिन (Phonetic Transliteration Engine):</strong> अंग्रेजी नाम अनुसार नेपाली सुझावहरू स्वतः तयार भएका छन्। कृपया हिज्जे जाँचेर आवश्यक भए सच्याउनुहोस्। एकपटक स्वीकृत भएपछि यो सधैँका लागि सुरक्षित रहनेछ।
            </Alert>

            <Stack spacing={2}>
              {selectedStudentIds.map((id, index) => {
                const st = groupStudents.find((s) => s.id === id);
                const review = studentReviewData[id] || {};

                return (
                  <Paper
                    key={id}
                    elevation={0}
                    sx={{
                      p: 2.2,
                      border: '1.5px solid #CBD5E1',
                      borderRadius: 2,
                      bgcolor: review.isSpellingVerified ? '#F0FDF4' : '#FFFFFF'
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ bgcolor: '#0F2E5A', width: 28, height: 28, fontSize: '0.8rem' }}>
                          {index + 1}
                        </Avatar>
                        <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0F2E5A' }}>
                          {st?.name} ({st?.tgid})
                        </Typography>
                      </Box>

                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={Boolean(review.isSpellingVerified)}
                            onChange={(e) => updateReviewField(id, 'isSpellingVerified', e.target.checked)}
                            sx={{ color: '#059669', '&.Mui-checked': { color: '#059669' } }}
                          />
                        }
                        label={<Typography variant="caption" sx={{ fontWeight: 800, color: '#065F46' }}>नेपाली हिज्जे जाँचियो (Spelling Verified ✓)</Typography>}
                      />
                    </Box>

                    <Grid container spacing={2}>
                      {/* Student Nepali Name with Dropdown Suggestions */}
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          size="small"
                          label="विद्यार्थीको नेपाली नाम (Nepali Name)"
                          value={review.nameNp || ''}
                          onChange={(e) => updateReviewField(id, 'nameNp', e.target.value)}
                        />
                        {/* Quick suggestions pill */}
                        {review.suggestionsName && review.suggestionsName.length > 1 && (
                          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                            <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.65rem' }}>सुझाव:</Typography>
                            {review.suggestionsName.map((sug, sIdx) => (
                              <Chip
                                key={sIdx}
                                label={sug}
                                size="small"
                                onClick={() => updateReviewField(id, 'nameNp', sug)}
                                sx={{ height: 20, fontSize: '0.68rem', cursor: 'pointer', bgcolor: '#EFF6FF', color: '#1E40AF' }}
                              />
                            ))}
                          </Box>
                        )}
                      </Grid>

                      {/* Guardian Name & Gender Relation */}
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          size="small"
                          label="अभिभावकको नाम (Guardian Nepali)"
                          value={review.guardianNameNp || ''}
                          onChange={(e) => updateReviewField(id, 'guardianNameNp', e.target.value)}
                        />
                        {review.suggestionsGuardian && review.suggestionsGuardian.length > 1 && (
                          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                            <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.65rem' }}>सुझाव:</Typography>
                            {review.suggestionsGuardian.map((sug, sIdx) => (
                              <Chip
                                key={sIdx}
                                label={sug}
                                size="small"
                                onClick={() => updateReviewField(id, 'guardianNameNp', sug)}
                                sx={{ height: 20, fontSize: '0.68rem', cursor: 'pointer', bgcolor: '#FEF3C7', color: '#92400E' }}
                              />
                            ))}
                          </Box>
                        )}
                      </Grid>

                      {/* Gender Relation Pill */}
                      <Grid item xs={12} sm={2}>
                        <TextField
                          select
                          fullWidth
                          size="small"
                          label="सम्बोधन"
                          value={review.relationNp || 'सुपुत्री'}
                          onChange={(e) => updateReviewField(id, 'relationNp', e.target.value)}
                        >
                          <MenuItem value="सुपुत्र">सुपुत्र (Son of)</MenuItem>
                          <MenuItem value="सुपुत्री">सुपुत्री (Daughter of)</MenuItem>
                          <MenuItem value="प्रशिक्षार्थी">प्रशिक्षार्थी (Trainee)</MenuItem>
                        </TextField>
                      </Grid>

                      {/* Permanent Address */}
                      <Grid item xs={12} sm={2}>
                        <TextField
                          fullWidth
                          size="small"
                          label="ठेगाना (Address)"
                          value={review.addressNp || 'काठमाडौँ'}
                          onChange={(e) => updateReviewField(id, 'addressNp', e.target.value)}
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                );
              })}
            </Stack>
          </Box>
        )}

        {/* ------------------------------------------------------------ */}
        {/* STEP 4: CHOOSE TEMPLATE & ORIENTATION                        */}
        {/* ------------------------------------------------------------ */}
        {activeStep === 3 && (
          <Box sx={{ maxWidth: 880, mx: 'auto' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#0F2E5A', mb: 2 }}>
              चरण ४: प्रमाणपत्रको ढाँचा (Template) छान्नुहोस्
            </Typography>

            <Grid container spacing={2.5} sx={{ mb: 3 }}>
              {TEMPLATES.map((tmpl) => {
                const isSelected = selectedTemplate === tmpl.id;
                return (
                  <Grid item xs={12} sm={6} key={tmpl.id}>
                    <Paper
                      elevation={0}
                      onClick={() => setSelectedTemplate(tmpl.id)}
                      sx={{
                        p: 2.5,
                        border: `2px solid ${isSelected ? tmpl.border : '#CBD5E1'}`,
                        borderRadius: 2.5,
                        bgcolor: isSelected ? '#F8FAFC' : '#FFFFFF',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: isSelected ? '0 6px 20px rgba(0,0,0,0.08)' : 'none',
                        position: 'relative'
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0F2E5A' }}>
                          {tmpl.title}
                        </Typography>
                        <Chip
                          label={tmpl.tag}
                          size="small"
                          sx={{ bgcolor: `${tmpl.border}20`, color: tmpl.border, fontWeight: 800, fontSize: '0.68rem' }}
                        />
                      </Box>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 1.5, lineHeight: 1.5 }}>
                        {tmpl.desc}
                      </Typography>

                      <FormControlLabel
                        control={<Checkbox checked={isSelected} sx={{ color: tmpl.border, '&.Mui-checked': { color: tmpl.border } }} />}
                        label={<Typography variant="body2" sx={{ fontWeight: 700 }}>यो ढाँचा प्रयोग गर्नुहोस्</Typography>}
                      />
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>

            {/* Authorized Signatory Details */}
            <Paper elevation={0} sx={{ p: 2.5, border: '1px solid #CBD5E1', borderRadius: 2, bgcolor: '#FFFFFF' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F2E5A', mb: 1.5 }}>
                हस्ताक्षरकर्ताको विवरण (Authorized Signatory)
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="हस्ताक्षरकर्ताको नाम (Director Name)"
                    value={signatoryName}
                    onChange={(e) => setSignatoryName(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="पद (Designation)"
                    value={signatoryDesignation}
                    onChange={(e) => setSignatoryDesignation(e.target.value)}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Box>
        )}

        {/* ------------------------------------------------------------ */}
        {/* STEP 5: LIVE PREVIEW & PRE-PRINTED CALIBRATION               */}
        {/* ------------------------------------------------------------ */}
        {activeStep === 4 && (
          <Box>
            {/* Student Switcher in Preview */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0F2E5A' }}>
                  विद्यार्थी पूर्वावलोकन ({previewIndex + 1} / {selectedStudentIds.length}):
                </Typography>
                <TextField
                  select
                  size="small"
                  value={previewIndex}
                  onChange={(e) => setPreviewIndex(Number(e.target.value))}
                  sx={{ width: 220 }}
                >
                  {selectedStudentIds.map((stId, pIdx) => {
                    const st = groupStudents.find((s) => s.id === stId);
                    return (
                      <MenuItem key={stId} value={pIdx}>
                        {st?.name}
                      </MenuItem>
                    );
                  })}
                </TextField>
              </Box>

              {/* Pre-printed Offset calibration popup / bar */}
              {selectedTemplate === 'preprinted' && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, bgcolor: '#FEF3C7', p: 1, px: 2, borderRadius: 2, border: '1px solid #FDE68A' }}>
                  <TuneIcon sx={{ color: '#B45309', fontSize: 20 }} />
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#92400E' }}>
                    Y-Offset: <strong>{offsetY}mm</strong> | X-Offset: <strong>{offsetX}mm</strong>
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Pre-printed Calibrator Slider Bar (If preprinted mode selected) */}
            {selectedTemplate === 'preprinted' && (
              <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: '#FFFBEB', border: '1.5px dashed #F59E0B', borderRadius: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#B45309', display: 'block', mb: 1 }}>
                  🎛️ प्रि-प्रिन्टेड पेपर मिलान क्यालिब्रेसन (Offset Adjustment in Millimeters)
                </Typography>
                <Grid container spacing={3} alignItems="center">
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption">माथि/तल (Top/Bottom Offset Y: {offsetY} mm)</Typography>
                    <Slider
                      value={offsetY}
                      min={-20}
                      max={20}
                      step={1}
                      onChange={(e, val) => setOffsetY(val)}
                      sx={{ color: '#D97706' }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption">दायाँ/बायाँ (Left/Right Offset X: {offsetX} mm)</Typography>
                    <Slider
                      value={offsetX}
                      min={-20}
                      max={20}
                      step={1}
                      onChange={(e, val) => setOffsetX(val)}
                      sx={{ color: '#D97706' }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption">अक्षरको आकार (Font Scale: {fontScale}%)</Typography>
                    <Slider
                      value={fontScale}
                      min={85}
                      max={115}
                      step={1}
                      onChange={(e, val) => setFontScale(val)}
                      sx={{ color: '#D97706' }}
                    />
                  </Grid>
                </Grid>
              </Paper>
            )}

            {/* ========================================================== */}
            {/* REALISTIC CERTIFICATE PREVIEW CANVAS                       */}
            {/* ========================================================== */}
            <Box
              sx={{
                width: '100%',
                bgcolor: selectedTemplate === 'preprinted' ? '#FAFAFA' : '#FFFFFF',
                border: selectedTemplate === 'preprinted' ? '2px dashed #CBD5E1' : '3px solid #0F2E5A',
                outline: selectedTemplate === 'preprinted' ? 'none' : '2px solid #C59B27',
                outlineOffset: '-6px',
                borderRadius: 2,
                p: { xs: 2.5, sm: 4 },
                boxShadow: '0 10px 35px rgba(0,0,0,0.08)',
                position: 'relative',
                transform: `translate(${offsetX * 1.5}px, ${offsetY * 1.5}px)`,
                transition: 'transform 0.15s ease'
              }}
            >
              {/* Header (Hidden in Preprinted mode) */}
              {selectedTemplate !== 'preprinted' && (
                <Box sx={{ textAlign: 'center', borderBottom: '2px solid #0F2E5A', pb: 2, mb: 3 }}>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: '#0F2E5A', letterSpacing: '0.04em' }}>
                    ग्लोबल एरा प्राविधिक स्कुल
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1E40AF' }}>
                    GLOBAL ERA TECHNICAL SCHOOL / GLOBAL ERA MULTI SERVICE PVT. LTD.
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.3 }}>
                    गोकर्णेश्वर-०५, जोरपाटी, काठमाडौँ | फोन: ०१-४९१५५५५ | CTEVT Affiliated
                  </Typography>
                </Box>
              )}

              {/* Title Ribbon */}
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 900,
                    color: '#C59B27',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    fontSize: `${1.1 * (fontScale / 100)}rem`
                  }}
                >
                  तालिम समापन प्रमाणपत्र (CERTIFICATE OF COMPLETION)
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B' }}>
                  Certificate No: <strong>GE-2081-XXXX</strong> • Date: <strong>{new Date().toISOString().slice(0, 10)}</strong>
                </Typography>
              </Box>

              {/* Student Name Display */}
              <Box sx={{ textAlign: 'center', my: 2 }}>
                <Typography variant="caption" sx={{ color: '#64748B' }}>
                  यो प्रमाणपत्र प्रदान गरिएको छ / This is proudly presented to:
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 900,
                    color: '#0F2E5A',
                    fontFamily: 'serif',
                    mt: 1,
                    fontSize: `${1.9 * (fontScale / 100)}rem`
                  }}
                >
                  {currentPreviewStudent?.name}
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#059669', mt: 0.5 }}>
                  ({currentReview.nameNp || currentPreviewStudent?.name})
                </Typography>
              </Box>

              {/* Course & Content */}
              <Box sx={{ textAlign: 'center', maxWidth: 750, mx: 'auto', my: 2 }}>
                <Typography
                  variant="body2"
                  sx={{
                    lineHeight: 1.8,
                    color: '#334155',
                    fontSize: `${0.92 * (fontScale / 100)}rem`
                  }}
                >
                  {currentReview.addressNp || 'काठमाडौँ'} निवासी श्री {currentReview.guardianNameNp || 'अभिभावक'}को{' '}
                  <strong>{currentReview.relationNp || 'सुपुत्री'}</strong>ले यस संस्थाबाट सञ्चालित{' '}
                  <strong>{selectedCourse?.title || 'व्यावसायिक तालिम'}</strong> ({selectedCourse?.totalHours || 390} घण्टा) को
                  तालिम सफलतापूर्वक सम्पन्न गरी उत्कृष्ट श्रेणी हासिल गर्नुभएको प्रमाणित गरिन्छ।
                </Typography>
              </Box>

              {/* Signatures & QR */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', pt: 4, mt: 2 }}>
                <Box sx={{ textAlign: 'center', width: 140 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2E5A', display: 'block' }}>
                    {trainer.name}
                  </Typography>
                  <Box sx={{ borderBottom: '1.5px solid #0F2E5A', mb: 0.5 }} />
                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                    प्रशिक्षक (Instructor)
                  </Typography>
                </Box>

                <Box sx={{ textAlign: 'center' }}>
                  <QRCodeSVG value={`GE-VERIFY:${currentPreviewStudent?.tgid}:2081`} size={50} level="M" />
                  <Typography variant="caption" sx={{ display: 'block', color: '#059669', fontWeight: 800, fontSize: '0.62rem' }}>
                    स्क्यान प्रमाणीकरण
                  </Typography>
                </Box>

                <Box sx={{ textAlign: 'center', width: 160 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2E5A', display: 'block' }}>
                    {signatoryName}
                  </Typography>
                  <Box sx={{ borderBottom: '1.5px solid #0F2E5A', mb: 0.5 }} />
                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                    {signatoryDesignation}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        )}

        {/* ------------------------------------------------------------ */}
        {/* STEP 6: ISSUANCE COMPLETE & RESULTS                          */}
        {/* ------------------------------------------------------------ */}
        {activeStep === 5 && (
          <Box sx={{ textAlign: 'center', py: 4, maxWidth: 650, mx: 'auto' }}>
            <CheckCircleIcon sx={{ color: '#059669', fontSize: 64, mb: 1.5 }} />
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#0F2E5A', mb: 1 }}>
              बधाई छ! {issuedResults.length} वटा प्रमाणपत्र सफलतापूर्वक जारी भए!
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', mb: 3 }}>
              सबै विद्यार्थीका प्रमाणपत्रहरूको अपरिवर्तनीय स्न्यापसट सुरक्षित गरिएको छ र युनिक प्रमाणपत्र नम्बर दर्ता भइसकेको छ।
            </Typography>

            <Paper elevation={0} sx={{ p: 2, border: '1px solid #CBD5E1', borderRadius: 2, mb: 3, maxHeight: 220, overflowY: 'auto' }}>
              {issuedResults.map((res, rIdx) => (
                <Box
                  key={rIdx}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 1,
                    borderBottom: rIdx < issuedResults.length - 1 ? '1px solid #E2E8F0' : 'none'
                  }}
                >
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F2E5A' }}>
                      {res.student.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>
                      {res.student.tgid}
                    </Typography>
                  </Box>
                  <Chip
                    label={res.certificate.certificateNo}
                    size="small"
                    sx={{ bgcolor: '#EFF6FF', color: '#1E40AF', fontWeight: 900, fontFamily: 'monospace' }}
                  />
                </Box>
              ))}
            </Paper>

            <Button
              variant="contained"
              size="large"
              startIcon={<PrintIcon />}
              onClick={() => {
                onClose();
                window.print();
              }}
              sx={{
                bgcolor: '#059669',
                fontWeight: 900,
                px: 4,
                py: 1.2,
                borderRadius: 2.5,
                '&:hover': { bgcolor: '#047857' }
              }}
            >
              सबै प्रमाणपत्र प्रिन्ट गर्नुहोस् (Print All Issued)
            </Button>
          </Box>
        )}
      </DialogContent>

      {/* ============================================================== */}
      {/* FOOTER ACTIONS                                                 */}
      {/* ============================================================== */}
      <DialogActions sx={{ px: 3, py: 2, bgcolor: '#FFFFFF', borderTop: '1px solid #E2E8F0', justifyContent: 'space-between' }}>
        <Button
          onClick={activeStep === 0 ? onClose : handleBack}
          startIcon={activeStep > 0 ? <ArrowBackIcon /> : null}
          disabled={activeStep === 5}
          sx={{ color: '#64748B', fontWeight: 700 }}
        >
          {activeStep === 0 ? 'रद्द गर्नुहोस् (Cancel)' : 'पछाडि (Back)'}
        </Button>

        {activeStep < 4 && (
          <Button
            variant="contained"
            onClick={handleNext}
            endIcon={<ArrowForwardIcon />}
            sx={{
              bgcolor: '#0F2E5A',
              fontWeight: 800,
              px: 3.5,
              borderRadius: 2,
              '&:hover': { bgcolor: '#1E3A8A' }
            }}
          >
            अर्को चरण (Next)
          </Button>
        )}

        {activeStep === 4 && (
          <Button
            variant="contained"
            onClick={handleFinalIssue}
            startIcon={<WorkspacePremiumIcon />}
            sx={{
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              fontWeight: 900,
              px: 4,
              py: 1,
              borderRadius: 2.5,
              boxShadow: '0 4px 14px rgba(5, 150, 105, 0.35)'
            }}
          >
            पुष्टि गरी प्रमाणपत्र जारी गर्नुहोस् ({selectedStudentIds.length} जना)
          </Button>
        )}

        {activeStep === 5 && (
          <Button variant="outlined" onClick={onClose} sx={{ fontWeight: 800, color: '#0F2E5A', borderColor: '#0F2E5A' }}>
            विसार्ड बन्द गर्नुहोस् (Close)
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
