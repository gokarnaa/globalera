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
                Trainee Admission & Agreement
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ color: '#e2e8f0', maxWidth: '780px', lineHeight: 1.6 }}>
              Global Era Technical School Jorpati — Manage trainee admissions with 50% advance collection, 30-day installment grace, optional complimentary OJT internship placement, and formal <strong>dual-copy (Office & Student Copy) A4 agreement letters</strong>.
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
              + New Admission & Agreement
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
          <Grid item xs={12} sm={5}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by student name, phone, or agreement no..."
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
              label="Course Filter"
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
            >
              <MenuItem value="ALL">All Courses</MenuItem>
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
              label="OJT Preference"
              value={ojtFilter}
              onChange={(e) => setOjtFilter(e.target.value)}
            >
              <MenuItem value="ALL">All OJT</MenuItem>
              <MenuItem value="REQUIRED">OJT Required (Yes)</MenuItem>
              <MenuItem value="NOT_REQUIRED">No OJT (No)</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={6} sm={2.3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Payment Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="ALL">All Status</MenuItem>
              <MenuItem value="DUE">2nd Installment Due</MenuItem>
              <MenuItem value="PAID">Fully Paid</MenuItem>
            </TextField>
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
                filteredAdmissions.map((adm, idx) => (
                  <TableRow key={adm.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell sx={{ fontWeight: 800, textAlign: 'center', color: '#64748B', width: 65 }}>
                      {idx + 1}
                    </TableCell>
                    {/* Agreement No & Date */}
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f2e5a' }}>
                        {adm.agreementNo}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                        Date: {adm.admissionDateBS || adm.admissionDate}
                      </Typography>
                      <Chip
                        label="Active Agreement"
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
                        50% Paid: Rs. {(Number(adm.advancePaid50) || 0).toLocaleString()}
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
