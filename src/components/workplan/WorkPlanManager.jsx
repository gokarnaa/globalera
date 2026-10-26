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
  const courseTargetHours = selectedCourse?.totalHours || 390;
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
      theoryAspect: syl ? `सैद्धान्तिक ज्ञान: ${syl.title} का मुख्य मापदण्ड र अवधारणा` : prev.theoryAspect,
      practicalAspect: syl ? `प्रयोगात्मक सीप: ${syl.title} मा प्रत्यक्ष डेमो तथा विद्यार्थी अभ्यास ड्रिल` : prev.practicalAspect
    }));
  };

  const handleDateChange = (dateStr) => {
    const d = new Date(dateStr);
    const day = isNaN(d.getTime()) ? '' : daysOfWeek[d.getDay()];
    setFormData((prev) => ({ ...prev, planDate: dateStr, dayName: day }));
  };

  const handleSave = () => {
    if (!formData.syllabusId || !formData.planDate) {
      alert('कृपया पाठ्यक्रम एकाइ र मिति चयन गर्नुहोस्।');
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
    if (window.confirm('के तपाईं निश्चित हुनुहुन्छ? यो कार्ययोजना मेटिनेछ।')) {
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
      alert('यस पाठ्यक्रममा कुनै एकाइ फेला परेन। पहिले Syllabus Studio मा एकाइ थप्नुहोस्।');
      return;
    }

    let currentDate = new Date(autoScheduleConfig.startDate);
    if (isNaN(currentDate.getTime())) {
      alert('कृपया मान्य सुरु मिति छान्नुहोस्।');
      return;
    }

    const generatedPlans = [];
    const dailyHours = Number(autoScheduleConfig.dailyHours) || 2;

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

          if (autoScheduleConfig.skipSaturdays && isSat) {
            currentDate.setDate(currentDate.getDate() + 1);
            continue;
          }
          if (autoScheduleConfig.skipHolidays && holidayInfo.isHoliday) {
            currentDate.setDate(currentDate.getDate() + 1);
            continue;
          }
          break;
        }

        const planDateStr = currentDate.toISOString().slice(0, 10);
        const dayNameStr = daysOfWeek[currentDate.getDay()];

        generatedPlans.push({
          id: `WP-${Date.now()}-${sylIdx}-${s}`,
          groupId: selectedGroupId,
          syllabusId: syl.id,
          planDate: planDateStr,
          dayName: dayNameStr,
          theoryAspect: `सैद्धान्तिक ज्ञान: ${syl.title} - सत्र ${s}/${sessionsNeeded} (आधारभूत सिद्धान्त)`,
          practicalAspect: `प्रयोगात्मक सीप: ${syl.title} - सत्र ${s}/${sessionsNeeded} (औजार ह्यान्डलिङ र अभ्यास)`,
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
      `*ग्लोबल एरा प्राविधिक स्कुल (Global Era Technical School)*\n` +
      `📋 *CTEVT आधिकारिक कार्ययोजना (Vocational Work Plan)*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `• *समूह (Batch):* ${selectedGroup?.groupCode || '—'} (Shift ${selectedGroup?.shift || 'A'}: ${selectedGroup?.startTime || '07:00'} - ${selectedGroup?.endTime || '09:00'})\n` +
      `• *पाठ्यक्रम (Course):* ${selectedCourse?.title || 'Vocational Training'}\n` +
      `• *प्रशिक्षक (Instructor):* ${trainer?.name || '—'} ${trainer?.phone ? `(${trainer.phone})` : ''}\n` +
      `• *कुल सत्रहरू:* ${groupWorkPlans.length} Sessions (${totalPlannedHours} Hours)\n` +
      `• *प्रगति:* ${completedHours} / ${totalPlannedHours} Hours (${deliveryProgress}% Completed)\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📅 *मुख्य तालिम तालिका (Sample):*\n` +
      groupWorkPlans.slice(0, 6).map((wp, idx) => {
        const syl = (db.syllabi || []).find((s) => s.id === wp.syllabusId);
        return `${idx + 1}. ${wp.planDate} (${wp.dayName}): Unit ${syl?.unitNo || ''} - ${syl?.title || 'Unit'} [${wp.plannedHours}h - ${wp.status}]`;
      }).join('\n') +
      (groupWorkPlans.length > 6 ? `\n...र थप ${groupWorkPlans.length - 6} वटा सत्रहरू।` : '') +
      `\n━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `_CTEVT राष्ट्रिय सीप मानक कार्ययोजना।_`
    );
  };

  return (
    <Box sx={{ width: '100%', pb: 4 }}>
      {/* =======================================================
          1. EXECUTIVE WORK PLAN HERO BANNER
          ======================================================= */}
      <Card
        sx={{
          mb: 3,
          p: { xs: 2.5, sm: 3.5 },
          borderRadius: 4,
          background: 'linear-gradient(135deg, #071933 0%, #0F2C59 60%, #1A56B0 100%)',
          color: '#FFFFFF',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 16px 40px -10px rgba(7, 25, 51, 0.4)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Grid container spacing={3} alignItems="center">
          {/* Left Title & Batch Details */}
          <Grid item xs={12} lg={7}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1.5, flexWrap: 'wrap' }}>
              <Chip
                icon={<ShieldIcon sx={{ fontSize: '14px !important', color: '#FDE047 !important' }} />}
                label="CTEVT Curricular Work Plan"
                size="small"
                sx={{
                  bgcolor: 'rgba(254, 240, 138, 0.15)',
                  color: '#FEF08A',
                  fontWeight: 900,
                  fontSize: '0.72rem',
                  border: '1px solid rgba(254, 240, 138, 0.3)'
                }}
              />
              <Chip
                label={`Batch: ${selectedGroup?.groupCode || '—'} (Shift ${selectedGroup?.shift || 'A'})`}
                size="small"
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.15)',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.72rem'
                }}
              />
              <Chip
                label={`प्रशिक्षक: ${trainer?.name || 'Assigned Trainer'}`}
                size="small"
                sx={{
                  bgcolor: 'rgba(74, 222, 128, 0.15)',
                  color: '#86EFAC',
                  fontWeight: 800,
                  fontSize: '0.72rem',
                  border: '1px solid rgba(74, 222, 128, 0.25)'
                }}
              />
            </Box>

            <Typography
              variant="h4"
              sx={{
                fontWeight: 900,
                color: '#FFFFFF',
                fontSize: { xs: '1.45rem', sm: '1.9rem', md: '2.1rem' },
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
                mb: 1
              }}
            >
              Work Plan (कार्य योजना व्यवस्थापन)
            </Typography>

            <Typography variant="body2" sx={{ color: '#CBD5E1', maxWidth: 620, mb: 2.5, lineHeight: 1.6 }}>
              {selectedCourse?.title} को दैनिक शिक्षण तालिका, सैद्धान्तिक तथा प्रयोगात्मक घण्टाको अग्रिम योजना।
              यस कार्ययोजनाबाट सिधै पाठयोजना (Lesson Plan) र दैनिक लगबुक (Log Book) तयार हुन्छ।
            </Typography>

            {/* Quick Actions */}
            <Stack direction="row" spacing={1.2} flexWrap="wrap" useFlexGap>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenAdd}
                sx={{
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%) !important',
                  color: '#FFFFFF !important',
                  fontWeight: 900,
                  fontSize: '0.85rem',
                  py: 1,
                  px: 2,
                  borderRadius: 2.5,
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%) !important'
                  }
                }}
              >
                + Create Work Plan (नयाँ कार्ययोजना)
              </Button>

              <Button
                variant="contained"
                startIcon={<AutoAwesomeIcon sx={{ color: '#FDE047' }} />}
                onClick={() => setOpenAutoScheduleDialog(true)}
                sx={{
                  background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%) !important',
                  color: '#FFFFFF !important',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  py: 1,
                  px: 2,
                  borderRadius: 2.5,
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                1-Click Auto-Schedule
              </Button>

              <Button
                variant="outlined"
                startIcon={<PictureAsPdfIcon />}
                onClick={() => setOpenPrintModal(true)}
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.4) !important',
                  color: '#FFFFFF !important',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  py: 1,
                  px: 1.8,
                  borderRadius: 2.5,
                  bgcolor: 'rgba(255, 255, 255, 0.08)',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.18)' }
                }}
              >
                A4 Official Print / PDF
              </Button>

              <IconButton
                component="a"
                href={getWhatsAppUrl(trainer?.phone || '', getBatchShareText())}
                target="_blank"
                title="Share Schedule on WhatsApp"
                sx={{
                  bgcolor: '#25D366',
                  color: '#FFFFFF',
                  p: 1.1,
                  borderRadius: 2.5,
                  '&:hover': { bgcolor: '#1EBE5D' }
                }}
              >
                <WhatsAppIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Grid>

          {/* Right Live Delivery Progress Widget */}
          <Grid item xs={12} lg={5}>
            <Box
              sx={{
                bgcolor: 'rgba(15, 30, 60, 0.75)',
                backdropFilter: 'blur(16px)',
                p: { xs: 2.5, sm: 3 },
                borderRadius: 3.5,
                border: '1.5px solid rgba(255, 255, 255, 0.16)',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="overline" sx={{ color: '#93C5FD', fontWeight: 900, letterSpacing: '0.08em' }}>
                  📊 DELIVERY &amp; SCHEDULE PROGRESS
                </Typography>
                <Chip
                  size="small"
                  label={`${deliveryProgress}% Delivered`}
                  sx={{
                    height: 20,
                    fontSize: '0.68rem',
                    fontWeight: 900,
                    bgcolor: deliveryProgress >= 80 ? '#10B981' : '#3B82F6',
                    color: '#FFFFFF'
                  }}
                />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1 }}>
                <Typography variant="h3" sx={{ fontWeight: 900, color: '#FFFFFF', lineHeight: 1 }}>
                  {totalPlannedHours}
                </Typography>
                <Typography variant="subtitle1" sx={{ color: '#94A3B8', fontWeight: 700 }}>
                  / {courseTargetHours} Hours Planned ({planningProgress}%)
                </Typography>
              </Box>

              <LinearProgress
                variant="determinate"
                value={deliveryProgress}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  bgcolor: 'rgba(255, 255, 255, 0.15)',
                  mb: 1.5,
                  '& .MuiLinearProgress-bar': {
                    bgcolor: '#10B981',
                    borderRadius: 5
                  }
                }}
              />

              <Typography variant="caption" sx={{ color: '#E2E8F0', display: 'block', mb: 2 }}>
                सम्पन्न: <b>{completedHours} घण्टा</b> • बाँकी: <b>{pendingHours} घण्टा</b> ({groupWorkPlans.length} कुल दैनिक सत्रहरू)
              </Typography>

              {/* Status breakdown pills */}
              <Grid container spacing={1.5}>
                <Grid item xs={4}>
                  <Box sx={{ bgcolor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', p: 1.2, borderRadius: 2, textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#86EFAC', fontWeight: 800, display: 'block' }}>
                      COMPLETED
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#FFFFFF' }}>
                      {groupWorkPlans.filter((w) => w.status === 'Completed').length} सत्र
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ bgcolor: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', p: 1.2, borderRadius: 2, textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#FDE68A', fontWeight: 800, display: 'block' }}>
                      PENDING
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#FFFFFF' }}>
                      {groupWorkPlans.filter((w) => w.status === 'Pending').length} सत्र
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ bgcolor: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', p: 1.2, borderRadius: 2, textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#93C5FD', fontWeight: 800, display: 'block' }}>
                      TOTAL DAYS
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#FFFFFF' }}>
                      {groupWorkPlans.length} दिन
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Grid>
        </Grid>
      </Card>

      {/* =======================================================
          2. GROUP SELECTOR & MULTI-FILTER BAR
          ======================================================= */}
      <Card
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: 3.5,
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
          bgcolor: '#FFFFFF'
        }}
      >
        <Grid container spacing={2} alignItems="center">
          {/* Select Group */}
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              select
              size="small"
              label="तालिम समूह छान्नुहोस् (Select Training Group)"
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
              placeholder="मिति, एकाइ, सैद्धान्तिक वा सीप खोज्नुहोस्..."
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
              दृश्य:
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
            label={`सबै सत्रहरू (${groupWorkPlans.length})`}
            color={statusFilter === 'ALL' ? 'primary' : 'default'}
            onClick={() => setStatusFilter('ALL')}
            size="small"
            sx={{ fontWeight: 800, fontSize: '0.75rem' }}
          />
          <Chip
            clickable
            label={`सम्पन्न (${groupWorkPlans.filter((w) => w.status === 'Completed').length})`}
            color={statusFilter === 'Completed' ? 'success' : 'default'}
            onClick={() => setStatusFilter('Completed')}
            size="small"
            sx={{ fontWeight: 800, fontSize: '0.75rem' }}
          />
          <Chip
            clickable
            label={`हुन बाँकी (${groupWorkPlans.filter((w) => w.status === 'Pending').length})`}
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
                          label={`⚠️ ${holidayInfo.name || 'Holiday / शनिबार'}`}
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
                        📖 सैद्धान्तिक विषय (Theory):
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#334155', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {wp.theoryAspect || 'Fundamental vocational principles.'}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" sx={{ color: '#059669', fontWeight: 800, display: 'block' }}>
                        🛠️ प्रयोगात्मक अभ्यास (Practical):
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
                      label={`${wp.plannedHours || 2} घण्टा`}
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
                  कुनै कार्ययोजना फेला परेन
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748B', mb: 2 }}>
                  तपाईंले नयाँ कार्ययोजना थप्न वा "1-Click Auto-Schedule" बाट सम्पूर्ण पाठ्यक्रमको क्यालेन्डर तालिका स्वतः भर्न सक्नुहुन्छ।
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
                    <b>सैद्धान्तिक:</b> {wp.theoryAspect}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#334155' }}>
                    <b>प्रयोगात्मक:</b> {wp.practicalAspect}
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
        <Card sx={{ borderRadius: 3.5, overflow: 'hidden', border: '1px solid #E2E8F0', boxShadow: '0 4px 18px rgba(0,0,0,0.04)' }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#0F2C59' }}>
                <TableRow>
                  <TableCell sx={{ color: '#FFFFFF', fontWeight: 900, width: 60, textAlign: 'center' }}>क्र.सं.</TableCell>
                  <TableCell sx={{ color: '#FFFFFF', fontWeight: 900, width: 140 }}>मिति र बार (Date)</TableCell>
                  <TableCell sx={{ color: '#FFFFFF', fontWeight: 900, width: 180 }}>पाठ्यक्रम एकाइ (Unit)</TableCell>
                  <TableCell sx={{ color: '#FFFFFF', fontWeight: 900 }}>सैद्धान्तिक विषयवस्तु (Theory)</TableCell>
                  <TableCell sx={{ color: '#FFFFFF', fontWeight: 900 }}>प्रयोगात्मक सीप (Practical)</TableCell>
                  <TableCell sx={{ color: '#FFFFFF', fontWeight: 900, textAlign: 'center', width: 75 }}>घण्टा</TableCell>
                  <TableCell sx={{ color: '#FFFFFF', fontWeight: 900, textAlign: 'center', width: 110 }}>स्थिति</TableCell>
                  <TableCell sx={{ color: '#FFFFFF', fontWeight: 900, textAlign: 'right', width: 100 }}>कार्य (Actions)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredWorkPlans.map((wp, idx) => {
                  const syl = (db.syllabi || []).find((s) => s.id === wp.syllabusId);
                  const holidayInfo = getHolidayInfo(wp.planDate, db.holidays || []);

                  return (
                    <TableRow key={wp.id} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#F8FAFC' } }}>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 800, color: '#1D4ED8' }}>
                        {idx + 1}
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                          {wp.planDate}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B' }}>
                          {wp.dayName}
                        </Typography>
                        {holidayInfo.isHoliday && (
                          <Chip
                            label={holidayInfo.name || 'Holiday'}
                            size="small"
                            sx={{ mt: 0.3, display: 'block', height: 16, fontSize: '0.62rem', bgcolor: '#FEF3C7', color: '#B45309', fontWeight: 800 }}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`Unit ${syl?.unitNo || '—'}`}
                          size="small"
                          sx={{ bgcolor: '#0F2C59', color: '#FFFFFF', fontWeight: 900, fontSize: '0.68rem', height: 20, mb: 0.3 }}
                        />
                        <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', color: '#334155' }}>
                          {syl?.title || 'General Vocational'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.82rem', color: '#334155', maxWidth: 260 }}>
                        {wp.theoryAspect || '—'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.82rem', color: '#334155', maxWidth: 260 }}>
                        {wp.practicalAspect || '—'}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 900, color: '#059669' }}>
                        {wp.plannedHours || 2}h
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Chip
                          clickable
                          onClick={() => handleToggleStatus(wp)}
                          label={wp.status}
                          size="small"
                          sx={{
                            bgcolor: wp.status === 'Completed' ? '#ECFDF5' : '#FEF3C7',
                            color: wp.status === 'Completed' ? '#059669' : '#B45309',
                            fontWeight: 900,
                            fontSize: '0.7rem'
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ textAlign: 'right' }}>
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                          <IconButton size="small" onClick={() => handleOpenEdit(wp)} sx={{ color: '#1D4ED8' }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleDelete(wp.id)} sx={{ color: '#EF4444' }}>
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {filteredWorkPlans.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} sx={{ textAlign: 'center', py: 5, color: '#94A3B8' }}>
                      कुनै कार्ययोजना फेला परेन।
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
                {editingItem ? 'दैनिक कार्ययोजना सम्पादन (Edit Work Plan)' : 'नयाँ दैनिक कार्ययोजना सिर्जना (Create Work Plan)'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.72rem' }}>
                {selectedGroup?.groupCode} • {selectedCourse?.title} को दैनिक कक्षा सञ्चालन योजना
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
                label="पाठ्यक्रम एकाइ (Syllabus Unit) *"
                fullWidth
                size="small"
                value={formData.syllabusId}
                onChange={(e) => handleSyllabusSelect(e.target.value)}
                required
              >
                <MenuItem value="" sx={{ color: '#94A3B8', fontStyle: 'italic' }}>
                  -- पाठ्यक्रम एकाइ छान्नुहोस् (Select Syllabus Unit) --
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
                label="योजना गरिएको मिति (Date) *"
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
                label="बार (Day)"
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
                label="घण्टा (Planned Hours) *"
                fullWidth
                size="small"
                placeholder="उदा: 2"
                value={formData.plannedHours}
                onChange={(e) => setFormData({ ...formData, plannedHours: e.target.value === '' ? '' : Number(e.target.value) })}
              />
            </Grid>

            {/* Theoretical Aspect */}
            <Grid item xs={12}>
              <TextField
                label="सैद्धान्तिक विषयवस्तु (Theoretical Aspect) *"
                multiline
                rows={2.5}
                fullWidth
                size="small"
                placeholder="यस दिन पढाइने सैद्धान्तिक अवधारणा, सिद्धान्त, नियम तथा मापदण्ड..."
                value={formData.theoryAspect}
                onChange={(e) => setFormData({ ...formData, theoryAspect: e.target.value })}
              />
            </Grid>

            {/* Practical Aspect */}
            <Grid item xs={12}>
              <TextField
                label="प्रयोगात्मक सीप तथा अभ्यास (Practical Aspect) *"
                multiline
                rows={2.5}
                fullWidth
                size="small"
                placeholder="यस दिन विद्यार्थीहरूलाई गराइने प्रयोगात्मक अभ्यास, सीप ड्रिल तथा औजार परीक्षण..."
                value={formData.practicalAspect}
                onChange={(e) => setFormData({ ...formData, practicalAspect: e.target.value })}
              />
            </Grid>

            {/* Status */}
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="डेलिभरी स्थिति (Status)"
                fullWidth
                size="small"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <MenuItem value="Pending">Pending (हुन बाँकी)</MenuItem>
                <MenuItem value="Completed">Completed (सम्पन्न भयो)</MenuItem>
                <MenuItem value="Rescheduled">Rescheduled (समय सारिएको)</MenuItem>
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
            रद्द गर्नुहोस् (Cancel)
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
            सुरक्षित गर्नुहोस् (Save Work Plan)
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
            यस सुविधाले <b>{selectedCourse?.title}</b> का सबै <b>{availableSyllabi.length}</b> पाठ्यक्रम एकाइहरूलाई क्यालेन्डर मितिहरूमा स्वतः दिनहुँ २ घण्टाको दरले तालिम तालिका सिर्जना गरिदिन्छ।
            शनिबार (साप्ताहिक बिदा) र सरकारी सार्वजनिक बिदा स्वतः छाडिनेछ।
          </Typography>

          <Stack spacing={2}>
            <TextField
              type="date"
              label="सुरु हुने मिति (Batch Start Date) *"
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
              value={autoScheduleConfig.startDate}
              onChange={(e) => setAutoScheduleConfig({ ...autoScheduleConfig, startDate: e.target.value })}
            />

            <TextField
              type="number"
              label="दैनिक तालिम घण्टा (Hours per Day)"
              fullWidth
              size="small"
              value={autoScheduleConfig.dailyHours}
              onChange={(e) => setAutoScheduleConfig({ ...autoScheduleConfig, dailyHours: Number(e.target.value) })}
              helperText="सिफ्ट अनुसार: २ घण्टा (नियमित) वा ४ घण्टा (द्रुत)"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenAutoScheduleDialog(false)} sx={{ fontWeight: 700 }}>
            रद्द
          </Button>
          <Button variant="contained" onClick={handleGenerateAutoSchedule} sx={{ fontWeight: 900, bgcolor: '#10B981' }}>
            ⚡ स्वतः तालिका सिर्जना गर्नुहोस् (Generate)
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
              आधिकारिक कार्ययोजना दस्तावेज (Official Printable View)
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
                Landscape (चौडा)
              </ToggleButton>
              <ToggleButton value="portrait" sx={{ fontWeight: 800, fontSize: '0.72rem', px: 1.5 }}>
                Portrait (ठाडो)
              </ToggleButton>
            </ToggleButtonGroup>

            <Button
              variant="contained"
              startIcon={<PrintIcon />}
              onClick={() => window.print()}
              sx={{ fontWeight: 800, bgcolor: '#0F2C59' }}
            >
              प्रिन्ट (Print / PDF)
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
                ग्लोबल एरा प्राविधिक स्कुल (GLOBAL ERA TECHNICAL SCHOOL)
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1E3E62' }}>
                KITE CAREGIVER TRAINING CENTER • Chabahil, MitraPark, Kathmandu
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.5 }}>
                फोन: +९७७-१-४४८१२३४ | इमेल: info@globalera.edu.np | दर्ता नं: १८४९२०/०७८/०७९
              </Typography>
            </Box>

            {/* 2. Document Title Banner */}
            <Box sx={{ my: 2, textAlign: 'center', bgcolor: '#F1F5F9', py: 1, border: '1.5px solid #0F2C59', borderRadius: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0F2C59' }}>
                सत्र कार्ययोजना तालिका (TRAINING DELIVERY WORK PLAN)
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
                  पाठ्यक्रम (Course / Curriculum):
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 900 }}>
                  {selectedCourse?.title} ({courseTargetHours} Hours • {selectedCourse?.level || 'CTEVT Level 1'})
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, display: 'block' }}>
                  समूह (Training Batch) &amp; सिफ्ट:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 900 }}>
                  Batch: <b>{selectedGroup?.groupCode}</b> | Shift {selectedGroup?.shift} ({selectedGroup?.startTime} - {selectedGroup?.endTime})
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, display: 'block' }}>
                  प्रमुख प्रशिक्षक (Primary Instructor):
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 900, color: '#1D4ED8' }}>
                  {trainer?.name || '—'} {trainer?.phone ? `(सम्पर्क: ${trainer.phone})` : ''}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, display: 'block' }}>
                  कुल योजना गरिएको समय / प्रगति:
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
                    <TableCell sx={{ color: '#FFFFFF', fontWeight: 900, width: 45, textAlign: 'center' }}>क्र.सं.</TableCell>
                    <TableCell sx={{ color: '#FFFFFF', fontWeight: 900, width: 105 }}>मिति र बार</TableCell>
                    <TableCell sx={{ color: '#FFFFFF', fontWeight: 900, width: 140 }}>पाठ्यक्रम एकाइ</TableCell>
                    <TableCell sx={{ color: '#FFFFFF', fontWeight: 900 }}>सैद्धान्तिक विषयवस्तु (Theory)</TableCell>
                    <TableCell sx={{ color: '#FFFFFF', fontWeight: 900 }}>प्रयोगात्मक अभ्यास (Practical)</TableCell>
                    <TableCell sx={{ color: '#FFFFFF', fontWeight: 900, textAlign: 'center', width: 50 }}>घण्टा</TableCell>
                    <TableCell sx={{ color: '#FFFFFF', fontWeight: 900, textAlign: 'center', width: 75 }}>कैफियत</TableCell>
                    <TableCell sx={{ color: '#FFFFFF', fontWeight: 900, textAlign: 'center', width: 65 }}>दस्तखत</TableCell>
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
                      कुल योजना गरिएको समय (TOTAL PLANNED HOURS):
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
                आधिकारिक कार्ययोजना नियम तथा मापदण्ड:
              </Typography>
              <Typography variant="caption" sx={{ color: '#475569', display: 'block', mt: 0.3 }}>
                १. प्रत्येक तालिम सत्र पश्चात प्रशिक्षकले दैनिक लगबुक (Log Book) र हाजिरी पुस्तिका अद्यावधिक गर्नुपर्नेछ।<br />
                २. अप्रत्याशित सार्वजनिक बिदा परेको खण्डमा क्याम्पस प्रशासनको स्वीकृति लिई अतिरिक्त समयमा सत्र पूर्ति (Compensation Class) गर्नुपर्नेछ।
              </Typography>
            </Box>

            {/* 6. Official 3-Tier CTEVT Inspection Signatures */}
            <Grid container spacing={3} sx={{ pt: 3 }}>
              <Grid item xs={4} sx={{ textAlign: 'center' }}>
                <Box sx={{ borderTop: '1.5px dashed #0F2C59', pt: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 900, display: 'block', color: '#0F2C59' }}>
                    प्रशिक्षकको दस्तखत (Trainer)
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                    {trainer?.name || 'Lead Trainer'}<br />Date: {new Date().toISOString().slice(0, 10)}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={4} sx={{ textAlign: 'center' }}>
                <Box sx={{ borderTop: '1.5px dashed #0F2C59', pt: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 900, display: 'block', color: '#0F2C59' }}>
                    पाठ्यक्रम संयोजक (Curriculum Coordinator)
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                    Approved by CTEVT Lead<br />Signature &amp; Date
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={4} sx={{ textAlign: 'center' }}>
                <Box sx={{ borderTop: '1.5px dashed #0F2C59', pt: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 900, display: 'block', color: '#0F2C59' }}>
                    क्याम्पस प्रमुख / प्रिन्सिपल (Principal)
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
            बन्द गर्नुहोस् (Close)
          </Button>
          <Button variant="contained" startIcon={<PrintIcon />} onClick={() => window.print()} sx={{ fontWeight: 800, bgcolor: '#0F2C59' }}>
            प्रिन्ट गर्नुहोस् (Print A4)
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
