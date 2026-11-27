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
import CategoryIcon from '@mui/icons-material/Category';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import WorkIcon from '@mui/icons-material/Work';
import DescriptionIcon from '@mui/icons-material/Description';
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
    { id: 'occupations', step: '01', title: 'Occupations', sub: 'Sector setup', icon: <CategoryIcon sx={{ fontSize: 16 }} /> },
    { id: 'courses', step: '02', title: 'Courses', sub: 'Curriculum', icon: <MenuBookIcon sx={{ fontSize: 16 }} /> },
    { id: 'syllabus', step: '03', title: 'Syllabus', sub: 'Course units', icon: <FormatListBulletedIcon sx={{ fontSize: 16 }} /> },
    { id: 'workplan', step: '04', title: 'Work Plan', sub: 'Schedule', icon: <EventNoteIcon sx={{ fontSize: 16 }} /> },
    { id: 'lessonplan', step: '05', title: 'Lesson Plan', sub: 'Session prep', icon: <AssignmentIcon sx={{ fontSize: 16 }} /> },
    { id: 'attendance', step: '06', title: 'Attendance', sub: 'Daily roll call', icon: <FactCheckIcon sx={{ fontSize: 16 }} /> },
    { id: 'logbook', step: '07', title: 'Log Book', sub: 'Delivery log', icon: <DescriptionIcon sx={{ fontSize: 16 }} /> },
    { id: 'evaluations', step: '08', title: 'Evaluations', sub: 'Skill matrix', icon: <AssessmentIcon sx={{ fontSize: 16 }} /> },
    { id: 'ojt', step: '09', title: 'OJT & Jobs', sub: 'Internship', icon: <WorkIcon sx={{ fontSize: 16 }} /> },
    { id: 'certificates', step: '10', title: 'Certificates', sub: 'CTEVT A4', icon: <WorkspacePremiumIcon sx={{ fontSize: 16 }} /> }
  ];

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1520, mx: 'auto', pb: 5 }}>
      {/* 1. Clean Institutional Page Header */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'flex-start', md: 'center' },
          justifyContent: 'space-between',
          gap: 2,
          mb: 3
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 600,
              color: '#111827',
              fontSize: { xs: '1.25rem', sm: '1.5rem' },
              lineHeight: 1.2,
              letterSpacing: '-0.02em'
            }}
          >
            Operations overview
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: '#6B7487',
              fontSize: '0.8125rem',
              mt: 0.5,
              fontVariantNumeric: 'tabular-nums'
            }}
          >
            {isTrainer
              ? `${currentUser?.name || 'Trainer'} · Daily attendance, lesson plans and competency records`
              : `Prabidhik School, Jorpati · Shift ${activeShiftCode} (${activeShiftTime}) · ${currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button
            variant="contained"
            size="small"
            onClick={() => onNavigate('attendance')}
            startIcon={<FactCheckIcon sx={{ fontSize: '16px !important' }} />}
            sx={{
              bgcolor: '#0F2C59',
              color: '#FFFFFF',
              fontWeight: 500,
              fontSize: '0.8125rem',
              height: 36,
              px: 2,
              borderRadius: '8px',
              '&:hover': { bgcolor: '#163A70' }
            }}
          >
            Take attendance
          </Button>

          <Button
            variant="outlined"
            size="small"
            onClick={() => onNavigate('leads')}
            startIcon={<ContactPhoneIcon sx={{ fontSize: '16px !important', color: '#4B5565' }} />}
            sx={{
              borderColor: '#E5E7EB',
              color: '#111827',
              bgcolor: '#FFFFFF',
              fontWeight: 500,
              fontSize: '0.8125rem',
              height: 36,
              px: 1.75,
              borderRadius: '8px',
              '&:hover': { borderColor: '#D1D5DB', bgcolor: '#F7F8FA' }
            }}
          >
            Leads ({db.leads?.length || 0})
          </Button>

          <Button
            variant="outlined"
            size="small"
            onClick={() => onNavigate('students')}
            startIcon={<PersonAddAlt1Icon sx={{ fontSize: '16px !important', color: '#4B5565' }} />}
            sx={{
              borderColor: '#E5E7EB',
              color: '#111827',
              bgcolor: '#FFFFFF',
              fontWeight: 500,
              fontSize: '0.8125rem',
              height: 36,
              px: 1.75,
              borderRadius: '8px',
              '&:hover': { borderColor: '#D1D5DB', bgcolor: '#F7F8FA' }
            }}
          >
            Add student
          </Button>

          <Button
            variant="outlined"
            size="small"
            onClick={() => onNavigate('certificates')}
            startIcon={<WorkspacePremiumIcon sx={{ fontSize: '16px !important', color: '#4B5565' }} />}
            sx={{
              borderColor: '#E5E7EB',
              color: '#111827',
              bgcolor: '#FFFFFF',
              fontWeight: 500,
              fontSize: '0.8125rem',
              height: 36,
              px: 1.75,
              borderRadius: '8px',
              '&:hover': { borderColor: '#D1D5DB', bgcolor: '#F7F8FA' }
            }}
          >
            Certificates
          </Button>
        </Stack>
      </Box>

      {/* 2. 4 Compact Single-Row KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Trainees Card */}
        <Grid item xs={6} md={3}>
          <Card
            elevation={0}
            sx={{
              p: 2,
              borderRadius: '12px',
              border: '1px solid #E5E7EB',
              bgcolor: '#FFFFFF',
              height: '100%'
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" noWrap sx={{ fontWeight: 500, color: '#6B7487', fontSize: '0.75rem', display: 'block' }}>
                  Total trainees
                </Typography>
                <Typography sx={{ fontWeight: 600, color: '#111827', fontSize: '1.625rem', lineHeight: 1.15, mt: 0.75, fontVariantNumeric: 'tabular-nums' }}>
                  {totalStudents}
                </Typography>
                <Typography variant="caption" noWrap sx={{ color: '#6B7487', fontWeight: 400, fontSize: '0.75rem', display: 'block', mt: 0.5 }}>
                  {femaleCount} female ({femalePct}%)
                </Typography>
              </Box>
              <Box sx={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#F7F8FA', borderRadius: '8px', color: '#4B5565', border: '1px solid #E5E7EB', flexShrink: 0 }}>
                <SchoolIcon sx={{ fontSize: 17 }} />
              </Box>
            </Stack>
          </Card>
        </Grid>

        {/* Active Batches Card */}
        <Grid item xs={6} md={3}>
          <Card
            elevation={0}
            sx={{
              p: 2,
              borderRadius: '12px',
              border: '1px solid #E5E7EB',
              bgcolor: '#FFFFFF',
              height: '100%'
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" noWrap sx={{ fontWeight: 500, color: '#6B7487', fontSize: '0.75rem', display: 'block' }}>
                  Active batches
                </Typography>
                <Typography sx={{ fontWeight: 600, color: '#111827', fontSize: '1.625rem', lineHeight: 1.15, mt: 0.75, fontVariantNumeric: 'tabular-nums' }}>
                  {groups.length}
                </Typography>
                <Typography variant="caption" noWrap sx={{ color: '#6B7487', fontWeight: 400, fontSize: '0.75rem', display: 'block', mt: 0.5 }}>
                  {activeGroups || groups.length} running · Shift {activeShiftCode}
                </Typography>
              </Box>
              <Box sx={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#F7F8FA', borderRadius: '8px', color: '#4B5565', border: '1px solid #E5E7EB', flexShrink: 0 }}>
                <GroupWorkIcon sx={{ fontSize: 17 }} />
              </Box>
            </Stack>
          </Card>
        </Grid>

        {/* Attendance Rate Card */}
        <Grid item xs={6} md={3}>
          <Card
            elevation={0}
            sx={{
              p: 2,
              borderRadius: '12px',
              border: '1px solid #E5E7EB',
              bgcolor: '#FFFFFF',
              height: '100%'
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" noWrap sx={{ fontWeight: 500, color: '#6B7487', fontSize: '0.75rem', display: 'block' }}>
                  Attendance rate
                </Typography>
                <Typography sx={{ fontWeight: 600, color: '#111827', fontSize: '1.625rem', lineHeight: 1.15, mt: 0.75, fontVariantNumeric: 'tabular-nums' }}>
                  {overallAttRate}%
                </Typography>
                <Typography variant="caption" noWrap sx={{ color: overallAttRate >= 80 ? '#16A34A' : '#D97706', fontWeight: 500, fontSize: '0.75rem', display: 'block', mt: 0.5 }}>
                  {atRiskStudents.length === 0 ? 'CTEVT compliant (≥80%)' : `${atRiskStudents.length} below 80%`}
                </Typography>
              </Box>
              <Box sx={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#F7F8FA', borderRadius: '8px', color: '#4B5565', border: '1px solid #E5E7EB', flexShrink: 0 }}>
                <FactCheckIcon sx={{ fontSize: 17 }} />
              </Box>
            </Stack>
          </Card>
        </Grid>

        {/* Placement Rate Card */}
        <Grid item xs={6} md={3}>
          <Card
            elevation={0}
            sx={{
              p: 2,
              borderRadius: '12px',
              border: '1px solid #E5E7EB',
              bgcolor: '#FFFFFF',
              height: '100%'
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" noWrap sx={{ fontWeight: 500, color: '#6B7487', fontSize: '0.75rem', display: 'block' }}>
                  OJT &amp; placements
                </Typography>
                <Typography sx={{ fontWeight: 600, color: '#111827', fontSize: '1.625rem', lineHeight: 1.15, mt: 0.75, fontVariantNumeric: 'tabular-nums' }}>
                  {totalStudents > 0 ? `${Math.round((placedCount / totalStudents) * 100)}%` : '0%'}
                </Typography>
                <Typography variant="caption" noWrap sx={{ color: '#6B7487', fontWeight: 400, fontSize: '0.75rem', display: 'block', mt: 0.5 }}>
                  {placedCount} placed · {employerCount} employers
                </Typography>
              </Box>
              <Box sx={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#F7F8FA', borderRadius: '8px', color: '#4B5565', border: '1px solid #E5E7EB', flexShrink: 0 }}>
                <RocketLaunchIcon sx={{ fontSize: 17 }} />
              </Box>
            </Stack>
          </Card>
        </Grid>
      </Grid>

      {/* 3. Dropout Risk Warning Alert Banner */}
      {atRiskStudents.length > 0 && (
        <Alert
          severity="warning"
          icon={<WarningAmberIcon fontSize="small" />}
          sx={{
            mb: 3,
            py: 0.75,
            borderRadius: '10px',
            border: '1px solid #FDE68A',
            bgcolor: '#FFFBEB',
            alignItems: 'center'
          }}
          action={
            <Button
              color="warning"
              variant="outlined"
              size="small"
              onClick={() => onNavigate('attendance')}
              sx={{
                fontWeight: 500,
                borderColor: '#D97706',
                color: '#92400E',
                bgcolor: '#FFFFFF',
                borderRadius: '6px',
                fontSize: '0.75rem',
                px: 1.5,
                whiteSpace: 'nowrap',
                '&:hover': { bgcolor: '#FEF3C7', borderColor: '#B45309' }
              }}
            >
              Review attendance
            </Button>
          }
        >
          <Typography variant="body2" sx={{ fontWeight: 500, color: '#92400E', fontSize: '0.8125rem' }}>
            Attendance alert: {atRiskStudents[0]?.name} is below the 80% CTEVT exam threshold.
          </Typography>
        </Alert>
      )}

      {/* 4. TVET Delivery Workflow Track */}
      <Card
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          bgcolor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E5E7EB'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#111827', fontSize: '0.9rem' }}>
            TVET delivery workflow
          </Typography>
          <Typography variant="caption" sx={{ color: '#6B7487', fontSize: '0.75rem' }}>
            10 connected stages · Select any stage to open
          </Typography>
        </Box>

        <Grid container spacing={1}>
          {workflowSteps.map((step) => (
            <Grid item xs={6} sm={4} md={2.4} key={step.id}>
              <Paper
                elevation={0}
                onClick={() => onNavigate(step.id)}
                sx={{
                  p: 1.25,
                  borderRadius: '8px',
                  bgcolor: '#F7F8FA',
                  border: '1px solid #E5E7EB',
                  cursor: 'pointer',
                  transition: 'background-color 150ms cubic-bezier(0.22, 1, 0.36, 1), border-color 150ms cubic-bezier(0.22, 1, 0.36, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                  '&:hover': {
                    bgcolor: '#FFFFFF',
                    borderColor: '#0F2C59'
                  }
                }}
              >
                <Box
                  sx={{
                    width: 30,
                    height: 30,
                    borderRadius: '6px',
                    bgcolor: '#FFFFFF',
                    color: '#4B5565',
                    border: '1px solid #E5E7EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  {step.icon}
                </Box>
                <Box sx={{ overflow: 'hidden', minWidth: 0 }}>
                  <Typography variant="caption" noWrap sx={{ color: '#6B7487', fontWeight: 500, fontSize: '0.68rem', display: 'block', lineHeight: 1.15, fontVariantNumeric: 'tabular-nums' }}>
                    {step.step} · {step.sub}
                  </Typography>
                  <Typography variant="subtitle2" noWrap sx={{ fontWeight: 500, color: '#111827', fontSize: '0.8125rem', lineHeight: 1.25 }}>
                    {step.title}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Card>

      {/* 4.5 Live Biometric Attendance */}
      <Card
        elevation={0}
        sx={{
          mb: 3,
          p: 2,
          borderRadius: '12px',
          bgcolor: '#FFFFFF',
          border: '1px solid #E5E7EB'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box sx={{ bgcolor: '#F7F8FA', color: '#4B5565', width: 34, height: 34, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E5E7EB' }}>
              <FingerprintIcon sx={{ fontSize: 18 }} />
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#111827', fontSize: '0.9rem' }}>
                  Live attendance monitor
                </Typography>
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6 }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#16A34A' }} />
                  <Typography variant="caption" sx={{ color: '#4B5565', fontWeight: 500, fontSize: '0.75rem' }}>
                    ZKTeco K40 online
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#6B7487', fontSize: '0.75rem' }}>
                Biometric and RFID scans · Last sync: {db.settings?.biometricSettings?.lastSyncTime || 'Standby'}
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
                alert(`Biometric sync complete (${res.syncedCount} new logs updated).`);
              }}
              sx={{ fontWeight: 500, color: '#111827', borderColor: '#E5E7EB', bgcolor: '#FFFFFF', borderRadius: '8px', fontSize: '0.78rem', px: 1.5, height: 34, whiteSpace: 'nowrap', '&:hover': { bgcolor: '#F7F8FA', borderColor: '#D1D5DB' } }}
            >
              Sync device
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => onNavigate('live_attendance')}
              endIcon={<ArrowForwardIcon sx={{ fontSize: '15px !important' }} />}
              sx={{ fontWeight: 500, color: '#0F2C59', borderColor: '#CBD5E1', bgcolor: '#FFFFFF', borderRadius: '8px', fontSize: '0.78rem', px: 1.5, height: 34, whiteSpace: 'nowrap', '&:hover': { bgcolor: '#F7F8FA', borderColor: '#0F2C59' } }}
            >
              Open monitor
            </Button>
          </Box>
        </Box>

        {/* 4 Latest Punches Ticker Grid */}
        <Grid container spacing={1.25}>
          {(db.biometricLogs || []).slice(0, 4).map((log, idx) => (
            <Grid item xs={12} sm={6} md={3} key={log.id || idx}>
              <Paper
                elevation={0}
                sx={{
                  p: 1.25,
                  borderRadius: '8px',
                  bgcolor: '#F7F8FA',
                  border: '1px solid #E5E7EB',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25
                }}
              >
                <Avatar sx={{ bgcolor: '#E5E7EB', color: '#111827', width: 28, height: 28, fontWeight: 600, fontSize: '0.75rem' }}>
                  {log.name?.[0] || 'U'}
                </Avatar>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="body2" noWrap sx={{ fontWeight: 500, color: '#111827', fontSize: '0.8125rem' }}>
                    {log.name}
                  </Typography>
                  <Typography variant="caption" noWrap sx={{ color: '#6B7487', fontSize: '0.72rem', display: 'block', fontVariantNumeric: 'tabular-nums' }}>
                    {log.timestamp} · #{log.biometricId}
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 500, color: '#16A34A' }}>
                  Verified
                </Typography>
              </Paper>
            </Grid>
          ))}
          {(db.biometricLogs || []).length === 0 && (
            <Grid item xs={12}>
              <Typography variant="caption" sx={{ color: '#6B7487', textAlign: 'center', display: 'block', py: 1 }}>
                No biometric or RFID scans recorded today yet.
              </Typography>
            </Grid>
          )}
        </Grid>
      </Card>

      {/* 5. Schedule & Batches Table + Notices */}
      <Grid container spacing={2}>
        {/* Active Batches Workspace */}
        <Grid item xs={12} lg={8}>
          <Card elevation={0} sx={{ p: 2, borderRadius: '12px', height: '100%', bgcolor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#111827', fontSize: '0.9375rem' }}>
                  Active training batches
                </Typography>
                <Typography variant="caption" sx={{ color: '#6B7487', fontSize: '0.75rem' }}>
                  Daily shifts, assigned trainers and trainee counts
                </Typography>
              </Box>
              <Button
                variant="outlined"
                size="small"
                onClick={() => onNavigate('groups')}
                endIcon={<ArrowForwardIcon sx={{ fontSize: '14px !important' }} />}
                sx={{ fontWeight: 500, fontSize: '0.78rem', px: 1.5, height: 32, borderColor: '#E5E7EB', color: '#111827', whiteSpace: 'nowrap', '&:hover': { bgcolor: '#F7F8FA', borderColor: '#D1D5DB' } }}
              >
                All batches ({groups.length})
              </Button>
            </Box>

            {/* Shift Filter Tabs & Search Bar */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
              <Tabs
                value={shiftFilter}
                onChange={(_, val) => setShiftFilter(val)}
                sx={{
                  minHeight: 34,
                  '& .MuiTab-root': {
                    minHeight: 34,
                    py: 0.5,
                    px: 1.25,
                    fontSize: '0.78rem',
                    fontWeight: 500,
                    textTransform: 'none'
                  }
                }}
              >
                <Tab value="ALL" label="All" />
                <Tab value="A" label="Shift A" />
                <Tab value="B" label="Shift B" />
                <Tab value="C" label="Shift C" />
                <Tab value="D" label="Shift D" />
                <Tab value="E" label="Shift E" />
              </Tabs>

              <TextField
                size="small"
                placeholder="Search"
                value={searchBatch}
                onChange={(e) => setSearchBatch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#6B7487', fontSize: 16 }} />
                    </InputAdornment>
                  ),
                  sx: { height: 34, fontSize: '0.8125rem', borderRadius: '8px' }
                }}
              />
            </Box>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E5E7EB', borderRadius: '8px' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Batch</TableCell>
                    <TableCell>Course</TableCell>
                    <TableCell>Shift</TableCell>
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
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#111827', fontSize: '0.8125rem', fontVariantNumeric: 'tabular-nums' }}>
                              {grp.groupCode}
                            </Typography>
                            {isShiftLive && (
                              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#16A34A' }} />
                                <Typography variant="caption" sx={{ color: '#16A34A', fontWeight: 500, fontSize: '0.72rem' }}>
                                  Live
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontWeight: 500, color: '#111827', fontSize: '0.8125rem', lineHeight: 1.25 }}>
                            {course?.title || 'Vocational Training'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#6B7487', fontSize: '0.72rem' }}>
                            {course?.durationValue || 3} months · {batchStudents.length} trainees
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          <Typography sx={{ fontWeight: 500, color: '#111827', fontSize: '0.8125rem' }}>
                            Shift {grp.shift}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#6B7487', fontSize: '0.72rem', fontVariantNumeric: 'tabular-nums' }}>
                            {grp.startTime} – {grp.endTime}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontWeight: 500, color: '#111827', fontSize: '0.8125rem' }}>
                            {trainer?.name || 'Assigned Instructor'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#6B7487', fontSize: '0.72rem', fontVariantNumeric: 'tabular-nums' }}>
                            {trainer?.phone || ''}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" onClick={(e) => e.stopPropagation()} sx={{ whiteSpace: 'nowrap' }}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => onNavigate('attendance')}
                            sx={{
                              borderColor: '#E5E7EB',
                              color: '#0F2C59',
                              fontWeight: 500,
                              fontSize: '0.75rem',
                              py: 0.4,
                              px: 1.25,
                              minWidth: 0,
                              whiteSpace: 'nowrap',
                              borderRadius: '6px',
                              '&:hover': { bgcolor: '#F7F8FA', borderColor: '#0F2C59' }
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
                      <TableCell colSpan={5} align="center" sx={{ py: 4, color: '#6B7487', fontSize: '0.8125rem' }}>
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
          <Card elevation={0} sx={{ p: 2, borderRadius: '12px', height: '100%', bgcolor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CampaignIcon sx={{ color: '#4B5565', fontSize: 18 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#111827', fontSize: '0.9375rem' }}>
                  Notice board
                </Typography>
              </Box>
              <Button
                size="small"
                variant="outlined"
                startIcon={<AddIcon sx={{ fontSize: '15px !important' }} />}
                onClick={() => setOpenAddNoticeModal(true)}
                sx={{ fontWeight: 500, fontSize: '0.75rem', px: 1.25, height: 30, borderColor: '#E5E7EB', color: '#111827', whiteSpace: 'nowrap', '&:hover': { bgcolor: '#F7F8FA', borderColor: '#D1D5DB' } }}
              >
                New notice
              </Button>
            </Box>

            <Stack spacing={1.25}>
              {(db.notices || []).slice(0, 3).map((notice) => (
                <Paper
                  key={notice.id}
                  elevation={0}
                  sx={{
                    p: 1.5,
                    borderRadius: '8px',
                    border: notice.priority === 'Urgent' ? '1px solid #FECACA' : '1px solid #E5E7EB',
                    bgcolor: notice.priority === 'Urgent' ? '#FEF2F2' : '#F7F8FA'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, mb: 0.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#111827', fontSize: '0.8125rem' }}>
                      {notice.title}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.7rem',
                        fontWeight: 500,
                        flexShrink: 0,
                        color: notice.priority === 'Urgent' ? '#DC2626' : '#6B7487'
                      }}
                    >
                      {notice.priority}
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: '#4B5565', display: 'block', mb: 0.75, fontSize: '0.75rem', lineHeight: 1.45 }}>
                    {notice.content}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#6B7487', fontSize: '0.7rem', fontVariantNumeric: 'tabular-nums' }}>
                    {notice.publishDate}
                  </Typography>
                </Paper>
              ))}
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ bgcolor: '#F7F8FA', p: 1.5, borderRadius: '8px', border: '1px solid #E5E7EB' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#111827', mb: 0.5, fontSize: '0.8125rem' }}>
                CTEVT delivery checklist
              </Typography>
              <Typography variant="caption" sx={{ color: '#4B5565', display: 'block', fontSize: '0.75rem', lineHeight: 1.45 }}>
                Complete the Work Plan, Lesson Plan, Daily Attendance, and Competency Evaluations for each batch before issuing certificates.
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
