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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Stack,
  Grid,
  Avatar,
  Paper,
  Alert,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  TableSortLabel,
  LinearProgress,
  Tooltip,
  Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import PeopleIcon from '@mui/icons-material/People';
import SearchIcon from '@mui/icons-material/Search';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewListIcon from '@mui/icons-material/ViewList';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import SchoolIcon from '@mui/icons-material/School';
import ShieldIcon from '@mui/icons-material/Shield';
import PhoneIcon from '@mui/icons-material/Phone';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CloseIcon from '@mui/icons-material/Close';
import confetti from 'canvas-confetti';
import { loadDB, saveDB, SHIFT_DEFINITIONS, calculateExpectedEndDate, logAudit } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';

export default function TrainingGroupManager({ onNavigateToAttendance, onNavigateToStudents }) {
  const [db, setDb] = useState(loadDB());
  const { currentUser, isTrainer } = useAuth();

  // View, Search, Filter & Sort States
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShift, setSelectedShift] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('groupCode'); // 'groupCode' | 'startDate' | 'students' | 'shift'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'

  // Dialog States
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [rosterGroup, setRosterGroup] = useState(null);
  const [rosterSearch, setRosterSearch] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    groupCode: '',
    courseId: '',
    trainerId: '',
    shift: 'A',
    startTime: '07:00 AM',
    endTime: '09:00 AM',
    startDate: new Date().toISOString().slice(0, 10),
    expectedEndDate: '',
    capacity: 20,
    status: 'Running'
  });

  // Real-time live active shift calculation
  const currentHour = new Date().getHours();
  let liveShiftCode = 'B';
  if (currentHour < 10) liveShiftCode = 'A';
  else if (currentHour >= 12 && currentHour < 14) liveShiftCode = 'C';
  else if (currentHour >= 14 && currentHour < 16) liveShiftCode = 'D';
  else if (currentHour >= 16) liveShiftCode = 'E';

  // Available groups filtered by role
  const baseGroups = useMemo(() => {
    return isTrainer
      ? (db.trainingGroups || []).filter((g) => g.trainerId === currentUser?.trainerId)
      : db.trainingGroups || [];
  }, [db.trainingGroups, isTrainer, currentUser]);

  // Overall Statistics
  const totalGroupsCount = baseGroups.length;
  const runningGroupsCount = baseGroups.filter((g) => g.status === 'Running').length;
  const ojtGroupsCount = baseGroups.filter((g) => g.status === 'OJT Phase').length;
  const totalStudentsEnrolled = (db.students || []).filter((s) => baseGroups.some((g) => g.id === s.groupId)).length;

  // Form Cascading Helpers
  const selectedCourseInForm = (db.courses || []).find((c) => c.id === formData.courseId);
  const selectedOccupationInForm = (db.occupations || []).find((o) => o.id === selectedCourseInForm?.occupationId);
  const matchingTrainersInForm = (db.trainers || []).filter(
    (t) => !selectedCourseInForm || t.occupationId === selectedCourseInForm.occupationId
  );

  // Filtered and Sorted Training Groups
  const filteredAndSortedGroups = useMemo(() => {
    let list = baseGroups.filter((grp) => {
      const course = (db.courses || []).find((c) => c.id === grp.courseId);
      const trainer = (db.trainers || []).find((t) => t.id === grp.trainerId);
      const q = searchQuery.toLowerCase().trim();

      const matchesSearch =
        !q ||
        grp.groupCode.toLowerCase().includes(q) ||
        (course?.title || '').toLowerCase().includes(q) ||
        (trainer?.name || '').toLowerCase().includes(q) ||
        `shift ${grp.shift}`.toLowerCase().includes(q);

      const matchesShift = selectedShift === 'ALL' || grp.shift === selectedShift;
      const matchesStatus = selectedStatus === 'ALL' || grp.status === selectedStatus;
      const matchesCourse = selectedCourseFilter === 'ALL' || grp.courseId === selectedCourseFilter;

      return matchesSearch && matchesShift && matchesStatus && matchesCourse;
    });

    list.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (sortBy === 'students') {
        valA = (db.students || []).filter((s) => s.groupId === a.id).length;
        valB = (db.students || []).filter((s) => s.groupId === b.id).length;
      } else if (sortBy === 'startDate') {
        valA = new Date(valA || '').getTime();
        valB = new Date(valB || '').getTime();
      } else {
        valA = (valA || '').toString().toLowerCase();
        valB = (valB || '').toString().toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [baseGroups, searchQuery, selectedShift, selectedStatus, selectedCourseFilter, sortBy, sortOrder, db.courses, db.trainers, db.students]);

  const handleRequestSort = (property) => {
    const isAsc = sortBy === property && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortBy(property);
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      groupCode: '',
      courseId: '',
      trainerId: '',
      shift: '',
      startTime: '',
      endTime: '',
      startDate: '',
      expectedEndDate: '',
      capacity: '',
      status: 'Running'
    });
    setOpenDialog(true);
  };

  const handleOpenEdit = (grp) => {
    setEditingItem(grp);
    setFormData({
      groupCode: grp.groupCode || '',
      courseId: grp.courseId || '',
      trainerId: grp.trainerId || '',
      shift: grp.shift || '',
      startTime: grp.startTime || '',
      endTime: grp.endTime || '',
      startDate: grp.startDate || '',
      expectedEndDate: grp.expectedEndDate || '',
      capacity: grp.capacity || '',
      status: grp.status || 'Running'
    });
    setOpenDialog(true);
  };

  const handleCourseChange = (courseId) => {
    const course = (db.courses || []).find((c) => c.id === courseId);
    const calcEnd = course && formData.startDate
      ? calculateExpectedEndDate(formData.startDate, course.durationValue, course.durationUnit)
      : '';

    setFormData((prev) => ({
      ...prev,
      courseId,
      trainerId: prev.trainerId || '',
      expectedEndDate: calcEnd
    }));
  };

  const handleShiftChange = (shiftCode) => {
    const shiftDef = SHIFT_DEFINITIONS.find((s) => s.code === shiftCode);
    if (shiftDef) {
      const parts = shiftDef.time.split('–');
      setFormData((prev) => ({
        ...prev,
        shift: shiftCode,
        startTime: parts[0]?.trim() || '',
        endTime: parts[1]?.trim() || ''
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        shift: '',
        startTime: '',
        endTime: ''
      }));
    }
  };

  const handleStartDateChange = (startDate) => {
    const course = (db.courses || []).find((c) => c.id === formData.courseId);
    const calcEnd = course
      ? calculateExpectedEndDate(startDate, course.durationValue, course.durationUnit)
      : '';
    setFormData((prev) => ({ ...prev, startDate, expectedEndDate: calcEnd }));
  };

  const handleSave = () => {
    if (!formData.groupCode.trim() || !formData.courseId || !formData.trainerId) {
      alert('समूह कोड, पाठ्यक्रम र प्रशिक्षक अनिवार्य छन्।');
      return;
    }

    let updatedList = [...(db.trainingGroups || [])];
    if (editingItem) {
      updatedList = updatedList.map((x) =>
        x.id === editingItem.id ? { ...x, ...formData } : x
      );
    } else {
      const newId = `GRP-${String(updatedList.length + 1).padStart(2, '0')}`;
      updatedList.push({ id: newId, ...formData });
    }

    let nextDb = { ...db, trainingGroups: updatedList };
    nextDb = logAudit(
      nextDb,
      editingItem ? 'UPDATE' : 'CREATE',
      'TrainingGroup',
      editingItem?.id || 'NEW',
      `Training Group ${formData.groupCode} (${formData.shift}) ${editingItem ? 'updated' : 'created'}`,
      currentUser?.name || 'Admin'
    );

    saveDB(nextDb);
    setDb(nextDb);
    setOpenDialog(false);

    try {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
    } catch (_) {}
  };

  const handleDelete = (id) => {
    const studentsInGroup = (db.students || []).filter((s) => s.groupId === id);
    if (studentsInGroup.length > 0) {
      alert(`यस समूहमा ${studentsInGroup.length} जना विद्यार्थी भर्ना भएका छन्। पहिले विद्यार्थीहरूलाई अर्को समूहमा स्थानान्तरण गर्नुहोस्।`);
      return;
    }

    if (window.confirm('के तपाईं निश्चित हुनुहुन्छ? यो तालिम समूह मेटिनेछ।')) {
      let nextDb = {
        ...db,
        trainingGroups: (db.trainingGroups || []).filter((x) => x.id !== id)
      };
      nextDb = logAudit(
        nextDb,
        'DELETE',
        'TrainingGroup',
        id,
        `Training group ${id} deleted`,
        currentUser?.name || 'Admin'
      );
      saveDB(nextDb);
      setDb(nextDb);
    }
  };

  return (
    <Box sx={{ width: '100%', pb: 4 }}>
      {/* =======================================================
          1. EXECUTIVE HERO OPERATIONAL BANNER
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
          {/* Left Title & Actions */}
          <Grid item xs={12} lg={7}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1.5, flexWrap: 'wrap' }}>
              <Chip
                icon={<ShieldIcon sx={{ fontSize: '14px !important', color: '#FDE047 !important' }} />}
                label="CTEVT Institutional Operations Hub"
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
                icon={<CheckCircleIcon sx={{ fontSize: '14px !important', color: '#4ADE80 !important' }} />}
                label={`${runningGroupsCount} Groups Currently Running`}
                size="small"
                sx={{
                  bgcolor: 'rgba(74, 222, 128, 0.15)',
                  color: '#86EFAC',
                  fontWeight: 800,
                  fontSize: '0.72rem',
                  border: '1px solid rgba(74, 222, 128, 0.25)'
                }}
              />
              <Chip
                label={`Shift ${liveShiftCode} Live Now`}
                size="small"
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.15)',
                  color: '#FFFFFF',
                  fontWeight: 900,
                  fontSize: '0.72rem'
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
              Training Groups / Batches (तालिम समूह सञ्चालन केन्द्र)
            </Typography>

            <Typography variant="body2" sx={{ color: '#CBD5E1', maxWidth: 620, mb: 2.5, lineHeight: 1.6 }}>
              संस्थाको सम्पूर्ण भौतिक तथा अनलाइन तालिम कक्षाहरूको प्रत्यक्ष सञ्चालन केन्द्र।
              पाठ्यक्रम, तोकिएका मुख्य प्रशिक्षक, सिफ्ट समय र भर्ना भएका विद्यार्थीहरूको एकीकृत व्यवस्थापन।
            </Typography>

            <Stack direction="row" spacing={1.2} flexWrap="wrap" useFlexGap>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenAdd}
                sx={{
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%) !important',
                  color: '#FFFFFF !important',
                  fontWeight: 900,
                  fontSize: '0.88rem',
                  py: 1,
                  px: 2.2,
                  borderRadius: 2.5,
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%) !important'
                  }
                }}
              >
                + Create Training Group (नयाँ समूह)
              </Button>

              <Button
                variant="outlined"
                startIcon={<FactCheckIcon />}
                onClick={() => onNavigateToAttendance(baseGroups[0]?.id)}
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.4) !important',
                  color: '#FFFFFF !important',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  py: 1,
                  px: 2,
                  borderRadius: 2.5,
                  bgcolor: 'rgba(255, 255, 255, 0.08)',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.18)' }
                }}
              >
                दैनिक हाजिरी लिनुहोस्
              </Button>
            </Stack>
          </Grid>

          {/* Right Live Operational Stats */}
          <Grid item xs={12} lg={5}>
            <Grid container spacing={1.5}>
              <Grid item xs={6}>
                <Box
                  sx={{
                    bgcolor: 'rgba(15, 30, 60, 0.75)',
                    backdropFilter: 'blur(16px)',
                    p: 2,
                    borderRadius: 3,
                    border: '1px solid rgba(255, 255, 255, 0.15)'
                  }}
                >
                  <Typography variant="caption" sx={{ color: '#93C5FD', fontWeight: 800 }}>
                    कुल समूहहरू (BATCHES)
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 900, color: '#FFFFFF', my: 0.5 }}>
                    {totalGroupsCount}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#86EFAC' }}>
                    {runningGroupsCount} सक्रिय कक्षा सञ्चालन
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={6}>
                <Box
                  sx={{
                    bgcolor: 'rgba(15, 30, 60, 0.75)',
                    backdropFilter: 'blur(16px)',
                    p: 2,
                    borderRadius: 3,
                    border: '1px solid rgba(255, 255, 255, 0.15)'
                  }}
                >
                  <Typography variant="caption" sx={{ color: '#93C5FD', fontWeight: 800 }}>
                    अध्ययनरत विद्यार्थी
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 900, color: '#FFFFFF', my: 0.5 }}>
                    {totalStudentsEnrolled}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#CBD5E1' }}>
                    {ojtGroupsCount} समूह OJT इन्टर्नसिपमा
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Box
                  sx={{
                    bgcolor: 'rgba(16, 185, 129, 0.15)',
                    backdropFilter: 'blur(16px)',
                    p: 1.8,
                    borderRadius: 3,
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <Box>
                    <Typography variant="caption" sx={{ color: '#86EFAC', fontWeight: 900, display: 'block' }}>
                      सक्रिय सिफ्ट (ACTIVE LIVE SHIFT)
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#FFFFFF' }}>
                      Shift {liveShiftCode} • MitraPark Central Hub
                    </Typography>
                  </Box>
                  <Chip
                    label="Active & Synchronized"
                    size="small"
                    sx={{ bgcolor: '#10B981', color: '#FFFFFF', fontWeight: 900, height: 22 }}
                  />
                </Box>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Card>

      {/* =======================================================
          2. SEARCH, MULTI-FILTER, SORT & VIEW SWITCHER
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
          {/* Instant Search Bar */}
          <Grid item xs={12} sm={6} md={3.5}>
            <TextField
              size="small"
              fullWidth
              placeholder="समूह कोड, कोर्स वा प्रशिक्षक खोज्नुहोस्..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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

          {/* Filter by Shift */}
          <Grid item xs={6} sm={6} md={2}>
            <TextField
              select
              size="small"
              label="सिफ्ट (Shift)"
              fullWidth
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
            >
              <MenuItem value="ALL">सबै सिफ्ट (All)</MenuItem>
              {SHIFT_DEFINITIONS.map((sh) => (
                <MenuItem key={sh.code} value={sh.code}>
                  Shift {sh.code} ({sh.time})
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Filter by Status */}
          <Grid item xs={6} sm={4} md={2}>
            <TextField
              select
              size="small"
              label="स्थिति (Status)"
              fullWidth
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
            >
              <MenuItem value="ALL">सबै स्थिति (All)</MenuItem>
              <MenuItem value="Running">Running (सञ्चालनमा)</MenuItem>
              <MenuItem value="OJT Phase">OJT Phase (इन्टर्नसिप)</MenuItem>
              <MenuItem value="Upcoming">Upcoming (हुन बाँकी)</MenuItem>
              <MenuItem value="Completed">Completed (सम्पन्न)</MenuItem>
            </TextField>
          </Grid>

          {/* Sort By */}
          <Grid item xs={6} sm={4} md={2.5}>
            <TextField
              select
              size="small"
              label="क्रम (Sort By)"
              fullWidth
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-');
                setSortBy(sb);
                setSortOrder(so);
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
            >
              <MenuItem value="groupCode-asc">Group Code (कम-बढी)</MenuItem>
              <MenuItem value="startDate-asc">सुरु मिति (पहिले-पछि)</MenuItem>
              <MenuItem value="students-desc">विद्यार्थी संख्या (धेरै-थोरै)</MenuItem>
              <MenuItem value="shift-asc">सिफ्ट (A देखि E)</MenuItem>
            </TextField>
          </Grid>

          {/* View Mode Switcher */}
          <Grid item xs={6} sm={4} md={2} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, next) => next && setViewMode(next)}
              size="small"
            >
              <ToggleButton value="cards" sx={{ fontWeight: 800, px: 1.5 }}>
                <ViewModuleIcon fontSize="small" sx={{ mr: 0.5 }} /> Cards
              </ToggleButton>
              <ToggleButton value="table" sx={{ fontWeight: 800, px: 1.5 }}>
                <ViewListIcon fontSize="small" sx={{ mr: 0.5 }} /> Table
              </ToggleButton>
            </ToggleButtonGroup>
          </Grid>
        </Grid>
      </Card>

      {/* =======================================================
          VIEW 1: RICH VISUAL CARDS VIEW
          ======================================================= */}
      {viewMode === 'cards' && (
        <Grid container spacing={2.5}>
          {filteredAndSortedGroups.map((grp) => {
            const course = (db.courses || []).find((c) => c.id === grp.courseId);
            const occ = (db.occupations || []).find((o) => o.id === course?.occupationId);
            const trainer = (db.trainers || []).find((t) => t.id === grp.trainerId);
            const studentsInGroup = (db.students || []).filter((s) => s.groupId === grp.id);
            const isLive = grp.shift === liveShiftCode && grp.status === 'Running';

            return (
              <Grid item xs={12} sm={6} md={4} key={grp.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 3.5,
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
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
                      background: isLive
                        ? 'linear-gradient(90deg, #10B981, #059669)'
                        : grp.status === 'Running'
                        ? 'linear-gradient(90deg, #3B82F6, #1D4ED8)'
                        : '#94A3B8'
                    }}
                  />

                  {/* Header: Code, Live beacon & Status */}
                  <Box sx={{ p: 2, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={grp.groupCode}
                        size="small"
                        sx={{
                          bgcolor: '#0F2C59',
                          color: '#FFFFFF',
                          fontWeight: 900,
                          fontSize: '0.75rem',
                          height: 24
                        }}
                      />
                      {isLive && (
                        <Chip
                          label="LIVE NOW"
                          size="small"
                          sx={{
                            bgcolor: '#ECFDF5',
                            color: '#059669',
                            border: '1px solid #A7F3D0',
                            fontWeight: 900,
                            fontSize: '0.65rem',
                            height: 20
                          }}
                        />
                      )}
                    </Box>

                    <Chip
                      label={grp.status}
                      size="small"
                      sx={{
                        bgcolor: grp.status === 'Running' ? '#ECFDF5' : grp.status === 'OJT Phase' ? '#EFF6FF' : '#F1F5F9',
                        color: grp.status === 'Running' ? '#059669' : grp.status === 'OJT Phase' ? '#1D4ED8' : '#475569',
                        fontWeight: 900,
                        fontSize: '0.72rem',
                        height: 22
                      }}
                    />
                  </Box>

                  {/* Course Title & Occupation */}
                  <Box sx={{ px: 2, pb: 1 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 900,
                        color: '#0F172A',
                        lineHeight: 1.25,
                        fontSize: '1.05rem',
                        mb: 0.3
                      }}
                    >
                      {course?.title || 'Vocational Course'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>
                      {occ?.name || 'Technical'} • {course?.level || 'CTEVT Level 1'}
                    </Typography>
                  </Box>

                  {/* Trainer Row */}
                  <Box sx={{ px: 2, pb: 1.5, display: 'flex', alignItems: 'center', gap: 1.2 }}>
                    <Avatar
                      src={trainer?.photo}
                      sx={{
                        width: 34,
                        height: 34,
                        bgcolor: '#0F2C59',
                        color: '#FFFFFF',
                        fontWeight: 800,
                        fontSize: '0.82rem'
                      }}
                    >
                      {trainer?.name?.[0] || 'T'}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>
                        {trainer?.name || 'Unassigned Trainer'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        ToT Certified • {trainer?.phone || 'No Contact'}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Shift, Timing & Dates Metric Box */}
                  <Box sx={{ px: 2, py: 1.5, mx: 2, bgcolor: '#F8FAFC', borderRadius: 2.5, border: '1px solid #EDF2F7', mb: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <AccessTimeIcon sx={{ fontSize: 16, color: '#1D4ED8' }} />
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#1E40AF' }}>
                          Shift {grp.shift}: <b>{grp.startTime} – {grp.endTime}</b>
                        </Typography>
                      </Box>
                      <Chip
                        label={`${studentsInGroup.length} Trainees`}
                        size="small"
                        sx={{ bgcolor: '#EFF6FF', color: '#1D4ED8', fontWeight: 900, height: 20, fontSize: '0.68rem' }}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      <CalendarMonthIcon sx={{ fontSize: 16, color: '#059669' }} />
                      <Typography variant="caption" sx={{ color: '#334155', fontWeight: 700 }}>
                        {grp.startDate} → <b style={{ color: '#059669' }}>{grp.expectedEndDate}</b>
                      </Typography>
                    </Box>
                  </Box>

                  {/* Footer Action Buttons */}
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
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<FactCheckIcon />}
                      onClick={() => onNavigateToAttendance(grp.id)}
                      sx={{
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        textTransform: 'none',
                        bgcolor: '#0F2C59',
                        borderRadius: 2
                      }}
                    >
                      हाजिरी लिनुहोस्
                    </Button>

                    <Button
                      size="small"
                      startIcon={<PeopleIcon />}
                      onClick={() => setRosterGroup(grp)}
                      sx={{
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        textTransform: 'none',
                        color: '#1D4ED8'
                      }}
                    >
                      रोस्टर ({studentsInGroup.length})
                    </Button>

                    <Box sx={{ display: 'flex', gap: 0.3 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenEdit(grp)}
                        sx={{ color: '#1D4ED8', p: 0.5 }}
                        title="Edit Group"
                      >
                        <EditIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(grp.id)}
                        sx={{ color: '#EF4444', p: 0.5 }}
                        title="Delete Group"
                      >
                        <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Box>
                  </Box>
                </Card>
              </Grid>
            );
          })}

          {filteredAndSortedGroups.length === 0 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4, border: '1px dashed #CBD5E1', bgcolor: '#FFFFFF' }}>
                <GroupWorkIcon sx={{ fontSize: 52, color: '#94A3B8', mb: 1.5 }} />
                <Typography variant="h6" sx={{ fontWeight: 900, color: '#1E293B', mb: 0.5 }}>
                  कुनै तालिम समूह फेला परेन
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748B', mb: 2 }}>
                  तपाईंको खोजी वा फिल्टर अनुसार कुनै समूह सूचीकृत छैन।
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd}>
                  + Create Training Group
                </Button>
              </Paper>
            </Grid>
          )}
        </Grid>
      )}

      {/* =======================================================
          VIEW 2: SORTABLE PRODUCTION TABLE VIEW
          ======================================================= */}
      {viewMode === 'table' && (
        <Card sx={{ borderRadius: 3.5, overflow: 'hidden', border: '1px solid #E2E8F0', boxShadow: '0 4px 18px rgba(0,0,0,0.04)' }}>
          <TableContainer>
            <Table>
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
                    क्र.सं. (S.N.)
                  </TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, width: 110 }}>
                    <TableSortLabel
                      active={sortBy === 'groupCode'}
                      direction={sortBy === 'groupCode' ? sortOrder : 'asc'}
                      onClick={() => handleRequestSort('groupCode')}
                      sx={{
                        color: '#FFFFFF !important',
                        '&.Mui-active': { color: '#F59E0B !important' },
                        '& .MuiTableSortLabel-icon': { color: '#F59E0B !important' }
                      }}
                    >
                      Group Code
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>पाठ्यक्रम र पेशा (Course & Occupation)</TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>प्रशिक्षक (Instructor)</TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>
                    <TableSortLabel
                      active={sortBy === 'shift'}
                      direction={sortBy === 'shift' ? sortOrder : 'asc'}
                      onClick={() => handleRequestSort('shift')}
                      sx={{
                        color: '#FFFFFF !important',
                        '&.Mui-active': { color: '#F59E0B !important' },
                        '& .MuiTableSortLabel-icon': { color: '#F59E0B !important' }
                      }}
                    >
                      सिफ्ट र समय (Shift)
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>
                    <TableSortLabel
                      active={sortBy === 'startDate'}
                      direction={sortBy === 'startDate' ? sortOrder : 'asc'}
                      onClick={() => handleRequestSort('startDate')}
                      sx={{
                        color: '#FFFFFF !important',
                        '&.Mui-active': { color: '#F59E0B !important' },
                        '& .MuiTableSortLabel-icon': { color: '#F59E0B !important' }
                      }}
                    >
                      मिति (Start → End)
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, textAlign: 'center' }}>
                    <TableSortLabel
                      active={sortBy === 'students'}
                      direction={sortBy === 'students' ? sortOrder : 'asc'}
                      onClick={() => handleRequestSort('students')}
                      sx={{
                        color: '#FFFFFF !important',
                        '&.Mui-active': { color: '#F59E0B !important' },
                        '& .MuiTableSortLabel-icon': { color: '#F59E0B !important' }
                      }}
                    >
                      विद्यार्थी (Students)
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, textAlign: 'center' }}>स्थिति</TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, textAlign: 'right' }}>कार्य (Actions)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAndSortedGroups.map((grp, idx) => {
                  const course = (db.courses || []).find((c) => c.id === grp.courseId);
                  const occ = (db.occupations || []).find((o) => o.id === course?.occupationId);
                  const trainer = (db.trainers || []).find((t) => t.id === grp.trainerId);
                  const studentsInGroup = (db.students || []).filter((s) => s.groupId === grp.id);
                  const isLive = grp.shift === liveShiftCode && grp.status === 'Running';

                  return (
                    <TableRow key={grp.id} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#F8FAFC' } }}>
                      {/* S.N. Column */}
                      <TableCell sx={{ fontWeight: 800, color: '#475569', textAlign: 'center' }}>
                        {idx + 1}
                      </TableCell>

                      {/* Group Code */}
                      <TableCell sx={{ fontWeight: 900 }}>
                        <Chip
                          label={grp.groupCode}
                          size="small"
                          sx={{ bgcolor: '#0F2E5A', color: '#FFFFFF', fontWeight: 900 }}
                        />
                      </TableCell>

                      {/* Course & Occupation */}
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0F172A', lineHeight: 1.2 }}>
                          {course?.title || 'Vocational Course'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B' }}>
                          {occ?.name || 'Technical'} • {course?.level || ''}
                        </Typography>
                      </TableCell>

                      {/* Trainer */}
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar
                            src={trainer?.photo}
                            sx={{ width: 28, height: 28, bgcolor: '#0F2E5A', fontSize: 12, fontWeight: 800 }}
                          >
                            {trainer?.name?.[0] || 'T'}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: '#1E293B' }}>
                            {trainer?.name || 'Unassigned'}
                          </Typography>
                        </Box>
                      </TableCell>

                      {/* Shift & Time */}
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                            Shift {grp.shift}
                          </Typography>
                          {isLive && (
                            <Chip
                              label="Live"
                              size="small"
                              sx={{ height: 18, fontSize: '0.62rem', bgcolor: '#ECFDF5', color: '#059669', fontWeight: 900 }}
                            />
                          )}
                        </Box>
                        <Typography variant="caption" sx={{ color: '#64748B' }}>
                          {grp.startTime} – {grp.endTime}
                        </Typography>
                      </TableCell>

                      {/* Dates */}
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B' }}>
                          {grp.startDate}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#059669', fontWeight: 800, display: 'block' }}>
                          → {grp.expectedEndDate}
                        </Typography>
                      </TableCell>

                      {/* Students count */}
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<PeopleIcon />}
                          onClick={() => setRosterGroup(grp)}
                          sx={{ borderRadius: 2, fontWeight: 800, py: 0.3, px: 1.2, fontSize: '0.74rem' }}
                        >
                          {studentsInGroup.length} Trainees
                        </Button>
                      </TableCell>

                      {/* Status */}
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Chip
                          label={grp.status}
                          size="small"
                          sx={{
                            bgcolor: grp.status === 'Running' ? '#ECFDF5' : '#EFF6FF',
                            color: grp.status === 'Running' ? '#059669' : '#1D4ED8',
                            fontWeight: 900,
                            fontSize: '0.72rem'
                          }}
                        />
                      </TableCell>

                      {/* Action Buttons */}
                      <TableCell sx={{ textAlign: 'right' }}>
                        <Box sx={{ display: 'flex', gap: 0.8, justifyContent: 'flex-end', alignItems: 'center' }}>
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<FactCheckIcon />}
                            onClick={() => onNavigateToAttendance(grp.id)}
                            sx={{
                              fontWeight: 800,
                              py: 0.4,
                              px: 1.4,
                              fontSize: '0.75rem',
                              bgcolor: '#0F2E5A',
                              borderRadius: 1.8,
                              '&:hover': { bgcolor: '#174276' }
                            }}
                          >
                            हाजिरी
                          </Button>
                          <Tooltip title="सम्पादन गर्नुहोस् (Edit)">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenEdit(grp)}
                              sx={{ color: '#0F2E5A', bgcolor: '#F1F5F9', borderRadius: 1.8 }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="मेटाउनुहोस् (Delete)">
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(grp.id)}
                              sx={{ color: '#EF4444', bgcolor: '#FEF2F2', borderRadius: 1.8 }}
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {filteredAndSortedGroups.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} sx={{ textAlign: 'center', py: 5, color: '#94A3B8' }}>
                      कुनै समूह फेला परेन।
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* =======================================================
          MODAL 1: CREATE / EDIT TRAINING GROUP
          ======================================================= */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
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
              <GroupWorkIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, fontSize: '1.05rem', lineHeight: 1.2 }}>
                {editingItem ? 'तालिम समूह सम्पादन (Edit Training Group)' : 'नयाँ तालिम समूह सिर्जना (Create New Batch)'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.72rem' }}>
                {editingItem ? 'समूह विवरण र तालिका अद्यावधिक गर्नुहोस्' : 'कृपया नयाँ तालिम समूहको सम्पूर्ण विवरण प्रविष्ट गर्नुहोस्'}
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
          <Stack spacing={2.5}>
            <TextField
              label="समूह कोड (Group Code) *"
              fullWidth
              size="small"
              placeholder="उदा: GRP-01, BT-02, CG-03"
              value={formData.groupCode}
              onChange={(e) => setFormData({ ...formData, groupCode: e.target.value })}
              required
            />

            {/* Course Selector */}
            <TextField
              select
              label="पाठ्यक्रम चयन (Select Course) *"
              fullWidth
              size="small"
              value={formData.courseId}
              onChange={(e) => handleCourseChange(e.target.value)}
              required
            >
              <MenuItem value="" sx={{ color: '#94A3B8', fontStyle: 'italic' }}>
                -- पाठ्यक्रम चयन गर्नुहोस् (Select Course) --
              </MenuItem>
              {(db.courses || []).map((crs) => (
                <MenuItem key={crs.id} value={crs.id}>
                  <b>{crs.title}</b> ({crs.durationValue} {crs.durationUnit} • {crs.totalHours || 390} hrs)
                </MenuItem>
              ))}
            </TextField>

            {/* Auto Cascade Context Info Box */}
            {selectedCourseInForm && (
              <Alert severity="info" sx={{ borderRadius: 2.5, bgcolor: '#EFF6FF', border: '1px solid #DBEAFE' }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#1E3A8A', display: 'block' }}>
                  स्वचालित रूपमा जोडिएको विवरण (AUTO-CASCADED CONTEXT):
                </Typography>
                <Typography variant="caption" sx={{ color: '#1E40AF' }}>
                  पेशा: <b>{selectedOccupationInForm?.name || 'N/A'}</b> • अवधि: <b>{selectedCourseInForm.durationValue} {selectedCourseInForm.durationUnit} ({selectedCourseInForm.totalHours || 390} hrs)</b>
                </Typography>
              </Alert>
            )}

            {/* Assigned Trainer */}
            <TextField
              select
              label="तोकिएको मुख्य प्रशिक्षक (Assigned Trainer) *"
              fullWidth
              size="small"
              value={formData.trainerId}
              onChange={(e) => setFormData({ ...formData, trainerId: e.target.value })}
              required
            >
              <MenuItem value="" sx={{ color: '#94A3B8', fontStyle: 'italic' }}>
                -- मुख्य प्रशिक्षक चयन गर्नुहोस् (Select Trainer) --
              </MenuItem>
              {matchingTrainersInForm.map((trn) => (
                <MenuItem key={trn.id} value={trn.id}>
                  <b>{trn.name}</b> ({trn.specialization || 'Trainer'})
                </MenuItem>
              ))}
            </TextField>

            {/* Shift Selection -> Auto fills Start and End Time */}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  label="सिफ्ट (Shift)"
                  fullWidth
                  size="small"
                  value={formData.shift}
                  onChange={(e) => handleShiftChange(e.target.value)}
                >
                  <MenuItem value="" sx={{ color: '#94A3B8', fontStyle: 'italic' }}>
                    -- सिफ्ट छान्नुहोस् --
                  </MenuItem>
                  {SHIFT_DEFINITIONS.map((sh) => (
                    <MenuItem key={sh.code} value={sh.code}>
                      Shift {sh.code} ({sh.time})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6} sm={4}>
                <TextField
                  label="सुरु समय (Start Time)"
                  fullWidth
                  size="small"
                  placeholder="07:00 AM"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </Grid>
              <Grid item xs={6} sm={4}>
                <TextField
                  label="अन्त्य समय (End Time)"
                  fullWidth
                  size="small"
                  placeholder="09:00 AM"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </Grid>
            </Grid>

            {/* Dates: Start & Auto End */}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  type="date"
                  label="सुरु मिति (Start Date) *"
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={formData.startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  type="date"
                  label="अनुमानित सम्पन्न मिति (Auto End Date)"
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={formData.expectedEndDate}
                  onChange={(e) => setFormData({ ...formData, expectedEndDate: e.target.value })}
                  helperText={formData.expectedEndDate ? "कोर्स अवधि अनुसार स्वतः हिसाब भएको" : "सुरु मिति र कोर्स छानेपछि स्वतः हिसाब हुनेछ"}
                />
              </Grid>
            </Grid>

            {/* Capacity & Status */}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  type="number"
                  label="क्षमता (Trainee Capacity)"
                  fullWidth
                  size="small"
                  placeholder="उदा: 20"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value === '' ? '' : Number(e.target.value) })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="समूह स्थिति (Status)"
                  fullWidth
                  size="small"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <MenuItem value="Running">Running (सञ्चालनमा)</MenuItem>
                  <MenuItem value="OJT Phase">OJT Phase (इन्टर्नसिप)</MenuItem>
                  <MenuItem value="Upcoming">Upcoming (हुन बाँकी)</MenuItem>
                  <MenuItem value="Completed">Completed (सम्पन्न)</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </Stack>
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
            सुरक्षित गर्नुहोस् (Save Group)
          </Button>
        </DialogActions>
      </Dialog>

      {/* =======================================================
          MODAL 2: STUDENT ROSTER PREVIEW MODAL
          ======================================================= */}
      <Dialog
        open={Boolean(rosterGroup)}
        onClose={() => setRosterGroup(null)}
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
              <PeopleIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, fontSize: '1.05rem', lineHeight: 1.2 }}>
                Group Roster: {rosterGroup?.groupCode}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.72rem' }}>
                Shift {rosterGroup?.shift} ({rosterGroup?.startTime} – {rosterGroup?.endTime}) • Global Era TVET System
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              size="small"
              variant="contained"
              startIcon={<PersonAddAlt1Icon />}
              onClick={() => {
                setRosterGroup(null);
                if (onNavigateToStudents) onNavigateToStudents();
              }}
              sx={{
                fontWeight: 800,
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                color: '#FFFFFF',
                borderRadius: 2,
                textTransform: 'none',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.3)' }
              }}
            >
              + विद्यार्थी भर्ना गर्नुहोस्
            </Button>
            <IconButton
              size="small"
              onClick={() => setRosterGroup(null)}
              sx={{
                color: 'rgba(255, 255, 255, 0.8)',
                bgcolor: 'rgba(255, 255, 255, 0.08)',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)', color: '#FFFFFF' }
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
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
          {rosterGroup && (
            <Box>
              {/* Roster Search Bar */}
              <TextField
                size="small"
                fullWidth
                placeholder="यस समूहका विद्यार्थी खोज्नुहोस्..."
                value={rosterSearch}
                onChange={(e) => setRosterSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: '#94A3B8' }} />
                    </InputAdornment>
                  )
                }}
                sx={{ mb: 2 }}
              />

              <Stack spacing={1.2}>
                {(db.students || [])
                  .filter((s) => s.groupId === rosterGroup.id)
                  .filter((s) => !rosterSearch || s.name.toLowerCase().includes(rosterSearch.toLowerCase()) || (s.phone || '').includes(rosterSearch))
                  .map((std, idx) => (
                    <Paper
                      key={std.id}
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        borderRadius: 2.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        '&:hover': { bgcolor: '#F8FAFC' }
                      }}
                    >
                      <Avatar
                        src={std.photoUrl}
                        sx={{ width: 38, height: 38, bgcolor: '#0F2C59', fontWeight: 800, fontSize: '0.85rem' }}
                      >
                        {std.name[0]}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                          {std.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: 1 }}>
                          ID: <b>{std.tgid || std.id}</b> • <PhoneIcon sx={{ fontSize: 13 }} /> {std.phone || 'No Phone'}
                        </Typography>
                      </Box>
                      <Chip
                        label={std.status || 'Active'}
                        size="small"
                        sx={{ bgcolor: '#ECFDF5', color: '#059669', fontWeight: 800, height: 22 }}
                      />
                    </Paper>
                  ))}

                {(db.students || []).filter((s) => s.groupId === rosterGroup.id).length === 0 && (
                  <Typography variant="body2" sx={{ color: '#94A3B8', textAlign: 'center', py: 4 }}>
                    यस समूहमा कुनै विद्यार्थी भर्ना गरिएको छैन।
                  </Typography>
                )}
              </Stack>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
          <Button
            onClick={() => setRosterGroup(null)}
            sx={{ fontWeight: 700, color: '#64748B', border: '1px solid #E2E8F0', borderRadius: 2, px: 2.5, textTransform: 'none' }}
          >
            बन्द गर्नुहोस् (Close)
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
