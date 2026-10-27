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
import confetti from 'canvas-confetti';

import { useAuth } from '../../context/AuthContext';
import { loadDB, saveDB } from '../../services/storage';
import { getWhatsAppUrl } from '../../services/exportUtils';

export default function TrainerPortal() {
  const { currentUser, logout } = useAuth();
  const [db, setDb] = useState(loadDB());
  const [activeTab, setActiveTab] = useState(0);

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

      return {
        ...prev,
        [studentId]: {
          ...prev[studentId],
          status: nextStatus
        }
      };
    });
  };

  const handleMarkAllPresent = () => {
    const nextMap = { ...attendanceMap };
    groupStudents.forEach((s) => {
      nextMap[s.id] = {
        ...nextMap[s.id],
        status: 'present'
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
      alert('कृपया पाठ / शीर्षक (Topics Covered) प्रविष्ट गर्नुहोस्।');
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
          mb: 3,
          borderRadius: 3.5,
          background: 'linear-gradient(135deg, #0f2e5a 0%, #174276 60%, #0c2344 100%)',
          color: '#ffffff',
          boxShadow: '0 10px 25px rgba(15, 46, 90, 0.25)',
          overflow: 'hidden',
          borderBottom: '3px solid #F59E0B'
        }}
      >
        <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
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
                    label="प्रशिक्षक (Lead Instructor)"
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
                  {trainer?.specialization || 'TVET Certified Instructor'} • फोन: {trainer?.phone || 'N/A'}
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
                  जिम्मा समूह (Assigned Batches)
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 900, color: '#F59E0B', lineHeight: 1 }}>
                  {assignedGroups.length} Batches ({totalAssignedStudentsCount} Trainees)
                </Typography>
              </Box>

              <Button
                variant="outlined"
                color="inherit"
                startIcon={<LogoutIcon />}
                onClick={() => {
                  if (window.confirm('के तपाईं पोर्टलबाट बाहिरिन (Logout) चाहनुहुन्छ?')) {
                    logout();
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
            <Tab icon={<PeopleAltIcon />} iconPosition="start" label={`तोकिएका ब्याचहरू (${assignedGroups.length})`} />
            <Tab icon={<FactCheckIcon />} iconPosition="start" label="दैनिक हाजिरी (Daily Attendance)" />
            <Tab icon={<MenuBookIcon />} iconPosition="start" label="CTEVT लग-बुक (Daily Log Book)" />
            <Tab icon={<AssessmentIcon />} iconPosition="start" label="सीप मूल्याङ्कन (Competency)" />
            <Tab icon={<CampaignIcon />} iconPosition="start" label="सूचनाहरू (Notices)" />
          </Tabs>
        </Box>
      </Card>

      {/* 2. TAB 0: तोकिएका तालिम समूहहरू (Assigned Batches) */}
      {activeTab === 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 900, color: '#0F2E5A' }}>
              मेरो जिम्मेवारीमा रहेका तालिम समूहहरू (My Assigned Batches)
            </Typography>
            <Chip
              label={`कुल समूह: ${assignedGroups.length} | कुल विद्यार्थी: ${totalAssignedStudentsCount}`}
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
                        पाठ्यक्रम (Course): {course?.title || 'Vocational Training'}
                      </Typography>

                      <Grid container spacing={1} sx={{ mb: 2 }}>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                            अवधि तथा कुल घण्टा:
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F2E5A' }}>
                            {course?.totalHours || 390} घण्टा ({course?.durationValue || 3} महिना)
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                            कक्षा मिति:
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F2E5A' }}>
                            {grp.startDate || '2026-08-01'} देखि {grp.endDate || '2026-11-01'}
                          </Typography>
                        </Grid>
                      </Grid>

                      <Box sx={{ pt: 1.5, borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <SchoolIcon sx={{ color: '#3B82F6', fontSize: 20 }} />
                          <Typography variant="body2" sx={{ fontWeight: 900, color: '#1E293B' }}>
                            {students.length} प्रशिक्षार्थीहरू (Trainees)
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
                            विद्यार्थी सूची
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
                            हाजिरी लिनुहोस्
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

      {/* 3. TAB 1: दैनिक हाजिरी (Daily Attendance Marking) */}
      {activeTab === 1 && (
        <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          <Box sx={{ p: 2.5, bgcolor: '#0F2E5A', color: '#ffffff', borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>
                  दैनिक कक्षा हाजिरी व्यवस्थापन (Daily Trainee Attendance)
                </Typography>
                <Typography variant="caption" sx={{ color: '#E2E8F0' }}>
                  समूह छनोट गरी उपस्थित (P) / अनुपस्थित (A) / ढिलो (L) मार्क गरी सुरक्षित गर्नुहोस्।
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                {/* Select Group */}
                <TextField
                  select
                  size="small"
                  label="तालिम समूह छान्नुहोस्"
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

                {/* Date Picker */}
                <TextField
                  type="date"
                  size="small"
                  label="हाजिरी मिति"
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
              </Box>
            </Box>
          </Box>

          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            {attendanceSavedAlert && (
              <Alert severity="success" sx={{ mb: 2.5, borderRadius: 2, fontWeight: 800 }}>
                ✓ {attendanceDate} को हाजिरी सफलतापूर्वक सुरक्षित गरियो! (Attendance Recorded)
              </Alert>
            )}

            {/* Attendance Action Controls */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip
                  label={`कुल विद्यार्थी: ${groupStudents.length}`}
                  sx={{ fontWeight: 800, bgcolor: '#F1F5F9', color: '#1E293B' }}
                />
                <Chip
                  label={`उपस्थित: ${Object.values(attendanceMap).filter((d) => d.status === 'present').length}`}
                  sx={{ fontWeight: 800, bgcolor: '#DCFCE7', color: '#15803D' }}
                />
                <Chip
                  label={`अनुपस्थित: ${Object.values(attendanceMap).filter((d) => d.status === 'absent').length}`}
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
                  सबै उपस्थित (Mark All Present)
                </Button>

                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveAttendance}
                  sx={{ fontWeight: 900, bgcolor: '#0F2E5A', borderRadius: 2 }}
                >
                  हाजिरी सुरक्षित गर्नुहोस्
                </Button>
              </Box>
            </Box>

            {/* Trainee Attendance List */}
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2.5 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 900, width: 60 }}>क्र.सं.</TableCell>
                    <TableCell sx={{ fontWeight: 900 }}>प्रशिक्षार्थीको नाम तथा विवरण</TableCell>
                    <TableCell sx={{ fontWeight: 900 }}>TGID / फोन</TableCell>
                    <TableCell sx={{ fontWeight: 900, textAlign: 'center' }}>समग्र हाजिरी %</TableCell>
                    <TableCell sx={{ fontWeight: 900, textAlign: 'center', width: 140 }}>
                      हाजिरी स्थिति (P 🟢 / A 🔴 / L 🟠)
                    </TableCell>
                    <TableCell sx={{ fontWeight: 900 }}>कैफियत (Remarks)</TableCell>
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
                            title: 'अनुपस्थित (Absent) - थिच्दा ढिलो (L) हुन्छ',
                            text: 'अनुपस्थित',
                            bg: '#EF4444',
                            border: '#DC2626',
                            color: '#FFFFFF'
                          }
                        : currentStatus === 'late'
                        ? {
                            label: 'L',
                            title: 'ढिलो (Late) - थिच्दा उपस्थित (P) हुन्छ',
                            text: 'ढिलो',
                            bg: '#F59E0B',
                            border: '#D97706',
                            color: '#FFFFFF'
                          }
                        : {
                            label: 'P',
                            title: 'उपस्थित (Present) - थिच्दा अनुपस्थित (A) हुन्छ',
                            text: 'उपस्थित',
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
                                {std.gender === 'Female' ? 'महिला' : 'पुरुष'} • {std.address || 'काठमाडौँ'}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B' }}>
                            {std.tgid}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B' }}>
                            {std.phone}
                          </Typography>
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
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
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
                            <Typography
                              variant="caption"
                              sx={{
                                fontWeight: 800,
                                fontSize: '0.72rem',
                                color: statusConfig.bg,
                                display: { xs: 'none', sm: 'inline-block' },
                                minWidth: 46
                              }}
                            >
                              {statusConfig.text}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            placeholder="कैफियत..."
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

      {/* 4. TAB 2: CTEVT लग-बुक (Daily Log Book) */}
      {activeTab === 2 && (
        <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          <Box sx={{ p: 2.5, bgcolor: '#0F2E5A', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                CTEVT दैनिक लग-बुक दर्ता (Daily Training Log Book)
              </Typography>
              <Typography variant="caption" sx={{ color: '#E2E8F0' }}>
                आज कक्षामा सञ्चालन गरिएका सैद्धान्तिक र प्रयोगात्मक पाठहरू दर्ता गर्नुहोस्।
              </Typography>
            </Box>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenLogModal(true)}
              sx={{ bgcolor: '#F59E0B', color: '#0F2E5A', fontWeight: 900, borderRadius: 2 }}
            >
              + नयाँ लग-बुक दर्ता
            </Button>
          </Box>

          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                select
                size="small"
                label="समूह छान्नुहोस्"
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
                    यस समूहमा हालसम्म कुनै पनि दैनिक लग-बुक दर्ता गरिएको छैन। माथिको <b>+ नयाँ लग-बुक दर्ता</b> बटन थिची आजको पाठ प्रविष्ट गर्नुहोस्।
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
                            label={`मिति: ${log.deliveryDate}`}
                            size="small"
                            sx={{ fontWeight: 800, bgcolor: '#0F2E5A', color: '#ffffff' }}
                          />
                          <Chip
                            label={`${log.actualHours || 2} घण्टा`}
                            size="small"
                            sx={{ fontWeight: 800, bgcolor: '#FEF3C7', color: '#92400E' }}
                          />
                        </Box>

                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1E293B', mb: 0.5 }}>
                          पाठ / शीर्षक: {log.topicsCovered}
                        </Typography>

                        {log.materialsUsed && (
                          <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.3 }}>
                            प्रयोग गरिएका सामग्री: {log.materialsUsed}
                          </Typography>
                        )}

                        {log.trainerNotes && (
                          <Typography variant="caption" sx={{ color: '#047857', display: 'block', fontWeight: 600 }}>
                            प्रशिक्षकको टिप्पणी: "{log.trainerNotes}"
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

      {/* 5. TAB 3: सीप मूल्याङ्कन (Competency Assessment) */}
      {activeTab === 3 && (
        <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          <Box sx={{ p: 2.5, bgcolor: '#0F2E5A', color: '#ffffff' }}>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              प्रशिक्षार्थी सीप तथा सक्षमता मूल्याङ्कन (Trainee Competency Matrix)
            </Typography>
            <Typography variant="caption" sx={{ color: '#E2E8F0' }}>
              पाठ्यक्रम अनुसार विद्यार्थीको प्रयोगात्मक सीप हासिल भएको (Competent 'C') प्रमाणित गर्नुहोस्।
            </Typography>
          </Box>

          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ mb: 2 }}>
              <TextField
                select
                size="small"
                label="समूह छान्नुहोस्"
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

            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2.5 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 900 }}>प्रशिक्षार्थी</TableCell>
                    <TableCell sx={{ fontWeight: 900 }}>TGID</TableCell>
                    <TableCell sx={{ fontWeight: 900, textAlign: 'center' }}>सक्षमता स्थिति (Competency)</TableCell>
                    <TableCell sx={{ fontWeight: 900 }}>प्रशिक्षकको सिफारिस</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {groupStudents.map((s) => {
                    const ev = (db.evaluations || []).find(
                      (e) => e.groupId === selectedGroupId && e.studentId === s.id
                    );
                    const isCompetent = ev ? ev.mastered : true;

                    return (
                      <TableRow key={s.id} hover>
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
                            {isCompetent ? '✓ Competent (सक्षम)' : '⏳ Not Yet Competent'}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" sx={{ color: '#475569' }}>
                            {isCompetent ? 'प्रमाणपत्र जारीका लागि सिफारिस' : 'पुनः अभ्यास आवश्यक'}
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

      {/* 6. TAB 4: सूचनाहरू (Notices) */}
      {activeTab === 4 && (
        <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          <Box sx={{ p: 2.5, bgcolor: '#0F2E5A', color: '#ffffff' }}>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              कलेज तथा क्याम्पस आधिकारिक सूचनाहरू (Notice Board)
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
          {viewGroupModal?.group?.name} - विद्यार्थी सूची ({viewGroupModal?.students?.length})
        </DialogTitle>
        <DialogContent sx={{ p: 2.5 }}>
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 900 }}>क्र.सं.</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>नाम</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>TGID</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>फोन</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>ठेगाना</TableCell>
                  <TableCell sx={{ fontWeight: 900, textAlign: 'center' }}>ह्वाट्सएप</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {viewGroupModal?.students?.map((st, i) => (
                  <TableRow key={st.id} hover>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>{st.name}</TableCell>
                    <TableCell>{st.tgid}</TableCell>
                    <TableCell>{st.phone}</TableCell>
                    <TableCell>{st.address || 'काठमाडौँ'}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <IconButton
                        size="small"
                        color="success"
                        onClick={() => {
                          const url = getWhatsAppUrl(st.phone, `नमस्ते ${st.name}, ग्लोबल एरा प्राविधिक स्कुलबाट तालिम सम्बन्धी सन्देश: `);
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
            बन्द गर्नुहोस् (Close)
          </Button>
        </DialogActions>
      </Dialog>

      {/* Daily Logbook Entry Dialog */}
      <Dialog open={openLogModal} onClose={() => setOpenLogModal(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSaveLogBook}>
          <DialogTitle sx={{ bgcolor: '#0F2E5A', color: '#ffffff', fontWeight: 900 }}>
            + दैनिक तालिम लग-बुक प्रविष्टि (CTEVT Daily Log Entry)
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                type="date"
                label="तालिम मिति"
                value={logForm.deliveryDate}
                onChange={(e) => setLogForm({ ...logForm, deliveryDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
                required
              />

              <TextField
                label="आज पढाइएको पाठ / शीर्षक (Topics Covered)"
                placeholder="उदा: कपाल काट्ने सैद्धान्तिक र प्रयोगात्मक अभ्यास..."
                value={logForm.topicsCovered}
                onChange={(e) => setLogForm({ ...logForm, topicsCovered: e.target.value })}
                fullWidth
                required
                multiline
                rows={2}
              />

              <TextField
                label="प्रयोग गरिएका औजार तथा सामग्री (Materials Used)"
                placeholder="उदा: कैंची, एप्रोन, हेयर ड्रायर..."
                value={logForm.materialsUsed}
                onChange={(e) => setLogForm({ ...logForm, materialsUsed: e.target.value })}
                fullWidth
              />

              <TextField
                type="number"
                label="कक्षा चलेको कुल घण्टा (Hours)"
                value={logForm.actualHours}
                onChange={(e) => setLogForm({ ...logForm, actualHours: e.target.value })}
                fullWidth
                inputProps={{ min: 1, max: 8 }}
              />

              <TextField
                label="प्रशिक्षकको टिप्पणी / सुझाव (Trainer Remarks)"
                placeholder="उदा: सबै विद्यार्थीहरूले तोकिएको सीप सन्तोषजनक रूपमा पूरा गरे।"
                value={logForm.trainerNotes}
                onChange={(e) => setLogForm({ ...logForm, trainerNotes: e.target.value })}
                fullWidth
                multiline
                rows={2}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenLogModal(false)}>रद्द गर्नुहोस्</Button>
            <Button type="submit" variant="contained" sx={{ bgcolor: '#0F2E5A', fontWeight: 800 }}>
              सुरक्षित गर्नुहोस् (Save Log)
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
