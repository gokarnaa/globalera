import React, { useState, useMemo } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Stack,
  Grid,
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
  LinearProgress,
  Tooltip,
  Paper,
  Divider,
  Avatar
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EventNoteIcon from '@mui/icons-material/EventNote';
import SearchIcon from '@mui/icons-material/Search';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import TimelineIcon from '@mui/icons-material/Timeline';
import PrintIcon from '@mui/icons-material/Print';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ShieldIcon from '@mui/icons-material/Shield';
import CloseIcon from '@mui/icons-material/Close';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import confetti from 'canvas-confetti';
import { loadDB, saveDB, getHolidayInfo, logAudit } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
import { getWhatsAppUrl } from '../../services/exportUtils';

export default function WorkPlanManager({ onNavigateToLessonPlan }) {
  const [db, setDb] = useState(loadDB());
  const { currentUser, isTrainer } = useAuth();

  const myGroups = isTrainer
    ? (db.trainingGroups || []).filter((g) => g.trainerId === currentUser?.trainerId)
    : db.trainingGroups || [];

  const [selectedGroupId, setSelectedGroupId] = useState(myGroups[0]?.id || db.trainingGroups?.[0]?.id || '');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table' | 'timeline'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Dialog States
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [openAutoScheduleDialog, setOpenAutoScheduleDialog] = useState(false);
  const [openPrintModal, setOpenPrintModal] = useState(false);
  const [printOrientation, setPrintOrientation] = useState('landscape'); // 'landscape' | 'portrait'

  const selectedGroup = (db.trainingGroups || []).find((g) => g.id === selectedGroupId);
  const selectedCourse = (db.courses || []).find((c) => c.id === selectedGroup?.courseId);
  const availableSyllabi = (db.syllabi || []).filter((s) => s.courseId === selectedCourse?.id);
  const trainer = (db.trainers || []).find((t) => t.id === selectedGroup?.trainerId) || { name: 'Assigned Trainer', phone: '' };

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Work Plan Form State
  const [formData, setFormData] = useState({
    groupId: selectedGroupId,
    syllabusId: '',
    planDate: new Date().toISOString().slice(0, 10),
    dayName: daysOfWeek[new Date().getDay()],
    theoryAspect: '',
    practicalAspect: '',
    plannedHours: 2,
    status: 'Pending'
  });

  // Auto-Schedule Settings State
  const [autoScheduleConfig, setAutoScheduleConfig] = useState({
    startDate: selectedGroup?.admissionDate || new Date().toISOString().slice(0, 10),
    dailyHours: 2,
    skipSaturdays: true,
    skipHolidays: true
  });

  // Filter and Sort Work Plans
  const groupWorkPlans = useMemo(() => {
    return (db.workPlans || [])
      .filter((wp) => wp.groupId === selectedGroupId)
      .sort((a, b) => new Date(a.planDate) - new Date(b.planDate));
  }, [db.workPlans, selectedGroupId]);

  const filteredWorkPlans = useMemo(() => {
    return groupWorkPlans.filter((wp) => {
      const syl = (db.syllabi || []).find((s) => s.id === wp.syllabusId);
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (wp.planDate || '').toLowerCase().includes(q) ||
        (wp.dayName || '').toLowerCase().includes(q) ||
        (syl?.title || '').toLowerCase().includes(q) ||
        (wp.theoryAspect || '').toLowerCase().includes(q) ||
        (wp.practicalAspect || '').toLowerCase().includes(q) ||
        (wp.status || '').toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'ALL' || wp.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [groupWorkPlans, searchTerm, statusFilter, db.syllabi]);

  // High-Level Delivery Statistics
  const totalPlannedHours = groupWorkPlans.reduce((sum, wp) => sum + (Number(wp.plannedHours) || 0), 0);
  const completedHours = groupWorkPlans
    .filter((wp) => wp.status === 'Completed')
    .reduce((sum, wp) => sum + (Number(wp.plannedHours) || 0), 0);
  const pendingHours = totalPlannedHours - completedHours;
  const courseTargetHours = Number(selectedCourse?.totalHours) || 390;
  const deliveryProgress = totalPlannedHours > 0 ? Math.round((completedHours / totalPlannedHours) * 100) : 0;
  const planningProgress = Math.min(100, Math.round((totalPlannedHours / courseTargetHours) * 100));

  // Add / Edit Handlers
  const handleOpenAdd = () => {
    setEditingItem(null);
    const today = new Date().toISOString().slice(0, 10);
    setFormData({
      groupId: selectedGroupId,
      syllabusId: '',
      planDate: today,
      dayName: daysOfWeek[new Date(today).getDay()],
      theoryAspect: '',
      practicalAspect: '',
      plannedHours: '',
      status: 'Pending'
    });
    setOpenDialog(true);
  };

  const handleOpenEdit = (wp) => {
    setEditingItem(wp);
    setFormData({
      groupId: wp.groupId,
      syllabusId: wp.syllabusId,
      planDate: wp.planDate,
      dayName: wp.dayName,
      theoryAspect: wp.theoryAspect || '',
      practicalAspect: wp.practicalAspect || '',
      plannedHours: wp.plannedHours || 2,
      status: wp.status || 'Pending'
    });
    setOpenDialog(true);
  };

  const handleSyllabusSelect = (syllabusId) => {
    const syl = availableSyllabi.find((s) => s.id === syllabusId);
    setFormData((prev) => ({
      ...prev,
      syllabusId,
      theoryAspect: syl ? `Theoretical Knowledge: Core standards and concepts of ${syl.title}` : prev.theoryAspect,
      practicalAspect: syl ? `Practical Skills: Live demonstration and student practice drills on ${syl.title}` : prev.practicalAspect
    }));
  };

  const handleDateChange = (dateStr) => {
    const d = new Date(dateStr);
    const day = isNaN(d.getTime()) ? '' : daysOfWeek[d.getDay()];
    setFormData((prev) => ({ ...prev, planDate: dateStr, dayName: day }));
  };

  const handleSave = () => {
    if (!formData.syllabusId || !formData.planDate) {
      alert('Please select a Syllabus Unit and Date.');
      return;
    }

    let updatedList = [...(db.workPlans || [])];
    if (editingItem) {
      updatedList = updatedList.map((x) =>
        x.id === editingItem.id ? { ...x, ...formData } : x
      );
    } else {
      const newId = `WP-${String(updatedList.length + 1).padStart(3, '0')}`;
      updatedList.push({ id: newId, ...formData });
    }

    let nextDb = { ...db, workPlans: updatedList };
    nextDb = logAudit(
      nextDb,
      editingItem ? 'UPDATE' : 'CREATE',
      'WorkPlan',
      editingItem?.id || 'NEW',
      `Work Plan ${editingItem ? 'updated' : 'created'} for group ${selectedGroup?.groupCode} on ${formData.planDate}`,
      currentUser?.name || 'Admin'
    );
    saveDB(nextDb);
    setDb(nextDb);
    setOpenDialog(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure? This work plan will be deleted.')) {
      let nextDb = {
        ...db,
        workPlans: (db.workPlans || []).filter((x) => x.id !== id)
      };
      nextDb = logAudit(
        nextDb,
        'DELETE',
        'WorkPlan',
        id,
        `Work plan ${id} deleted for group ${selectedGroup?.groupCode}`,
        currentUser?.name || 'Admin'
      );
      saveDB(nextDb);
      setDb(nextDb);
    }
  };

  const handleToggleStatus = (wp) => {
    const nextStatus = wp.status === 'Completed' ? 'Pending' : 'Completed';
    const updatedList = (db.workPlans || []).map((x) =>
      x.id === wp.id ? { ...x, status: nextStatus } : x
    );
    const nextDb = { ...db, workPlans: updatedList };
    saveDB(nextDb);
    setDb(nextDb);
  };

  // 1-Click Auto-Schedule Generator from Course Syllabus
  const handleGenerateAutoSchedule = () => {
    if (availableSyllabi.length === 0) {
      alert('No syllabus units found for this course. Please add units in Syllabus Studio first.');
      return;
    }

    let currentDate = new Date(autoScheduleConfig.startDate);
    if (isNaN(currentDate.getTime())) {
      alert('Please select a valid start date.');
      return;
    }

    const generatedPlans = [];
    const dailyHours = Number(autoScheduleConfig.dailyHours) || 2;
    const isWeekendOnlyGroup = selectedGroup?.scheduleMode === 'WEEKEND_ONLY';
    let cycleDayCounter = 0;

    // Remove existing plans for this group if replacing
    const otherWorkPlans = (db.workPlans || []).filter((wp) => wp.groupId !== selectedGroupId);

    availableSyllabi.forEach((syl, sylIdx) => {
      const unitTotal = syl.totalHours || (Number(syl.theoryHours) || 0) + (Number(syl.practicalHours) || 0) || 10;
      const sessionsNeeded = Math.ceil(unitTotal / dailyHours);

      for (let s = 1; s <= sessionsNeeded; s++) {
        // Advance to valid working date
        while (true) {
          const dayIdx = currentDate.getDay();
          const isSat = dayIdx === 6;
          const dateStr = currentDate.toISOString().slice(0, 10);
          const holidayInfo = getHolidayInfo(dateStr, db.holidays || []);

          if (isWeekendOnlyGroup) {
            if (!isSat && !holidayInfo.isHoliday) {
              currentDate.setDate(currentDate.getDate() + 1);
              continue;
            }
          } else {
            if (autoScheduleConfig.skipSaturdays && isSat) {
              currentDate.setDate(currentDate.getDate() + 1);
              continue;
            }
            if (autoScheduleConfig.skipHolidays && holidayInfo.isHoliday) {
              currentDate.setDate(currentDate.getDate() + 1);
              continue;
            }
          }
          break;
        }

        cycleDayCounter += 1;
        const planDateStr = currentDate.toISOString().slice(0, 10);
        const dayNameStr = daysOfWeek[currentDate.getDay()];

        generatedPlans.push({
          id: `WP-${Date.now()}-${sylIdx}-${s}`,
          groupId: selectedGroupId,
          syllabusId: syl.id,
          cycleDay: cycleDayCounter,
          planDate: planDateStr,
          dayName: dayNameStr,
          theoryAspect: `Theoretical Knowledge: ${syl.title} - Session ${s}/${sessionsNeeded} (Fundamental Theory)`,
          practicalAspect: `Practical Skills: ${syl.title} - Session ${s}/${sessionsNeeded} (Tool Handling & Practice)`,
          plannedHours: dailyHours,
          status: 'Pending'
        });

        // Next calendar day for next session
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    const nextDb = {
      ...db,
      workPlans: [...otherWorkPlans, ...generatedPlans]
    };

    saveDB(nextDb);
    setDb(nextDb);
    setOpenAutoScheduleDialog(false);

    try {
      confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
    } catch (_) {}
  };

  // WhatsApp Share Message
  const getBatchShareText = () => {
    return (
      `*Prabidhik School, Jorpati*\n` +
      `📋 *CTEVT Official Vocational Work Plan*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `• *Batch:* ${selectedGroup?.groupCode || '—'} (Shift ${selectedGroup?.shift || 'A'}: ${selectedGroup?.startTime || '07:00'} - ${selectedGroup?.endTime || '09:00'})\n` +
      `• *Course:* ${selectedCourse?.title || 'Vocational Training'}\n` +
      `• *Instructor:* ${trainer?.name || '—'} ${trainer?.phone ? `(${trainer.phone})` : ''}\n` +
      `• *Total Sessions:* ${groupWorkPlans.length} Sessions (${totalPlannedHours} Hours)\n` +
      `• *Progress:* ${completedHours} / ${totalPlannedHours} Hours (${deliveryProgress}% Completed)\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📅 *Key Training Schedule (Sample):*\n` +
      groupWorkPlans.slice(0, 6).map((wp, idx) => {
        const syl = (db.syllabi || []).find((s) => s.id === wp.syllabusId);
        return `${idx + 1}. ${wp.planDate} (${wp.dayName}): Unit ${syl?.unitNo || ''} - ${syl?.title || 'Unit'} [${wp.plannedHours}h - ${wp.status}]`;
      }).join('\n') +
      (groupWorkPlans.length > 6 ? `\n...and ${groupWorkPlans.length - 6} more sessions.` : '') +
      `\n━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `_CTEVT National Skill Standard Work Plan._`
    );
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
                <EventNoteIcon sx={{ fontSize: 20, color: '#fbbf24' }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="subtitle1"
                  noWrap
                  sx={{ fontWeight: 800, color: '#ffffff', fontSize: { xs: '0.96rem', sm: '1.06rem' }, lineHeight: 1.2 }}
                >
                  Work Plan (Training Schedule Management)
                </Typography>
                <Typography
                  variant="caption"
                  noWrap
                  sx={{ color: '#cbd5e1', display: 'block', fontSize: '0.73rem', mt: 0.15 }}
                >
                  Prabidhik School, Jorpati • Batch {selectedGroup?.groupCode || '—'} (Shift {selectedGroup?.shift || 'A'}) • Instructor: {trainer?.name || 'Assigned Trainer'}
                </Typography>
              </Box>
            </Stack>
          </Grid>
          <Grid item xs={12} md={6} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', md: 'flex-end' }} flexWrap="wrap" useFlexGap>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AutoAwesomeIcon sx={{ fontSize: '15px !important', color: '#fbbf24' }} />}
                onClick={() => setOpenAutoScheduleDialog(true)}
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
                1-Click Auto-Schedule
              </Button>

              <Button
                variant="outlined"
                size="small"
                startIcon={<PictureAsPdfIcon sx={{ fontSize: '15px !important' }} />}
                onClick={() => setOpenPrintModal(true)}
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
                A4 Print / PDF
              </Button>

              <Button
                variant="outlined"
                size="small"
                startIcon={<WhatsAppIcon sx={{ fontSize: '15px !important', color: '#4ade80' }} />}
                component="a"
                href={getWhatsAppUrl(trainer?.phone || '', getBatchShareText())}
                target="_blank"
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
                WhatsApp
              </Button>

              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon sx={{ fontSize: '16px !important' }} />}
                onClick={handleOpenAdd}
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
                + Create Work Plan
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Card>

      {/* 4 Compact Single-Row KPI Cards */}
      <Grid container spacing={1.5} sx={{ mb: 1.75 }}>
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
                  Planned Hours
                </Typography>
                <Typography noWrap sx={{ fontWeight: 800, color: '#0f2e5a', fontSize: '1.15rem', lineHeight: 1.2, mt: 0.2 }}>
                  {totalPlannedHours} / {courseTargetHours}h
                </Typography>
                <Typography variant="caption" noWrap sx={{ color: '#059669', fontWeight: 600, fontSize: '0.68rem', display: 'block' }}>
                  {planningProgress}% Planned
                </Typography>
              </Box>
              <Box sx={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#eff6ff', borderRadius: 1.5, color: '#1e40af', flexShrink: 0 }}>
                <EventNoteIcon sx={{ fontSize: 18 }} />
              </Box>
            </Stack>
          </Card>
        </Grid>

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
                  Completed Hours
                </Typography>
                <Typography noWrap sx={{ fontWeight: 800, color: '#059669', fontSize: '1.15rem', lineHeight: 1.2, mt: 0.2 }}>
                  {completedHours}h ({deliveryProgress}%)
                </Typography>
                <Typography variant="caption" noWrap sx={{ color: '#059669', fontWeight: 600, fontSize: '0.68rem', display: 'block' }}>
                  {groupWorkPlans.filter((w) => w.status === 'Completed').length} Sessions Done
                </Typography>
              </Box>
              <Box sx={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#ecfdf5', borderRadius: 1.5, color: '#059669', flexShrink: 0 }}>
                <CheckCircleIcon sx={{ fontSize: 18 }} />
              </Box>
            </Stack>
          </Card>
        </Grid>

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
                  Remaining Hours
                </Typography>
                <Typography noWrap sx={{ fontWeight: 800, color: '#b45309', fontSize: '1.15rem', lineHeight: 1.2, mt: 0.2 }}>
                  {pendingHours}h
                </Typography>
                <Typography variant="caption" noWrap sx={{ color: '#d97706', fontWeight: 600, fontSize: '0.68rem', display: 'block' }}>
                  {groupWorkPlans.filter((w) => w.status === 'Pending').length} Sessions Pending
                </Typography>
              </Box>
              <Box sx={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#fffbeb', borderRadius: 1.5, color: '#d97706', flexShrink: 0 }}>
                <AccessTimeIcon sx={{ fontSize: 18 }} />
              </Box>
            </Stack>
          </Card>
        </Grid>

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
                  Total Schedule Days
                </Typography>
                <Typography noWrap sx={{ fontWeight: 800, color: '#0284c7', fontSize: '1.15rem', lineHeight: 1.2, mt: 0.2 }}>
                  {groupWorkPlans.length} Days
                </Typography>
                <Typography variant="caption" noWrap sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.68rem', display: 'block' }}>
                  Daily Training Sessions
                </Typography>
              </Box>
              <Box sx={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f0f9ff', borderRadius: 1.5, color: '#0284c7', flexShrink: 0 }}>
                <AssignmentIcon sx={{ fontSize: 18 }} />
              </Box>
            </Stack>
          </Card>
        </Grid>
      </Grid>

      {/* =======================================================
          2. GROUP SELECTOR & MULTI-FILTER BAR
          ======================================================= */}
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
          {/* Select Group */}
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              select
              size="small"
              label="Select Training Group"
              fullWidth
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
            >
              {myGroups.map((grp) => {
                const c = (db.courses || []).find((x) => x.id === grp.courseId);
                return (
                  <MenuItem key={grp.id} value={grp.id}>
                    <b>{grp.groupCode}</b> — {c?.title} (Shift {grp.shift})
                  </MenuItem>
                );
              })}
            </TextField>
          </Grid>

          {/* Instant Search Bar */}
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              size="small"
              fullWidth
              placeholder="Search date, unit, theory, or practical skill..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: '#94A3B8' }} />
                  </InputAdornment>
                ),
                sx: { borderRadius: 2.5 }
              }}
            />
          </Grid>

          {/* 3-Way View Switcher */}
          <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 800 }}>
              View:
            </Typography>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, next) => next && setViewMode(next)}
              size="small"
            >
              <ToggleButton value="cards" sx={{ fontWeight: 800, px: 1.5 }}>
                <ViewModuleIcon fontSize="small" sx={{ mr: 0.5 }} /> Cards
              </ToggleButton>
              <ToggleButton value="timeline" sx={{ fontWeight: 800, px: 1.5 }}>
                <TimelineIcon fontSize="small" sx={{ mr: 0.5 }} /> Timeline
              </ToggleButton>
              <ToggleButton value="table" sx={{ fontWeight: 800, px: 1.5 }}>
                <ViewListIcon fontSize="small" sx={{ mr: 0.5 }} /> Table
              </ToggleButton>
            </ToggleButtonGroup>
          </Grid>
        </Grid>

        {/* Filter Pills */}
        <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap', pt: 1.5, borderTop: '1px solid #F1F5F9' }}>
          <Chip
            clickable
            label={`All Sessions (${groupWorkPlans.length})`}
            color={statusFilter === 'ALL' ? 'primary' : 'default'}
            onClick={() => setStatusFilter('ALL')}
            size="small"
            sx={{ fontWeight: 800, fontSize: '0.75rem' }}
          />
          <Chip
            clickable
            label={`Completed (${groupWorkPlans.filter((w) => w.status === 'Completed').length})`}
            color={statusFilter === 'Completed' ? 'success' : 'default'}
            onClick={() => setStatusFilter('Completed')}
            size="small"
            sx={{ fontWeight: 800, fontSize: '0.75rem' }}
          />
          <Chip
            clickable
            label={`Pending (${groupWorkPlans.filter((w) => w.status === 'Pending').length})`}
            color={statusFilter === 'Pending' ? 'warning' : 'default'}
            onClick={() => setStatusFilter('Pending')}
            size="small"
            sx={{ fontWeight: 800, fontSize: '0.75rem' }}
          />
        </Box>
      </Card>

      {/* =======================================================
          VIEW 1: MODERN SESSION CARDS VIEW
          ======================================================= */}
      {viewMode === 'cards' && (
        <Grid container spacing={2.5}>
          {filteredWorkPlans.map((wp, idx) => {
            const syl = (db.syllabi || []).find((s) => s.id === wp.syllabusId);
            const holidayInfo = getHolidayInfo(wp.planDate, db.holidays || []);

            return (
              <Grid item xs={12} sm={6} md={4} key={wp.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 3.5,
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 14px rgba(15, 23, 42, 0.04)',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    overflow: 'hidden',
                    bgcolor: '#FFFFFF',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: '0 12px 28px rgba(15, 44, 89, 0.1)',
                      borderColor: '#93C5FD'
                    }
                  }}
                >
                  {/* Top Color Accent */}
                  <Box
                    sx={{
                      height: 5,
                      background: wp.status === 'Completed'
                        ? 'linear-gradient(90deg, #10B981, #059669)'
                        : 'linear-gradient(90deg, #F59E0B, #D97706)'
                    }}
                  />

                  {/* Header: Date, Day & Holiday Badge */}
                  <Box sx={{ p: 2, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#0F172A', lineHeight: 1 }}>
                          {wp.planDate}
                        </Typography>
                        <Chip
                          label={wp.dayName}
                          size="small"
                          sx={{ bgcolor: '#F1F5F9', color: '#475569', fontWeight: 800, fontSize: '0.68rem', height: 20 }}
                        />
                      </Box>

                      {holidayInfo.isHoliday && (
                        <Chip
                          label={`⚠️ ${holidayInfo.name || 'Holiday / Saturday'}`}
                          size="small"
                          sx={{ mt: 0.5, bgcolor: '#FEF3C7', color: '#B45309', fontWeight: 800, fontSize: '0.65rem', height: 18 }}
                        />
                      )}
                    </Box>

                    <Chip
                      clickable
                      onClick={() => handleToggleStatus(wp)}
                      label={wp.status}
                      size="small"
                      sx={{
                        bgcolor: wp.status === 'Completed' ? '#ECFDF5' : '#FEF3C7',
                        color: wp.status === 'Completed' ? '#059669' : '#B45309',
                        fontWeight: 900,
                        fontSize: '0.72rem',
                        height: 22,
                        cursor: 'pointer'
                      }}
                    />
                  </Box>

                  {/* Unit Title */}
                  <Box sx={{ px: 2, pb: 1 }}>
                    <Chip
                      label={`Unit ${syl?.unitNo || '—'}`}
                      size="small"
                      sx={{ bgcolor: '#0F2C59', color: '#FFFFFF', fontWeight: 900, fontSize: '0.68rem', height: 20, mb: 0.5 }}
                    />
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0F172A', lineHeight: 1.3 }}>
                      {syl?.title || 'General Vocational Unit'}
                    </Typography>
                  </Box>

                  {/* Theory & Practical Breakdown Box */}
                  <Box sx={{ px: 2, py: 1.5, mx: 2, bgcolor: '#F8FAFC', borderRadius: 2.5, border: '1px solid #EDF2F7', mb: 1.5 }}>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="caption" sx={{ color: '#2563EB', fontWeight: 800, display: 'block' }}>
                        📖 Theory:
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#334155', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {wp.theoryAspect || 'Fundamental vocational principles.'}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" sx={{ color: '#059669', fontWeight: 800, display: 'block' }}>
                        🛠️ Practical:
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#334155', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {wp.practicalAspect || 'Hands-on practical drills and demonstration.'}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Footer: Hours & Actions */}
                  <Box
                    sx={{
                      mt: 'auto',
                      p: 1.5,
                      px: 2,
                      borderTop: '1px solid #F1F5F9',
                      bgcolor: '#FAFAFA',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <Chip
                      label={`${wp.plannedHours || 2} hrs`}
                      size="small"
                      sx={{ bgcolor: '#EFF6FF', color: '#1D4ED8', fontWeight: 900, fontSize: '0.72rem', height: 22 }}
                    />

                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenEdit(wp)}
                        sx={{ color: '#1D4ED8', p: 0.5 }}
                        title="Edit Work Plan"
                      >
                        <EditIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(wp.id)}
                        sx={{ color: '#EF4444', p: 0.5 }}
                        title="Delete"
                      >
                        <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Box>
                  </Box>
                </Card>
              </Grid>
            );
          })}

          {filteredWorkPlans.length === 0 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4, border: '1px dashed #CBD5E1', bgcolor: '#FFFFFF' }}>
                <EventNoteIcon sx={{ fontSize: 52, color: '#94A3B8', mb: 1.5 }} />
                <Typography variant="h6" sx={{ fontWeight: 900, color: '#1E293B', mb: 0.5 }}>
                  No Work Plans Found
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748B', mb: 2 }}>
                  You can add a new work plan or use "1-Click Auto-Schedule" to automatically generate the calendar schedule for the entire curriculum.
                </Typography>
                <Stack direction="row" spacing={1.5} justifyContent="center">
                  <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd}>
                    + Create Work Plan
                  </Button>
                  <Button variant="outlined" startIcon={<AutoAwesomeIcon />} onClick={() => setOpenAutoScheduleDialog(true)}>
                    1-Click Auto-Schedule
                  </Button>
                </Stack>
              </Paper>
            </Grid>
          )}
        </Grid>
      )}

      {/* =======================================================
          VIEW 2: CHRONOLOGICAL TIMELINE VIEW
          ======================================================= */}
      {viewMode === 'timeline' && (
        <Box sx={{ position: 'relative', py: 2 }}>
          {filteredWorkPlans.map((wp, index) => {
            const syl = (db.syllabi || []).find((s) => s.id === wp.syllabusId);
            const holidayInfo = getHolidayInfo(wp.planDate, db.holidays || []);

            return (
              <Box
                key={wp.id}
                sx={{
                  display: 'flex',
                  gap: { xs: 2, sm: 3 },
                  position: 'relative',
                  mb: 2.5
                }}
              >
                {/* Connecting Line */}
                {index < filteredWorkPlans.length - 1 && (
                  <Box
                    sx={{
                      position: 'absolute',
                      left: { xs: 20, sm: 24 },
                      top: 48,
                      bottom: -24,
                      width: 3,
                      bgcolor: '#CBD5E1',
                      zIndex: 0
                    }}
                  />
                )}

                {/* Node Avatar */}
                <Avatar
                  sx={{
                    width: { xs: 42, sm: 48 },
                    height: { xs: 42, sm: 48 },
                    bgcolor: wp.status === 'Completed' ? '#10B981' : '#0F2C59',
                    color: '#FFFFFF',
                    fontWeight: 900,
                    fontSize: '0.85rem',
                    boxShadow: '0 4px 14px rgba(15, 44, 89, 0.2)',
                    zIndex: 1,
                    border: '3px solid #FFFFFF'
                  }}
                >
                  {index + 1}
                </Avatar>

                {/* Timeline Card */}
                <Card
                  sx={{
                    flexGrow: 1,
                    p: 2.5,
                    borderRadius: 3.5,
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
                    bgcolor: '#FFFFFF'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 900, color: '#0F172A', fontSize: '1rem' }}>
                        {wp.planDate} ({wp.dayName})
                      </Typography>
                      <Chip
                        label={`Unit ${syl?.unitNo || ''}: ${syl?.title || ''}`}
                        size="small"
                        sx={{ bgcolor: '#0F2C59', color: '#FFFFFF', fontWeight: 900, height: 22 }}
                      />
                      {holidayInfo.isHoliday && (
                        <Chip
                          label={`⚠️ ${holidayInfo.name}`}
                          size="small"
                          sx={{ bgcolor: '#FEF3C7', color: '#B45309', fontWeight: 800, height: 20 }}
                        />
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Chip
                        label={`${wp.plannedHours}h`}
                        size="small"
                        sx={{ bgcolor: '#EFF6FF', color: '#1D4ED8', fontWeight: 900, height: 22 }}
                      />
                      <Chip
                        clickable
                        onClick={() => handleToggleStatus(wp)}
                        label={wp.status}
                        size="small"
                        sx={{
                          bgcolor: wp.status === 'Completed' ? '#ECFDF5' : '#FEF3C7',
                          color: wp.status === 'Completed' ? '#059669' : '#B45309',
                          fontWeight: 900,
                          height: 22
                        }}
                      />
                      <IconButton size="small" onClick={() => handleOpenEdit(wp)} sx={{ color: '#1D4ED8' }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>

                  <Typography variant="body2" sx={{ color: '#334155', mb: 0.5 }}>
                    <b>Theory:</b> {wp.theoryAspect}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#334155' }}>
                    <b>Practical:</b> {wp.practicalAspect}
                  </Typography>
                </Card>
              </Box>
            );
          })}
        </Box>
      )}

      {/* =======================================================
          VIEW 3: STANDARD SORTABLE TABLE VIEW
          ======================================================= */}
      {viewMode === 'table' && (
        <Card elevation={0} sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          <TableContainer>
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
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800, width: 46, textAlign: 'center' }}>#</TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800, width: 130 }}>Date &amp; Day</TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800, width: 170 }}>Syllabus Unit</TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800 }}>Theoretical Aspect</TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800 }}>Practical Skills</TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800, textAlign: 'center', width: 70 }}>Hours</TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800, textAlign: 'center', width: 100 }}>Status</TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800, textAlign: 'right', width: 90 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredWorkPlans.map((wp, idx) => {
                  const syl = (db.syllabi || []).find((s) => s.id === wp.syllabusId);
                  const holidayInfo = getHolidayInfo(wp.planDate, db.holidays || []);

                  return (
                    <TableRow key={wp.id} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#F8FAFC' } }}>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 700, color: '#64748B', fontSize: '0.75rem' }}>
                        {idx + 1}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <Typography sx={{ fontWeight: 800, color: '#0F172A', fontSize: '0.79rem' }}>
                          {wp.planDate}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.69rem' }}>
                          {wp.dayName}
                        </Typography>
                        {holidayInfo.isHoliday && (
                          <Chip
                            label={holidayInfo.name || 'Holiday'}
                            size="small"
                            sx={{ mt: 0.2, display: 'block', height: 16, fontSize: '0.62rem', bgcolor: '#FEF3C7', color: '#B45309', fontWeight: 800 }}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`Unit ${syl?.unitNo || '—'}`}
                          size="small"
                          sx={{ bgcolor: '#0F2C59', color: '#FFFFFF', fontWeight: 800, fontSize: '0.66rem', height: 18, mb: 0.2 }}
                        />
                        <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', color: '#334155', fontSize: '0.75rem', lineHeight: 1.25 }}>
                          {syl?.title || 'General Vocational'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.78rem', color: '#334155', maxWidth: 260 }}>
                        {wp.theoryAspect || '—'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.78rem', color: '#334155', maxWidth: 260 }}>
                        {wp.practicalAspect || '—'}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 800, color: '#059669', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                        {wp.plannedHours || 2}h
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <Chip
                          clickable
                          onClick={() => handleToggleStatus(wp)}
                          label={wp.status}
                          size="small"
                          sx={{
                            height: 20,
                            bgcolor: wp.status === 'Completed' ? '#ECFDF5' : '#FEF3C7',
                            color: wp.status === 'Completed' ? '#059669' : '#B45309',
                            fontWeight: 800,
                            fontSize: '0.68rem'
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <IconButton size="small" onClick={() => handleOpenEdit(wp)} sx={{ color: '#1D4ED8', p: 0.45 }}>
                            <EditIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleDelete(wp.id)} sx={{ color: '#EF4444', p: 0.45 }}>
                            <DeleteOutlineIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {filteredWorkPlans.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} sx={{ textAlign: 'center', py: 3.5, color: '#64748b', fontSize: '0.8rem' }}>
                      No work plans found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* =======================================================
          MODAL 1: ADD / EDIT WORK PLAN
          ======================================================= */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
        BackdropProps={{
          sx: { backdropFilter: 'blur(5px)', bgcolor: 'rgba(15, 23, 42, 0.45)' }
        }}
        PaperProps={{
          sx: {
            borderRadius: 4,
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
            border: '1px solid rgba(226, 232, 240, 0.8)'
          }
        }}
      >
        <DialogTitle
          sx={{
            p: 2.5,
            background: 'linear-gradient(135deg, #0F2C59 0%, #1E3A8A 100%)',
            color: '#FFFFFF',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.15)', color: '#FFFFFF', width: 44, height: 44, borderRadius: 2.5 }}>
              <EventNoteIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, fontSize: '1.05rem', lineHeight: 1.2 }}>
                {editingItem ? 'Edit Work Plan' : 'Create Work Plan'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.72rem' }}>
                {selectedGroup?.groupCode} • Daily Class Execution Plan for {selectedCourse?.title}
              </Typography>
            </Box>
          </Box>
          <IconButton
            size="small"
            onClick={() => setOpenDialog(false)}
            sx={{
              color: 'rgba(255, 255, 255, 0.8)',
              bgcolor: 'rgba(255, 255, 255, 0.08)',
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)', color: '#FFFFFF' }
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent
          dividers
          sx={{
            p: 3,
            bgcolor: '#FFFFFF',
            '&::-webkit-scrollbar': { width: 6 },
            '&::-webkit-scrollbar-track': { background: '#F1F5F9' },
            '&::-webkit-scrollbar-thumb': { background: '#CBD5E1', borderRadius: 3 },
            '&::-webkit-scrollbar-thumb:hover': { background: '#94A3B8' }
          }}
        >
          <Grid container spacing={2}>
            {/* Syllabus Unit Selector */}
            <Grid item xs={12}>
              <TextField
                select
                label="Syllabus Unit"
                fullWidth
                size="small"
                value={formData.syllabusId}
                onChange={(e) => handleSyllabusSelect(e.target.value)}
                required
              >
                <MenuItem value="" sx={{ color: '#94A3B8', fontStyle: 'italic' }}>
                  -- Select Syllabus Unit --
                </MenuItem>
                {availableSyllabi.map((syl) => (
                  <MenuItem key={syl.id} value={syl.id}>
                    <b>Unit {syl.unitNo}: {syl.title}</b> ({syl.totalHours} hrs)
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Plan Date */}
            <Grid item xs={12} sm={4}>
              <TextField
                type="date"
                label="Planned Date *"
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
                value={formData.planDate}
                onChange={(e) => handleDateChange(e.target.value)}
              />
            </Grid>

            {/* Day Name */}
            <Grid item xs={12} sm={4}>
              <TextField
                label="Day"
                fullWidth
                size="small"
                value={formData.dayName}
                InputProps={{ readOnly: true }}
              />
            </Grid>

            {/* Planned Hours */}
            <Grid item xs={12} sm={4}>
              <TextField
                type="number"
                label="Planned Hours *"
                fullWidth
                size="small"
                placeholder="e.g. 2"
                value={formData.plannedHours}
                onChange={(e) => setFormData({ ...formData, plannedHours: e.target.value === '' ? '' : Number(e.target.value) })}
              />
            </Grid>

            {/* Theoretical Aspect */}
            <Grid item xs={12}>
              <TextField
                label="Theoretical Aspect *"
                multiline
                rows={2.5}
                fullWidth
                size="small"
                placeholder="Theoretical concepts, principles, rules, and standards to be taught on this day..."
                value={formData.theoryAspect}
                onChange={(e) => setFormData({ ...formData, theoryAspect: e.target.value })}
              />
            </Grid>

            {/* Practical Aspect */}
            <Grid item xs={12}>
              <TextField
                label="Practical Aspect *"
                multiline
                rows={2.5}
                fullWidth
                size="small"
                placeholder="Practical exercises, skill drills, and tool testing to be conducted with students on this day..."
                value={formData.practicalAspect}
                onChange={(e) => setFormData({ ...formData, practicalAspect: e.target.value })}
              />
            </Grid>

            {/* Status */}
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Delivery Status"
                fullWidth
                size="small"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
                <MenuItem value="Rescheduled">Rescheduled</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions
          sx={{
            p: 2.5,
            bgcolor: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 1.5
          }}
        >
          <Button
            onClick={() => setOpenDialog(false)}
            sx={{
              fontWeight: 700,
              color: '#64748B',
              border: '1px solid #E2E8F0',
              borderRadius: 2,
              px: 2.5,
              textTransform: 'none',
              '&:hover': { bgcolor: '#F1F5F9', color: '#0F172A' }
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<CheckCircleIcon />}
            onClick={handleSave}
            sx={{
              fontWeight: 800,
              background: 'linear-gradient(135deg, #0F2C59 0%, #1E3A8A 100%)',
              color: '#FFFFFF',
              borderRadius: 2,
              px: 3,
              boxShadow: '0 4px 12px rgba(15, 44, 89, 0.25)',
              textTransform: 'none',
              '&:hover': {
                background: 'linear-gradient(135deg, #0F2444 0%, #172554 100%)',
                boxShadow: '0 6px 16px rgba(15, 44, 89, 0.35)'
              }
            }}
          >
            Save Work Plan
          </Button>
        </DialogActions>
      </Dialog>

      {/* =======================================================
          MODAL 2: 1-CLICK AUTO-SCHEDULE GENERATOR
          ======================================================= */}
      <Dialog
        open={openAutoScheduleDialog}
        onClose={() => setOpenAutoScheduleDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3.5, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 900, color: '#0F2C59', display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesomeIcon sx={{ color: '#F59E0B' }} />
          1-Click Auto-Schedule Generator
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ color: '#64748B', mb: 2.5 }}>
            This feature automatically generates a daily 2-hour training schedule across calendar dates for all <b>{availableSyllabi.length}</b> syllabus units of <b>{selectedCourse?.title}</b>.
            Saturdays (weekly holidays) and public holidays are automatically skipped.
          </Typography>

          <Stack spacing={2}>
            <TextField
              type="date"
              label="Batch Start Date *"
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
              value={autoScheduleConfig.startDate}
              onChange={(e) => setAutoScheduleConfig({ ...autoScheduleConfig, startDate: e.target.value })}
            />

            <TextField
              type="number"
              label="Hours per Day"
              fullWidth
              size="small"
              value={autoScheduleConfig.dailyHours}
              onChange={(e) => setAutoScheduleConfig({ ...autoScheduleConfig, dailyHours: Number(e.target.value) })}
              helperText="By shift: 2 hours (regular) or 4 hours (intensive)"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenAutoScheduleDialog(false)} sx={{ fontWeight: 700 }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleGenerateAutoSchedule} sx={{ fontWeight: 900, bgcolor: '#10B981' }}>
            ⚡ Generate Auto-Schedule
          </Button>
        </DialogActions>
      </Dialog>

      {/* =======================================================
          MODAL 3: OFFICIAL A4 LANDSCAPE / PORTRAIT PRINTABLE MODAL
          ======================================================= */}
      <Dialog
        open={openPrintModal}
        onClose={() => setOpenPrintModal(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3.5, p: 1 } }}
      >
        {/* Header Controls */}
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Chip label="A4 CTEVT Official Format" color="primary" size="small" sx={{ fontWeight: 900 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F2C59' }}>
              Official Work Plan Document (Printable View)
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <ToggleButtonGroup
              value={printOrientation}
              exclusive
              onChange={(_, next) => next && setPrintOrientation(next)}
              size="small"
            >
              <ToggleButton value="landscape" sx={{ fontWeight: 800, fontSize: '0.72rem', px: 1.5 }}>
                Landscape
              </ToggleButton>
              <ToggleButton value="portrait" sx={{ fontWeight: 800, fontSize: '0.72rem', px: 1.5 }}>
                Portrait
              </ToggleButton>
            </ToggleButtonGroup>

            <Button
              variant="contained"
              startIcon={<PrintIcon />}
              onClick={() => window.print()}
              sx={{ fontWeight: 800, bgcolor: '#0F2C59' }}
            >
              Print / PDF
            </Button>

            <IconButton onClick={() => setOpenPrintModal(false)} sx={{ color: '#64748B' }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Printable Paper Canvas */}
        <DialogContent sx={{ p: { xs: 2, sm: 4 }, bgcolor: '#FFFFFF' }}>
          <Box
            id="printableWorkPlanA4"
            sx={{
              fontFamily: "'Noto Sans Devanagari', 'Inter', sans-serif",
              color: '#0F172A',
              maxWidth: printOrientation === 'landscape' ? 1100 : 800,
              mx: 'auto',
              border: '2px solid #0F2C59',
              p: { xs: 2, sm: 4 },
              bgcolor: '#FFFFFF'
            }}
          >
            {/* 1. Official Institutional Letterhead */}
            <Box sx={{ textAlign: 'center', pb: 2, borderBottom: '2.5px double #0F2C59', mb: 2.5 }}>
              <Typography variant="overline" sx={{ fontWeight: 900, color: '#059669', letterSpacing: '0.12em', fontSize: '0.8rem' }}>
                GOVERNMENT REGD • CTEVT ACCREDITED TECHNICAL TRAINING INSTITUTE
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#0F2C59', letterSpacing: '-0.02em', mt: 0.3 }}>
                PRABIDHIK SCHOOL, JORPATI
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1E3E62' }}>
                KITE CAREGIVER TRAINING CENTER • Jorpati, Gokarneshwor, Kathmandu
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.5 }}>
                Phone: +977-1-4481234 | Email: info@globalera.com.np | Regd No: 184920/078/079
              </Typography>
            </Box>

            {/* 2. Document Title Banner */}
            <Box sx={{ my: 2, textAlign: 'center', bgcolor: '#F1F5F9', py: 1, border: '1.5px solid #0F2C59', borderRadius: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0F2C59' }}>
                TRAINING DELIVERY WORK PLAN
              </Typography>
            </Box>

            {/* 3. Metadata Grid */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 1.5,
                p: 2,
                mb: 2.5,
                border: '1px solid #CBD5E1',
                bgcolor: '#F8FAFC',
                fontSize: '0.85rem'
              }}
            >
              <Box>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, display: 'block' }}>
                  Course / Curriculum:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 900 }}>
                  {selectedCourse?.title} ({courseTargetHours} Hours • {selectedCourse?.level || 'CTEVT Level 1'})
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, display: 'block' }}>
                  Training Batch &amp; Shift:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 900 }}>
                  Batch: <b>{selectedGroup?.groupCode}</b> | Shift {selectedGroup?.shift} ({selectedGroup?.startTime} - {selectedGroup?.endTime})
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, display: 'block' }}>
                  Primary Instructor:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 900, color: '#1D4ED8' }}>
                  {trainer?.name || '—'} {trainer?.phone ? `(Contact: ${trainer.phone})` : ''}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, display: 'block' }}>
                  Total Planned Time / Progress:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 900 }}>
                  {totalPlannedHours} Hours Planned ({groupWorkPlans.length} Days) • {deliveryProgress}% Completed
                </Typography>
              </Box>
            </Box>

            {/* 4. Official Tabular Schedule */}
            <TableContainer sx={{ border: '1.5px solid #0F2C59', mb: 3 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#0F2C59' }}>
                  <TableRow>
                    <TableCell sx={{ color: '#FFFFFF', fontWeight: 900, width: 45, textAlign: 'center' }}>S.N.</TableCell>
                    <TableCell sx={{ color: '#FFFFFF', fontWeight: 900, width: 105 }}>Date &amp; Day</TableCell>
                    <TableCell sx={{ color: '#FFFFFF', fontWeight: 900, width: 140 }}>Syllabus Unit</TableCell>
                    <TableCell sx={{ color: '#FFFFFF', fontWeight: 900 }}>Theoretical Aspect</TableCell>
                    <TableCell sx={{ color: '#FFFFFF', fontWeight: 900 }}>Practical Exercises</TableCell>
                    <TableCell sx={{ color: '#FFFFFF', fontWeight: 900, textAlign: 'center', width: 50 }}>Hours</TableCell>
                    <TableCell sx={{ color: '#FFFFFF', fontWeight: 900, textAlign: 'center', width: 75 }}>Remarks</TableCell>
                    <TableCell sx={{ color: '#FFFFFF', fontWeight: 900, textAlign: 'center', width: 65 }}>Sign.</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {groupWorkPlans.map((wp, idx) => {
                    const syl = (db.syllabi || []).find((s) => s.id === wp.syllabusId);
                    const holidayInfo = getHolidayInfo(wp.planDate, db.holidays || []);

                    return (
                      <TableRow key={wp.id} sx={{ '& td': { border: '1px solid #CBD5E1', fontSize: '0.8rem' } }}>
                        <TableCell sx={{ textAlign: 'center', fontWeight: 800 }}>{idx + 1}</TableCell>
                        <TableCell>
                          <b>{wp.planDate}</b>
                          <br />
                          <span style={{ color: '#64748B' }}>{wp.dayName}</span>
                          {holidayInfo.isHoliday && <span style={{ color: '#B45309', display: 'block', fontSize: '0.7rem' }}>({holidayInfo.name})</span>}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>
                          Unit {syl?.unitNo || ''}: {syl?.title || ''}
                        </TableCell>
                        <TableCell>{wp.theoryAspect || '—'}</TableCell>
                        <TableCell>{wp.practicalAspect || '—'}</TableCell>
                        <TableCell sx={{ textAlign: 'center', fontWeight: 900 }}>{wp.plannedHours}h</TableCell>
                        <TableCell sx={{ textAlign: 'center', fontWeight: 700 }}>{wp.status}</TableCell>
                        <TableCell sx={{ textAlign: 'center' }} />
                      </TableRow>
                    );
                  })}

                  {/* Summary Total Row */}
                  <TableRow sx={{ bgcolor: '#F8FAFC', '& td': { border: '1.5px solid #0F2C59' } }}>
                    <TableCell colSpan={5} sx={{ fontWeight: 900, textAlign: 'right' }}>
                      TOTAL PLANNED HOURS:
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center', fontWeight: 900, color: '#0F2C59', fontSize: '0.95rem' }}>
                      {totalPlannedHours}h
                    </TableCell>
                    <TableCell colSpan={2} sx={{ textAlign: 'center', fontWeight: 800 }}>
                      {deliveryProgress}% Complete
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            {/* 5. Official CTEVT Regulatory Note */}
            <Box sx={{ bgcolor: '#F8FAFC', p: 1.5, borderRadius: 1.5, border: '1px solid #CBD5E1', mb: 4 }}>
              <Typography variant="caption" sx={{ fontWeight: 800, display: 'block', color: '#0F2C59' }}>
                Official Work Plan Rules &amp; Standards:
              </Typography>
              <Typography variant="caption" sx={{ color: '#475569', display: 'block', mt: 0.3 }}>
                1. After each training session, the instructor must update the daily Log Book and Attendance Register.<br />
                2. In the event of an unexpected public holiday, a compensation class must be conducted in extra hours with approval from campus administration.
              </Typography>
            </Box>

            {/* 6. Official 3-Tier CTEVT Inspection Signatures */}
            <Grid container spacing={3} sx={{ pt: 3 }}>
              <Grid item xs={4} sx={{ textAlign: 'center' }}>
                <Box sx={{ borderTop: '1.5px dashed #0F2C59', pt: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 900, display: 'block', color: '#0F2C59' }}>
                    Trainer Signature
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                    {trainer?.name || 'Lead Trainer'}<br />Date: {new Date().toISOString().slice(0, 10)}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={4} sx={{ textAlign: 'center' }}>
                <Box sx={{ borderTop: '1.5px dashed #0F2C59', pt: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 900, display: 'block', color: '#0F2C59' }}>
                    Curriculum Coordinator
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                    Approved by CTEVT Lead<br />Signature &amp; Date
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={4} sx={{ textAlign: 'center' }}>
                <Box sx={{ borderTop: '1.5px dashed #0F2C59', pt: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 900, display: 'block', color: '#0F2C59' }}>
                    Campus Chief / Principal
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                    Official Seal &amp; Signature
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
          <Button onClick={() => setOpenPrintModal(false)} sx={{ fontWeight: 700 }}>
            Close
          </Button>
          <Button variant="contained" startIcon={<PrintIcon />} onClick={() => window.print()} sx={{ fontWeight: 800, bgcolor: '#0F2C59' }}>
            Print A4
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
