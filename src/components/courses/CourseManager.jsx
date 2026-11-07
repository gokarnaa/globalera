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
  ToggleButton,
  ToggleButtonGroup,
  Paper,
  Tooltip,
  Divider,
  Avatar,
  TableSortLabel
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import SearchIcon from '@mui/icons-material/Search';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewListIcon from '@mui/icons-material/ViewList';
import FilterListIcon from '@mui/icons-material/FilterList';
import SchoolIcon from '@mui/icons-material/School';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import ShieldIcon from '@mui/icons-material/Shield';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import confetti from 'canvas-confetti';
import { loadDB, saveDB, logAudit } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
import { useDialog } from '../../context/DialogContext';

// Quick Template presets for new vocational courses
const COURSE_TEMPLATES = [
  {
    title: 'Caregiver',
    level: 'CTEVT Level 1',
    durationValue: 3,
    durationUnit: 'Months',
    totalHours: 390,
    price: 18000,
    description: '3-month training program covering elderly, disabled, and patient care, first aid, and hospital support.'
  },
  {
    title: 'Professional Beautician & Hair Care',
    level: 'CTEVT Level 1',
    durationValue: 3,
    durationUnit: 'Months',
    totalHours: 390,
    price: 16000,
    description: 'Training in skin care, hair styling, chemical treatments, makeup, and salon management.'
  },
  {
    title: 'Building Electrician',
    level: 'CTEVT Level 1',
    durationValue: 3,
    durationUnit: 'Months',
    totalHours: 390,
    price: 15000,
    description: 'Training in domestic and industrial building wiring, earthing, DB box, and safety equipment installation.'
  },
  {
    title: 'Sanitary Plumber',
    level: 'CTEVT Level 1',
    durationValue: 3,
    durationUnit: 'Months',
    totalHours: 390,
    price: 15000,
    description: 'Training in water supply pipe installation, drainage, fittings, pumps, and sanitary fixture maintenance.'
  }
];

export default function CourseManager({ onNavigateToSyllabus, onNavigateToGroups }) {
  const [db, setDb] = useState(loadDB());
  const { currentUser } = useAuth();
  const { confirm, alert } = useDialog();

  // View & Filter States
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOccupation, setSelectedOccupation] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [sortBy, setSortBy] = useState('id'); // 'id' | 'title' | 'totalHours' | 'price'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'

  // Dialog & Details Preview States
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedCourseDetails, setSelectedCourseDetails] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    occupationId: '',
    title: '',
    level: 'CTEVT Level 1',
    durationValue: 3,
    durationUnit: 'Months',
    totalHours: 390,
    price: 15000,
    status: 'Active',
    description: ''
  });

  // Calculate High-Level Course Metrics
  const totalCoursesCount = (db.courses || []).length;
  const activeCoursesCount = (db.courses || []).filter((c) => c.status === 'Active').length;
  const totalSyllabusUnits = (db.syllabi || []).length;
  const avgHours = totalCoursesCount > 0
    ? Math.round((db.courses || []).reduce((sum, c) => sum + (Number(c.totalHours) || 0), 0) / totalCoursesCount)
    : 390;

  // Filter and Sort Courses
  const filteredAndSortedCourses = useMemo(() => {
    let list = (db.courses || []).filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const occ = (db.occupations || []).find((o) => o.id === c.occupationId);

      const matchesSearch =
        !q ||
        c.title.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        (occ?.name || '').toLowerCase().includes(q) ||
        (c.level || '').toLowerCase().includes(q) ||
        (c.description || '').toLowerCase().includes(q);

      const matchesOcc = selectedOccupation === 'ALL' || c.occupationId === selectedOccupation;
      const matchesStatus = selectedStatus === 'ALL' || c.status === selectedStatus;
      const matchesLevel = selectedLevel === 'ALL' || (c.level || '').includes(selectedLevel);

      return matchesSearch && matchesOcc && matchesStatus && matchesLevel;
    });

    list.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (sortBy === 'totalHours' || sortBy === 'price') {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      } else {
        valA = (valA || '').toString().toLowerCase();
        valB = (valB || '').toString().toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [db.courses, db.occupations, searchQuery, selectedOccupation, selectedStatus, selectedLevel, sortBy, sortOrder]);

  const handleRequestSort = (property) => {
    const isAsc = sortBy === property && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortBy(property);
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      occupationId: '',
      title: '',
      level: '',
      durationValue: '',
      durationUnit: 'Months',
      totalHours: '',
      price: '',
      status: 'Active',
      description: ''
    });
    setOpenDialog(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({ ...item });
    setOpenDialog(true);
  };

  const handleApplyTemplate = (tmpl) => {
    setFormData((prev) => ({
      ...prev,
      title: tmpl.title,
      level: tmpl.level,
      durationValue: tmpl.durationValue,
      durationUnit: tmpl.durationUnit,
      totalHours: tmpl.totalHours,
      price: tmpl.price,
      description: tmpl.description
    }));
  };

  const handleSave = () => {
    if (!formData.title.trim() || !formData.occupationId) {
      alert('Please enter both the Occupation and Course Title.');
      return;
    }

    let updatedList = [...(db.courses || [])];
    if (editingItem) {
      updatedList = updatedList.map((x) =>
        x.id === editingItem.id ? { ...x, ...formData } : x
      );
    } else {
      const newId = `CRS-${String(updatedList.length + 1).padStart(2, '0')}`;
      updatedList.push({ id: newId, ...formData });
    }

    let nextDb = { ...db, courses: updatedList };
    nextDb = logAudit(
      nextDb,
      editingItem ? 'UPDATE' : 'CREATE',
      'Course',
      editingItem?.id || 'NEW',
      `Course ${formData.title} (${formData.level}) ${editingItem ? 'updated' : 'created'}`,
      currentUser?.name || 'Super Admin'
    );

    saveDB(nextDb);
    setDb(nextDb);
    setOpenDialog(false);

    try {
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
    } catch (_) {}
  };

  const handleDelete = async (id) => {
    const crs = (db.courses || []).find((x) => x.id === id);
    const hasBatches = (db.trainingGroups || []).some((g) => g.courseId === id);

    if (hasBatches) {
      await alert({
        type: 'warning',
        title: 'Cannot Delete Course (Course Restricted)',
        message: `There are training batches associated with this course (${crs?.title}).`,
        detail: 'Please remove or transfer the associated training groups to another course first.'
      });
      return;
    }

    const ok = await confirm({
      type: 'danger',
      title: 'Confirm Delete Course',
      message: `Are you sure you want to remove the course "${crs?.title || id}" from the system?`,
      detail: 'This action will remove the course and its unit details. This action cannot be undone.',
      confirmText: 'Yes, Delete',
      confirmColor: '#DC2626'
    });

    if (ok) {
      let nextDb = {
        ...db,
        courses: (db.courses || []).filter((x) => x.id !== id)
      };
      nextDb = logAudit(
        nextDb,
        'DELETE',
        'Course',
        id,
        `Course ${crs?.title || id} deleted`,
        currentUser?.name || 'Super Admin'
      );
      saveDB(nextDb);
      setDb(nextDb);
    }
  };

  return (
    <Box sx={{ width: '100%', pb: 4 }}>
      {/* =======================================================
          1. HERO KPI BANNER - COURSE MASTER STUDIO
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
          {/* Left Title & Scope */}
          <Grid item xs={12} md={7}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1.5, flexWrap: 'wrap' }}>
              <Chip
                icon={<ShieldIcon sx={{ fontSize: '14px !important', color: '#FDE047 !important' }} />}
                label="CTEVT Curricular Framework"
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
                label={`${activeCoursesCount} Active Curricula`}
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
                fontSize: { xs: '1.5rem', sm: '1.9rem', md: '2.1rem' },
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
                mb: 1
              }}
            >
              Course Master (Curriculum Management)
            </Typography>

            <Typography variant="body2" sx={{ color: '#CBD5E1', maxWidth: 620, mb: 2.5, lineHeight: 1.6 }}>
              Official master definition of vocational courses, duration, CTEVT levels, credit hours, and fees operated under the institution.
              Training batches are conducted based on the courses defined here.
            </Typography>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenAdd}
              sx={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%) !important',
                color: '#FFFFFF !important',
                fontWeight: 900,
                fontSize: '0.88rem',
                py: 1.1,
                px: 2.5,
                borderRadius: 2.5,
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%) !important'
                }
              }}
            >
              + Add Course
            </Button>
          </Grid>

          {/* Right Micro KPI Metrics */}
          <Grid item xs={12} md={5}>
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
                    TOTAL COURSES
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 900, color: '#FFFFFF', my: 0.5 }}>
                    {totalCoursesCount}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#86EFAC' }}>
                    {activeCoursesCount} Actively Running
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
                    AVG. TRAINING DURATION
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 900, color: '#FFFFFF', my: 0.5 }}>
                    {avgHours}h
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#CBD5E1' }}>
                    3 Months (CTEVT Level 1)
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Box
                  sx={{
                    bgcolor: 'rgba(16, 185, 129, 0.12)',
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
                      SYLLABUS COVERAGE
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#FFFFFF' }}>
                      {totalSyllabusUnits} Units across all courses
                    </Typography>
                  </Box>
                  <Chip
                    label="100% CTEVT Aligned"
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
          2. SEARCH, MULTI-FILTER, SORT & VIEW SWITCHER BAR
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
              placeholder="Search course, code, or occupation..."
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

          {/* Filter by Occupation */}
          <Grid item xs={6} sm={6} md={2.5}>
            <TextField
              select
              size="small"
              label="Occupation"
              fullWidth
              value={selectedOccupation}
              onChange={(e) => setSelectedOccupation(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
            >
              <MenuItem value="ALL">All Occupations</MenuItem>
              {(db.occupations || []).map((occ) => (
                <MenuItem key={occ.id} value={occ.id}>
                  {occ.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Filter by Status */}
          <Grid item xs={6} sm={4} md={2}>
            <TextField
              select
              size="small"
              label="Status"
              fullWidth
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
            >
              <MenuItem value="ALL">All Statuses</MenuItem>
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
            </TextField>
          </Grid>

          {/* Sort By Dropdown */}
          <Grid item xs={6} sm={4} md={2}>
            <TextField
              select
              size="small"
              label="Sort By"
              fullWidth
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-');
                setSortBy(sb);
                setSortOrder(so);
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
            >
              <MenuItem value="id-asc">Course ID (Asc)</MenuItem>
              <MenuItem value="title-asc">Title (A-Z)</MenuItem>
              <MenuItem value="totalHours-desc">Hours (High-Low)</MenuItem>
              <MenuItem value="price-desc">Fee (High-Low)</MenuItem>
            </TextField>
          </Grid>

          {/* View Mode Switcher (Cards vs Table) */}
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
          {filteredAndSortedCourses.map((crs) => {
            const occ = (db.occupations || []).find((o) => o.id === crs.occupationId);
            const syllabusUnits = (db.syllabi || []).filter((s) => s.courseId === crs.id);
            const batches = (db.trainingGroups || []).filter((g) => g.courseId === crs.id);
            const activeBatchesCount = batches.filter((b) => b.status === 'Running').length;

            return (
              <Grid item xs={12} sm={6} md={4} key={crs.id}>
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
                      background: crs.status === 'Active'
                        ? 'linear-gradient(90deg, #10B981, #059669)'
                        : '#94A3B8'
                    }}
                  />

                  {/* Card Header: Code, Occupation & Status */}
                  <Box sx={{ p: 2, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        label={crs.id}
                        size="small"
                        sx={{
                          bgcolor: '#0F2C59',
                          color: '#FFFFFF',
                          fontWeight: 900,
                          fontSize: '0.72rem',
                          height: 22
                        }}
                      />
                      <Chip
                        label={occ?.name || 'Vocational'}
                        size="small"
                        sx={{
                          bgcolor: '#EFF6FF',
                          color: '#1D4ED8',
                          fontWeight: 800,
                          fontSize: '0.72rem',
                          height: 22
                        }}
                      />
                    </Box>

                    <Chip
                      label={crs.status}
                      size="small"
                      sx={{
                        bgcolor: crs.status === 'Active' ? '#ECFDF5' : '#FEE2E2',
                        color: crs.status === 'Active' ? '#059669' : '#DC2626',
                        fontWeight: 900,
                        fontSize: '0.7rem',
                        height: 22
                      }}
                    />
                  </Box>

                  {/* Title & Level */}
                  <Box sx={{ px: 2, pb: 1 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 900,
                        color: '#0F172A',
                        lineHeight: 1.25,
                        fontSize: '1.05rem',
                        mb: 0.5
                      }}
                    >
                      {crs.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>
                      {crs.level || 'CTEVT Level 1'} • Vocational Certificate
                    </Typography>
                  </Box>

                  {/* Metrics Box (Duration, Hours, Fee) */}
                  <Box sx={{ px: 2, py: 1.5, mx: 2, bgcolor: '#F8FAFC', borderRadius: 2.5, border: '1px solid #EDF2F7', mb: 1.5 }}>
                    <Grid container spacing={1}>
                      <Grid item xs={4}>
                        <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 800, display: 'block' }}>
                          Duration
                        </Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0F172A' }}>
                          {crs.durationValue} {crs.durationUnit}
                        </Typography>
                      </Grid>

                      <Grid item xs={4}>
                        <Typography variant="caption" sx={{ color: '#059669', fontWeight: 800, display: 'block' }}>
                          Total Hours
                        </Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#059669' }}>
                          {crs.totalHours || 390} hrs
                        </Typography>
                      </Grid>

                      <Grid item xs={4}>
                        <Typography variant="caption" sx={{ color: '#2563EB', fontWeight: 800, display: 'block' }}>
                          Training Fee
                        </Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#2563EB' }}>
                          Rs. {Number(crs.price || 0).toLocaleString()}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Connected Units & Batches Stats */}
                  <Box sx={{ px: 2, pb: 1.5, display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <Chip
                      icon={<FormatListBulletedIcon sx={{ fontSize: '14px !important', color: '#1D4ED8 !important' }} />}
                      label={`${syllabusUnits.length} Units Defined`}
                      size="small"
                      sx={{ bgcolor: '#EFF6FF', color: '#1E40AF', fontWeight: 800, fontSize: '0.72rem' }}
                    />
                    <Chip
                      icon={<GroupWorkIcon sx={{ fontSize: '14px !important', color: '#059669 !important' }} />}
                      label={`${activeBatchesCount} Batches Active`}
                      size="small"
                      sx={{ bgcolor: '#ECFDF5', color: '#065F46', fontWeight: 800, fontSize: '0.72rem' }}
                    />
                  </Box>

                  {/* Description preview */}
                  {crs.description && (
                    <Box sx={{ px: 2, pb: 1.5 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {crs.description}
                      </Typography>
                    </Box>
                  )}

                  {/* Card Actions Footer */}
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
                      startIcon={<VisibilityIcon />}
                      onClick={() => setSelectedCourseDetails({ ...crs, occupation: occ, syllabusUnits, batches })}
                      sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'none', color: '#0F2C59' }}
                    >
                      Details
                    </Button>

                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenEdit(crs)}
                        sx={{ color: '#1D4ED8', p: 0.5 }}
                        title="Edit Course"
                      >
                        <EditIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(crs.id)}
                        sx={{ color: '#EF4444', p: 0.5 }}
                        title="Delete Course"
                      >
                        <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Box>
                  </Box>
                </Card>
              </Grid>
            );
          })}

          {filteredAndSortedCourses.length === 0 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4, border: '1px dashed #CBD5E1', bgcolor: '#FFFFFF' }}>
                <MenuBookIcon sx={{ fontSize: 52, color: '#94A3B8', mb: 1.5 }} />
                <Typography variant="h6" sx={{ fontWeight: 900, color: '#1E293B', mb: 0.5 }}>
                  No Courses Found
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748B', mb: 2 }}>
                  No courses match your current search or filter criteria.
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd}>
                  + Add New Course
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
                    S.N.
                  </TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, width: 100 }}>
                    <TableSortLabel
                      active={sortBy === 'id'}
                      direction={sortBy === 'id' ? sortOrder : 'asc'}
                      onClick={() => handleRequestSort('id')}
                      sx={{
                        color: '#FFFFFF !important',
                        '&.Mui-active': { color: '#F59E0B !important' },
                        '& .MuiTableSortLabel-icon': { color: '#F59E0B !important' }
                      }}
                    >
                      Course ID
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>
                    <TableSortLabel
                      active={sortBy === 'title'}
                      direction={sortBy === 'title' ? sortOrder : 'asc'}
                      onClick={() => handleRequestSort('title')}
                      sx={{
                        color: '#FFFFFF !important',
                        '&.Mui-active': { color: '#F59E0B !important' },
                        '& .MuiTableSortLabel-icon': { color: '#F59E0B !important' }
                      }}
                    >
                      Title & Level
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>Occupation</TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900 }}>Duration</TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, textAlign: 'center' }}>
                    <TableSortLabel
                      active={sortBy === 'totalHours'}
                      direction={sortBy === 'totalHours' ? sortOrder : 'asc'}
                      onClick={() => handleRequestSort('totalHours')}
                      sx={{
                        color: '#FFFFFF !important',
                        '&.Mui-active': { color: '#F59E0B !important' },
                        '& .MuiTableSortLabel-icon': { color: '#F59E0B !important' }
                      }}
                    >
                      Hours
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, textAlign: 'right' }}>
                    <TableSortLabel
                      active={sortBy === 'price'}
                      direction={sortBy === 'price' ? sortOrder : 'asc'}
                      onClick={() => handleRequestSort('price')}
                      sx={{
                        color: '#FFFFFF !important',
                        '&.Mui-active': { color: '#F59E0B !important' },
                        '& .MuiTableSortLabel-icon': { color: '#F59E0B !important' }
                      }}
                    >
                      Fee
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, textAlign: 'center' }}>Units / Batches</TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, textAlign: 'center' }}>Status</TableCell>
                  <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 900, textAlign: 'right' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAndSortedCourses.map((crs, idx) => {
                  const occ = (db.occupations || []).find((o) => o.id === crs.occupationId);
                  const syllabusUnits = (db.syllabi || []).filter((s) => s.courseId === crs.id);
                  const batches = (db.trainingGroups || []).filter((g) => g.courseId === crs.id);

                  return (
                    <TableRow key={crs.id} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#F8FAFC' } }}>
                      <TableCell sx={{ fontWeight: 800, textAlign: 'center', color: '#64748B', width: 65 }}>
                        {idx + 1}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 900, color: '#1D4ED8' }}>
                        {crs.id}
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                          {crs.title}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B' }}>
                          {crs.level || 'CTEVT Level 1'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={occ?.name || '—'}
                          size="small"
                          sx={{ bgcolor: '#EFF6FF', color: '#1D4ED8', fontWeight: 800, fontSize: '0.72rem' }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#334155' }}>
                        {crs.durationValue} {crs.durationUnit}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 900, textAlign: 'center', color: '#059669' }}>
                        {crs.totalHours || 390}h
                      </TableCell>
                      <TableCell sx={{ fontWeight: 900, textAlign: 'right', color: '#0F172A' }}>
                        Rs. {Number(crs.price || 0).toLocaleString()}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569' }}>
                          {syllabusUnits.length} Units • {batches.length} Groups
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Chip
                          label={crs.status}
                          size="small"
                          sx={{
                            bgcolor: crs.status === 'Active' ? '#ECFDF5' : '#FEE2E2',
                            color: crs.status === 'Active' ? '#059669' : '#DC2626',
                            fontWeight: 900,
                            fontSize: '0.7rem'
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ textAlign: 'right' }}>
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                          <IconButton
                            size="small"
                            onClick={() => setSelectedCourseDetails({ ...crs, occupation: occ, syllabusUnits, batches })}
                            sx={{ color: '#0F2C59' }}
                            title="View Details"
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenEdit(crs)}
                            sx={{ color: '#1D4ED8' }}
                            title="Edit"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(crs.id)}
                            sx={{ color: '#EF4444' }}
                            title="Delete"
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {filteredAndSortedCourses.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} sx={{ textAlign: 'center', py: 5, color: '#94A3B8' }}>
                      No courses found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* =======================================================
          MODAL 1: ADD / EDIT COURSE MASTER
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
            background: 'linear-gradient(135deg, #0F2E5A 0%, #1E40AF 100%)',
            color: '#FFFFFF',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '3px solid #F59E0B'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.15)', color: '#FFFFFF', width: 44, height: 44, borderRadius: 2.5, border: '1px solid rgba(255, 255, 255, 0.25)' }}>
              <MenuBookIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, fontSize: '1.05rem', lineHeight: 1.2, color: '#FFFFFF' }}>
                {editingItem ? 'Edit Course Master' : 'Create New Course Master'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.74rem' }}>
                {editingItem ? 'Update course, duration, and fee details' : 'Register a new course according to CTEVT curriculum standards'}
              </Typography>
            </Box>
          </Box>
          <IconButton
            size="small"
            onClick={() => setOpenDialog(false)}
            sx={{
              color: 'rgba(255, 255, 255, 0.85)',
              bgcolor: 'rgba(255, 255, 255, 0.1)',
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.25)', color: '#FFFFFF' }
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
          {/* Quick Preset Selector for instant prefill */}
          {!editingItem && (
            <Box sx={{ mb: 2.5, p: 2, bgcolor: '#F8FAFC', borderRadius: 2.5, border: '1px solid #E2E8F0' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.2 }}>
                <AutoAwesomeIcon sx={{ fontSize: 18, color: '#F59E0B' }} />
                <Typography variant="caption" sx={{ fontWeight: 900, color: '#0F2C59' }}>
                  Quick CTEVT Template (1-Click Auto-Fill):
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {COURSE_TEMPLATES.map((tmpl, idx) => (
                  <Button
                    key={idx}
                    size="small"
                    variant="outlined"
                    onClick={() => handleApplyTemplate(tmpl)}
                    sx={{
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      textTransform: 'none',
                      borderRadius: 2,
                      bgcolor: '#FFFFFF',
                      borderColor: '#CBD5E1',
                      color: '#0F2C59',
                      '&:hover': { bgcolor: '#EFF6FF', borderColor: '#2563EB' }
                    }}
                  >
                    + {tmpl.title}
                  </Button>
                ))}
              </Stack>
            </Box>
          )}

          <Grid container spacing={2}>
            {/* Select Occupation */}
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Occupation *"
                fullWidth
                size="small"
                value={formData.occupationId}
                onChange={(e) => setFormData({ ...formData, occupationId: e.target.value })}
                required
              >
                <MenuItem value="" sx={{ color: '#94A3B8', fontStyle: 'italic' }}>
                  -- Select Occupation --
                </MenuItem>
                {(db.occupations || []).map((occ) => (
                  <MenuItem key={occ.id} value={occ.id}>
                    {occ.name} ({occ.id})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Course Title */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Course Title *"
                fullWidth
                size="small"
                placeholder="e.g. Professional Caregiver"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </Grid>

            {/* CTEVT Level */}
            <Grid item xs={12} sm={4}>
              <TextField
                select
                label="Level"
                fullWidth
                size="small"
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
              >
                <MenuItem value="" sx={{ color: '#94A3B8', fontStyle: 'italic' }}>
                  -- Select Level --
                </MenuItem>
                <MenuItem value="CTEVT Level 1">CTEVT Level 1 (Basic)</MenuItem>
                <MenuItem value="CTEVT Level 2">CTEVT Level 2 (Intermediate)</MenuItem>
                <MenuItem value="Short Term">Short Term</MenuItem>
                <MenuItem value="ToT Certified">ToT Certified (Trainer Training)</MenuItem>
              </TextField>
            </Grid>

            {/* Total Training Hours */}
            <Grid item xs={12} sm={4}>
              <TextField
                type="number"
                label="Total Hours *"
                fullWidth
                size="small"
                placeholder="390"
                value={formData.totalHours}
                onChange={(e) => setFormData({ ...formData, totalHours: e.target.value === '' ? '' : Number(e.target.value) })}
                helperText="CTEVT Standard: 390 Hours"
              />
            </Grid>

            {/* Fee Structure Overview */}
            <Grid item xs={12} sm={4}>
              <Box sx={{ p: 1, bgcolor: '#F0FDF4', borderRadius: 1.5, border: '1px solid #A7F3D0' }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#047857', display: 'block', mb: 0.3 }}>
                  Total Net Fee (Including 13% VAT):
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#065F46' }}>
                  Rs. {(formData.price || 0).toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ color: '#059669', fontSize: '0.68rem', display: 'block' }}>
                  💡 Detailed breakdown, campaign discounts, and installment policies are managed in the "Course Fee Structure" module.
                </Typography>
              </Box>
            </Grid>

            {/* Duration Value */}
            <Grid item xs={6} sm={4}>
              <TextField
                type="number"
                label="Duration Value"
                fullWidth
                size="small"
                placeholder="3"
                value={formData.durationValue}
                onChange={(e) => setFormData({ ...formData, durationValue: e.target.value === '' ? '' : Number(e.target.value) })}
              />
            </Grid>

            {/* Duration Unit */}
            <Grid item xs={6} sm={4}>
              <TextField
                select
                label="Duration Unit"
                fullWidth
                size="small"
                value={formData.durationUnit}
                onChange={(e) => setFormData({ ...formData, durationUnit: e.target.value })}
              >
                <MenuItem value="Months">Months</MenuItem>
                <MenuItem value="Weeks">Weeks</MenuItem>
                <MenuItem value="Days">Days</MenuItem>
              </TextField>
            </Grid>

            {/* Status */}
            <Grid item xs={12} sm={4}>
              <TextField
                select
                label="Status"
                fullWidth
                size="small"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
              </TextField>
            </Grid>

            {/* Description */}
            <Grid item xs={12}>
              <TextField
                label="Description / Scope"
                multiline
                rows={3}
                fullWidth
                size="small"
                placeholder="Brief summary of the course's main objectives, technical skills, and employment prospects..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
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
            Save Course
          </Button>
        </DialogActions>
      </Dialog>

      {/* =======================================================
          MODAL 2: COURSE DETAILS & SYLLABUS OVERVIEW DRAWER
          ======================================================= */}
      {selectedCourseDetails && (
        <Dialog
          open={Boolean(selectedCourseDetails)}
          onClose={() => setSelectedCourseDetails(null)}
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
                <SchoolIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900, fontSize: '1.05rem', lineHeight: 1.2 }}>
                  {selectedCourseDetails.title}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.72rem' }}>
                  Course Code: <b>{selectedCourseDetails.id}</b> • {selectedCourseDetails.level}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Chip
                label={selectedCourseDetails.status}
                size="small"
                sx={{
                  bgcolor: selectedCourseDetails.status === 'Active' ? '#ECFDF5' : '#FEE2E2',
                  color: selectedCourseDetails.status === 'Active' ? '#059669' : '#DC2626',
                  fontWeight: 900
                }}
              />
              <IconButton
                size="small"
                onClick={() => setSelectedCourseDetails(null)}
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
            <Grid container spacing={2} sx={{ mb: 2.5, p: 2, bgcolor: '#F8FAFC', borderRadius: 2.5 }}>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 800 }}>
                  Occupation:
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                  {selectedCourseDetails.occupation?.name || '—'}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 800 }}>
                  Duration & Hours:
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                  {selectedCourseDetails.durationValue} {selectedCourseDetails.durationUnit} ({selectedCourseDetails.totalHours} hrs)
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 800 }}>
                  Training Fee:
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#2563EB' }}>
                  Rs. {Number(selectedCourseDetails.price || 0).toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 800 }}>
                  Active Groups:
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#059669' }}>
                  {selectedCourseDetails.batches?.length || 0} Batches
                </Typography>
              </Grid>
            </Grid>

            {selectedCourseDetails.description && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5, color: '#0F2C59' }}>
                  Course Objectives & Description:
                </Typography>
                <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.6 }}>
                  {selectedCourseDetails.description}
                </Typography>
              </Box>
            )}

            {/* Linked Syllabus Units Preview */}
            <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1, color: '#0F2C59' }}>
              Syllabus Units for This Course ({selectedCourseDetails.syllabusUnits?.length || 0} Units):
            </Typography>

            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, mb: 2 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#F1F5F9' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>Unit #</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Unit Title</TableCell>
                    <TableCell sx={{ fontWeight: 800, textAlign: 'center' }}>Practical</TableCell>
                    <TableCell sx={{ fontWeight: 800, textAlign: 'center' }}>Theory</TableCell>
                    <TableCell sx={{ fontWeight: 800, textAlign: 'center' }}>Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(selectedCourseDetails.syllabusUnits || []).map((u) => (
                    <TableRow key={u.id}>
                      <TableCell sx={{ fontWeight: 900, color: '#1D4ED8' }}>#{u.unitNo}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{u.title}</TableCell>
                      <TableCell sx={{ textAlign: 'center', color: '#059669', fontWeight: 800 }}>{u.practicalHours}h</TableCell>
                      <TableCell sx={{ textAlign: 'center', color: '#2563EB', fontWeight: 800 }}>{u.theoryHours}h</TableCell>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 900 }}>{u.totalHours}h</TableCell>
                    </TableRow>
                  ))}
                  {(selectedCourseDetails.syllabusUnits || []).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} sx={{ textAlign: 'center', py: 2, color: '#94A3B8' }}>
                        No units added yet. You can add units in the Syllabus Studio.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setSelectedCourseDetails(null)} sx={{ fontWeight: 700 }}>
              Close
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                setSelectedCourseDetails(null);
                handleOpenEdit(selectedCourseDetails);
              }}
              sx={{ fontWeight: 800, bgcolor: '#0F2C59' }}
            >
              Edit
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}
