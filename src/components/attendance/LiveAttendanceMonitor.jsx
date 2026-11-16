import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  TextField,
  MenuItem,
  Stack,
  IconButton,
  Tooltip,
  InputAdornment,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  Alert
} from '@mui/material';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import confetti from 'canvas-confetti';

import { loadDB, saveDB } from '../../services/storage';
import {
  syncBiometricAttendance,
  recordLiveBiometricPunch,
  formatPunchTime,
  evaluatePunchStatus
} from '../../services/biometricService';
import { playBiometricBeep } from '../../services/soundUtils';
import { getWhatsAppUrl } from '../../services/exportUtils';
import { useAuth } from '../../context/AuthContext';

export default function LiveAttendanceMonitor({ onNavigate }) {
  const [db, setDb] = useState(loadDB());
  const { currentUser } = useAuth();

  // Active top role tab: 0 = All Live Stream, 1 = Trainees Live Roster, 2 = Trainers Live Roster, 3 = Staff Live
  const [activeTab, setActiveTab] = useState(0);

  // Real-time ticking digital clock
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Sound enable/disable toggle
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Fullscreen monitor mode
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Target date (defaults to today)
  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [selectedBatchId, setSelectedBatchId] = useState(db.trainingGroups?.[0]?.id || 'ALL');

  // Simulation modal & Instant RFID/Biometric Card Tap state
  const [openSimulateModal, setOpenSimulateModal] = useState(false);
  const [simTargetId, setSimTargetId] = useState('');
  const [simTargetRole, setSimTargetRole] = useState('STUDENT');
  const [rfidQuickInput, setRfidQuickInput] = useState('');
  const [rfidFeedback, setRfidFeedback] = useState(null);

  // Reactive listener for storage updates (such as external pushes or live punches)
  useEffect(() => {
    const handleStorageUpdate = () => {
      setDb(loadDB());
    };
    window.addEventListener('kite_db_updated', handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);
    return () => {
      window.removeEventListener('kite_db_updated', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, []);

  const settings = db.settings?.biometricSettings || {};
  const allLogs = db.biometricLogs || [];
  const students = db.students || [];
  const trainers = db.trainers || [];
  const groups = db.trainingGroups || [];

  // Filter logs for stream view
  const filteredLogs = useMemo(() => {
    return allLogs.filter((log) => {
      if (selectedDate && log.date !== selectedDate) return false;
      if (roleFilter !== 'ALL' && log.role !== roleFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          (log.name && log.name.toLowerCase().includes(q)) ||
          (log.biometricId && String(log.biometricId).toLowerCase().includes(q)) ||
          (log.device && log.device.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [allLogs, selectedDate, roleFilter, searchQuery]);

  // Today's attendances from db.attendances
  const todayAttendances = useMemo(() => {
    return (db.attendances || []).filter((a) => a.date === selectedDate);
  }, [db.attendances, selectedDate]);

  // Statistics calculation
  const stats = useMemo(() => {
    const todayLogs = allLogs.filter((l) => l.date === selectedDate);
    const totalPunches = todayLogs.length;

    const presentStudentsCount = todayAttendances.filter(
      (a) => a.status === 'present' || a.status === 'P' || a.status === 'late' || a.status === 'L'
    ).length;

    const biometricCount = todayAttendances.filter((a) => a.source === 'BIOMETRIC').length;
    const manualCount = todayAttendances.filter((a) => a.source === 'TRAINER_MANUAL' || a.source === 'ADMIN_MANUAL').length;

    const lateCount = todayAttendances.filter((a) => a.status === 'late' || a.status === 'L').length;
    const totalEnrolled = students.length;
    const attPercent = totalEnrolled > 0 ? Math.round((presentStudentsCount / totalEnrolled) * 100) : 0;

    return {
      totalPunches,
      presentStudentsCount,
      totalEnrolled,
      attPercent,
      biometricCount,
      manualCount,
      lateCount
    };
  }, [allLogs, todayAttendances, selectedDate, students.length]);

  // Handle Instant Sync
  const handleInstantSync = () => {
    const res = syncBiometricAttendance(selectedDate);
    const refreshed = loadDB();
    setDb(refreshed);
    if (soundEnabled) {
      playBiometricBeep(true);
    }
    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } catch (_) {}
    alert(`📡 Biometric machine sync successful!\nSynced ${res.syncedCount} new logs.`);
  };

  // Handle Live Thumb / RFID Simulation
  const handleRunSimulation = () => {
    if (!simTargetId) {
      alert('Please select a trainee or trainer.');
      return;
    }

    let targetName = 'Enrolled User';
    let targetBioId = simTargetId;
    let role = simTargetRole;

    if (role === 'STUDENT') {
      const s = students.find((x) => x.id === simTargetId || String(x.biometricId) === String(simTargetId));
      if (s) {
        targetName = s.name;
        targetBioId = s.biometricId || s.id;
      }
    } else if (role === 'TRAINER') {
      const t = trainers.find((x) => x.id === simTargetId || String(x.biometricId) === String(simTargetId));
      if (t) {
        targetName = t.name;
        targetBioId = t.biometricId || t.id;
      }
    }

    recordLiveBiometricPunch({
      biometricId: targetBioId,
      name: targetName,
      role: role,
      device: `${settings.deviceName || 'ZKTeco K40 WiFi / RFID'} (Gate Scan)`,
      playSound: soundEnabled
    });

    const refreshed = loadDB();
    setDb(refreshed);
    setOpenSimulateModal(false);

    try {
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
    } catch (_) {}
  };

  // Handle Instant USB RFID Card Tap or Machine ID Scan
  const handleQuickRfidPunch = (e) => {
    if (e) e.preventDefault();
    const rawCode = rfidQuickInput.trim();
    if (!rawCode) return;

    const newLog = recordLiveBiometricPunch({
      biometricId: rawCode,
      device: 'RFID / Biometric Gate Scanner',
      playSound: soundEnabled
    });

    const refreshed = loadDB();
    setDb(refreshed);
    setRfidQuickInput('');
    setRfidFeedback({
      name: newLog.name,
      biometricId: newLog.biometricId,
      time: newLog.timestamp,
      role: newLog.role
    });
    setTimeout(() => setRfidFeedback(null), 5000);

    try {
      confetti({ particleCount: 45, spread: 55, origin: { y: 0.75 } });
    } catch (_) {}
  };

  // Trainer / Admin Manual override for an unpunched student
  const handleManualMark = (student, group, targetStatus = 'present') => {
    const existingIdx = (db.attendances || []).findIndex(
      (a) => a.studentId === student.id && a.date === selectedDate && a.groupId === group.id
    );

    const recordObj = {
      id: existingIdx >= 0 ? db.attendances[existingIdx].id : `ATT-MAN-${Date.now()}-${student.id}`,
      groupId: group.id,
      studentId: student.id,
      date: selectedDate,
      status: targetStatus,
      source: 'ADMIN_MANUAL',
      checkInTime: formatPunchTime(),
      biometricId: student.biometricId || '',
      verifiedBy: `${currentUser?.name || 'Administrator'} (Manual Check-in)`,
      remarks: 'Administrative manual check-in'
    };

    let nextAttendances = [...(db.attendances || [])];
    if (existingIdx >= 0) {
      nextAttendances[existingIdx] = recordObj;
    } else {
      nextAttendances.unshift(recordObj);
    }

    const nextDb = { ...db, attendances: nextAttendances };
    saveDB(nextDb);
    setDb(nextDb);

    if (soundEnabled) {
      playBiometricBeep(true);
    }
  };

  // Fullscreen toggle handler
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2.2 }, width: '100%' }}>
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
                <FingerprintIcon sx={{ fontSize: 20, color: '#fbbf24' }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="subtitle1"
                  noWrap
                  sx={{ fontWeight: 800, color: '#ffffff', fontSize: { xs: '0.96rem', sm: '1.06rem' }, lineHeight: 1.2 }}
                >
                  Live Attendance Command Center
                </Typography>
                <Typography
                  variant="caption"
                  noWrap
                  sx={{ color: '#cbd5e1', display: 'block', fontSize: '0.73rem', mt: 0.15 }}
                >
                  Prabidhik School, Jorpati • {settings.status === 'Online' ? 'Machine Online' : 'Machine Offline'} ({settings.deviceIp || '192.168.1.201'}) • {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                </Typography>
              </Box>
            </Stack>
          </Grid>

          <Grid item xs={12} md={6} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', md: 'flex-end' }} alignItems="center" flexWrap="wrap" useFlexGap>
              <IconButton
                size="small"
                onClick={() => setSoundEnabled(!soundEnabled)}
                sx={{ color: soundEnabled ? '#34D399' : '#94A3B8', bgcolor: 'rgba(255,255,255,0.1)', p: 0.6 }}
                title={soundEnabled ? 'Sound On' : 'Muted'}
              >
                {soundEnabled ? <VolumeUpIcon sx={{ fontSize: 16 }} /> : <VolumeOffIcon sx={{ fontSize: 16 }} />}
              </IconButton>

              <Button
                variant="outlined"
                size="small"
                startIcon={<PlayArrowIcon sx={{ fontSize: '15px !important', color: '#fbbf24' }} />}
                onClick={() => setOpenSimulateModal(true)}
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
                Scan Test
              </Button>

              <Button
                variant="outlined"
                size="small"
                startIcon={isFullscreen ? <FullscreenExitIcon sx={{ fontSize: '15px !important' }} /> : <FullscreenIcon sx={{ fontSize: '15px !important' }} />}
                onClick={handleToggleFullscreen}
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
                TV / Kiosk Mode
              </Button>

              <Button
                variant="contained"
                size="small"
                startIcon={<RefreshIcon sx={{ fontSize: '15px !important' }} />}
                onClick={handleInstantSync}
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
                Sync Machine Now
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Card>

      {/* 2. REAL-TIME 4 COMPACT KPI STAT METRIC CARDS */}
      <Grid container spacing={1.5} sx={{ mb: 1.75 }}>
        {/* Card 1: Today's Total Enrolled Present */}
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
                  Attendance Rate
                </Typography>
                <Typography sx={{ fontWeight: 800, color: '#059669', fontSize: '1.22rem', lineHeight: 1.2, mt: 0.2 }}>
                  {stats.attPercent}%
                </Typography>
                <Typography variant="caption" noWrap sx={{ color: '#059669', fontWeight: 600, fontSize: '0.68rem', display: 'block' }}>
                  {stats.presentStudentsCount} / {stats.totalEnrolled} Trainees Present
                </Typography>
              </Box>
              <Box sx={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#ecfdf5', borderRadius: 1.5, color: '#059669', flexShrink: 0 }}>
                <SchoolIcon sx={{ fontSize: 18 }} />
              </Box>
            </Stack>
          </Card>
        </Grid>

        {/* Card 2: On-Time Arrivals */}
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
                  On-Time Arrivals
                </Typography>
                <Typography sx={{ fontWeight: 800, color: '#0284c7', fontSize: '1.22rem', lineHeight: 1.2, mt: 0.2 }}>
                  {stats.presentStudentsCount - stats.lateCount}
                </Typography>
                <Typography variant="caption" noWrap sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.68rem', display: 'block' }}>
                  Verified within grace
                </Typography>
              </Box>
              <Box sx={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f0f9ff', borderRadius: 1.5, color: '#0284c7', flexShrink: 0 }}>
                <CheckCircleIcon sx={{ fontSize: 18 }} />
              </Box>
            </Stack>
          </Card>
        </Grid>

        {/* Card 3: Late Check-ins */}
        <Grid item xs={6} md={3}>
          <Card
            elevation={0}
            sx={{
              p: 1.4,
              borderRadius: 2,
              border: '1px solid #e2e8f0',
              borderLeft: '3.5px solid #f59e0b',
              bgcolor: '#ffffff'
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" noWrap sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontSize: '0.66rem', letterSpacing: '0.03em', display: 'block' }}>
                  Late Arrivals
                </Typography>
                <Typography sx={{ fontWeight: 800, color: '#d97706', fontSize: '1.22rem', lineHeight: 1.2, mt: 0.2 }}>
                  {stats.lateCount}
                </Typography>
                <Typography variant="caption" noWrap sx={{ color: '#d97706', fontWeight: 600, fontSize: '0.68rem', display: 'block' }}>
                  After grace window
                </Typography>
              </Box>
              <Box sx={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#fffbeb', borderRadius: 1.5, color: '#d97706', flexShrink: 0 }}>
                <AccessTimeIcon sx={{ fontSize: 18 }} />
              </Box>
            </Stack>
          </Card>
        </Grid>

        {/* Card 4: Verification Source Ratio */}
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
                  Verification Source
                </Typography>
                <Typography noWrap sx={{ fontWeight: 800, color: '#0f2e5a', fontSize: '1.15rem', lineHeight: 1.2, mt: 0.2 }}>
                  {stats.biometricCount} Bio / {stats.manualCount} Man
                </Typography>
                <Typography variant="caption" noWrap sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.68rem', display: 'block' }}>
                  {stats.presentStudentsCount > 0 ? Math.round((stats.biometricCount / stats.presentStudentsCount) * 100) : 0}% Biometric Thumb
                </Typography>
              </Box>
              <Box sx={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#eff6ff', borderRadius: 1.5, color: '#1e40af', flexShrink: 0 }}>
                <FingerprintIcon sx={{ fontSize: 18 }} />
              </Box>
            </Stack>
          </Card>
        </Grid>
      </Grid>

      {/* =======================================================
          3. NAVIGATION TABS (ALL LIVE STREAM, TRAINEES, TRAINERS, STAFF)
          ======================================================= */}
      <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid #E2E8F0', overflow: 'hidden', mb: 2 }}>
        <Box sx={{ bgcolor: '#F8FAFC', px: 1.5, borderBottom: '1px solid #E2E8F0' }}>
          <Tabs
            value={activeTab}
            onChange={(e, val) => setActiveTab(val)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 42,
              '& .MuiTabs-indicator': { height: 3, bgcolor: '#0F2E5A', borderRadius: '3px 3px 0 0' },
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 800,
                fontSize: '0.84rem',
                py: 1,
                minHeight: 42,
                color: '#64748B',
                '&.Mui-selected': { color: '#0F2E5A' }
              }
            }}
          >
            <Tab
              icon={<FingerprintIcon sx={{ fontSize: 18 }} />}
              iconPosition="start"
              label={`Live Stream (${filteredLogs.length} Scans)`}
            />
            <Tab
              icon={<SchoolIcon sx={{ fontSize: 18 }} />}
              iconPosition="start"
              label={`Trainees Attendance (${students.length})`}
            />
            <Tab
              icon={<PersonIcon sx={{ fontSize: 18 }} />}
              iconPosition="start"
              label={`Trainers Attendance (${trainers.length})`}
            />
            <Tab
              icon={<BusinessIcon sx={{ fontSize: 18 }} />}
              iconPosition="start"
              label="Staff Attendance"
            />
          </Tabs>
        </Box>

        <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
          {/* =======================================================
              TAB 0: ALL LIVE PUNCH STREAM (Live Stream)
              ======================================================= */}
          {activeTab === 0 && (
            <Box>
              {/* Instant RFID Card / Biometric ID Quick-Scan Bar */}
              <Paper
                component="form"
                onSubmit={handleQuickRfidPunch}
                elevation={0}
                sx={{
                  p: 1.25,
                  mb: 1.75,
                  borderRadius: 2,
                  bgcolor: '#F8FAFC',
                  border: '1px dashed #93C5FD',
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { xs: 'stretch', sm: 'center' },
                  justifyContent: 'space-between',
                  gap: 1.25
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FingerprintIcon sx={{ color: '#0F2E5A', fontSize: 20 }} />
                  <Box>
                    <Typography sx={{ fontWeight: 800, color: '#0F2E5A', fontSize: '0.82rem', lineHeight: 1.2 }}>
                      Instant RFID Card / Biometric ID Punch
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.7rem' }}>
                      Tap USB RFID card reader or enter Biometric ID (#1001, #2001, TGID-101) and press Enter
                    </Typography>
                  </Box>
                </Box>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: { sm: 320 } }}>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="Biometric ID / Tap RFID Card (e.g. 1001)..."
                    value={rfidQuickInput}
                    onChange={(e) => setRfidQuickInput(e.target.value)}
                    sx={{ bgcolor: '#FFFFFF' }}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    size="small"
                    sx={{
                      bgcolor: '#0F2E5A',
                      fontWeight: 800,
                      fontSize: '0.76rem',
                      textTransform: 'none',
                      whiteSpace: 'nowrap',
                      px: 1.5,
                      py: 0.7,
                      boxShadow: 'none',
                      '&:hover': { bgcolor: '#1E3A8A' }
                    }}
                  >
                    Record Punch
                  </Button>
                </Stack>
              </Paper>

              {rfidFeedback && (
                <Alert
                  severity="success"
                  onClose={() => setRfidFeedback(null)}
                  sx={{ mb: 1.75, py: 0.4, fontWeight: 700, fontSize: '0.78rem', borderRadius: 2 }}
                >
                  Verified: {rfidFeedback.name} (#{rfidFeedback.biometricId}) at {rfidFeedback.time}
                </Alert>
              )}

              {/* Controls Bar */}
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
                  <Grid item xs={12} sm={4}>
                    <TextField
                      size="small"
                      fullWidth
                      placeholder="Search Name, Biometric ID, Device..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon sx={{ color: '#94A3B8', fontSize: 18 }} />
                          </InputAdornment>
                        )
                      }}
                    />
                  </Grid>

                  <Grid item xs={6} sm={2.5}>
                    <TextField
                      type="date"
                      size="small"
                      fullWidth
                      label="Select Date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>

                  <Grid item xs={6} sm={3.5}>
                    <ToggleButtonGroup
                      value={roleFilter}
                      exclusive
                      onChange={(e, val) => val && setRoleFilter(val)}
                      size="small"
                      fullWidth
                    >
                      <ToggleButton value="ALL" sx={{ fontWeight: 800, textTransform: 'none', fontSize: '0.74rem' }}>
                        All ({allLogs.filter((l) => l.date === selectedDate).length})
                      </ToggleButton>
                      <ToggleButton value="STUDENT" sx={{ fontWeight: 800, textTransform: 'none', fontSize: '0.74rem' }}>
                        Trainee
                      </ToggleButton>
                      <ToggleButton value="TRAINER" sx={{ fontWeight: 800, textTransform: 'none', fontSize: '0.74rem' }}>
                        Trainer
                      </ToggleButton>
                      <ToggleButton value="STAFF" sx={{ fontWeight: 800, textTransform: 'none', fontSize: '0.74rem' }}>
                        Staff
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Grid>

                  <Grid item xs={12} sm={2}>
                    <Button
                      variant="outlined"
                      fullWidth
                      size="small"
                      onClick={() => {
                        setSearchQuery('');
                        setRoleFilter('ALL');
                        setSelectedDate(todayStr);
                      }}
                      sx={{ fontWeight: 700, borderRadius: 1.5, py: 0.65, fontSize: '0.76rem', color: '#0F2E5A', borderColor: '#CBD5E1' }}
                    >
                      Reset Filters
                    </Button>
                  </Grid>
                </Grid>
              </Card>

              {/* Punch Stream Table */}
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
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
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800, width: 120 }}>
                        Machine ID
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800 }}>
                        User Name &amp; Details
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800, textAlign: 'center', width: 120 }}>
                        Role
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800, width: 150 }}>
                        Check-in Time
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800, textAlign: 'center', width: 140 }}>
                        Verification Status
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800 }}>
                        Device
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredLogs.map((log, idx) => {
                      const isLate = log.timestamp && log.timestamp > '07:15:00 AM' && log.role === 'STUDENT';
                      return (
                        <TableRow key={log.id || idx} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#F8FAFC' } }}>
                          <TableCell sx={{ textAlign: 'center', fontWeight: 700, color: '#64748B', fontSize: '0.75rem' }}>
                            {idx + 1}
                          </TableCell>

                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                            <Chip
                              icon={<FingerprintIcon sx={{ fontSize: '12px !important', color: '#0F2E5A !important' }} />}
                              label={`#${log.biometricId}`}
                              size="small"
                              sx={{ height: 20, fontSize: '0.68rem', fontWeight: 800, bgcolor: '#EEF2F6', color: '#0F2E5A' }}
                            />
                          </TableCell>

                          <TableCell>
                            <Typography sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.8rem', lineHeight: 1.25 }}>
                              {log.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.69rem' }}>
                              Date: {log.date}
                            </Typography>
                          </TableCell>

                          <TableCell sx={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                            <Chip
                              label={
                                log.role === 'STUDENT'
                                  ? 'Trainee'
                                  : log.role === 'TRAINER'
                                  ? 'Trainer'
                                  : 'Staff'
                              }
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                bgcolor:
                                  log.role === 'STUDENT'
                                    ? '#DCFCE7'
                                    : log.role === 'TRAINER'
                                    ? '#FEF3C7'
                                    : '#E0E7FF',
                                color:
                                  log.role === 'STUDENT'
                                    ? '#15803D'
                                    : log.role === 'TRAINER'
                                    ? '#92400E'
                                    : '#3730A3'
                              }}
                            />
                          </TableCell>

                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                            <Typography sx={{ fontWeight: 800, color: '#0F2E5A', fontSize: '0.78rem' }}>
                              🕒 {log.timestamp}
                            </Typography>
                          </TableCell>

                          <TableCell sx={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                            <Chip
                              label={isLate ? '🟠 Late' : '🟢 On-time'}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                bgcolor: isLate ? '#FFF7ED' : '#F0FDF4',
                                color: isLate ? '#C2410C' : '#166534',
                                border: `1px solid ${isLate ? '#FFEDD5' : '#BBF7D0'}`
                              }}
                            />
                          </TableCell>

                          <TableCell>
                            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.72rem' }}>
                              {log.device || 'Prabidhik School ZKTeco K40 WiFi'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}

                    {filteredLogs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} sx={{ textAlign: 'center', py: 3.5, color: '#64748b', fontSize: '0.8rem' }}>
                          No live punch records found for the selected date and filters.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* =======================================================
              TAB 1: TRAINEES LIVE ROSTER (Trainee Roster)
              ======================================================= */}
          {activeTab === 1 && (
            <Box>
              {/* Batch Selector Bar */}
              <Card
                elevation={0}
                sx={{
                  p: 1.25,
                  mb: 1.75,
                  borderRadius: 2,
                  border: '1px solid #e2e8f0',
                  bgcolor: '#ffffff',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 1.25
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
                  <TextField
                    select
                    size="small"
                    label="Batch / Group"
                    value={selectedBatchId}
                    onChange={(e) => setSelectedBatchId(e.target.value)}
                    sx={{ minWidth: 220, bgcolor: '#FFFFFF' }}
                  >
                    <MenuItem value="ALL">-- All Batches --</MenuItem>
                    {groups.map((grp) => (
                      <MenuItem key={grp.id} value={grp.id}>
                        {grp.groupCode} — Shift {grp.shift} ({grp.startTime})
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    type="date"
                    size="small"
                    label="Date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ bgcolor: '#FFFFFF' }}
                  />
                </Box>

                <Button
                  variant="contained"
                  size="small"
                  onClick={() => onNavigate && onNavigate('attendance')}
                  endIcon={<ArrowForwardIcon sx={{ fontSize: '15px !important' }} />}
                  sx={{ fontWeight: 800, bgcolor: '#0F2E5A', textTransform: 'none', borderRadius: 1.5, fontSize: '0.76rem', px: 1.4, py: 0.65, boxShadow: 'none' }}
                >
                  Open Attendance Register
                </Button>
              </Card>

              {/* Trainee Roster Table */}
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
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
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800 }}>
                        Trainee Name &amp; Details
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800 }}>
                        Batch &amp; Shift
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800, textAlign: 'center', width: 120 }}>
                        Machine ID
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800, textAlign: 'center', width: 140 }}>
                        Today&apos;s Status
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800 }}>
                        Check-in Time &amp; Source
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800, textAlign: 'right' }}>
                        Quick Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {students
                      .filter((s) => selectedBatchId === 'ALL' || s.groupId === selectedBatchId)
                      .map((std, idx) => {
                        const grp = groups.find((g) => g.id === std.groupId);
                        const att = todayAttendances.find((a) => a.studentId === std.id && a.groupId === std.groupId);
                        const isPresent = att && (att.status === 'present' || att.status === 'P');
                        const isLate = att && (att.status === 'late' || att.status === 'L');

                        return (
                          <TableRow key={std.id} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#F8FAFC' } }}>
                            <TableCell sx={{ textAlign: 'center', fontWeight: 700, color: '#64748B', fontSize: '0.75rem' }}>
                              {idx + 1}
                            </TableCell>

                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar src={std.photoUrl} sx={{ width: 28, height: 28, fontSize: '0.75rem', bgcolor: '#0F2E5A' }}>
                                  {std.name[0]}
                                </Avatar>
                                <Box>
                                  <Typography sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.8rem', lineHeight: 1.2 }}>
                                    {std.name}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.69rem' }}>
                                    {std.tgid} • {std.phone}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>

                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
                              <Chip
                                label={grp?.groupCode || 'Unassigned'}
                                size="small"
                                sx={{ height: 20, fontSize: '0.68rem', fontWeight: 800, bgcolor: '#0F2E5A', color: '#FFFFFF', mb: 0.2 }}
                              />
                              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.68rem' }}>
                                Shift {grp?.shift || 'A'} ({grp?.startTime || '07:00 AM'})
                              </Typography>
                            </TableCell>

                            <TableCell sx={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                              <Chip
                                icon={<FingerprintIcon sx={{ fontSize: '11px !important', color: '#0F2E5A !important' }} />}
                                label={`#${std.biometricId || 'N/A'}`}
                                size="small"
                                sx={{ height: 20, fontSize: '0.68rem', fontWeight: 800, bgcolor: '#EEF2F6', color: '#0F2E5A' }}
                              />
                            </TableCell>

                            <TableCell sx={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                              <Chip
                                label={
                                  isPresent
                                    ? '🟢 Present'
                                    : isLate
                                    ? '🟠 Late'
                                    : '🔴 Absent / Pending'
                                }
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: '0.68rem',
                                  fontWeight: 800,
                                  bgcolor: isPresent ? '#DCFCE7' : isLate ? '#FFF7ED' : '#FEE2E2',
                                  color: isPresent ? '#15803D' : isLate ? '#C2410C' : '#B91C1C'
                                }}
                              />
                            </TableCell>

                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
                              {att ? (
                                <Box>
                                  <Typography sx={{ fontWeight: 800, color: '#0F2E5A', fontSize: '0.78rem' }}>
                                    🕒 {att.checkInTime || 'On-time'}
                                  </Typography>
                                  <Chip
                                    size="small"
                                    label={
                                      att.source === 'BIOMETRIC'
                                        ? 'Biometric Thumb'
                                        : 'Trainer Manual'
                                    }
                                    sx={{
                                      height: 18,
                                      fontSize: '0.62rem',
                                      fontWeight: 800,
                                      bgcolor: att.source === 'BIOMETRIC' ? '#DCFCE7' : '#FEF3C7',
                                      color: att.source === 'BIOMETRIC' ? '#15803D' : '#92400E',
                                      mt: 0.2
                                    }}
                                  />
                                </Box>
                              ) : (
                                <Typography variant="caption" sx={{ color: '#94A3B8', fontStyle: 'italic', fontSize: '0.7rem' }}>
                                  No gate thumb scan yet
                                </Typography>
                              )}
                            </TableCell>

                            <TableCell sx={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                              <Stack direction="row" spacing={0.6} justifyContent="flex-end" alignItems="center">
                                {!att && (
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => handleManualMark(std, grp, 'present')}
                                    sx={{
                                      fontWeight: 700,
                                      fontSize: '0.7rem',
                                      px: 0.9,
                                      py: 0.3,
                                      whiteSpace: 'nowrap',
                                      borderRadius: 1.5,
                                      color: '#10B981',
                                      borderColor: '#10B981'
                                    }}
                                  >
                                    Mark Present
                                  </Button>
                                )}

                                {!att && (
                                  <Tooltip title="Send absence WhatsApp notification to guardian">
                                    <IconButton
                                      size="small"
                                      component="a"
                                      href={getWhatsAppUrl(
                                        std.guardianContact || std.phone,
                                        `Namaste, from Prabidhik School, Jorpati. Trainee ${std.name} (${std.tgid}) has not yet checked in for today's session on ${selectedDate}.`
                                      )}
                                      target="_blank"
                                      sx={{ color: '#25D366', bgcolor: '#DCFCE7', p: 0.45 }}
                                    >
                                      <WhatsAppIcon sx={{ fontSize: 15 }} />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </Stack>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* =======================================================
              TAB 2: TRAINERS LIVE ROSTER (Trainer Attendance)
              ======================================================= */}
          {activeTab === 2 && (
            <Box>
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
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
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800 }}>
                        Trainer
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800, textAlign: 'center', width: 120 }}>
                        Machine ID
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800 }}>
                        Specialization &amp; Subject
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800, textAlign: 'center', width: 140 }}>
                        Check-in Time
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800, textAlign: 'center', width: 140 }}>
                        Attendance Status
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800, textAlign: 'right' }}>
                        Contact (WhatsApp)
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {trainers.map((trn, idx) => {
                      const punch = allLogs.find(
                        (l) => l.date === selectedDate && (String(l.biometricId) === String(trn.biometricId) || l.name?.includes(trn.name))
                      );

                      return (
                        <TableRow key={trn.id} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#F8FAFC' } }}>
                          <TableCell sx={{ textAlign: 'center', fontWeight: 700, color: '#64748B', fontSize: '0.75rem' }}>
                            {idx + 1}
                          </TableCell>

                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar src={trn.photo} sx={{ width: 28, height: 28, fontSize: '0.75rem', bgcolor: '#0F2E5A' }}>
                                {trn.name[0]}
                              </Avatar>
                              <Box>
                                <Typography sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.8rem', lineHeight: 1.2 }}>
                                  {trn.name}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.69rem' }}>
                                  {trn.phone}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>

                          <TableCell sx={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                            <Chip
                              icon={<FingerprintIcon sx={{ fontSize: '11px !important', color: '#0F2E5A !important' }} />}
                              label={`#${trn.biometricId || '2001'}`}
                              size="small"
                              sx={{ height: 20, fontSize: '0.68rem', fontWeight: 800, bgcolor: '#EEF2F6', color: '#0F2E5A' }}
                            />
                          </TableCell>

                          <TableCell>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#1e293b' }}>
                              {trn.specialization}
                            </Typography>
                          </TableCell>

                          <TableCell sx={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                            {punch ? (
                              <Typography sx={{ fontWeight: 800, color: '#0F2E5A', fontSize: '0.78rem' }}>
                                🕒 {punch.timestamp}
                              </Typography>
                            ) : (
                              <Typography variant="caption" sx={{ color: '#94A3B8', fontStyle: 'italic', fontSize: '0.7rem' }}>
                                Not scanned yet
                              </Typography>
                            )}
                          </TableCell>

                          <TableCell sx={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                            <Chip
                              label={punch ? '🟢 Present' : '🔴 Absent / Pending'}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                bgcolor: punch ? '#DCFCE7' : '#FEE2E2',
                                color: punch ? '#15803D' : '#B91C1C'
                              }}
                            />
                          </TableCell>

                          <TableCell sx={{ textAlign: 'right' }}>
                            <IconButton
                              size="small"
                              component="a"
                              href={getWhatsAppUrl(trn.phone, `Namaste ${trn.name}, update regarding today's class session and attendance schedule.`)}
                              target="_blank"
                              sx={{ color: '#25D366', bgcolor: '#DCFCE7', p: 0.45 }}
                            >
                              <WhatsAppIcon sx={{ fontSize: 15 }} />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* =======================================================
              TAB 3: STAFF LIVE ROSTER (Staff Attendance)
              ======================================================= */}
          {activeTab === 3 && (
            <Box>
              <Alert severity="info" sx={{ mb: 1.75, py: 0.4, borderRadius: 2, fontWeight: 700, fontSize: '0.78rem' }}>
                ℹ️ Daily biometric attendance roster for administrative, accounts, and front desk personnel
              </Alert>

              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
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
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800 }}>
                        Staff Name
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800, textAlign: 'center', width: 120 }}>
                        Machine ID
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800 }}>
                        Role &amp; Department
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800, textAlign: 'center', width: 150 }}>
                        Check-in Time
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800, textAlign: 'center', width: 200 }}>
                        Status / Action
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[
                      { id: 'STF-01', name: 'Gokarna Thapa', bioId: '3001', role: 'Campus Chief / Director', defaultTime: '06:45 AM' },
                      { id: 'STF-02', name: 'Reception & Inquiry Officer', bioId: '3002', role: 'Front Desk / Admissions', defaultTime: '06:50 AM' },
                      { id: 'STF-03', name: 'Accountant Staff', bioId: '3003', role: 'Accounts & Cashier', defaultTime: '06:55 AM' }
                    ].map((stf, idx) => {
                      const staffLog = allLogs.find(
                        (l) => l.date === selectedDate && (String(l.biometricId) === stf.bioId || l.entityId === stf.id)
                      );
                      const checkInTime = staffLog ? (staffLog.timestamp || staffLog.punchTime12h) : null;
                      const isPresent = Boolean(checkInTime);
                      return (
                        <TableRow key={stf.id} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#F8FAFC' } }}>
                          <TableCell sx={{ textAlign: 'center', fontWeight: 700, color: '#64748B', fontSize: '0.75rem' }}>
                            {idx + 1}
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#0f172a' }}>
                              {stf.name}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                            <Chip
                              icon={<FingerprintIcon sx={{ fontSize: '11px !important', color: '#0F2E5A !important' }} />}
                              label={`#${stf.bioId}`}
                              size="small"
                              sx={{ height: 20, fontSize: '0.68rem', fontWeight: 800, bgcolor: '#EEF2F6', color: '#0F2E5A' }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#334155' }}>
                              {stf.role}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                            <Typography sx={{ fontWeight: 800, fontSize: '0.78rem', color: isPresent ? '#0F2E5A' : '#94A3B8' }}>
                              {isPresent ? `🕒 ${checkInTime}` : '— Awaiting Biometric —'}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                            <Stack direction="row" spacing={0.8} justifyContent="center" alignItems="center">
                              <Chip
                                label={isPresent ? '🟢 Present' : '⏳ Pending'}
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: '0.68rem',
                                  fontWeight: 800,
                                  bgcolor: isPresent ? '#DCFCE7' : '#F1F5F9',
                                  color: isPresent ? '#15803D' : '#64748B'
                                }}
                              />
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => {
                                  recordLiveBiometricPunch({
                                    biometricId: stf.bioId,
                                    name: stf.name,
                                    role: 'STAFF',
                                    device: `${settings.deviceName || 'ZKTeco K40'} (Staff Gate)`,
                                    playSound: soundEnabled
                                  });
                                  setDb(loadDB());
                                }}
                                sx={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'none', py: 0.3, px: 0.9, whiteSpace: 'nowrap' }}
                              >
                                Punch
                              </Button>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* =======================================================
          MODAL: LIVE THUMB PUNCH SIMULATION TEST
          ======================================================= */}
      <Dialog open={openSimulateModal} onClose={() => setOpenSimulateModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 900, bgcolor: '#0F2E5A', color: '#FFFFFF' }}>
          🧪 Live Thumb Scan Simulator
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body2" sx={{ color: '#475569', mb: 2 }}>
            Simulate biometric thumb scans to test verification flows and real-time audio confirmation.
          </Typography>

          <Stack spacing={2.2} sx={{ mt: 1 }}>
            <ToggleButtonGroup
              value={simTargetRole}
              exclusive
              onChange={(e, val) => val && setSimTargetRole(val)}
              size="small"
              fullWidth
            >
              <ToggleButton value="STUDENT" sx={{ fontWeight: 800 }}>
                Trainee
              </ToggleButton>
              <ToggleButton value="TRAINER" sx={{ fontWeight: 800 }}>
                Trainer
              </ToggleButton>
            </ToggleButtonGroup>

            {simTargetRole === 'STUDENT' ? (
              <TextField
                select
                label="Select Trainee"
                size="small"
                fullWidth
                value={simTargetId}
                onChange={(e) => setSimTargetId(e.target.value)}
              >
                {students.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name} (Machine ID: #{s.biometricId || '1001'}) — TGID: {s.tgid}
                  </MenuItem>
                ))}
              </TextField>
            ) : (
              <TextField
                select
                label="Select Trainer"
                size="small"
                fullWidth
                value={simTargetId}
                onChange={(e) => setSimTargetId(e.target.value)}
              >
                {trainers.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.name} (Machine ID: #{t.biometricId || '2001'}) — {t.specialization}
                  </MenuItem>
                ))}
              </TextField>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#F8FAFC' }}>
          <Button onClick={() => setOpenSimulateModal(false)} sx={{ fontWeight: 800 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<FingerprintIcon />}
            onClick={handleRunSimulation}
            sx={{ fontWeight: 900, bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' } }}
          >
            Simulate Thumb Scan
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
