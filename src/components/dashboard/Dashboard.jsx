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
        g.groupCode.toLowerCase().includes(q) ||
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
    <Box sx={{ pb: 6 }}>
      {/* 1. HERO BANNER - Completely Redesigned for Crystal-Clear Text & Zero Empty Space */}
      <Card
        sx={{
          mb: 3.5,
          background: 'linear-gradient(135deg, #071933 0%, #0D284F 50%, #153E75 100%)',
          color: '#FFFFFF',
          borderRadius: 4,
          p: { xs: 2, sm: 2.5, md: 3 },
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 12px 32px -8px rgba(7, 25, 51, 0.35)'
        }}
      >
        {/* Subtle Decorative Ambient Background Glow */}
        <Box
          sx={{
            position: 'absolute',
            top: -60,
            right: -60,
            width: 320,
            height: 320,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(37, 99, 235, 0.25) 0%, rgba(7, 25, 51, 0) 70%)',
            pointerEvents: 'none'
          }}
        />

        <Grid container spacing={3} alignItems="flex-start">
          {/* Left Column: Top-Aligned Authority Badges, Clear Text & 5 Eye-Friendly Action Buttons */}
          <Grid item xs={12} md={7.5} lg={8.2}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.4, flexWrap: 'wrap' }}>
              <Chip
                icon={<ShieldIcon sx={{ fontSize: '15px !important', color: '#FDE047 !important' }} />}
                label="Global Era Technical School"
                size="small"
                sx={{
                  bgcolor: 'rgba(254, 240, 138, 0.15)',
                  color: '#FEF08A',
                  fontWeight: 900,
                  fontSize: '0.75rem',
                  border: '1px solid rgba(254, 240, 138, 0.3)'
                }}
              />
              <Chip
                icon={<CheckCircleIcon sx={{ fontSize: '14px !important', color: '#4ADE80 !important' }} />}
                label="CTEVT Accredited"
                size="small"
                sx={{
                  bgcolor: 'rgba(74, 222, 128, 0.15)',
                  color: '#86EFAC',
                  fontWeight: 800,
                  fontSize: '0.73rem',
                  border: '1px solid rgba(74, 222, 128, 0.25)'
                }}
              />
              <Chip
                icon={<CloudDoneIcon sx={{ fontSize: '14px !important', color: '#60A5FA !important' }} />}
                label="Postgres Cloud Live"
                size="small"
                sx={{
                  bgcolor: 'rgba(96, 165, 250, 0.15)',
                  color: '#BAE6FD',
                  fontWeight: 800,
                  fontSize: '0.73rem',
                  border: '1px solid rgba(96, 165, 250, 0.25)'
                }}
              />
            </Box>

            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                color: '#FFFFFF',
                mb: 0.8,
                fontSize: { xs: '1.5rem', sm: '1.95rem', md: '2.15rem' },
                lineHeight: 1.2
              }}
            >
              Welcome, {currentUser?.name}!
            </Typography>

            <Typography
              variant="body1"
              sx={{
                color: '#CBD5E1',
                lineHeight: 1.55,
                fontSize: { xs: '0.9rem', sm: '0.98rem' },
                maxWidth: 680,
                mb: 2.2
              }}
            >
              {isTrainer
                ? 'Manage daily attendance for your training batches, execute lesson plans, and verify student competency evaluations.'
                : 'Official TVET ERP for managing occupations, curricula, daily work plans, biometric attendance, and CTEVT certifications.'}
            </Typography>

            {/* 5 Eye-Friendly Action Buttons Aligned on a Single Desktop Row */}
            <Box
              sx={{
                display: 'flex',
                flexWrap: { xs: 'wrap', lg: 'nowrap' },
                gap: 1,
                alignItems: 'center'
              }}
            >
              {/* Button 1: Primary Calm Emerald Action */}
              <Button
                variant="contained"
                onClick={() => onNavigate('attendance')}
                startIcon={<FactCheckIcon sx={{ fontSize: '18px !important' }} />}
                sx={{
                  bgcolor: '#059669 !important',
                  color: '#FFFFFF !important',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  py: 0.9,
                  px: 1.6,
                  borderRadius: 2,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  border: '1px solid rgba(52, 211, 153, 0.5)',
                  '&:hover': {
                    bgcolor: '#047857 !important'
                  }
                }}
              >
                Take Attendance
              </Button>

              {/* Button 2: Soft Frosted Slate Pill */}
              <Button
                variant="outlined"
                onClick={() => onNavigate('lessonplan')}
                startIcon={<AssignmentIcon sx={{ fontSize: '17px !important', color: '#93C5FD' }} />}
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.24) !important',
                  color: '#F8FAFC !important',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  py: 0.9,
                  px: 1.5,
                  borderRadius: 2,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  '&:hover': {
                    borderColor: 'rgba(255, 255, 255, 0.45) !important',
                    bgcolor: 'rgba(255, 255, 255, 0.18)'
                  }
                }}
              >
                Lesson Plan
              </Button>

              {/* Button 3: Inquiry CRM Pill */}
              <Button
                variant="outlined"
                onClick={() => onNavigate('leads')}
                startIcon={<ContactPhoneIcon sx={{ fontSize: '17px !important', color: '#7DD3FC' }} />}
                sx={{
                  borderColor: 'rgba(125, 211, 252, 0.35) !important',
                  color: '#F8FAFC !important',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  py: 0.9,
                  px: 1.5,
                  borderRadius: 2,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  bgcolor: 'rgba(30, 64, 175, 0.28)',
                  '&:hover': {
                    borderColor: '#7DD3FC !important',
                    bgcolor: 'rgba(30, 64, 175, 0.45)'
                  }
                }}
              >
                Inquiry CRM ({db.leads?.length || 0})
              </Button>

              {/* Button 4: Add Student Pill */}
              <Button
                variant="outlined"
                onClick={() => onNavigate('students')}
                startIcon={<PersonAddAlt1Icon sx={{ fontSize: '17px !important', color: '#E2E8F0' }} />}
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.24) !important',
                  color: '#F8FAFC !important',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  py: 0.9,
                  px: 1.5,
                  borderRadius: 2,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  bgcolor: 'rgba(255, 255, 255, 0.08)',
                  '&:hover': {
                    borderColor: 'rgba(255, 255, 255, 0.45) !important',
                    bgcolor: 'rgba(255, 255, 255, 0.16)'
                  }
                }}
              >
                Add Student
              </Button>

              {/* Button 5: Soft Warm Amber-Tinted Certificates Pill */}
              <Button
                variant="outlined"
                onClick={() => onNavigate('certificates')}
                startIcon={<WorkspacePremiumIcon sx={{ fontSize: '17px !important', color: '#FBBF24' }} />}
                sx={{
                  borderColor: 'rgba(251, 191, 36, 0.45) !important',
                  color: '#FEF3C7 !important',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  py: 0.9,
                  px: 1.5,
                  borderRadius: 2,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  bgcolor: 'rgba(245, 158, 11, 0.16)',
                  '&:hover': {
                    borderColor: '#FBBF24 !important',
                    bgcolor: 'rgba(245, 158, 11, 0.26)'
                  }
                }}
              >
                Certificates (A4)
              </Button>
            </Box>
          </Grid>

          {/* Right Column: Live Real-Time Institutional Hub Widget */}
          <Grid item xs={12} md={4.5} lg={3.8}>
            <Box
              sx={{
                bgcolor: 'rgba(15, 30, 60, 0.65)',
                backdropFilter: 'blur(16px)',
                p: { xs: 2.5, sm: 3 },
                borderRadius: 3.5,
                border: '1.5px solid rgba(255, 255, 255, 0.16)',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
                textAlign: 'left'
              }}
            >
              {/* Real-time Ticking Digital Clock Header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography variant="overline" sx={{ color: '#93C5FD', letterSpacing: '0.08em', fontWeight: 900, fontSize: '0.7rem' }}>
                  ⏱️ LIVE SYSTEM CLOCK
                </Typography>
                <Chip
                  label="Online"
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.65rem',
                    bgcolor: '#059669',
                    color: '#FFFFFF',
                    fontWeight: 900
                  }}
                />
              </Box>

              <Typography
                variant="h3"
                sx={{
                  fontFamily: 'monospace',
                  fontWeight: 900,
                  color: '#FFFFFF',
                  letterSpacing: '0.04em',
                  lineHeight: 1,
                  mb: 0.8,
                  fontSize: { xs: '1.8rem', sm: '2.1rem' }
                }}
              >
                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
              </Typography>

              <Typography variant="body2" sx={{ color: '#CBD5E1', fontWeight: 700, mb: 2 }}>
                {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </Typography>

              <Divider sx={{ my: 1.8, borderColor: 'rgba(255, 255, 255, 0.15)' }} />

              {/* Active Shift Indicator with Glowing Beacon */}
              <Box sx={{ bgcolor: 'rgba(16, 185, 129, 0.12)', p: 1.8, borderRadius: 2.5, border: '1px solid rgba(52, 211, 153, 0.3)', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      bgcolor: '#34D399',
                      boxShadow: '0 0 10px #34D399'
                    }}
                  />
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#6EE7B7' }}>
                    SHIFT {activeShiftCode} LIVE ({activeShiftTime})
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: '#E2E8F0', display: 'block', fontWeight: 600 }}>
                  Vocational Training Sessions in Operation
                </Typography>
              </Box>

              {/* Live Metric Badges */}
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Box sx={{ p: 1.2, bgcolor: 'rgba(255,255,255,0.08)', borderRadius: 2, textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 900, color: '#38BDF8', lineHeight: 1.1 }}>
                      {groups.length} Batches
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.68rem', fontWeight: 700 }}>
                      Active Batches
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ p: 1.2, bgcolor: 'rgba(255,255,255,0.08)', borderRadius: 2, textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 900, color: overallAttRate >= 80 ? '#34D399' : '#FBBF24', lineHeight: 1.1 }}>
                      {overallAttRate}%
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.68rem', fontWeight: 700 }}>
                      Avg. Attendance Rate
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Grid>
        </Grid>
      </Card>

      {/* 2. OPERATIONAL DELIVERY CHAIN - Clean, Responsive Stepped Workflow Track (No Ugly Scrollbars!) */}
      <Card
        sx={{
          p: 3,
          mb: 3.5,
          bgcolor: '#FFFFFF',
          borderRadius: 3.5,
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.05)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BoltIcon sx={{ color: '#D97706', fontSize: 22 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#0F2C59', letterSpacing: '0.02em' }}>
              TVET OPERATIONAL WORKFLOW CHAIN
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>
            All 10 stages are interconnected • Click any stage to open directly
          </Typography>
        </Box>

        {/* Stepped Grid Layout */}
        <Grid container spacing={1.5}>
          {workflowSteps.map((step) => (
            <Grid item xs={6} sm={4} md={2.4} key={step.id}>
              <Paper
                elevation={0}
                onClick={() => onNavigate(step.id)}
                sx={{
                  p: 1.5,
                  borderRadius: 2.5,
                  bgcolor: step.highlight ? '#EFF6FF' : '#F8FAFC',
                  border: step.highlight ? '1.5px solid #93C5FD' : '1px solid #E2E8F0',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.2,
                  '&:hover': {
                    bgcolor: '#FFFFFF',
                    borderColor: '#2563EB',
                    boxShadow: '0 6px 16px rgba(37, 99, 235, 0.12)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: step.highlight ? '#1D4ED8' : '#FFFFFF',
                    color: step.highlight ? '#FFFFFF' : '#0F2C59',
                    fontSize: '1rem',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                    border: '1px solid #E2E8F0'
                  }}
                >
                  {step.icon}
                </Avatar>
                <Box sx={{ overflow: 'hidden' }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 900, fontSize: '0.65rem', display: 'block' }}>
                    STEP {step.step}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0F2C59', fontSize: '0.82rem', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                    {step.title}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.68rem', fontWeight: 600, display: 'block' }}>
                    {step.sub}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Card>

      {/* 3. 4 HIGH-IMPACT KPI STAT CARDS WITH ACCURATE COMPLIANCE LOGIC */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        {/* Trainees Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              p: 2.5,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              borderRadius: 3.5,
              border: '1px solid rgba(226, 232, 240, 0.9)',
              borderTop: '4px solid #1D4ED8',
              bgcolor: '#FFFFFF',
              boxShadow: '0 4px 20px -2px rgba(15,23,42,0.06)',
              transition: 'all 0.25s ease',
              '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 12px 28px -4px rgba(15,23,42,0.12)', borderColor: '#CBD5E1' }
            }}
          >
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography variant="overline" sx={{ color: '#64748B', fontWeight: 800, fontSize: '0.68rem', letterSpacing: '0.04em', lineHeight: 1.2 }}>
                  TOTAL TRAINEES
                </Typography>
                <Avatar sx={{ bgcolor: '#EFF6FF', color: '#1D4ED8', width: 44, height: 44, borderRadius: 2.5, border: '1px solid #DBEAFE' }}>
                  <SchoolIcon fontSize="small" />
                </Avatar>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, my: 0.5 }}>
                <Typography variant="h3" sx={{ fontWeight: 900, color: '#0F172A', fontSize: '2.1rem', lineHeight: 1 }}>
                  {totalStudents}
                </Typography>
                <Chip
                  label={`Female ${femalePct}%`}
                  size="small"
                  sx={{ bgcolor: '#EFF6FF', color: '#1D4ED8', fontWeight: 800, fontSize: '0.68rem', height: 22 }}
                />
              </Box>

              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', fontSize: '0.74rem', minHeight: 20, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                • GESI Standard: Minimum 35% Quota Ensured
              </Typography>
            </Box>

            <Box sx={{ mt: 2 }}>
              <LinearProgress
                variant="determinate"
                value={femalePct}
                sx={{ height: 6, borderRadius: 3, bgcolor: '#F1F5F9', '& .MuiLinearProgress-bar': { bgcolor: '#1D4ED8' } }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.8 }}>
                <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.68rem', fontWeight: 700 }}>
                  GESI Participation
                </Typography>
                <Typography variant="caption" sx={{ color: '#1D4ED8', fontSize: '0.68rem', fontWeight: 800 }}>
                  {femaleCount} Female / {totalStudents} Total
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* Active Batches Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              p: 2.5,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              borderRadius: 3.5,
              border: '1px solid rgba(226, 232, 240, 0.9)',
              borderTop: '4px solid #059669',
              bgcolor: '#FFFFFF',
              boxShadow: '0 4px 20px -2px rgba(15,23,42,0.06)',
              transition: 'all 0.25s ease',
              '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 12px 28px -4px rgba(15,23,42,0.12)', borderColor: '#CBD5E1' }
            }}
          >
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography variant="overline" sx={{ color: '#64748B', fontWeight: 800, fontSize: '0.68rem', letterSpacing: '0.04em', lineHeight: 1.2 }}>
                  ACTIVE BATCHES
                </Typography>
                <Avatar sx={{ bgcolor: '#ECFDF5', color: '#059669', width: 44, height: 44, borderRadius: 2.5, border: '1px solid #D1FAE5' }}>
                  <GroupWorkIcon fontSize="small" />
                </Avatar>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, my: 0.5 }}>
                <Typography variant="h3" sx={{ fontWeight: 900, color: '#0F172A', fontSize: '2.1rem', lineHeight: 1 }}>
                  {groups.length}
                </Typography>
                <Chip
                  label={`${activeGroups || groups.length} Running`}
                  size="small"
                  sx={{ bgcolor: '#ECFDF5', color: '#059669', fontWeight: 800, fontSize: '0.68rem', height: 22 }}
                />
              </Box>

              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', fontSize: '0.74rem', minHeight: 20, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                • Shifts A–E (Currently Active: Shift {activeShiftCode})
              </Typography>
            </Box>

            <Box sx={{ mt: 2 }}>
              <LinearProgress
                variant="determinate"
                value={groups.length > 0 ? 100 : 0}
                sx={{ height: 6, borderRadius: 3, bgcolor: '#F1F5F9', '& .MuiLinearProgress-bar': { bgcolor: '#059669' } }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.8 }}>
                <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.68rem', fontWeight: 700 }}>
                  Operational Capacity
                </Typography>
                <Typography variant="caption" sx={{ color: '#059669', fontSize: '0.68rem', fontWeight: 800 }}>
                  5 Shifts Available
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* Attendance Rate Card - Correct Compliance Threshold */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              p: 2.5,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              borderRadius: 3.5,
              border: '1px solid rgba(226, 232, 240, 0.9)',
              borderTop: `4px solid ${overallAttRate >= 80 ? '#059669' : '#D97706'}`,
              bgcolor: '#FFFFFF',
              boxShadow: '0 4px 20px -2px rgba(15,23,42,0.06)',
              transition: 'all 0.25s ease',
              '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 12px 28px -4px rgba(15,23,42,0.12)', borderColor: '#CBD5E1' }
            }}
          >
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography variant="overline" sx={{ color: '#64748B', fontWeight: 800, fontSize: '0.68rem', letterSpacing: '0.04em', lineHeight: 1.2 }}>
                  TVET ATTENDANCE
                </Typography>
                <Avatar
                  sx={{
                    bgcolor: overallAttRate >= 80 ? '#ECFDF5' : '#FFFBEB',
                    color: overallAttRate >= 80 ? '#059669' : '#D97706',
                    width: 44,
                    height: 44,
                    borderRadius: 2.5,
                    border: `1px solid ${overallAttRate >= 80 ? '#D1FAE5' : '#FEF3C7'}`
                  }}
                >
                  <FactCheckIcon fontSize="small" />
                </Avatar>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, my: 0.5 }}>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 900,
                    color: overallAttRate >= 80 ? '#059669' : '#D97706',
                    fontSize: '2.1rem',
                    lineHeight: 1
                  }}
                >
                  {overallAttRate}%
                </Typography>
                <Chip
                  label={overallAttRate >= 80 ? '✓ Compliant' : '⚠️ Alert'}
                  size="small"
                  sx={{
                    bgcolor: overallAttRate >= 80 ? '#ECFDF5' : '#FEF3C7',
                    color: overallAttRate >= 80 ? '#059669' : '#B45309',
                    fontWeight: 800,
                    fontSize: '0.68rem',
                    height: 22
                  }}
                />
              </Box>

              <Typography
                variant="caption"
                sx={{
                  color: overallAttRate >= 80 ? '#059669' : '#D97706',
                  fontWeight: 700,
                  display: 'block',
                  fontSize: '0.74rem',
                  minHeight: 20,
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden'
                }}
              >
                {overallAttRate >= 80
                  ? '• CTEVT Standard Met (≥80% Attendance)'
                  : '• Below Minimum Threshold (<80%)'}
              </Typography>
            </Box>

            <Box sx={{ mt: 2 }}>
              <LinearProgress
                variant="determinate"
                value={overallAttRate}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: '#F1F5F9',
                  '& .MuiLinearProgress-bar': { bgcolor: overallAttRate >= 80 ? '#059669' : '#D97706' }
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.8 }}>
                <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.68rem', fontWeight: 700 }}>
                  CTEVT Target: 80%
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: overallAttRate >= 80 ? '#059669' : '#D97706', fontSize: '0.68rem', fontWeight: 800 }}
                >
                  {atRiskStudents.length === 0 ? 'All Compliant' : `${atRiskStudents.length} Needs Attention`}
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* Placement Rate Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              p: 2.5,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              borderRadius: 3.5,
              border: '1px solid rgba(226, 232, 240, 0.9)',
              borderTop: '4px solid #7C3AED',
              bgcolor: '#FFFFFF',
              boxShadow: '0 4px 20px -2px rgba(15,23,42,0.06)',
              transition: 'all 0.25s ease',
              '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 12px 28px -4px rgba(15,23,42,0.12)', borderColor: '#CBD5E1' }
            }}
          >
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography variant="overline" sx={{ color: '#64748B', fontWeight: 800, fontSize: '0.68rem', letterSpacing: '0.04em', lineHeight: 1.2 }}>
                  OJT & PLACEMENTS
                </Typography>
                <Avatar sx={{ bgcolor: '#F5F3FF', color: '#7C3AED', width: 44, height: 44, borderRadius: 2.5, border: '1px solid #EDE9FE' }}>
                  <RocketLaunchIcon fontSize="small" />
                </Avatar>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, my: 0.5 }}>
                <Typography variant="h3" sx={{ fontWeight: 900, color: '#7C3AED', fontSize: '2.1rem', lineHeight: 1 }}>
                  {totalStudents > 0 ? `${Math.round((placedCount / totalStudents) * 100)}%` : '0%'}
                </Typography>
                <Chip
                  label={`${placedCount} Placed`}
                  size="small"
                  sx={{ bgcolor: '#F5F3FF', color: '#7C3AED', fontWeight: 800, fontSize: '0.68rem', height: 22 }}
                />
              </Box>

              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', fontSize: '0.74rem', minHeight: 20, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                • {employerCount} Partner Employers with MoU
              </Typography>
            </Box>

            <Box sx={{ mt: 2 }}>
              <LinearProgress
                variant="determinate"
                value={totalStudents > 0 ? Math.min(100, Math.round((placedCount / totalStudents) * 100)) : 0}
                sx={{ height: 6, borderRadius: 3, bgcolor: '#F1F5F9', '& .MuiLinearProgress-bar': { bgcolor: '#7C3AED' } }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.8 }}>
                <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.68rem', fontWeight: 700 }}>
                  {(db.ojts || []).length} Trainees in OJT
                </Typography>
                <Typography variant="caption" sx={{ color: '#7C3AED', fontSize: '0.68rem', fontWeight: 800 }}>
                  Target: 80%
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* 4. Dropout Risk Warning Alert Banner */}
      {atRiskStudents.length > 0 && (
        <Alert
          severity="warning"
          icon={<WarningAmberIcon sx={{ fontSize: 26 }} />}
          sx={{
            mb: 3.5,
            borderRadius: 3.5,
            border: '1.5px solid #FCD34D',
            bgcolor: '#FFFBEB',
            alignItems: 'center',
            p: 2
          }}
          action={
            <Button
              color="warning"
              variant="contained"
              size="medium"
              onClick={() => onNavigate('attendance')}
              sx={{
                fontWeight: 900,
                bgcolor: '#D97706',
                color: '#FFFFFF',
                borderRadius: 2.5,
                px: 2,
                '&:hover': { bgcolor: '#B45309' }
              }}
            >
              Open Attendance Register
            </Button>
          }
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#92400E', fontSize: '0.95rem' }}>
            Dropout Early Warning Alert
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '0.88rem', color: '#B45309', mt: 0.3 }}>
            <b>{atRiskStudents[0]?.name}</b> has an attendance rate below 80%. A minimum of 80% attendance is mandatory for CTEVT examinations. Please contact the guardian via WhatsApp or phone.
          </Typography>
        </Alert>
      )}

      {/* 4.5 REAL-TIME LIVE ATTENDANCE COMMAND CARD */}
      <Card
        sx={{
          mb: 3.5,
          p: { xs: 2.5, sm: 3 },
          borderRadius: 3.5,
          bgcolor: '#FFFFFF',
          border: '1.5px solid #BBF7D0',
          boxShadow: '0 6px 24px -4px rgba(16, 185, 129, 0.12)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: '#DCFCE7', color: '#15803D', width: 42, height: 42, border: '1px solid #86EFAC' }}>
              <FingerprintIcon />
            </Avatar>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="h6" sx={{ fontWeight: 900, color: '#0F2C59' }}>
                  📡 Real-Time Live Attendance Hub
                </Typography>
                <Chip
                  label="🟢 WiFi ZKTeco K40 (Online)"
                  size="small"
                  sx={{ bgcolor: '#DCFCE7', color: '#15803D', fontWeight: 800, fontSize: '0.72rem' }}
                />
              </Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                Instant biometric thumb & RFID scans at the main gate • Last Sync: {db.settings?.biometricSettings?.lastSyncTime || 'Standby'}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<FingerprintIcon />}
              onClick={() => {
                const today = new Date().toISOString().slice(0, 10);
                const res = syncBiometricAttendance(today);
                setDb(loadDB());
                alert(`📡 Biometric Sync Complete! (${res.syncedCount} new logs updated)`);
              }}
              sx={{ fontWeight: 800, color: '#15803D', borderColor: '#86EFAC', borderRadius: 2 }}
            >
              Sync Machine
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={() => onNavigate('live_attendance')}
              endIcon={<ArrowForwardIcon />}
              sx={{ fontWeight: 900, bgcolor: '#0F2E5A', '&:hover': { bgcolor: '#0B2545' }, borderRadius: 2 }}
            >
              Open Full Live Monitor ➔
            </Button>
          </Box>
        </Box>

        {/* 4 Latest Punches Ticker Grid */}
        <Grid container spacing={1.5}>
          {(db.biometricLogs || []).slice(0, 4).map((log, idx) => (
            <Grid item xs={12} sm={6} md={3} key={log.id || idx}>
              <Paper
                variant="outlined"
                sx={{
                  p: 1.5,
                  borderRadius: 2.5,
                  bgcolor: '#F8FAFC',
                  borderColor: '#E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.2
                }}
              >
                <Avatar sx={{ bgcolor: log.role === 'STUDENT' ? '#DCFCE7' : '#FEF3C7', color: log.role === 'STUDENT' ? '#15803D' : '#92400E', width: 36, height: 36, fontWeight: 900, fontSize: '0.85rem' }}>
                  {log.name?.[0] || 'U'}
                </Avatar>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '0.82rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {log.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#0F2E5A', fontWeight: 800, fontSize: '0.7rem', display: 'block' }}>
                    🕒 {log.timestamp} • #{log.biometricId}
                  </Typography>
                </Box>
                <Chip
                  label="🟢 Verified"
                  size="small"
                  sx={{ height: 18, fontSize: '0.62rem', fontWeight: 800, bgcolor: '#DCFCE7', color: '#15803D' }}
                />
              </Paper>
            </Grid>
          ))}
          {(db.biometricLogs || []).length === 0 && (
            <Grid item xs={12}>
              <Typography variant="caption" sx={{ color: '#94A3B8', textAlign: 'center', display: 'block', py: 1 }}>
                No biometric or RFID scans recorded today yet.
              </Typography>
            </Grid>
          )}
        </Grid>
      </Card>

      {/* 5. Schedule & Batches Table + Notices */}
      <Grid container spacing={3}>
        {/* Active Batches Workspace */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ p: 3, borderRadius: 3.5, height: '100%', bgcolor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900, color: '#0F2C59' }}>
                  🗓️ Active Training Batches
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                  Daily shifts, assigned trainers, and trainee enrollment details
                </Typography>
              </Box>
              <Button
                variant="outlined"
                size="small"
                onClick={() => onNavigate('groups')}
                endIcon={<ArrowForwardIcon />}
                sx={{ fontWeight: 800 }}
              >
                All Batches ({groups.length})
              </Button>
            </Box>

            {/* Shift Filter Tabs & Search Bar */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
              <Tabs
                value={shiftFilter}
                onChange={(_, val) => setShiftFilter(val)}
                sx={{
                  minHeight: 36,
                  '& .MuiTab-root': {
                    minHeight: 34,
                    py: 0.5,
                    px: 1.5,
                    fontSize: '0.75rem',
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
                      <SearchIcon fontSize="small" sx={{ color: '#94A3B8' }} />
                    </InputAdornment>
                  ),
                  sx: { height: 34, fontSize: '0.8rem', borderRadius: 2 }
                }}
              />
            </Box>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2.5 }}>
              <Table size="medium">
                <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 900 }}>Batch Code</TableCell>
                    <TableCell sx={{ fontWeight: 900 }}>Course</TableCell>
                    <TableCell sx={{ fontWeight: 900 }}>Shift & Time</TableCell>
                    <TableCell sx={{ fontWeight: 900 }}>Trainer</TableCell>
                    <TableCell sx={{ fontWeight: 900, align: 'right' }}>Action</TableCell>
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
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={grp.groupCode}
                              size="small"
                              sx={{ fontWeight: 900, bgcolor: '#0F2C59', color: '#fff', fontSize: '0.75rem' }}
                            />
                            {isShiftLive && (
                              <Chip
                                label="Live Now"
                                size="small"
                                sx={{
                                  height: 18,
                                  fontSize: '0.62rem',
                                  fontWeight: 900,
                                  bgcolor: '#DCFCE7',
                                  color: '#15803D'
                                }}
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                            {course?.title || 'Vocational Training'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B' }}>
                            {course?.durationValue || 3} Months • {batchStudents.length} Trainees
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#1D4ED8' }}>
                            Shift {grp.shift}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B' }}>
                            {grp.startTime} – {grp.endTime}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {trainer?.name || 'Assigned Instructor'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B' }}>
                            {trainer?.phone || ''}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => onNavigate('attendance')}
                            sx={{
                              bgcolor: '#0F2C59',
                              fontWeight: 800,
                              fontSize: '0.72rem',
                              py: 0.5,
                              px: 1.5,
                              borderRadius: 2
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
                      <TableCell colSpan={5} align="center" sx={{ py: 3, color: '#64748B' }}>
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
          <Card sx={{ p: 3, borderRadius: 3.5, height: '100%', bgcolor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CampaignIcon sx={{ color: '#D97706', fontSize: 24 }} />
                <Typography variant="h6" sx={{ fontWeight: 900, color: '#0F2C59' }}>
                  Notice Board
                </Typography>
              </Box>
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={() => setOpenAddNoticeModal(true)}
                sx={{ fontWeight: 800, fontSize: '0.75rem' }}
              >
                New Notice
              </Button>
            </Box>

            <Stack spacing={2}>
              {(db.notices || []).slice(0, 3).map((notice) => (
                <Paper
                  key={notice.id}
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    borderColor: notice.priority === 'Urgent' ? '#FCA5A5' : '#E2E8F0',
                    bgcolor: notice.priority === 'Urgent' ? '#FEF2F2' : '#F8FAFC'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0F172A' }}>
                      {notice.title}
                    </Typography>
                    <Chip
                      label={notice.priority}
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: '0.62rem',
                        fontWeight: 900,
                        bgcolor: notice.priority === 'Urgent' ? '#FEE2E2' : '#EFF6FF',
                        color: notice.priority === 'Urgent' ? '#DC2626' : '#1D4ED8'
                      }}
                    />
                  </Box>
                  <Typography variant="caption" sx={{ color: '#475569', display: 'block', mb: 1 }}>
                    {notice.content}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.68rem', fontWeight: 600 }}>
                    Published: {notice.publishDate}
                  </Typography>
                </Paper>
              ))}
            </Stack>

            <Divider sx={{ my: 2.5 }} />

            <Box sx={{ bgcolor: '#EFF6FF', p: 2, borderRadius: 2.5, border: '1px solid #BFDBFE' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#1E40AF', mb: 0.5 }}>
                CTEVT Standard Training Delivery
              </Typography>
              <Typography variant="caption" sx={{ color: '#3B82F6', display: 'block' }}>
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
