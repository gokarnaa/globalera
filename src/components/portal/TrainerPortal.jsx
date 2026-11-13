import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Avatar,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Stack,
  Alert,
  IconButton,
  Tooltip,
  LinearProgress,
  Badge
} from '@mui/material';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AssessmentIcon from '@mui/icons-material/Assessment';
import CampaignIcon from '@mui/icons-material/Campaign';
import LogoutIcon from '@mui/icons-material/Logout';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SchoolIcon from '@mui/icons-material/School';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import confetti from 'canvas-confetti';

import { useAuth } from '../../context/AuthContext';
import { useDialog } from '../../context/DialogContext';
import { loadDB, saveDB } from '../../services/storage';
import { getWhatsAppUrl } from '../../services/exportUtils';
import { syncBiometricAttendance } from '../../services/biometricService';

export default function TrainerPortal({ onLogout }) {
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

  // Identify current trainer profile
  const trainer = useMemo(() => {
    const list = db.trainers || [];
    if (currentUser?.trainerId) {
      return list.find((t) => t.id === currentUser.trainerId) || list[0];
    }
    return list[0];
  }, [db.trainers, currentUser]);

  // Trainer's Assigned Batches / Groups
  const assignedGroups = useMemo(() => {
    return (db.trainingGroups || []).filter((g) => g.trainerId === trainer?.id);
  }, [db.trainingGroups, trainer]);

  // Selected Group for Attendance & Logbook (defaults to first assigned group)
  const [selectedGroupId, setSelectedGroupId] = useState(assignedGroups[0]?.id || db.trainingGroups[0]?.id || '');

  // Group Details & Students
  const selectedGroup = useMemo(() => {
    return (db.trainingGroups || []).find((g) => g.id === selectedGroupId) || assignedGroups[0];
  }, [db.trainingGroups, selectedGroupId, assignedGroups]);

  const selectedCourse = useMemo(() => {
    return (db.courses || []).find((c) => c.id === selectedGroup?.courseId);
  }, [db.courses, selectedGroup]);

  const groupStudents = useMemo(() => {
    return (db.students || []).filter((s) => s.groupId === selectedGroupId);
  }, [db.students, selectedGroupId]);

  // View Trainees Modal State
  const [viewGroupModal, setViewGroupModal] = useState(null);

  // Daily Attendance State
  const todayStr = new Date().toISOString().slice(0, 10);
  const [attendanceDate, setAttendanceDate] = useState(todayStr);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [attendanceSavedAlert, setAttendanceSavedAlert] = useState(false);

  // Initialize Attendance Map when group or date changes
  React.useEffect(() => {
    if (!selectedGroupId) return;
    const existingRecords = (db.attendances || []).filter(
      (a) => a.groupId === selectedGroupId && a.date === attendanceDate
    );

    const initialMap = {};
    groupStudents.forEach((student) => {
      const existing = existingRecords.find((r) => r.studentId === student.id);
      initialMap[student.id] = {
        status: existing?.status || 'present',
        source: existing?.source || (student.biometricId ? 'BIOMETRIC' : 'TRAINER_MANUAL'),
        checkInTime: existing?.checkInTime || '',
        biometricId: existing?.biometricId || student.biometricId || '',
        verifiedBy: existing?.verifiedBy || '',
        remarks: existing?.remarks || ''
      };
    });
    setAttendanceMap(initialMap);
    setAttendanceSavedAlert(false);
  }, [selectedGroupId, attendanceDate, groupStudents, db.attendances]);

  // Tri-State Single Button Cycle: Present (P) -> Absent (A) -> Late (L) -> Present (P)
  const handleCycleAttendance = (studentId) => {
    setAttendanceMap((prev) => {
      const current = prev[studentId]?.status || 'present';
      let nextStatus = 'present';
      if (current === 'present') {
        nextStatus = 'absent';
      } else if (current === 'absent') {
        nextStatus = 'late';
      } else {
        nextStatus = 'present';
      }

      // If trainer marks student manually, update source to TRAINER_MANUAL
      const isManual = nextStatus === 'present' || nextStatus === 'late';
      const newRemarks =
        nextStatus === 'present' && prev[studentId]?.source === 'BIOMETRIC'
          ? (prev[studentId]?.remarks || 'Biometric Verified')
          : nextStatus === 'present'
          ? 'Trainer Manual Attendance (Manual Present)'
          : nextStatus === 'late'
          ? 'Trainer Manual Late (Manual Late)'
          : '';

      return {
        ...prev,
        [studentId]: {
          ...prev[studentId],
          status: nextStatus,
          source: isManual ? 'TRAINER_MANUAL' : (prev[studentId]?.source || 'TRAINER_MANUAL'),
          verifiedBy: `${trainer?.name || 'Trainer'} (Manual Override)`,
          remarks: newRemarks
        }
      };
    });
  };

  const handleMarkAllPresent = () => {
    const nextMap = { ...attendanceMap };
    groupStudents.forEach((s) => {
      nextMap[s.id] = {
        ...nextMap[s.id],
        status: 'present',
        source: nextMap[s.id]?.source === 'BIOMETRIC' ? 'BIOMETRIC' : 'TRAINER_MANUAL',
        verifiedBy: nextMap[s.id]?.source === 'BIOMETRIC' ? nextMap[s.id]?.verifiedBy : `${trainer?.name || 'Trainer'} (Manual)`
      };
    });
    setAttendanceMap(nextMap);
  };

  const handleSaveAttendance = () => {
    const currentList = (db.attendances || []).filter(
      (a) => !(a.groupId === selectedGroupId && a.date === attendanceDate)
    );

    const newEntries = Object.entries(attendanceMap).map(([studentId, data], idx) => ({
      id: `ATT-${Date.now()}-${idx}`,
      groupId: selectedGroupId,
      date: attendanceDate,
      studentId,
      status: data.status,
      source: data.source || 'TRAINER_MANUAL',
      checkInTime: data.checkInTime || '',
      biometricId: data.biometricId || '',
      verifiedBy: data.verifiedBy || `${trainer?.name || 'Trainer'} (Manual)`,
      remarks: data.remarks || ''
    }));

    const nextDb = {
      ...db,
      attendances: [...newEntries, ...currentList]
    };

    saveDB(nextDb);
    setDb(nextDb);
    setAttendanceSavedAlert(true);

    try {
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
    } catch (_) {}

    setTimeout(() => {
      setAttendanceSavedAlert(false);
    }, 4000);
  };

  // Daily Log Book State
  const [openLogModal, setOpenLogModal] = useState(false);
  const [logForm, setLogForm] = useState({
    deliveryDate: todayStr,
    topicsCovered: '',
    materialsUsed: '',
    skillsLearned: '',
    actualHours: 2,
    trainerNotes: ''
  });

  const handleSaveLogBook = (e) => {
    e.preventDefault();
    if (!logForm.topicsCovered) {
      alert('Please enter the lesson / topics covered.');
      return;
    }

    const newLog = {
      id: `LOG-${Date.now()}`,
      groupId: selectedGroupId,
      deliveryDate: logForm.deliveryDate,
      topicsCovered: logForm.topicsCovered,
      materialsUsed: logForm.materialsUsed,
      skillsLearned: logForm.skillsLearned,
      actualHours: Number(logForm.actualHours) || 2,
      isDelivered: true,
      trainerNotes: logForm.trainerNotes,
      createdAt: new Date().toISOString()
    };

    const nextDb = {
      ...db,
      logBooks: [newLog, ...(db.logBooks || [])]
    };

    saveDB(nextDb);
    setDb(nextDb);
    setOpenLogModal(false);
    setLogForm({
      deliveryDate: todayStr,
      topicsCovered: '',
      materialsUsed: '',
      skillsLearned: '',
      actualHours: 2,
      trainerNotes: ''
    });

    try {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } catch (_) {}
  };

  // Trainee Competency Grading
  const handleToggleCompetency = (studentId, currentMastered) => {
    const existingList = db.evaluations || [];
    const targetIdx = existingList.findIndex(
      (e) => e.groupId === selectedGroupId && e.studentId === studentId
    );

    let nextList = [...existingList];
    if (targetIdx >= 0) {
      nextList[targetIdx] = {
        ...nextList[targetIdx],
        mastered: !currentMastered,
        evaluatedAt: todayStr
      };
    } else {
      nextList.unshift({
        id: `EVL-${Date.now()}-${studentId}`,
        groupId: selectedGroupId,
        studentId,
        mastered: true,
        evaluatorName: trainer?.name || 'Lead Trainer',
        evaluatedAt: todayStr
      });
    }

    const nextDb = { ...db, evaluations: nextList };
    saveDB(nextDb);
    setDb(nextDb);
  };

  // Group Attendance Statistics
  const getStudentAttPercent = (studentId) => {
    const studentRecords = (db.attendances || []).filter(
      (a) => a.studentId === studentId && a.groupId === selectedGroupId
    );
    if (studentRecords.length === 0) return 0;
    const presentCount = studentRecords.filter((r) => r.status === 'present').length;
    return Math.round((presentCount / studentRecords.length) * 100);
  };

  // Total Students count across all assigned batches
  const totalAssignedStudentsCount = useMemo(() => {
    const groupIds = assignedGroups.map((g) => g.id);
    return (db.students || []).filter((s) => groupIds.includes(s.groupId)).length;
  }, [db.students, assignedGroups]);

  return (
    <Box sx={{ pb: 6 }}>
      {/* 1. Trainer Profile Dossier Header Banner */}
      <Card
        sx={{
          mb: 2.5,
          borderRadius: 4,
          background: 'linear-gradient(135deg, #0f2e5a 0%, #174276 60%, #0c2344 100%)',
          color: '#ffffff',
          boxShadow: '0 10px 28px -8px rgba(15, 46, 90, 0.25)',
          overflow: 'hidden',
          borderBottom: '3px solid #F59E0B'
        }}
      >
        <CardContent sx={{ py: { xs: 1.75, sm: 2.25 }, px: { xs: 2, sm: 2.5, md: 3 } }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'flex-start', sm: 'center' },
              justifyContent: 'space-between',
              gap: 2
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                src={trainer?.photo}
                sx={{
                  width: { xs: 64, sm: 76 },
                  height: { xs: 64, sm: 76 },
                  bgcolor: '#10B981',
                  border: '3px solid #F59E0B',
                  fontWeight: 900,
                  fontSize: '1.6rem'
                }}
              >
                {trainer?.name ? trainer.name[0] : 'T'}
              </Avatar>

              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: '0.02em' }}>
                    {trainer?.name || 'Trainer Profile'}
                  </Typography>
                  <Chip
                    label="Lead Instructor"
                    size="small"
                    sx={{ bgcolor: '#10B981', color: '#ffffff', fontWeight: 800 }}
                  />
                  <Chip
                    label={trainer?.id || 'TRN'}
                    size="small"
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#ffffff', fontWeight: 700 }}
                  />
                </Box>

                <Typography variant="body2" sx={{ color: '#E2E8F0', mt: 0.4 }}>
                  {trainer?.specialization || 'TVET Certified Instructor'} • Phone: {trainer?.phone || 'N/A'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mt: 0.3 }}>
                  Global Era Technical School • CTEVT Accredited
                </Typography>
              </Box>
            </Box>

            {/* Logout and Quick Badges */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, alignSelf: { xs: 'flex-end', sm: 'center' } }}>
              <Box sx={{ textAlign: 'right', display: { xs: 'none', md: 'block' } }}>
                <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block' }}>
                  Assigned Batches
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 900, color: '#F59E0B', lineHeight: 1 }}>
                  {assignedGroups.length} Batches ({totalAssignedStudentsCount} Trainees)
                </Typography>
              </Box>

              <Button
                variant="outlined"
                color="inherit"
                startIcon={<LogoutIcon />}
                onClick={async () => {
                  const ok = await confirm({
                    type: 'logout',
                    title: 'Confirm Logout',
                    message: 'Are you sure you want to log out of the Trainer Portal?',
                    detail: 'Your session will be securely closed and you will need your User ID and PIN to log in again.',
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
                  borderColor: 'rgba(255,255,255,0.4)',
                  color: '#ffffff',
                  fontWeight: 800,
                  borderRadius: 2,
                  '&:hover': {
                    bgcolor: 'rgba(239, 68, 68, 0.2)',
                    borderColor: '#EF4444'
                  }
                }}
              >
                Logout
              </Button>
            </Box>
          </Box>
        </CardContent>

        {/* Navigation Tabs */}
        <Box sx={{ bgcolor: 'rgba(0,0,0,0.18)', px: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(e, val) => setActiveTab(val)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                color: '#CBD5E1',
                fontWeight: 800,
                fontSize: { xs: '0.82rem', sm: '0.9rem' },
                py: 1.5,
                '&.Mui-selected': {
                  color: '#F59E0B'
                }
              },
              '& .MuiTabs-indicator': {
                bgcolor: '#F59E0B',
                height: 3
              }
            }}
          >
            <Tab icon={<PeopleAltIcon />} iconPosition="start" label={`Assigned Batches (${assignedGroups.length})`} />
            <Tab icon={<FactCheckIcon />} iconPosition="start" label="Daily Attendance" />
            <Tab icon={<MenuBookIcon />} iconPosition="start" label="CTEVT Daily Log Book" />
            <Tab icon={<AssessmentIcon />} iconPosition="start" label="Competency Assessment" />
            <Tab icon={<CampaignIcon />} iconPosition="start" label="Notices" />
          </Tabs>
        </Box>
      </Card>

      {/* 2. TAB 0: Assigned Batches */}
      {activeTab === 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 900, color: '#0F2E5A' }}>
              My Assigned Batches
            </Typography>
            <Chip
              label={`Total Batches: ${assignedGroups.length} | Total Trainees: ${totalAssignedStudentsCount}`}
              sx={{ fontWeight: 800, bgcolor: '#0F2E5A', color: '#FFFFFF' }}
            />
          </Box>

          <Grid container spacing={2.5}>
            {assignedGroups.map((grp) => {
              const course = (db.courses || []).find((c) => c.id === grp.courseId);
              const students = (db.students || []).filter((s) => s.groupId === grp.id);

              return (
                <Grid item xs={12} md={6} key={grp.id}>
                  <Card
                    sx={{
                      borderRadius: 3,
                      boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
                      border: '1px solid #E2E8F0',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'translateY(-3px)',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
                      }
                    }}
                  >
                    <Box
                      sx={{
                        p: 2,
                        bgcolor: '#F8FAFC',
                        borderBottom: '1px solid #E2E8F0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#0F2E5A' }}>
                          {grp.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>
                          Code: {grp.code || grp.id} • Shift: {grp.shift || 'Shift A'}
                        </Typography>
                      </Box>
                      <Chip
                        label={grp.status || 'Active'}
                        size="small"
                        sx={{
                          fontWeight: 800,
                          bgcolor: grp.status === 'Active' ? '#DCFCE7' : '#F1F5F9',
                          color: grp.status === 'Active' ? '#15803D' : '#475569'
                        }}
                      />
                    </Box>

                    <CardContent sx={{ p: 2.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: '#1E293B', mb: 1 }}>
                        Course: {course?.title || 'Vocational Training'}
                      </Typography>

                      <Grid container spacing={1} sx={{ mb: 2 }}>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                            Duration & Total Hours:
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F2E5A' }}>
                            {course?.totalHours || 390} Hours ({course?.durationValue || 3} Months)
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                            Class Schedule:
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F2E5A' }}>
                            {grp.startDate || '2026-08-01'} to {grp.endDate || '2026-11-01'}
                          </Typography>
                        </Grid>
                      </Grid>

                      <Box sx={{ pt: 1.5, borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <SchoolIcon sx={{ color: '#3B82F6', fontSize: 20 }} />
                          <Typography variant="body2" sx={{ fontWeight: 900, color: '#1E293B' }}>
                            {students.length} Trainees
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<VisibilityIcon />}
                            onClick={() => setViewGroupModal({ group: grp, course, students })}
                            sx={{ fontWeight: 800, borderRadius: 2 }}
                          >
                            Trainee List
                          </Button>

                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<FactCheckIcon />}
                            onClick={() => {
                              setSelectedGroupId(grp.id);
                              setActiveTab(1); // Jump to attendance
                            }}
                            sx={{ fontWeight: 800, bgcolor: '#0F2E5A', borderRadius: 2 }}
                          >
                            Take Attendance
                          </Button>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}

      {/* 3. TAB 1: Daily Attendance Marking */}
      {activeTab === 1 && (
        <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          <Box sx={{ p: 2.5, bgcolor: '#0F2E5A', color: '#ffffff', borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>
                  Daily Trainee Attendance Management
                </Typography>
                <Typography variant="caption" sx={{ color: '#E2E8F0' }}>
                  Select a batch and mark Present (P) / Absent (A) / Late (L), then save.
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                {/* Select Group */}
                <TextField
                  select
                  size="small"
                  label="Select Training Batch"
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  sx={{
                    bgcolor: '#FFFFFF',
                    borderRadius: 1.5,
                    minWidth: 200,
                    '& .MuiInputBase-input': { fontWeight: 800 }
                  }}
                >
                  {assignedGroups.map((g) => (
                    <MenuItem key={g.id} value={g.id}>
                      {g.name} ({g.code})
                    </MenuItem>
                  ))}
                </TextField>

                {/* Date Picker & Biometric Sync */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TextField
                    type="date"
                    size="small"
                    label="Attendance Date"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      bgcolor: '#FFFFFF',
                      borderRadius: 1.5,
                      minWidth: 150,
                      '& .MuiInputBase-input': { fontWeight: 800 }
                    }}
                  />
                  <Tooltip title="Sync today's thumb logs from the WiFi Biometric Machine">
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<FingerprintIcon />}
                      onClick={() => {
                        const res = syncBiometricAttendance(attendanceDate);
                        setDb(loadDB());
                        alert(`📡 Biometric machine sync completed successfully! (${res.syncedCount} logs updated)`);
                      }}
                      sx={{
                        fontWeight: 900,
                        bgcolor: '#10B981',
                        '&:hover': { bgcolor: '#059669' },
                        color: '#FFFFFF',
                        borderRadius: 1.5,
                        textTransform: 'none',
                        px: 1.8,
                        py: 0.8
                      }}
                    >
                      Device Sync
                    </Button>
                  </Tooltip>
                </Box>
              </Box>
            </Box>
          </Box>

          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            {attendanceSavedAlert && (
              <Alert severity="success" sx={{ mb: 2.5, borderRadius: 2, fontWeight: 800 }}>
                ✓ Attendance for {attendanceDate} saved successfully!
              </Alert>
            )}

            {/* Attendance Action Controls */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip
                  label={`Total Trainees: ${groupStudents.length}`}
                  sx={{ fontWeight: 800, bgcolor: '#F1F5F9', color: '#1E293B' }}
                />
                <Chip
                  label={`Present: ${Object.values(attendanceMap).filter((d) => d.status === 'present').length}`}
                  sx={{ fontWeight: 800, bgcolor: '#DCFCE7', color: '#15803D' }}
                />
                <Chip
                  label={`Absent: ${Object.values(attendanceMap).filter((d) => d.status === 'absent').length}`}
                  sx={{ fontWeight: 800, bgcolor: '#FEE2E2', color: '#B91C1C' }}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleMarkAllPresent}
                  sx={{ fontWeight: 800, color: '#10B981', borderColor: '#10B981', borderRadius: 2 }}
                >
                  Mark All Present
                </Button>

                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveAttendance}
                  sx={{ fontWeight: 900, bgcolor: '#0F2E5A', borderRadius: 2 }}
                >
                  Save Attendance
                </Button>
              </Box>
            </Box>

            {/* Trainee Attendance List */}
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
              <Table size="small">
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
                    <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>Trainee Name & Details</TableCell>
                    <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>TGID / Phone</TableCell>
                    <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, textAlign: 'center' }}>Overall Attendance %</TableCell>
                    <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, textAlign: 'center', width: 140 }}>
                      Attendance Status (P 🟢 / A 🔴 / L 🟠)
                    </TableCell>
                    <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>Remarks</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {groupStudents.map((std, idx) => {
                    const currentStatus = attendanceMap[std.id]?.status || 'present';
                    const attPercent = getStudentAttPercent(std.id);

                    const statusConfig =
                      currentStatus === 'absent'
                        ? {
                            label: 'A',
                            title: 'Absent - Click to change to Late (L)',
                            text: 'Absent',
                            bg: '#EF4444',
                            border: '#DC2626',
                            color: '#FFFFFF'
                          }
                        : currentStatus === 'late'
                        ? {
                            label: 'L',
                            title: 'Late - Click to change to Present (P)',
                            text: 'Late',
                            bg: '#F59E0B',
                            border: '#D97706',
                            color: '#FFFFFF'
                          }
                        : {
                            label: 'P',
                            title: 'Present - Click to change to Absent (A)',
                            text: 'Present',
                            bg: '#10B981',
                            border: '#059669',
                            color: '#FFFFFF'
                          };

                    return (
                      <TableRow key={std.id} hover>
                        <TableCell sx={{ fontWeight: 700 }}>{idx + 1}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar src={std.photoUrl} sx={{ width: 34, height: 34, bgcolor: '#0F2E5A' }}>
                              {std.name[0]}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F2E5A' }}>
                                {std.name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#64748B' }}>
                                {std.gender === 'Female' ? 'Female' : 'Male'} • {std.address || 'Kathmandu'}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B' }}>
                            {std.tgid}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                            {std.phone}
                          </Typography>
                          <Chip
                            size="small"
                            icon={<FingerprintIcon sx={{ fontSize: '11px !important', color: '#0F2E5A !important' }} />}
                            label={`Device ID: #${std.biometricId || 'N/A'}`}
                            sx={{ height: 18, fontSize: '0.67rem', fontWeight: 800, bgcolor: '#EEF2F6', color: '#0F2E5A', mt: 0.3 }}
                          />
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                            <LinearProgress
                              variant="determinate"
                              value={attPercent}
                              sx={{
                                width: 50,
                                height: 6,
                                borderRadius: 3,
                                bgcolor: '#E2E8F0',
                                '& .MuiLinearProgress-bar': {
                                  bgcolor: attPercent >= 80 ? '#10B981' : attPercent >= 60 ? '#F59E0B' : '#EF4444'
                                }
                              }}
                            />
                            <Typography variant="caption" sx={{ fontWeight: 800 }}>
                              {attPercent}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.2 }}>
                            <Tooltip title={statusConfig.title} arrow>
                              <Box
                                component="button"
                                type="button"
                                onClick={() => handleCycleAttendance(std.id)}
                                sx={{
                                  width: 38,
                                  height: 38,
                                  borderRadius: '50%',
                                  bgcolor: statusConfig.bg,
                                  color: statusConfig.color,
                                  border: `2px solid ${statusConfig.border}`,
                                  fontWeight: 900,
                                  fontSize: '0.98rem',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  boxShadow: `0 3px 10px ${statusConfig.bg}40`,
                                  transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                                  outline: 'none',
                                  userSelect: 'none',
                                  '&:hover': {
                                    transform: 'scale(1.12)',
                                    boxShadow: `0 5px 14px ${statusConfig.bg}60`
                                  },
                                  '&:active': {
                                    transform: 'scale(0.92)'
                                  }
                                }}
                              >
                                {statusConfig.label}
                              </Box>
                            </Tooltip>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 95 }}>
                              <Typography
                                variant="caption"
                                sx={{
                                  fontWeight: 800,
                                  fontSize: '0.74rem',
                                  color: statusConfig.bg
                                }}
                              >
                                {statusConfig.text}
                              </Typography>
                              {currentStatus !== 'absent' && (
                                <Chip
                                  size="small"
                                  icon={attendanceMap[std.id]?.source === 'BIOMETRIC' ? <FingerprintIcon sx={{ fontSize: '11px !important', color: '#059669 !important' }} /> : undefined}
                                  label={
                                    attendanceMap[std.id]?.source === 'BIOMETRIC'
                                      ? `Biometric (${attendanceMap[std.id]?.checkInTime || 'On Time'})`
                                      : 'Trainer Manual'
                                  }
                                  sx={{
                                    height: 19,
                                    fontSize: '0.64rem',
                                    fontWeight: 800,
                                    bgcolor: attendanceMap[std.id]?.source === 'BIOMETRIC' ? '#DCFCE7' : '#FEF3C7',
                                    color: attendanceMap[std.id]?.source === 'BIOMETRIC' ? '#15803D' : '#92400E',
                                    mt: 0.3
                                  }}
                                />
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            placeholder="Remarks..."
                            value={attendanceMap[std.id]?.remarks || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setAttendanceMap((prev) => ({
                                ...prev,
                                [std.id]: {
                                  ...prev[std.id],
                                  remarks: val
                                }
                              }));
                            }}
                            sx={{ '& .MuiInputBase-input': { fontSize: '0.8rem', py: 0.6 } }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* 4. TAB 2: CTEVT Daily Log Book */}
      {activeTab === 2 && (
        <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          <Box sx={{ p: 2.5, bgcolor: '#0F2E5A', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                CTEVT Daily Training Log Book
              </Typography>
              <Typography variant="caption" sx={{ color: '#E2E8F0' }}>
                Record the theoretical and practical sessions conducted in class today.
              </Typography>
            </Box>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenLogModal(true)}
              sx={{ bgcolor: '#F59E0B', color: '#0F2E5A', fontWeight: 900, borderRadius: 2 }}
            >
              + Add Log Entry
            </Button>
          </Box>

          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                select
                size="small"
                label="Select Batch"
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                sx={{ minWidth: 220 }}
              >
                {assignedGroups.map((g) => (
                  <MenuItem key={g.id} value={g.id}>
                    {g.name}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            {/* List of recorded logs */}
            {(() => {
              const logs = (db.logBooks || []).filter((l) => l.groupId === selectedGroupId);
              if (logs.length === 0) {
                return (
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    No daily log book entries recorded for this batch yet. Click the <b>+ Add Log Entry</b> button above to record today's session.
                  </Alert>
                );
              }

              return (
                <Grid container spacing={2}>
                  {logs.map((log) => (
                    <Grid item xs={12} md={6} key={log.id}>
                      <Card variant="outlined" sx={{ p: 2, borderRadius: 2.5, bgcolor: '#F8FAFC' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Chip
                            label={`Date: ${log.deliveryDate}`}
                            size="small"
                            sx={{ fontWeight: 800, bgcolor: '#0F2E5A', color: '#ffffff' }}
                          />
                          <Chip
                            label={`${log.actualHours || 2} Hours`}
                            size="small"
                            sx={{ fontWeight: 800, bgcolor: '#FEF3C7', color: '#92400E' }}
                          />
                        </Box>

                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1E293B', mb: 0.5 }}>
                          Topic Covered: {log.topicsCovered}
                        </Typography>

                        {log.materialsUsed && (
                          <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.3 }}>
                            Materials Used: {log.materialsUsed}
                          </Typography>
                        )}

                        {log.trainerNotes && (
                          <Typography variant="caption" sx={{ color: '#047857', display: 'block', fontWeight: 600 }}>
                            Trainer Notes: "{log.trainerNotes}"
                          </Typography>
                        )}
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* 5. TAB 3: Competency Assessment */}
      {activeTab === 3 && (
        <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          <Box sx={{ p: 2.5, bgcolor: '#0F2E5A', color: '#ffffff' }}>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              Trainee Competency Matrix
            </Typography>
            <Typography variant="caption" sx={{ color: '#E2E8F0' }}>
              Verify and certify that trainees have mastered practical competencies (Competent 'C') according to the curriculum.
            </Typography>
          </Box>

          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ mb: 2 }}>
              <TextField
                select
                size="small"
                label="Select Batch"
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                sx={{ minWidth: 220 }}
              >
                {assignedGroups.map((g) => (
                  <MenuItem key={g.id} value={g.id}>
                    {g.name}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
              <Table size="small">
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
                    <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>Trainee</TableCell>
                    <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>TGID</TableCell>
                    <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, textAlign: 'center' }}>Competency Status</TableCell>
                    <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>Trainer Recommendation</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {groupStudents.map((s, idx) => {
                    const ev = (db.evaluations || []).find(
                      (e) => e.groupId === selectedGroupId && e.studentId === s.id
                    );
                    const isCompetent = ev ? ev.mastered : true;

                    return (
                      <TableRow key={s.id} hover>
                        <TableCell sx={{ fontWeight: 800, textAlign: 'center', color: '#64748B', width: 65 }}>
                          {idx + 1}
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                            {s.name}
                          </Typography>
                        </TableCell>
                        <TableCell>{s.tgid}</TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => handleToggleCompetency(s.id, isCompetent)}
                            sx={{
                              fontWeight: 900,
                              borderRadius: 2,
                              bgcolor: isCompetent ? '#10B981' : '#F59E0B',
                              color: '#ffffff',
                              '&:hover': {
                                bgcolor: isCompetent ? '#059669' : '#D97706'
                              }
                            }}
                          >
                            {isCompetent ? '✓ Competent' : '⏳ Not Yet Competent'}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" sx={{ color: '#475569' }}>
                            {isCompetent ? 'Recommended for Certificate Issuance' : 'Further Practice Required'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* 6. TAB 4: Notices */}
      {activeTab === 4 && (
        <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          <Box sx={{ p: 2.5, bgcolor: '#0F2E5A', color: '#ffffff' }}>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              Official College & Campus Notices (Notice Board)
            </Typography>
          </Box>
          <CardContent sx={{ p: 3 }}>
            <Stack spacing={2}>
              {(db.notices || []).map((not) => (
                <Paper key={not.id} variant="outlined" sx={{ p: 2, borderRadius: 2.5, bgcolor: '#F8FAFC' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#0F2E5A' }}>
                      {not.title}
                    </Typography>
                    <Chip label={not.date} size="small" sx={{ fontWeight: 700 }} />
                  </Box>
                  <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.5 }}>
                    {not.content}
                  </Typography>
                </Paper>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Trainees List Modal */}
      <Dialog
        open={Boolean(viewGroupModal)}
        onClose={() => setViewGroupModal(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#0F2E5A', color: '#ffffff', fontWeight: 900 }}>
          {viewGroupModal?.group?.name} - Trainee List ({viewGroupModal?.students?.length})
        </DialogTitle>
        <DialogContent sx={{ p: 2.5 }}>
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Table size="small">
              <TableHead
                sx={{
                  bgcolor: '#0F2E5A',
                  '& .MuiTableCell-head': {
                    bgcolor: '#0F2E5A !important',
                    color: '#FFFFFF !important',
                    fontWeight: 900,
                    fontSize: '0.84rem',
                    py: 1.2,
                    borderBottom: '2px solid #F59E0B'
                  }
                }}
              >
                <TableRow>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, width: 65, textAlign: 'center' }}>S.N.</TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>Name</TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>TGID</TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>Phone</TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>Address</TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, textAlign: 'center' }}>WhatsApp</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {viewGroupModal?.students?.map((st, i) => (
                  <TableRow key={st.id} hover>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>{st.name}</TableCell>
                    <TableCell>{st.tgid}</TableCell>
                    <TableCell>{st.phone}</TableCell>
                    <TableCell>{st.address || 'Kathmandu'}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <IconButton
                        size="small"
                        color="success"
                        onClick={() => {
                          const url = getWhatsAppUrl(st.phone, `Hello ${st.name}, message from Global Era Technical School regarding your training: `);
                          window.open(url, '_blank');
                        }}
                      >
                        <WhatsAppIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="contained" onClick={() => setViewGroupModal(null)} sx={{ bgcolor: '#0F2E5A' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Daily Logbook Entry Dialog */}
      <Dialog open={openLogModal} onClose={() => setOpenLogModal(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSaveLogBook}>
          <DialogTitle sx={{ bgcolor: '#0F2E5A', color: '#ffffff', fontWeight: 900 }}>
            + CTEVT Daily Log Entry
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                type="date"
                label="Training Date"
                value={logForm.deliveryDate}
                onChange={(e) => setLogForm({ ...logForm, deliveryDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
                required
              />

              <TextField
                label="Topics Covered Today"
                placeholder="e.g., Theoretical and practical session on hair cutting..."
                value={logForm.topicsCovered}
                onChange={(e) => setLogForm({ ...logForm, topicsCovered: e.target.value })}
                fullWidth
                required
                multiline
                rows={2}
              />

              <TextField
                label="Tools & Materials Used"
                placeholder="e.g., Scissors, Apron, Hair Dryer..."
                value={logForm.materialsUsed}
                onChange={(e) => setLogForm({ ...logForm, materialsUsed: e.target.value })}
                fullWidth
              />

              <TextField
                type="number"
                label="Total Class Hours"
                value={logForm.actualHours}
                onChange={(e) => setLogForm({ ...logForm, actualHours: e.target.value })}
                fullWidth
                inputProps={{ min: 1, max: 8 }}
              />

              <TextField
                label="Trainer Remarks / Feedback"
                placeholder="e.g., All trainees completed the assigned practical tasks satisfactorily."
                value={logForm.trainerNotes}
                onChange={(e) => setLogForm({ ...logForm, trainerNotes: e.target.value })}
                fullWidth
                multiline
                rows={2}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenLogModal(false)}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ bgcolor: '#0F2E5A', fontWeight: 800 }}>
              Save Log
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
