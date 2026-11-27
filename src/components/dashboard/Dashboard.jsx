import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Grid,
  Card,
  Typography,
  Button,
  Chip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  IconButton,
  LinearProgress,
  Stack,
  Tooltip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Tabs,
  Tab,
  InputAdornment
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import BusinessIcon from '@mui/icons-material/Business';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import AssessmentIcon from '@mui/icons-material/Assessment';
import CampaignIcon from '@mui/icons-material/Campaign';
import ForumIcon from '@mui/icons-material/Forum';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import EventNoteIcon from '@mui/icons-material/EventNote';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SearchIcon from '@mui/icons-material/Search';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import AddIcon from '@mui/icons-material/Add';
import ShieldIcon from '@mui/icons-material/Shield';
import BoltIcon from '@mui/icons-material/Bolt';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ContactPhoneIcon from '@mui/icons-material/ContactPhone';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import { loadDB, saveDB } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
import { getWhatsAppUrl } from '../../services/exportUtils';
import { syncBiometricAttendance } from '../../services/biometricService';

export default function Dashboard({ onNavigate }) {
  const [db, setDb] = useState(loadDB());
  const { currentUser, isTrainer, isAdmin } = useAuth();

  useEffect(() => {
    const refreshDb = () => setDb(loadDB());
    window.addEventListener('kite_db_updated', refreshDb);
    window.addEventListener('storage', refreshDb);
    return () => {
      window.removeEventListener('kite_db_updated', refreshDb);
      window.removeEventListener('storage', refreshDb);
    };
  }, []);

  // 1. Live second-by-second ticking digital clock
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter groups if trainer
  const groups = useMemo(() => {
    return isTrainer
      ? (db.trainingGroups || []).filter((g) => g.trainerId === currentUser?.trainerId)
      : db.trainingGroups || [];
  }, [db.trainingGroups, isTrainer, currentUser]);

  const students = useMemo(() => {
    return isTrainer
      ? (db.students || []).filter((s) => groups.some((g) => g.id === s.groupId))
      : db.students || [];
  }, [db.students, groups, isTrainer]);

  const totalStudents = students.length;
  const femaleCount = students.filter((s) => (s.gender || '').toLowerCase() === 'female').length;
  const femalePct = totalStudents > 0 ? Math.round((femaleCount / totalStudents) * 100) : 0;
  const activeGroups = groups.filter((g) => g.status === 'Running').length;

  // Calculate attendance rate
  const totalAttendances = (db.attendances || []).length;
  const presentCount = (db.attendances || []).filter((a) => a.status === 'present').length;
  const overallAttRate = totalAttendances > 0 ? Math.round((presentCount / totalAttendances) * 100) : 0;

  // Placements count
  const placedCount = (db.placements || []).filter((p) => p.status === 'Placed' || p.status === 'Ongoing').length;
  const employerCount = (db.employers || []).length;

  // At-Risk Students (<80% attendance)
  const atRiskStudents = useMemo(() => {
    return students.filter((s) => {
      const atts = (db.attendances || []).filter((a) => a.studentId === s.id);
      if (atts.length === 0) return false;
      const pres = atts.filter((a) => a.status === 'present').length;
      const rate = Math.round((pres / atts.length) * 100);
      return rate < 80;
    });
  }, [students, db.attendances]);

  // Current active shift calculation
  const currentHour = currentTime.getHours();
  let activeShiftCode = 'B';
  let activeShiftTime = '10:00 AM – 12:00 PM';
  if (currentHour < 10) {
    activeShiftCode = 'A';
    activeShiftTime = '07:00 AM – 09:00 AM';
  } else if (currentHour >= 12 && currentHour < 14) {
    activeShiftCode = 'C';
    activeShiftTime = '12:00 PM – 02:00 PM';
  } else if (currentHour >= 14 && currentHour < 16) {
    activeShiftCode = 'D';
    activeShiftTime = '02:00 PM – 04:00 PM';
  } else if (currentHour >= 16) {
    activeShiftCode = 'E';
    activeShiftTime = '04:00 PM – 06:00 PM';
  }

  // Interactive Batches Filter & Search
  const [shiftFilter, setShiftFilter] = useState('ALL');
  const [searchBatch, setSearchBatch] = useState('');

  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      const course = (db.courses || []).find((c) => c.id === g.courseId);
      const trainer = (db.trainers || []).find((t) => t.id === g.trainerId);
      const matchesShift = shiftFilter === 'ALL' || g.shift === shiftFilter;
      const q = searchBatch.toLowerCase();
      const matchesSearch =
        !q ||
        (g.groupCode || '').toLowerCase().includes(q) ||
        (course?.title || '').toLowerCase().includes(q) ||
        (trainer?.name || '').toLowerCase().includes(q);
      return matchesShift && matchesSearch;
    });
  }, [groups, shiftFilter, searchBatch, db.courses, db.trainers]);

  // Interactive Batch Details Modal
  const [selectedBatchDetails, setSelectedBatchDetails] = useState(null);

  // Quick Notice Modal State
  const [openAddNoticeModal, setOpenAddNoticeModal] = useState(false);
  const [newNoticeData, setNewNoticeData] = useState({
    title: '',
    content: '',
    priority: 'Normal'
  });

  const handleCreateNotice = () => {
    if (!newNoticeData.title.trim() || !newNoticeData.content.trim()) {
      alert('Please enter both the notice title and content.');
      return;
    }
    const createdNotice = {
      id: `NOT-${Date.now()}`,
      title: newNoticeData.title.trim(),
      content: newNoticeData.content.trim(),
      priority: newNoticeData.priority,
      publishDate: new Date().toISOString().slice(0, 10),
      status: 'Active'
    };
    const nextDb = {
      ...db,
      notices: [createdNotice, ...(db.notices || [])]
    };
    saveDB(nextDb);
    setDb(nextDb);
    setOpenAddNoticeModal(false);
    setNewNoticeData({ title: '', content: '', priority: 'Normal' });
  };

  const workflowSteps = [
    { id: 'occupations', step: '01', title: 'Occupations', sub: 'Sector Setup', icon: '🛠️' },
    { id: 'courses', step: '02', title: 'Courses', sub: 'Curriculum', icon: '📚' },
    { id: 'syllabus', step: '03', title: 'Syllabus', sub: 'Course Units', icon: '📝' },
    { id: 'workplan', step: '04', title: 'Work Plan', sub: 'Schedule', icon: '🗓️' },
    { id: 'lessonplan', step: '05', title: 'Lesson Plan', sub: 'Session Prep', icon: '📑' },
    { id: 'attendance', step: '06', title: 'Attendance', sub: 'Daily Roll Call', icon: '✅', highlight: true },
    { id: 'logbook', step: '07', title: 'Log Book', sub: 'Delivery Log', icon: '📖' },
    { id: 'evaluations', step: '08', title: 'Evaluations', sub: 'Skill Matrix', icon: '🎯' },
    { id: 'ojt', step: '09', title: 'OJT & Jobs', sub: 'Industry Internship', icon: '🏢' },
    { id: 'certificates', step: '10', title: 'Certificate', sub: 'CTEVT Certificate', icon: '🏆', highlight: true }
  ];

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2.2 }, pb: 4 }}>
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
          <Grid item xs={12} md={5}>
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
                <ShieldIcon sx={{ fontSize: 20, color: '#fbbf24' }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="subtitle1"
                  noWrap
                  sx={{ fontWeight: 800, color: '#ffffff', fontSize: { xs: '0.96rem', sm: '1.06rem' }, lineHeight: 1.2 }}
                >
                  Welcome, {currentUser?.name}! • Prabidhik School, Jorpati
                </Typography>
                <Typography
                  variant="caption"
                  noWrap
                  sx={{ color: '#cbd5e1', display: 'block', fontSize: '0.73rem', mt: 0.15 }}
                >
                  {isTrainer
                    ? 'Manage daily attendance for your training batches, lesson plans & competency evaluations'
                    : `CTEVT Accredited TVET ERP • Shift ${activeShiftCode} Live (${activeShiftTime}) • ${currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`}
                </Typography>
              </Box>
            </Stack>
          </Grid>

          <Grid item xs={12} md={7} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Stack direction="row" spacing={0.8} justifyContent={{ xs: 'flex-start', md: 'flex-end' }} flexWrap="wrap" useFlexGap>
              <Button
                variant="contained"
                size="small"
                onClick={() => onNavigate('attendance')}
                startIcon={<FactCheckIcon sx={{ fontSize: '15px !important' }} />}
                sx={{
                  bgcolor: '#059669 !important',
                  color: '#FFFFFF !important',
                  fontWeight: 800,
                  fontSize: '0.76rem',
                  py: 0.65,
                  px: 1.4,
                  borderRadius: 1.8,
                  whiteSpace: 'nowrap',
                  boxShadow: 'none',
                  '&:hover': { bgcolor: '#047857 !important' }
                }}
              >
                Take Attendance
              </Button>

              <Button
                variant="outlined"
                size="small"
                onClick={() => onNavigate('lessonplan')}
                startIcon={<AssignmentIcon sx={{ fontSize: '15px !important', color: '#93C5FD' }} />}
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.3) !important',
                  color: '#F8FAFC !important',
                  fontWeight: 700,
                  fontSize: '0.76rem',
                  py: 0.65,
                  px: 1.4,
                  borderRadius: 1.8,
                  whiteSpace: 'nowrap',
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  '&:hover': { borderColor: '#ffffff !important', bgcolor: 'rgba(255, 255, 255, 0.2)' }
                }}
              >
                Lesson Plan
              </Button>

              <Button
                variant="outlined"
                size="small"
                onClick={() => onNavigate('leads')}
                startIcon={<ContactPhoneIcon sx={{ fontSize: '15px !important', color: '#7DD3FC' }} />}
                sx={{
                  borderColor: 'rgba(125, 211, 252, 0.35) !important',
                  color: '#F8FAFC !important',
                  fontWeight: 700,
                  fontSize: '0.76rem',
                  py: 0.65,
                  px: 1.4,
                  borderRadius: 1.8,
                  whiteSpace: 'nowrap',
                  bgcolor: 'rgba(30, 64, 175, 0.28)',
                  '&:hover': { borderColor: '#7DD3FC !important', bgcolor: 'rgba(30, 64, 175, 0.45)' }
                }}
              >
                Inquiry CRM ({db.leads?.length || 0})
              </Button>

              <Button
                variant="outlined"
                size="small"
                onClick={() => onNavigate('students')}
                startIcon={<PersonAddAlt1Icon sx={{ fontSize: '15px !important', color: '#E2E8F0' }} />}
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.3) !important',
                  color: '#F8FAFC !important',
                  fontWeight: 700,
                  fontSize: '0.76rem',
                  py: 0.65,
                  px: 1.4,
                  borderRadius: 1.8,
                  whiteSpace: 'nowrap',
                  bgcolor: 'rgba(255, 255, 255, 0.08)',
                  '&:hover': { borderColor: '#ffffff !important', bgcolor: 'rgba(255, 255, 255, 0.18)' }
                }}
              >
                Add Student
              </Button>

              <Button
                variant="outlined"
                size="small"
                onClick={() => onNavigate('certificates')}
                startIcon={<WorkspacePremiumIcon sx={{ fontSize: '15px !important', color: '#FBBF24' }} />}
                sx={{
                  borderColor: 'rgba(251, 191, 36, 0.45) !important',
                  color: '#FEF3C7 !important',
                  fontWeight: 800,
                  fontSize: '0.76rem',
                  py: 0.65,
                  px: 1.4,
                  borderRadius: 1.8,
                  whiteSpace: 'nowrap',
                  bgcolor: 'rgba(245, 158, 11, 0.16)',
                  '&:hover': { borderColor: '#FBBF24 !important', bgcolor: 'rgba(245, 158, 11, 0.26)' }
                }}
              >
                Certificates (A4)
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Card>

      {/* 2. OPERATIONAL DELIVERY CHAIN - Compact Stepped Workflow Track */}
      <Card
        elevation={0}
        sx={{
          p: 1.5,
          mb: 1.75,
          bgcolor: '#FFFFFF',
          borderRadius: 2,
          border: '1px solid #E2E8F0'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.2, flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
            <BoltIcon sx={{ color: '#D97706', fontSize: 18 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F2C59', fontSize: '0.82rem', letterSpacing: '0.02em' }}>
              TVET OPERATIONAL WORKFLOW CHAIN
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.7rem' }}>
            All 10 stages are interconnected • Click any stage to open directly
          </Typography>
        </Box>

        <Grid container spacing={1}>
          {workflowSteps.map((step) => (
            <Grid item xs={6} sm={4} md={2.4} key={step.id}>
              <Paper
                elevation={0}
                onClick={() => onNavigate(step.id)}
                sx={{
                  p: 1,
                  borderRadius: 1.8,
                  bgcolor: step.highlight ? '#EFF6FF' : '#F8FAFC',
                  border: step.highlight ? '1px solid #93C5FD' : '1px solid #E2E8F0',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  '&:hover': {
                    bgcolor: '#FFFFFF',
                    borderColor: '#2563EB',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.1)'
                  }
                }}
              >
                <Avatar
                  sx={{
                    width: 30,
                    height: 30,
                    bgcolor: step.highlight ? '#1D4ED8' : '#FFFFFF',
                    color: step.highlight ? '#FFFFFF' : '#0F2C59',
                    fontSize: '0.85rem',
                    border: '1px solid #E2E8F0'
                  }}
                >
                  {step.icon}
                </Avatar>
                <Box sx={{ overflow: 'hidden', minWidth: 0 }}>
                  <Typography variant="caption" noWrap sx={{ color: '#64748B', fontWeight: 800, fontSize: '0.6rem', display: 'block', lineHeight: 1.1 }}>
                    STEP {step.step}
                  </Typography>
                  <Typography variant="subtitle2" noWrap sx={{ fontWeight: 800, color: '#0F2C59', fontSize: '0.76rem', lineHeight: 1.2 }}>
                    {step.title}
                  </Typography>
                  <Typography variant="caption" noWrap sx={{ color: '#64748B', fontSize: '0.64rem', fontWeight: 600, display: 'block', lineHeight: 1.1 }}>
                    {step.sub}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Card>

      {/* 3. 4 COMPACT SINGLE-ROW KPI CARDS */}
      <Grid container spacing={1.5} sx={{ mb: 1.75 }}>
        {/* Trainees Card */}
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
                  {totalStudents}
                </Typography>
                <Typography variant="caption" noWrap sx={{ color: '#1d4ed8', fontWeight: 600, fontSize: '0.68rem', display: 'block' }}>
                  Female {femalePct}% ({femaleCount}/{totalStudents})
                </Typography>
              </Box>
              <Box sx={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#eff6ff', borderRadius: 1.5, color: '#1e40af', flexShrink: 0 }}>
                <SchoolIcon sx={{ fontSize: 18 }} />
              </Box>
            </Stack>
          </Card>
        </Grid>

        {/* Active Batches Card */}
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
                  Active Batches
                </Typography>
                <Typography sx={{ fontWeight: 800, color: '#059669', fontSize: '1.22rem', lineHeight: 1.2, mt: 0.2 }}>
                  {groups.length}
                </Typography>
                <Typography variant="caption" noWrap sx={{ color: '#059669', fontWeight: 600, fontSize: '0.68rem', display: 'block' }}>
                  {activeGroups || groups.length} Running • Shift {activeShiftCode} Live
                </Typography>
              </Box>
              <Box sx={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#ecfdf5', borderRadius: 1.5, color: '#059669', flexShrink: 0 }}>
                <GroupWorkIcon sx={{ fontSize: 18 }} />
              </Box>
            </Stack>
          </Card>
        </Grid>

        {/* Attendance Rate Card */}
        <Grid item xs={6} md={3}>
          <Card
            elevation={0}
            sx={{
              p: 1.4,
              borderRadius: 2,
              border: '1px solid #e2e8f0',
              borderLeft: `3.5px solid ${overallAttRate >= 80 ? '#059669' : '#d97706'}`,
              bgcolor: '#ffffff'
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" noWrap sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontSize: '0.66rem', letterSpacing: '0.03em', display: 'block' }}>
                  TVET Attendance
                </Typography>
                <Typography sx={{ fontWeight: 800, color: overallAttRate >= 80 ? '#059669' : '#d97706', fontSize: '1.22rem', lineHeight: 1.2, mt: 0.2 }}>
                  {overallAttRate}%
                </Typography>
                <Typography variant="caption" noWrap sx={{ color: overallAttRate >= 80 ? '#059669' : '#d97706', fontWeight: 600, fontSize: '0.68rem', display: 'block' }}>
                  {atRiskStudents.length === 0 ? 'CTEVT Compliant (≥80%)' : `${atRiskStudents.length} Needs Attention`}
                </Typography>
              </Box>
              <Box sx={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: overallAttRate >= 80 ? '#ecfdf5' : '#fffbeb', borderRadius: 1.5, color: overallAttRate >= 80 ? '#059669' : '#d97706', flexShrink: 0 }}>
                <FactCheckIcon sx={{ fontSize: 18 }} />
              </Box>
            </Stack>
          </Card>
        </Grid>

        {/* Placement Rate Card */}
        <Grid item xs={6} md={3}>
          <Card
            elevation={0}
            sx={{
              p: 1.4,
              borderRadius: 2,
              border: '1px solid #e2e8f0',
              borderLeft: '3.5px solid #7c3aed',
              bgcolor: '#ffffff'
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" noWrap sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontSize: '0.66rem', letterSpacing: '0.03em', display: 'block' }}>
                  OJT &amp; Placements
                </Typography>
                <Typography sx={{ fontWeight: 800, color: '#7c3aed', fontSize: '1.22rem', lineHeight: 1.2, mt: 0.2 }}>
                  {totalStudents > 0 ? `${Math.round((placedCount / totalStudents) * 100)}%` : '0%'}
                </Typography>
                <Typography variant="caption" noWrap sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.68rem', display: 'block' }}>
                  {placedCount} Placed • {employerCount} Employers
                </Typography>
              </Box>
              <Box sx={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f3ff', borderRadius: 1.5, color: '#7c3aed', flexShrink: 0 }}>
                <RocketLaunchIcon sx={{ fontSize: 18 }} />
              </Box>
            </Stack>
          </Card>
        </Grid>
      </Grid>

      {/* 4. Dropout Risk Warning Alert Banner */}
      {atRiskStudents.length > 0 && (
        <Alert
          severity="warning"
          icon={<WarningAmberIcon fontSize="small" />}
          sx={{
            mb: 1.75,
            py: 0.5,
            borderRadius: 2,
            border: '1px solid #FDE68A',
            bgcolor: '#FFFBEB',
            alignItems: 'center'
          }}
          action={
            <Button
              color="warning"
              variant="contained"
              size="small"
              onClick={() => onNavigate('attendance')}
              sx={{
                fontWeight: 800,
                bgcolor: '#D97706',
                color: '#FFFFFF',
                borderRadius: 1.5,
                fontSize: '0.74rem',
                px: 1.4,
                py: 0.4,
                whiteSpace: 'nowrap',
                '&:hover': { bgcolor: '#B45309' }
              }}
            >
              Open Attendance Register
            </Button>
          }
        >
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#92400E', fontSize: '0.78rem' }}>
            <b>Dropout Early Warning: {atRiskStudents[0]?.name}</b> has attendance below 80% (minimum mandatory for CTEVT exams).
          </Typography>
        </Alert>
      )}

      {/* 4.5 REAL-TIME LIVE ATTENDANCE COMMAND CARD */}
      <Card
        elevation={0}
        sx={{
          mb: 1.75,
          p: 1.5,
          borderRadius: 2,
          bgcolor: '#FFFFFF',
          border: '1px solid #BBF7D0'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.25, flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ bgcolor: '#DCFCE7', color: '#15803D', width: 32, height: 32, borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #86EFAC' }}>
              <FingerprintIcon sx={{ fontSize: 18 }} />
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexWrap: 'wrap' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F2C59', fontSize: '0.86rem' }}>
                  Real-Time Live Attendance Hub
                </Typography>
                <Chip
                  label="WiFi ZKTeco K40 (Online)"
                  size="small"
                  sx={{ height: 19, bgcolor: '#DCFCE7', color: '#15803D', fontWeight: 800, fontSize: '0.66rem' }}
                />
              </Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.7rem' }}>
                Instant biometric thumb &amp; RFID scans • Last Sync: {db.settings?.biometricSettings?.lastSyncTime || 'Standby'}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<FingerprintIcon sx={{ fontSize: '15px !important' }} />}
              onClick={() => {
                const today = new Date().toISOString().slice(0, 10);
                const res = syncBiometricAttendance(today);
                setDb(loadDB());
                alert(`Biometric Sync Complete! (${res.syncedCount} new logs updated)`);
              }}
              sx={{ fontWeight: 700, color: '#15803D', borderColor: '#86EFAC', borderRadius: 1.8, fontSize: '0.75rem', px: 1.2, py: 0.5, whiteSpace: 'nowrap' }}
            >
              Sync Machine
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={() => onNavigate('live_attendance')}
              endIcon={<ArrowForwardIcon sx={{ fontSize: '15px !important' }} />}
              sx={{ fontWeight: 800, bgcolor: '#0F2E5A', '&:hover': { bgcolor: '#0B2545' }, borderRadius: 1.8, fontSize: '0.75rem', px: 1.4, py: 0.5, whiteSpace: 'nowrap' }}
            >
              Open Live Monitor
            </Button>
          </Box>
        </Box>

        {/* 4 Latest Punches Ticker Grid */}
        <Grid container spacing={1}>
          {(db.biometricLogs || []).slice(0, 4).map((log, idx) => (
            <Grid item xs={12} sm={6} md={3} key={log.id || idx}>
              <Paper
                variant="outlined"
                sx={{
                  p: 1,
                  borderRadius: 1.8,
                  bgcolor: '#F8FAFC',
                  borderColor: '#E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <Avatar sx={{ bgcolor: log.role === 'STUDENT' ? '#DCFCE7' : '#FEF3C7', color: log.role === 'STUDENT' ? '#15803D' : '#92400E', width: 30, height: 30, fontWeight: 800, fontSize: '0.78rem' }}>
                  {log.name?.[0] || 'U'}
                </Avatar>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="subtitle2" noWrap sx={{ fontWeight: 800, color: '#0F172A', fontSize: '0.78rem' }}>
                    {log.name}
                  </Typography>
                  <Typography variant="caption" noWrap sx={{ color: '#0F2E5A', fontWeight: 700, fontSize: '0.66rem', display: 'block' }}>
                    {log.timestamp} • #{log.biometricId}
                  </Typography>
                </Box>
                <Chip
                  label="Verified"
                  size="small"
                  sx={{ height: 18, fontSize: '0.62rem', fontWeight: 800, bgcolor: '#DCFCE7', color: '#15803D' }}
                />
              </Paper>
            </Grid>
          ))}
          {(db.biometricLogs || []).length === 0 && (
            <Grid item xs={12}>
              <Typography variant="caption" sx={{ color: '#94A3B8', textAlign: 'center', display: 'block', py: 0.5 }}>
                No biometric or RFID scans recorded today yet.
              </Typography>
            </Grid>
          )}
        </Grid>
      </Card>

      {/* 5. Schedule & Batches Table + Notices */}
      <Grid container spacing={1.75}>
        {/* Active Batches Workspace */}
        <Grid item xs={12} lg={8}>
          <Card elevation={0} sx={{ p: 1.75, borderRadius: 2, height: '100%', bgcolor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.25, flexWrap: 'wrap', gap: 1 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F2C59', fontSize: '0.92rem' }}>
                  Active Training Batches
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.7rem' }}>
                  Daily shifts, assigned trainers, and trainee enrollment details
                </Typography>
              </Box>
              <Button
                variant="outlined"
                size="small"
                onClick={() => onNavigate('groups')}
                endIcon={<ArrowForwardIcon sx={{ fontSize: '14px !important' }} />}
                sx={{ fontWeight: 800, fontSize: '0.74rem', px: 1.2, py: 0.4, whiteSpace: 'nowrap' }}
              >
                All Batches ({groups.length})
              </Button>
            </Box>

            {/* Shift Filter Tabs & Search Bar */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.25, flexWrap: 'wrap', gap: 1 }}>
              <Tabs
                value={shiftFilter}
                onChange={(_, val) => setShiftFilter(val)}
                sx={{
                  minHeight: 32,
                  '& .MuiTab-root': {
                    minHeight: 32,
                    py: 0.4,
                    px: 1.2,
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    textTransform: 'none'
                  }
                }}
              >
                <Tab value="ALL" label="All Shifts" />
                <Tab value="A" label="Shift A (07-09)" />
                <Tab value="B" label="Shift B (10-12)" />
                <Tab value="C" label="Shift C (12-02)" />
                <Tab value="D" label="Shift D (02-04)" />
                <Tab value="E" label="Shift E (04-06)" />
              </Tabs>

              <TextField
                size="small"
                placeholder="Search batch or trainer..."
                value={searchBatch}
                onChange={(e) => setSearchBatch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: '#94A3B8', fontSize: 16 }} />
                    </InputAdornment>
                  ),
                  sx: { height: 32, fontSize: '0.76rem', borderRadius: 1.5 }
                }}
              />
            </Box>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2 }}>
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
                    <TableCell>Batch Code</TableCell>
                    <TableCell>Course</TableCell>
                    <TableCell>Shift &amp; Time</TableCell>
                    <TableCell>Trainer</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredGroups.slice(0, 6).map((grp) => {
                    const course = (db.courses || []).find((c) => c.id === grp.courseId);
                    const trainer = (db.trainers || []).find((t) => t.id === grp.trainerId);
                    const isShiftLive = grp.shift === activeShiftCode;
                    const batchStudents = (db.students || []).filter((s) => s.groupId === grp.id);

                    return (
                      <TableRow
                        key={grp.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => setSelectedBatchDetails({ ...grp, course, trainer, students: batchStudents })}
                      >
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                            <Chip
                              label={grp.groupCode}
                              size="small"
                              sx={{ height: 20, fontWeight: 800, bgcolor: '#0F2C59', color: '#fff', fontSize: '0.69rem' }}
                            />
                            {isShiftLive && (
                              <Chip
                                label="Live Now"
                                size="small"
                                sx={{
                                  height: 18,
                                  fontSize: '0.62rem',
                                  fontWeight: 800,
                                  bgcolor: '#DCFCE7',
                                  color: '#15803D'
                                }}
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.79rem', lineHeight: 1.2 }}>
                            {course?.title || 'Vocational Training'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.68rem' }}>
                            {course?.durationValue || 3} Months • {batchStudents.length} Trainees
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          <Typography sx={{ fontWeight: 700, color: '#1D4ED8', fontSize: '0.78rem' }}>
                            Shift {grp.shift}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.68rem' }}>
                            {grp.startTime} – {grp.endTime}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontWeight: 700, fontSize: '0.78rem' }}>
                            {trainer?.name || 'Assigned Instructor'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.68rem' }}>
                            {trainer?.phone || ''}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" onClick={(e) => e.stopPropagation()} sx={{ whiteSpace: 'nowrap' }}>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => onNavigate('attendance')}
                            sx={{
                              bgcolor: '#0F2C59',
                              fontWeight: 800,
                              fontSize: '0.7rem',
                              py: 0.3,
                              px: 0.9,
                              minWidth: 0,
                              whiteSpace: 'nowrap',
                              borderRadius: 1.5
                            }}
                          >
                            Attendance
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredGroups.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 3, color: '#64748B', fontSize: '0.8rem' }}>
                        No training batches found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>

        {/* Notices & Quick Hub */}
        <Grid item xs={12} lg={4}>
          <Card elevation={0} sx={{ p: 1.75, borderRadius: 2, height: '100%', bgcolor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.25 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <CampaignIcon sx={{ color: '#D97706', fontSize: 20 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F2C59', fontSize: '0.92rem' }}>
                  Notice Board
                </Typography>
              </Box>
              <Button
                size="small"
                startIcon={<AddIcon sx={{ fontSize: '14px !important' }} />}
                onClick={() => setOpenAddNoticeModal(true)}
                sx={{ fontWeight: 800, fontSize: '0.73rem', px: 1, py: 0.3, whiteSpace: 'nowrap' }}
              >
                New Notice
              </Button>
            </Box>

            <Stack spacing={1.25}>
              {(db.notices || []).slice(0, 3).map((notice) => (
                <Paper
                  key={notice.id}
                  variant="outlined"
                  sx={{
                    p: 1.25,
                    borderRadius: 2,
                    borderColor: notice.priority === 'Urgent' ? '#FCA5A5' : '#E2E8F0',
                    bgcolor: notice.priority === 'Urgent' ? '#FEF2F2' : '#F8FAFC'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.3 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '0.8rem' }}>
                      {notice.title}
                    </Typography>
                    <Chip
                      label={notice.priority}
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        bgcolor: notice.priority === 'Urgent' ? '#FEE2E2' : '#EFF6FF',
                        color: notice.priority === 'Urgent' ? '#DC2626' : '#1D4ED8'
                      }}
                    />
                  </Box>
                  <Typography variant="caption" sx={{ color: '#475569', display: 'block', mb: 0.5, fontSize: '0.72rem' }}>
                    {notice.content}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.66rem', fontWeight: 600 }}>
                    Published: {notice.publishDate}
                  </Typography>
                </Paper>
              ))}
            </Stack>

            <Divider sx={{ my: 1.75 }} />

            <Box sx={{ bgcolor: '#EFF6FF', p: 1.4, borderRadius: 2, border: '1px solid #BFDBFE' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1E40AF', mb: 0.3, fontSize: '0.78rem' }}>
                CTEVT Standard Training Delivery
              </Typography>
              <Typography variant="caption" sx={{ color: '#3B82F6', display: 'block', fontSize: '0.7rem' }}>
                Complete the Work Plan, Lesson Plan, Daily Attendance, and Competency Evaluations for each batch before issuing official certificates.
              </Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Interactive Batch Quick Details Modal */}
      {selectedBatchDetails && (
        <Dialog open={Boolean(selectedBatchDetails)} onClose={() => setSelectedBatchDetails(null)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 900, bgcolor: '#0F2C59', color: '#fff' }}>
            Batch Details: {selectedBatchDetails.groupCode} ({selectedBatchDetails.course?.title})
          </DialogTitle>
          <DialogContent sx={{ pt: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', bgcolor: '#F8FAFC', p: 2, borderRadius: 2, mb: 2, mt: 1 }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748B' }}>Shift & Time:</Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Shift {selectedBatchDetails.shift} ({selectedBatchDetails.startTime} - {selectedBatchDetails.endTime})</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748B' }}>Trainer:</Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{selectedBatchDetails.trainer?.name}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748B' }}>Enrolled Trainees:</Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#059669' }}>{selectedBatchDetails.students?.length} Trainees</Typography>
              </Box>
            </Box>

            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
              Enrolled Trainees in this Batch:
            </Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 220, borderRadius: 2 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Phone</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(selectedBatchDetails.students || []).map((s) => (
                    <TableRow key={s.id}>
                      <TableCell sx={{ fontWeight: 700 }}>{s.name}</TableCell>
                      <TableCell>{s.phone}</TableCell>
                      <TableCell>
                        <Chip size="small" label={s.status} sx={{ height: 20, fontSize: '0.68rem', fontWeight: 800 }} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setSelectedBatchDetails(null)}>Close</Button>
            <Button
              variant="contained"
              onClick={() => {
                setSelectedBatchDetails(null);
                onNavigate('attendance');
              }}
              sx={{ fontWeight: 800, bgcolor: '#0F2C59' }}
            >
              Take Batch Attendance
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Add Notice Modal */}
      <Dialog open={openAddNoticeModal} onClose={() => setOpenAddNoticeModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 900 }}>Publish New Notice</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Notice Title"
              fullWidth
              required
              value={newNoticeData.title}
              onChange={(e) => setNewNoticeData({ ...newNoticeData, title: e.target.value })}
            />
            <TextField
              label="Notice Content"
              fullWidth
              required
              multiline
              rows={3}
              value={newNoticeData.content}
              onChange={(e) => setNewNoticeData({ ...newNoticeData, content: e.target.value })}
            />
            <TextField
              select
              label="Priority"
              fullWidth
              value={newNoticeData.priority}
              onChange={(e) => setNewNoticeData({ ...newNoticeData, priority: e.target.value })}
            >
              <MenuItem value="Normal">Normal</MenuItem>
              <MenuItem value="Important">Important</MenuItem>
              <MenuItem value="Urgent">Urgent</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenAddNoticeModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateNotice} sx={{ fontWeight: 800 }}>
            Publish Notice
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
