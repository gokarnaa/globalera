import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  TextField,
  MenuItem,
  Stack,
  Grid,
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  Avatar,
  Paper,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent
} from '@mui/material';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import AddIcon from '@mui/icons-material/Add';
import PrintIcon from '@mui/icons-material/Print';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import SearchIcon from '@mui/icons-material/Search';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VerifiedIcon from '@mui/icons-material/Verified';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import LinkIcon from '@mui/icons-material/Link';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import CloseIcon from '@mui/icons-material/Close';
import confetti from 'canvas-confetti';
import { loadDB, saveDB } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
import { getWhatsAppUrl } from '../../services/exportUtils';
import A4LandscapeCertificateModal from './A4LandscapeCertificateModal';
import PublicCertificateVerify from './PublicCertificateVerify';
import CertificateStudioManager from '../settings/CertificateStudioManager';
import { computeNextCertificateNumber } from '../settings/CompanyProfileSettings';

export default function CertificateManager() {
  const [db, setDb] = useState(loadDB());
  const { currentUser, isTrainer, isAdmin } = useAuth();

  useEffect(() => {
    const syncDb = () => setDb(loadDB());
    window.addEventListener('kite_db_updated', syncDb);
    window.addEventListener('storage', syncDb);
    return () => {
      window.removeEventListener('kite_db_updated', syncDb);
      window.removeEventListener('storage', syncDb);
    };
  }, []);

  const allGroups = db.trainingGroups || [];
  const myGroups = isTrainer
    ? allGroups.filter((g) => g.trainerId === currentUser?.trainerId)
    : allGroups;

  const [selectedGroupId, setSelectedGroupId] = useState(myGroups[0]?.id || allGroups[0]?.id || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ISSUED' | 'ELIGIBLE' | 'INELIGIBLE'
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'card'

  // Modal State
  const [studioModalOpen, setStudioModalOpen] = useState(false);
  const [certificateModalOpen, setCertificateModalOpen] = useState(false);
  const [activeCertificateItem, setActiveCertificateItem] = useState(null);

  // Online verification test modal
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifyTargetItem, setVerifyTargetItem] = useState(null);

  const selectedGroup = allGroups.find((g) => g.id === selectedGroupId);
  const selectedCourse = (db.courses || []).find((c) => c.id === selectedGroup?.courseId);
  const trainer = (db.trainers || []).find((t) => t.id === selectedGroup?.trainerId) || { name: 'Assigned Instructor', phone: '' };
  const groupStudents = (db.students || []).filter((s) => s.groupId === selectedGroupId);

  // Existing Certificates list
  const existingCertificates = db.certificates || [];

  // Compute student eligibility based on attendance (>= 80%) AND fee clearance (2nd installment paid)
  const studentCertificateData = useMemo(() => {
    return groupStudents.map((student) => {
      // Calculate student attendance %
      const studentAtts = (db.attendances || []).filter(
        (a) => a.groupId === selectedGroupId && a.studentId === student.id
      );
      const pCount = studentAtts.filter((a) => a.status === 'present' || a.status === 'P').length;
      const lCount = studentAtts.filter((a) => a.status === 'late' || a.status === 'L').length;
      const totalDays = studentAtts.length;
      const attPercent = totalDays > 0 ? Math.round(((pCount + lCount * 0.5) / totalDays) * 100) : 100;

      // Calculate fee due (2nd installment rule)
      const lockedFee = Number(student.lockedCourseFee) || Number(selectedCourse?.price) || 15000;
      const studentPayments = (db.payments || []).filter((p) => p.studentId === student.id);
      const totalPaid = studentPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const feeDue = Math.max(0, lockedFee - totalPaid);
      const isFeeCleared = feeDue <= 0;

      // Check if already issued
      const cert = existingCertificates.find((c) => c.studentId === student.id);
      const isIssued = Boolean(cert);

      // Student is eligible ONLY if attendance >= 80% AND 100% fees cleared
      const isEligible = attPercent >= 80 && isFeeCleared;

      return {
        student,
        attPercent,
        totalDays,
        feeDue,
        isFeeCleared,
        isIssued,
        isEligible,
        certificate: cert || null
      };
    });
  }, [groupStudents, selectedGroupId, selectedCourse, db.attendances, db.payments, existingCertificates]);

  // KPI Metrics
  const totalCount = studentCertificateData.length;
  const issuedCount = studentCertificateData.filter((d) => d.isIssued).length;
  const eligiblePendingCount = studentCertificateData.filter((d) => d.isEligible && !d.isIssued).length;
  const ineligibleCount = studentCertificateData.filter((d) => !d.isEligible && !d.isIssued).length;

  // Filtered List
  const filteredData = studentCertificateData.filter((item) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      (item.student.name || '').toLowerCase().includes(q) ||
      (item.student.tgid || '').toLowerCase().includes(q) ||
      (item.certificate?.certificateNo || '').toLowerCase().includes(q);

    if (!matchSearch) return false;

    if (statusFilter === 'ISSUED') return item.isIssued;
    if (statusFilter === 'ELIGIBLE') return item.isEligible && !item.isIssued;
    if (statusFilter === 'INELIGIBLE') return !item.isEligible;
    return true;
  });

  // Issue Certificate for single student
  const handleIssueCertificate = (student) => {
    // Strict Institutional Rule: Block certificate generation if 2nd installment is unpaid
    const lockedFee = Number(student.lockedCourseFee) || Number(selectedCourse?.price) || 15000;
    const studentPayments = (db.payments || []).filter((p) => p.studentId === student.id);
    const totalPaid = studentPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const feeDue = Math.max(0, lockedFee - totalPaid);

    if (feeDue > 0) {
      alert(`⛔ Certificate Generation Blocked!\n\nTrainee "${student.name}" (${student.tgid}) has an unpaid 2nd installment fee due of NPR ${feeDue.toLocaleString()}.\n\nInstitutional rules strictly require 100% fee clearance prior to generating and issuing the official certificate.`);
      return;
    }

    const studentAtts = (db.attendances || []).filter(
      (a) => a.groupId === selectedGroupId && a.studentId === student.id
    );
    const pCount = studentAtts.filter((a) => a.status === 'present' || a.status === 'P').length;
    const lCount = studentAtts.filter((a) => a.status === 'late' || a.status === 'L').length;
    const totalDays = studentAtts.length;
    const attPercent = totalDays > 0 ? Math.round(((pCount + lCount * 0.5) / totalDays) * 100) : 100;

    if (attPercent < 80) {
      alert(`⛔ Certificate Generation Blocked!\n\nTrainee "${student.name}" (${student.tgid}) has ${attPercent}% attendance, which is below the 80% CTEVT minimum requirement.`);
      return;
    }

    const existingList = db.certificates || [];
    const newCertNo = computeNextCertificateNumber(db, 0, {
      courseCode: selectedCourse?.code,
      batchCode: selectedGroup?.groupCode || selectedGroup?.code || selectedGroup?.name
    });

    const newCertificate = {
      id: `CERT-${Date.now()}`,
      certificateNo: newCertNo,
      studentId: student.id,
      groupId: selectedGroupId,
      courseId: selectedCourse?.id,
      issueDate: new Date().toISOString().slice(0, 10),
      status: 'Active',
      createdAt: new Date().toISOString()
    };

    const nextDb = {
      ...db,
      certificates: [newCertificate, ...existingList]
    };

    saveDB(nextDb);
    setDb(nextDb);

    try {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    } catch (_) {}

    // Open Certificate modal immediately
    setActiveCertificateItem({
      certificate: newCertificate,
      student,
      course: selectedCourse,
      group: selectedGroup,
      trainer
    });
    setCertificateModalOpen(true);
  };

  // Bulk Issue for all eligible students
  const handleBulkIssueEligible = () => {
    const eligibleStudents = studentCertificateData.filter((d) => d.isEligible && !d.isIssued);
    if (eligibleStudents.length === 0) {
      alert('No eligible students pending certificate issuance.');
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to issue certificates to ${eligibleStudents.length} eligible students in this group?`
      )
    ) {
      return;
    }

    let existingList = [...(db.certificates || [])];
    const today = new Date().toISOString().slice(0, 10);

    eligibleStudents.forEach((item, index) => {
      const newCertNo = computeNextCertificateNumber(db, index, {
        courseCode: selectedCourse?.code,
        batchCode: selectedGroup?.groupCode || selectedGroup?.code || selectedGroup?.name
      });

      existingList.unshift({
        id: `CERT-${Date.now()}-${index}`,
        certificateNo: newCertNo,
        studentId: item.student.id,
        groupId: selectedGroupId,
        courseId: selectedCourse?.id,
        issueDate: today,
        status: 'Active',
        createdAt: new Date().toISOString()
      });
    });

    const nextDb = { ...db, certificates: existingList };
    saveDB(nextDb);
    setDb(nextDb);

    try {
      confetti({ particleCount: 120, spread: 90, origin: { y: 0.5 } });
    } catch (_) {}
  };

  // Revoke / Delete Certificate
  const handleRevokeCertificate = (certId) => {
    if (window.confirm('Are you sure you want to revoke/cancel this certificate?')) {
      const nextDb = {
        ...db,
        certificates: (db.certificates || []).filter((c) => c.id !== certId)
      };
      saveDB(nextDb);
      setDb(nextDb);
    }
  };

  // Copy Verification link to clipboard
  const handleCopyLink = (certNo) => {
    const url = `${window.location.origin}${window.location.pathname}?verify=${encodeURIComponent(certNo)}`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(
        () => alert(`Verification link copied to clipboard:\n${url}`),
        () => window.prompt('Copy verification link:', url)
      );
    } else {
      window.prompt('Copy verification link:', url);
    }
  };

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2.2 }, maxWidth: '1440px', mx: 'auto' }}>
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
          <Grid item xs={12} md={6}>
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
                <WorkspacePremiumIcon sx={{ fontSize: 20, color: '#fbbf24' }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="subtitle1"
                  noWrap
                  sx={{ fontWeight: 800, color: '#ffffff', fontSize: { xs: '0.96rem', sm: '1.06rem' }, lineHeight: 1.2 }}
                >
                  Certificates (Vocational Training Completion)
                </Typography>
                <Typography
                  variant="caption"
                  noWrap
                  sx={{ color: '#cbd5e1', display: 'block', fontSize: '0.73rem', mt: 0.15 }}
                >
                  Prabidhik School, Jorpati • Official A4 Landscape Certificate with CTEVT Accreditation &amp; Dynamic QR
                </Typography>
              </Box>
            </Stack>
          </Grid>
          <Grid item xs={12} md={6} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', md: 'flex-end' }} flexWrap="wrap" useFlexGap>
              <Button
                variant="outlined"
                size="small"
                startIcon={<ColorLensIcon sx={{ fontSize: '15px !important' }} />}
                onClick={() => setStudioModalOpen(true)}
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
                Certificate Studio &amp; Design
              </Button>

              {eligiblePendingCount > 0 && (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<VerifiedIcon sx={{ fontSize: '16px !important' }} />}
                  onClick={handleBulkIssueEligible}
                  sx={{
                    bgcolor: '#f59e0b',
                    color: '#0f2e5a',
                    fontWeight: 800,
                    fontSize: '0.76rem',
                    whiteSpace: 'nowrap',
                    px: 1.4,
                    py: 0.65,
                    boxShadow: 'none',
                    '&:hover': { bgcolor: '#d97706', color: '#ffffff' }
                  }}
                >
                  Bulk Issue ({eligiblePendingCount} Eligible)
                </Button>
              )}
            </Stack>
          </Grid>
        </Grid>
      </Card>

      {/* 4 Compact Single-Row KPI Cards */}
      <Grid container spacing={1.5} sx={{ mb: 1.75 }}>
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
                  Total Trainees
                </Typography>
                <Typography sx={{ fontWeight: 800, color: '#0f2e5a', fontSize: '1.22rem', lineHeight: 1.2, mt: 0.2 }}>
                  {totalCount}
                </Typography>
                <Typography variant="caption" noWrap sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.68rem', display: 'block' }}>
                  Selected Batch
                </Typography>
              </Box>
              <Box sx={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#eff6ff', borderRadius: 1.5, color: '#1e40af', flexShrink: 0 }}>
                <WorkspacePremiumIcon sx={{ fontSize: 18 }} />
              </Box>
            </Stack>
          </Card>
        </Grid>

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
                  Issued
                </Typography>
                <Typography sx={{ fontWeight: 800, color: '#059669', fontSize: '1.22rem', lineHeight: 1.2, mt: 0.2 }}>
                  {issuedCount}
                </Typography>
                <Typography variant="caption" noWrap sx={{ color: '#059669', fontWeight: 600, fontSize: '0.68rem', display: 'block' }}>
                  Certified Graduates
                </Typography>
              </Box>
              <Box sx={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#ecfdf5', borderRadius: 1.5, color: '#059669', flexShrink: 0 }}>
                <CheckCircleIcon sx={{ fontSize: 18 }} />
              </Box>
            </Stack>
          </Card>
        </Grid>

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
                  Eligible Pending
                </Typography>
                <Typography sx={{ fontWeight: 800, color: '#0284c7', fontSize: '1.22rem', lineHeight: 1.2, mt: 0.2 }}>
                  {eligiblePendingCount}
                </Typography>
                <Typography variant="caption" noWrap sx={{ color: '#0284c7', fontWeight: 600, fontSize: '0.68rem', display: 'block' }}>
                  Ready to Issue
                </Typography>
              </Box>
              <Box sx={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f0f9ff', borderRadius: 1.5, color: '#0284c7', flexShrink: 0 }}>
                <VerifiedIcon sx={{ fontSize: 18 }} />
              </Box>
            </Stack>
          </Card>
        </Grid>

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
                  Ineligible (Fee / &lt;80%)
                </Typography>
                <Typography sx={{ fontWeight: 800, color: '#dc2626', fontSize: '1.22rem', lineHeight: 1.2, mt: 0.2 }}>
                  {ineligibleCount}
                </Typography>
                <Typography variant="caption" noWrap sx={{ color: '#dc2626', fontWeight: 600, fontSize: '0.68rem', display: 'block' }}>
                  Locked / Pending
                </Typography>
              </Box>
              <Box sx={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#fef2f2', borderRadius: 1.5, color: '#dc2626', flexShrink: 0 }}>
                <WarningAmberIcon sx={{ fontSize: 18 }} />
              </Box>
            </Stack>
          </Card>
        </Grid>
      </Grid>

      {/* Compact Group Selector, Search and View Filters */}
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
          <Grid item xs={12} sm={3.5}>
            <TextField
              select
              size="small"
              label="Training Group (Batch)"
              fullWidth
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
            >
              {myGroups.map((grp) => {
                const c = (db.courses || []).find((x) => x.id === grp.courseId);
                return (
                  <MenuItem key={grp.id} value={grp.id}>
                    {grp.groupCode} — {c?.title} (Shift {grp.shift})
                  </MenuItem>
                );
              })}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={3.5}>
            <TextField
              size="small"
              fullWidth
              placeholder="Search trainee name, TGID, cert no..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#94a3b8', fontSize: 18 }} />
                  </InputAdornment>
                )
              }}
            />
          </Grid>

          <Grid item xs={7} sm={3}>
            <TextField
              select
              size="small"
              fullWidth
              label="Filter Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="ALL">All Trainees ({studentCertificateData.length})</MenuItem>
              <MenuItem value="ISSUED">Issued Only ({issuedCount})</MenuItem>
              <MenuItem value="ELIGIBLE">Eligible to Issue ({eligiblePendingCount})</MenuItem>
              <MenuItem value="INELIGIBLE">Ineligible (Fee / &lt;80%) ({ineligibleCount})</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={5} sm={2} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1 }}>
            <Chip
              label={`${filteredData.length}`}
              size="small"
              sx={{ fontWeight: 800, bgcolor: '#f1f5f9', color: '#0f2e5a' }}
            />
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, next) => next && setViewMode(next)}
              size="small"
            >
              <ToggleButton value="table" sx={{ py: 0.4, px: 0.9 }}>
                <ViewListIcon fontSize="small" />
              </ToggleButton>
              <ToggleButton value="card" sx={{ py: 0.4, px: 0.9 }}>
                <ViewModuleIcon fontSize="small" />
              </ToggleButton>
            </ToggleButtonGroup>
          </Grid>
        </Grid>
      </Card>

      {/* 4. TABLE VIEW */}
      {viewMode === 'table' ? (
        <Card elevation={0} sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid #E2E8F0' }}>
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
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800, width: 48, textAlign: 'center' }}>
                    S.N.
                  </TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800 }}>Trainee Name</TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800 }}>TGID</TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800, textAlign: 'center' }}>Attendance %</TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800 }}>Certificate No</TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800 }}>Issue Date</TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800 }}>Status</TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800, textAlign: 'right' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredData.map((item, idx) => {
                  const { student, attPercent, isIssued, isEligible, certificate } = item;

                  return (
                    <TableRow key={student.id} hover>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 700, color: '#64748B', width: 48, fontSize: '0.75rem' }}>
                        {idx + 1}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                          <Avatar
                            src={student.photoUrl}
                            sx={{ width: 30, height: 30, bgcolor: '#0b2545', fontWeight: 800, fontSize: '0.78rem' }}
                          >
                            {student.name?.[0]}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.8rem' }}>
                              {student.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#647089', fontSize: '0.7rem' }}>
                              {student.permanentAddress || 'Nepal'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#647089', fontSize: '0.76rem' }}>
                        {student.tgid}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 900,
                            fontSize: '0.78rem',
                            color: attPercent >= 80 ? '#16834b' : '#dc2626'
                          }}
                        >
                          {attPercent}%
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#647089', fontSize: '0.67rem' }}>
                          {attPercent >= 80 ? 'CTEVT Eligible' : 'Low Attendance'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#0b2545', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                        {certificate ? certificate.certificateNo : '—'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.76rem', color: '#475569', whiteSpace: 'nowrap' }}>
                        {certificate ? certificate.issueDate : '—'}
                      </TableCell>
                      <TableCell>
                        {isIssued ? (
                          <Chip
                            icon={<CheckCircleIcon sx={{ fontSize: '13px !important' }} />}
                            label="Issued & Valid"
                            size="small"
                            color="success"
                            sx={{ height: 20, fontSize: '0.68rem', fontWeight: 800 }}
                          />
                        ) : item.feeDue > 0 ? (
                          <Chip
                            icon={<WarningAmberIcon sx={{ fontSize: '13px !important' }} />}
                            label={`Due: NPR ${item.feeDue.toLocaleString()} (Lock)`}
                            size="small"
                            sx={{ height: 20, fontSize: '0.68rem', fontWeight: 800, bgcolor: '#FEE2E2', color: '#DC2626' }}
                          />
                        ) : isEligible ? (
                          <Chip
                            label="Eligible (Ready)"
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ height: 20, fontSize: '0.68rem', fontWeight: 800 }}
                          />
                        ) : (
                          <Chip
                            icon={<WarningAmberIcon sx={{ fontSize: '13px !important' }} />}
                            label="Ineligible (<80%)"
                            size="small"
                            color="error"
                            variant="outlined"
                            sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }}
                          />
                        )}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {isIssued ? (
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.4 }}>
                            <Tooltip title="View & Print A4 Landscape Certificate">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setActiveCertificateItem({
                                    certificate,
                                    student,
                                    course: selectedCourse,
                                    group: selectedGroup,
                                    trainer
                                  });
                                  setCertificateModalOpen(true);
                                }}
                                sx={{ color: '#0b2545', p: 0.4 }}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Test Public Online Verification">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setVerifyTargetItem({
                                    certificate,
                                    student,
                                    course: selectedCourse,
                                    group: selectedGroup
                                  });
                                  setVerifyModalOpen(true);
                                }}
                                sx={{ color: '#c59b27', p: 0.4 }}
                              >
                                <VerifiedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Copy Verification Link">
                              <IconButton
                                size="small"
                                onClick={() => handleCopyLink(certificate.certificateNo)}
                                sx={{ color: '#1a56b0', p: 0.4 }}
                              >
                                <LinkIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Revoke Certificate">
                              <IconButton
                                size="small"
                                onClick={() => handleRevokeCertificate(certificate.id)}
                                sx={{ color: '#dc2626', p: 0.4 }}
                              >
                                <DeleteOutlineIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        ) : isEligible ? (
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleIssueCertificate(student)}
                            sx={{
                              bgcolor: '#0b2545',
                              fontWeight: 800,
                              fontSize: '0.7rem',
                              px: 0.9,
                              py: 0.3,
                              whiteSpace: 'nowrap'
                            }}
                          >
                            + Issue Certificate
                          </Button>
                        ) : item.feeDue > 0 ? (
                          <Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 800, fontSize: '0.7rem' }}>
                            ⛔ Fee Due (Locked)
                          </Typography>
                        ) : (
                          <Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 700, fontSize: '0.7rem' }}>
                            Attendance under 80%
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} sx={{ textAlign: 'center', py: 3.5, color: '#94a3b8', fontSize: '0.8rem' }}>
                      No trainees found matching your filter criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      ) : (
        /* 5. CARD VIEW */
        <Grid container spacing={2}>
          {filteredData.map((item, idx) => {
            const { student, attPercent, isIssued, isEligible, certificate } = item;

            return (
              <Grid item xs={12} sm={6} md={4} key={student.id}>
                <Card sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Chip label={`S.N. ${idx + 1}`} size="small" sx={{ fontWeight: 800, bgcolor: '#f1f5f9' }} />
                    {isIssued ? (
                      <Chip label="Issued & Valid" size="small" color="success" sx={{ fontWeight: 800 }} />
                    ) : item.feeDue > 0 ? (
                      <Chip
                        icon={<WarningAmberIcon />}
                        label={`Due: NPR ${item.feeDue.toLocaleString()} (Lock)`}
                        size="small"
                        sx={{ fontWeight: 800, bgcolor: '#FEE2E2', color: '#DC2626' }}
                      />
                    ) : isEligible ? (
                      <Chip label="Eligible (Ready)" size="small" color="primary" variant="outlined" sx={{ fontWeight: 800 }} />
                    ) : (
                      <Chip label="Ineligible (<80%)" size="small" color="error" variant="outlined" sx={{ fontWeight: 700 }} />
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                    <Avatar src={student.photoUrl} sx={{ width: 44, height: 44, bgcolor: '#0b2545', fontWeight: 900 }}>
                      {student.name?.[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                        {student.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#647089' }}>
                        TGID: {student.tgid}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ mb: 2, flexGrow: 1, fontSize: '0.85rem' }}>
                    <Typography variant="caption" sx={{ color: '#647089', display: 'block', fontWeight: 700 }}>
                      Attendance Rate: <b style={{ color: attPercent >= 80 ? '#16834b' : '#dc2626' }}>{attPercent}%</b>
                    </Typography>
                    {certificate ? (
                      <Box sx={{ mt: 1, p: 1, bgcolor: '#f8fafc', borderRadius: 1.5, border: '1px solid #e2e8f0' }}>
                        <Typography variant="caption" sx={{ color: '#647089', display: 'block', fontWeight: 700 }}>
                          CERTIFICATE NO:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 900, color: '#0b2545' }}>
                          {certificate.certificateNo}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#647089', display: 'block' }}>
                          Issued on: {certificate.issueDate}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="caption" sx={{ color: '#647089', display: 'block', mt: 1 }}>
                        Certificate: Not issued yet
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ pt: 1.5, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {isIssued ? (
                      <>
                        <Button
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={() => {
                            setActiveCertificateItem({
                              certificate,
                              student,
                              course: selectedCourse,
                              group: selectedGroup,
                              trainer
                            });
                            setCertificateModalOpen(true);
                          }}
                          sx={{ fontWeight: 800, color: '#0b2545' }}
                        >
                          A4 View
                        </Button>

                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setVerifyTargetItem({
                                certificate,
                                student,
                                course: selectedCourse,
                                group: selectedGroup
                              });
                              setVerifyModalOpen(true);
                            }}
                            sx={{ color: '#c59b27' }}
                          >
                            <VerifiedIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleRevokeCertificate(certificate.id)} sx={{ color: '#dc2626' }}>
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </>
                    ) : isEligible ? (
                      <Button
                        variant="contained"
                        size="small"
                        fullWidth
                        onClick={() => handleIssueCertificate(student)}
                        sx={{ bgcolor: '#0b2545', fontWeight: 800 }}
                      >
                        + Issue Certificate
                      </Button>
                    ) : item.feeDue > 0 ? (
                      <Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 800 }}>
                        ⛔ Fee Due (Locked)
                      </Typography>
                    ) : (
                      <Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 700 }}>
                        Ineligible (&lt;80% Attendance)
                      </Typography>
                    )}
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Certificate Studio & Design Customizer Modal */}
      <Dialog
        open={studioModalOpen}
        onClose={() => setStudioModalOpen(false)}
        maxWidth="xl"
        fullWidth
        scroll="paper"
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: '#F8FAFC'
          }
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: '#0F2E5A',
            color: '#FFFFFF',
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <ColorLensIcon sx={{ color: '#F59E0B', fontSize: 28 }} />
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              Certificate Studio & Template Designer
            </Typography>
          </Box>
          <IconButton onClick={() => setStudioModalOpen(false)} sx={{ color: '#FFFFFF' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 1.5, sm: 3 } }}>
          <CertificateStudioManager
            onSaveSuccess={() => {
              setDb(loadDB());
              setStudioModalOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Official A4 Landscape Printable Modal */}
      {activeCertificateItem && (
        <A4LandscapeCertificateModal
          open={certificateModalOpen}
          onClose={() => setCertificateModalOpen(false)}
          certificate={activeCertificateItem.certificate}
          student={activeCertificateItem.student}
          course={activeCertificateItem.course}
          group={activeCertificateItem.group}
          trainer={activeCertificateItem.trainer}
        />
      )}

      {/* Online Public Verification Preview Modal */}
      {verifyTargetItem && (
        <PublicCertificateVerify
          open={verifyModalOpen}
          onClose={() => setVerifyModalOpen(false)}
          certId={verifyTargetItem.certificate.certificateNo}
          certificate={verifyTargetItem.certificate}
          student={verifyTargetItem.student}
          course={verifyTargetItem.course}
          group={verifyTargetItem.group}
          onOpenFullCertificate={() => {
            setActiveCertificateItem({
              certificate: verifyTargetItem.certificate,
              student: verifyTargetItem.student,
              course: verifyTargetItem.course,
              group: verifyTargetItem.group,
              trainer
            });
            setCertificateModalOpen(true);
          }}
        />
      )}
    </Box>
  );
}
