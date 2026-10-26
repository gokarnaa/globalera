import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  Grid,
  TextField,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Paper,
  InputAdornment,
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import PrintIcon from '@mui/icons-material/Print';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import SchoolIcon from '@mui/icons-material/School';
import PaymentsIcon from '@mui/icons-material/Payments';
import WorkIcon from '@mui/icons-material/Work';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import BadgeIcon from '@mui/icons-material/Badge';

import { loadDB, saveDB } from '../../services/storage';
import NewAdmissionModal from './NewAdmissionModal';
import AdmissionAgreementPrintModal from './AdmissionAgreementPrintModal';
import StudentIdCardModal from './StudentIdCardModal';

export default function AdmissionManager() {
  const [db, setDb] = useState(() => loadDB());
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('ALL');
  const [ojtFilter, setOjtFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [newAdmissionOpen, setNewAdmissionOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [idCardModalOpen, setIdCardModalOpen] = useState(false);
  const [selectedForIdCard, setSelectedForIdCard] = useState(null);

  const [toastMsg, setToastMsg] = useState('');
  const [toastSeverity, setToastSeverity] = useState('success');

  const showToast = (msg, severity = 'success') => {
    setToastMsg(msg);
    setToastSeverity(severity);
    setTimeout(() => setToastMsg(''), 4500);
  };

  const admissions = useMemo(() => {
    return db.admissions || [];
  }, [db.admissions]);

  // Seed sample admissions if empty and students exist
  React.useEffect(() => {
    if ((!db.admissions || db.admissions.length === 0) && (db.students || []).length > 0) {
      const initialAdmissions = (db.students || []).slice(0, 3).map((st, idx) => {
        const grp = (db.trainingGroups || []).find((g) => g.id === st.groupId) || {};
        const crs = (db.courses || []).find((c) => c.id === grp.courseId) || (db.courses || [])[0] || {};
        const fee = crs.price || 15000;
        const advance = Math.round(fee * 0.5);
        const due = fee - advance;
        const admDate = st.admissionDate || '2026-09-01';
        const d = new Date(admDate);
        d.setDate(d.getDate() + 30);
        const dueDate = d.toISOString().slice(0, 10);

        return {
          id: `ADM-SEED-${idx + 1}`,
          agreementNo: `GE-AGR-2081-${String(idx + 1).padStart(3, '0')}`,
          studentId: st.id,
          tgid: st.tgid || `TGID-${101 + idx}`,
          studentName: st.name,
          phone: st.phone,
          secondaryPhone: st.secondaryPhone || '',
          gender: st.gender || 'Female',
          citizenshipNumber: st.citizenshipNumber || '',
          currentAddress: st.currentAddress || 'Kathmandu',
          permanentAddress: st.permanentAddress || 'Kathmandu',
          fatherName: st.fatherName || '',
          guardianContact: st.guardianContact || st.phone,

          courseId: crs.id,
          courseTitle: crs.title || 'Basic Beautician',
          groupId: grp.id || 'GRP-01',
          groupName: grp.name || 'Batch 1',
          shift: grp.shift || 'Shift A',
          timing: grp.timing || '07:00 AM – 09:00 AM',
          duration: `${crs.durationValue || 3} ${crs.durationUnit || 'Months'} (${crs.totalHours || 390} घण्टा)`,
          keySkills: crs.description || 'पाठ्यक्रम अनुसार प्रयोगात्मक तथा सैद्धान्तिक सीपहरू।',

          ojtPreference: idx % 2 === 0 ? 'REQUIRED' : 'NOT_REQUIRED',
          ojtFee: 0,
          batchTransferAllowed: true,

          totalCourseFee: fee,
          discountAmount: 0,
          netPayableFee: fee,
          advancePaid50: advance,
          dueAmount50: due,
          dueDate,
          paymentMethod: 'Cash',
          receiptNo: `REC-ADM-00${idx + 1}`,

          admissionDate: admDate,
          admissionDateBS: '२०८१/०६/' + String(10 + idx * 2),
          status: 'ACTIVE',
          createdAt: new Date().toISOString()
        };
      });

      const nextDb = { ...db, admissions: initialAdmissions };
      saveDB(nextDb);
      setDb(nextDb);
    }
  }, [db]);

  // KPI Calculations
  const totalAdmissionsCount = admissions.length;
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayAdmissionsCount = admissions.filter((a) => a.admissionDate === todayStr).length;

  const totalAdvanceCollected = admissions.reduce(
    (sum, a) => sum + (Number(a.advancePaid50) || 0),
    0
  );
  const totalPendingDue = admissions.reduce(
    (sum, a) => sum + (Number(a.dueAmount50) || 0),
    0
  );

  // Filtered Admissions
  const filteredAdmissions = useMemo(() => {
    return admissions.filter((item) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = (item.studentName || '').toLowerCase().includes(q);
        const matchPhone = (item.phone || '').includes(q);
        const matchAgr = (item.agreementNo || '').toLowerCase().includes(q);
        const matchCourse = (item.courseTitle || '').toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchAgr && !matchCourse) return false;
      }

      // Course Filter
      if (courseFilter !== 'ALL' && item.courseId !== courseFilter) {
        return false;
      }

      // OJT Filter
      if (ojtFilter !== 'ALL' && item.ojtPreference !== ojtFilter) {
        return false;
      }

      // Status Filter
      if (statusFilter === 'DUE' && (Number(item.dueAmount50) || 0) <= 0) return false;
      if (statusFilter === 'PAID' && (Number(item.dueAmount50) || 0) > 0) return false;

      return true;
    });
  }, [admissions, search, courseFilter, ojtFilter, statusFilter]);

  const handleOpenPrint = (admission) => {
    setSelectedAdmission(admission);
    setPrintModalOpen(true);
  };

  const handleOpenIdCard = (admission) => {
    setSelectedForIdCard(admission);
    setIdCardModalOpen(true);
  };

  const handleDelete = (admissionId, name) => {
    if (window.confirm(`के तपाईं विद्यार्थी ${name} को भर्ना सम्झौता रद्द गर्न चाहनुहुन्छ?`)) {
      const updated = admissions.filter((a) => a.id !== admissionId);
      const nextDb = { ...db, admissions: updated };
      saveDB(nextDb);
      setDb(nextDb);
      showToast(`भर्ना सम्झौता हटाइयो।`, 'info');
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: '1440px', mx: 'auto' }}>
      {/* Toast Alert */}
      {toastMsg && (
        <Alert severity={toastSeverity} sx={{ mb: 2.5, fontWeight: 700 }}>
          {toastMsg}
        </Alert>
      )}

      {/* Hero Header Banner */}
      <Card
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3.5 },
          mb: 3.5,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #0f2e5a 0%, #1e3a8a 100%)',
          color: '#ffffff',
          boxShadow: '0 10px 25px rgba(15,46,90,0.18)'
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
              <HowToRegIcon sx={{ fontSize: 36, color: '#f59e0b' }} />
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#ffffff' }}>
                विद्यार्थी भर्ना तथा तालिम सम्झौता (Admission & Agreement)
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ color: '#e2e8f0', maxWidth: '780px', lineHeight: 1.6 }}>
              ग्लोबल एरा प्राविधिक स्कुल जोरपाटी — विद्यार्थी भर्ना गर्दा ५०% अग्रिम शुल्क सङ्कलन, १ महिनाको बाँकी भाका, निःशुल्क OJT इन्टर्नशिप रोजाइ र कानुनी मान्यता प्राप्त <strong>२-प्रति (Office Copy र Student Copy) A4 सम्झौता पत्र</strong> स्वतः जारी गर्नुहोस्।
            </Typography>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              onClick={() => setNewAdmissionOpen(true)}
              sx={{
                bgcolor: '#f59e0b',
                color: '#0f2e5a',
                fontWeight: 900,
                fontSize: '0.95rem',
                px: 3,
                py: 1.4,
                boxShadow: '0 4px 14px rgba(245,158,11,0.4)',
                '&:hover': { bgcolor: '#d97706', color: '#ffffff' }
              }}
            >
              + नयाँ भर्ना तथा सम्झौता (New Admission)
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* 4 Top KPI Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        {/* Total Admissions */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 2.5,
              border: '1px solid #e2e8f0',
              bgcolor: '#ffffff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  कुल भर्ना सम्झौता
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#0f2e5a', mt: 0.5 }}>
                  {totalAdmissionsCount}
                </Typography>
                <Typography variant="caption" sx={{ color: '#059669', fontWeight: 700 }}>
                  विद्यार्थी दर्ता सम्पन्न
                </Typography>
              </Box>
              <Box sx={{ p: 1.5, bgcolor: '#eff6ff', borderRadius: 2, color: '#1e40af' }}>
                <SchoolIcon sx={{ fontSize: 28 }} />
              </Box>
            </Stack>
          </Card>
        </Grid>

        {/* Today's Admissions */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 2.5,
              border: '1px solid #e2e8f0',
              bgcolor: '#ffffff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  आजको नयाँ भर्ना
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#0284c7', mt: 0.5 }}>
                  {todayAdmissionsCount}
                </Typography>
                <Typography variant="caption" sx={{ color: '#0284c7', fontWeight: 700 }}>
                  मिति: {todayStr}
                </Typography>
              </Box>
              <Box sx={{ p: 1.5, bgcolor: '#f0f9ff', borderRadius: 2, color: '#0284c7' }}>
                <HowToRegIcon sx={{ fontSize: 28 }} />
              </Box>
            </Stack>
          </Card>
        </Grid>

        {/* 50% Advance Fees Collected */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 2.5,
              border: '1px solid #e2e8f0',
              bgcolor: '#ffffff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  ५०% अग्रिम सङ्कलन रकम
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, color: '#059669', mt: 0.5 }}>
                  रु. {totalAdvanceCollected.toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ color: '#059669', fontWeight: 700 }}>
                  भर्नाकै बखत प्राप्त रकम
                </Typography>
              </Box>
              <Box sx={{ p: 1.5, bgcolor: '#ecfdf5', borderRadius: 2, color: '#059669' }}>
                <PaymentsIcon sx={{ fontSize: 28 }} />
              </Box>
            </Stack>
          </Card>
        </Grid>

        {/* Remaining 50% Due in 30 Days */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 2.5,
              border: '1px solid #e2e8f0',
              bgcolor: '#ffffff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  बाँकी किस्ता रकम (३० दिन भित्र)
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, color: '#dc2626', mt: 0.5 }}>
                  रु. {totalPendingDue.toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 700 }}>
                  १ महिनाभित्र असुल गर्नुपर्ने
                </Typography>
              </Box>
              <Box sx={{ p: 1.5, bgcolor: '#fef2f2', borderRadius: 2, color: '#dc2626' }}>
                <ReceiptLongIcon sx={{ fontSize: 28 }} />
              </Box>
            </Stack>
          </Card>
        </Grid>
      </Grid>

      {/* Filter and Search Bar */}
      <Card
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 2,
          border: '1px solid #e2e8f0',
          bgcolor: '#ffffff'
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={5}>
            <TextField
              fullWidth
              size="small"
              placeholder="विद्यार्थीको नाम, फोन वा सम्झौता नं खोजी गर्नुहोस्..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#94a3b8' }} />
                  </InputAdornment>
                )
              }}
            />
          </Grid>

          <Grid item xs={12} sm={2.5}>
            <TextField
              select
              fullWidth
              size="small"
              label="कोर्स अनुसार"
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
            >
              <MenuItem value="ALL">सबै कोर्सहरू (All Courses)</MenuItem>
              {(db.courses || []).map((crs) => (
                <MenuItem key={crs.id} value={crs.id}>
                  {crs.title}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={6} sm={2.2}>
            <TextField
              select
              fullWidth
              size="small"
              label="OJT प्राथमिकता"
              value={ojtFilter}
              onChange={(e) => setOjtFilter(e.target.value)}
            >
              <MenuItem value="ALL">सबै (All OJT)</MenuItem>
              <MenuItem value="REQUIRED">OJT आवश्यक (Yes)</MenuItem>
              <MenuItem value="NOT_REQUIRED">OJT नचाहिने (No)</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={6} sm={2.3}>
            <TextField
              select
              fullWidth
              size="small"
              label="किस्ता स्थिति"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="ALL">सबै स्थिति (All)</MenuItem>
              <MenuItem value="DUE">दोस्रो किस्ता बाँकी (Due)</MenuItem>
              <MenuItem value="PAID">पूर्ण चुक्ता (Fully Paid)</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Card>

      {/* Admissions Table */}
      <Card elevation={0} sx={{ borderRadius: 2.5, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, color: '#0f2e5a' }}>सम्झौता नं / मिति</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#0f2e5a' }}>विद्यार्थीको विवरण</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#0f2e5a' }}>तालिम तथा ब्याच</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#0f2e5a' }}>OJT सुविधा</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#0f2e5a' }} align="right">
                  शुल्क / ५०% अग्रिम
                </TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#0f2e5a' }}>दोस्रो किस्ता / ३०-दिने भाका</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#0f2e5a' }} align="center">
                  कार्यहरू (Actions)
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAdmissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 5, color: '#64748b' }}>
                    कुनै भर्ना सम्झौता फेला परेन। '+ नयाँ भर्ना तथा सम्झौता' बटन थिचेर पहिलो सम्झौता दर्ता गर्नुहोस्।
                  </TableCell>
                </TableRow>
              ) : (
                filteredAdmissions.map((adm) => (
                  <TableRow key={adm.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    {/* Agreement No & Date */}
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f2e5a' }}>
                        {adm.agreementNo}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                        भर्ना: {adm.admissionDateBS || adm.admissionDate}
                      </Typography>
                      <Chip
                        label="सक्रिय सम्झौता"
                        size="small"
                        sx={{
                          height: '20px',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          bgcolor: '#ecfdf5',
                          color: '#065f46',
                          mt: 0.5
                        }}
                      />
                    </TableCell>

                    {/* Student Info */}
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b' }}>
                        {adm.studentName}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#475569', display: 'block' }}>
                        फोन: {adm.phone}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
                        रोल: {adm.studentId} ({adm.tgid})
                      </Typography>
                    </TableCell>

                    {/* Course & Shift */}
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f2e5a' }}>
                        {adm.courseTitle}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                        {adm.groupName} | {adm.shift}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                        {adm.duration}
                      </Typography>
                    </TableCell>

                    {/* OJT Preference */}
                    <TableCell>
                      {adm.ojtPreference === 'REQUIRED' ? (
                        <Chip
                          icon={<WorkIcon sx={{ fontSize: '14px !important' }} />}
                          label="OJT आवश्यक (निःशुल्क)"
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.74rem',
                            bgcolor: '#f0fdf4',
                            color: '#15803d',
                            border: '1px solid #bbf7d0'
                          }}
                        />
                      ) : (
                        <Chip
                          label="OJT नचाहिने"
                          size="small"
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.74rem',
                            bgcolor: '#f1f5f9',
                            color: '#64748b'
                          }}
                        />
                      )}
                    </TableCell>

                    {/* Fee & 50% Paid */}
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f2e5a' }}>
                        रु. {(Number(adm.netPayableFee) || 0).toLocaleString()}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#059669', fontWeight: 800, display: 'block' }}>
                        ५०% भुक्तान: रु. {(Number(adm.advancePaid50) || 0).toLocaleString()}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        विधि: {adm.paymentMethod}
                      </Typography>
                    </TableCell>

                    {/* 2nd Installment & Due Date */}
                    <TableCell>
                      {adm.dueAmount50 > 0 ? (
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: '#dc2626' }}>
                            बाँकी: रु. {adm.dueAmount50.toLocaleString()}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#991b1b', fontWeight: 700, display: 'block' }}>
                            भाका: {adm.dueDate}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            (३० दिन भित्र अनिवार्य)
                          </Typography>
                        </Box>
                      ) : (
                        <Chip
                          label="पूर्ण चुक्ता (Paid)"
                          size="small"
                          sx={{ bgcolor: '#ecfdf5', color: '#047857', fontWeight: 800 }}
                        />
                      )}
                    </TableCell>

                    {/* Action Buttons */}
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Tooltip title="Epson L8050 CR-80 प्लास्टिक ID कार्ड प्रिन्ट गर्नुहोस्">
                          <Button
                            variant="contained"
                            size="small"
                            color="warning"
                            startIcon={<BadgeIcon />}
                            onClick={() => handleOpenIdCard(adm)}
                            sx={{ fontWeight: 800, fontSize: '0.78rem', py: 0.6, bgcolor: '#f59e0b', color: '#0f2e5a', '&:hover': { bgcolor: '#d97706', color: '#ffffff' } }}
                          >
                            ID कार्ड
                          </Button>
                        </Tooltip>

                        <Tooltip title="A4 सम्झौता पत्र प्रिन्ट गर्नुहोस् (Print 2-Copy Agreement)">
                          <Button
                            variant="contained"
                            size="small"
                            color="primary"
                            startIcon={<PrintIcon />}
                            onClick={() => handleOpenPrint(adm)}
                            sx={{ fontWeight: 800, fontSize: '0.78rem', py: 0.6 }}
                          >
                            सम्झौता
                          </Button>
                        </Tooltip>

                        <Tooltip title="सम्झौता रद्द गर्नुहोस्">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(adm.id, adm.studentName)}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* New Admission Modal */}
      <NewAdmissionModal
        open={newAdmissionOpen}
        onClose={() => setNewAdmissionOpen(false)}
        db={db}
        setDb={setDb}
        showToast={showToast}
        onAdmissionCreated={(createdAdmission) => {
          setSelectedAdmission(createdAdmission);
          setPrintModalOpen(true);
        }}
      />

      {/* A4 2-Copy Printable Modal */}
      <AdmissionAgreementPrintModal
        open={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        admission={selectedAdmission}
      />

      {/* Epson L8050 Printable Student ID Card Modal */}
      <StudentIdCardModal
        open={idCardModalOpen}
        onClose={() => setIdCardModalOpen(false)}
        admission={selectedForIdCard}
      />
    </Box>
  );
}
