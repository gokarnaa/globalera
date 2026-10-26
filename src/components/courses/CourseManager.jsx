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

// Quick Template presets for new vocational courses
const COURSE_TEMPLATES = [
  {
    title: 'Caregiver (हेरचाह कार्यकर्ता)',
    level: 'CTEVT Level 1',
    durationValue: 3,
    durationUnit: 'Months',
    totalHours: 390,
    price: 18000,
    description: 'वृद्ध, असक्त तथा बिरामीहरूको हेरचाह, प्राथमिक उपचार र अस्पताल सहयोग सम्बन्धी ३ महिने तालिम।'
  },
  {
    title: 'Professional Beautician & Hair Care',
    level: 'CTEVT Level 1',
    durationValue: 3,
    durationUnit: 'Months',
    totalHours: 390,
    price: 16000,
    description: 'स्किन केयर, हेयर स्टाइल, केमिकल ट्रिटमेन्ट, मेकअप तथा सलोन व्यवस्थापन तालिम।'
  },
  {
    title: 'Building Electrician (भवन वायरिङ)',
    level: 'CTEVT Level 1',
    durationValue: 3,
    durationUnit: 'Months',
    totalHours: 390,
    price: 15000,
    description: 'घरायसी तथा औद्योगिक भवन विद्युतीकरण, अर्थिङ, DB बक्स र सुरक्षा उपकरण जडान तालिम।'
  },
  {
    title: 'Sanitary Plumber (प्लम्बिङ प्राविधिक)',
    level: 'CTEVT Level 1',
    durationValue: 3,
    durationUnit: 'Months',
    totalHours: 390,
    price: 15000,
    description: 'खानेपानी पाइप जडान, ड्रेनेज, फिटिङ्स, पम्प तथा सेनिटरी फिक्स्चर मर्मत तालिम।'
  }
];

export default function CourseManager({ onNavigateToSyllabus, onNavigateToGroups }) {
  const [db, setDb] = useState(loadDB());
  const { currentUser } = useAuth();

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
      alert('कृपया पेशा (Occupation) र पाठ्यक्रम शीर्षक (Course Title) प्रविष्ट गर्नुहोस्।');
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

  const handleDelete = (id) => {
    const crs = (db.courses || []).find((x) => x.id === id);
    const hasBatches = (db.trainingGroups || []).some((g) => g.courseId === id);

    if (hasBatches) {
      alert(`यो पाठ्यक्रम (${crs?.title}) सँग सम्बन्धित तालिम समूह (Batches) रहेकाले मेट्न मिल्दैन। पहिले सम्बन्धित समूह हटाउनुहोस्।`);
      return;
    }

    if (window.confirm(`के तपाईं निश्चित हुनुहुन्छ? पाठ्यक्रम "${crs?.title || id}" प्रणालीबाट हटाइनेछ।`)) {
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
              Course Master (पाठ्यक्रम व्यवस्थापन)
            </Typography>

            <Typography variant="body2" sx={{ color: '#CBD5E1', maxWidth: 620, mb: 2.5, lineHeight: 1.6 }}>
              संस्था अन्तर्गत सञ्चालित पेशागत पाठ्यक्रम, अवधि, CTEVT स्तर, घण्टा तथा शुल्कको आधिकारिक मास्टर परिभाषा।
              यहाँ परिभाषित पाठ्यक्रम अनुसार नै तालिम समूह (Training Batches) सञ्चालन हुन्छन्।
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
              + Add Course (नयाँ पाठ्यक्रम थप्नुहोस्)
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
                    कुल पाठ्यक्रम (COURSES)
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 900, color: '#FFFFFF', my: 0.5 }}>
                    {totalCoursesCount}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#86EFAC' }}>
                    {activeCoursesCount} सक्रिय सञ्चालनमा
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
                    औसत तालिम अवधि
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 900, color: '#FFFFFF', my: 0.5 }}>
                    {avgHours}h
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#CBD5E1' }}>
                    ३ महिने (CTEVT Level 1)
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
                      पाठ्य-एकाइहरू (SYLLABUS COVERAGE)
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
              placeholder="पाठ्यक्रम, कोड वा पेशा खोज्नुहोस्..."
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
              label="पेशा (Occupation)"
              fullWidth
              value={selectedOccupation}
              onChange={(e) => setSelectedOccupation(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
            >
              <MenuItem value="ALL">सबै पेशाहरू (All)</MenuItem>
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
              label="स्थिति (Status)"
              fullWidth
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
            >
              <MenuItem value="ALL">सबै स्थिति (All)</MenuItem>
              <MenuItem value="Active">सक्रिय (Active)</MenuItem>
              <MenuItem value="Inactive">निष्क्रिय (Inactive)</MenuItem>
            </TextField>
          </Grid>

          {/* Sort By Dropdown */}
          <Grid item xs={6} sm={4} md={2}>
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
              <MenuItem value="id-asc">Course ID (कम-बढी)</MenuItem>
              <MenuItem value="title-asc">शीर्षक (A-Z)</MenuItem>
              <MenuItem value="totalHours-desc">घण्टा (बढी-कम)</MenuItem>
              <MenuItem value="price-desc">शुल्क (बढी-कम)</MenuItem>
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
                          अवधि
                        </Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0F172A' }}>
                          {crs.durationValue} {crs.durationUnit}
                        </Typography>
                      </Grid>

                      <Grid item xs={4}>
                        <Typography variant="caption" sx={{ color: '#059669', fontWeight: 800, display: 'block' }}>
                          कुल घण्टा
                        </Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#059669' }}>
                          {crs.totalHours || 390} hrs
                        </Typography>
                      </Grid>

                      <Grid item xs={4}>
                        <Typography variant="caption" sx={{ color: '#2563EB', fontWeight: 800, display: 'block' }}>
                          तालिम शुल्क
                        </Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#2563EB' }}>
                          रु. {Number(crs.price || 0).toLocaleString()}
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
                      विवरण (Details)
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
                  कुनै पाठ्यक्रम फेला परेन
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748B', mb: 2 }}>
                  तपाईंको खोजी वा फिल्टर अनुसार कुनै पाठ्यक्रम सूचीकृत छैन।
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
              <TableHead sx={{ bgcolor: '#0F2C59' }}>
                <TableRow>
                  <TableCell sx={{ color: '#FFFFFF', fontWeight: 900, width: 85 }}>
                    <TableSortLabel
                      active={sortBy === 'id'}
                      direction={sortBy === 'id' ? sortOrder : 'asc'}
                      onClick={() => handleRequestSort('id')}
                      sx={{ color: '#FFFFFF !important', '& .MuiTableSortLabel-icon': { color: '#FFFFFF !important' } }}
                    >
                      Course ID
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ color: '#FFFFFF', fontWeight: 900 }}>
                    <TableSortLabel
                      active={sortBy === 'title'}
                      direction={sortBy === 'title' ? sortOrder : 'asc'}
                      onClick={() => handleRequestSort('title')}
                      sx={{ color: '#FFFFFF !important', '& .MuiTableSortLabel-icon': { color: '#FFFFFF !important' } }}
                    >
                      पाठ्यक्रम शीर्षक र स्तर (Title & Level)
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ color: '#FFFFFF', fontWeight: 900 }}>पेशा (Occupation)</TableCell>
                  <TableCell sx={{ color: '#FFFFFF', fontWeight: 900 }}>अवधि (Duration)</TableCell>
                  <TableCell sx={{ color: '#FFFFFF', fontWeight: 900, textAlign: 'center' }}>
                    <TableSortLabel
                      active={sortBy === 'totalHours'}
                      direction={sortBy === 'totalHours' ? sortOrder : 'asc'}
                      onClick={() => handleRequestSort('totalHours')}
                      sx={{ color: '#FFFFFF !important', '& .MuiTableSortLabel-icon': { color: '#FFFFFF !important' } }}
                    >
                      घण्टा (Hours)
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ color: '#FFFFFF', fontWeight: 900, textAlign: 'right' }}>
                    <TableSortLabel
                      active={sortBy === 'price'}
                      direction={sortBy === 'price' ? sortOrder : 'asc'}
                      onClick={() => handleRequestSort('price')}
                      sx={{ color: '#FFFFFF !important', '& .MuiTableSortLabel-icon': { color: '#FFFFFF !important' } }}
                    >
                      शुल्क (Fee)
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ color: '#FFFFFF', fontWeight: 900, textAlign: 'center' }}>एकाइ / ब्याच</TableCell>
                  <TableCell sx={{ color: '#FFFFFF', fontWeight: 900, textAlign: 'center' }}>स्थिति</TableCell>
                  <TableCell sx={{ color: '#FFFFFF', fontWeight: 900, textAlign: 'right' }}>कार्य (Actions)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAndSortedCourses.map((crs) => {
                  const occ = (db.occupations || []).find((o) => o.id === crs.occupationId);
                  const syllabusUnits = (db.syllabi || []).filter((s) => s.courseId === crs.id);
                  const batches = (db.trainingGroups || []).filter((g) => g.courseId === crs.id);

                  return (
                    <TableRow key={crs.id} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#F8FAFC' } }}>
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
                        रु. {Number(crs.price || 0).toLocaleString()}
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
                    <TableCell colSpan={9} sx={{ textAlign: 'center', py: 5, color: '#94A3B8' }}>
                      कुनै पाठ्यक्रम फेला परेन।
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
            background: 'linear-gradient(135deg, #0F2C59 0%, #1E3A8A 100%)',
            color: '#FFFFFF',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.15)', color: '#FFFFFF', width: 44, height: 44, borderRadius: 2.5 }}>
              <MenuBookIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, fontSize: '1.05rem', lineHeight: 1.2 }}>
                {editingItem ? 'पाठ्यक्रम सम्पादन गर्नुहोस् (Edit Course Master)' : 'नयाँ पाठ्यक्रम सिर्जना (Create New Course Master)'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.72rem' }}>
                {editingItem ? 'पाठ्यक्रम, अवधि र शुल्क विवरण अद्यावधिक गर्नुहोस्' : 'CTEVT पाठ्यक्रम मापदण्ड अनुसार नयाँ विषय दर्ता गर्नुहोस्'}
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
          {/* Quick Preset Selector for instant prefill */}
          {!editingItem && (
            <Box sx={{ mb: 2.5, p: 2, bgcolor: '#F8FAFC', borderRadius: 2.5, border: '1px solid #E2E8F0' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.2 }}>
                <AutoAwesomeIcon sx={{ fontSize: 18, color: '#F59E0B' }} />
                <Typography variant="caption" sx={{ fontWeight: 900, color: '#0F2C59' }}>
                  द्रुत CTEVT टेम्प्लेटबाट भर्नुहोस् (1-Click Auto-Fill):
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
                label="सम्बन्धित पेशा (Occupation) *"
                fullWidth
                size="small"
                value={formData.occupationId}
                onChange={(e) => setFormData({ ...formData, occupationId: e.target.value })}
                required
              >
                <MenuItem value="" sx={{ color: '#94A3B8', fontStyle: 'italic' }}>
                  -- पेशा चयन गर्नुहोस् (Select Occupation) --
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
                label="पाठ्यक्रमको नाम (Course Title) *"
                fullWidth
                size="small"
                placeholder="उदा: Professional Caregiver"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </Grid>

            {/* CTEVT Level */}
            <Grid item xs={12} sm={4}>
              <TextField
                select
                label="स्तर (Level)"
                fullWidth
                size="small"
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
              >
                <MenuItem value="" sx={{ color: '#94A3B8', fontStyle: 'italic' }}>
                  -- स्तर चयन गर्नुहोस् --
                </MenuItem>
                <MenuItem value="CTEVT Level 1">CTEVT Level 1 (आधारभूत)</MenuItem>
                <MenuItem value="CTEVT Level 2">CTEVT Level 2 (मध्यम)</MenuItem>
                <MenuItem value="Short Term">छोटो अवधिको (Short Term)</MenuItem>
                <MenuItem value="ToT Certified">ToT Certified (प्रशिक्षक तालिम)</MenuItem>
              </TextField>
            </Grid>

            {/* Total Training Hours */}
            <Grid item xs={12} sm={4}>
              <TextField
                type="number"
                label="कुल तालिम घण्टा (Total Hours) *"
                fullWidth
                size="small"
                placeholder="390"
                value={formData.totalHours}
                onChange={(e) => setFormData({ ...formData, totalHours: e.target.value === '' ? '' : Number(e.target.value) })}
                helperText="CTEVT मानक: ३९० घण्टा"
              />
            </Grid>

            {/* Fee */}
            <Grid item xs={12} sm={4}>
              <TextField
                type="number"
                label="तालिम शुल्क (Fee NPR) *"
                fullWidth
                size="small"
                placeholder="15000"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value === '' ? '' : Number(e.target.value) })}
              />
            </Grid>

            {/* Duration Value */}
            <Grid item xs={6} sm={4}>
              <TextField
                type="number"
                label="अवधि संख्या (Duration Value)"
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
                label="अवधि एकाइ (Duration Unit)"
                fullWidth
                size="small"
                value={formData.durationUnit}
                onChange={(e) => setFormData({ ...formData, durationUnit: e.target.value })}
              >
                <MenuItem value="Months">Months (महिना)</MenuItem>
                <MenuItem value="Weeks">Weeks (हप्ता)</MenuItem>
                <MenuItem value="Days">Days (दिन)</MenuItem>
              </TextField>
            </Grid>

            {/* Status */}
            <Grid item xs={12} sm={4}>
              <TextField
                select
                label="स्थिति (Status)"
                fullWidth
                size="small"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <MenuItem value="Active">Active (सक्रिय)</MenuItem>
                <MenuItem value="Inactive">Inactive (निष्क्रिय)</MenuItem>
              </TextField>
            </Grid>

            {/* Description */}
            <Grid item xs={12}>
              <TextField
                label="पाठ्यक्रम विवरण तथा उद्देश्य (Description / Scope)"
                multiline
                rows={3}
                fullWidth
                size="small"
                placeholder="यस पाठ्यक्रमको मुख्य उद्देश्य, प्राविधिक सीपहरू र रोजगार सम्भावना सम्बन्धी संक्षिप्त विवरण..."
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
            सुरक्षित गर्नुहोस् (Save Course)
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
                  पेशा (Occupation):
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                  {selectedCourseDetails.occupation?.name || '—'}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 800 }}>
                  अवधि र घण्टा:
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                  {selectedCourseDetails.durationValue} {selectedCourseDetails.durationUnit} ({selectedCourseDetails.totalHours} hrs)
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 800 }}>
                  तालिम शुल्क:
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#2563EB' }}>
                  रु. {Number(selectedCourseDetails.price || 0).toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 800 }}>
                  सक्रिय समूहहरू:
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#059669' }}>
                  {selectedCourseDetails.batches?.length || 0} Batches
                </Typography>
              </Grid>
            </Grid>

            {selectedCourseDetails.description && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5, color: '#0F2C59' }}>
                  पाठ्यक्रमको उद्देश्य र विवरण:
                </Typography>
                <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.6 }}>
                  {selectedCourseDetails.description}
                </Typography>
              </Box>
            )}

            {/* Linked Syllabus Units Preview */}
            <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1, color: '#0F2C59' }}>
              यस पाठ्यक्रमका एकाइहरू ({selectedCourseDetails.syllabusUnits?.length || 0} Units):
            </Typography>

            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, mb: 2 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#F1F5F9' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>Unit #</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>शीर्षक (Unit Title)</TableCell>
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
                        कुनै एकाइ थपिएको छैन। Syllabus Studio मा गएर एकाइ थप्न सक्नुहुन्छ।
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setSelectedCourseDetails(null)} sx={{ fontWeight: 700 }}>
              बन्द गर्नुहोस्
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                setSelectedCourseDetails(null);
                handleOpenEdit(selectedCourseDetails);
              }}
              sx={{ fontWeight: 800, bgcolor: '#0F2C59' }}
            >
              सम्पादन गर्नुहोस् (Edit)
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}
