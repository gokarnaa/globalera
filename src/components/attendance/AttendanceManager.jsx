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
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import RouterIcon from '@mui/icons-material/Router';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import TuneIcon from '@mui/icons-material/Tune';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RefreshIcon from '@mui/icons-material/Refresh';
import confetti from 'canvas-confetti';
import { loadDB, saveDB, getHolidayInfo, logAudit } from '../../services/storage';
import { getWhatsAppUrl } from '../../services/exportUtils';
import { useAuth } from '../../context/AuthContext';
import {
  syncBiometricAttendance,
  recordLiveBiometricPunch,
  parseBiometricLogFile,
  formatPunchTime
} from '../../services/biometricService';
import { playBiometricBeep } from '../../services/soundUtils';

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
        source: match?.source || (match ? 'ADMIN_MANUAL' : (s.biometricId ? 'BIOMETRIC' : 'ADMIN_MANUAL')),
        checkInTime: match?.checkInTime || '',
        biometricId: match?.biometricId || s.biometricId || '',
        verifiedBy: match?.verifiedBy || '',
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

  // Tab 3 (Biometric Hub) state
  const [bioSearchQuery, setBioSearchQuery] = useState('');
  const [bioRoleFilter, setBioRoleFilter] = useState('ALL');
  const [bioDateFilter, setBioDateFilter] = useState(new Date().toISOString().slice(0, 10));
  const [openUsbDialog, setOpenUsbDialog] = useState(false);
  const [usbTextData, setUsbTextData] = useState('');
  const [openSettingsDialog, setOpenSettingsDialog] = useState(false);
  const [bioSettingsForm, setBioSettingsForm] = useState(db.settings?.biometricSettings || {});
  const [openSimulateDialog, setOpenSimulateDialog] = useState(false);
  const [simTargetId, setSimTargetId] = useState('');
  const [simTargetRole, setSimTargetRole] = useState('STUDENT');

  // Reactive listener for storage updates (e.g. from live punch or ADMS push)
  useEffect(() => {
    const handleUpdate = () => {
      const refreshed = loadDB();
      setDb(refreshed);
      if (refreshed.settings?.biometricSettings) {
        setBioSettingsForm(refreshed.settings.biometricSettings);
      }
    };
    window.addEventListener('kite_db_updated', handleUpdate);
    return () => window.removeEventListener('kite_db_updated', handleUpdate);
  }, []);

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
          status: next,
          source: 'ADMIN_MANUAL',
          verifiedBy: `${currentUser?.name || 'Admin'} (Manual)`
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
        source: rec.source || updatedAttendances[existingIdx]?.source || 'ADMIN_MANUAL',
        checkInTime: rec.checkInTime || updatedAttendances[existingIdx]?.checkInTime || '',
        biometricId: rec.biometricId || s.biometricId || '',
        verifiedBy: rec.verifiedBy || (rec.source === 'BIOMETRIC' ? 'ZKTeco K40' : (currentUser?.name || 'Admin')),
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

  // Biometric Actions
  const handleSyncBiometric = (targetDate = selectedDate) => {
    const res = syncBiometricAttendance(targetDate);
    const refreshed = loadDB();
    setDb(refreshed);
    playBiometricBeep(true);
    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } catch (_) {}
    alert(`📡 बायोमेट्रिक मेसिन सिङ्क सफल! (${res.syncedCount} वटा लग अद्यावधिक)`);
  };

  const handleSaveBiometricSettings = () => {
    const nextDb = {
      ...db,
      settings: {
        ...db.settings,
        biometricSettings: {
          ...db.settings?.biometricSettings,
          ...bioSettingsForm,
          lastSyncTime: formatPunchTime()
        }
      }
    };
    saveDB(nextDb);
    setDb(nextDb);
    setOpenSettingsDialog(false);
    alert('बायोमेट्रिक मेसिन तथा सिफ्ट सेटिङ सफलतापूर्वक सुरक्षित गरियो!');
  };

  const handleProcessUsbLogs = () => {
    if (!usbTextData.trim()) {
      alert('कृपया पेनड्राइभ वा USB लग डेटा पेस्ट गर्नुहोस् वा फाइल छान्नुहोस्।');
      return;
    }
    const parsed = parseBiometricLogFile(usbTextData, 'USB Imported Log');
    if (parsed.length === 0) {
      alert('फाइलमा मान्य लग फेला परेन। कृपया ZKTeco/Realtime को .DAT वा CSV ढाँचा जाँच गर्नुहोस्।');
      return;
    }
    const nextLogs = [...parsed, ...(db.biometricLogs || [])];
    const nextDb = { ...db, biometricLogs: nextLogs };
    saveDB(nextDb);
    setDb(nextDb);
    setUsbTextData('');
    setOpenUsbDialog(false);
    syncBiometricAttendance(bioDateFilter);
    playBiometricBeep(true);
    alert(`सफल! ${parsed.length} वटा USB बायोमेट्रिक लग आयात भयो र हाजिरीमा सिङ्क गरियो।`);
  };

  const handleRunSimulationPunch = () => {
    if (!simTargetId) {
      alert('कृपया विद्यार्थी, प्रशिक्षक वा बायोमेट्रिक आईडी छान्नुहोस्।');
      return;
    }
    let targetName = 'Enrolled User';
    let role = simTargetRole;

    if (role === 'STUDENT') {
      const s = (db.students || []).find((x) => x.id === simTargetId || String(x.biometricId) === String(simTargetId));
      if (s) targetName = s.name;
    } else if (role === 'TRAINER') {
      const t = (db.trainers || []).find((x) => x.id === simTargetId || String(x.biometricId) === String(simTargetId));
      if (t) targetName = `${t.name} (Trainer)`;
    } else {
      targetName = 'Global Era Staff';
    }

    const log = recordLiveBiometricPunch({
      biometricId: simTargetId,
      name: targetName,
      role: role,
      device: `${db.settings?.biometricSettings?.deviceName || 'ZKTeco K40 WiFi'} (Live Scan)`
    });

    const refreshed = loadDB();
    setDb(refreshed);
    setOpenSimulateDialog(false);
    try {
      confetti({ particleCount: 60, spread: 55, origin: { y: 0.65 } });
    } catch (_) {}
    alert(`🟢 थम्ब स्वाइप सफल!\nप्रयोगकर्ता: ${targetName}\nसमय: ${log.timestamp}\nहाजिरी स्वतः दर्ता भयो!`);
  };

  const pCount = Object.values(sessionRecords).filter((r) => r.status === 'P').length;
  const aCount = Object.values(sessionRecords).filter((r) => r.status === 'A').length;
  const lCount = Object.values(sessionRecords).filter((r) => r.status === 'L').length;

  return (
    <Box sx={{ width: '100%', pb: 4 }}>
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
              <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: 0.3, color: '#FFFFFF' }}>
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
            <Tab
              icon={<FingerprintIcon sx={{ fontSize: 20 }} />}
              iconPosition="start"
              label="📡 Biometric Hub (बायोमेट्रिक मेसिन हब)"
            />
          </Tabs>
        </Box>
      </Card>

      {/* =======================================================
          TAB 0: MARK DAILY ATTENDANCE (दैनिक हाजिरी लिनुहोस्)
          ======================================================= */}
      {activeTab === 0 && (
        <Box>
          {/* Biometric Status Quick Banner */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.5, sm: 2 },
              mb: 2,
              borderRadius: 3,
              bgcolor: '#F0FDF4',
              border: '1px solid #BBF7D0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 1.5
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              <Chip
                icon={<FingerprintIcon sx={{ fontSize: '16px !important', color: '#166534 !important' }} />}
                label={`${db.settings?.biometricSettings?.deviceName || 'ZKTeco K40 WiFi'}: 🟢 अनलाइन (${db.settings?.biometricSettings?.deviceIp || '192.168.1.201'})`}
                sx={{ fontWeight: 800, bgcolor: '#DCFCE7', color: '#15803D', fontSize: '0.85rem' }}
              />
              <Typography variant="body2" sx={{ color: '#166534', fontWeight: 700, fontSize: '0.82rem' }}>
                अन्तिम सिङ्क: <b>{db.settings?.biometricSettings?.lastSyncTime || 'अहिले सम्म छैन'}</b>
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                size="small"
                startIcon={<FingerprintIcon />}
                onClick={() => {
                  const res = syncBiometricAttendance(selectedDate);
                  setDb(loadDB());
                  try { confetti({ particleCount: 50, spread: 60 }); } catch (_) {}
                  alert(`📡 बायोमेट्रिक मेसिनबाट ${res.syncedCount} वटा थम्ब लगहरू सफलतापूर्वक सिङ्क गरियो!`);
                }}
                sx={{
                  fontWeight: 900,
                  bgcolor: '#10B981',
                  '&:hover': { bgcolor: '#059669' },
                  color: '#FFFFFF',
                  borderRadius: 2,
                  textTransform: 'none',
                  px: 2
                }}
              >
                मेसिनबाट सिङ्क (Sync Punch Logs)
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setActiveTab(3)}
                sx={{
                  fontWeight: 800,
                  color: '#0F2E5A',
                  borderColor: '#0F2E5A',
                  borderRadius: 2,
                  textTransform: 'none'
                }}
              >
                मेसिन हब खोल्नुहोस् ➔
              </Button>
            </Box>
          </Paper>

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
                  <TableHead
                    sx={{
                      bgcolor: '#0F2E5A',
                      '& .MuiTableCell-head': {
                        bgcolor: '#0F2E5A !important',
                        color: '#FFFFFF !important',
                        fontWeight: 900,
                        fontSize: '0.85rem',
                        py: 1.5,
                        borderBottom: '2px solid #F59E0B'
                      }
                    }}
                  >
                    <TableRow>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, width: 70, textAlign: 'center' }}>
                        क्र.सं. (S.N.)
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>
                        विद्यार्थीको विवरण (Trainee Details)
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, width: 280, textAlign: 'center' }}>
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
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 0.3, flexWrap: 'wrap' }}>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: '#647089',
                                      fontWeight: 600,
                                      fontSize: '0.8rem'
                                    }}
                                  >
                                    {std.tgid} • {std.phone}
                                  </Typography>
                                  <Chip
                                    size="small"
                                    icon={<FingerprintIcon sx={{ fontSize: '11px !important', color: '#0F2E5A !important' }} />}
                                    label={`मेसिन ID: #${std.biometricId || 'N/A'}`}
                                    sx={{ height: 18, fontSize: '0.67rem', fontWeight: 800, bgcolor: '#EEF2F6', color: '#0F2E5A' }}
                                  />
                                </Box>
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
                                {selectedStatus !== 'A' && (
                                  <Chip
                                    size="small"
                                    icon={rec.source === 'BIOMETRIC' ? <FingerprintIcon sx={{ fontSize: '11px !important', color: '#15803D !important' }} /> : undefined}
                                    label={
                                      rec.source === 'BIOMETRIC'
                                        ? `बायोमेट्रिक (${rec.checkInTime || 'समयमै'})`
                                        : rec.source === 'TRAINER_MANUAL'
                                        ? 'प्रशिक्षक म्यानुअल'
                                        : 'एडमिन म्यानुअल'
                                    }
                                    sx={{
                                      mt: 0.4,
                                      height: 18,
                                      fontSize: '0.64rem',
                                      fontWeight: 800,
                                      bgcolor: rec.source === 'BIOMETRIC' ? '#DCFCE7' : rec.source === 'TRAINER_MANUAL' ? '#FEF3C7' : '#EFF6FF',
                                      color: rec.source === 'BIOMETRIC' ? '#15803D' : rec.source === 'TRAINER_MANUAL' ? '#92400E' : '#1D4ED8',
                                      width: '100%',
                                      justifyContent: 'center'
                                    }}
                                  />
                                )}
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
                  <TableHead
                    sx={{
                      bgcolor: '#0F2E5A',
                      '& .MuiTableCell-head': {
                        bgcolor: '#0F2E5A !important',
                        color: '#FFFFFF !important',
                        fontWeight: 900,
                        fontSize: '0.85rem',
                        py: 1.5,
                        borderBottom: '2px solid #F59E0B'
                      }
                    }}
                  >
                    <TableRow>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, width: 65, textAlign: 'center' }}>
                        क्र.सं. (S.N.)
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>हाजिरी मिति (Date)</TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>तालिम समूह / कोर्स (Batch & Course)</TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>सिफ्ट तथा प्रशिक्षक (Shift & Trainer)</TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, textAlign: 'center' }}>कुल विद्यार्थी</TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, textAlign: 'center' }}>उपस्थिति विभाजन (P / A / L)</TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, textAlign: 'right' }}>कार्य (Actions)</TableCell>
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
                <TableHead
                  sx={{
                    bgcolor: '#0F2E5A',
                    '& .MuiTableCell-head': {
                      bgcolor: '#0F2E5A !important',
                      color: '#FFFFFF !important',
                      fontWeight: 900,
                      fontSize: '0.85rem',
                      py: 1.5,
                      borderBottom: '2px solid #F59E0B'
                    }
                  }}
                >
                  <TableRow>
                    <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, width: 65, textAlign: 'center' }}>
                      क्र.सं. (S.N.)
                    </TableCell>
                    <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>विद्यार्थीको नाम (Trainee Name)</TableCell>
                    <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, textAlign: 'center' }}>कुल कक्षा (Total)</TableCell>
                    <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, textAlign: 'center' }}>उपस्थित (P)</TableCell>
                    <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, textAlign: 'center' }}>अनुपस्थित (A)</TableCell>
                    <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, textAlign: 'center' }}>ढिलो (L)</TableCell>
                    <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, width: 180 }}>हाजिरी % (Compliance)</TableCell>
                    <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, textAlign: 'center' }}>TVET वर्गीकरण</TableCell>
                    <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, textAlign: 'right' }}>कार्य (Actions)</TableCell>
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
          TAB 3: BIOMETRIC DEVICE HUB & LIVE PUNCH STREAM (📡 बायोमेट्रिक हब)
          ======================================================= */}
      {activeTab === 3 && (() => {
        const settings = db.settings?.biometricSettings || {};
        const allLogs = db.biometricLogs || [];

        // Filter logs
        let filteredLogs = allLogs.filter((l) => {
          if (bioDateFilter && l.date !== bioDateFilter) return false;
          if (bioRoleFilter !== 'ALL' && l.role !== bioRoleFilter) return false;
          if (bioSearchQuery.trim()) {
            const q = bioSearchQuery.toLowerCase();
            return (
              (l.name && l.name.toLowerCase().includes(q)) ||
              (l.biometricId && String(l.biometricId).toLowerCase().includes(q)) ||
              (l.device && l.device.toLowerCase().includes(q))
            );
          }
          return true;
        });

        // Compute metrics for the selected date
        const todayLogs = allLogs.filter((l) => l.date === bioDateFilter);
        const totalPunches = todayLogs.length;
        const studentPunches = todayLogs.filter((l) => l.role === 'STUDENT').length;
        const trainerStaffPunches = todayLogs.filter((l) => l.role === 'TRAINER' || l.role === 'STAFF').length;

        // Group shift for evaluating late
        const morningShift = settings.morningShiftStart || '07:00';
        const graceMins = Number(settings.lateGraceMinutes) || 15;

        return (
          <Box sx={{ width: '100%' }}>
            {/* 1. Device Overview Hero Card */}
            <Card
              sx={{
                mb: 3,
                borderRadius: 3.5,
                p: { xs: 2.5, sm: 3.5 },
                bgcolor: '#0B2545',
                color: '#FFFFFF',
                boxShadow: '0 8px 24px rgba(11, 37, 69, 0.25)',
                border: '1px solid #1E3A8A'
              }}
            >
              <Grid container spacing={2.5} alignItems="center">
                <Grid item xs={12} md={7}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    <Avatar sx={{ width: 44, height: 44, bgcolor: '#10B981', color: '#FFFFFF' }}>
                      <FingerprintIcon sx={{ fontSize: 26 }} />
                    </Avatar>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: '#FFFFFF' }}>
                          {settings.deviceName || 'Global Era ZKTeco K40 WiFi'}
                        </Typography>
                        <Chip
                          label={settings.status === 'Online' ? '🟢 Online (सक्रिय)' : '🔴 Offline'}
                          size="small"
                          sx={{
                            bgcolor: settings.status === 'Online' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                            color: settings.status === 'Online' ? '#34D399' : '#F87171',
                            border: `1px solid ${settings.status === 'Online' ? '#10B981' : '#EF4444'}`,
                            fontWeight: 800,
                            fontSize: '0.72rem'
                          }}
                        />
                      </Box>
                      <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600 }}>
                        ZKTeco ADMS Cloud Push & Local WiFi/LAN Bridge • Serial: <b>{settings.serialNo || 'ZK-GE-2026-8891'}</b>
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2, bgcolor: 'rgba(255,255,255,0.06)', p: 1.5, borderRadius: 2 }}>
                    <Typography variant="caption" sx={{ color: '#CBD5E1' }}>
                      🌐 <b>मेसिन IP:</b> {settings.deviceIp || '192.168.1.201'}:{settings.devicePort || 4370}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#CBD5E1' }}>
                      ☁️ <b>Cloud Push:</b> /iclock/cdata
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#CBD5E1' }}>
                      🕒 <b>अन्तिम सिङ्क:</b> {settings.lastSyncTime || 'अहिले सम्म छैन'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#FCD34D' }}>
                      ⏰ <b>सिफ्ट समय:</b> बिहानी {morningShift} (ग्रेस: {graceMins} मिनेट)
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} md={5}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                    <Button
                      variant="contained"
                      startIcon={<RefreshIcon />}
                      onClick={() => handleSyncBiometric(bioDateFilter)}
                      sx={{
                        fontWeight: 900,
                        bgcolor: '#10B981',
                        '&:hover': { bgcolor: '#059669' },
                        color: '#FFFFFF',
                        borderRadius: 2.5,
                        py: 1.2,
                        textTransform: 'none',
                        fontSize: '0.92rem'
                      }}
                    >
                      📥 मेसिनबाट सिङ्क गर्नुहोस् (Sync Punch Logs)
                    </Button>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<CloudUploadIcon />}
                        onClick={() => setOpenUsbDialog(true)}
                        sx={{
                          fontWeight: 800,
                          color: '#FFFFFF',
                          borderColor: 'rgba(255,255,255,0.3)',
                          borderRadius: 2,
                          textTransform: 'none',
                          fontSize: '0.78rem',
                          '&:hover': { borderColor: '#FFFFFF', bgcolor: 'rgba(255,255,255,0.08)' }
                        }}
                      >
                        📁 USB लग आयात
                      </Button>

                      <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<PlayArrowIcon />}
                        onClick={() => setOpenSimulateDialog(true)}
                        sx={{
                          fontWeight: 800,
                          color: '#F59E0B',
                          borderColor: '#F59E0B',
                          borderRadius: 2,
                          textTransform: 'none',
                          fontSize: '0.78rem',
                          '&:hover': { borderColor: '#FBBF24', bgcolor: 'rgba(245, 158, 11, 0.1)' }
                        }}
                      >
                        🧪 प्रत्यक्ष स्क्यान टेस्ट
                      </Button>

                      <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<TuneIcon />}
                        onClick={() => setOpenSettingsDialog(true)}
                        sx={{
                          fontWeight: 800,
                          color: '#CBD5E1',
                          borderColor: 'rgba(255,255,255,0.2)',
                          borderRadius: 2,
                          textTransform: 'none',
                          fontSize: '0.78rem',
                          '&:hover': { borderColor: '#FFFFFF', bgcolor: 'rgba(255,255,255,0.08)' }
                        }}
                      >
                        ⚙️ सेटिङ
                      </Button>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Card>

            {/* 2. Today's Biometric Statistics Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6} sm={3}>
                <Card sx={{ p: 2, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 800, display: 'block' }}>
                    कुल बायोमेट्रिक स्क्यान
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 900, color: '#0F2E5A', mt: 0.5 }}>
                    {totalPunches}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 700 }}>
                    आजको मितिमा दर्ता
                  </Typography>
                </Card>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Card sx={{ p: 2, borderRadius: 3, border: '1px solid #BBF7D0', bgcolor: '#F0FDF4' }}>
                  <Typography variant="caption" sx={{ color: '#166534', fontWeight: 800, display: 'block' }}>
                    प्रशिक्षार्थी थम्ब हाजिरी
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 900, color: '#15803D', mt: 0.5 }}>
                    {studentPunches}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#166534', fontWeight: 700 }}>
                    CTEVT ८०% मा गणना
                  </Typography>
                </Card>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Card sx={{ p: 2, borderRadius: 3, border: '1px solid #BAE6FD', bgcolor: '#F0F9FF' }}>
                  <Typography variant="caption" sx={{ color: '#075985', fontWeight: 800, display: 'block' }}>
                    प्रशिक्षक तथा कर्मचारी
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 900, color: '#0369A1', mt: 0.5 }}>
                    {trainerStaffPunches}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#0284C7', fontWeight: 700 }}>
                    दैनिक उपस्थिति प्रमाणित
                  </Typography>
                </Card>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Card sx={{ p: 2, borderRadius: 3, border: '1px solid #FED7AA', bgcolor: '#FFF7ED' }}>
                  <Typography variant="caption" sx={{ color: '#9A3412', fontWeight: 800, display: 'block' }}>
                    लेट ग्रेस समयावधि
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 900, color: '#C2410C', mt: 0.5 }}>
                    {graceMins} मिनेट
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#EA580C', fontWeight: 700 }}>
                    सिफ्ट सुरु भएपछिको छुट
                  </Typography>
                </Card>
              </Grid>
            </Grid>

            {/* 3. Live Punch Explorer Controls */}
            <Card sx={{ p: 2, mb: 2.5, borderRadius: 3, border: '1px solid #E2E8F0' }}>
              <Grid container spacing={1.5} alignItems="center">
                <Grid item xs={12} sm={3.5}>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="खोज्नुहोस्: नाम, ID, मेसिन..."
                    value={bioSearchQuery}
                    onChange={(e) => setBioSearchQuery(e.target.value)}
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
                    label="लग मिति"
                    value={bioDateFilter}
                    onChange={(e) => setBioDateFilter(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={6} sm={4}>
                  <ToggleButtonGroup
                    value={bioRoleFilter}
                    exclusive
                    onChange={(e, val) => val && setBioRoleFilter(val)}
                    size="small"
                    sx={{ width: '100%' }}
                  >
                    <ToggleButton value="ALL" sx={{ fontWeight: 800, textTransform: 'none', flex: 1 }}>
                      सबै
                    </ToggleButton>
                    <ToggleButton value="STUDENT" sx={{ fontWeight: 800, textTransform: 'none', flex: 1 }}>
                      विद्यार्थी
                    </ToggleButton>
                    <ToggleButton value="TRAINER" sx={{ fontWeight: 800, textTransform: 'none', flex: 1 }}>
                      प्रशिक्षक
                    </ToggleButton>
                    <ToggleButton value="STAFF" sx={{ fontWeight: 800, textTransform: 'none', flex: 1 }}>
                      स्टाफ
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Grid>

                <Grid item xs={12} sm={2}>
                  <Button
                    variant="outlined"
                    fullWidth
                    size="small"
                    startIcon={<RefreshIcon />}
                    onClick={() => {
                      setBioSearchQuery('');
                      setBioRoleFilter('ALL');
                      setBioDateFilter(new Date().toISOString().slice(0, 10));
                    }}
                    sx={{ fontWeight: 800, borderRadius: 2, py: 0.8 }}
                  >
                    रिसेट
                  </Button>
                </Grid>
              </Grid>
            </Card>

            {/* 4. Live Punch Stream Table */}
            <Card sx={{ borderRadius: 3, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
              <TableContainer component={Paper} elevation={0}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#0F2E5A' }}>
                    <TableRow>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, width: 60, textAlign: 'center' }}>
                        क्र.सं.
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, width: 140 }}>
                        बायोमेट्रिक ID
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>
                        प्रयोगकर्ताको नाम तथा पद
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, textAlign: 'center', width: 140 }}>
                        भूमिका (Role)
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, width: 180 }}>
                        स्क्यान मिति र समय
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, textAlign: 'center', width: 160 }}>
                        स्थिति (Status)
                      </TableCell>
                      <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>
                        स्रोत उपकरण (Device)
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredLogs.map((log, idx) => {
                      const isLate = log.timestamp && log.timestamp > '07:15:00 AM' && log.role === 'STUDENT';
                      return (
                        <TableRow key={log.id || idx} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#F8FAFC' } }}>
                          <TableCell sx={{ textAlign: 'center', fontWeight: 700, color: '#64748B' }}>
                            {idx + 1}
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={<FingerprintIcon sx={{ fontSize: '13px !important', color: '#0F2E5A !important' }} />}
                              label={`#${log.biometricId}`}
                              size="small"
                              sx={{ fontWeight: 800, bgcolor: '#EEF2F6', color: '#0F2E5A' }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: '#1E293B' }}>
                              {log.name}
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
                            <Typography variant="caption" sx={{ color: '#64748B' }}>
                              📅 {log.date}
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
                              {log.device || 'Global Era ZKTeco K40'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}

                    {filteredLogs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} sx={{ textAlign: 'center', py: 8, color: '#94A3B8' }}>
                          <FingerprintIcon sx={{ fontSize: 44, color: '#CBD5E1', mb: 1, display: 'block', mx: 'auto' }} />
                          छानिएको मिति वा फिल्टर अनुसार कुनै बायोमेट्रिक लग फेला परेन।
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>

            {/* MODAL 1: USB / PENDRIVE LOG IMPORT DIALOG */}
            <Dialog open={openUsbDialog} onClose={() => setOpenUsbDialog(false)} maxWidth="sm" fullWidth>
              <DialogTitle sx={{ fontWeight: 900, bgcolor: '#0F2E5A', color: '#FFFFFF' }}>
                📁 USB / पेनड्राइभ फाइल आयात (Import Offline Logs)
              </DialogTitle>
              <DialogContent sx={{ pt: 3 }}>
                <Typography variant="body2" sx={{ color: '#475569', mb: 2 }}>
                  ZKTeco वा Realtime बायोमेट्रिक मेसिनबाट पेनड्राइभमा डाउनलोड गरिएको <b>.DAT, .CSV वा .TXT</b> लग डेटा यहाँ पेस्ट गर्नुहोस् वा फाइल खोल्नुहोस्।
                </Typography>
                <TextField
                  multiline
                  rows={8}
                  fullWidth
                  placeholder={`उदा: \n1001\t2026-10-28 07:05:12\t1\n1002\t2026-10-28 07:18:40\t1\n2001\t2026-10-28 06:50:00\t1`}
                  value={usbTextData}
                  onChange={(e) => setUsbTextData(e.target.value)}
                  sx={{ fontFamily: 'monospace' }}
                />
                <Box sx={{ mt: 2 }}>
                  <input
                    type="file"
                    accept=".dat,.csv,.txt"
                    id="usb-log-file-input"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          setUsbTextData(event.target?.result || '');
                        };
                        reader.readAsText(file);
                      }
                    }}
                  />
                  <label htmlFor="usb-log-file-input">
                    <Button variant="outlined" component="span" startIcon={<CloudUploadIcon />} sx={{ fontWeight: 800 }}>
                      पेनड्राइभबाट फाइल छान्नुहोस् (.DAT / .CSV)
                    </Button>
                  </label>
                </Box>
              </DialogContent>
              <DialogActions sx={{ p: 2, bgcolor: '#F8FAFC' }}>
                <Button onClick={() => setOpenUsbDialog(false)} sx={{ fontWeight: 800 }}>
                  रद्द गर्नुहोस्
                </Button>
                <Button variant="contained" onClick={handleProcessUsbLogs} sx={{ fontWeight: 900, bgcolor: '#0F2E5A' }}>
                  फाइल प्रोसेस तथा सिङ्क गर्नुहोस्
                </Button>
              </DialogActions>
            </Dialog>

            {/* MODAL 2: SHIFT TIMINGS & GRACE SETTINGS DIALOG */}
            <Dialog open={openSettingsDialog} onClose={() => setOpenSettingsDialog(false)} maxWidth="sm" fullWidth>
              <DialogTitle sx={{ fontWeight: 900, bgcolor: '#0F2E5A', color: '#FFFFFF' }}>
                ⚙️ बायोमेट्रिक मेसिन तथा सिफ्ट समय सेटिङ
              </DialogTitle>
              <DialogContent sx={{ pt: 3 }}>
                <Stack spacing={2.2} sx={{ mt: 1 }}>
                  <TextField
                    label="उपकरणको नाम (Device Name)"
                    size="small"
                    fullWidth
                    value={bioSettingsForm.deviceName || ''}
                    onChange={(e) => setBioSettingsForm({ ...bioSettingsForm, deviceName: e.target.value })}
                  />
                  <Grid container spacing={2}>
                    <Grid item xs={8}>
                      <TextField
                        label="उपकरण IP Address"
                        size="small"
                        fullWidth
                        value={bioSettingsForm.deviceIp || ''}
                        onChange={(e) => setBioSettingsForm({ ...bioSettingsForm, deviceIp: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        label="Port"
                        size="small"
                        fullWidth
                        value={bioSettingsForm.devicePort || 4370}
                        onChange={(e) => setBioSettingsForm({ ...bioSettingsForm, devicePort: Number(e.target.value) })}
                      />
                    </Grid>
                  </Grid>

                  <TextField
                    label="मेसिन सिरियल नम्बर (Serial No)"
                    size="small"
                    fullWidth
                    value={bioSettingsForm.serialNo || ''}
                    onChange={(e) => setBioSettingsForm({ ...bioSettingsForm, serialNo: e.target.value })}
                  />

                  <Divider sx={{ my: 1 }}>सिफ्ट सुरु समय (Shift Schedules)</Divider>

                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <TextField
                        label="बिहानी सिफ्ट"
                        type="time"
                        size="small"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        value={bioSettingsForm.morningShiftStart || '07:00'}
                        onChange={(e) => setBioSettingsForm({ ...bioSettingsForm, morningShiftStart: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        label="दिवा सिफ्ट"
                        type="time"
                        size="small"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        value={bioSettingsForm.dayShiftStart || '11:00'}
                        onChange={(e) => setBioSettingsForm({ ...bioSettingsForm, dayShiftStart: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        label="साँझ सिफ्ट"
                        type="time"
                        size="small"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        value={bioSettingsForm.eveningShiftStart || '15:00'}
                        onChange={(e) => setBioSettingsForm({ ...bioSettingsForm, eveningShiftStart: e.target.value })}
                      />
                    </Grid>
                  </Grid>

                  <TextField
                    label="लेट ग्रेस समयावधि (Grace Period in Minutes)"
                    type="number"
                    size="small"
                    fullWidth
                    value={bioSettingsForm.lateGraceMinutes || 15}
                    onChange={(e) => setBioSettingsForm({ ...bioSettingsForm, lateGraceMinutes: Number(e.target.value) })}
                    helperText="सिफ्ट सुरु भएपछि कति मिनेट सम्म आइपुग्दा समयमै मान्ने (डिफल्ट: १५ मिनेट)"
                  />
                </Stack>
              </DialogContent>
              <DialogActions sx={{ p: 2, bgcolor: '#F8FAFC' }}>
                <Button onClick={() => setOpenSettingsDialog(false)} sx={{ fontWeight: 800 }}>
                  रद्द
                </Button>
                <Button variant="contained" onClick={handleSaveBiometricSettings} sx={{ fontWeight: 900, bgcolor: '#0F2E5A' }}>
                  सेटिङ सुरक्षित गर्नुहोस्
                </Button>
              </DialogActions>
            </Dialog>

            {/* MODAL 3: LIVE SIMULATION PUNCH TEST DIALOG */}
            <Dialog open={openSimulateDialog} onClose={() => setOpenSimulateDialog(false)} maxWidth="sm" fullWidth>
              <DialogTitle sx={{ fontWeight: 900, bgcolor: '#0F2E5A', color: '#FFFFFF' }}>
                🧪 प्रत्यक्ष थम्ब स्वाइप टेस्ट (Live Thumb Scan Simulation)
              </DialogTitle>
              <DialogContent sx={{ pt: 3 }}>
                <Typography variant="body2" sx={{ color: '#475569', mb: 2 }}>
                  मेसिन नजोडिएको अवस्थामा वा प्रत्यक्ष परीक्षण गर्न कुनै पनि विद्यार्थी वा प्रशिक्षकको थम्ब स्वाइप तत्काल परीक्षण गर्नुहोस्।
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
                      विद्यार्थी (Trainee)
                    </ToggleButton>
                    <ToggleButton value="TRAINER" sx={{ fontWeight: 800 }}>
                      प्रशिक्षक (Trainer)
                    </ToggleButton>
                  </ToggleButtonGroup>

                  {simTargetRole === 'STUDENT' ? (
                    <TextField
                      select
                      label="प्रशिक्षार्थी छान्नुहोस् (Select Trainee)"
                      size="small"
                      fullWidth
                      value={simTargetId}
                      onChange={(e) => setSimTargetId(e.target.value)}
                    >
                      {(db.students || []).map((s) => (
                        <MenuItem key={s.id} value={s.id}>
                          {s.name} (मेसिन ID: #{s.biometricId || '1001'}) — TGID: {s.tgid}
                        </MenuItem>
                      ))}
                    </TextField>
                  ) : (
                    <TextField
                      select
                      label="प्रशिक्षक छान्नुहोस् (Select Trainer)"
                      size="small"
                      fullWidth
                      value={simTargetId}
                      onChange={(e) => setSimTargetId(e.target.value)}
                    >
                      {(db.trainers || []).map((t) => (
                        <MenuItem key={t.id} value={t.id}>
                          {t.name} (मेसिन ID: #{t.biometricId || '2001'}) — {t.specialization}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                </Stack>
              </DialogContent>
              <DialogActions sx={{ p: 2, bgcolor: '#F8FAFC' }}>
                <Button onClick={() => setOpenSimulateDialog(false)} sx={{ fontWeight: 800 }}>
                  रद्द
                </Button>
                <Button
                  variant="contained"
                  startIcon={<FingerprintIcon />}
                  onClick={handleRunSimulationPunch}
                  sx={{ fontWeight: 900, bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' } }}
                >
                  थम्ब स्क्यान प्रमाणित गर्नुहोस् (Scan Thumb)
                </Button>
              </DialogActions>
            </Dialog>
          </Box>
        );
      })()}

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
