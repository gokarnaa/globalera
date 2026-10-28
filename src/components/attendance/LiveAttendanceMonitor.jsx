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

  // Simulation modal
  const [openSimulateModal, setOpenSimulateModal] = useState(false);
  const [simTargetId, setSimTargetId] = useState('');
  const [simTargetRole, setSimTargetRole] = useState('STUDENT');

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
    const totalEnrolled = students.length || 1;
    const attPercent = Math.round((presentStudentsCount / totalEnrolled) * 100);

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
    alert(`📡 बायोमेट्रिक मेसिन सिङ्क सफल!\n${res.syncedCount} वटा नयाँ लगहरू सिङ्क गरियो।`);
  };

  // Handle Live Thumb Simulation
  const handleRunSimulation = () => {
    if (!simTargetId) {
      alert('कृपया विद्यार्थी वा प्रशिक्षक छान्नुहोस्।');
      return;
    }

    let targetName = 'Enrolled User';
    let role = simTargetRole;

    if (role === 'STUDENT') {
      const s = students.find((x) => x.id === simTargetId || String(x.biometricId) === String(simTargetId));
      if (s) targetName = s.name;
    } else {
      const t = trainers.find((x) => x.id === simTargetId || String(x.biometricId) === String(simTargetId));
      if (t) targetName = `${t.name} (Trainer)`;
    }

    const log = recordLiveBiometricPunch({
      biometricId: simTargetId,
      name: targetName,
      role: role,
      device: `${settings.deviceName || 'ZKTeco K40 WiFi'} (Gate Scan)`
    });

    const refreshed = loadDB();
    setDb(refreshed);
    setOpenSimulateModal(false);

    if (soundEnabled) {
      playBiometricBeep(true);
    }
    try {
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
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
      verifiedBy: `${currentUser?.name || 'प्रशासक'} (Manual Check-in)`,
      remarks: 'प्रशासनिक म्यानुअल उपस्थिति'
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
                label={settings.status === 'Online' ? 'मेसिन अनलाइन (Online)' : 'मेसिन अफलाइन (Offline)'}
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
              📡 प्रत्यक्ष लाइभ हाजिरी मनिटर (Live Attendance Center)
            </Typography>

            <Typography variant="body2" sx={{ color: '#CBD5E1', fontWeight: 600, fontSize: '0.9rem' }}>
              ZKTeco / WiFi बायोमेट्रिक फिंगरप्रिन्ट, ADMS Cloud Push र प्रशिक्षक म्यानुअल हाजिरी प्रत्यक्ष निगरानी
            </Typography>

            {/* Quick Metadata Row */}
            <Box sx={{ display: 'flex', gap: 2.5, flexWrap: 'wrap', mt: 2 }}>
              <Typography variant="caption" sx={{ color: '#93C5FD', fontWeight: 700 }}>
                🕒 अन्तिम सिङ्क: <b>{settings.lastSyncTime || 'आज, ०७:४५ AM'}</b>
              </Typography>
              <Typography variant="caption" sx={{ color: '#FCD34D', fontWeight: 700 }}>
                ⏰ सिफ्ट ग्रेस समय: <b>{settings.lateGraceMinutes || 15} मिनेट</b>
              </Typography>
              <Typography variant="caption" sx={{ color: '#86EFAC', fontWeight: 700 }}>
                🏢 केन्द्र: <b>ग्लोबल एरा प्राविधिक स्कुल, जोरपाटी</b>
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
                  ⏱️ प्रत्यक्ष समय (LIVE CLOCK)
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  sx={{ color: soundEnabled ? '#34D399' : '#94A3B8' }}
                  title={soundEnabled ? 'ध्वनि सक्रिय (Sound On)' : 'ध्वनि बन्द (Muted)'}
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
                {currentTime.toLocaleDateString('ne-NP', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
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
                  📥 मेसिनबाट तत्काल सिङ्क गर्नुहोस् (Sync Now)
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
                    🧪 स्क्यान टेस्ट
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
                    🖥️ टिभी मोड
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
                🎓 कुल उपस्थिति (ATTENDANCE)
              </Typography>
              <Avatar sx={{ bgcolor: '#DCFCE7', color: '#15803D', width: 38, height: 38 }}>
                <SchoolIcon fontSize="small" />
              </Avatar>
            </Box>

            <Typography variant="h3" sx={{ fontWeight: 900, color: '#15803D', fontSize: '2.1rem', lineHeight: 1 }}>
              {stats.attPercent}%
            </Typography>

            <Typography variant="caption" sx={{ color: '#166534', fontWeight: 800, display: 'block', mt: 0.8 }}>
              • {stats.presentStudentsCount} / {stats.totalEnrolled} जना विद्यार्थी उपस्थित
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
                🟢 समयमै आगमन (ON-TIME)
              </Typography>
              <Avatar sx={{ bgcolor: '#E0F2FE', color: '#0284C7', width: 38, height: 38 }}>
                <CheckCircleIcon fontSize="small" />
              </Avatar>
            </Box>

            <Typography variant="h3" sx={{ fontWeight: 900, color: '#0369A1', fontSize: '2.1rem', lineHeight: 1 }}>
              {stats.presentStudentsCount - stats.lateCount}
            </Typography>

            <Typography variant="caption" sx={{ color: '#0369A1', fontWeight: 800, display: 'block', mt: 0.8 }}>
              • सिफ्ट सुरु भएको १५ मिनेट भित्र प्रमाणित
            </Typography>

            <Box sx={{ mt: 1.5 }}>
              <Chip
                label="समयमै प्रमाणित (Punctual)"
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
                🟠 ढिलो आगमन (LATE ARRIVALS)
              </Typography>
              <Avatar sx={{ bgcolor: '#FFEDD5', color: '#C2410C', width: 38, height: 38 }}>
                <AccessTimeIcon fontSize="small" />
              </Avatar>
            </Box>

            <Typography variant="h3" sx={{ fontWeight: 900, color: '#C2410C', fontSize: '2.1rem', lineHeight: 1 }}>
              {stats.lateCount}
            </Typography>

            <Typography variant="caption" sx={{ color: '#C2410C', fontWeight: 800, display: 'block', mt: 0.8 }}>
              • १५ मिनेटको ग्रेस समय कटेर आएका
            </Typography>

            <Box sx={{ mt: 1.5 }}>
              <Chip
                label="ग्रेस समय कटेको (Beyond Grace)"
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
                🛡️ प्रमाणीकरण स्रोत (SOURCE)
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
                बायोमेट्रिक थम्ब ({stats.presentStudentsCount > 0 ? Math.round((stats.biometricCount / stats.presentStudentsCount) * 100) : 0}%)
              </Typography>
            </Box>

            <Typography variant="caption" sx={{ color: '#92400E', fontWeight: 800, display: 'block', mt: 0.8 }}>
              • प्रशिक्षक म्यानुअल: {stats.manualCount} जना
            </Typography>

            <Box sx={{ mt: 1.5, display: 'flex', gap: 0.8 }}>
              <Chip
                icon={<FingerprintIcon sx={{ fontSize: '12px !important', color: '#15803D !important' }} />}
                label={`थम्ब: ${stats.biometricCount}`}
                size="small"
                sx={{ bgcolor: '#DCFCE7', color: '#15803D', fontWeight: 800, fontSize: '0.68rem', height: 22 }}
              />
              <Chip
                label={`म्यानुअल: ${stats.manualCount}`}
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
              label={`🌐 प्रत्यक्ष फिड स्ट्रिम (${filteredLogs.length} स्क्यान)`}
            />
            <Tab
              icon={<SchoolIcon sx={{ fontSize: 20 }} />}
              iconPosition="start"
              label={`🎓 प्रशिक्षार्थी प्रत्यक्ष उपस्थिति (${students.length})`}
            />
            <Tab
              icon={<PersonIcon sx={{ fontSize: 20 }} />}
              iconPosition="start"
              label={`👨‍🏫 प्रशिक्षक उपस्थिति (${trainers.length})`}
            />
            <Tab
              icon={<BusinessIcon sx={{ fontSize: 20 }} />}
              iconPosition="start"
              label="🏢 कार्यालय कर्मचारी (Staff Attendance)"
            />
          </Tabs>
        </Box>

        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          {/* =======================================================
              TAB 0: ALL LIVE PUNCH STREAM (प्रत्यक्ष लग स्ट्रिम)
              ======================================================= */}
          {activeTab === 0 && (
            <Box>
              {/* Controls Bar */}
              <Grid container spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="खोज्नुहोस्: नाम, बायोमेट्रिक ID, मेसिन..."
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
                    label="मिति छान्नुहोस्"
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
                      सबै ({allLogs.filter((l) => l.date === selectedDate).length})
                    </ToggleButton>
                    <ToggleButton value="STUDENT" sx={{ fontWeight: 800, textTransform: 'none' }}>
                      विद्यार्थी
                    </ToggleButton>
                    <ToggleButton value="TRAINER" sx={{ fontWeight: 800, textTransform: 'none' }}>
                      प्रशिक्षक
                    </ToggleButton>
                    <ToggleButton value="STAFF" sx={{ fontWeight: 800, textTransform: 'none' }}>
                      स्टाफ
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
                    रिसेट गर्नुहोस्
                  </Button>
                </Grid>
              </Grid>

              {/* Punch Stream Table */}
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#0F2E5A' }}>
                    <TableRow>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, width: 60, textAlign: 'center' }}>
                        क्र.सं.
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, width: 130 }}>
                        मेसिन ID
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>
                        प्रयोगकर्ताको नाम तथा विवरण
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, textAlign: 'center', width: 130 }}>
                        भूमिका (Role)
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, width: 170 }}>
                        आगमन समय (Check-in)
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, textAlign: 'center', width: 160 }}>
                        प्रमाणीकरण स्थिति
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>
                        उपकरण (Device)
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
                              मिति: {log.date}
                            </Typography>
                          </TableCell>

                          <TableCell sx={{ textAlign: 'center' }}>
                            <Chip
                              label={
                                log.role === 'STUDENT'
                                  ? 'प्रशिक्षार्थी'
                                  : log.role === 'TRAINER'
                                  ? 'प्रशिक्षक'
                                  : 'स्टाफ'
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
                              label={isLate ? '🟠 १५ मिनेट ढिलो' : '🟢 समयमै प्रमाणित'}
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
                          छानिएको मिति वा फिल्टर अनुसार कुनै पनि प्रत्यक्ष उपस्थिति लग फेला परेन।
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* =======================================================
              TAB 1: TRAINEES LIVE ROSTER (प्रशिक्षार्थी उपस्थिति तालिका)
              ======================================================= */}
          {activeTab === 1 && (
            <Box>
              {/* Batch Selector Bar */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                  <TextField
                    select
                    size="small"
                    label="तालिम समूह (Batch / Group)"
                    value={selectedBatchId}
                    onChange={(e) => setSelectedBatchId(e.target.value)}
                    sx={{ minWidth: 240, bgcolor: '#FFFFFF' }}
                  >
                    <MenuItem value="ALL">-- सबै तालिम समूहहरू (All Batches) --</MenuItem>
                    {groups.map((grp) => (
                      <MenuItem key={grp.id} value={grp.id}>
                        {grp.groupCode} — Shift {grp.shift} ({grp.startTime})
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    type="date"
                    size="small"
                    label="मिति"
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
                  विस्तृत हाजिरी डायरी खोल्नुहोस्
                </Button>
              </Box>

              {/* Trainee Roster Table */}
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#0F2E5A' }}>
                    <TableRow>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, width: 60, textAlign: 'center' }}>
                        क्र.सं.
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>
                        प्रशिक्षार्थीको नाम तथा विवरण
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>
                        तालिम समूह (Batch & Shift)
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, textAlign: 'center', width: 140 }}>
                        मेसिन ID
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, textAlign: 'center', width: 160 }}>
                        आजको स्थिति (Status)
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>
                        आगमन समय र स्रोत
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, textAlign: 'right' }}>
                        द्रुत कार्य (Fast Action)
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
                                    ? '🟢 उपस्थित (Present)'
                                    : isLate
                                    ? '🟠 ढिलो (Late)'
                                    : '🔴 हालसम्म नआएको (Absent)'
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
                                    🕒 {att.checkInTime || 'समयमै'}
                                  </Typography>
                                  <Chip
                                    size="small"
                                    label={
                                      att.source === 'BIOMETRIC'
                                        ? 'बायोमेट्रिक थम्ब'
                                        : 'प्रशिक्षक म्यानुअल'
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
                                  गेटमा थम्ब स्क्यान भएको छैन
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
                                    हाजिरी लगाइदिनुहोस्
                                  </Button>
                                )}

                                {!att && (
                                  <Tooltip title="अभिभावकलाई अनुपस्थित जानकारी WhatsApp सन्देश पठाउनुहोस्">
                                    <IconButton
                                      size="small"
                                      component="a"
                                      href={getWhatsAppUrl(
                                        std.guardianContact || std.phone,
                                        `नमस्ते, ग्लोबल एरा प्राविधिक स्कुलबाट। प्रशिक्षार्थी ${std.name} (${std.tgid}) आज मिति ${selectedDate} मा तोकिएको सिफ्टमा हालसम्म उपस्थित नभएको जानकारी गराइन्छ।`
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
              TAB 2: TRAINERS LIVE ROSTER (प्रशिक्षक उपस्थिति)
              ======================================================= */}
          {activeTab === 2 && (
            <Box>
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#0F2E5A' }}>
                    <TableRow>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, width: 60, textAlign: 'center' }}>
                        क्र.सं.
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>
                        प्रशिक्षक (Trainer)
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, textAlign: 'center', width: 140 }}>
                        मेसिन ID
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>
                        विज्ञता तथा विषय (Specialization)
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, textAlign: 'center', width: 160 }}>
                        आजको आगमन समय
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, textAlign: 'center', width: 150 }}>
                        उपस्थिति स्थिति
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, textAlign: 'right' }}>
                        सम्पर्क (WhatsApp)
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
                                हालसम्म स्क्यान नभएको
                              </Typography>
                            )}
                          </TableCell>

                          <TableCell sx={{ textAlign: 'center' }}>
                            <Chip
                              label={punch ? '🟢 समयमै उपस्थित' : '🔴 अनुपस्थित / बाँकी'}
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
                              href={getWhatsAppUrl(trn.phone, `नमस्ते ${trn.name} जी, आजको कक्षाको उपस्थिति तथा तयारीबारे जानकारी।`)}
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
              TAB 3: STAFF LIVE ROSTER (कर्मचारी उपस्थिति)
              ======================================================= */}
          {activeTab === 3 && (
            <Box>
              <Alert severity="info" sx={{ mb: 2.5, borderRadius: 2.5, fontWeight: 700 }}>
                ℹ️ संस्थाको प्रशासनिक, लेखा तथा रिसेप्सन कर्मचारीहरूको दैनिक बायोमेट्रिक हाजिरी अभिलेख
              </Alert>

              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#0F2E5A' }}>
                    <TableRow>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, width: 60, textAlign: 'center' }}>
                        क्र.सं.
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>
                        कर्मचारीको नाम
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, textAlign: 'center', width: 140 }}>
                        मेसिन ID
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>
                        पद तथा शाखा
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, textAlign: 'center', width: 170 }}>
                        आगमन समय (Check-in)
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, textAlign: 'center', width: 160 }}>
                        स्थिति
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[
                      { id: 'STF-01', name: 'गोकर्ण थापा (Gokarna Thapa)', bioId: '3001', role: 'क्याम्पस प्रमुख / निर्देशक', time: '०६:४५ AM', status: 'present' },
                      { id: 'STF-02', name: 'रिसेप्सन तथा इन्क्वायरी अफिसर', bioId: '3002', role: 'अगाडि डेस्क / काउन्टर', time: '०६:५० AM', status: 'present' },
                      { id: 'STF-03', name: 'लेखा अधिकृत (Accountant Staff)', bioId: '3003', role: 'लेखा तथा नगद संकलन', time: '०६:५५ AM', status: 'present' }
                    ].map((stf, idx) => (
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
                          <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F2E5A' }}>
                            🕒 {stf.time}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Chip
                            label="🟢 समयमै प्रमाणित"
                            size="small"
                            sx={{ fontWeight: 800, bgcolor: '#DCFCE7', color: '#15803D' }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
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
          🧪 प्रत्यक्ष थम्ब स्वाइप टेस्ट (Live Thumb Scan Simulator)
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body2" sx={{ color: '#475569', mb: 2 }}>
            मेसिन परीक्षण गर्न वा तत्काल कुनै विद्यार्थी वा प्रशिक्षकको औंठा छाप स्क्यान सिमुलेट गर्नुहोस्। प्रणालीले स्वतः वास्तविक मेसिनको जस्तै पुष्टिकरण ध्वनि निकाल्नेछ।
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
                प्रशिक्षार्थी (Trainee)
              </ToggleButton>
              <ToggleButton value="TRAINER" sx={{ fontWeight: 800 }}>
                प्रशिक्षक (Trainer)
              </ToggleButton>
            </ToggleButtonGroup>

            {simTargetRole === 'STUDENT' ? (
              <TextField
                select
                label="प्रशिक्षार्थी छान्नुहोस्"
                size="small"
                fullWidth
                value={simTargetId}
                onChange={(e) => setSimTargetId(e.target.value)}
              >
                {students.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name} (मेसिन ID: #{s.biometricId || '1001'}) — TGID: {s.tgid}
                  </MenuItem>
                ))}
              </TextField>
            ) : (
              <TextField
                select
                label="प्रशिक्षक छान्नुहोस्"
                size="small"
                fullWidth
                value={simTargetId}
                onChange={(e) => setSimTargetId(e.target.value)}
              >
                {trainers.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.name} (मेसिन ID: #{t.biometricId || '2001'}) — {t.specialization}
                  </MenuItem>
                ))}
              </TextField>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#F8FAFC' }}>
          <Button onClick={() => setOpenSimulateModal(false)} sx={{ fontWeight: 800 }}>
            रद्द
          </Button>
          <Button
            variant="contained"
            startIcon={<FingerprintIcon />}
            onClick={handleRunSimulation}
            sx={{ fontWeight: 900, bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' } }}
          >
            थम्ब स्क्यान प्रमाणित गर्नुहोस् (Scan Thumb)
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
