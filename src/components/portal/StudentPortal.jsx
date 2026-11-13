import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  Typography,
  Grid,
  Chip,
  Button,
  Avatar,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Stack,
  Divider,
  Badge
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import WorkIcon from '@mui/icons-material/Work';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BusinessIcon from '@mui/icons-material/Business';
import SendIcon from '@mui/icons-material/Send';
import VisibilityIcon from '@mui/icons-material/Visibility';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import LogoutIcon from '@mui/icons-material/Logout';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import PrintIcon from '@mui/icons-material/Print';
import DescriptionIcon from '@mui/icons-material/Description';
import FolderSharedIcon from '@mui/icons-material/FolderShared';
import LockIcon from '@mui/icons-material/Lock';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import { useAuth } from '../../context/AuthContext';
import { useDialog } from '../../context/DialogContext';
import { loadDB, saveDB } from '../../services/storage';
import A4LandscapeCertificateModal from '../certificates/A4LandscapeCertificateModal';
import PublicCertificateVerify from '../certificates/PublicCertificateVerify';

export default function StudentPortal({ onLogout }) {
  const { currentUser, logout } = useAuth();
  const { confirm, alert } = useDialog();
  const [db, setDb] = useState(loadDB());
  const [activeTab, setActiveTab] = useState(0);

  React.useEffect(() => {
    const refreshDb = () => setDb(loadDB());
    window.addEventListener('kite_db_updated', refreshDb);
    window.addEventListener('storage', refreshDb);
    return () => {
      window.removeEventListener('kite_db_updated', refreshDb);
      window.removeEventListener('storage', refreshDb);
    };
  }, []);

  // Job Application Modal
  const [selectedJob, setSelectedJob] = useState(null);
  const [coverNote, setCoverNote] = useState('');
  const [applySuccess, setApplySuccess] = useState(false);

  // Certificate Modals
  const [openCertModal, setOpenCertModal] = useState(false);
  const [openVerifyModal, setOpenVerifyModal] = useState(false);
  const [openPortfolioModal, setOpenPortfolioModal] = useState(false);
  const [openSyllabusModal, setOpenSyllabusModal] = useState(false);

  // Identify Student
  const student = useMemo(() => {
    const list = db.students || [];
    if (currentUser?.studentId) {
      return list.find((s) => s.id === currentUser.studentId) || list[0];
    }
    return list[0];
  }, [db.students, currentUser]);

  const group = useMemo(() => {
    return (db.trainingGroups || []).find((g) => g.id === student?.groupId);
  }, [db.trainingGroups, student]);

  const course = useMemo(() => {
    return (db.courses || []).find((c) => c.id === group?.courseId);
  }, [db.courses, group]);

  const occupation = useMemo(() => {
    return (db.occupations || []).find((o) => o.id === course?.occupationId);
  }, [db.occupations, course]);

  const trainer = useMemo(() => {
    return (db.trainers || []).find((t) => t.id === group?.trainerId);
  }, [db.trainers, group]);

  // Attendance metrics
  const attendanceStats = useMemo(() => {
    if (!student?.id || !group?.id) return { total: 0, present: 0, absent: 0, late: 0, percent: 100, records: [] };
    const records = (db.attendances || []).filter(
      (a) => a.studentId === student.id && a.groupId === group.id
    );
    const total = records.length;
    const present = records.filter((a) => a.status === 'present').length;
    const absent = records.filter((a) => a.status === 'absent').length;
    const late = records.filter((a) => a.status === 'late').length;
    const percent = total > 0 ? Math.round(((present + late * 0.5) / total) * 100) : 100;
    return { total, present, absent, late, percent, records };
  }, [db.attendances, student, group]);

  // Syllabus and evaluations with trade photo fallbacks
  const syllabusEvaluations = useMemo(() => {
    if (!course?.id) return [];
    const syllabi = (db.syllabi || []).filter((s) => s.courseId === course.id);
    const evals = (db.evaluations || []).filter((e) => e.studentId === student?.id);
    const cTitle = (course.title || '').toLowerCase();

    // Curated trade photos for vocational visual representation
    const tradePhotoPool = cTitle.includes('tailor') || cTitle.includes('dress') || cTitle.includes('fashion')
      ? [
          'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1520006403909-838d6b92c22e?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80'
        ]
      : cTitle.includes('beauty') || cTitle.includes('beautician') || cTitle.includes('parlor')
      ? [
          'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=600&q=80'
        ]
      : [
          'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1584982751601-97dcc096659c?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=600&q=80'
        ];

    return syllabi.map((syl, idx) => {
      const match = evals.find((e) => e.syllabusId === syl.id);
      return {
        ...syl,
        imageUrl: syl.imageUrl || tradePhotoPool[idx % tradePhotoPool.length],
        evaluation: match || null,
        mastered: match ? Boolean(match.mastered) : false
      };
    });
  }, [db.syllabi, db.evaluations, course, student]);

  const masteredCount = syllabusEvaluations.filter((s) => s.mastered).length;
  const progressPercent = syllabusEvaluations.length > 0
    ? Math.round((masteredCount / syllabusEvaluations.length) * 100)
    : 0;

  // Student Certificate
  const certificate = useMemo(() => {
    return (db.certificates || []).find((c) => c.studentId === student?.id);
  }, [db.certificates, student]);

  // Job Openings & Student's Applications
  const jobOpenings = db.jobOpenings || [];
  const studentApplications = (db.jobApplications || []).filter((a) => a.studentId === student?.id);

  // Fee Clearance Status
  const studentPayments = useMemo(() => {
    return (db.payments || []).filter((p) => p.studentId === student?.id);
  }, [db.payments, student]);

  const totalPaid = useMemo(() => {
    return studentPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  }, [studentPayments]);

  const agreedFee = useMemo(() => {
    return Number(student?.totalFee || student?.feeAgreed || course?.price || 15000);
  }, [student, course]);

  const dueBalance = Math.max(0, agreedFee - totalPaid);
  const isFeeCleared = dueBalance === 0;

  // Student OJT & Placement Data
  const studentOjt = useMemo(() => {
    return (db.ojts || []).find((o) => o.studentId === student?.id);
  }, [db.ojts, student]);

  const ojtEmployer = useMemo(() => {
    if (!studentOjt?.employerId) return null;
    return (db.employers || []).find((e) => e.id === studentOjt.employerId);
  }, [db.employers, studentOjt]);

  // 65-Day Work Plan Schedule for Trainee Batch
  const groupWorkPlans = useMemo(() => {
    const existing = (db.workPlans || []).filter((w) => w.groupId === group?.id);
    if (existing.length > 0) {
      return existing.sort((a, b) => Number(a.dayNumber) - Number(b.dayNumber));
    }
    // Generate structured 65-day day-by-day outline
    const syllabi = (db.syllabi || []).filter((s) => s.courseId === course?.id);
    const generated = [];
    const totalDays = 65;
    for (let d = 1; d <= totalDays; d++) {
      const sylIndex = Math.min(
        Math.max(0, syllabi.length - 1),
        Math.floor(((d - 1) / totalDays) * (syllabi.length || 1))
      );
      const targetSyl = syllabi[sylIndex] || {
        unitNo: Math.ceil(d / 8),
        title: 'Core Vocational & Practical Skill Competencies'
      };
      const isPractical = d % 5 !== 1;
      generated.push({
        id: `WP-DAY-${d}`,
        dayNumber: d,
        unitNo: targetSyl.unitNo,
        unitTitle: targetSyl.title,
        activityType: isPractical ? 'Practical Hands-on' : 'Theory & Concept',
        shiftDuration: '2 Hours (Daily Shift)',
        focusArea: isPractical
          ? `Laboratory Demonstration & Tool Practice (Unit 0${targetSyl.unitNo})`
          : `Industrial Standards, Safety Precautions & Theory Foundations`,
        toolsRequired: targetSyl.toolsAndMaterials || 'Standard Tool Kit & Consumables',
        completed: d <= (attendanceStats.total || 12)
      });
    }
    return generated;
  }, [db.workPlans, db.syllabi, group, course, attendanceStats.total]);

  const handleApplyJob = () => {
    if (!selectedJob) return;

    const newApp = {
      id: `APP-${Date.now()}`,
      jobId: selectedJob.id,
      studentId: student.id,
      status: 'Applied',
      applyDate: new Date().toISOString().slice(0, 10),
      coverNote: coverNote.trim(),
      isCurrentlyTraining: student.status === 'Active' || group?.status === 'Running'
    };

    const nextDb = {
      ...db,
      jobApplications: [newApp, ...(db.jobApplications || [])]
    };
    saveDB(nextDb);
    setDb(nextDb);
    setApplySuccess(true);
    setTimeout(() => {
      setApplySuccess(false);
      setSelectedJob(null);
      setCoverNote('');
    }, 1500);
  };

  return (
    <Box sx={{ pb: 6 }}>
      {/* Student Banner */}
      <Card
        sx={{
          py: { xs: 1.75, sm: 2.25 },
          px: { xs: 2, sm: 2.5, md: 3 },
          mb: 2.5,
          background: 'linear-gradient(135deg, #152238 0%, #1a56b0 100%)',
          color: '#ffffff',
          borderRadius: 4,
          boxShadow: '0 10px 28px -8px rgba(26,86,176,0.22)'
        }}
      >
        <Grid container spacing={2.5} alignItems="center">
          <Grid item>
            <Avatar
              src={student?.photoUrl}
              sx={{
                width: { xs: 60, md: 72 },
                height: { xs: 60, md: 72 },
                border: '3px solid rgba(255,255,255,0.85)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                fontSize: '1.7rem',
                bgcolor: '#0d9488'
              }}
            >
              {student?.name?.[0] || 'S'}
            </Avatar>
          </Grid>
          <Grid item xs={12} sm>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#ffffff' }}>
                {student?.name}
              </Typography>
              <Chip
                label={`TGID: ${student?.tgid || 'GETS-STD'}`}
                size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#ffffff', fontWeight: 700 }}
              />
              <Chip
                label={student?.status || 'Active'}
                size="small"
                sx={{
                  bgcolor: student?.status === 'Active' ? '#10b981' : '#f59e0b',
                  color: '#ffffff',
                  fontWeight: 800
                }}
              />
            </Box>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
              {course?.title || 'Vocational Training'} • {occupation?.name}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 0.5 }}>
              Batch: <b>{group?.groupCode} (Shift {group?.shift})</b> | Trainer: <b>{trainer?.name || 'Assigned Instructor'}</b> | Contact: <b>{student?.phone}</b>
            </Typography>
          </Grid>

          <Grid item xs={12} md="auto">
            <Stack direction={{ xs: 'row', md: 'column' }} spacing={1} flexWrap="wrap">
              <Button
                variant="contained"
                startIcon={<FolderSharedIcon />}
                onClick={() => setOpenPortfolioModal(true)}
                sx={{
                  bgcolor: '#10B981',
                  color: '#FFFFFF',
                  fontWeight: 900,
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                  '&:hover': { bgcolor: '#059669' }
                }}
              >
                Graduation Portfolio
              </Button>
              {certificate && (
                <Button
                  variant="contained"
                  startIcon={<WorkspacePremiumIcon />}
                  onClick={() => setOpenCertModal(true)}
                  sx={{
                    bgcolor: '#f59e0b',
                    color: '#152238',
                    fontWeight: 800,
                    '&:hover': { bgcolor: '#d97706' }
                  }}
                >
                  View Certificate
                </Button>
              )}
              <Button
                variant="outlined"
                startIcon={<QrCode2Icon />}
                onClick={() => setOpenVerifyModal(true)}
                sx={{
                  color: '#ffffff',
                  borderColor: 'rgba(255,255,255,0.5)',
                  fontWeight: 700,
                  '&:hover': { borderColor: '#ffffff', bgcolor: 'rgba(255,255,255,0.1)' }
                }}
              >
                QR Verify
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<LogoutIcon />}
                onClick={async () => {
                  const ok = await confirm({
                    type: 'logout',
                    title: 'Confirm Logout',
                    message: 'Are you sure you want to log out of the Student Portal?',
                    detail: 'Your session will be securely closed and you will need your phone number and PIN to log in again.',
                    confirmText: 'Yes, Logout',
                    cancelText: 'Cancel',
                    confirmColor: '#EF4444'
                  });
                  if (ok) {
                    if (onLogout) {
                      onLogout();
                    } else {
                      logout();
                    }
                  }
                }}
                sx={{
                  color: '#ffffff',
                  borderColor: 'rgba(255,255,255,0.4)',
                  fontWeight: 800,
                  borderRadius: 2,
                  '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.2)', borderColor: '#EF4444' }
                }}
              >
                Logout
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Card>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': { fontWeight: 800, fontSize: '0.92rem', textTransform: 'none' }
          }}
        >
          <Tab icon={<FactCheckIcon />} iconPosition="start" label="Attendance" />
          <Tab icon={<SchoolIcon />} iconPosition="start" label="Syllabus & Competencies" />
          <Tab icon={<CalendarMonthIcon />} iconPosition="start" label="65-Day Work Plan" />
          <Tab icon={<LocalHospitalIcon />} iconPosition="start" label="OJT Placement" />
          <Tab
            icon={
              <Badge badgeContent={jobOpenings.length} color="error">
                <WorkIcon />
              </Badge>
            }
            iconPosition="start"
            label="Job Opportunities"
          />
          <Tab icon={<WorkspacePremiumIcon />} iconPosition="start" label="Certificate" />
        </Tabs>
      </Box>

      {/* Tab 0: Attendance Summary */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 3, textAlign: 'center', height: '100%', borderRadius: 3 }}>
              <Typography variant="overline" sx={{ color: '#647089', fontWeight: 800 }}>
                ATTENDANCE PERCENTAGE
              </Typography>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 900,
                  color: attendanceStats.percent >= 85 ? '#16834b' : attendanceStats.percent >= 70 ? '#c9820a' : '#d5372f',
                  my: 1
                }}
              >
                {attendanceStats.percent}%
              </Typography>
              <Chip
                label={
                  attendanceStats.percent >= 85
                    ? 'CTEVT Compliant (Regular)'
                    : attendanceStats.percent >= 70
                    ? 'Monitor (Attendance Below 85%)'
                    : 'At Risk (Below 70%)'
                }
                sx={{
                  fontWeight: 800,
                  bgcolor: attendanceStats.percent >= 85 ? '#e5f8ee' : '#fdf3e2',
                  color: attendanceStats.percent >= 85 ? '#16834b' : '#c9820a'
                }}
              />
              <LinearProgress
                variant="determinate"
                value={attendanceStats.percent}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  mt: 3,
                  bgcolor: '#e2e8f0',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: attendanceStats.percent >= 85 ? '#16834b' : attendanceStats.percent >= 70 ? '#c9820a' : '#d5372f'
                  }
                }}
              />
              <Typography variant="caption" sx={{ color: '#647089', display: 'block', mt: 1 }}>
                Minimum 80% attendance is mandatory for certificate eligibility.
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Card sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                Session Record Breakdown
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={4}>
                  <Box sx={{ p: 2, bgcolor: '#f0fdf4', borderRadius: 2, textAlign: 'center', border: '1px solid #bbf7d0' }}>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#16834b' }}>
                      {attendanceStats.present}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#16834b' }}>
                      Present
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ p: 2, bgcolor: '#fef2f2', borderRadius: 2, textAlign: 'center', border: '1px solid #fecaca' }}>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#dc2626' }}>
                      {attendanceStats.absent}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#dc2626' }}>
                      Absent
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ p: 2, bgcolor: '#fffbeb', borderRadius: 2, textAlign: 'center', border: '1px solid #fef3c7' }}>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#d97706' }}>
                      {attendanceStats.late}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#d97706' }}>
                      Late
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                Recent Attendance Logs
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 240, borderRadius: 2, overflow: 'hidden' }}>
                <Table size="small">
                  <TableHead
                    sx={{
                      bgcolor: '#0F2E5A',
                      '& .MuiTableCell-head': {
                        bgcolor: '#0F2E5A !important',
                        color: '#FFFFFF !important',
                        fontWeight: 900,
                        fontSize: '0.82rem',
                        py: 1.2,
                        borderBottom: '2px solid #F59E0B'
                      }
                    }}
                  >
                    <TableRow>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, width: 55, textAlign: 'center' }}>S.N.</TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>Date</TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>Status</TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>Remarks</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(attendanceStats.records || []).slice(-10).reverse().map((r, i) => (
                      <TableRow key={i}>
                        <TableCell sx={{ textAlign: 'center', fontWeight: 700, color: '#64748B' }}>{i + 1}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{r.date}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={r.status.toUpperCase()}
                            sx={{
                              fontWeight: 800,
                              fontSize: '0.75rem',
                              bgcolor: r.status === 'present' ? '#e5f8ee' : r.status === 'absent' ? '#fee2e2' : '#fef3c7',
                              color: r.status === 'present' ? '#16834b' : r.status === 'absent' ? '#dc2626' : '#d97706'
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: '#647089' }}>{r.remarks || '—'}</TableCell>
                      </TableRow>
                    ))}
                    {(attendanceStats.records || []).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} align="center" sx={{ py: 3, color: '#647089' }}>
                          No attendance records found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tab 1: Syllabus Competency */}
      {activeTab === 1 && (
        <Card sx={{ p: 3, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {course?.title} - Syllabus & Competency Status
              </Typography>
              <Typography variant="body2" sx={{ color: '#647089' }}>
                Your practical and theoretical competency progress verified by the instructor.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Button
                variant="outlined"
                size="small"
                startIcon={<MenuBookIcon />}
                onClick={() => setOpenSyllabusModal(true)}
                sx={{ fontWeight: 800, borderColor: '#0F2C59', color: '#0F2C59' }}
              >
                Official Syllabus &amp; Brochure
              </Button>
              <Chip
                icon={<CheckCircleIcon />}
                label={`${masteredCount} / ${syllabusEvaluations.length} Units Mastered (${progressPercent}%)`}
                color="success"
                sx={{ fontWeight: 800 }}
              />
            </Stack>
          </Box>

          <LinearProgress
            variant="determinate"
            value={progressPercent}
            sx={{ height: 8, borderRadius: 4, mb: 3 }}
          />

          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
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
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, width: 70 }}>Unit</TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>Topic & Learning Outcomes</TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, width: 120 }}>Credit Hours</TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, width: 140 }}>Status</TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>Areas to Improve / Plan</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {syllabusEvaluations.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell sx={{ fontWeight: 800, color: '#1a56b0' }}>
                      Unit {item.unitNo}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        {item.imageUrl && (
                          <Avatar
                            src={item.imageUrl}
                            variant="rounded"
                            sx={{ width: 44, height: 44, border: '1px solid #CBD5E1', flexShrink: 0 }}
                          />
                        )}
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A', lineHeight: 1.25 }}>
                            {item.title}
                          </Typography>
                          {item.learningOutcome && (
                            <Typography variant="caption" sx={{ color: '#647089', display: 'block', mt: 0.2 }}>
                              🎯 {item.learningOutcome}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>
                        T: {item.theoryHours}h | P: {item.practicalHours}h ({item.totalHours}h)
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {item.mastered ? (
                        <Chip
                          icon={<CheckCircleIcon />}
                          label="Mastered"
                          size="small"
                          sx={{ bgcolor: '#e5f8ee', color: '#16834b', fontWeight: 800 }}
                        />
                      ) : (
                        <Chip
                          icon={<AccessTimeIcon />}
                          label="In Progress"
                          size="small"
                          sx={{ bgcolor: '#fef3c7', color: '#b45309', fontWeight: 700 }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {item.evaluation?.areasToImprove ? (
                        <Box>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: '#dc2626' }}>
                            To Improve: {item.evaluation.areasToImprove}
                          </Typography>
                          {item.evaluation.trainerPlan && (
                            <Typography variant="caption" sx={{ display: 'block', color: '#1a56b0' }}>
                              Trainer Plan: {item.evaluation.trainerPlan}
                            </Typography>
                          )}
                        </Box>
                      ) : (
                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                          Satisfactory Progress
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Tab 2: 65-Day Work Plan & Daily Lessons */}
      {activeTab === 2 && (
        <Card sx={{ p: 3, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {course?.title} — 65-Day Technical Delivery Roadmap
              </Typography>
              <Typography variant="body2" sx={{ color: '#647089' }}>
                Batch {group?.groupCode || 'G1'} (Shift {group?.shift || 'A'}) • 2-Hour Daily Lessons • 80% Practical Hands-on
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Chip
                icon={<CalendarMonthIcon />}
                label="65 Days (CTEVT Standard)"
                sx={{ fontWeight: 800, bgcolor: '#DBEAFE', color: '#1E40AF' }}
              />
              <Chip
                label={`Completed: ${Math.min(65, attendanceStats.total || 12)} / 65 Days`}
                color="success"
                sx={{ fontWeight: 800 }}
              />
            </Stack>
          </Box>

          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 480, borderRadius: 2 }}>
            <Table stickyHeader size="small">
              <TableHead
                sx={{
                  bgcolor: '#0F2E5A',
                  '& .MuiTableCell-head': {
                    bgcolor: '#0F2E5A !important',
                    color: '#FFFFFF !important',
                    fontWeight: 900,
                    fontSize: '0.82rem',
                    py: 1.2
                  }
                }}
              >
                <TableRow>
                  <TableCell sx={{ width: 70, textAlign: 'center' }}>Day</TableCell>
                  <TableCell sx={{ width: 100 }}>Unit</TableCell>
                  <TableCell sx={{ width: 150 }}>Type</TableCell>
                  <TableCell>Lesson Focus & Practical Competency</TableCell>
                  <TableCell sx={{ width: 220 }}>Tools & Equipment</TableCell>
                  <TableCell sx={{ width: 110, textAlign: 'center' }}>Progress</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {groupWorkPlans.map((wp) => (
                  <TableRow key={wp.id} hover sx={{ bgcolor: wp.completed ? 'rgba(240, 253, 244, 0.4)' : 'inherit' }}>
                    <TableCell sx={{ fontWeight: 900, textAlign: 'center', color: '#0F2C59' }}>
                      Day {String(wp.dayNumber).padStart(2, '0')}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#1E40AF' }}>
                      Unit 0{wp.unitNo}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={wp.activityType}
                        sx={{
                          fontWeight: 800,
                          fontSize: '0.7rem',
                          bgcolor: wp.activityType.includes('Practical') ? '#DCFCE7' : '#DBEAFE',
                          color: wp.activityType.includes('Practical') ? '#166534' : '#1E40AF'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                        {wp.focusArea}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        Topic: {wp.unitTitle} • Duration: 2 Hours
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.78rem', color: '#475569' }}>
                      {wp.toolsRequired || 'Standard Workshop Set'}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      {wp.completed ? (
                        <Chip size="small" label="Delivered" sx={{ bgcolor: '#DCFCE7', color: '#166534', fontWeight: 800, fontSize: '0.68rem' }} />
                      ) : (
                        <Chip size="small" label="Upcoming" variant="outlined" sx={{ color: '#94A3B8', fontSize: '0.68rem' }} />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Tab 3: OJT Placement & Practicum */}
      {activeTab === 3 && (
        <Card sx={{ p: 3, borderRadius: 3 }}>
          {/* Institutional Fee Clearance Guard Banner */}
          <Box sx={{ mb: 3 }}>
            {isFeeCleared ? (
              <Alert severity="success" sx={{ borderRadius: 2, fontWeight: 700 }}>
                ✓ Institutional Fee Clearance Verified: 100% of training fees cleared. Trainee is fully authorized for OJT Internship Logbook signoff and Official CTEVT Certificate Generation.
              </Alert>
            ) : (
              <Alert severity="warning" sx={{ borderRadius: 2, fontWeight: 700 }}>
                ⛔ Outstanding Fee Balance: NPR {dueBalance.toLocaleString()} Due (2nd Installment).
                Institutional regulations require full fee settlement prior to final OJT internship endorsement and certificate issuance. Please visit the accounts desk to settle dues.
              </Alert>
            )}
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                On-the-Job Training (OJT) & Industry Practicum
              </Typography>
              <Typography variant="body2" sx={{ color: '#647089' }}>
                Industry practicum placement details, supervisor evaluations and logbook verification.
              </Typography>
            </Box>
            <Chip
              label={studentOjt ? 'OJT Placed (Active)' : 'Placement Scheduled'}
              color={studentOjt ? 'success' : 'default'}
              sx={{ fontWeight: 800 }}
            />
          </Box>

          {studentOjt ? (
            <Grid container spacing={3}>
              <Grid item xs={12} md={7}>
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 2.5, bgcolor: '#F8FAFC' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0F2C59', mb: 2 }}>
                    Placement Enterprise & Supervisor Info
                  </Typography>
                  <Stack spacing={1.5}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Host Company / Clinic:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>{ojtEmployer?.name || studentOjt.hostCompany || 'Partner Host Enterprise'}</Typography>
                    </Box>
                    <Divider />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Industry Sector:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{ojtEmployer?.industry || 'Vocational Enterprise'}</Typography>
                    </Box>
                    <Divider />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Placement Track:</Typography>
                      <Chip size="small" label={studentOjt.type || 'Concurrent Practicum (During Training)'} sx={{ bgcolor: '#DBEAFE', color: '#1E40AF', fontWeight: 800 }} />
                    </Box>
                    <Divider />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Assigned Supervisor:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>{studentOjt.supervisorName || ojtEmployer?.contactPerson || 'Assigned Supervisor'}</Typography>
                    </Box>
                    <Divider />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Supervisor Contact:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{studentOjt.supervisorPhone || ojtEmployer?.phone || '01410715'}</Typography>
                    </Box>
                    <Divider />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Location / Ward:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{ojtEmployer?.location || studentOjt.location || 'Kathmandu'}</Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>

              <Grid item xs={12} md={5}>
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 2.5, bgcolor: '#FFFFFF', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0F2C59', mb: 1.5 }}>
                      Supervisor Appraisal & Progress
                    </Typography>
                    <Box sx={{ p: 2, bgcolor: '#F0FDF4', borderRadius: 2, border: '1px solid #BBF7D0', mb: 2, textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ color: '#166534', fontWeight: 700, display: 'block' }}>
                        PERFORMANCE APPRAISAL
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 900, color: '#15803D', my: 0.5 }}>
                        {studentOjt.rating || 'Distinction (A+)'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#166534' }}>
                        Logged: {studentOjt.daysCompleted || 24} Days / 160 Practical Hours
                      </Typography>
                    </Box>

                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#334155', display: 'block', mb: 0.5 }}>
                      Supervisor Remarks:
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#475569', fontStyle: 'italic', bgcolor: '#F8FAFC', p: 1.5, borderRadius: 1.5, border: '1px solid #E2E8F0' }}>
                      "{studentOjt.remarks || 'Trainee demonstrates high professional integrity, excellent client care, technical skill precision, and perfect punctuality.'}"
                    </Typography>
                  </Box>

                  <Box sx={{ pt: 2, borderTop: '1px solid #E2E8F0', mt: 2 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<FolderSharedIcon />}
                      onClick={() => setOpenPortfolioModal(true)}
                      sx={{ fontWeight: 800 }}
                    >
                      View Graduation Portfolio
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          ) : (
            <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 3, bgcolor: '#F8FAFC' }}>
              <LocalHospitalIcon sx={{ fontSize: 56, color: '#94A3B8', mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#334155', mb: 0.5 }}>
                OJT Practicum Assignment in Progress
              </Typography>
              <Typography variant="body2" sx={{ color: '#647089', maxWidth: 540, mx: 'auto', mb: 2 }}>
                Your OJT placement will be officially assigned by the institute in coordination with partner salons, boutiques, care homes, and hospitals.
                Ensure your biometric attendance remains above 80% and installment fees are up to date.
              </Typography>
              <Chip label="Requirement: ≥80% Attendance & Fee Cleared" color="info" sx={{ fontWeight: 800 }} />
            </Paper>
          )}
        </Card>
      )}

      {/* Tab 4: Job Board & Applications */}
      {activeTab === 4 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Job & OJT Opportunities
              </Typography>
              <Typography variant="body2" sx={{ color: '#647089' }}>
                You can apply directly to partner employers even while your training is ongoing.
              </Typography>
            </Box>
            <Chip
              label={`Applied: ${studentApplications.length}`}
              color="primary"
              sx={{ fontWeight: 800 }}
            />
          </Box>

          {/* Applied Jobs Section if any */}
          {studentApplications.length > 0 && (
            <Card sx={{ p: 2.5, mb: 3, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#16834b', mb: 1.5 }}>
                Your Active Job Applications
              </Typography>
              <Grid container spacing={2}>
                {studentApplications.map((app) => {
                  const job = jobOpenings.find((j) => j.id === app.jobId);
                  const emp = (db.employers || []).find((e) => e.id === job?.employerId);
                  return (
                    <Grid item xs={12} sm={6} md={4} key={app.id}>
                      <Card sx={{ p: 2, bgcolor: '#ffffff', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                          {job?.title || 'Job Opening'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#647089', display: 'block' }}>
                          🏢 {emp?.name || 'Partner Company'}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                            Applied: {app.applyDate}
                          </Typography>
                          <Chip
                            size="small"
                            label={app.status}
                            sx={{
                              fontWeight: 800,
                              bgcolor: app.status === 'Hired' ? '#10b981' : app.status === 'Shortlisted' ? '#0284c7' : '#f59e0b',
                              color: '#fff'
                            }}
                          />
                        </Box>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Card>
          )}

          {/* Available Jobs Grid */}
          <Grid container spacing={2.5}>
            {jobOpenings.map((job) => {
              const emp = (db.employers || []).find((e) => e.id === job.employerId);
              const occ = (db.occupations || []).find((o) => o.id === job.occupationId);
              const hasApplied = studentApplications.some((a) => a.jobId === job.id);

              return (
                <Grid item xs={12} md={6} key={job.id}>
                  <Card
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.04)',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 800, color: '#152238' }}>
                            {job.title}
                          </Typography>
                          <Typography variant="subtitle2" sx={{ color: '#1a56b0', fontWeight: 700 }}>
                            {emp?.name || 'Approved Employer'}
                          </Typography>
                        </Box>
                        <Chip
                          label={job.employmentType || 'Full-Time'}
                          size="small"
                          sx={{ bgcolor: '#e8f0fd', color: '#1a56b0', fontWeight: 700 }}
                        />
                      </Box>

                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, my: 1.5 }}>
                        <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#647089' }}>
                          <LocationOnIcon sx={{ fontSize: 16 }} /> {job.location || 'Kathmandu'}
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#16834b', fontWeight: 700 }}>
                          💰 {job.salaryRange || 'Attractive Salary'}
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#647089' }}>
                          👥 {job.vacancies || 1} Open Positions
                        </Typography>
                      </Box>

                      <Typography variant="body2" sx={{ color: '#475569', mb: 2 }}>
                        {job.description}
                      </Typography>

                      {job.requiredSkills && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#152238', display: 'block', mb: 0.5 }}>
                            Key Competencies Required:
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#647089', bgcolor: '#f8fafc', p: 1, borderRadius: 1.5, display: 'block' }}>
                            {job.requiredSkills}
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    <Box sx={{ pt: 2, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                        Occupation: {occ?.name || 'General'}
                      </Typography>
                      {hasApplied ? (
                        <Button variant="outlined" disabled size="small" sx={{ fontWeight: 700 }}>
                          ✓ Already Applied
                        </Button>
                      ) : (
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<SendIcon />}
                          onClick={() => setSelectedJob(job)}
                          sx={{ fontWeight: 800, bgcolor: '#1a56b0' }}
                        >
                          Apply Now
                        </Button>
                      )}
                    </Box>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}

      {/* Tab 5: Official Certificate */}
      {activeTab === 5 && (
        <Card sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          {certificate ? (
            <Box sx={{ maxWidth: 600, mx: 'auto' }}>
              <WorkspacePremiumIcon sx={{ fontSize: 64, color: '#f59e0b', mb: 1 }} />
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#152238' }}>
                Congratulations! Your Official Certificate Has Been Issued.
              </Typography>
              <Typography variant="body1" sx={{ color: '#647089', my: 1 }}>
                CTEVT-accredited national standard vocational training certificate.
              </Typography>

              <Card sx={{ p: 2.5, my: 3, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0', textAlign: 'left' }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: '#647489' }}>Certificate No:</Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{certificate.certificateNo}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: '#647489' }}>Issue Date:</Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{certificate.issueDate}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: '#647489' }}>Grade / Division:</Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#16834b' }}>{certificate.grade || 'Distinction'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: '#647489' }}>Verification Hash:</Typography>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, display: 'block' }}>
                      {certificate.verificationCode || certificate.certificateNo}
                    </Typography>
                  </Grid>
                </Grid>
              </Card>

              <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap" gap={1}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<VisibilityIcon />}
                  onClick={() => setOpenCertModal(true)}
                  sx={{ bgcolor: '#1a56b0', fontWeight: 800 }}
                >
                  View Certificate (A4 Print Ready)
                </Button>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<FolderSharedIcon />}
                  onClick={() => setOpenPortfolioModal(true)}
                  sx={{ bgcolor: '#10B981', fontWeight: 800, '&:hover': { bgcolor: '#059669' } }}
                >
                  Graduation Portfolio
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<QrCode2Icon />}
                  onClick={() => setOpenVerifyModal(true)}
                  sx={{ fontWeight: 700 }}
                >
                  Verify Online QR
                </Button>
              </Stack>
            </Box>
          ) : (
            <Box sx={{ py: 6 }}>
              <SchoolIcon sx={{ fontSize: 60, color: '#94a3b8', mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#647089' }}>
                Certificate Preparation in Progress
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8', mt: 0.5, maxWidth: 500, mx: 'auto' }}>
                Once your training, required attendance (minimum 80%), and competency evaluations are completed, the official certificate will be issued by the institute.
              </Typography>
            </Box>
          )}
        </Card>
      )}

      {/* Apply Job Dialog */}
      <Dialog open={Boolean(selectedJob)} onClose={() => setSelectedJob(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          Apply for {selectedJob?.title}
        </DialogTitle>
        <DialogContent>
          {applySuccess && (
            <Alert severity="success" sx={{ mb: 2, fontWeight: 700 }}>
              Your application has been submitted successfully! The employer has been notified.
            </Alert>
          )}
          <Typography variant="body2" sx={{ color: '#647089', mb: 2 }}>
            Company: <b>{(db.employers || []).find((e) => e.id === selectedJob?.employerId)?.name}</b>
          </Typography>
          <TextField
            label="Brief Experience or Message (Optional Note to Employer)"
            fullWidth
            multiline
            rows={4}
            value={coverNote}
            onChange={(e) => setCoverNote(e.target.value)}
            placeholder="Example: I have completed Basic Tailoring training at Global Era with 95% attendance and specialize in Kurtha and Blouse cutting."
          />
          <Alert severity="info" sx={{ mt: 2, fontSize: '0.85rem' }}>
            The employer will be able to view your attendance rate ({attendanceStats.percent}%) and mastered competencies.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setSelectedJob(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleApplyJob} sx={{ fontWeight: 800 }}>
            Submit Application
          </Button>
        </DialogActions>
      </Dialog>

      {/* Certificate Modal */}
      {certificate && (
        <A4LandscapeCertificateModal
          open={openCertModal}
          onClose={() => setOpenCertModal(false)}
          certificate={certificate}
          student={student}
          course={course}
          group={group}
          trainer={trainer}
        />
      )}

      {/* Verify Modal */}
      {certificate && (
        <PublicCertificateVerify
          open={openVerifyModal}
          onClose={() => setOpenVerifyModal(false)}
          certId={certificate.certificateNo}
          certificate={certificate}
          student={student}
          course={course}
          group={group}
          onOpenFullCertificate={() => {
            setOpenVerifyModal(false);
            setOpenCertModal(true);
          }}
        />
      )}

      {/* =======================================================
          1-CLICK VERIFIED GRADUATION PORTFOLIO DOSSIER MODAL
          ======================================================= */}
      <Dialog
        open={openPortfolioModal}
        onClose={() => setOpenPortfolioModal(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3.5, p: { xs: 1.5, sm: 2.5 } } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900, color: '#0F2C59' }}>
              Verified Trainee Graduation Portfolio &amp; Dossier
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
              CTEVT Accredited 4-in-1 Comprehensive Graduate Credentials Package
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              size="small"
              startIcon={<PrintIcon />}
              onClick={() => window.print()}
              sx={{ bgcolor: '#0F2C59', fontWeight: 800 }}
            >
              Print Dossier (A4)
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => setOpenPortfolioModal(false)}
              sx={{ fontWeight: 700 }}
            >
              Close
            </Button>
          </Stack>
        </DialogTitle>

        <DialogContent dividers sx={{ p: { xs: 2, sm: 3 } }}>
          {/* Institutional Header */}
          <Box sx={{ textAlign: 'center', pb: 2, borderBottom: '3px solid #0F2C59', mb: 2.5, bgcolor: '#F8FAFC', p: 2, borderRadius: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#0F2C59', letterSpacing: '0.02em' }}>
              Global Era Technical School
            </Typography>
            <Typography variant="subtitle2" sx={{ color: '#334155', fontWeight: 700 }}>
              GLOBAL ERA MULTI SERVICE PVT. LTD. • Jorpati, Gokarneshwor, Kathmandu
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 1 }}>
              CTEVT Affiliation Code: 4208 • Reg No: 184920/078/079 • Phone: 01410715
            </Typography>
            <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" sx={{ gap: 0.5 }}>
              <Chip
                label="OFFICIAL TVET GRADUATE PORTFOLIO & COMPETENCY DOSSIER"
                size="small"
                sx={{ bgcolor: '#DBEAFE', color: '#1E40AF', fontWeight: 900, fontSize: '0.72rem' }}
              />
              <Chip
                label="⚡ GraphQL Accelerated"
                size="small"
                sx={{ bgcolor: '#ECFDF5', color: '#047857', fontWeight: 800, fontSize: '0.72rem', border: '1px solid #A7F3D0' }}
              />
            </Stack>
          </Box>

          {/* Trainee Profile Snapshot */}
          <Paper variant="outlined" sx={{ p: 2, mb: 2.5, borderRadius: 2, bgcolor: '#FFFFFF' }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>Candidate Name:</Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0F2C59' }}>{student?.name}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>Registration TGID:</Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{student?.tgid || 'GETS-STD-101'}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>Contact Phone:</Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{student?.phone}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>Completed Course:</Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>{course?.title || 'Vocational Training'}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>Training Batch &amp; Shift:</Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{group?.groupCode} (Shift {group?.shift})</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>Lead Instructor:</Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{trainer?.name || 'Lead Trainer'}</Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Section 1: Certificate & Accreditation */}
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0F2C59', mb: 1 }}>
              1. CTEVT Recognized Skill Certification
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>Certificate Number:</Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{certificate?.certificateNo || 'IN-PROGRESS'}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>Issue Date:</Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{certificate?.issueDate || 'Upon Final Assessment'}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>Assessment Grade:</Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#059669' }}>{certificate?.grade || 'Distinction (A+)'}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>Credential Status:</Typography>
                  <Chip
                    size="small"
                    label={certificate ? 'Official Issued' : 'Final Review'}
                    sx={{
                      fontWeight: 800,
                      fontSize: '0.7rem',
                      bgcolor: certificate ? '#DCFCE7' : '#FEF3C7',
                      color: certificate ? '#166534' : '#92400E'
                    }}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Box>

          {/* Section 2: Unit Competencies & 80% Practical Mastery */}
          <Box sx={{ mb: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0F2C59' }}>
                2. Unit-wise Skill Competency Transcript (80% Practical)
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#059669' }}>
                {masteredCount} / {syllabusEvaluations.length} Units Mastered ({progressPercent}%)
              </Typography>
            </Box>

            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#0F2C59' }}>
                  <TableRow>
                    <TableCell sx={{ color: '#FFFFFF', fontWeight: 900, width: 50, textAlign: 'center' }}>Unit</TableCell>
                    <TableCell sx={{ color: '#FFFFFF', fontWeight: 900 }}>Competency / Core Module</TableCell>
                    <TableCell sx={{ color: '#FFFFFF', fontWeight: 900, textAlign: 'center', width: 80 }}>Theory</TableCell>
                    <TableCell sx={{ color: '#FFFFFF', fontWeight: 900, textAlign: 'center', width: 80 }}>Practical</TableCell>
                    <TableCell sx={{ color: '#FFFFFF', fontWeight: 900, textAlign: 'center', width: 90 }}>Total</TableCell>
                    <TableCell sx={{ color: '#FFFFFF', fontWeight: 900, width: 110, textAlign: 'center' }}>Evaluation</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {syllabusEvaluations.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 800, color: '#0F2C59' }}>
                        0{item.unitNo}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.82rem' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {item.imageUrl && (
                            <Avatar
                              src={item.imageUrl}
                              variant="rounded"
                              sx={{ width: 34, height: 34, border: '1px solid #CBD5E1', flexShrink: 0 }}
                            />
                          )}
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 800, fontSize: '0.82rem', color: '#0F172A' }}>
                              {item.title}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>{item.theoryHours}h</TableCell>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 800, color: '#059669' }}>{item.practicalHours}h</TableCell>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 800 }}>{item.totalHours}h</TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Chip
                          size="small"
                          label={item.mastered ? 'Competent' : 'In Progress'}
                          sx={{
                            fontWeight: 800,
                            fontSize: '0.68rem',
                            bgcolor: item.mastered ? '#DCFCE7' : '#FEF3C7',
                            color: item.mastered ? '#166534' : '#92400E'
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Section 3: OJT Internship & Employer Appraisal */}
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0F2C59', mb: 1 }}>
              3. On-the-Job Training (OJT) &amp; Host Enterprise Appraisal
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>Host Enterprise:</Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                    {ojtEmployer?.name || studentOjt?.hostCompany || 'Partner Host Salon / Boutique / Care Center'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#475569' }}>
                    Sector: {ojtEmployer?.industry || 'Technical & Vocational Enterprise'}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>Placement Track:</Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                    {studentOjt?.type || 'Concurrent Practicum'}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>Supervisor Rating:</Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#059669' }}>
                    {studentOjt?.rating || 'Distinction (A+)'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.3 }}>
                    Supervisor Endorsement &amp; Performance Feedback:
                  </Typography>
                  <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#334155', bgcolor: '#FFFFFF', p: 1.2, borderRadius: 1.5, border: '1px solid #E2E8F0' }}>
                    "{studentOjt?.remarks || 'Demonstrates excellent workplace discipline, mastery of tools and equipment, high punctuality and exceptional client-first communication.'}"
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Box>

          {/* Section 4: Biometric Attendance & Fee Clearance */}
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0F2C59', mb: 1 }}>
              4. Biometric Attendance &amp; Institutional Financial Clearance
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: '#FFFFFF' }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>
                    Biometric Attendance Record:
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5 }}>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: attendanceStats.percent >= 80 ? '#059669' : '#D97706' }}>
                      {attendanceStats.percent}%
                    </Typography>
                    <Box>
                      <Typography variant="caption" sx={{ display: 'block', fontWeight: 700 }}>
                        {attendanceStats.present} Present / {attendanceStats.total} Sessions Logged
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        {attendanceStats.percent >= 80 ? '✓ CTEVT Regularity Standard Met' : '⚠️ Attendance Needs Regularity'}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: isFeeCleared ? '#F0FDF4' : '#FEF3C7', border: isFeeCleared ? '1px solid #BBF7D0' : '1px solid #FDE68A' }}>
                  <Typography variant="caption" sx={{ color: isFeeCleared ? '#166534' : '#92400E', fontWeight: 700 }}>
                    Fee Clearance Status:
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900, color: isFeeCleared ? '#15803D' : '#B45309' }}>
                      {isFeeCleared ? '✓ 100% Fees Cleared' : `⛔ NPR ${dueBalance.toLocaleString()} Due`}
                    </Typography>
                    <Typography variant="caption" sx={{ color: isFeeCleared ? '#166534' : '#92400E' }}>
                      {isFeeCleared ? 'Cleared for Certificate & OJT' : 'Pending 2nd installment clearance'}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Box>

          {/* Official Signatures */}
          <Grid container spacing={3} sx={{ pt: 3, borderTop: '1px dashed #CBD5E1' }}>
            <Grid item xs={4} sx={{ textAlign: 'center' }}>
              <Typography variant="caption" sx={{ fontWeight: 800, display: 'block', color: '#0F172A' }}>
                Lead Technical Trainer
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B' }}>
                Signature &amp; Verification
              </Typography>
            </Grid>
            <Grid item xs={4} sx={{ textAlign: 'center' }}>
              <Typography variant="caption" sx={{ fontWeight: 800, display: 'block', color: '#0F172A' }}>
                OJT Enterprise Supervisor
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B' }}>
                Signature &amp; Corporate Seal
              </Typography>
            </Grid>
            <Grid item xs={4} sx={{ textAlign: 'center' }}>
              <Typography variant="caption" sx={{ fontWeight: 800, display: 'block', color: '#0F172A' }}>
                Principal / Managing Director
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B' }}>
                Official Institute Seal
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenPortfolioModal(false)} sx={{ fontWeight: 700 }}>
            Close
          </Button>
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={() => window.print()}
            sx={{ bgcolor: '#0F2C59', fontWeight: 800 }}
          >
            Print Dossier (A4)
          </Button>
        </DialogActions>
      </Dialog>

      {/* =======================================================
          OFFICIAL SYLLABUS & BROCHURE MODAL
          ======================================================= */}
      <Dialog
        open={openSyllabusModal}
        onClose={() => setOpenSyllabusModal(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3.5, p: { xs: 1.5, sm: 2.5 } } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900, color: '#0F2C59' }}>
              Official Course Curriculum &amp; Syllabus
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              {course?.title} • CTEVT 390-Hour National Vocational Standard
            </Typography>
          </Box>
          <Button
            size="small"
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={() => window.print()}
            sx={{ bgcolor: '#0F2C59', fontWeight: 800 }}
          >
            Print
          </Button>
        </DialogTitle>

        <DialogContent dividers sx={{ p: { xs: 2, sm: 3 } }}>
          {/* Ratio & Hours Banner */}
          <Box sx={{ p: 2, mb: 2.5, bgcolor: '#F0FDF4', borderRadius: 2.5, border: '1.5px solid #BBF7D0' }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={8}>
                <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#166534' }}>
                  80% Practical Hands-on Training Guarantee
                </Typography>
                <Typography variant="caption" sx={{ color: '#15803D', display: 'block' }}>
                  Total Duration: <b>390 Hours (3 Months)</b> • Includes free workshop consumables and tools.
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4} sx={{ textAlign: { sm: 'right' } }}>
                <Chip
                  label="CTEVT Level 1 Accredited"
                  sx={{ bgcolor: '#166534', color: '#FFFFFF', fontWeight: 800 }}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Daily Shift Options */}
          <Paper variant="outlined" sx={{ p: 2, mb: 2.5, borderRadius: 2, bgcolor: '#F8FAFC' }}>
            <Typography variant="caption" sx={{ fontWeight: 900, color: '#0F2C59', display: 'block', mb: 0.5 }}>
              FLEXIBLE DAILY 2-HOUR SHIFT SYSTEM:
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={6} sm={2.4}>
                <Typography variant="caption" sx={{ fontWeight: 700 }}>• Shift A: 7-9 AM</Typography>
              </Grid>
              <Grid item xs={6} sm={2.4}>
                <Typography variant="caption" sx={{ fontWeight: 700 }}>• Shift B: 10-12 PM</Typography>
              </Grid>
              <Grid item xs={6} sm={2.4}>
                <Typography variant="caption" sx={{ fontWeight: 700 }}>• Shift C: 12-2 PM</Typography>
              </Grid>
              <Grid item xs={6} sm={2.4}>
                <Typography variant="caption" sx={{ fontWeight: 700 }}>• Shift D: 2-4 PM</Typography>
              </Grid>
              <Grid item xs={6} sm={2.4}>
                <Typography variant="caption" sx={{ fontWeight: 700 }}>• Shift E: 4-6 PM</Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Units Table */}
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#0F2C59' }}>
                <TableRow>
                  <TableCell sx={{ color: '#FFFFFF', fontWeight: 900, width: 50, textAlign: 'center' }}>Unit</TableCell>
                  <TableCell sx={{ color: '#FFFFFF', fontWeight: 900 }}>Module Title</TableCell>
                  <TableCell sx={{ color: '#FFFFFF', fontWeight: 900, textAlign: 'center', width: 80 }}>Theory</TableCell>
                  <TableCell sx={{ color: '#FFFFFF', fontWeight: 900, textAlign: 'center', width: 80 }}>Practical</TableCell>
                  <TableCell sx={{ color: '#FFFFFF', fontWeight: 900, textAlign: 'center', width: 80 }}>Total</TableCell>
                  <TableCell sx={{ color: '#FFFFFF', fontWeight: 900 }}>Required Tools / Consumables</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {syllabusEvaluations.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell sx={{ textAlign: 'center', fontWeight: 800, color: '#0F2C59' }}>
                      0{u.unitNo}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                        {u.imageUrl && (
                          <Avatar
                            src={u.imageUrl}
                            variant="rounded"
                            sx={{ width: 38, height: 38, border: '1px solid #CBD5E1', flexShrink: 0 }}
                          />
                        )}
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                          {u.title}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>{u.theoryHours}h</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontWeight: 800, color: '#059669' }}>{u.practicalHours}h</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontWeight: 800 }}>{u.totalHours}h</TableCell>
                    <TableCell sx={{ fontSize: '0.78rem', color: '#475569' }}>
                      {u.toolsAndMaterials || 'Provided by Institute'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenSyllabusModal(false)} sx={{ fontWeight: 700 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
