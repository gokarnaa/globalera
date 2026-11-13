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
    <Box sx={{ width: '100%', pb: 5 }}>
      {/* =======================================================
          1. REAL-TIME HERO COMMAND BAR (DEEP NAVY GRADIENT)
          ======================================================= */}
      <Card
        sx={{
          mb: 3,
          borderRadius: 4,
          background: 'linear-gradient(135deg, #071933 0%, #0D284F 50%, #153E75 100%)',
          color: '#FFFFFF',
          p: { xs: 2.5, sm: 3.5 },
          boxShadow: '0 12px 35px rgba(7, 25, 51, 0.35)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Grid container spacing={3} alignItems="center">
          {/* Left Column: Brand & Device Information */}
          <Grid item xs={12} md={7} lg={7.5}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, flexWrap: 'wrap' }}>
              <Chip
                icon={<FingerprintIcon sx={{ fontSize: '15px !important', color: '#34D399 !important' }} />}
                label={settings.status === 'Online' ? 'Machine Online' : 'Machine Offline'}
                size="small"
                sx={{
                  bgcolor: 'rgba(16, 185, 129, 0.18)',
                  color: '#6EE7B7',
                  fontWeight: 900,
                  fontSize: '0.75rem',
                  border: '1px solid rgba(16, 185, 129, 0.35)'
                }}
              />
              <Chip
                label={`IP: ${settings.deviceIp || '192.168.1.201'}:${settings.devicePort || 4370}`}
                size="small"
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.12)',
                  color: '#BAE6FD',
                  fontWeight: 800,
                  fontSize: '0.73rem'
                }}
              />
              <Chip
                label={`Serial: ${settings.serialNo || 'ZK-GE-2026-8891'}`}
                size="small"
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.12)',
                  color: '#E2E8F0',
                  fontWeight: 800,
                  fontSize: '0.73rem'
                }}
              />
            </Box>

            <Typography
              variant="h4"
              sx={{
                fontWeight: 900,
                color: '#FFFFFF',
                fontSize: { xs: '1.4rem', sm: '1.85rem', md: '2.1rem' },
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                mb: 0.8
              }}
            >
              📡 Live Attendance Command Center
            </Typography>

            <Typography variant="body2" sx={{ color: '#CBD5E1', fontWeight: 600, fontSize: '0.9rem' }}>
              Real-time monitoring of ZKTeco WiFi Biometric, ADMS Cloud Push, and Trainer check-ins
            </Typography>

            {/* Quick Metadata Row */}
            <Box sx={{ display: 'flex', gap: 2.5, flexWrap: 'wrap', mt: 2 }}>
              <Typography variant="caption" sx={{ color: '#93C5FD', fontWeight: 700 }}>
                🕒 Last Sync: <b>{settings.lastSyncTime || 'Today, 07:45 AM'}</b>
              </Typography>
              <Typography variant="caption" sx={{ color: '#FCD34D', fontWeight: 700 }}>
                ⏰ Grace Period: <b>{settings.lateGraceMinutes || 15} mins</b>
              </Typography>
              <Typography variant="caption" sx={{ color: '#86EFAC', fontWeight: 700 }}>
                🏢 Campus: <b>Global Era Technical School, Jorpati</b>
              </Typography>
            </Box>
          </Grid>

          {/* Right Column: Digital Clock & 4 Fast Action Buttons */}
          <Grid item xs={12} md={5} lg={4.5}>
            <Box
              sx={{
                bgcolor: 'rgba(15, 30, 60, 0.7)',
                backdropFilter: 'blur(12px)',
                p: 2.5,
                borderRadius: 3.5,
                border: '1px solid rgba(255, 255, 255, 0.15)',
                textAlign: 'center'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" sx={{ color: '#93C5FD', fontWeight: 900, letterSpacing: '0.05em' }}>
                  ⏱️ LIVE CLOCK
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  sx={{ color: soundEnabled ? '#34D399' : '#94A3B8' }}
                  title={soundEnabled ? 'Sound On' : 'Muted'}
                >
                  {soundEnabled ? <VolumeUpIcon fontSize="small" /> : <VolumeOffIcon fontSize="small" />}
                </IconButton>
              </Box>

              <Typography
                variant="h3"
                sx={{
                  fontWeight: 900,
                  color: '#FFFFFF',
                  fontFamily: 'monospace',
                  fontSize: { xs: '1.9rem', sm: '2.3rem' },
                  letterSpacing: '0.05em'
                }}
              >
                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
              </Typography>

              <Typography variant="caption" sx={{ color: '#E2E8F0', display: 'block', mb: 2, fontWeight: 700 }}>
                {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </Typography>

              {/* Action Buttons */}
              <Stack spacing={1}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<RefreshIcon />}
                  onClick={handleInstantSync}
                  sx={{
                    fontWeight: 900,
                    bgcolor: '#10B981',
                    '&:hover': { bgcolor: '#059669' },
                    color: '#FFFFFF',
                    borderRadius: 2.5,
                    py: 1,
                    textTransform: 'none',
                    fontSize: '0.9rem'
                  }}
                >
                  📥 Sync Biometric Machine Now
                </Button>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    size="small"
                    startIcon={<PlayArrowIcon />}
                    onClick={() => setOpenSimulateModal(true)}
                    sx={{
                      fontWeight: 800,
                      color: '#FBBF24',
                      borderColor: '#FBBF24',
                      borderRadius: 2,
                      textTransform: 'none',
                      fontSize: '0.78rem',
                      '&:hover': { bgcolor: 'rgba(251, 191, 36, 0.1)', borderColor: '#F59E0B' }
                    }}
                  >
                    🧪 Scan Test
                  </Button>

                  <Button
                    variant="outlined"
                    fullWidth
                    size="small"
                    startIcon={isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                    onClick={handleToggleFullscreen}
                    sx={{
                      fontWeight: 800,
                      color: '#FFFFFF',
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      borderRadius: 2,
                      textTransform: 'none',
                      fontSize: '0.78rem',
                      '&:hover': { borderColor: '#FFFFFF', bgcolor: 'rgba(255, 255, 255, 0.1)' }
                    }}
                  >
                    🖥️ TV / Kiosk Mode
                  </Button>
                </Box>
              </Stack>
            </Box>
          </Grid>
        </Grid>
      </Card>

      {/* =======================================================
          2. REAL-TIME 4 KPI STAT METRIC CARDS
          ======================================================= */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {/* Card 1: Today's Total Enrolled Present */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              p: 2.5,
              borderRadius: 3.5,
              border: '1px solid #BBF7D0',
              bgcolor: '#F0FDF4',
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.08)'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Typography variant="overline" sx={{ color: '#166534', fontWeight: 900, fontSize: '0.72rem' }}>
                🎓 ATTENDANCE RATE
              </Typography>
              <Avatar sx={{ bgcolor: '#DCFCE7', color: '#15803D', width: 38, height: 38 }}>
                <SchoolIcon fontSize="small" />
              </Avatar>
            </Box>

            <Typography variant="h3" sx={{ fontWeight: 900, color: '#15803D', fontSize: '2.1rem', lineHeight: 1 }}>
              {stats.attPercent}%
            </Typography>

            <Typography variant="caption" sx={{ color: '#166534', fontWeight: 800, display: 'block', mt: 0.8 }}>
              • {stats.presentStudentsCount} / {stats.totalEnrolled} Trainees Present
            </Typography>

            <LinearProgress
              variant="determinate"
              value={Math.min(100, stats.attPercent)}
              sx={{
                height: 6,
                borderRadius: 3,
                mt: 1.5,
                bgcolor: '#DCFCE7',
                '& .MuiLinearProgress-bar': { bgcolor: '#10B981' }
              }}
            />
          </Card>
        </Grid>

        {/* Card 2: On-Time Arrivals */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              p: 2.5,
              borderRadius: 3.5,
              border: '1px solid #BAE6FD',
              bgcolor: '#F0F9FF',
              boxShadow: '0 4px 16px rgba(14, 165, 233, 0.08)'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Typography variant="overline" sx={{ color: '#075985', fontWeight: 900, fontSize: '0.72rem' }}>
                🟢 ON-TIME ARRIVALS
              </Typography>
              <Avatar sx={{ bgcolor: '#E0F2FE', color: '#0284C7', width: 38, height: 38 }}>
                <CheckCircleIcon fontSize="small" />
              </Avatar>
            </Box>

            <Typography variant="h3" sx={{ fontWeight: 900, color: '#0369A1', fontSize: '2.1rem', lineHeight: 1 }}>
              {stats.presentStudentsCount - stats.lateCount}
            </Typography>

            <Typography variant="caption" sx={{ color: '#0369A1', fontWeight: 800, display: 'block', mt: 0.8 }}>
              • Verified within shift grace window
            </Typography>

            <Box sx={{ mt: 1.5 }}>
              <Chip
                label="Punctual"
                size="small"
                sx={{ bgcolor: '#E0F2FE', color: '#0369A1', fontWeight: 800, fontSize: '0.68rem', height: 22 }}
              />
            </Box>
          </Card>
        </Grid>

        {/* Card 3: Late Check-ins */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              p: 2.5,
              borderRadius: 3.5,
              border: '1px solid #FED7AA',
              bgcolor: '#FFF7ED',
              boxShadow: '0 4px 16px rgba(245, 158, 11, 0.08)'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Typography variant="overline" sx={{ color: '#9A3412', fontWeight: 900, fontSize: '0.72rem' }}>
                🟠 LATE ARRIVALS
              </Typography>
              <Avatar sx={{ bgcolor: '#FFEDD5', color: '#C2410C', width: 38, height: 38 }}>
                <AccessTimeIcon fontSize="small" />
              </Avatar>
            </Box>

            <Typography variant="h3" sx={{ fontWeight: 900, color: '#C2410C', fontSize: '2.1rem', lineHeight: 1 }}>
              {stats.lateCount}
            </Typography>

            <Typography variant="caption" sx={{ color: '#C2410C', fontWeight: 800, display: 'block', mt: 0.8 }}>
              • Checked in after grace window
            </Typography>

            <Box sx={{ mt: 1.5 }}>
              <Chip
                label="Late Arrival"
                size="small"
                sx={{ bgcolor: '#FFEDD5', color: '#C2410C', fontWeight: 800, fontSize: '0.68rem', height: 22 }}
              />
            </Box>
          </Card>
        </Grid>

        {/* Card 4: Verification Source Ratio */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              p: 2.5,
              borderRadius: 3.5,
              border: '1px solid #E2E8F0',
              bgcolor: '#FFFFFF',
              boxShadow: '0 4px 16px rgba(15, 23, 42, 0.06)'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Typography variant="overline" sx={{ color: '#64748B', fontWeight: 900, fontSize: '0.72rem' }}>
                🛡️ VERIFICATION SOURCE
              </Typography>
              <Avatar sx={{ bgcolor: '#F1F5F9', color: '#0F2E5A', width: 38, height: 38 }}>
                <FingerprintIcon fontSize="small" />
              </Avatar>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#0F2E5A', lineHeight: 1 }}>
                {stats.biometricCount}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 800 }}>
                Biometric Thumb ({stats.presentStudentsCount > 0 ? Math.round((stats.biometricCount / stats.presentStudentsCount) * 100) : 0}%)
              </Typography>
            </Box>

            <Typography variant="caption" sx={{ color: '#92400E', fontWeight: 800, display: 'block', mt: 0.8 }}>
              • Trainer Manual: {stats.manualCount} trainees
            </Typography>

            <Box sx={{ mt: 1.5, display: 'flex', gap: 0.8 }}>
              <Chip
                icon={<FingerprintIcon sx={{ fontSize: '12px !important', color: '#15803D !important' }} />}
                label={`Biometric: ${stats.biometricCount}`}
                size="small"
                sx={{ bgcolor: '#DCFCE7', color: '#15803D', fontWeight: 800, fontSize: '0.68rem', height: 22 }}
              />
              <Chip
                label={`Manual: ${stats.manualCount}`}
                size="small"
                sx={{ bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 800, fontSize: '0.68rem', height: 22 }}
              />
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* =======================================================
          3. NAVIGATION TABS (ALL LIVE STREAM, TRAINEES, TRAINERS, STAFF)
          ======================================================= */}
      <Card sx={{ borderRadius: 3.5, border: '1px solid #E2E8F0', overflow: 'hidden', mb: 3 }}>
        <Box sx={{ bgcolor: '#F8FAFC', px: 2, pt: 1, borderBottom: '1px solid #E2E8F0' }}>
          <Tabs
            value={activeTab}
            onChange={(e, val) => setActiveTab(val)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTabs-indicator': { height: 3.5, bgcolor: '#0F2E5A', borderRadius: '3px 3px 0 0' },
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 900,
                fontSize: '0.94rem',
                py: 1.6,
                minHeight: 50,
                color: '#64748B',
                '&.Mui-selected': { color: '#0F2E5A' }
              }
            }}
          >
            <Tab
              icon={<FingerprintIcon sx={{ fontSize: 20 }} />}
              iconPosition="start"
              label={`🌐 Live Stream (${filteredLogs.length} Scans)`}
            />
            <Tab
              icon={<SchoolIcon sx={{ fontSize: 20 }} />}
              iconPosition="start"
              label={`🎓 Trainees Attendance (${students.length})`}
            />
            <Tab
              icon={<PersonIcon sx={{ fontSize: 20 }} />}
              iconPosition="start"
              label={`👨‍🏫 Trainers Attendance (${trainers.length})`}
            />
            <Tab
              icon={<BusinessIcon sx={{ fontSize: 20 }} />}
              iconPosition="start"
              label="🏢 Staff Attendance"
            />
          </Tabs>
        </Box>

        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
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
                  p: 1.5,
                  mb: 2,
                  borderRadius: 2.5,
                  bgcolor: '#F8FAFC',
                  border: '1px dashed #93C5FD',
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { xs: 'stretch', sm: 'center' },
                  justifyContent: 'space-between',
                  gap: 1.5
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                  <FingerprintIcon sx={{ color: '#0F2E5A', fontSize: 22 }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0F2E5A', lineHeight: 1.2 }}>
                      💳 Instant RFID Card / Biometric ID Punch
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                      Tap USB RFID card reader or enter Biometric ID (#1001, #2001, TGID-101) and press Enter
                    </Typography>
                  </Box>
                </Box>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: { sm: 340 } }}>
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
                    sx={{
                      bgcolor: '#0F2E5A',
                      fontWeight: 800,
                      textTransform: 'none',
                      whiteSpace: 'nowrap',
                      px: 2,
                      '&:hover': { bgcolor: '#1E3A8A' }
                    }}
                  >
                    Record Punch
                  </Button>
                </Stack>
              </Paper>

              {rfidFeedback && (
                <Alert
                  severity={rfidFeedback.type}
                  onClose={() => setRfidFeedback(null)}
                  sx={{ mb: 2, fontWeight: 800, borderRadius: 2 }}
                >
                  {rfidFeedback.message}
                </Alert>
              )}

              {/* Controls Bar */}
              <Grid container spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
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
                          <SearchIcon sx={{ color: '#94A3B8', fontSize: 20 }} />
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
                    <ToggleButton value="ALL" sx={{ fontWeight: 800, textTransform: 'none' }}>
                      All ({allLogs.filter((l) => l.date === selectedDate).length})
                    </ToggleButton>
                    <ToggleButton value="STUDENT" sx={{ fontWeight: 800, textTransform: 'none' }}>
                      Trainee
                    </ToggleButton>
                    <ToggleButton value="TRAINER" sx={{ fontWeight: 800, textTransform: 'none' }}>
                      Trainer
                    </ToggleButton>
                    <ToggleButton value="STAFF" sx={{ fontWeight: 800, textTransform: 'none' }}>
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
                    sx={{ fontWeight: 800, borderRadius: 2, py: 0.8, color: '#0F2E5A', borderColor: '#CBD5E1' }}
                  >
                    Reset Filters
                  </Button>
                </Grid>
              </Grid>

              {/* Punch Stream Table */}
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#0F2E5A' }}>
                    <TableRow>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, width: 60, textAlign: 'center' }}>
                        S.N.
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, width: 130 }}>
                        Machine ID
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>
                        User Name & Details
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, textAlign: 'center', width: 130 }}>
                        Role
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, width: 170 }}>
                        Check-in Time
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, textAlign: 'center', width: 160 }}>
                        Verification Status
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>
                        Device
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredLogs.map((log, idx) => {
                      const isLate = log.timestamp && log.timestamp > '07:15:00 AM' && log.role === 'STUDENT';
                      return (
                        <TableRow key={log.id || idx} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#F8FAFC' } }}>
                          <TableCell sx={{ textAlign: 'center', fontWeight: 800, color: '#64748B' }}>
                            {idx + 1}
                          </TableCell>

                          <TableCell>
                            <Chip
                              icon={<FingerprintIcon sx={{ fontSize: '13px !important', color: '#0F2E5A !important' }} />}
                              label={`#${log.biometricId}`}
                              size="small"
                              sx={{ fontWeight: 900, bgcolor: '#EEF2F6', color: '#0F2E5A' }}
                            />
                          </TableCell>

                          <TableCell>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                              {log.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748B' }}>
                              Date: {log.date}
                            </Typography>
                          </TableCell>

                          <TableCell sx={{ textAlign: 'center' }}>
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

                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F2E5A' }}>
                              🕒 {log.timestamp}
                            </Typography>
                          </TableCell>

                          <TableCell sx={{ textAlign: 'center' }}>
                            <Chip
                              label={isLate ? '🟠 Late' : '🟢 On-time'}
                              size="small"
                              sx={{
                                fontWeight: 800,
                                bgcolor: isLate ? '#FFF7ED' : '#F0FDF4',
                                color: isLate ? '#C2410C' : '#166534',
                                border: `1px solid ${isLate ? '#FFEDD5' : '#BBF7D0'}`
                              }}
                            />
                          </TableCell>

                          <TableCell>
                            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                              {log.device || 'Global Era ZKTeco K40 WiFi'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}

                    {filteredLogs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} sx={{ textAlign: 'center', py: 8, color: '#94A3B8' }}>
                          <FingerprintIcon sx={{ fontSize: 44, color: '#CBD5E1', mb: 1, display: 'block', mx: 'auto' }} />
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
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                  <TextField
                    select
                    size="small"
                    label="Batch / Group"
                    value={selectedBatchId}
                    onChange={(e) => setSelectedBatchId(e.target.value)}
                    sx={{ minWidth: 240, bgcolor: '#FFFFFF' }}
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
                  onClick={() => onNavigate && onNavigate('attendance')}
                  endIcon={<ArrowForwardIcon />}
                  sx={{ fontWeight: 800, bgcolor: '#0F2E5A', textTransform: 'none', borderRadius: 2 }}
                >
                  Open Attendance Register
                </Button>
              </Box>

              {/* Trainee Roster Table */}
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#0F2E5A' }}>
                    <TableRow>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, width: 60, textAlign: 'center' }}>
                        S.N.
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>
                        Trainee Name & Details
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>
                        Batch & Shift
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, textAlign: 'center', width: 140 }}>
                        Machine ID
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, textAlign: 'center', width: 160 }}>
                        Today's Status
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>
                        Check-in Time & Source
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, textAlign: 'right' }}>
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
                            <TableCell sx={{ textAlign: 'center', fontWeight: 800, color: '#64748B' }}>
                              {idx + 1}
                            </TableCell>

                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Avatar src={std.photoUrl} sx={{ width: 34, height: 34, bgcolor: '#0F2E5A' }}>
                                  {std.name[0]}
                                </Avatar>
                                <Box>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                                    {std.name}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                                    {std.tgid} • {std.phone}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>

                            <TableCell>
                              <Chip
                                label={grp?.groupCode || 'Unassigned'}
                                size="small"
                                sx={{ fontWeight: 800, bgcolor: '#0F2E5A', color: '#FFFFFF', mb: 0.3 }}
                              />
                              <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                                Shift {grp?.shift || 'A'} ({grp?.startTime || '07:00 AM'})
                              </Typography>
                            </TableCell>

                            <TableCell sx={{ textAlign: 'center' }}>
                              <Chip
                                icon={<FingerprintIcon sx={{ fontSize: '12px !important', color: '#0F2E5A !important' }} />}
                                label={`#${std.biometricId || 'N/A'}`}
                                size="small"
                                sx={{ fontWeight: 800, bgcolor: '#EEF2F6', color: '#0F2E5A' }}
                              />
                            </TableCell>

                            <TableCell sx={{ textAlign: 'center' }}>
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
                                  fontWeight: 800,
                                  bgcolor: isPresent ? '#DCFCE7' : isLate ? '#FFF7ED' : '#FEE2E2',
                                  color: isPresent ? '#15803D' : isLate ? '#C2410C' : '#B91C1C'
                                }}
                              />
                            </TableCell>

                            <TableCell>
                              {att ? (
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F2E5A' }}>
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
                                      fontSize: '0.64rem',
                                      fontWeight: 800,
                                      bgcolor: att.source === 'BIOMETRIC' ? '#DCFCE7' : '#FEF3C7',
                                      color: att.source === 'BIOMETRIC' ? '#15803D' : '#92400E',
                                      mt: 0.3
                                    }}
                                  />
                                </Box>
                              ) : (
                                <Typography variant="caption" sx={{ color: '#94A3B8', fontStyle: 'italic' }}>
                                  No gate thumb scan yet
                                </Typography>
                              )}
                            </TableCell>

                            <TableCell sx={{ textAlign: 'right' }}>
                              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                {!att && (
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => handleManualMark(std, grp, 'present')}
                                    sx={{
                                      fontWeight: 800,
                                      fontSize: '0.72rem',
                                      borderRadius: 1.5,
                                      color: '#10B981',
                                      borderColor: '#10B981',
                                      py: 0.4
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
                                        `Namaste, from Global Era Technical School. Trainee ${std.name} (${std.tgid}) has not yet checked in for today's session on ${selectedDate}.`
                                      )}
                                      target="_blank"
                                      sx={{ color: '#25D366', bgcolor: '#DCFCE7' }}
                                    >
                                      <WhatsAppIcon sx={{ fontSize: 18 }} />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </Box>
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
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#0F2E5A' }}>
                    <TableRow>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, width: 60, textAlign: 'center' }}>
                        S.N.
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>
                        Trainer
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, textAlign: 'center', width: 140 }}>
                        Machine ID
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>
                        Specialization & Subject
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, textAlign: 'center', width: 160 }}>
                        Check-in Time
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, textAlign: 'center', width: 150 }}>
                        Attendance Status
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, textAlign: 'right' }}>
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
                          <TableCell sx={{ textAlign: 'center', fontWeight: 800, color: '#64748B' }}>
                            {idx + 1}
                          </TableCell>

                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Avatar src={trn.photo} sx={{ width: 36, height: 36, bgcolor: '#0F2E5A' }}>
                                {trn.name[0]}
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                                  {trn.name}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#64748B' }}>
                                  {trn.phone}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>

                          <TableCell sx={{ textAlign: 'center' }}>
                            <Chip
                              icon={<FingerprintIcon sx={{ fontSize: '12px !important', color: '#0F2E5A !important' }} />}
                              label={`#${trn.biometricId || '2001'}`}
                              size="small"
                              sx={{ fontWeight: 800, bgcolor: '#EEF2F6', color: '#0F2E5A' }}
                            />
                          </TableCell>

                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {trn.specialization}
                            </Typography>
                          </TableCell>

                          <TableCell sx={{ textAlign: 'center' }}>
                            {punch ? (
                              <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F2E5A' }}>
                                🕒 {punch.timestamp}
                              </Typography>
                            ) : (
                              <Typography variant="caption" sx={{ color: '#94A3B8', fontStyle: 'italic' }}>
                                Not scanned yet
                              </Typography>
                            )}
                          </TableCell>

                          <TableCell sx={{ textAlign: 'center' }}>
                            <Chip
                              label={punch ? '🟢 Present' : '🔴 Absent / Pending'}
                              size="small"
                              sx={{
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
                              sx={{ color: '#25D366', bgcolor: '#DCFCE7' }}
                            >
                              <WhatsAppIcon sx={{ fontSize: 18 }} />
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
              <Alert severity="info" sx={{ mb: 2.5, borderRadius: 2.5, fontWeight: 700 }}>
                ℹ️ Daily biometric attendance roster for administrative, accounts, and front desk personnel
              </Alert>

              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#0F2E5A' }}>
                    <TableRow>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, width: 60, textAlign: 'center' }}>
                        S.N.
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>
                        Staff Name
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, textAlign: 'center', width: 140 }}>
                        Machine ID
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>
                        Role & Department
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, textAlign: 'center', width: 170 }}>
                        Check-in Time
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, textAlign: 'center', width: 220 }}>
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
                          <TableCell sx={{ textAlign: 'center', fontWeight: 800, color: '#64748B' }}>
                            {idx + 1}
                          </TableCell>
                          <TableCell>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                              {stf.name}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ textAlign: 'center' }}>
                            <Chip
                              icon={<FingerprintIcon sx={{ fontSize: '12px !important', color: '#0F2E5A !important' }} />}
                              label={`#${stf.bioId}`}
                              size="small"
                              sx={{ fontWeight: 800, bgcolor: '#EEF2F6', color: '#0F2E5A' }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {stf.role}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ textAlign: 'center' }}>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: isPresent ? '#0F2E5A' : '#94A3B8' }}>
                              {isPresent ? `🕒 ${checkInTime}` : '— Awaiting Biometric —'}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ textAlign: 'center' }}>
                            <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                              <Chip
                                label={isPresent ? '🟢 Present' : '⏳ Pending'}
                                size="small"
                                sx={{
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
                                sx={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'none', py: 0.2, px: 1 }}
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
