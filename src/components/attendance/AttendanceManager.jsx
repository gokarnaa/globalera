import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  TextField,
  MenuItem,
  Grid,
  Avatar,
  Alert,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  InputAdornment,
  Paper,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Divider,
  Stack
} from '@mui/material';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import SaveIcon from '@mui/icons-material/Save';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PhoneIcon from '@mui/icons-material/Phone';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import SearchIcon from '@mui/icons-material/Search';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import FolderIcon from '@mui/icons-material/Folder';
import AssessmentIcon from '@mui/icons-material/Assessment';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import SchoolIcon from '@mui/icons-material/School';
import confetti from 'canvas-confetti';
import { loadDB, saveDB, getHolidayInfo, logAudit } from '../../services/storage';
import { getWhatsAppUrl } from '../../services/exportUtils';
import { useAuth } from '../../context/AuthContext';

export default function AttendanceManager({ initialGroupId = null }) {
  const [db, setDb] = useState(loadDB());
  const { currentUser, isTrainer, isAdmin } = useAuth();

  // Top Tabs: 0 = Mark Attendance, 1 = Saved Records, 2 = Reports & Analytics
  const [activeTab, setActiveTab] = useState(0);

  const myGroups = isTrainer
    ? db.trainingGroups.filter((g) => g.trainerId === currentUser?.trainerId)
    : db.trainingGroups;

  // Selected Group and Date for Mark Attendance
  const [selectedGroupId, setSelectedGroupId] = useState(
    initialGroupId || myGroups[0]?.id || db.trainingGroups[0]?.id || ''
  );
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));

  // Current session map: { [studentId]: { status: 'P'|'A'|'L', remarks: '' } }
  const [sessionRecords, setSessionRecords] = useState({});
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [reopenNotice, setReopenNotice] = useState(null);

  const selectedGroup = db.trainingGroups.find((g) => g.id === selectedGroupId);
  const selectedCourse = db.courses.find((c) => c.id === selectedGroup?.courseId);
  const groupStudents = (db.students || []).filter((s) => s.groupId === selectedGroupId);

  const holidayInfo = getHolidayInfo(selectedDate, db.holidays);

  // Load existing attendances when Group or Date changes
  useEffect(() => {
    if (!selectedGroupId || !selectedDate) return;

    const existingAtts = db.attendances.filter(
      (a) => a.groupId === selectedGroupId && a.date === selectedDate
    );

    const initialMap = {};
    groupStudents.forEach((s) => {
      const match = existingAtts.find((a) => a.studentId === s.id);
      let st = 'P';
      if (match) {
        if (match.status === 'present' || match.status === 'P') st = 'P';
        else if (match.status === 'absent' || match.status === 'A') st = 'A';
        else if (match.status === 'late' || match.status === 'L') st = 'L';
      }
      initialMap[s.id] = {
        status: st,
        remarks: match?.remarks || ''
      };
    });

    setSessionRecords(initialMap);
    setSaveSuccess(false);
  }, [selectedGroupId, selectedDate, db.students]);

  // Tab 0 local search & view mode
  const [markSearchQuery, setMarkSearchQuery] = useState('');
  const [markViewMode, setMarkViewMode] = useState('table'); // 'table' | 'card'

  // Tab 1 (Saved Records) search, group filter, sort & view mode
  const [recordsSearchQuery, setRecordsSearchQuery] = useState('');
  const [recordsFilterGroup, setRecordsFilterGroup] = useState('ALL');
  const [recordsSortOrder, setRecordsSortOrder] = useState('desc'); // 'desc' | 'asc'
  const [recordsViewMode, setRecordsViewMode] = useState('table');

  // Tab 2 (Reports) group filter, search & student modal state
  const [reportGroupId, setReportGroupId] = useState(
    initialGroupId || myGroups[0]?.id || db.trainingGroups[0]?.id || ''
  );
  const [reportSearchQuery, setReportSearchQuery] = useState('');
  const [calendarStudentModal, setCalendarStudentModal] = useState(null); // student object

  // ----------------------------------------------------
  // COMPUTED: HISTORICAL SESSIONS (FOR SAVED RECORDS)
  // ----------------------------------------------------
  const historicalSessions = useMemo(() => {
    const sessionMap = {};

    (db.attendances || []).forEach((att) => {
      // If trainer is logged in, restrict to assigned groups
      if (isTrainer && !myGroups.some((g) => g.id === att.groupId)) return;

      const key = `${att.groupId}__${att.date}`;
      if (!sessionMap[key]) {
        const grp = db.trainingGroups.find((g) => g.id === att.groupId);
        const crs = db.courses.find((c) => c.id === grp?.courseId);
        const trn = db.trainers.find((t) => t.id === grp?.trainerId);

        sessionMap[key] = {
          id: key,
          groupId: att.groupId,
          date: att.date,
          groupCode: grp?.groupCode || 'GRP',
          courseTitle: crs?.title || 'Course',
          trainerName: trn?.name || 'TBA',
          shift: grp?.shift || 'A',
          startTime: grp?.startTime || '07:00 AM',
          endTime: grp?.endTime || '09:00 AM',
          records: [],
          presentCount: 0,
          absentCount: 0,
          lateCount: 0
        };
      }

      sessionMap[key].records.push(att);
      const st = String(att.status || '').toLowerCase();
      if (st === 'present' || st === 'p') sessionMap[key].presentCount++;
      else if (st === 'absent' || st === 'a') sessionMap[key].absentCount++;
      else if (st === 'late' || st === 'l') sessionMap[key].lateCount++;
    });

    let list = Object.values(sessionMap);

    // Apply Filter Group
    if (recordsFilterGroup !== 'ALL') {
      list = list.filter((s) => s.groupId === recordsFilterGroup);
    }

    // Apply Search
    if (recordsSearchQuery.trim()) {
      const q = recordsSearchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.date.includes(q) ||
          s.groupCode.toLowerCase().includes(q) ||
          s.courseTitle.toLowerCase().includes(q) ||
          s.trainerName.toLowerCase().includes(q) ||
          s.shift.toLowerCase().includes(q)
      );
    }

    // Apply Sort
    list.sort((a, b) =>
      recordsSortOrder === 'desc'
        ? b.date.localeCompare(a.date)
        : a.date.localeCompare(b.date)
    );

    return list;
  }, [db.attendances, isTrainer, myGroups, recordsFilterGroup, recordsSearchQuery, recordsSortOrder]);

  // ----------------------------------------------------
  // COMPUTED: REPORTS & ANALYTICS DATA (FOR TAB 2)
  // ----------------------------------------------------
  const reportGroup = db.trainingGroups.find((g) => g.id === reportGroupId);
  const reportCourse = db.courses.find((c) => c.id === reportGroup?.courseId);
  const reportStudents = (db.students || []).filter((s) => s.groupId === reportGroupId);

  const reportData = useMemo(() => {
    // Unique dates with attendance for this group
    const groupAtts = (db.attendances || []).filter((a) => a.groupId === reportGroupId);
    const sessionDates = Array.from(new Set(groupAtts.map((a) => a.date))).sort();
    const totalSessionsCount = sessionDates.length;

    let overallP = 0;
    let overallA = 0;
    let overallL = 0;

    const studentStats = reportStudents.map((std) => {
      const myAtts = groupAtts.filter((a) => a.studentId === std.id);
      const p = myAtts.filter((a) => a.status === 'present' || a.status === 'P').length;
      const a = myAtts.filter((a) => a.status === 'absent' || a.status === 'A').length;
      const l = myAtts.filter((a) => a.status === 'late' || a.status === 'L').length;
      const totalAttended = myAtts.length;

      overallP += p;
      overallA += a;
      overallL += l;

      const rate = totalSessionsCount > 0 ? Math.round((p / totalSessionsCount) * 100) : 100;

      // TVET compliance classification:
      // Regular: >= 85%
      // Monitor: 70% - 84%
      // Dropout Risk: < 70%
      let category = 'REGULAR';
      if (rate < 70) category = 'RISK';
      else if (rate < 85) category = 'MONITOR';

      return {
        student: std,
        present: p,
        absent: a,
        late: l,
        totalRecorded: totalAttended,
        rate,
        category
      };
    });

    // Apply report search
    const filteredStats = studentStats.filter((row) => {
      if (!reportSearchQuery.trim()) return true;
      const q = reportSearchQuery.toLowerCase();
      return (
        row.student.name.toLowerCase().includes(q) ||
        row.student.tgid.toLowerCase().includes(q) ||
        row.student.phone.includes(q)
      );
    });

    const totalStudentsCount = reportStudents.length;
    const avgRate =
      totalStudentsCount > 0
        ? Math.round(
            studentStats.reduce((acc, curr) => acc + curr.rate, 0) / totalStudentsCount
          )
        : 100;

    const riskCount = studentStats.filter((r) => r.category === 'RISK').length;
    const monitorCount = studentStats.filter((r) => r.category === 'MONITOR').length;
    const regularCount = studentStats.filter((r) => r.category === 'REGULAR').length;

    return {
      totalSessionsCount,
      totalStudentsCount,
      avgRate,
      riskCount,
      monitorCount,
      regularCount,
      studentStats: filteredStats
    };
  }, [db.attendances, reportGroupId, reportStudents, reportSearchQuery]);

  // Option A: Single Button Cycling (P -> A -> L -> P)
  const handleCycleStatus = (studentId) => {
    setSessionRecords((prev) => {
      const current = prev[studentId]?.status || 'P';
      let next = 'P';
      if (current === 'P') next = 'A';
      else if (current === 'A') next = 'L';
      else if (current === 'L') next = 'P';

      return {
        ...prev,
        [studentId]: {
          ...prev[studentId],
          status: next
        }
      };
    });
  };

  const handleBulkStatus = (statusValue) => {
    const updated = {};
    groupStudents.forEach((s) => {
      updated[s.id] = {
        ...sessionRecords[s.id],
        status: statusValue
      };
    });
    setSessionRecords(updated);
  };

  const displayedStudents = groupStudents.filter((s) => {
    if (!markSearchQuery.trim()) return true;
    const q = markSearchQuery.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.tgid.toLowerCase().includes(q) || s.phone.includes(q);
  });

  // Save Attendance (Upsert logic: groupId + date + studentId)
  const handleSaveAttendance = () => {
    let updatedAttendances = [...db.attendances];

    groupStudents.forEach((s) => {
      const rec = sessionRecords[s.id];
      if (!rec || !rec.status) return;

      const fullStatus =
        rec.status === 'P' ? 'present' : rec.status === 'A' ? 'absent' : 'late';

      const existingIdx = updatedAttendances.findIndex(
        (a) => a.groupId === selectedGroupId && a.date === selectedDate && a.studentId === s.id
      );

      const entry = {
        id: existingIdx >= 0 ? updatedAttendances[existingIdx].id : `ATT-${Date.now()}-${s.id}`,
        groupId: selectedGroupId,
        studentId: s.id,
        date: selectedDate,
        status: fullStatus,
        remarks: rec.remarks || ''
      };

      if (existingIdx >= 0) {
        updatedAttendances[existingIdx] = entry;
      } else {
        updatedAttendances.push(entry);
      }
    });

    let nextDb = { ...db, attendances: updatedAttendances };
    nextDb = logAudit(
      nextDb,
      'UPDATE',
      'Attendance',
      `${selectedGroupId}-${selectedDate}`,
      `Attendance marked for ${selectedGroup?.groupCode || selectedGroupId} on ${selectedDate} (${pCount} Present, ${aCount} Absent, ${lCount} Late)`,
      currentUser?.name || 'Admin'
    );
    saveDB(nextDb);
    setDb(nextDb);
    setSaveSuccess(true);
    setReopenNotice(null);

    try {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
    } catch (_) {}

    setTimeout(() => setSaveSuccess(false), 5000);
  };

  // 1-Click Reopen Session from Saved Records into Mark Attendance
  const handleReopenSession = (session) => {
    setSelectedGroupId(session.groupId);
    setSelectedDate(session.date);
    setActiveTab(0);
    setReopenNotice(
      `सत्र पुनः खोलियो: ${session.date} (${session.groupCode}) — तपाईं अब यहाँ उपस्थिति सच्याउन सक्नुहुन्छ।`
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete an entire session (Admin only)
  const handleDeleteSession = (session) => {
    if (!window.confirm(`के तपाईं निश्चित हुनुहुन्छ? मिति ${session.date} को समूह ${session.groupCode} को सम्पूर्ण हाजिरी मेटिनेछ।`)) {
      return;
    }
    const updatedAttendances = (db.attendances || []).filter(
      (a) => !(a.groupId === session.groupId && a.date === session.date)
    );
    let nextDb = { ...db, attendances: updatedAttendances };
    nextDb = logAudit(
      nextDb,
      'DELETE',
      'Attendance',
      `${session.groupId}-${session.date}`,
      `Attendance session deleted for ${session.groupCode} on ${session.date}`,
      currentUser?.name || 'Admin'
    );
    saveDB(nextDb);
    setDb(nextDb);
  };

  const pCount = Object.values(sessionRecords).filter((r) => r.status === 'P').length;
  const aCount = Object.values(sessionRecords).filter((r) => r.status === 'A').length;
  const lCount = Object.values(sessionRecords).filter((r) => r.status === 'L').length;

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 0.5, sm: 1.5 } }}>
      {/* =======================================================
          TOP BAR & NAVIGATION TABS (MATCHING USER SCREENSHOT)
          ======================================================= */}
      <Card
        sx={{
          mb: 2.5,
          borderRadius: 3.5,
          boxShadow: '0 4px 20px rgba(13, 52, 102, 0.08)',
          border: '1px solid #dce5f2',
          overflow: 'hidden'
        }}
      >
        <Box
          sx={{
            p: { xs: 2, sm: 2.5 },
            background: 'linear-gradient(135deg, #0d3466 0%, #1a56b0 100%)',
            color: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1.5
          }}
        >
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
              <FactCheckIcon sx={{ fontSize: 28, color: '#93c5fd' }} />
              <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: 0.3 }}>
                Attendance Management (हाजिरी व्यवस्थापन)
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', display: 'block', mt: 0.3 }}>
              {isTrainer
                ? `प्रशिक्षक: ${currentUser?.name} • तोकिएका ब्याचहरू: ${myGroups.length}`
                : `एडमिन पोर्टल • कुल सुरक्षित सत्रहरू: ${historicalSessions.length} • कुल हाजिरी: ${db.attendances?.length || 0}`}
            </Typography>
          </Box>

          <Chip
            label={isTrainer ? 'Trainer View' : 'Full Admin View'}
            size="small"
            sx={{
              bgcolor: 'rgba(255,255,255,0.18)',
              color: '#fff',
              fontWeight: 800,
              fontSize: '0.75rem',
              backdropFilter: 'blur(4px)'
            }}
          />
        </Box>

        {/* 3 Modern Segmented Navigation Tabs */}
        <Box sx={{ bgcolor: '#f8fafc', px: { xs: 1, sm: 2 }, pt: 1, borderTop: '1px solid #e2e8f0' }}>
          <Tabs
            value={activeTab}
            onChange={(e, next) => setActiveTab(next)}
            variant="fullWidth"
            sx={{
              '& .MuiTabs-indicator': {
                height: 3.5,
                borderRadius: '3px 3px 0 0',
                bgcolor: '#1a56b0'
              },
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 800,
                fontSize: { xs: '0.85rem', sm: '0.98rem' },
                py: 1.6,
                minHeight: 52,
                color: '#64748b',
                '&.Mui-selected': {
                  color: '#1a56b0'
                }
              }
            }}
          >
            <Tab
              icon={<FactCheckIcon sx={{ fontSize: 20 }} />}
              iconPosition="start"
              label="+ Mark Attendance (दैनिक हाजिरी)"
            />
            <Tab
              icon={<FolderIcon sx={{ fontSize: 20 }} />}
              iconPosition="start"
              label={`📁 Saved Records (${historicalSessions.length} सत्रहरू)`}
            />
            <Tab
              icon={<AssessmentIcon sx={{ fontSize: 20 }} />}
              iconPosition="start"
              label="📊 Reports & Analytics (नियमितता विश्लेषण)"
            />
          </Tabs>
        </Box>
      </Card>

      {/* =======================================================
          TAB 0: MARK DAILY ATTENDANCE (दैनिक हाजिरी लिनुहोस्)
          ======================================================= */}
      {activeTab === 0 && (
        <Box>
          {reopenNotice && (
            <Alert
              severity="info"
              onClose={() => setReopenNotice(null)}
              sx={{ mb: 2, borderRadius: 2.5, fontWeight: 700 }}
            >
              🔄 {reopenNotice}
            </Alert>
          )}

          {/* 1. Sleek & Compact Control Bar */}
          <Card
            sx={{
              p: { xs: 1.5, sm: 2 },
              mb: 2,
              borderRadius: 3,
              boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
              border: '1px solid #e2e8f0'
            }}
          >
            <Grid container spacing={1.5} alignItems="center">
              {/* Group Selector */}
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  size="small"
                  label="तालिम समूह (Batch / Class)"
                  fullWidth
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  sx={{ bgcolor: '#fff' }}
                >
                  {myGroups.map((grp) => (
                    <MenuItem key={grp.id} value={grp.id}>
                      <b>{grp.groupCode}</b> — Shift {grp.shift} ({grp.startTime})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Date Picker */}
              <Grid item xs={6} sm={3}>
                <TextField
                  type="date"
                  size="small"
                  label="हाजिरी मिति"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  sx={{ bgcolor: '#fff' }}
                />
              </Grid>

              {/* Quick Bulk Action Buttons */}
              <Grid item xs={6} sm={2.5}>
                <Box sx={{ display: 'flex', gap: 0.8 }}>
                  <Button
                    variant="outlined"
                    color="success"
                    size="small"
                    onClick={() => handleBulkStatus('P')}
                    sx={{ fontWeight: 800, flex: 1, px: 1, py: 0.8, borderRadius: 2 }}
                  >
                    All P
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={() => handleBulkStatus('A')}
                    sx={{ fontWeight: 800, flex: 1, px: 1, py: 0.8, borderRadius: 2 }}
                  >
                    All A
                  </Button>
                  <Button
                    variant="outlined"
                    color="warning"
                    size="small"
                    onClick={() => handleBulkStatus('L')}
                    sx={{ fontWeight: 800, flex: 1, px: 1, py: 0.8, borderRadius: 2 }}
                  >
                    All L
                  </Button>
                </Box>
              </Grid>

              {/* Save Button */}
              <Grid item xs={12} sm={2.5}>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  size="medium"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveAttendance}
                  sx={{
                    fontWeight: 800,
                    py: 0.9,
                    fontSize: '0.95rem',
                    borderRadius: 2.5,
                    boxShadow: '0 4px 12px rgba(26,86,176,0.3)'
                  }}
                >
                  Submit Attendance
                </Button>
              </Grid>
            </Grid>

            {/* Compact Live Counter Strip */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mt: 1.5,
                pt: 1.5,
                borderTop: '1px solid #f1f5f9',
                flexWrap: 'wrap',
                gap: 1
              }}
            >
              <Typography variant="body2" sx={{ color: '#475569', fontWeight: 700 }}>
                {selectedCourse?.title} • Shift {selectedGroup?.shift} ({selectedGroup?.startTime} – {selectedGroup?.endTime})
              </Typography>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip
                  label={`P: ${pCount}`}
                  size="small"
                  sx={{ bgcolor: '#e5f8ee', color: '#16834b', fontWeight: 900, px: 0.5 }}
                />
                <Chip
                  label={`A: ${aCount}`}
                  size="small"
                  sx={{ bgcolor: '#fdeceb', color: '#d5372f', fontWeight: 900, px: 0.5 }}
                />
                <Chip
                  label={`L: ${lCount}`}
                  size="small"
                  sx={{ bgcolor: '#fff7df', color: '#c9820a', fontWeight: 900, px: 0.5 }}
                />
                <Chip
                  label={`Total: ${groupStudents.length}`}
                  size="small"
                  sx={{ bgcolor: '#f1f5f9', color: '#334155', fontWeight: 800 }}
                />
              </Box>
            </Box>
          </Card>

          {saveSuccess && (
            <Alert severity="success" sx={{ mb: 2, borderRadius: 2.5, fontWeight: 700 }}>
              ✓ Attendance successfully saved and synced!
            </Alert>
          )}

          {holidayInfo.isHoliday && (
            <Alert
              severity="warning"
              sx={{
                mb: 2,
                borderRadius: 2.5,
                fontWeight: 700,
                py: 0.8,
                border: '1px solid #fed7aa',
                bgcolor: '#fffbeb',
                color: '#9a3412'
              }}
            >
              🏖️ <b>सार्वजनिक बिदा सूचना (Holiday Notice):</b> {holidayInfo.name} ({holidayInfo.type}) — यदि आज अतिरिक्त/विशेष कक्षा सञ्चालन गरिएको भए मात्र हाजिरी दर्ता गर्नुहोस्।
            </Alert>
          )}

          {/* Search Bar & View Mode Switcher */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
              flexWrap: 'wrap',
              gap: 1.5
            }}
          >
            <TextField
              size="small"
              placeholder="विद्यार्थी खोज्नुहोस् (Search Name, Phone, TGID)..."
              value={markSearchQuery}
              onChange={(e) => setMarkSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#647089', fontSize: 20 }} />
                  </InputAdornment>
                )
              }}
              sx={{ minWidth: { xs: '100%', sm: 320 }, bgcolor: '#fff', borderRadius: 2 }}
            />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" sx={{ color: '#647089', fontWeight: 700, display: { xs: 'none', sm: 'block' } }}>
                दृश्य (View):
              </Typography>
              <ToggleButtonGroup
                value={markViewMode}
                exclusive
                onChange={(e, next) => next && setMarkViewMode(next)}
                size="small"
                sx={{ bgcolor: '#fff' }}
              >
                <ToggleButton value="table" sx={{ fontWeight: 700, px: 1.5 }}>
                  <ViewListIcon fontSize="small" sx={{ mr: 0.5 }} /> Table View
                </ToggleButton>
                <ToggleButton value="card" sx={{ fontWeight: 700, px: 1.5 }}>
                  <ViewModuleIcon fontSize="small" sx={{ mr: 0.5 }} /> Card View
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>

          {/* 2. TABLE VIEW: ROCK-SOLID SINGLE CYCLE BUTTON (P -> A -> L) */}
          {markViewMode === 'table' ? (
            <Card
              sx={{
                borderRadius: 3.5,
                boxShadow: '0 4px 18px rgba(0,0,0,0.05)',
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
                mb: 4
              }}
            >
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table sx={{ minWidth: 650 }}>
                  <TableHead sx={{ bgcolor: '#0d3466' }}>
                    <TableRow>
                      <TableCell sx={{ color: '#fff', fontWeight: 800, width: 70, textAlign: 'center', py: 1.8 }}>
                        क्र.सं.
                      </TableCell>
                      <TableCell sx={{ color: '#fff', fontWeight: 800, py: 1.8 }}>
                        विद्यार्थीको विवरण (Trainee Details)
                      </TableCell>
                      <TableCell sx={{ color: '#fff', fontWeight: 800, width: 280, textAlign: 'center', py: 1.8 }}>
                        हाजिरी स्थिति (P ➔ A ➔ L)
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {displayedStudents.map((std, idx) => {
                      const rec = sessionRecords[std.id] || { status: 'P', remarks: '' };
                      const selectedStatus = rec.status; // 'P', 'A', 'L'

                      const btnBg =
                        selectedStatus === 'P'
                          ? '#16834b'
                          : selectedStatus === 'A'
                          ? '#d5372f'
                          : '#d48806';

                      const btnBorder =
                        selectedStatus === 'P'
                          ? '#118146'
                          : selectedStatus === 'A'
                          ? '#b82b24'
                          : '#b57204';

                      const btnShadow =
                        selectedStatus === 'P'
                          ? '0 4px 14px rgba(22, 131, 75, 0.45)'
                          : selectedStatus === 'A'
                          ? '0 4px 14px rgba(213, 55, 47, 0.45)'
                          : '0 4px 14px rgba(212, 136, 6, 0.45)';

                      const statusTitle =
                        selectedStatus === 'P'
                          ? 'Present (उपस्थित)'
                          : selectedStatus === 'A'
                          ? 'Absent (अनुपस्थित)'
                          : 'Late (ढिला)';

                      const chipBg =
                        selectedStatus === 'P'
                          ? '#e5f8ee'
                          : selectedStatus === 'A'
                          ? '#fdeceb'
                          : '#fff7df';

                      const chipColor =
                        selectedStatus === 'P'
                          ? '#16834b'
                          : selectedStatus === 'A'
                          ? '#d5372f'
                          : '#c9820a';

                      return (
                        <TableRow
                          key={std.id}
                          sx={{
                            '&:nth-of-type(even)': { bgcolor: '#fbfcfd' },
                            '&:hover': { bgcolor: '#f1f6ff' },
                            transition: 'background-color 0.15s'
                          }}
                        >
                          <TableCell
                            sx={{
                              fontWeight: 900,
                              fontSize: '1.05rem',
                              color: '#647089',
                              textAlign: 'center',
                              py: { xs: 1.5, sm: 2 }
                            }}
                          >
                            {idx + 1}
                          </TableCell>

                          <TableCell sx={{ py: { xs: 1.5, sm: 2 } }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.8 }}>
                              <Avatar
                                src={std.photoUrl}
                                sx={{
                                  width: { xs: 44, sm: 50 },
                                  height: { xs: 44, sm: 50 },
                                  bgcolor: '#1a56b0',
                                  fontWeight: 800,
                                  fontSize: '1.1rem',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                }}
                              >
                                {std.name[0]}
                              </Avatar>
                              <Box sx={{ minWidth: 0 }}>
                                <Typography
                                  variant="subtitle1"
                                  sx={{
                                    fontWeight: 800,
                                    color: '#152238',
                                    fontSize: { xs: '0.95rem', sm: '1.1rem' },
                                    lineHeight: 1.2
                                  }}
                                >
                                  {std.name}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: '#647089',
                                    fontWeight: 600,
                                    fontSize: '0.8rem',
                                    display: 'block',
                                    mt: 0.3
                                  }}
                                >
                                  {std.tgid} • {std.phone}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>

                          <TableCell sx={{ textAlign: 'center', width: 280, minWidth: 280, maxWidth: 280, py: { xs: 1.5, sm: 2 } }}>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 1.5,
                                width: 250,
                                mx: 'auto'
                              }}
                            >
                              <Box sx={{ width: 56, minWidth: 56, maxWidth: 56, height: 56, flexShrink: 0 }}>
                                <Tooltip title="ट्याप गर्नुहोस्: स्थिति परिवर्तन हुन्छ (P ➔ A ➔ L)">
                                  <Button
                                    onClick={() => handleCycleStatus(std.id)}
                                    sx={{
                                      width: 56,
                                      height: 56,
                                      minWidth: 56,
                                      maxWidth: 56,
                                      borderRadius: '50%',
                                      p: 0,
                                      fontSize: '1.45rem',
                                      fontWeight: 900,
                                      cursor: 'pointer',
                                      border: `3px solid ${btnBorder}`,
                                      bgcolor: `${btnBg} !important`,
                                      color: '#ffffff',
                                      boxShadow: btnShadow,
                                      transition: 'background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
                                      '&:hover': {
                                        boxShadow: `0 6px 18px ${btnBg}66`
                                      }
                                    }}
                                  >
                                    {selectedStatus}
                                  </Button>
                                </Tooltip>
                              </Box>

                              <Box sx={{ width: 130, minWidth: 130, maxWidth: 130, flexShrink: 0, textAlign: 'left' }}>
                                <Chip
                                  label={statusTitle}
                                  size="small"
                                  onClick={() => handleCycleStatus(std.id)}
                                  sx={{
                                    bgcolor: chipBg,
                                    color: chipColor,
                                    fontWeight: 800,
                                    fontSize: '0.78rem',
                                    cursor: 'pointer',
                                    width: '100%',
                                    justifyContent: 'center',
                                    '&:hover': { opacity: 0.9 }
                                  }}
                                />
                                <Typography
                                  variant="caption"
                                  sx={{
                                    display: 'block',
                                    color: '#94a3b8',
                                    fontSize: '0.7rem',
                                    mt: 0.3,
                                    textAlign: 'center'
                                  }}
                                >
                                  Tap to cycle
                                </Typography>
                              </Box>

                              <Box sx={{ width: 38, minWidth: 38, maxWidth: 38, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
                                {selectedStatus === 'A' ? (
                                  <Tooltip title="Send WhatsApp absent notice to parent">
                                    <IconButton
                                      size="small"
                                      component="a"
                                      href={getWhatsAppUrl(
                                        std.guardianContact || std.phone,
                                        `Namaste, this is from KITE Training Center. Student ${std.name} (${std.tgid}) was marked Absent on ${selectedDate}.`
                                      )}
                                      target="_blank"
                                      sx={{
                                        color: '#25D366',
                                        bgcolor: '#e5f8ee',
                                        border: '1px solid #bdf0d2',
                                        '&:hover': { bgcolor: '#c9efd9' }
                                      }}
                                    >
                                      <WhatsAppIcon sx={{ fontSize: 20 }} />
                                    </IconButton>
                                  </Tooltip>
                                ) : null}
                              </Box>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}

                    {displayedStudents.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} sx={{ textAlign: 'center', py: 6, color: '#94a3b8' }}>
                          कुनै विद्यार्थी भेटिएन (No students matched).
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          ) : (
            /* CARD VIEW */
            <Grid container spacing={2} sx={{ mb: 4 }}>
              {displayedStudents.map((std, idx) => {
                const rec = sessionRecords[std.id] || { status: 'P', remarks: '' };
                const selectedStatus = rec.status;

                const btnBg =
                  selectedStatus === 'P'
                    ? '#16834b'
                    : selectedStatus === 'A'
                    ? '#d5372f'
                    : '#d48806';

                const btnBorder =
                  selectedStatus === 'P'
                    ? '#118146'
                    : selectedStatus === 'A'
                    ? '#b82b24'
                    : '#b57204';

                const btnShadow =
                  selectedStatus === 'P'
                    ? '0 4px 14px rgba(22, 131, 75, 0.45)'
                    : selectedStatus === 'A'
                    ? '0 4px 14px rgba(213, 55, 47, 0.45)'
                    : '0 4px 14px rgba(212, 136, 6, 0.45)';

                const statusTitle =
                  selectedStatus === 'P'
                    ? 'Present'
                    : selectedStatus === 'A'
                    ? 'Absent'
                    : 'Late';

                const chipBg =
                  selectedStatus === 'P'
                    ? '#e5f8ee'
                    : selectedStatus === 'A'
                    ? '#fdeceb'
                    : '#fff7df';

                const chipColor =
                  selectedStatus === 'P'
                    ? '#16834b'
                    : selectedStatus === 'A'
                    ? '#d5372f'
                    : '#c9820a';

                return (
                  <Grid item xs={12} sm={6} md={4} key={std.id}>
                    <Card
                      sx={{
                        p: 2,
                        borderRadius: 3,
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 3px 12px rgba(0,0,0,0.04)',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                          borderColor: '#cbd5e1'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                        <Chip
                          label={`S.N. ${idx + 1}`}
                          size="small"
                          sx={{ bgcolor: '#f1f5f9', fontWeight: 900, color: '#475569' }}
                        />
                        <Chip
                          label={std.tgid}
                          size="small"
                          sx={{ bgcolor: '#e8f0fd', color: '#1a56b0', fontWeight: 800 }}
                        />
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                        <Avatar
                          src={std.photoUrl}
                          sx={{ width: 48, height: 48, bgcolor: '#1a56b0', fontWeight: 800, fontSize: '1.1rem' }}
                        >
                          {std.name[0]}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                            {std.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#647089', display: 'block', mt: 0.3 }}>
                            {std.phone}
                          </Typography>
                        </Box>
                      </Box>

                      <Paper
                        variant="outlined"
                        sx={{
                          p: 1.8,
                          borderRadius: 2.5,
                          bgcolor: '#f8fafc',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{ width: 54, minWidth: 54, maxWidth: 54, height: 54, flexShrink: 0 }}>
                            <Button
                              onClick={() => handleCycleStatus(std.id)}
                              sx={{
                                width: 54,
                                height: 54,
                                minWidth: 54,
                                maxWidth: 54,
                                borderRadius: '50%',
                                p: 0,
                                fontSize: '1.4rem',
                                fontWeight: 900,
                                cursor: 'pointer',
                                border: `3px solid ${btnBorder}`,
                                bgcolor: `${btnBg} !important`,
                                color: '#ffffff',
                                boxShadow: btnShadow
                              }}
                            >
                              {selectedStatus}
                            </Button>
                          </Box>

                          <Box sx={{ width: 120, minWidth: 120, maxWidth: 120, flexShrink: 0 }}>
                            <Chip
                              label={statusTitle}
                              size="small"
                              onClick={() => handleCycleStatus(std.id)}
                              sx={{
                                bgcolor: chipBg,
                                color: chipColor,
                                fontWeight: 800,
                                cursor: 'pointer',
                                width: '100%',
                                justifyContent: 'center'
                              }}
                            />
                            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mt: 0.4, textAlign: 'center' }}>
                              Tap to cycle
                            </Typography>
                          </Box>
                        </Box>

                        <Box sx={{ width: 40, minWidth: 40, maxWidth: 40, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
                          {selectedStatus === 'A' ? (
                            <Tooltip title="Send WhatsApp alert to parent">
                              <IconButton
                                size="medium"
                                component="a"
                                href={getWhatsAppUrl(
                                  std.guardianContact || std.phone,
                                  `Namaste, this is from KITE Training Center. Student ${std.name} (${std.tgid}) was marked Absent on ${selectedDate}.`
                                )}
                                target="_blank"
                                sx={{ color: '#25D366', bgcolor: '#e5f8ee' }}
                              >
                                <WhatsAppIcon />
                              </IconButton>
                            </Tooltip>
                          ) : null}
                        </Box>
                      </Paper>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Box>
      )}

      {/* =======================================================
          TAB 1: SAVED RECORDS (सत्रहरूको इतिहास र १-क्लिक रिओपन)
          ======================================================= */}
      {activeTab === 1 && (
        <Box>
          <Card
            sx={{
              p: 2,
              mb: 2.5,
              borderRadius: 3,
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
            }}
          >
            <Grid container spacing={2} alignItems="center">
              {/* Search */}
              <Grid item xs={12} sm={4}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="सत्र खोज्नुहोस् (Search Date, Course, Batch)..."
                  value={recordsSearchQuery}
                  onChange={(e) => setRecordsSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: '#647089' }} />
                      </InputAdornment>
                    )
                  }}
                  sx={{ bgcolor: '#fff' }}
                />
              </Grid>

              {/* Group Filter */}
              <Grid item xs={6} sm={3}>
                <TextField
                  select
                  size="small"
                  label="समूह फिल्टर (Group)"
                  fullWidth
                  value={recordsFilterGroup}
                  onChange={(e) => setRecordsFilterGroup(e.target.value)}
                  sx={{ bgcolor: '#fff' }}
                >
                  <MenuItem value="ALL">All Batches (सबै समूह)</MenuItem>
                  {myGroups.map((grp) => (
                    <MenuItem key={grp.id} value={grp.id}>
                      {grp.groupCode} — Shift {grp.shift}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Sort Order */}
              <Grid item xs={6} sm={2.5}>
                <TextField
                  select
                  size="small"
                  label="क्रम (Sort)"
                  fullWidth
                  value={recordsSortOrder}
                  onChange={(e) => setRecordsSortOrder(e.target.value)}
                  sx={{ bgcolor: '#fff' }}
                >
                  <MenuItem value="desc">Newest First (नयाँ पहिले)</MenuItem>
                  <MenuItem value="asc">Oldest First (पुरानो पहिले)</MenuItem>
                </TextField>
              </Grid>

              {/* View Toggle */}
              <Grid item xs={12} sm={2.5} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
                <ToggleButtonGroup
                  value={recordsViewMode}
                  exclusive
                  onChange={(e, next) => next && setRecordsViewMode(next)}
                  size="small"
                  sx={{ bgcolor: '#fff' }}
                >
                  <ToggleButton value="table" sx={{ fontWeight: 700, px: 1.5 }}>
                    <ViewListIcon fontSize="small" sx={{ mr: 0.5 }} /> Table
                  </ToggleButton>
                  <ToggleButton value="card" sx={{ fontWeight: 700, px: 1.5 }}>
                    <ViewModuleIcon fontSize="small" sx={{ mr: 0.5 }} /> Cards
                  </ToggleButton>
                </ToggleButtonGroup>
              </Grid>
            </Grid>
          </Card>

          {/* TABLE OF SESSIONS */}
          {recordsViewMode === 'table' ? (
            <Card
              sx={{
                borderRadius: 3.5,
                boxShadow: '0 4px 18px rgba(0,0,0,0.05)',
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
                mb: 4
              }}
            >
              <TableContainer>
                <Table sx={{ minWidth: 800 }}>
                  <TableHead sx={{ bgcolor: '#0d3466' }}>
                    <TableRow>
                      <TableCell sx={{ color: '#fff', fontWeight: 800, width: 60, textAlign: 'center' }}>#</TableCell>
                      <TableCell sx={{ color: '#fff', fontWeight: 800 }}>हाजिरी मिति (Date)</TableCell>
                      <TableCell sx={{ color: '#fff', fontWeight: 800 }}>तालिम समूह / कोर्स (Batch & Course)</TableCell>
                      <TableCell sx={{ color: '#fff', fontWeight: 800 }}>सिफ्ट तथा प्रशिक्षक (Shift & Trainer)</TableCell>
                      <TableCell sx={{ color: '#fff', fontWeight: 800, textAlign: 'center' }}>कुल विद्यार्थी</TableCell>
                      <TableCell sx={{ color: '#fff', fontWeight: 800, textAlign: 'center' }}>उपस्थिति विभाजन (P / A / L)</TableCell>
                      <TableCell sx={{ color: '#fff', fontWeight: 800, textAlign: 'right' }}>कार्य (Actions)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {historicalSessions.map((session, idx) => (
                      <TableRow
                        key={session.id}
                        sx={{
                          '&:nth-of-type(even)': { bgcolor: '#fbfcfd' },
                          '&:hover': { bgcolor: '#f1f6ff' }
                        }}
                      >
                        <TableCell sx={{ fontWeight: 800, color: '#647089', textAlign: 'center' }}>
                          {idx + 1}
                        </TableCell>

                        <TableCell>
                          <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0f172a' }}>
                            {session.date}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#647089' }}>
                            {new Date(session.date).toLocaleDateString('ne-NP', { weekday: 'long' })}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.3 }}>
                            <Chip
                              label={session.groupCode}
                              size="small"
                              sx={{ fontWeight: 800, bgcolor: '#e0f2fe', color: '#0369a1' }}
                            />
                            <Typography variant="body2" sx={{ fontWeight: 800 }}>
                              {session.courseTitle}
                            </Typography>
                          </Box>
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155' }}>
                            Shift {session.shift} ({session.startTime} – {session.endTime})
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#647089' }}>
                            प्रशिक्षक: {session.trainerName}
                          </Typography>
                        </TableCell>

                        <TableCell sx={{ textAlign: 'center' }}>
                          <Chip
                            label={`${session.records.length} Trainees`}
                            size="small"
                            sx={{ fontWeight: 800, bgcolor: '#f1f5f9', color: '#1e293b' }}
                          />
                        </TableCell>

                        <TableCell sx={{ textAlign: 'center' }}>
                          <Box sx={{ display: 'flex', gap: 0.8, justifyContent: 'center' }}>
                            <Chip
                              label={`${session.presentCount} P`}
                              size="small"
                              sx={{ bgcolor: '#e5f8ee', color: '#16834b', fontWeight: 900 }}
                            />
                            <Chip
                              label={`${session.absentCount} A`}
                              size="small"
                              sx={{ bgcolor: '#fdeceb', color: '#d5372f', fontWeight: 900 }}
                            />
                            <Chip
                              label={`${session.lateCount} L`}
                              size="small"
                              sx={{ bgcolor: '#fff7df', color: '#c9820a', fontWeight: 900 }}
                            />
                          </Box>
                        </TableCell>

                        <TableCell sx={{ textAlign: 'right' }}>
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<EditIcon sx={{ fontSize: 16 }} />}
                              onClick={() => handleReopenSession(session)}
                              sx={{
                                fontWeight: 800,
                                fontSize: '0.78rem',
                                borderRadius: 2,
                                textTransform: 'none',
                                bgcolor: '#1a56b0',
                                '&:hover': { bgcolor: '#0d3466' }
                              }}
                            >
                              सच्याउनुहोस् (Edit)
                            </Button>

                            {isAdmin && (
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteSession(session)}
                                sx={{ border: '1px solid #fecaca' }}
                              >
                                <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}

                    {historicalSessions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} sx={{ textAlign: 'center', py: 8, color: '#94a3b8' }}>
                          कुनै सुरक्षित हाजिरी सत्र फेला परेन (No attendance sessions found).
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          ) : (
            /* CARD VIEW FOR SESSIONS */
            <Grid container spacing={2} sx={{ mb: 4 }}>
              {historicalSessions.map((session, idx) => (
                <Grid item xs={12} sm={6} md={4} key={session.id}>
                  <Card
                    sx={{
                      p: 2,
                      borderRadius: 3.5,
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 3px 14px rgba(0,0,0,0.04)',
                      transition: 'all 0.2s',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 24px rgba(13, 52, 102, 0.1)',
                        borderColor: '#93c5fd'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Chip
                        label={`#${idx + 1} • ${session.date}`}
                        size="small"
                        sx={{ bgcolor: '#0d3466', color: '#fff', fontWeight: 800 }}
                      />
                      <Chip
                        label={session.groupCode}
                        size="small"
                        sx={{ bgcolor: '#e0f2fe', color: '#0369a1', fontWeight: 800 }}
                      />
                    </Box>

                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.3, mt: 1 }}>
                      {session.courseTitle}
                    </Typography>

                    <Typography variant="caption" sx={{ color: '#647089', display: 'block', mt: 0.5 }}>
                      Shift {session.shift} ({session.startTime} – {session.endTime}) • Trainer: <b>{session.trainerName}</b>
                    </Typography>

                    <Divider sx={{ my: 1.5 }} />

                    {/* Breakdown Pills */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ display: 'flex', gap: 0.8 }}>
                        <Chip
                          label={`${session.presentCount} P`}
                          size="small"
                          sx={{ bgcolor: '#e5f8ee', color: '#16834b', fontWeight: 900 }}
                        />
                        <Chip
                          label={`${session.absentCount} A`}
                          size="small"
                          sx={{ bgcolor: '#fdeceb', color: '#d5372f', fontWeight: 900 }}
                        />
                        <Chip
                          label={`${session.lateCount} L`}
                          size="small"
                          sx={{ bgcolor: '#fff7df', color: '#c9820a', fontWeight: 900 }}
                        />
                      </Box>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569' }}>
                        {session.records.length} जना
                      </Typography>
                    </Box>

                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<EditIcon />}
                      onClick={() => handleReopenSession(session)}
                      sx={{
                        fontWeight: 800,
                        borderRadius: 2,
                        textTransform: 'none',
                        color: '#1a56b0',
                        borderColor: '#93c5fd',
                        '&:hover': { bgcolor: '#eff6ff', borderColor: '#1a56b0' }
                      }}
                    >
                      सच्याउनुहोस् / विवरण हेर्नुहोस् (Edit)
                    </Button>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {/* =======================================================
          TAB 2: REPORTS & ANALYTICS (८५% र ७०% नियमितता विश्लेषण)
          ======================================================= */}
      {activeTab === 2 && (
        <Box>
          {/* Controls Bar for Reports */}
          <Card
            sx={{
              p: 2,
              mb: 2.5,
              borderRadius: 3,
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
            }}
          >
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  size="small"
                  label="तालिम समूह छान्नुहोस् (Select Batch)"
                  fullWidth
                  value={reportGroupId}
                  onChange={(e) => setReportGroupId(e.target.value)}
                  sx={{ bgcolor: '#fff' }}
                >
                  {myGroups.map((grp) => (
                    <MenuItem key={grp.id} value={grp.id}>
                      <b>{grp.groupCode}</b> — Shift {grp.shift} ({grp.startTime})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="विद्यार्थी खोज्नुहोस् (Search Trainee in Report)..."
                  value={reportSearchQuery}
                  onChange={(e) => setReportSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: '#647089' }} />
                      </InputAdornment>
                    )
                  }}
                  sx={{ bgcolor: '#fff' }}
                />
              </Grid>
            </Grid>
          </Card>

          {/* 4 KPI SUMMARY CARDS */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} md={3}>
              <Card sx={{ p: 2, borderRadius: 3, border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#1a56b0' }}>
                  {reportData.totalSessionsCount}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                  कुल सञ्चालित कक्षा (Sessions Held)
                </Typography>
              </Card>
            </Grid>

            <Grid item xs={6} md={3}>
              <Card sx={{ p: 2, borderRadius: 3, border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#16834b' }}>
                  {reportData.avgRate}%
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                  औसत उपस्थिति दर (Average Attendance)
                </Typography>
              </Card>
            </Grid>

            <Grid item xs={6} md={3}>
              <Card sx={{ p: 2, borderRadius: 3, border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#0284c7' }}>
                  {reportData.regularCount} / {reportData.totalStudentsCount}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                  नियमित विद्यार्थी (Regular ≥ 85%)
                </Typography>
              </Card>
            </Grid>

            <Grid item xs={6} md={3}>
              <Card
                sx={{
                  p: 2,
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: reportData.riskCount > 0 ? '#fca5a5' : '#e2e8f0',
                  bgcolor: reportData.riskCount > 0 ? '#fff1f2' : '#fff',
                  textAlign: 'center'
                }}
              >
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 900, color: reportData.riskCount > 0 ? '#e11d48' : '#64748b' }}
                >
                  {reportData.riskCount}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 800, color: reportData.riskCount > 0 ? '#e11d48' : '#64748b' }}
                >
                  ड्रपआउट जोखिम (Dropout Risk &lt; 70%)
                </Typography>
              </Card>
            </Grid>
          </Grid>

          {/* STUDENT COMPLIANCE TABLE */}
          <Card
            sx={{
              borderRadius: 3.5,
              boxShadow: '0 4px 18px rgba(0,0,0,0.05)',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              mb: 4
            }}
          >
            <Box
              sx={{
                p: 2,
                bgcolor: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 1
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#0f172a' }}>
                विद्यार्थीगत नियमितता स्थिति (Trainee Compliance &amp; Dropout Tracking)
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip label={`Regular: ${reportData.regularCount}`} size="small" sx={{ bgcolor: '#e5f8ee', color: '#16834b', fontWeight: 800 }} />
                <Chip label={`Monitor: ${reportData.monitorCount}`} size="small" sx={{ bgcolor: '#fff7df', color: '#c9820a', fontWeight: 800 }} />
                <Chip label={`Risk: ${reportData.riskCount}`} size="small" sx={{ bgcolor: '#fdeceb', color: '#d5372f', fontWeight: 800 }} />
              </Box>
            </Box>

            <TableContainer>
              <Table sx={{ minWidth: 800 }}>
                <TableHead sx={{ bgcolor: '#0d3466' }}>
                  <TableRow>
                    <TableCell sx={{ color: '#fff', fontWeight: 800, width: 60, textAlign: 'center' }}>#</TableCell>
                    <TableCell sx={{ color: '#fff', fontWeight: 800 }}>विद्यार्थीको नाम (Trainee Name)</TableCell>
                    <TableCell sx={{ color: '#fff', fontWeight: 800, textAlign: 'center' }}>कुल कक्षा (Total)</TableCell>
                    <TableCell sx={{ color: '#fff', fontWeight: 800, textAlign: 'center' }}>उपस्थित (P)</TableCell>
                    <TableCell sx={{ color: '#fff', fontWeight: 800, textAlign: 'center' }}>अनुपस्थित (A)</TableCell>
                    <TableCell sx={{ color: '#fff', fontWeight: 800, textAlign: 'center' }}>ढिलो (L)</TableCell>
                    <TableCell sx={{ color: '#fff', fontWeight: 800, width: 180 }}>हाजिरी % (Compliance)</TableCell>
                    <TableCell sx={{ color: '#fff', fontWeight: 800, textAlign: 'center' }}>TVET वर्गीकरण</TableCell>
                    <TableCell sx={{ color: '#fff', fontWeight: 800, textAlign: 'right' }}>कार्य (Actions)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportData.studentStats.map((row, idx) => {
                    const std = row.student;
                    const isRisk = row.category === 'RISK';
                    const isMonitor = row.category === 'MONITOR';

                    const progressColor = isRisk ? '#e11d48' : isMonitor ? '#d97706' : '#16834b';

                    return (
                      <TableRow
                        key={std.id}
                        sx={{
                          bgcolor: isRisk ? '#fff1f2' : idx % 2 === 0 ? '#fff' : '#fbfcfd',
                          '&:hover': { bgcolor: '#f1f6ff' }
                        }}
                      >
                        <TableCell sx={{ fontWeight: 800, color: '#647089', textAlign: 'center' }}>
                          {idx + 1}
                        </TableCell>

                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar
                              src={std.photoUrl}
                              sx={{
                                width: 40,
                                height: 40,
                                bgcolor: isRisk ? '#e11d48' : '#1a56b0',
                                fontWeight: 800
                              }}
                            >
                              {std.name[0]}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                                {std.name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#647089' }}>
                                {std.tgid} • {std.phone}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>

                        <TableCell sx={{ textAlign: 'center', fontWeight: 800 }}>
                          {reportData.totalSessionsCount}
                        </TableCell>

                        <TableCell sx={{ textAlign: 'center', fontWeight: 800, color: '#16834b' }}>
                          {row.present}
                        </TableCell>

                        <TableCell sx={{ textAlign: 'center', fontWeight: 800, color: '#d5372f' }}>
                          {row.absent}
                        </TableCell>

                        <TableCell sx={{ textAlign: 'center', fontWeight: 800, color: '#c9820a' }}>
                          {row.late}
                        </TableCell>

                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(100, Math.max(0, row.rate))}
                              sx={{
                                flex: 1,
                                height: 8,
                                borderRadius: 4,
                                bgcolor: '#e2e8f0',
                                '& .MuiLinearProgress-bar': {
                                  bgcolor: progressColor,
                                  borderRadius: 4
                                }
                              }}
                            />
                            <Typography variant="body2" sx={{ fontWeight: 900, minWidth: 42, color: progressColor }}>
                              {row.rate}%
                            </Typography>
                          </Box>
                        </TableCell>

                        <TableCell sx={{ textAlign: 'center' }}>
                          {row.category === 'REGULAR' && (
                            <Chip
                              label="Regular (≥85%)"
                              size="small"
                              sx={{ bgcolor: '#e5f8ee', color: '#16834b', fontWeight: 800 }}
                            />
                          )}
                          {row.category === 'MONITOR' && (
                            <Chip
                              label="Monitor (70-84%)"
                              size="small"
                              sx={{ bgcolor: '#fff7df', color: '#b45309', fontWeight: 800 }}
                            />
                          )}
                          {row.category === 'RISK' && (
                            <Chip
                              label="Dropout Risk (<70%)"
                              size="small"
                              sx={{ bgcolor: '#ffe4e6', color: '#e11d48', fontWeight: 900 }}
                            />
                          )}
                        </TableCell>

                        <TableCell sx={{ textAlign: 'right' }}>
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<CalendarMonthIcon sx={{ fontSize: 16 }} />}
                              onClick={() => setCalendarStudentModal(std)}
                              sx={{
                                fontWeight: 800,
                                fontSize: '0.75rem',
                                borderRadius: 2,
                                textTransform: 'none'
                              }}
                            >
                              इतिहास (History)
                            </Button>

                            {isRisk && (
                              <Tooltip title="Send Attendance Alert via WhatsApp">
                                <IconButton
                                  size="small"
                                  component="a"
                                  href={getWhatsAppUrl(
                                    std.guardianContact || std.phone,
                                    `Namaste, this is from KITE Training Center. Student ${std.name} (${std.tgid}) has an attendance rate of ${row.rate}%, which is below the 85% requirement. Please ensure regular attendance.`
                                  )}
                                  target="_blank"
                                  sx={{ color: '#25D366', bgcolor: '#e5f8ee', border: '1px solid #86efac' }}
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

                  {reportData.studentStats.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} sx={{ textAlign: 'center', py: 8, color: '#94a3b8' }}>
                        कुनै विद्यार्थी फेला परेन (No trainees found for this batch).
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Box>
      )}

      {/* =======================================================
          INDIVIDUAL STUDENT ATTENDANCE CALENDAR MODAL
          ======================================================= */}
      {calendarStudentModal && (() => {
        const std = calendarStudentModal;
        const myAtts = (db.attendances || [])
          .filter((a) => a.studentId === std.id && a.groupId === std.groupId)
          .sort((a, b) => b.date.localeCompare(a.date));

        const p = myAtts.filter((a) => a.status === 'present' || a.status === 'P').length;
        const a = myAtts.filter((a) => a.status === 'absent' || a.status === 'A').length;
        const l = myAtts.filter((a) => a.status === 'late' || a.status === 'L').length;
        const total = myAtts.length;
        const rate = total > 0 ? Math.round((p / total) * 100) : 100;

        return (
          <Dialog
            open={Boolean(calendarStudentModal)}
            onClose={() => setCalendarStudentModal(null)}
            maxWidth="sm"
            fullWidth
            PaperProps={{ sx: { borderRadius: 3.5, overflow: 'hidden' } }}
          >
            <DialogTitle
              sx={{
                bgcolor: '#0d3466',
                color: '#fff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 2.5
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar
                  src={std.photoUrl}
                  sx={{ width: 44, height: 44, bgcolor: '#1a56b0', fontWeight: 800 }}
                >
                  {std.name[0]}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.2 }}>
                    {std.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#93c5fd' }}>
                    {std.tgid} • {std.phone}
                  </Typography>
                </Box>
              </Box>

              <Chip
                label={`${rate}% Attendance`}
                sx={{
                  bgcolor: rate >= 85 ? '#16834b' : rate >= 70 ? '#d97706' : '#e11d48',
                  color: '#fff',
                  fontWeight: 900
                }}
              />
            </DialogTitle>

            <DialogContent sx={{ p: 2.5, bgcolor: '#f8fafc' }}>
              {/* Summary Stats Strip */}
              <Grid container spacing={1.5} sx={{ mb: 2 }}>
                <Grid item xs={3}>
                  <Card sx={{ p: 1.2, textAlign: 'center', borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 900, color: '#1e293b' }}>
                      {total}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      Total
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={3}>
                  <Card sx={{ p: 1.2, textAlign: 'center', borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 900, color: '#16834b' }}>
                      {p}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      Present
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={3}>
                  <Card sx={{ p: 1.2, textAlign: 'center', borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 900, color: '#d5372f' }}>
                      {a}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      Absent
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={3}>
                  <Card sx={{ p: 1.2, textAlign: 'center', borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 900, color: '#c9820a' }}>
                      {l}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      Late
                    </Typography>
                  </Card>
                </Grid>
              </Grid>

              {/* Attendance Timeline Table */}
              <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1, color: '#1e293b' }}>
                दैनिक हाजिरी विवरण (Session-by-Session Log):
              </Typography>

              <Card sx={{ borderRadius: 2.5, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <TableContainer sx={{ maxHeight: 320 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800 }}>मिति (Date)</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>बार (Day)</TableCell>
                        <TableCell sx={{ fontWeight: 800, textAlign: 'center' }}>स्थिति (Status)</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>कैफियत (Remarks)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {myAtts.map((att) => {
                        const st = String(att.status || '').toLowerCase();
                        const isP = st === 'present' || st === 'p';
                        const isA = st === 'absent' || st === 'a';
                        const isL = st === 'late' || st === 'l';

                        return (
                          <TableRow key={att.id} sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                            <TableCell sx={{ fontWeight: 800 }}>{att.date}</TableCell>
                            <TableCell sx={{ color: '#64748b' }}>
                              {new Date(att.date).toLocaleDateString('ne-NP', { weekday: 'short' })}
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Chip
                                label={isP ? 'Present' : isA ? 'Absent' : isL ? 'Late' : att.status}
                                size="small"
                                sx={{
                                  bgcolor: isP ? '#e5f8ee' : isA ? '#fdeceb' : '#fff7df',
                                  color: isP ? '#16834b' : isA ? '#d5372f' : '#c9820a',
                                  fontWeight: 900,
                                  fontSize: '0.72rem'
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ color: '#64748b', fontSize: '0.8rem' }}>
                              {att.remarks || '—'}
                            </TableCell>
                          </TableRow>
                        );
                      })}

                      {myAtts.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} sx={{ textAlign: 'center', py: 4, color: '#94a3b8' }}>
                            यो विद्यार्थीको कुनै हाजिरी रेकर्ड फेला परेन।
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            </DialogContent>

            <DialogActions sx={{ p: 2, bgcolor: '#f1f5f9', borderTop: '1px solid #e2e8f0' }}>
              <Button
                variant="outlined"
                startIcon={<WhatsAppIcon />}
                component="a"
                href={getWhatsAppUrl(
                  std.guardianContact || std.phone,
                  `Namaste, here is the attendance summary for ${std.name} (${std.tgid}): Total Classes: ${total}, Present: ${p}, Absent: ${a}, Attendance Rate: ${rate}%.`
                )}
                target="_blank"
                sx={{
                  color: '#16a34a',
                  borderColor: '#86efac',
                  fontWeight: 800,
                  textTransform: 'none'
                }}
              >
                Send Summary via WhatsApp
              </Button>
              <Button
                variant="contained"
                onClick={() => setCalendarStudentModal(null)}
                sx={{ fontWeight: 800, bgcolor: '#0d3466' }}
              >
                बन्द गर्नुहोस् (Close)
              </Button>
            </DialogActions>
          </Dialog>
        );
      })()}
    </Box>
  );
}
