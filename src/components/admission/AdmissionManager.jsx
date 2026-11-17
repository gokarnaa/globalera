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
  TablePagination,
  useTheme,
  useMediaQuery
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
import { ResponsiveDataView, StatusBadge } from '../common';
import NewAdmissionModal from './NewAdmissionModal';
import AdmissionAgreementPrintModal from './AdmissionAgreementPrintModal';
import StudentIdCardModal from './StudentIdCardModal';

export default function AdmissionManager({ pendingLead = null, onClearPendingLead }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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
      `Prabidhik School, Jorpati (Global Era Multi Service Pvt. Ltd.)\n\n` +
      `Dear *${adm.studentName}*,\n` +
      `Your admission enrollment has been confirmed successfully!\n\n` +
      `• *Agreement No:* ${adm.agreementNo || 'GETS-ADM'}\n` +
      `• *Course:* ${adm.courseTitle || course?.title || 'Vocational Training'}\n` +
      `• *Batch:* Shift ${adm.shift || 'A'}\n` +
      `• *Trainee ID (TGID):* ${student.tgid || adm.tgid || 'GETS-TGID'}\n` +
      `• *Total Net Fee:* Rs. ${(Number(adm.netPayableFee) || 0).toLocaleString()}\n` +
      `• *50% Advance Paid:* Rs. ${(Number(adm.advancePaid50) || 0).toLocaleString()}\n` +
      (adm.dueAmount50 > 0 ? `• *Mid-Course 50% Due:* Rs. ${Number(adm.dueAmount50).toLocaleString()} (Due Date: ${adm.dueDate || 'Within 30 Days'})\n` : `• *Payment Status:* Fully Settled\n`) +
      `• *Campus Location:* Jorpati, Gokarneshwor, Kathmandu (Phone: 01-4910715 | WhatsApp: 9705147147)\n\n` +
      `Please present this confirmation voucher on your first class day. Welcome to Prabidhik School!`;

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

  const [confirmCancelTarget, setConfirmCancelTarget] = useState(null);

  const handleDelete = (admissionId, name) => {
    setConfirmCancelTarget({ id: admissionId, name });
  };

  const handleConfirmDelete = () => {
    if (!confirmCancelTarget) return;
    const updated = admissions.filter((a) => a.id !== confirmCancelTarget.id);
    const nextDb = { ...db, admissions: updated };
    saveDB(nextDb);
    setDb(nextDb);
    setConfirmCancelTarget(null);
    showToast(`Admission agreement removed.`, 'info');
  };

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2.2 }, maxWidth: '1440px', mx: 'auto' }}>
      {/* Toast Alert */}
      {toastMsg && (
        <Alert severity={toastSeverity} sx={{ mb: 1.75, py: 0.5, fontWeight: 700, fontSize: '0.8rem' }}>
          {toastMsg}
        </Alert>
      )}

      {/* Slim 1-Row Executive Header Bar */}
      <Card
        elevation={0}
        sx={{
          py: { xs: 1.25, sm: 1.5 },
          px: { xs: 1.75, sm: 2.25 },
          mb: 1.75,
          borderRadius: 2.5,
          background: 'linear-gradient(135deg, #0f2e5a 0%, #1e3a8a 100%)',
          color: '#ffffff',
          boxShadow: '0 4px 14px rgba(15, 46, 90, 0.16)'
        }}
      >
        <Grid container spacing={1.5} alignItems="center">
          <Grid item xs={12} md={7}>
            <Stack direction="row" spacing={1.2} alignItems="center">
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: 1.8,
                  bgcolor: 'rgba(245, 158, 11, 0.16)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <HowToRegIcon sx={{ fontSize: 20, color: '#fbbf24' }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="subtitle1"
                  noWrap
                  sx={{ fontWeight: 800, color: '#ffffff', fontSize: { xs: '0.96rem', sm: '1.06rem' }, lineHeight: 1.2 }}
                >
                  Trainee Admission &amp; Agreement
                </Typography>
                <Typography
                  variant="caption"
                  noWrap
                  sx={{ color: '#cbd5e1', display: 'block', fontSize: '0.73rem', mt: 0.15 }}
                >
                  Prabidhik School, Jorpati • 50% advance, 30-day installment &amp; dual-copy A4 agreements
                </Typography>
              </Box>
            </Stack>
          </Grid>
          <Grid item xs={12} md={5} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', md: 'flex-end' }} flexWrap="wrap" useFlexGap>
              <Button
                variant="outlined"
                size="small"
                startIcon={<ContactsIcon sx={{ fontSize: '15px !important' }} />}
                onClick={() => setAdmitFromLeadOpen(true)}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  fontWeight: 700,
                  fontSize: '0.76rem',
                  whiteSpace: 'nowrap',
                  px: 1.4,
                  py: 0.65,
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)', borderColor: '#ffffff' }
                }}
              >
                Admit From Leads ({unconvertedLeads.length})
              </Button>

              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon sx={{ fontSize: '16px !important' }} />}
                onClick={() => {
                  setSelectedLeadForAdmission(null);
                  setNewAdmissionOpen(true);
                }}
                sx={{
                  bgcolor: '#f59e0b',
                  color: '#0f2e5a',
                  fontWeight: 800,
                  fontSize: '0.76rem',
                  whiteSpace: 'nowrap',
                  px: 1.5,
                  py: 0.65,
                  boxShadow: 'none',
                  '&:hover': { bgcolor: '#d97706', color: '#ffffff' }
                }}
              >
                Direct Walk-in Admission
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Card>

      {/* Retroactive Auto-Sync Banner for previously converted leads */}
      {unsyncedStudents.length > 0 && (
        <Alert
          severity="warning"
          icon={<SyncIcon fontSize="small" />}
          action={
            <Button
              color="inherit"
              size="small"
              variant="outlined"
              onClick={handleAutoSyncConvertedStudents}
              sx={{ fontWeight: 800, textTransform: 'none', fontSize: '0.74rem', py: 0.3 }}
            >
              Sync All ({unsyncedStudents.length})
            </Button>
          }
          sx={{ mb: 1.75, py: 0.5, borderRadius: 2, fontWeight: 600, fontSize: '0.78rem', border: '1px solid #FDE68A' }}
        >
          <strong>{unsyncedStudents.length} student(s)</strong> converted from leads without an Admission Agreement.
        </Alert>
      )}

      {/* 4 Compact Single-Row KPI Cards */}
      <Grid container spacing={1.5} sx={{ mb: 1.75 }}>
        {/* Total Admissions */}
        <Grid item xs={6} md={3}>
          <Card
            elevation={0}
            sx={{
              p: 1.4,
              borderRadius: 2,
              border: '1px solid #e2e8f0',
              borderLeft: '3.5px solid #1e40af',
              bgcolor: '#ffffff'
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" noWrap sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontSize: '0.66rem', letterSpacing: '0.03em', display: 'block' }}>
                  Total Agreements
                </Typography>
                <Typography sx={{ fontWeight: 800, color: '#0f2e5a', fontSize: '1.22rem', lineHeight: 1.2, mt: 0.2 }}>
                  {totalAdmissionsCount}
                </Typography>
                <Typography variant="caption" noWrap sx={{ color: '#059669', fontWeight: 600, fontSize: '0.68rem', display: 'block' }}>
                  Enrolled Trainees
                </Typography>
              </Box>
              <Box sx={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#eff6ff', borderRadius: 1.5, color: '#1e40af', flexShrink: 0 }}>
                <SchoolIcon sx={{ fontSize: 18 }} />
              </Box>
            </Stack>
          </Card>
        </Grid>

        {/* Today's Admissions */}
        <Grid item xs={6} md={3}>
          <Card
            elevation={0}
            sx={{
              p: 1.4,
              borderRadius: 2,
              border: '1px solid #e2e8f0',
              borderLeft: '3.5px solid #0284c7',
              bgcolor: '#ffffff'
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" noWrap sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontSize: '0.66rem', letterSpacing: '0.03em', display: 'block' }}>
                  Today&apos;s Admissions
                </Typography>
                <Typography sx={{ fontWeight: 800, color: '#0284c7', fontSize: '1.22rem', lineHeight: 1.2, mt: 0.2 }}>
                  {todayAdmissionsCount}
                </Typography>
                <Typography variant="caption" noWrap sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.68rem', display: 'block' }}>
                  Date: {todayStr}
                </Typography>
              </Box>
              <Box sx={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f0f9ff', borderRadius: 1.5, color: '#0284c7', flexShrink: 0 }}>
                <HowToRegIcon sx={{ fontSize: 18 }} />
              </Box>
            </Stack>
          </Card>
        </Grid>

        {/* 50% Advance Fees Collected */}
        <Grid item xs={6} md={3}>
          <Card
            elevation={0}
            sx={{
              p: 1.4,
              borderRadius: 2,
              border: '1px solid #e2e8f0',
              borderLeft: '3.5px solid #059669',
              bgcolor: '#ffffff'
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" noWrap sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontSize: '0.66rem', letterSpacing: '0.03em', display: 'block' }}>
                  50% Advance Collected
                </Typography>
                <Typography noWrap sx={{ fontWeight: 800, color: '#059669', fontSize: '1.15rem', lineHeight: 1.2, mt: 0.2 }}>
                  Rs. {totalAdvanceCollected.toLocaleString()}
                </Typography>
                <Typography variant="caption" noWrap sx={{ color: '#059669', fontWeight: 600, fontSize: '0.68rem', display: 'block' }}>
                  Received at Enrollment
                </Typography>
              </Box>
              <Box sx={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#ecfdf5', borderRadius: 1.5, color: '#059669', flexShrink: 0 }}>
                <PaymentsIcon sx={{ fontSize: 18 }} />
              </Box>
            </Stack>
          </Card>
        </Grid>

        {/* Remaining 50% Due in 30 Days */}
        <Grid item xs={6} md={3}>
          <Card
            elevation={0}
            sx={{
              p: 1.4,
              borderRadius: 2,
              border: '1px solid #e2e8f0',
              borderLeft: '3.5px solid #dc2626',
              bgcolor: '#ffffff'
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" noWrap sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontSize: '0.66rem', letterSpacing: '0.03em', display: 'block' }}>
                  30-Day Installment Due
                </Typography>
                <Typography noWrap sx={{ fontWeight: 800, color: '#dc2626', fontSize: '1.15rem', lineHeight: 1.2, mt: 0.2 }}>
                  Rs. {totalPendingDue.toLocaleString()}
                </Typography>
                <Typography variant="caption" noWrap sx={{ color: '#dc2626', fontWeight: 600, fontSize: '0.68rem', display: 'block' }}>
                  Payable within 1 month
                </Typography>
              </Box>
              <Box sx={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#fef2f2', borderRadius: 1.5, color: '#dc2626', flexShrink: 0 }}>
                <ReceiptLongIcon sx={{ fontSize: 18 }} />
              </Box>
            </Stack>
          </Card>
        </Grid>
      </Grid>

      {/* Compact Filter and Search Bar */}
      <Card
        elevation={0}
        sx={{
          p: 1.25,
          mb: 1.75,
          borderRadius: 2,
          border: '1px solid #e2e8f0',
          bgcolor: '#ffffff'
        }}
      >
        <Grid container spacing={1.25} alignItems="center">
          <Grid item xs={12} sm={4.5}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search student name, phone, agreement no..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#94a3b8', fontSize: 18 }} />
                  </InputAdornment>
                ),
                endAdornment: search ? (
                  <InputAdornment position="end">
                    <IconButton size="small" aria-label="Clear search query" onClick={() => { setSearch(''); setPage(0); }}>
                      <CloseIcon sx={{ fontSize: 16 }} />
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
              <MenuItem value="REQUIRED">OJT Required</MenuItem>
              <MenuItem value="NOT_REQUIRED">No OJT</MenuItem>
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

      {/* High-Density Clean Admissions Table / Mobile Native Card View */}
      <ResponsiveDataView
        rows={paginatedAdmissions}
        keyExtractor={(adm) => adm.id}
        emptyIcon={<HowToRegIcon />}
        emptyTitle="No admission agreements found"
        emptySubtitle="Click 'Direct Walk-in Admission' or 'Admit From Leads' to register an enrollment."
        renderCard={(adm, idx) => {
          const serialNo = page * rowsPerPage + idx + 1;
          const isPaid = !(adm.dueAmount50 > 0);
          return (
            <Paper
              elevation={0}
              sx={{
                p: 1.75,
                borderRadius: 2.5,
                border: '1px solid #E2E8F0',
                bgcolor: '#FFFFFF'
              }}
            >
              {/* Top Row: Applicant Name, Agreement No, Fee StatusBadge */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                <Box sx={{ minWidth: 0 }}>
                  <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B' }}>
                      #{serialNo}
                    </Typography>
                    <Typography sx={{ fontWeight: 800, color: '#0F2E5A', fontSize: '0.78rem' }}>
                      {adm.agreementNo}
                    </Typography>
                    <StatusBadge
                      label={adm.convertedFromLeadId ? `Lead #${adm.convertedFromLeadId}` : 'Walk-in'}
                      tone={adm.convertedFromLeadId ? 'primary' : 'neutral'}
                    />
                  </Stack>
                  <Typography sx={{ fontWeight: 800, color: '#0F172A', fontSize: '0.95rem', mt: 0.35, lineHeight: 1.25 }}>
                    {adm.studentName}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.15 }}>
                    {adm.phone} • {adm.tgid || adm.studentId}
                  </Typography>
                </Box>
                <StatusBadge
                  label={isPaid ? 'Paid' : `Due: Rs. ${adm.dueAmount50.toLocaleString()}`}
                  tone={isPaid ? 'success' : 'error'}
                  showDot
                />
              </Box>

              {/* Middle: Course, Batch & Fee Summary */}
              <Box
                sx={{
                  p: 1.1,
                  borderRadius: 2,
                  bgcolor: '#F8FAFC',
                  border: '1px solid #F1F5F9',
                  mb: 1.25
                }}
              >
                <Typography sx={{ fontWeight: 700, color: '#0F2E5A', fontSize: '0.82rem', lineHeight: 1.3 }}>
                  {adm.courseTitle}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.2 }}>
                  {adm.groupName} • {adm.shift} ({adm.duration}) • {adm.admissionDateBS || adm.admissionDate}
                </Typography>
                <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ mt: 0.75 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F2E5A' }}>
                    Fee: Rs. {(Number(adm.netPayableFee) || 0).toLocaleString()}
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#059669' }}>
                    Paid: Rs. {(Number(adm.advancePaid50) || 0).toLocaleString()} ({adm.paymentMethod})
                  </Typography>
                  {!isPaid && adm.dueDate && (
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#B91C1C' }}>
                      Due by {adm.dueDate}
                    </Typography>
                  )}
                  <StatusBadge
                    label={adm.ojtPreference === 'REQUIRED' ? 'OJT Free' : 'No OJT'}
                    tone={adm.ojtPreference === 'REQUIRED' ? 'teal' : 'neutral'}
                  />
                </Stack>
              </Box>

              {/* Bottom: 1-Tap Actions */}
              <Stack direction="row" spacing={0.75} alignItems="center" justifyContent="space-between">
                <Stack direction="row" spacing={0.75} sx={{ flex: 1 }}>
                  <Button
                    size="small"
                    startIcon={<BadgeIcon sx={{ fontSize: '14px !important' }} />}
                    onClick={() => handleOpenIdCard(adm)}
                    sx={{
                      flex: 1,
                      py: 0.6,
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      bgcolor: '#fffbeb',
                      color: '#b45309',
                      border: '1px solid #fde68a',
                      '&:hover': { bgcolor: '#fef3c7' }
                    }}
                  >
                    ID
                  </Button>
                  <Button
                    size="small"
                    startIcon={<PrintIcon sx={{ fontSize: '14px !important' }} />}
                    onClick={() => handleOpenPrint(adm)}
                    sx={{
                      flex: 1,
                      py: 0.6,
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      bgcolor: '#eff6ff',
                      color: '#1e40af',
                      border: '1px solid #bfdbfe',
                      '&:hover': { bgcolor: '#dbeafe' }
                    }}
                  >
                    View A4
                  </Button>
                  <Button
                    size="small"
                    disabled={sendingWaAdmId === adm.id}
                    startIcon={<WhatsAppIcon sx={{ fontSize: '14px !important' }} />}
                    onClick={() => handleSendWhatsAppReceipt(adm)}
                    sx={{
                      flex: 1,
                      py: 0.6,
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      bgcolor: '#ecfdf5',
                      color: '#047857',
                      border: '1px solid #a7f3d0',
                      '&:hover': { bgcolor: '#d1fae5' }
                    }}
                  >
                    {sendingWaAdmId === adm.id ? '...' : 'WA'}
                  </Button>
                </Stack>
                <IconButton
                  size="small"
                  color="error"
                  aria-label={`Cancel admission agreement for ${adm.studentName}`}
                  onClick={() => handleDelete(adm.id, adm.studentName)}
                  sx={{ p: 0.6, border: '1px solid #FEE2E2', bgcolor: '#FEF2F2' }}
                >
                  <DeleteOutlineIcon sx={{ fontSize: 17 }} />
                </IconButton>
              </Stack>
            </Paper>
          );
        }}
        renderTable={() => (
          <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <TableContainer>
              <Table size="small">
                <TableHead
                  sx={{
                    bgcolor: '#0F2E5A',
                    '& .MuiTableCell-head': {
                      bgcolor: '#0F2E5A !important',
                      color: '#FFFFFF !important',
                      fontWeight: 800,
                      fontSize: '0.72rem',
                      py: 1,
                      px: 1.25,
                      borderBottom: '2px solid #F59E0B',
                      whiteSpace: 'nowrap'
                    }
                  }}
                >
                  <TableRow>
                    <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800, width: 46, textAlign: 'center' }}>
                      #
                    </TableCell>
                    <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800 }}>Agreement / Date</TableCell>
                    <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800 }}>Trainee</TableCell>
                    <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800 }}>Course &amp; Batch</TableCell>
                    <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800 }}>OJT</TableCell>
                    <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800 }} align="right">
                      Fee / Paid
                    </TableCell>
                    <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800 }}>Due Status</TableCell>
                    <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800 }} align="center">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedAdmissions.map((adm, idx) => {
                    const serialNo = page * rowsPerPage + idx + 1;
                    return (
                      <TableRow key={adm.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell sx={{ fontWeight: 700, textAlign: 'center', color: '#64748B', width: 46, fontSize: '0.75rem' }}>
                          {serialNo}
                        </TableCell>
                        {/* Agreement No & Date */}
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          <Stack direction="row" spacing={0.6} alignItems="center">
                            <Typography sx={{ fontWeight: 800, color: '#0f2e5a', fontSize: '0.78rem' }}>
                              {adm.agreementNo}
                            </Typography>
                            {adm.convertedFromLeadId ? (
                              <Chip
                                label={`Lead #${adm.convertedFromLeadId}`}
                                size="small"
                                sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, bgcolor: '#eff6ff', color: '#1d4ed8' }}
                              />
                            ) : (
                              <Chip
                                label="Walk-in"
                                size="small"
                                sx={{ height: 18, fontSize: '0.62rem', fontWeight: 600, bgcolor: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }}
                              />
                            )}
                          </Stack>
                          <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '0.69rem' }}>
                            {adm.admissionDateBS || adm.admissionDate}
                          </Typography>
                        </TableCell>

                        {/* Student Info */}
                        <TableCell>
                          <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.8rem', lineHeight: 1.25 }}>
                            {adm.studentName}
                          </Typography>
                          <Typography variant="caption" noWrap sx={{ color: '#64748b', display: 'block', fontSize: '0.7rem' }}>
                            {adm.phone} • {adm.tgid || adm.studentId}
                          </Typography>
                        </TableCell>

                        {/* Course & Shift */}
                        <TableCell>
                          <Typography sx={{ fontWeight: 700, color: '#0f2e5a', fontSize: '0.79rem', lineHeight: 1.25 }}>
                            {adm.courseTitle}
                          </Typography>
                          <Typography variant="caption" noWrap sx={{ color: '#64748b', display: 'block', fontSize: '0.7rem' }}>
                            {adm.groupName} • {adm.shift} ({adm.duration})
                          </Typography>
                        </TableCell>

                        {/* OJT Preference */}
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          {adm.ojtPreference === 'REQUIRED' ? (
                            <Chip
                              label="OJT Free"
                              size="small"
                              sx={{ height: 20, fontWeight: 700, fontSize: '0.68rem', bgcolor: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}
                            />
                          ) : (
                            <Chip
                              label="No OJT"
                              size="small"
                              sx={{ height: 20, fontWeight: 600, fontSize: '0.68rem', bgcolor: '#f1f5f9', color: '#64748b' }}
                            />
                          )}
                        </TableCell>

                        {/* Fee & 50% Paid */}
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                          <Typography sx={{ fontWeight: 800, color: '#0f2e5a', fontSize: '0.79rem' }}>
                            Rs. {(Number(adm.netPayableFee) || 0).toLocaleString()}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#059669', fontWeight: 700, display: 'block', fontSize: '0.69rem' }}>
                            Paid: Rs. {(Number(adm.advancePaid50) || 0).toLocaleString()} ({adm.paymentMethod})
                          </Typography>
                        </TableCell>

                        {/* 2nd Installment & Due Date */}
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          {adm.dueAmount50 > 0 ? (
                            <Box>
                              <Typography sx={{ fontWeight: 800, color: '#dc2626', fontSize: '0.78rem' }}>
                                Due: Rs. {adm.dueAmount50.toLocaleString()}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#991b1b', fontWeight: 600, display: 'block', fontSize: '0.68rem' }}>
                                By {adm.dueDate}
                              </Typography>
                            </Box>
                          ) : (
                            <Chip
                              label="Paid"
                              size="small"
                              sx={{ height: 20, bgcolor: '#ecfdf5', color: '#047857', fontWeight: 800, fontSize: '0.68rem' }}
                            />
                          )}
                        </TableCell>

                        {/* Sleek Compact Action Buttons */}
                        <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                          <Stack direction="row" spacing={0.6} justifyContent="center" alignItems="center">
                            <Tooltip title="Print Trainee ID Card">
                              <Button
                                size="small"
                                startIcon={<BadgeIcon sx={{ fontSize: '13px !important' }} />}
                                onClick={() => handleOpenIdCard(adm)}
                                sx={{
                                  px: 0.9,
                                  py: 0.3,
                                  minWidth: 0,
                                  fontSize: '0.69rem',
                                  fontWeight: 700,
                                  bgcolor: '#fffbeb',
                                  color: '#b45309',
                                  border: '1px solid #fde68a',
                                  '&:hover': { bgcolor: '#fef3c7' }
                                }}
                              >
                                ID
                              </Button>
                            </Tooltip>

                            <Tooltip title="Print Dual-Copy A4 Agreement">
                              <Button
                                size="small"
                                startIcon={<PrintIcon sx={{ fontSize: '13px !important' }} />}
                                onClick={() => handleOpenPrint(adm)}
                                sx={{
                                  px: 0.9,
                                  py: 0.3,
                                  minWidth: 0,
                                  fontSize: '0.69rem',
                                  fontWeight: 700,
                                  bgcolor: '#eff6ff',
                                  color: '#1e40af',
                                  border: '1px solid #bfdbfe',
                                  '&:hover': { bgcolor: '#dbeafe' }
                                }}
                              >
                                A4
                              </Button>
                            </Tooltip>

                            <Tooltip title="Send Receipt on WhatsApp">
                              <Button
                                size="small"
                                disabled={sendingWaAdmId === adm.id}
                                startIcon={<WhatsAppIcon sx={{ fontSize: '13px !important' }} />}
                                onClick={() => handleSendWhatsAppReceipt(adm)}
                                sx={{
                                  px: 0.9,
                                  py: 0.3,
                                  minWidth: 0,
                                  fontSize: '0.69rem',
                                  fontWeight: 700,
                                  bgcolor: '#ecfdf5',
                                  color: '#047857',
                                  border: '1px solid #a7f3d0',
                                  '&:hover': { bgcolor: '#d1fae5' }
                                }}
                              >
                                {sendingWaAdmId === adm.id ? '...' : 'WA'}
                              </Button>
                            </Tooltip>

                            <Tooltip title="Cancel Agreement">
                              <IconButton
                                size="small"
                                color="error"
                                aria-label={`Cancel admission agreement for ${adm.studentName}`}
                                onClick={() => handleDelete(adm.id, adm.studentName)}
                                sx={{ p: 0.4 }}
                              >
                                <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        )}
      />

      {filteredAdmissions.length > 0 && (
        <Card elevation={0} sx={{ mt: 1.25, borderRadius: 2, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
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
              bgcolor: '#f8fafc',
              '& .MuiTablePagination-toolbar': { minHeight: 42 },
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': { fontSize: '0.75rem' }
            }}
          />
        </Card>
      )}

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
        fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3, p: isMobile ? 0 : 0.5 } }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            bgcolor: '#0f2e5a',
            color: '#ffffff',
            borderRadius: isMobile ? 0 : '10px 10px 0 0',
            py: { xs: 1.5, sm: 2 },
            px: { xs: 2, sm: 3 }
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
          <IconButton aria-label="Close lead selection dialog" onClick={() => setAdmitFromLeadOpen(false)} sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: { xs: 2, sm: 3 }, bgcolor: '#f8fafc' }}>
          <Box sx={{ mb: 2, mt: 0.5 }}>
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
            <ResponsiveDataView
              rows={unconvertedLeads.filter((ld) => {
                if (!leadSearchQuery.trim()) return true;
                const q = leadSearchQuery.toLowerCase();
                return (
                  (ld.name || '').toLowerCase().includes(q) ||
                  (ld.phone || '').includes(q) ||
                  (ld.course || '').toLowerCase().includes(q)
                );
              })}
              keyExtractor={(ld) => ld.id}
              emptyTitle="No matching leads"
              emptySubtitle="Try a different name, phone number, or course."
              renderCard={(ld) => (
                <Paper
                  elevation={0}
                  sx={{ p: 1.5, borderRadius: 2, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B' }}>
                        Lead #{ld.id}
                      </Typography>
                      <Typography sx={{ fontWeight: 800, color: '#0F172A', fontSize: '0.92rem' }}>
                        {ld.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#475569', display: 'block' }}>
                        {ld.phone} • {ld.course || 'Vocational Training'}
                      </Typography>
                    </Box>
                    <StatusBadge
                      label={ld.stage || 'Inquiry'}
                      tone={ld.stage === 'Interested' ? 'success' : 'primary'}
                      showDot
                    />
                  </Box>
                  <Button
                    fullWidth
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
                      fontSize: '0.78rem',
                      textTransform: 'none',
                      py: 0.75,
                      boxShadow: 'none',
                      '&:hover': { bgcolor: '#047857' }
                    }}
                  >
                    Admit Trainee
                  </Button>
                </Paper>
              )}
              renderTable={() => (
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
            />
          )}
        </DialogContent>
        <DialogActions
          sx={{
            p: 2,
            pb: isMobile ? 'calc(16px + env(safe-area-inset-bottom))' : 2,
            bgcolor: '#f8fafc',
            borderTop: '1px solid #e2e8f0'
          }}
        >
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

      {/* Accessible AlertDialog for Destructive Agreement Cancellation */}
      <Dialog
        open={Boolean(confirmCancelTarget)}
        onClose={() => setConfirmCancelTarget(null)}
        maxWidth="xs"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{ role: 'alertdialog', 'aria-labelledby': 'cancel-agreement-dialog-title', sx: { borderRadius: isMobile ? 0 : 2 } }}
      >
        <DialogTitle id="cancel-agreement-dialog-title" sx={{ fontWeight: 800, fontSize: '0.96rem' }}>
          Cancel Admission Agreement?
        </DialogTitle>
        <DialogContent sx={{ pt: 2, pb: 1 }}>
          <Typography variant="body2" sx={{ color: '#334155', mt: 1 }}>
            Are you sure you want to cancel the admission agreement for trainee <strong>{confirmCancelTarget?.name}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, py: 1.5, pb: isMobile ? 'calc(12px + env(safe-area-inset-bottom))' : 1.5 }}>
          <Button size="small" onClick={() => setConfirmCancelTarget(null)} sx={{ color: '#64748b' }}>
            Keep Agreement
          </Button>
          <Button size="small" variant="contained" color="error" onClick={handleConfirmDelete}>
            Yes, Cancel Agreement
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
