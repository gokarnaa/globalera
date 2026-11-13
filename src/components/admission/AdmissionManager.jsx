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
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  TablePagination
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
import CloseIcon from '@mui/icons-material/Close';
import SyncIcon from '@mui/icons-material/Sync';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ContactsIcon from '@mui/icons-material/Contacts';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';

import { loadDB, saveDB } from '../../services/storage';
import { getWhatsAppUrl } from '../../services/exportUtils';
import { sendMetaWhatsAppMessage } from '../../services/whatsappCloudApi';
import NewAdmissionModal from './NewAdmissionModal';
import AdmissionAgreementPrintModal from './AdmissionAgreementPrintModal';
import StudentIdCardModal from './StudentIdCardModal';

export default function AdmissionManager({ pendingLead = null, onClearPendingLead }) {
  const [db, setDb] = useState(() => loadDB());
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('ALL');
  const [ojtFilter, setOjtFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const [newAdmissionOpen, setNewAdmissionOpen] = useState(false);
  const [selectedLeadForAdmission, setSelectedLeadForAdmission] = useState(null);
  const [admitFromLeadOpen, setAdmitFromLeadOpen] = useState(false);
  const [leadSearchQuery, setLeadSearchQuery] = useState('');

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

  // If redirected from LeadManager with pendingLead
  React.useEffect(() => {
    if (pendingLead) {
      setSelectedLeadForAdmission(pendingLead);
      setNewAdmissionOpen(true);
      if (onClearPendingLead) {
        onClearPendingLead();
      }
    }
  }, [pendingLead, onClearPendingLead]);

  const admissions = useMemo(() => {
    return db.admissions || [];
  }, [db.admissions]);

  // Unconverted leads for quick admission
  const unconvertedLeads = useMemo(() => {
    return (db.leads || []).filter((l) => l.stage !== 'Converted');
  }, [db.leads]);

  // Check for past converted students that are missing an admission agreement
  const unsyncedStudents = useMemo(() => {
    const studentList = db.students || [];
    const admList = db.admissions || [];
    return studentList.filter((s) => {
      if (!s.convertedFromLeadId) return false;
      const alreadyInAdm = admList.some(
        (a) => a.studentId === s.id || (a.convertedFromLeadId && a.convertedFromLeadId === s.convertedFromLeadId)
      );
      return !alreadyInAdm;
    });
  }, [db.students, db.admissions]);

  const handleAutoSyncConvertedStudents = () => {
    if (unsyncedStudents.length === 0) return;
    const currentAdmissions = [...(db.admissions || [])];
    const newAdmissions = [];

    unsyncedStudents.forEach((student, idx) => {
      const agreementCount = currentAdmissions.length + newAdmissions.length + 1;
      const agreementNo = `GE-AGR-2025-${String(agreementCount).padStart(3, '0')}`;
      const groupObj = (db.trainingGroups || []).find((g) => g.id === student.groupId) || {};
      const courseObj = (db.courses || []).find((c) => c.id === groupObj.courseId) || {};
      const totalFee = Number(student.lockedCourseFee || student.originalFee) || 15000;
      const advancePaid50 = Math.round(totalFee * 0.5);
      const dueAmount50 = Math.max(0, totalFee - advancePaid50);

      newAdmissions.push({
        id: `ADM-SYNC-${Date.now()}-${idx}`,
        agreementNo,
        studentId: student.id,
        tgid: student.tgid,
        studentName: student.name,
        phone: student.phone,
        secondaryPhone: student.secondaryPhone || '',
        gender: student.gender || 'Female',
        bloodGroup: student.bloodGroup || 'O+ve',
        photoUrl: student.photoUrl || '',
        expectedEndDate: student.expectedEndDate || '',
        citizenshipNumber: student.citizenshipNumber || '',
        currentAddress: student.currentAddress || '',
        permanentAddress: student.permanentAddress || student.currentAddress || '',
        fatherName: student.fatherName || '',
        guardianContact: student.guardianContact || student.phone,
        courseId: courseObj.id || groupObj.courseId || 'CRS-01',
        courseTitle: courseObj.title || groupObj.courseName || 'Vocational Training',
        groupId: groupObj.id || student.groupId || 'GRP-01',
        groupName: groupObj.groupCode || groupObj.name || 'Batch 1',
        shift: groupObj.shift || 'Shift A',
        timing: groupObj.timing || '07:00 AM – 09:00 AM',
        duration: `${courseObj.durationValue || 3} ${courseObj.durationUnit || 'Months'}`,
        keySkills: courseObj.description || '',
        ojtPreference: 'REQUIRED',
        ojtFee: 0,
        batchTransferAllowed: true,
        totalCourseFee: totalFee,
        discountAmount: Number(student.discountAmount) || 0,
        netPayableFee: totalFee,
        advancePaid50,
        dueAmount50,
        dueDate: student.expectedEndDate || '',
        paymentMethod: 'Cash',
        receiptNo: `REC-SYNC-${Date.now().toString().slice(-6)}`,
        admissionDate: student.admissionDate || new Date().toISOString().slice(0, 10),
        admissionDateBS: student.admissionDate || new Date().toISOString().slice(0, 10),
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        convertedFromLeadId: student.convertedFromLeadId,
        admissionSource: 'Lead Inquiry'
      });
    });

    const nextDb = {
      ...db,
      admissions: [...newAdmissions, ...currentAdmissions]
    };
    saveDB(nextDb);
    setDb(nextDb);
    showToast(`Successfully synced ${newAdmissions.length} converted student(s) into Admission Agreements!`, 'success');
  };

  // Keep Admissions reactive across tabs/modals
  React.useEffect(() => {
    const refreshDb = () => setDb(loadDB());
    window.addEventListener('kite_db_updated', refreshDb);
    window.addEventListener('storage', refreshDb);
    return () => {
      window.removeEventListener('kite_db_updated', refreshDb);
      window.removeEventListener('storage', refreshDb);
    };
  }, []);

  const [sendingWaAdmId, setSendingWaAdmId] = useState(null);

  const handleSendWhatsAppReceipt = async (adm) => {
    const student = (db.students || []).find((s) => s.id === adm.studentId) || { phone: adm.phone || adm.studentPhone, name: adm.studentName };
    const phone = adm.phone || adm.studentPhone || student?.phone;
    if (!phone) {
      showToast('Trainee phone number is missing.', 'error');
      return;
    }

    const course = (db.courses || []).find((c) => c.id === adm.courseId);
    const receiptText = `📜 *Official Admission Confirmation & Fee Receipt*\n` +
      `Global Era Technical School (CTEVT Accredited Institute)\n\n` +
      `Dear *${adm.studentName}*,\n` +
      `Your admission enrollment has been confirmed successfully!\n\n` +
      `• *Agreement No:* ${adm.agreementNo || 'GETS-ADM'}\n` +
      `• *Course:* ${adm.courseTitle || course?.title || 'Vocational Training'}\n` +
      `• *Batch:* Shift ${adm.shift || 'A'}\n` +
      `• *Trainee ID (TGID):* ${student.tgid || adm.tgid || 'GETS-TGID'}\n` +
      `• *Total Net Fee:* Rs. ${(Number(adm.netPayableFee) || 0).toLocaleString()}\n` +
      `• *50% Advance Paid:* Rs. ${(Number(adm.advancePaid50) || 0).toLocaleString()}\n` +
      (adm.dueAmount50 > 0 ? `• *Mid-Course 50% Due:* Rs. ${Number(adm.dueAmount50).toLocaleString()} (Due Date: ${adm.dueDate || 'Within 30 Days'})\n` : `• *Payment Status:* Fully Settled\n`) +
      `• *Campus Location:* Jorpati, Gokarneshwor, Kathmandu (Phone: 01-410715)\n\n` +
      `Please present this confirmation voucher on your first class day. Welcome to Global Era!`;

    try {
      setSendingWaAdmId(adm.id);
      const res = await sendMetaWhatsAppMessage({
        to: phone,
        type: 'text',
        text: receiptText
      });
      if (res && (res.messages || res.wamid)) {
        showToast(`WhatsApp receipt delivered successfully to ${adm.studentName} (${phone})!`, 'success');
      } else {
        // Fallback to WhatsApp Web
        window.open(getWhatsAppUrl(phone, receiptText), '_blank');
        showToast(`Opening WhatsApp Web for 1-click personal dispatch to ${adm.studentName}...`, 'info');
      }
    } catch (err) {
      window.open(getWhatsAppUrl(phone, receiptText), '_blank');
      showToast(`Opening WhatsApp Web for 1-click personal chat: ${err.message}`, 'info');
    } finally {
      setSendingWaAdmId(null);
    }
  };

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

  const paginatedAdmissions = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredAdmissions.slice(start, start + rowsPerPage);
  }, [filteredAdmissions, page, rowsPerPage]);

  const handleOpenPrint = (admission) => {
    setSelectedAdmission(admission);
    setPrintModalOpen(true);
  };

  const handleOpenIdCard = (admission) => {
    setSelectedForIdCard(admission);
    setIdCardModalOpen(true);
  };

  const handleDelete = (admissionId, name) => {
    if (window.confirm(`Are you sure you want to cancel the admission agreement for student ${name}?`)) {
      const updated = admissions.filter((a) => a.id !== admissionId);
      const nextDb = { ...db, admissions: updated };
      saveDB(nextDb);
      setDb(nextDb);
      showToast(`Admission agreement removed.`, 'info');
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
          py: { xs: 1.75, sm: 2.25 },
          px: { xs: 2, sm: 2.5, md: 3 },
          mb: 2.5,
          borderRadius: 4,
          background: 'linear-gradient(135deg, #0f2e5a 0%, #1e3a8a 100%)',
          color: '#ffffff',
          boxShadow: '0 10px 28px -8px rgba(15,46,90,0.22)'
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
              <HowToRegIcon sx={{ fontSize: 36, color: '#f59e0b' }} />
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#ffffff' }}>
                Trainee Admission & Agreement
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ color: '#e2e8f0', maxWidth: '780px', lineHeight: 1.6 }}>
              Global Era Technical School Jorpati — Manage trainee admissions with 50% advance collection, 30-day installment grace, optional complimentary OJT internship placement, and formal <strong>dual-copy (Office & Student Copy) A4 agreement letters</strong>.
            </Typography>
          </Grid>
          <Grid item xs={12} md={5} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
              <Button
                variant="outlined"
                size="large"
                startIcon={<ContactsIcon />}
                onClick={() => setAdmitFromLeadOpen(true)}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  borderColor: 'rgba(255, 255, 255, 0.35)',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  px: 2.2,
                  py: 1.2,
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.22)', borderColor: '#ffffff' }
                }}
              >
                Admit From Leads ({unconvertedLeads.length})
              </Button>

              <Button
                variant="contained"
                size="large"
                startIcon={<AddIcon />}
                onClick={() => {
                  setSelectedLeadForAdmission(null);
                  setNewAdmissionOpen(true);
                }}
                sx={{
                  bgcolor: '#f59e0b',
                  color: '#0f2e5a',
                  fontWeight: 900,
                  fontSize: '0.92rem',
                  px: 2.5,
                  py: 1.2,
                  boxShadow: '0 4px 14px rgba(245,158,11,0.4)',
                  '&:hover': { bgcolor: '#d97706', color: '#ffffff' }
                }}
              >
                + Direct Walk-in Admission
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Card>

      {/* Retroactive Auto-Sync Banner for previously converted leads */}
      {unsyncedStudents.length > 0 && (
        <Alert
          severity="warning"
          icon={<SyncIcon />}
          action={
            <Button
              color="inherit"
              size="small"
              variant="outlined"
              onClick={handleAutoSyncConvertedStudents}
              sx={{ fontWeight: 800, textTransform: 'none' }}
            >
              Sync All ({unsyncedStudents.length}) Now
            </Button>
          }
          sx={{ mb: 3.5, borderRadius: 2.5, fontWeight: 600, border: '1px solid #FDE68A' }}
        >
          <strong>{unsyncedStudents.length} student(s)</strong> were previously converted from leads into trainees without an official Admission Agreement. Click &quot;Sync All Now&quot; to generate their formal agreement numbers and show them in Admissions.
        </Alert>
      )}

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
                  Total Agreements
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#0f2e5a', mt: 0.5 }}>
                  {totalAdmissionsCount}
                </Typography>
                <Typography variant="caption" sx={{ color: '#059669', fontWeight: 700 }}>
                  Enrolled Trainees
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
                  Today's Admissions
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#0284c7', mt: 0.5 }}>
                  {todayAdmissionsCount}
                </Typography>
                <Typography variant="caption" sx={{ color: '#0284c7', fontWeight: 700 }}>
                  Date: {todayStr}
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
                  50% Advance Collected
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, color: '#059669', mt: 0.5 }}>
                  Rs. {totalAdvanceCollected.toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ color: '#059669', fontWeight: 700 }}>
                  Received at Enrollment
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
                  Installment Due (Within 30 Days)
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, color: '#dc2626', mt: 0.5 }}>
                  Rs. {totalPendingDue.toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 700 }}>
                  Payable within 1 month
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
          <Grid item xs={12} sm={4.5}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by student name, phone, agreement no..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#94a3b8' }} />
                  </InputAdornment>
                ),
                endAdornment: search ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => { setSearch(''); setPage(0); }}>
                      <CloseIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </InputAdornment>
                ) : null
              }}
            />
          </Grid>

          <Grid item xs={12} sm={2.5}>
            <TextField
              select
              fullWidth
              size="small"
              label="Course Filter"
              value={courseFilter}
              onChange={(e) => {
                setCourseFilter(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="ALL">All Courses</MenuItem>
              {(db.courses || []).map((crs) => (
                <MenuItem key={crs.id} value={crs.id}>
                  {crs.title}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={6} sm={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="OJT Preference"
              value={ojtFilter}
              onChange={(e) => {
                setOjtFilter(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="ALL">All OJT</MenuItem>
              <MenuItem value="REQUIRED">OJT Required (Yes)</MenuItem>
              <MenuItem value="NOT_REQUIRED">No OJT (No)</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={6} sm={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Payment Status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="ALL">All Status</MenuItem>
              <MenuItem value="DUE">2nd Installment Due</MenuItem>
              <MenuItem value="PAID">Fully Paid</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} sm={1} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Chip
              label={`${filteredAdmissions.length}`}
              size="small"
              sx={{ fontWeight: 800, bgcolor: '#f1f5f9', color: '#0f2e5a' }}
            />
          </Grid>
        </Grid>
      </Card>

      {/* Admissions Table */}
      <Card elevation={0} sx={{ borderRadius: 2.5, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 18px rgba(0,0,0,0.04)' }}>
        <TableContainer>
          <Table>
            <TableHead
              sx={{
                bgcolor: '#0F2E5A',
                '& .MuiTableCell-head': {
                  bgcolor: '#0F2E5A !important',
                  color: '#FFFFFF !important',
                  fontWeight: 900,
                  fontSize: '0.84rem',
                  py: 1.5,
                  borderBottom: '2px solid #F59E0B'
                }
              }}
            >
              <TableRow>
                <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, width: 65, textAlign: 'center' }}>
                  S.N.
                </TableCell>
                <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>Agreement No / Date</TableCell>
                <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>Trainee Details</TableCell>
                <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>Course & Batch</TableCell>
                <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>OJT Service</TableCell>
                <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }} align="right">
                  Fee / 50% Advance
                </TableCell>
                <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>2nd Installment / Grace Date</TableCell>
                <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }} align="center">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAdmissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: 'center', py: 5, color: '#64748b' }}>
                    No admission agreements found. Click '+ New Admission & Agreement' to register an enrollment.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedAdmissions.map((adm, idx) => {
                  const serialNo = page * rowsPerPage + idx + 1;
                  return (
                    <TableRow key={adm.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell sx={{ fontWeight: 800, textAlign: 'center', color: '#64748B', width: 65 }}>
                        {serialNo}
                    </TableCell>
                    {/* Agreement No & Date */}
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f2e5a' }}>
                        {adm.agreementNo}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                        Date: {adm.admissionDateBS || adm.admissionDate}
                      </Typography>
                      <Stack direction="row" spacing={0.6} sx={{ mt: 0.6 }} flexWrap="wrap">
                        <Chip
                          label="Active"
                          size="small"
                          sx={{
                            height: '20px',
                            fontSize: '0.66rem',
                            fontWeight: 700,
                            bgcolor: '#ecfdf5',
                            color: '#065f46'
                          }}
                        />
                        {adm.convertedFromLeadId ? (
                          <Tooltip title={`Admitted from Lead Inquiry #${adm.convertedFromLeadId}`}>
                            <Chip
                              label={`Lead #${adm.convertedFromLeadId}`}
                              size="small"
                              sx={{
                                height: '20px',
                                fontSize: '0.66rem',
                                fontWeight: 700,
                                bgcolor: '#eff6ff',
                                color: '#1d4ed8',
                                border: '1px solid #bfdbfe'
                              }}
                            />
                          </Tooltip>
                        ) : (
                          <Chip
                            label="Walk-in"
                            size="small"
                            sx={{
                              height: '20px',
                              fontSize: '0.66rem',
                              fontWeight: 700,
                              bgcolor: '#f8fafc',
                              color: '#64748b',
                              border: '1px solid #e2e8f0'
                            }}
                          />
                        )}
                      </Stack>
                    </TableCell>

                    {/* Student Info */}
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b' }}>
                        {adm.studentName}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#475569', display: 'block' }}>
                        Phone: {adm.phone}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
                        ID: {adm.studentId} ({adm.tgid})
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
                          label="OJT Required (Free)"
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
                          label="No OJT"
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
                        Rs. {(Number(adm.netPayableFee) || 0).toLocaleString()}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#059669', fontWeight: 800, display: 'block' }}>
                        {adm.dueAmount50 <= 0 ? 'Total Paid:' : 'Advance Paid:'} Rs. {(Number(adm.advancePaid50) || 0).toLocaleString()}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        Method: {adm.paymentMethod}
                      </Typography>
                    </TableCell>

                    {/* 2nd Installment & Due Date */}
                    <TableCell>
                      {adm.dueAmount50 > 0 ? (
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: '#dc2626' }}>
                            Due: Rs. {adm.dueAmount50.toLocaleString()}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#991b1b', fontWeight: 700, display: 'block' }}>
                            Due Date: {adm.dueDate}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            (Payable within 30 days)
                          </Typography>
                        </Box>
                      ) : (
                        <Chip
                          label="Fully Paid"
                          size="small"
                          sx={{ bgcolor: '#ecfdf5', color: '#047857', fontWeight: 800 }}
                        />
                      )}
                    </TableCell>

                    {/* Action Buttons */}
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Tooltip title="Print Epson L8050 CR-80 PVC Trainee ID Card">
                          <Button
                            variant="contained"
                            size="small"
                            color="warning"
                            startIcon={<BadgeIcon />}
                            onClick={() => handleOpenIdCard(adm)}
                            sx={{ fontWeight: 800, fontSize: '0.78rem', py: 0.6, bgcolor: '#f59e0b', color: '#0f2e5a', '&:hover': { bgcolor: '#d97706', color: '#ffffff' } }}
                          >
                            ID Card
                          </Button>
                        </Tooltip>

                        <Tooltip title="Print Dual-Copy A4 Admission Agreement">
                          <Button
                            variant="contained"
                            size="small"
                            color="primary"
                            startIcon={<PrintIcon />}
                            onClick={() => handleOpenPrint(adm)}
                            sx={{ fontWeight: 800, fontSize: '0.78rem', py: 0.6 }}
                          >
                            Agreement
                          </Button>
                        </Tooltip>

                        <Tooltip title="Send Official Admission Confirmation & Fee Receipt to WhatsApp">
                          <Button
                            variant="contained"
                            size="small"
                            color="success"
                            disabled={sendingWaAdmId === adm.id}
                            startIcon={<WhatsAppIcon />}
                            onClick={() => handleSendWhatsAppReceipt(adm)}
                            sx={{
                              fontWeight: 800,
                              fontSize: '0.78rem',
                              py: 0.6,
                              bgcolor: '#25D366',
                              color: '#ffffff',
                              '&:hover': { bgcolor: '#1ebc59' }
                            }}
                          >
                            {sendingWaAdmId === adm.id ? 'Sending...' : 'WhatsApp'}
                          </Button>
                        </Tooltip>

                        <Tooltip title="Cancel Agreement">
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
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 25, 50, 100]}
        component="div"
        count={filteredAdmissions.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(e, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        sx={{
          borderTop: '1px solid #e2e8f0',
          bgcolor: '#f8fafc'
        }}
      />
    </Card>

      {/* New Admission Modal */}
      <NewAdmissionModal
        open={newAdmissionOpen}
        onClose={() => {
          setNewAdmissionOpen(false);
          setSelectedLeadForAdmission(null);
        }}
        db={db}
        setDb={setDb}
        showToast={showToast}
        initialLead={selectedLeadForAdmission}
        onAdmissionCreated={(createdAdmission) => {
          setSelectedAdmission(createdAdmission);
          setPrintModalOpen(true);
        }}
      />

      {/* Quick Admit From Lead Modal */}
      <Dialog
        open={admitFromLeadOpen}
        onClose={() => setAdmitFromLeadOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 0.5 } }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            bgcolor: '#0f2e5a',
            color: '#ffffff',
            borderRadius: '10px 10px 0 0',
            py: 2,
            px: 3
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.15)', color: '#f59e0b', width: 38, height: 38 }}>
              <ContactsIcon fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, fontSize: '1.05rem', lineHeight: 1.2 }}>
                Select Active Lead for Admission
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.74rem' }}>
                Pre-populate applicant details and generate formal training agreement
              </Typography>
            </Box>
          </Stack>
          <IconButton onClick={() => setAdmitFromLeadOpen(false)} sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3, bgcolor: '#f8fafc' }}>
          <Box sx={{ mb: 2.5, mt: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search leads by trainee name, phone, or course..."
              value={leadSearchQuery}
              onChange={(e) => setLeadSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#94a3b8' }} />
                  </InputAdornment>
                )
              }}
            />
          </Box>

          {unconvertedLeads.length === 0 ? (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              There are no pending unconverted leads. All inquiries have been processed or converted.
            </Alert>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, maxHeight: 380 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow sx={{ '& th': { bgcolor: '#f1f5f9', fontWeight: 800, color: '#0f2e5a' } }}>
                    <TableCell>Lead ID</TableCell>
                    <TableCell>Trainee Name</TableCell>
                    <TableCell>Mobile Phone</TableCell>
                    <TableCell>Target Course</TableCell>
                    <TableCell>Current Stage</TableCell>
                    <TableCell align="center">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {unconvertedLeads
                    .filter((ld) => {
                      if (!leadSearchQuery.trim()) return true;
                      const q = leadSearchQuery.toLowerCase();
                      return (
                        (ld.name || '').toLowerCase().includes(q) ||
                        (ld.phone || '').includes(q) ||
                        (ld.course || '').toLowerCase().includes(q)
                      );
                    })
                    .map((ld) => (
                      <TableRow key={ld.id} hover>
                        <TableCell sx={{ fontWeight: 800, color: '#64748b' }}>
                          #{ld.id}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>
                          {ld.name}
                        </TableCell>
                        <TableCell sx={{ color: '#475569' }}>
                          {ld.phone}
                        </TableCell>
                        <TableCell sx={{ color: '#0f2e5a', fontWeight: 600 }}>
                          {ld.course || 'Vocational Training'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={ld.stage || 'Inquiry'}
                            size="small"
                            sx={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              bgcolor: ld.stage === 'Interested' ? '#ecfdf5' : '#eff6ff',
                              color: ld.stage === 'Interested' ? '#065f46' : '#1d4ed8'
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<HowToRegIcon />}
                            onClick={() => {
                              setSelectedLeadForAdmission(ld);
                              setAdmitFromLeadOpen(false);
                              setNewAdmissionOpen(true);
                            }}
                            sx={{
                              bgcolor: '#059669',
                              color: '#ffffff',
                              fontWeight: 800,
                              fontSize: '0.74rem',
                              textTransform: 'none',
                              py: 0.5,
                              px: 1.5,
                              boxShadow: 'none',
                              '&:hover': { bgcolor: '#047857' }
                            }}
                          >
                            Admit Trainee
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
          <Button onClick={() => setAdmitFromLeadOpen(false)} sx={{ fontWeight: 700, color: '#64748b' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

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
