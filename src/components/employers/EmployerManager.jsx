import React, { useState } from 'react';
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
  Tooltip,
  Tabs,
  Tab,
  Paper,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
  useMediaQuery
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import BusinessIcon from '@mui/icons-material/Business';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import PersonIcon from '@mui/icons-material/Person';
import WorkIcon from '@mui/icons-material/Work';
import SchoolIcon from '@mui/icons-material/School';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { loadDB, saveDB, logAudit } from '../../services/storage';
import { getWhatsAppUrl } from '../../services/exportUtils';
import StudentProfileModal from '../students/StudentProfileModal';
import { ResponsiveDataView, StatusBadge, EntityCard } from '../common';

const getInitials = (name = '') => {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return 'EP';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

const getAvatarBg = (industry = '', name = '') => {
  const ind = (industry || '').toLowerCase();
  if (ind.includes('health') || ind.includes('hospital') || ind.includes('care')) return '#1a56b0';
  if (ind.includes('elder') || ind.includes('home')) return '#0d9488';
  if (ind.includes('beauty') || ind.includes('salon') || ind.includes('spa') || ind.includes('aesthetics')) return '#7c3aed';
  if (ind.includes('tailor') || ind.includes('garment') || ind.includes('boutique')) return '#b45309';
  if (ind.includes('hotel') || ind.includes('hospitality')) return '#ea580c';
  const colors = ['#1a56b0', '#0284c7', '#059669', '#d97706', '#7c3aed', '#db2777'];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash += name.charCodeAt(i);
  return colors[hash % colors.length];
};

export default function EmployerManager() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isBelowMd = useMediaQuery(theme.breakpoints.down('md'));
  const [db, setDb] = useState(loadDB());
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [profileEmployer, setProfileEmployer] = useState(null);
  const [profileTab, setProfileTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewMode, setViewMode] = useState('table');

  // Two-way Student Profile modal from Employer view
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState(null);

  // In-Employer Add OJT Modal state
  const [openAddOjtModal, setOpenAddOjtModal] = useState(false);
  const [newOjtData, setNewOjtData] = useState({
    studentId: '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '',
    relatedPerson: '',
    contactNumber: '',
    status: 'Ongoing',
    remarks: ''
  });

  // In-Employer Add Placement Modal state
  const [openAddPlacementModal, setOpenAddPlacementModal] = useState(false);
  const [newPlacementData, setNewPlacementData] = useState({
    studentId: '',
    targetJob: '',
    preferredLocation: '',
    expectedSalary: 'NPR 25,000 / month',
    employmentType: 'Full-Time Employee',
    workSchedule: '09:00 AM – 05:00 PM',
    paymentType: 'Monthly Salary',
    placementDate: new Date().toISOString().slice(0, 10),
    status: 'Placed',
    remarks: ''
  });

  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    location: '',
    contactPerson: '',
    phone: '',
    email: '',
    ojtCapacity: '5',
    mouStatus: 'Signed',
    status: 'Active',
    remarks: ''
  });
  const [confirmDeleteEmp, setConfirmDeleteEmp] = useState(null);
  const [copiedPortalLink, setCopiedPortalLink] = useState(false);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      industry: '',
      location: '',
      contactPerson: '',
      phone: '',
      email: '',
      ojtCapacity: '5',
      mouStatus: 'Signed',
      status: 'Active',
      remarks: ''
    });
    setOpenDialog(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({ ojtCapacity: '5', mouStatus: 'Signed', ...item });
    setOpenDialog(true);
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.phone.trim()) {
      alert('Employer Name and Phone are required.');
      return;
    }

    let updatedList = [...db.employers];
    if (editingItem) {
      updatedList = updatedList.map((x) =>
        x.id === editingItem.id ? { ...x, ...formData } : x
      );
      if (profileEmployer && profileEmployer.id === editingItem.id) {
        setProfileEmployer({ ...profileEmployer, ...formData });
      }
    } else {
      const newId = `EMP-${String(updatedList.length + 1).padStart(2, '0')}`;
      updatedList.push({ id: newId, ...formData });
    }

    const nextDb = { ...db, employers: updatedList };
    saveDB(nextDb);
    setDb(nextDb);
    setOpenDialog(false);
  };

  const handleDelete = (id) => {
    const emp = (db.employers || []).find((x) => x.id === id);
    setConfirmDeleteEmp(emp || { id, name: 'this partner' });
  };

  const handleConfirmDelete = () => {
    if (!confirmDeleteEmp) return;
    const nextDb = {
      ...db,
      employers: (db.employers || []).filter((x) => x.id !== confirmDeleteEmp.id)
    };
    saveDB(nextDb);
    setDb(nextDb);
    setConfirmDeleteEmp(null);
  };

  const handleOpenAddOjtForEmployer = (targetEmp) => {
    const emp = targetEmp && targetEmp.id ? targetEmp : profileEmployer;
    if (!emp) return;
    setNewOjtData({
      studentId: '',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: '',
      relatedPerson: emp.contactPerson || '',
      contactNumber: emp.phone || '',
      status: 'Ongoing',
      remarks: ''
    });
    setOpenAddOjtModal(true);
  };

  const handleSaveOjtForEmployer = () => {
    if (!newOjtData.studentId || !newOjtData.startDate) {
      alert('Student and Start Date are required.');
      return;
    }
    const student = (db.students || []).find((s) => s.id === newOjtData.studentId);
    let updatedOjts = [...(db.ojts || [])];
    const existingIndex = updatedOjts.findIndex((o) => o.studentId === newOjtData.studentId);

    const ojtRecord = {
      id: existingIndex >= 0 ? updatedOjts[existingIndex].id : `OJT-${Date.now()}`,
      employerId: profileEmployer.id,
      ...newOjtData
    };

    if (existingIndex >= 0) {
      updatedOjts[existingIndex] = ojtRecord;
    } else {
      updatedOjts.push(ojtRecord);
    }

    const updatedStudents = (db.students || []).map((s) =>
      s.id === newOjtData.studentId ? { ...s, status: 'OJT' } : s
    );

    const timelineEntry = {
      id: `TL-${Date.now()}`,
      studentId: newOjtData.studentId,
      eventType: 'OJT',
      title: `OJT Assigned: ${profileEmployer.name}`,
      description: `Deployed to ${profileEmployer.name} for OJT from ${newOjtData.startDate} to ${newOjtData.endDate || 'TBD'} under ${newOjtData.relatedPerson || 'Supervisor'}.`,
      createdAt: new Date().toISOString()
    };

    let nextDb = {
      ...db,
      ojts: updatedOjts,
      students: updatedStudents,
      studentTimelines: [timelineEntry, ...(db.studentTimelines || [])]
    };

    nextDb = logAudit(
      nextDb,
      existingIndex >= 0 ? 'UPDATE' : 'CREATE',
      'OJT',
      ojtRecord.id,
      `OJT assigned to ${student?.name} at ${profileEmployer.name}`,
      'Admin / Staff'
    );

    saveDB(nextDb);
    setDb(nextDb);
    setOpenAddOjtModal(false);
  };

  const handleOpenAddPlacementForEmployer = (targetEmp) => {
    const emp = targetEmp && targetEmp.id ? targetEmp : profileEmployer;
    if (!emp) return;
    setNewPlacementData({
      studentId: '',
      targetJob: '',
      preferredLocation: emp.location || '',
      expectedSalary: '',
      employmentType: 'Full-Time Employee',
      workSchedule: '09:00 AM – 05:00 PM',
      paymentType: 'Monthly Salary',
      placementDate: new Date().toISOString().slice(0, 10),
      status: 'Placed',
      remarks: ''
    });
    setOpenAddPlacementModal(true);
  };

  const handleSavePlacementForEmployer = () => {
    if (!newPlacementData.studentId || !newPlacementData.targetJob) {
      alert('Student and Target Job Role are required.');
      return;
    }
    const student = (db.students || []).find((s) => s.id === newPlacementData.studentId);
    let updatedPlacements = [...(db.placements || [])];
    const existingIndex = updatedPlacements.findIndex((p) => p.studentId === newPlacementData.studentId);

    const placementRecord = {
      id: existingIndex >= 0 ? updatedPlacements[existingIndex].id : `PLC-${Date.now()}`,
      employerId: profileEmployer.id,
      ...newPlacementData
    };

    if (existingIndex >= 0) {
      updatedPlacements[existingIndex] = placementRecord;
    } else {
      updatedPlacements.push(placementRecord);
    }

    const updatedStudents = (db.students || []).map((s) =>
      s.id === newPlacementData.studentId ? { ...s, status: 'Placed' } : s
    );

    const timelineEntry = {
      id: `TL-${Date.now()}`,
      studentId: newPlacementData.studentId,
      eventType: 'Placement',
      title: `Job Placement: ${profileEmployer.name}`,
      description: `Hired at ${profileEmployer.name} as ${newPlacementData.targetJob} (${newPlacementData.employmentType}) with salary ${newPlacementData.expectedSalary}.`,
      createdAt: new Date().toISOString()
    };

    let nextDb = {
      ...db,
      placements: updatedPlacements,
      students: updatedStudents,
      studentTimelines: [timelineEntry, ...(db.studentTimelines || [])]
    };

    nextDb = logAudit(
      nextDb,
      existingIndex >= 0 ? 'UPDATE' : 'CREATE',
      'Placement',
      placementRecord.id,
      `Job Placement recorded for ${student?.name} at ${profileEmployer.name} as ${newPlacementData.targetJob}`,
      'Admin / Staff'
    );

    saveDB(nextDb);
    setDb(nextDb);
    setOpenAddPlacementModal(false);
  };

  const totalEmployers = (db.employers || []).length;
  const activeEmployers = (db.employers || []).filter((e) => e.status === 'Active').length;
  const totalOjt = (db.ojts || []).length;
  const totalPlaced = (db.placements || []).length;

  const filteredEmployers = (db.employers || []).filter((emp) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      (emp.name || '').toLowerCase().includes(q) ||
      (emp.industry || '').toLowerCase().includes(q) ||
      (emp.location || '').toLowerCase().includes(q) ||
      (emp.contactPerson || '').toLowerCase().includes(q) ||
      (emp.phone || '').toLowerCase().includes(q) ||
      (emp.email || '').toLowerCase().includes(q) ||
      (emp.id || '').toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === 'All' || emp.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2.2 }, maxWidth: '1440px', mx: 'auto' }}>
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
          <Grid item xs={12} md={8}>
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
                <BusinessIcon sx={{ fontSize: 20, color: '#fbbf24' }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="subtitle1"
                  noWrap
                  sx={{ fontWeight: 800, color: '#ffffff', fontSize: { xs: '0.96rem', sm: '1.06rem' }, lineHeight: 1.2 }}
                >
                  Employer Master &amp; Partner Registry
                </Typography>
                <Typography
                  variant="caption"
                  noWrap
                  sx={{ color: '#cbd5e1', display: 'block', fontSize: '0.73rem', mt: 0.15 }}
                >
                  Prabidhik School, Jorpati • Reusable partner institutions for OJT training and career placements
                </Typography>
              </Box>
            </Stack>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', md: 'flex-end' }} flexWrap="wrap" useFlexGap>
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
                + Add Employer Partner
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
                  Total Partners
                </Typography>
                <Typography sx={{ fontWeight: 800, color: '#0f2e5a', fontSize: '1.22rem', lineHeight: 1.2, mt: 0.2 }}>
                  {totalEmployers}
                </Typography>
                <Typography variant="caption" noWrap sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.68rem', display: 'block' }}>
                  Registered Employers
                </Typography>
              </Box>
              <Box sx={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#eff6ff', borderRadius: 1.5, color: '#1e40af', flexShrink: 0 }}>
                <BusinessIcon sx={{ fontSize: 18 }} />
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
                  Active Partners
                </Typography>
                <Typography sx={{ fontWeight: 800, color: '#059669', fontSize: '1.22rem', lineHeight: 1.2, mt: 0.2 }}>
                  {activeEmployers}
                </Typography>
                <Typography variant="caption" noWrap sx={{ color: '#059669', fontWeight: 600, fontSize: '0.68rem', display: 'block' }}>
                  Verified MoU Partners
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
              borderLeft: '3.5px solid #0284c7',
              bgcolor: '#ffffff'
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" noWrap sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontSize: '0.66rem', letterSpacing: '0.03em', display: 'block' }}>
                  Total OJT Deployed
                </Typography>
                <Typography sx={{ fontWeight: 800, color: '#0284c7', fontSize: '1.22rem', lineHeight: 1.2, mt: 0.2 }}>
                  {totalOjt}
                </Typography>
                <Typography variant="caption" noWrap sx={{ color: '#0284c7', fontWeight: 600, fontSize: '0.68rem', display: 'block' }}>
                  Trainees in Field
                </Typography>
              </Box>
              <Box sx={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f0f9ff', borderRadius: 1.5, color: '#0284c7', flexShrink: 0 }}>
                <WorkIcon sx={{ fontSize: 18 }} />
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
              borderLeft: '3.5px solid #d97706',
              bgcolor: '#ffffff'
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" noWrap sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontSize: '0.66rem', letterSpacing: '0.03em', display: 'block' }}>
                  Total Placed
                </Typography>
                <Typography sx={{ fontWeight: 800, color: '#d97706', fontSize: '1.22rem', lineHeight: 1.2, mt: 0.2 }}>
                  {totalPlaced}
                </Typography>
                <Typography variant="caption" noWrap sx={{ color: '#d97706', fontWeight: 600, fontSize: '0.68rem', display: 'block' }}>
                  Hired Graduates
                </Typography>
              </Box>
              <Box sx={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#fffbeb', borderRadius: 1.5, color: '#d97706', flexShrink: 0 }}>
                <SchoolIcon sx={{ fontSize: 18 }} />
              </Box>
            </Stack>
          </Card>
        </Grid>
      </Grid>

      {/* Compact Filter & View Switcher Bar */}
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.25 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap', flexGrow: 1 }}>
            <TextField
              size="small"
              placeholder="Search by employer name, industry, location, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ width: { xs: '100%', sm: 320 }, bgcolor: '#ffffff' }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#94a3b8', fontSize: 18 }} />
                  </InputAdornment>
                )
              }}
            />

            <Box sx={{ display: 'flex', gap: 0.6, flexWrap: 'wrap' }}>
              {['All', 'Active', 'Pending Approval', 'Inactive'].map((status) => (
                <Chip
                  key={status}
                  label={status}
                  size="small"
                  clickable
                  color={statusFilter === status ? 'primary' : 'default'}
                  onClick={() => setStatusFilter(status)}
                  sx={{ fontWeight: 700, fontSize: '0.74rem' }}
                />
              ))}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Typography variant="caption" sx={{ color: '#647089', fontWeight: 700, fontSize: '0.74rem' }}>
              Showing {filteredEmployers.length} of {totalEmployers}
            </Typography>

            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, next) => next && setViewMode(next)}
              size="small"
              sx={{ bgcolor: '#ffffff', display: { xs: 'none', md: 'inline-flex' } }}
            >
              <ToggleButton value="table" title="Table View" sx={{ py: 0.4, px: 0.9 }}>
                <ViewListIcon fontSize="small" />
              </ToggleButton>
              <ToggleButton value="card" title="Card View" sx={{ py: 0.4, px: 0.9 }}>
                <ViewModuleIcon fontSize="small" />
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>
      </Card>

      {/* Main Content: Table View vs Card View */}
      {isBelowMd || viewMode === 'table' ? (
        <ResponsiveDataView
          rows={filteredEmployers}
          enableDesktopCardToggle={true}
          keyExtractor={(emp) => emp.id}
          emptyIcon={<BusinessIcon />}
          emptyTitle="No employer partners found"
          emptySubtitle="No employer partners found matching the filter criteria."
          renderTable={() => (
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
                  <TableCell sx={{ fontWeight: 800, width: 48, color: '#FFFFFF !important' }}>S.N.</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Employer / Organization</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Industry &amp; Sector</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Location</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Contact Person</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Active OJT / Placed</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredEmployers.map((emp, idx) => {
                  const ojtCount = (db.ojts || []).filter((o) => o.employerId === emp.id).length;
                  const placedCount = (db.placements || []).filter((p) => p.employerId === emp.id).length;

                  return (
                    <TableRow key={emp.id} hover>
                      <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.75rem' }}>
                        {idx + 1}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                          <Avatar
                            sx={{
                              width: 30,
                              height: 30,
                              fontWeight: 800,
                              fontSize: '0.76rem',
                              letterSpacing: '0.03em',
                              bgcolor: getAvatarBg(emp.industry, emp.name),
                              color: '#ffffff',
                              borderRadius: '8px'
                            }}
                          >
                            {getInitials(emp.name)}
                          </Avatar>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: 800,
                              color: '#0f172a',
                              fontSize: '0.82rem'
                            }}
                          >
                            {emp.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={emp.industry || 'General'} size="small" sx={{ height: 20, fontSize: '0.68rem', bgcolor: '#e8f0fd', color: '#1a56b0', fontWeight: 700 }} />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.78rem' }}>{emp.location || '—'}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.79rem' }}>
                          {emp.contactPerson || '—'}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                          <Typography variant="caption" sx={{ color: '#647089', fontSize: '0.7rem' }}>{emp.phone}</Typography>
                          {emp.phone && (
                            <IconButton
                              size="small"
                              component="a"
                              href={getWhatsAppUrl(emp.phone, `Namaste, greetings from Prabidhik School, Jorpati.`)}
                              target="_blank"
                              sx={{ color: '#25D366', p: 0.25 }}
                            >
                              <WhatsAppIcon sx={{ fontSize: 15 }} />
                            </IconButton>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={`${ojtCount} OJT • ${placedCount} Placed`} size="small" sx={{ height: 20, fontSize: '0.68rem', bgcolor: '#e5f8ee', color: '#16834b', fontWeight: 700 }} />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={emp.status}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.68rem',
                            bgcolor: emp.status === 'Active' ? '#e5f8ee' : emp.status === 'Pending Approval' ? '#FEF3C7' : '#fdeceb',
                            color: emp.status === 'Active' ? '#16834b' : emp.status === 'Pending Approval' ? '#B45309' : '#d5372f',
                            fontWeight: 700
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {emp.status === 'Pending Approval' && (
                          <Tooltip title="Approve Partner Employer">
                            <IconButton
                              size="small"
                              onClick={() => {
                                const updated = (db.employers || []).map((x) =>
                                  x.id === emp.id ? { ...x, status: 'Active' } : x
                                );
                                let nextDb = { ...db, employers: updated };
                                nextDb = logAudit(nextDb, 'UPDATE', 'Employer', emp.id, `Approved Employer Partner: ${emp.name}`, 'Admin');
                                saveDB(nextDb);
                                setDb(nextDb);
                              }}
                              sx={{ color: '#16834b', p: 0.4 }}
                            >
                              <CheckCircleIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="View Employer 360° Profile">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setProfileEmployer(emp);
                              setProfileTab(0);
                            }}
                            sx={{ color: '#1a56b0', p: 0.4 }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <IconButton size="small" onClick={() => handleOpenEdit(emp)} sx={{ color: '#1a56b0', p: 0.4 }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDelete(emp.id)} sx={{ color: '#d5372f', p: 0.4 }}>
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredEmployers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} sx={{ textAlign: 'center', py: 3.5, color: '#94a3b8', fontSize: '0.8rem' }}>
                      No employer partners found matching the filter criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
          )}
          renderCard={(emp) => {
            const ojtCount = (db.ojts || []).filter((o) => o.employerId === emp.id).length;
            const placedCount = (db.placements || []).filter((p) => p.employerId === emp.id).length;
            const statusTone = emp.status === 'Active' ? 'success' : emp.status === 'Pending Approval' ? 'warning' : 'error';

            return (
              <EntityCard
                accentColor="#0284C7"
                avatarText={getInitials(emp.name)}
                avatarBg={getAvatarBg(emp.industry, emp.name)}
                avatarColor="#FFFFFF"
                title={emp.name}
                subtitle={`${emp.industry || 'General'}${emp.location ? ` • ${emp.location}` : ''}`}
                status={{ label: emp.status || 'Active', tone: statusTone, showDot: true }}
                onCardClick={() => {
                  setProfileEmployer(emp);
                  setProfileTab(0);
                }}
                fields={[
                  {
                    label: 'Contact Person',
                    value: emp.contactPerson || '—',
                    icon: <PersonIcon sx={{ fontSize: 13 }} />
                  },
                  {
                    label: 'Phone',
                    value: emp.phone || '—',
                    icon: <PhoneIcon sx={{ fontSize: 13 }} />
                  },
                  {
                    label: 'Active OJT / Trainees',
                    value: `${ojtCount} OJT • ${placedCount} Placed`,
                    icon: <SchoolIcon sx={{ fontSize: 13 }} />
                  },
                  {
                    label: 'Vacancies',
                    value: `${emp.ojtCapacity || 5} Seats`,
                    icon: <WorkIcon sx={{ fontSize: 13 }} />
                  }
                ]}
                actions={[
                  {
                    label: 'View Profile',
                    icon: <VisibilityIcon sx={{ fontSize: 16 }} />,
                    color: '#0284C7',
                    bgColor: 'rgba(2, 132, 199, 0.09)',
                    onClick: () => {
                      setProfileEmployer(emp);
                      setProfileTab(0);
                    }
                  },
                  {
                    label: 'Call',
                    icon: <PhoneIcon sx={{ fontSize: 16 }} />,
                    color: '#0F766E',
                    bgColor: 'rgba(15, 118, 110, 0.09)',
                    href: `tel:${emp.phone}`,
                    hidden: !emp.phone
                  },
                  {
                    label: 'WhatsApp',
                    icon: <WhatsAppIcon sx={{ fontSize: 16 }} />,
                    color: '#16A34A',
                    bgColor: 'rgba(22, 163, 74, 0.09)',
                    href: getWhatsAppUrl(emp.phone, 'Namaste, greetings from Prabidhik School, Jorpati.'),
                    target: '_blank',
                    hidden: !emp.phone
                  },
                  {
                    label: 'Assign OJT',
                    icon: <SchoolIcon sx={{ fontSize: 16 }} />,
                    color: '#7C3AED',
                    bgColor: 'rgba(124, 58, 237, 0.09)',
                    onClick: () => {
                      setProfileEmployer(emp);
                      setProfileTab(1);
                      handleOpenAddOjtForEmployer(emp);
                    }
                  },
                  {
                    label: 'Post Job',
                    icon: <WorkIcon sx={{ fontSize: 16 }} />,
                    color: '#D97706',
                    bgColor: 'rgba(217, 119, 6, 0.09)',
                    onClick: () => {
                      setProfileEmployer(emp);
                      setProfileTab(2);
                      handleOpenAddPlacementForEmployer(emp);
                    }
                  },
                  {
                    label: 'Edit',
                    icon: <EditIcon sx={{ fontSize: 16 }} />,
                    color: '#0F2C59',
                    bgColor: 'rgba(15, 44, 89, 0.08)',
                    onClick: () => handleOpenEdit(emp)
                  }
                ]}
              />
            );
          }}
        />
      ) : (
        /* Card View */
        <Box>
          <Grid container spacing={2.5}>
            {filteredEmployers.map((emp, idx) => {
              const ojtCount = (db.ojts || []).filter((o) => o.employerId === emp.id).length;
              const placedCount = (db.placements || []).filter((p) => p.employerId === emp.id).length;

              return (
                <Grid item xs={12} sm={6} md={4} key={emp.id}>
                  <Card
                    sx={{
                      borderRadius: 3,
                      p: 2.5,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      border: '1px solid #e2e8f0',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
                        borderColor: '#cbd5e1'
                      }
                    }}
                  >
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={`#${idx + 1}`}
                            size="small"
                            sx={{ bgcolor: '#0b2545', color: '#ffffff', fontWeight: 800, fontSize: '0.72rem' }}
                          />
                          <Chip
                            label={emp.id}
                            size="small"
                            sx={{ bgcolor: '#f1f5f9', color: '#475569', fontWeight: 700, fontSize: '0.72rem' }}
                          />
                        </Box>
                        <Chip
                          label={emp.status}
                          size="small"
                          sx={{
                            bgcolor: emp.status === 'Active' ? '#e5f8ee' : '#fdeceb',
                            color: emp.status === 'Active' ? '#16834b' : '#d5372f',
                            fontWeight: 800
                          }}
                        />
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.2 }}>
                        <Avatar
                          sx={{
                            width: 42,
                            height: 42,
                            fontWeight: 800,
                            fontSize: '0.92rem',
                            letterSpacing: '0.03em',
                            bgcolor: getAvatarBg(emp.industry, emp.name),
                            color: '#ffffff',
                            borderRadius: '10px',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                          }}
                        >
                          {getInitials(emp.name)}
                        </Avatar>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.25 }}>
                          {emp.name}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mb: 1.8 }}>
                        <Chip
                          label={emp.industry || 'General'}
                          size="small"
                          sx={{ bgcolor: '#e8f0fd', color: '#1a56b0', fontWeight: 700, fontSize: '0.75rem' }}
                        />
                        {emp.location && (
                          <Chip
                            icon={<LocationOnIcon sx={{ fontSize: '14px !important' }} />}
                            label={emp.location}
                            size="small"
                            sx={{ bgcolor: '#f8fafc', color: '#475569', fontWeight: 600, fontSize: '0.75rem' }}
                          />
                        )}
                      </Box>

                      {/* Contact Person Details */}
                      <Box sx={{ bgcolor: '#f8fafc', p: 1.5, borderRadius: 2, mb: 2, border: '1px solid #f1f5f9' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.5 }}>
                          <PersonIcon sx={{ fontSize: 16, color: '#64748b' }} />
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155' }}>
                            {emp.contactPerson || 'Contact Person: N/A'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                            <PhoneIcon sx={{ fontSize: 15, color: '#64748b' }} />
                            <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600 }}>
                              {emp.phone || 'No Phone'}
                            </Typography>
                          </Box>
                          {emp.phone && (
                            <IconButton
                              size="small"
                              component="a"
                              href={getWhatsAppUrl(emp.phone, `Namaste, greetings from KITE Training Center.`)}
                              target="_blank"
                              sx={{
                                bgcolor: '#25D366',
                                color: '#ffffff',
                                p: '4px',
                                '&:hover': { bgcolor: '#1ebc59' }
                              }}
                            >
                              <WhatsAppIcon sx={{ fontSize: 15 }} />
                            </IconButton>
                          )}
                        </Box>
                      </Box>

                      {/* Stats Badges */}
                      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <Box
                          sx={{
                            flex: 1,
                            p: 1,
                            borderRadius: 1.5,
                            bgcolor: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                            textAlign: 'center'
                          }}
                        >
                          <Typography variant="caption" sx={{ color: '#166534', fontWeight: 700, display: 'block', fontSize: '0.7rem' }}>
                            ACTIVE OJT
                          </Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#15803d' }}>
                            {ojtCount} Trainees
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            flex: 1,
                            p: 1,
                            borderRadius: 1.5,
                            bgcolor: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            textAlign: 'center'
                          }}
                        >
                          <Typography variant="caption" sx={{ color: '#1e40af', fontWeight: 700, display: 'block', fontSize: '0.7rem' }}>
                            PLACEMENTS
                          </Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#1d4ed8' }}>
                            {placedCount} Placed
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    {/* Action Buttons */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1.5, borderTop: '1px solid #f1f5f9' }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<VisibilityIcon />}
                        onClick={() => {
                          setProfileEmployer(emp);
                          setProfileTab(0);
                        }}
                        sx={{ fontWeight: 700, textTransform: 'none', fontSize: '0.78rem' }}
                      >
                        360° Profile
                      </Button>

                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenEdit(emp)}
                          sx={{ color: '#1a56b0', bgcolor: '#f1f5f9', '&:hover': { bgcolor: '#e2e8f0' } }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(emp.id)}
                          sx={{ color: '#d5372f', bgcolor: '#fef2f2', '&:hover': { bgcolor: '#fee2e2' } }}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
          {filteredEmployers.length === 0 && (
            <Card sx={{ p: 5, textAlign: 'center', borderRadius: 3, bgcolor: '#f8fafc', border: '1px dashed #cbd5e1' }}>
              <Typography variant="body1" sx={{ color: '#64748b', fontWeight: 700 }}>
                No employer partners found matching "{searchTerm}"
              </Typography>
            </Card>
          )}
        </Box>
      )}

      {/* Add / Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        BackdropProps={{
          sx: { backdropFilter: 'blur(5px)', bgcolor: 'rgba(15, 23, 42, 0.45)' }
        }}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 3.5,
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
            border: '1px solid rgba(226, 232, 240, 0.8)'
          }
        }}
      >
        <DialogTitle
          sx={{
            p: { xs: 2, sm: 2.5 },
            background: 'linear-gradient(135deg, #0F2C59 0%, #1E3A8A 100%)',
            color: '#FFFFFF',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '3px solid #F59E0B'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.15)', color: '#FFFFFF', width: 44, height: 44, borderRadius: 2.5, border: '1px solid rgba(255, 255, 255, 0.25)' }}>
              <BusinessIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, fontSize: '1.05rem', lineHeight: 1.2, color: '#FFFFFF' }}>
                {editingItem ? 'Edit Employer Partner' : 'Add Employer Partner'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.74rem' }}>
                {editingItem ? 'Update organization contact person and MoU agreement details' : 'Register a new partner organization for OJT and career placement collaboration'}
              </Typography>
            </Box>
          </Box>
          <IconButton
            size="small"
            aria-label="Close employer dialog"
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
            p: { xs: 2, sm: 2.5 },
            bgcolor: '#F8FAFC',
            '&::-webkit-scrollbar': { width: 6 },
            '&::-webkit-scrollbar-track': { background: '#F1F5F9' },
            '&::-webkit-scrollbar-thumb': { background: '#CBD5E1', borderRadius: 3 },
            '&::-webkit-scrollbar-thumb:hover': { background: '#94A3B8' }
          }}
        >
          <Stack spacing={2}>
            {/* Section 1: Organization Profile */}
            <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F2C59', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#0F2C59' }} />
                1. Organization Profile
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Organization / Company Name"
                    fullWidth
                    size="small"
                    placeholder="e.g. Organization Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Industry / Field"
                    fullWidth
                    size="small"
                    placeholder="e.g. Hospital & Healthcare"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Office Location"
                    fullWidth
                    size="small"
                    placeholder="e.g. Thapathali, Kathmandu"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Section 2: Primary Contact & Status */}
            <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F2C59', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#2563EB' }} />
                2. Primary Contact & Status
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Contact Person Name"
                    fullWidth
                    size="small"
                    placeholder="e.g. Dr. Rajesh KC (HR Head)"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Official Mobile / Phone"
                    fullWidth
                    size="small"
                    placeholder="98XXXXXXXX"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Email Address"
                    fullWidth
                    size="small"
                    placeholder="hr@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="Status"
                    fullWidth
                    size="small"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <MenuItem value="Active">Active Partner</MenuItem>
                    <MenuItem value="Pending Approval">Pending Approval</MenuItem>
                    <MenuItem value="Inactive">Inactive</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
            </Paper>

            {/* Section 3: OJT Capacity & MoU Agreement */}
            <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F2C59', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#059669' }} />
                3. OJT Capacity & MoU Agreement
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="OJT Seat Capacity"
                    type="number"
                    fullWidth
                    size="small"
                    placeholder="e.g. 5"
                    value={formData.ojtCapacity || ''}
                    onChange={(e) => setFormData({ ...formData, ojtCapacity: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="MoU Agreement Status"
                    fullWidth
                    size="small"
                    value={formData.mouStatus || 'Signed'}
                    onChange={(e) => setFormData({ ...formData, mouStatus: e.target.value })}
                  >
                    <MenuItem value="Signed">Signed MoU</MenuItem>
                    <MenuItem value="Pending Renewal">Pending Renewal</MenuItem>
                    <MenuItem value="Trial / Verbal">Trial / Verbal</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="MoU Terms / Notes"
                    multiline
                    rows={2}
                    fullWidth
                    size="small"
                    placeholder="Additional details regarding the Memorandum of Understanding (MoU)..."
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Stack>
        </DialogContent>
        <DialogActions
          sx={{
            p: { xs: 1.5, sm: 2.5 },
            pb: isMobile ? 'calc(14px + env(safe-area-inset-bottom))' : 2.5,
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
            Save Employer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Employer 360° Profile Dossier Dialog */}
      <Dialog
        open={Boolean(profileEmployer)}
        onClose={() => setProfileEmployer(null)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3, overflow: 'hidden' } }}
      >
        {profileEmployer && (() => {
          const employerOjts = (db.ojts || []).filter((o) => o.employerId === profileEmployer.id);
          const ongoingOjtCount = employerOjts.filter((o) => o.status === 'Ongoing').length;
          const ojtCap = Number(profileEmployer.ojtCapacity) || 5;
          const employerPlacements = (db.placements || []).filter((p) => p.employerId === profileEmployer.id);

          // Parse numeric salary from either p.salary or p.expectedSalary (e.g. "NPR 25,000 / month")
          const parsedSalaries = employerPlacements
            .map((p) => {
              const raw = p.salary ?? p.expectedSalary ?? '';
              const num = Number(String(raw).replace(/[^0-9.]/g, ''));
              return Number.isFinite(num) && num > 0 ? num : 0;
            })
            .filter((n) => n > 0);
          const avgSalary =
            parsedSalaries.length > 0
              ? `NPR ${Math.round(parsedSalaries.reduce((a, b) => a + b, 0) / parsedSalaries.length).toLocaleString()}`
              : '—';

          const portalUrl = `${window.location.origin}/?portal=employer`;
          const handleCopyPortal = () => {
            navigator.clipboard?.writeText(portalUrl);
            setCopiedPortalLink(true);
            setTimeout(() => setCopiedPortalLink(false), 2500);
          };

          return (
            <>
              <DialogTitle
                sx={{
                  py: 1.75,
                  px: 2.5,
                  background: 'linear-gradient(135deg, #0F2C59 0%, #1E3A8A 100%)',
                  color: '#FFFFFF',
                  borderBottom: '2.5px solid #F59E0B'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75, flexWrap: 'wrap' }}>
                  <Avatar
                    sx={{
                      width: 46,
                      height: 46,
                      bgcolor: getAvatarBg(profileEmployer.industry, profileEmployer.name),
                      border: '2px solid rgba(255,255,255,0.35)',
                      fontWeight: 800,
                      fontSize: '0.95rem'
                    }}
                  >
                    {getInitials(profileEmployer.name)}
                  </Avatar>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={0.8} alignItems="center" flexWrap="wrap" useFlexGap>
                      <Typography variant="subtitle1" noWrap sx={{ fontWeight: 800, color: '#FFFFFF', fontSize: '1.05rem' }}>
                        {profileEmployer.name}
                      </Typography>
                      <Chip
                        label={profileEmployer.id}
                        size="small"
                        sx={{ height: 20, fontWeight: 800, fontSize: '0.68rem', bgcolor: 'rgba(255,255,255,0.16)', color: '#FDE68A' }}
                      />
                      <Chip
                        label={profileEmployer.status}
                        size="small"
                        sx={{
                          height: 20,
                          fontWeight: 800,
                          fontSize: '0.68rem',
                          bgcolor: profileEmployer.status === 'Active' ? 'rgba(16,185,129,0.22)' : 'rgba(255,255,255,0.14)',
                          color: profileEmployer.status === 'Active' ? '#A7F3D0' : '#E2E8F0'
                        }}
                      />
                      <Chip
                        label={`MoU: ${profileEmployer.mouStatus || 'Signed'}`}
                        size="small"
                        sx={{ height: 20, fontWeight: 700, fontSize: '0.66rem', bgcolor: 'rgba(245,158,11,0.22)', color: '#FEF3C7' }}
                      />
                    </Stack>
                    <Typography variant="caption" noWrap sx={{ color: '#CBD5E1', display: 'block', mt: 0.25, fontSize: '0.73rem' }}>
                      {profileEmployer.industry || 'Industry Partner'} • {profileEmployer.location || 'Kathmandu'} • {profileEmployer.contactPerson || 'HR'} ({profileEmployer.phone})
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={0.6} alignItems="center">
                    {profileEmployer.phone && (
                      <Tooltip title={`Call ${profileEmployer.phone}`}>
                        <IconButton
                          size="small"
                          component="a"
                          href={`tel:${profileEmployer.phone}`}
                          aria-label={`Call ${profileEmployer.name}`}
                          sx={{ color: '#FFFFFF', bgcolor: 'rgba(255,255,255,0.12)', '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' } }}
                        >
                          <PhoneIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {profileEmployer.email && (
                      <Tooltip title={`Email ${profileEmployer.email}`}>
                        <IconButton
                          size="small"
                          component="a"
                          href={`mailto:${profileEmployer.email}`}
                          aria-label={`Email ${profileEmployer.name}`}
                          sx={{ color: '#93C5FD', bgcolor: 'rgba(255,255,255,0.12)', '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' } }}
                        >
                          <EmailIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Message on WhatsApp">
                      <IconButton
                        size="small"
                        component="a"
                        href={getWhatsAppUrl(profileEmployer.phone, `Namaste ${profileEmployer.contactPerson || 'Team'}, greetings from Prabidhik School, Jorpati (Global Era Multi Service Pvt. Ltd.).`)}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`WhatsApp ${profileEmployer.name}`}
                        sx={{ color: '#4ADE80', bgcolor: 'rgba(37,211,102,0.18)', '&:hover': { bgcolor: 'rgba(37,211,102,0.3)' } }}
                      >
                        <WhatsAppIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit Partner Details">
                      <IconButton
                        size="small"
                        aria-label={`Edit ${profileEmployer.name}`}
                        onClick={() => handleOpenEdit(profileEmployer)}
                        sx={{ color: '#FCD34D', bgcolor: 'rgba(255,255,255,0.12)', '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' } }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <IconButton
                      size="small"
                      aria-label="Close partner profile"
                      onClick={() => setProfileEmployer(null)}
                      sx={{ color: '#E2E8F0', '&:hover': { bgcolor: 'rgba(255,255,255,0.18)' } }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Box>
              </DialogTitle>

              <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, bgcolor: '#F8FAFC' }}>
                <Tabs
                  value={profileTab}
                  onChange={(e, v) => setProfileTab(v)}
                  variant="scrollable"
                  scrollButtons="auto"
                  allowScrollButtonsMobile
                  sx={{ minHeight: 40, '& .MuiTab-root': { minHeight: 40, py: 0.75, fontSize: '0.78rem', fontWeight: 800 } }}
                >
                  <Tab label="1. Overview & MoU" />
                  <Tab label={`2. OJT Trainees (${employerOjts.length})`} />
                  <Tab label={`3. Placed Graduates (${employerPlacements.length})`} />
                </Tabs>
              </Box>

              <DialogContent sx={{ py: 2, px: { xs: 2, sm: 2.5 }, bgcolor: '#FFFFFF' }}>
                {profileTab === 0 && (
                  <Box>
                    <Grid container spacing={1.5} sx={{ mb: 2 }}>
                      <Grid item xs={6} sm={3}>
                        <Card elevation={0} sx={{ p: 1.4, borderRadius: 2, borderLeft: '3.5px solid #1E40AF' }}>
                          <Typography variant="caption" noWrap sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.66rem', textTransform: 'uppercase', display: 'block' }}>
                            Total OJT Assigned
                          </Typography>
                          <Typography sx={{ fontWeight: 800, color: '#0F2C59', fontSize: '1.18rem', mt: 0.2 }}>
                            {employerOjts.length}
                          </Typography>
                        </Card>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Card elevation={0} sx={{ p: 1.4, borderRadius: 2, borderLeft: '3.5px solid #059669' }}>
                          <Typography variant="caption" noWrap sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.66rem', textTransform: 'uppercase', display: 'block' }}>
                            Active OJT / Seats
                          </Typography>
                          <Typography sx={{ fontWeight: 800, color: '#059669', fontSize: '1.18rem', mt: 0.2 }}>
                            {ongoingOjtCount} / {ojtCap}
                          </Typography>
                        </Card>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Card elevation={0} sx={{ p: 1.4, borderRadius: 2, borderLeft: '3.5px solid #D97706' }}>
                          <Typography variant="caption" noWrap sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.66rem', textTransform: 'uppercase', display: 'block' }}>
                            Graduates Hired
                          </Typography>
                          <Typography sx={{ fontWeight: 800, color: '#B45309', fontSize: '1.18rem', mt: 0.2 }}>
                            {employerPlacements.length}
                          </Typography>
                        </Card>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Card elevation={0} sx={{ p: 1.4, borderRadius: 2, borderLeft: '3.5px solid #7C3AED' }}>
                          <Typography variant="caption" noWrap sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.66rem', textTransform: 'uppercase', display: 'block' }}>
                            Avg. Salary
                          </Typography>
                          <Typography noWrap sx={{ fontWeight: 800, color: '#7C3AED', fontSize: '1.08rem', mt: 0.2 }}>
                            {avgSalary}
                          </Typography>
                        </Card>
                      </Grid>
                    </Grid>

                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<WorkIcon sx={{ fontSize: '15px !important' }} />}
                        onClick={handleOpenAddOjtForEmployer}
                        sx={{ bgcolor: '#0F2C59', fontWeight: 700 }}
                      >
                        Deploy OJT Trainee
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<SchoolIcon sx={{ fontSize: '15px !important' }} />}
                        onClick={handleOpenAddPlacementForEmployer}
                        sx={{ bgcolor: '#059669', fontWeight: 700, '&:hover': { bgcolor: '#047857' } }}
                      >
                        Record Placement (EPP)
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={handleCopyPortal}
                        sx={{ borderColor: '#CBD5E1', color: '#0F2C59', fontWeight: 700 }}
                      >
                        {copiedPortalLink ? '✓ Portal Link Copied' : 'Copy Employer Portal Link'}
                      </Button>
                    </Stack>

                    <Grid container spacing={1.5}>
                      <Grid item xs={12} sm={6}>
                        <Paper variant="outlined" sx={{ p: 1.75, borderRadius: 2, height: '100%' }}>
                          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.68rem' }}>
                            Partner Organization Details
                          </Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, mt: 0.5, color: '#0F2C59' }}>
                            {profileEmployer.name}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#475569', mt: 0.4 }}>
                            Sector: <b>{profileEmployer.industry || '—'}</b>
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#475569' }}>
                            Location: <b>{profileEmployer.location || '—'}</b>
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#475569' }}>
                            Official Email: <b>{profileEmployer.email || '—'}</b>
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Paper variant="outlined" sx={{ p: 1.75, borderRadius: 2, height: '100%' }}>
                          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.68rem' }}>
                            Contact Person &amp; MoU Terms
                          </Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, mt: 0.5, color: '#0F2C59' }}>
                            {profileEmployer.contactPerson || 'HR / Coordinator'}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#475569', mt: 0.4 }}>
                            Phone: <b>{profileEmployer.phone}</b>
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#475569' }}>
                            MoU Status: <b>{profileEmployer.mouStatus || 'Signed'}</b> • Capacity: <b>{ojtCap} Seats</b>
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.6 }}>
                            Notes: {profileEmployer.remarks || 'Standard training & placement partner agreement with Prabidhik School, Jorpati.'}
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Box>
                )}

                {profileTab === 1 && (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F2C59' }}>
                        OJT Trainees Assigned ({employerOjts.length})
                      </Typography>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<AddIcon sx={{ fontSize: '15px !important' }} />}
                        onClick={handleOpenAddOjtForEmployer}
                        sx={{ bgcolor: '#0F2C59', fontWeight: 700 }}
                      >
                        Assign OJT Trainee
                      </Button>
                    </Box>

                    {employerOjts.length === 0 ? (
                      <Box sx={{ py: 4, textAlign: 'center', bgcolor: '#F8FAFC', borderRadius: 2, border: '1px dashed #CBD5E1' }}>
                        <WorkIcon sx={{ fontSize: 38, color: '#94A3B8', mb: 0.8 }} />
                        <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 600, mb: 1.5 }}>
                          No trainees assigned to OJT with this employer yet.
                        </Typography>
                        <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={handleOpenAddOjtForEmployer}>
                          Assign First OJT Trainee
                        </Button>
                      </Box>
                    ) : (
                      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2, border: '1px solid #E2E8F0', overflowX: 'auto' }}>
                        <Table size="small">
                          <TableHead sx={{ '& .MuiTableCell-head': { bgcolor: '#0F2E5A', color: '#FFFFFF', fontWeight: 800, fontSize: '0.72rem', py: 0.9, borderBottom: '2px solid #F59E0B', whiteSpace: 'nowrap' } }}>
                            <TableRow>
                              <TableCell>Trainee</TableCell>
                              <TableCell>Course &amp; Shift</TableCell>
                              <TableCell>Duration</TableCell>
                              <TableCell>Status</TableCell>
                              <TableCell align="right">Action</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {employerOjts.map((ojt) => {
                              const std = (db.students || []).find((s) => s.id === ojt.studentId);
                              const grp = (db.trainingGroups || []).find((g) => g.id === std?.groupId);
                              const course = (db.courses || []).find((c) => c.id === grp?.courseId);
                              return (
                                <TableRow key={ojt.id} hover>
                                  <TableCell>
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F2C59', fontSize: '0.79rem' }}>
                                      {std?.name || 'Student'}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.68rem' }}>
                                      {std?.tgid || ojt.studentId}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', display: 'block' }}>
                                      {course?.title || 'Vocational Course'}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.68rem' }}>
                                      Shift {grp?.shift || 'A'} • Sup: {ojt.relatedPerson || profileEmployer.contactPerson}
                                    </Typography>
                                  </TableCell>
                                  <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.75rem' }}>
                                    {ojt.startDate} → {ojt.endDate || 'Ongoing'}
                                  </TableCell>
                                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                    <Chip
                                      label={ojt.status}
                                      size="small"
                                      sx={{
                                        height: 20,
                                        fontSize: '0.68rem',
                                        bgcolor: ojt.status === 'Completed' ? '#ECFDF5' : '#EFF6FF',
                                        color: ojt.status === 'Completed' ? '#047857' : '#1E40AF',
                                        fontWeight: 800
                                      }}
                                    />
                                  </TableCell>
                                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      onClick={() => std && setSelectedStudentForProfile(std)}
                                      sx={{ px: 0.9, py: 0.25, fontSize: '0.7rem' }}
                                    >
                                      Profile
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </Box>
                )}

                {profileTab === 2 && (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F2C59' }}>
                        Graduates Placed &amp; Employed ({employerPlacements.length})
                      </Typography>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<AddIcon sx={{ fontSize: '15px !important' }} />}
                        onClick={handleOpenAddPlacementForEmployer}
                        sx={{ bgcolor: '#059669', fontWeight: 700, '&:hover': { bgcolor: '#047857' } }}
                      >
                        Record Placement (EPP)
                      </Button>
                    </Box>

                    {employerPlacements.length === 0 ? (
                      <Box sx={{ py: 4, textAlign: 'center', bgcolor: '#F8FAFC', borderRadius: 2, border: '1px dashed #CBD5E1' }}>
                        <BusinessIcon sx={{ fontSize: 38, color: '#94A3B8', mb: 0.8 }} />
                        <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 600, mb: 1.5 }}>
                          No graduates placed with this employer partner yet.
                        </Typography>
                        <Button size="small" variant="contained" color="success" startIcon={<AddIcon />} onClick={handleOpenAddPlacementForEmployer}>
                          Record First Placement
                        </Button>
                      </Box>
                    ) : (
                      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2, border: '1px solid #E2E8F0', overflowX: 'auto' }}>
                        <Table size="small">
                          <TableHead sx={{ '& .MuiTableCell-head': { bgcolor: '#0F2E5A', color: '#FFFFFF', fontWeight: 800, fontSize: '0.72rem', py: 0.9, borderBottom: '2px solid #F59E0B', whiteSpace: 'nowrap' } }}>
                            <TableRow>
                              <TableCell>Graduate</TableCell>
                              <TableCell>Job Role &amp; Course</TableCell>
                              <TableCell>Salary</TableCell>
                              <TableCell>Status</TableCell>
                              <TableCell align="right">Action</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {employerPlacements.map((plc) => {
                              const std = (db.students || []).find((s) => s.id === plc.studentId);
                              const grp = (db.trainingGroups || []).find((g) => g.id === std?.groupId);
                              const course = (db.courses || []).find((c) => c.id === grp?.courseId);
                              return (
                                <TableRow key={plc.id} hover>
                                  <TableCell>
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F2C59', fontSize: '0.79rem' }}>
                                      {std?.name || 'Graduate'}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.68rem' }}>
                                      {std?.tgid || plc.studentId}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#047857', display: 'block' }}>
                                      {plc.targetJob} ({plc.employmentType || 'Full-time'})
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.68rem' }}>
                                      {course?.title || 'Vocational Training'}
                                    </Typography>
                                  </TableCell>
                                  <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 700, color: '#0F2C59', fontSize: '0.76rem' }}>
                                    {plc.expectedSalary || (plc.salary ? `NPR ${Number(plc.salary).toLocaleString()}` : 'Negotiated')}
                                  </TableCell>
                                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                    <Chip
                                      label={plc.status}
                                      size="small"
                                      sx={{
                                        height: 20,
                                        fontSize: '0.68rem',
                                        bgcolor: plc.status === 'Placed' ? '#ECFDF5' : '#FFFBEB',
                                        color: plc.status === 'Placed' ? '#047857' : '#B45309',
                                        fontWeight: 800
                                      }}
                                    />
                                  </TableCell>
                                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      onClick={() => std && setSelectedStudentForProfile(std)}
                                      sx={{ px: 0.9, py: 0.25, fontSize: '0.7rem' }}
                                    >
                                      Profile
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </Box>
                )}
              </DialogContent>

              <DialogActions sx={{ px: 2.5, py: 1.25, pb: isMobile ? 'calc(14px + env(safe-area-inset-bottom))' : 1.25 }}>
                <Button size="small" onClick={() => setProfileEmployer(null)}>Close</Button>
              </DialogActions>
            </>
          );
        })()}
      </Dialog>

      {/* Accessible AlertDialog for Partner Deletion */}
      <Dialog
        open={Boolean(confirmDeleteEmp)}
        onClose={() => setConfirmDeleteEmp(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ role: 'alertdialog', 'aria-labelledby': 'delete-employer-title' }}
      >
        <DialogTitle id="delete-employer-title" sx={{ fontWeight: 800, fontSize: '0.96rem' }}>
          Delete Employer Partner?
        </DialogTitle>
        <DialogContent sx={{ pt: 2, pb: 1 }}>
          <Typography variant="body2" sx={{ color: '#334155', mt: 1 }}>
            Are you sure you want to remove <strong>{confirmDeleteEmp?.name}</strong> from the Partner Registry?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, py: 1.5 }}>
          <Button size="small" onClick={() => setConfirmDeleteEmp(null)} sx={{ color: '#64748B' }}>
            Cancel
          </Button>
          <Button size="small" variant="contained" color="error" onClick={handleConfirmDelete}>
            Yes, Delete Partner
          </Button>
        </DialogActions>
      </Dialog>

      {/* In-Employer Add OJT Modal */}
      <Dialog
        open={openAddOjtModal}
        onClose={() => setOpenAddOjtModal(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          Assign OJT Trainee to {profileEmployer?.name}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label="Select Student / Trainee"
              fullWidth
              value={newOjtData.studentId}
              onChange={(e) => setNewOjtData({ ...newOjtData, studentId: e.target.value })}
              required
            >
              {(db.students || []).map((s) => {
                const grp = (db.trainingGroups || []).find((g) => g.id === s.groupId);
                const crs = (db.courses || []).find((c) => c.id === grp?.courseId);
                return (
                  <MenuItem key={s.id} value={s.id}>
                    <b>{s.name}</b> ({s.tgid}) • {crs?.title || 'Course'} - Shift {grp?.shift || 'A'}
                  </MenuItem>
                );
              })}
            </TextField>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  type="date"
                  label="OJT Start Date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={newOjtData.startDate}
                  onChange={(e) => setNewOjtData({ ...newOjtData, startDate: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  type="date"
                  label="OJT End Date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={newOjtData.endDate}
                  onChange={(e) => setNewOjtData({ ...newOjtData, endDate: e.target.value })}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Supervisor Name"
                  fullWidth
                  value={newOjtData.relatedPerson}
                  onChange={(e) => setNewOjtData({ ...newOjtData, relatedPerson: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Supervisor Phone"
                  fullWidth
                  value={newOjtData.contactNumber}
                  onChange={(e) => setNewOjtData({ ...newOjtData, contactNumber: e.target.value })}
                />
              </Grid>
            </Grid>

            <TextField
              select
              label="Status"
              fullWidth
              value={newOjtData.status}
              onChange={(e) => setNewOjtData({ ...newOjtData, status: e.target.value })}
            >
              <MenuItem value="Ongoing">Ongoing</MenuItem>
              <MenuItem value="Planned">Planned</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
            </TextField>

            <TextField
              label="Department / Assignment Notes"
              fullWidth
              multiline
              rows={2}
              value={newOjtData.remarks}
              onChange={(e) => setNewOjtData({ ...newOjtData, remarks: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, pb: isMobile ? 'calc(14px + env(safe-area-inset-bottom))' : 2 }}>
          <Button onClick={() => setOpenAddOjtModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveOjtForEmployer} sx={{ fontWeight: 800, bgcolor: '#1a56b0' }}>
            Assign OJT
          </Button>
        </DialogActions>
      </Dialog>

      {/* In-Employer Add Placement Modal */}
      <Dialog
        open={openAddPlacementModal}
        onClose={() => setOpenAddPlacementModal(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          Record Placed Graduate at {profileEmployer?.name}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label="Select Graduate / Candidate"
              fullWidth
              value={newPlacementData.studentId}
              onChange={(e) => setNewPlacementData({ ...newPlacementData, studentId: e.target.value })}
              required
            >
              {(db.students || []).map((s) => {
                const grp = (db.trainingGroups || []).find((g) => g.id === s.groupId);
                const crs = (db.courses || []).find((c) => c.id === grp?.courseId);
                return (
                  <MenuItem key={s.id} value={s.id}>
                    <b>{s.name}</b> ({s.tgid}) • {crs?.title || 'Course'} - Shift {grp?.shift || 'A'}
                  </MenuItem>
                );
              })}
            </TextField>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Target Job Role / Designation"
                  fullWidth
                  value={newPlacementData.targetJob}
                  onChange={(e) => setNewPlacementData({ ...newPlacementData, targetJob: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Employment Type"
                  fullWidth
                  value={newPlacementData.employmentType}
                  onChange={(e) => setNewPlacementData({ ...newPlacementData, employmentType: e.target.value })}
                >
                  <MenuItem value="Full-Time Employee">Full-Time Employee</MenuItem>
                  <MenuItem value="Part-Time Employee">Part-Time Employee</MenuItem>
                  <MenuItem value="Foreign Employment">Foreign Employment</MenuItem>
                  <MenuItem value="Contract Based">Contract Based</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Monthly Salary / Income"
                  fullWidth
                  value={newPlacementData.expectedSalary}
                  onChange={(e) => setNewPlacementData({ ...newPlacementData, expectedSalary: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  type="date"
                  label="Placement Date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={newPlacementData.placementDate}
                  onChange={(e) => setNewPlacementData({ ...newPlacementData, placementDate: e.target.value })}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Work Schedule / Shift"
                  fullWidth
                  value={newPlacementData.workSchedule}
                  onChange={(e) => setNewPlacementData({ ...newPlacementData, workSchedule: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  select
                  label="Placement Status"
                  fullWidth
                  value={newPlacementData.status}
                  onChange={(e) => setNewPlacementData({ ...newPlacementData, status: e.target.value })}
                >
                  <MenuItem value="Placed">Placed</MenuItem>
                  <MenuItem value="Interview Scheduled">Interview Scheduled</MenuItem>
                  <MenuItem value="Offer Issued">Offer Issued</MenuItem>
                  <MenuItem value="Seeking">Seeking</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            <TextField
              label="Remarks / Notes"
              fullWidth
              multiline
              rows={2}
              value={newPlacementData.remarks}
              onChange={(e) => setNewPlacementData({ ...newPlacementData, remarks: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, pb: isMobile ? 'calc(14px + env(safe-area-inset-bottom))' : 2 }}>
          <Button onClick={() => setOpenAddPlacementModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSavePlacementForEmployer} sx={{ fontWeight: 800, bgcolor: '#16834b' }}>
            Record Placement
          </Button>
        </DialogActions>
      </Dialog>

      {/* Two-way Student Profile Modal */}
      <StudentProfileModal
        open={Boolean(selectedStudentForProfile)}
        student={selectedStudentForProfile}
        db={db}
        setDb={setDb}
        onClose={() => setSelectedStudentForProfile(null)}
      />
    </Box>
  );
}
