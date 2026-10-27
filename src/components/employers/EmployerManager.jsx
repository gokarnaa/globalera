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
  ToggleButtonGroup
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
    status: 'Active',
    remarks: ''
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      industry: '',
      location: '',
      contactPerson: '',
      phone: '',
      email: '',
      status: 'Active',
      remarks: ''
    });
    setOpenDialog(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({ ...item });
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
    if (window.confirm('Delete this employer master?')) {
      const nextDb = {
        ...db,
        employers: db.employers.filter((x) => x.id !== id)
      };
      saveDB(nextDb);
      setDb(nextDb);
    }
  };

  const handleOpenAddOjtForEmployer = () => {
    if (!profileEmployer) return;
    setNewOjtData({
      studentId: '',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: '',
      relatedPerson: profileEmployer.contactPerson || '',
      contactNumber: profileEmployer.phone || '',
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

  const handleOpenAddPlacementForEmployer = () => {
    if (!profileEmployer) return;
    setNewPlacementData({
      studentId: '',
      targetJob: '',
      preferredLocation: profileEmployer.location || '',
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
    <Box>
      {/* Top Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <BusinessIcon sx={{ color: '#1a56b0', fontSize: 32 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#152238' }}>
              Employer Master (रोजगारदाता)
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#647089', mt: 0.5 }}>
            Reusable partner institutions for OJT training and student career placements.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd} sx={{ fontWeight: 800 }}>
            + Add Employer Partner
          </Button>
        </Box>
      </Box>

      {/* KPI Summary Cards */}
      <Card sx={{ p: 2, mb: 3, bgcolor: '#ffffff', borderRadius: 3, border: '1px solid #e2e8f0' }}>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#f8fafc', borderRadius: 2 }}>
              <Typography variant="caption" sx={{ color: '#647089', fontWeight: 700, display: 'block' }}>
                TOTAL PARTNERS
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 900, color: '#0f172a' }}>
                {totalEmployers}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#f0fdf4', borderRadius: 2 }}>
              <Typography variant="caption" sx={{ color: '#166534', fontWeight: 700, display: 'block' }}>
                ACTIVE PARTNERS
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 900, color: '#15803d' }}>
                {activeEmployers}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#eff6ff', borderRadius: 2 }}>
              <Typography variant="caption" sx={{ color: '#1e40af', fontWeight: 700, display: 'block' }}>
                TOTAL OJT DEPLOYED
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 900, color: '#1d4ed8' }}>
                {totalOjt} Trainees
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#fefce8', borderRadius: 2 }}>
              <Typography variant="caption" sx={{ color: '#854d0e', fontWeight: 700, display: 'block' }}>
                TOTAL PLACED
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 900, color: '#a16207' }}>
                {totalPlaced} Graduates
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Card>

      {/* Filter & View Switcher Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', flexGrow: 1 }}>
          <TextField
            size="small"
            placeholder="Search by employer name, industry, location, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ width: { xs: '100%', sm: 340 }, bgcolor: '#ffffff' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: '#647089' }} />
                </InputAdornment>
              )
            }}
          />

          <Box sx={{ display: 'flex', gap: 0.8 }}>
            {['All', 'Active', 'Inactive'].map((status) => (
              <Chip
                key={status}
                label={status}
                clickable
                color={statusFilter === status ? 'primary' : 'default'}
                onClick={() => setStatusFilter(status)}
                sx={{ fontWeight: 700, fontSize: '0.8rem' }}
              />
            ))}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="body2" sx={{ color: '#647089', fontWeight: 700 }}>
            Showing {filteredEmployers.length} of {totalEmployers}
          </Typography>

          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, next) => next && setViewMode(next)}
            size="small"
            sx={{ bgcolor: '#ffffff' }}
          >
            <ToggleButton value="table" title="Table View">
              <ViewListIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="card" title="Card View">
              <ViewModuleIcon fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {/* Main Content: Table View vs Card View */}
      {viewMode === 'table' ? (
        <Card sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, width: '70px', color: '#0f172a' }}>क्र.सं. (S.N.)</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Employer / Organization</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Industry & Sector</TableCell>
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
                      <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>
                        {idx + 1}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar
                            sx={{
                              width: 38,
                              height: 38,
                              fontWeight: 800,
                              fontSize: '0.88rem',
                              letterSpacing: '0.03em',
                              bgcolor: getAvatarBg(emp.industry, emp.name),
                              color: '#ffffff',
                              borderRadius: '10px',
                              boxShadow: '0 2px 5px rgba(0,0,0,0.08)'
                            }}
                          >
                            {getInitials(emp.name)}
                          </Avatar>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: 800,
                              color: '#0f172a',
                              fontSize: '0.93rem'
                            }}
                          >
                            {emp.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={emp.industry || 'General'} size="small" sx={{ bgcolor: '#e8f0fd', color: '#1a56b0', fontWeight: 700 }} />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{emp.location || '—'}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {emp.contactPerson || '—'}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" sx={{ color: '#647089' }}>{emp.phone}</Typography>
                          {emp.phone && (
                            <IconButton
                              size="small"
                              component="a"
                              href={getWhatsAppUrl(emp.phone, `Namaste, greetings from KITE Training Center.`)}
                              target="_blank"
                              sx={{ color: '#25D366' }}
                            >
                              <WhatsAppIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={`${ojtCount} OJT • ${placedCount} Placed`} size="small" sx={{ bgcolor: '#e5f8ee', color: '#16834b', fontWeight: 700 }} />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={emp.status}
                          size="small"
                          sx={{
                            bgcolor: emp.status === 'Active' ? '#e5f8ee' : '#fdeceb',
                            color: emp.status === 'Active' ? '#16834b' : '#d5372f',
                            fontWeight: 700
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ textAlign: 'right' }}>
                        <Tooltip title="View Employer 360° Profile">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setProfileEmployer(emp);
                              setProfileTab(0);
                            }}
                            sx={{ color: '#1a56b0' }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <IconButton size="small" onClick={() => handleOpenEdit(emp)} sx={{ color: '#1a56b0' }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDelete(emp.id)} sx={{ color: '#d5372f' }}>
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredEmployers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} sx={{ textAlign: 'center', py: 5, color: '#94a3b8' }}>
                      No employer partners found matching the filter criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
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
              <BusinessIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, fontSize: '1.05rem', lineHeight: 1.2, color: '#FFFFFF' }}>
                {editingItem ? 'रोजगार साझेदार सम्पादन (Edit Employer Partner)' : 'नयाँ रोजगार साझेदार दर्ता (Add Employer Partner)'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.74rem' }}>
                {editingItem ? 'संस्थाको सम्पर्क व्यक्ति र सम्झौता विवरण अद्यावधिक गर्नुहोस्' : 'OJT तथा रोजगार सहकार्यका लागि नयाँ साझेदार संस्था दर्ता गर्नुहोस्'}
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
          <Stack spacing={2.5}>
            <TextField
              label="Organization Name (e.g. Norvic Hospital) *"
              fullWidth
              size="small"
              placeholder="उदा: Norvic International Hospital"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Industry / Field"
                  fullWidth
                  size="small"
                  placeholder="उदा: Hospital & Healthcare"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Office Location"
                  fullWidth
                  size="small"
                  placeholder="उदा: Thapathali, Kathmandu"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Contact Person Name"
                  fullWidth
                  size="small"
                  placeholder="उदा: Dr. Rajesh KC (HR Head)"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Official Mobile / Phone *"
                  fullWidth
                  size="small"
                  placeholder="98XXXXXXXX"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Email Address"
                  fullWidth
                  size="small"
                  placeholder="hr@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  select
                  label="Status"
                  fullWidth
                  size="small"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <MenuItem value="Active">Active (सक्रिय साझेदार)</MenuItem>
                  <MenuItem value="Inactive">Inactive (निष्क्रिय)</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            <TextField
              label="MoU Terms / Notes"
              multiline
              rows={2}
              fullWidth
              size="small"
              placeholder="द्विपक्षीय समझदारी पत्र (MoU) सम्बन्धी थप विवरण..."
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            />
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
            सुरक्षित गर्नुहोस् (Save Employer)
          </Button>
        </DialogActions>
      </Dialog>

      {/* Employer 360° Profile Dossier Dialog */}
      <Dialog open={Boolean(profileEmployer)} onClose={() => setProfileEmployer(null)} maxWidth="md" fullWidth>
        {profileEmployer && (() => {
          const employerOjts = (db.ojts || []).filter((o) => o.employerId === profileEmployer.id);
          const employerPlacements = (db.placements || []).filter((p) => p.employerId === profileEmployer.id);

          return (
            <>
              <DialogTitle sx={{ pb: 1, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ width: 56, height: 56, bgcolor: '#1a56b0', fontWeight: 800 }}>
                    <BusinessIcon sx={{ fontSize: 32 }} />
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        {profileEmployer.name}
                      </Typography>
                      <Chip label={profileEmployer.id} size="small" sx={{ fontWeight: 800, bgcolor: '#1a56b0', color: '#fff' }} />
                      <Chip label={profileEmployer.status} size="small" color={profileEmployer.status === 'Active' ? 'success' : 'default'} />
                    </Box>
                    <Typography variant="caption" sx={{ color: '#647089' }}>
                      {profileEmployer.industry} • {profileEmployer.location} • Contact: {profileEmployer.contactPerson} ({profileEmployer.phone})
                    </Typography>
                  </Box>
                  <IconButton
                    component="a"
                    href={getWhatsAppUrl(profileEmployer.phone, `Namaste ${profileEmployer.contactPerson}, from KITE Vocational Training Center.`)}
                    target="_blank"
                    sx={{ color: '#25D366', bgcolor: '#e5f8ee' }}
                  >
                    <WhatsAppIcon />
                  </IconButton>
                </Box>
              </DialogTitle>

              <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
                <Tabs value={profileTab} onChange={(e, v) => setProfileTab(v)}>
                  <Tab label="1. Overview" />
                  <Tab label={`2. OJT Trainees (${employerOjts.length})`} />
                  <Tab label={`3. Placed Graduates (${employerPlacements.length})`} />
                </Tabs>
              </Box>

              <DialogContent sx={{ py: 2.5 }}>
                {profileTab === 0 && (
                  <Box>
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      <Grid item xs={6} sm={3}>
                        <Card sx={{ p: 2, textAlign: 'center', bgcolor: '#e8f0fd' }}>
                          <Typography variant="h5" sx={{ fontWeight: 900, color: '#1a56b0' }}>{employerOjts.length}</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#1a56b0' }}>Total OJT Placements</Typography>
                        </Card>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Card sx={{ p: 2, textAlign: 'center', bgcolor: '#e5f8ee' }}>
                          <Typography variant="h5" sx={{ fontWeight: 900, color: '#16834b' }}>
                            {employerOjts.filter((o) => o.status === 'Ongoing').length}
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#16834b' }}>Active Ongoing OJT</Typography>
                        </Card>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Card sx={{ p: 2, textAlign: 'center', bgcolor: '#fdf3e2' }}>
                          <Typography variant="h5" sx={{ fontWeight: 900, color: '#c9820a' }}>{employerPlacements.length}</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#c9820a' }}>Graduates Hired</Typography>
                        </Card>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Card sx={{ p: 2, textAlign: 'center', bgcolor: '#f3e8ff' }}>
                          <Typography variant="h5" sx={{ fontWeight: 900, color: '#7e22ce' }}>
                            {employerPlacements.length > 0
                              ? `NPR ${Math.round(
                                  employerPlacements.reduce((acc, p) => acc + (Number(p.salary) || 0), 0) /
                                    employerPlacements.length
                                ).toLocaleString()}`
                              : '—'}
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#7e22ce' }}>Avg. Starting Salary</Typography>
                        </Card>
                      </Grid>
                    </Grid>

                    <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5, flexWrap: 'wrap' }}>
                      <Button
                        variant="contained"
                        startIcon={<WorkIcon />}
                        onClick={handleOpenAddOjtForEmployer}
                        sx={{ bgcolor: '#1a56b0', fontWeight: 800, textTransform: 'none', borderRadius: 2 }}
                      >
                        + Deploy OJT Trainee
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={<SchoolIcon />}
                        onClick={handleOpenAddPlacementForEmployer}
                        sx={{ bgcolor: '#16834b', fontWeight: 800, textTransform: 'none', borderRadius: 2, '&:hover': { bgcolor: '#15803d' } }}
                      >
                        + Record Placement (EPP)
                      </Button>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                          <Typography variant="caption" sx={{ color: '#647089', fontWeight: 800 }}>PARTNER ORGANIZATION DETAILS</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 800, mt: 0.5 }}>{profileEmployer.name}</Typography>
                          <Typography variant="body2" sx={{ color: '#475569' }}>Sector: {profileEmployer.industry}</Typography>
                          <Typography variant="body2" sx={{ color: '#475569' }}>Location: {profileEmployer.location}</Typography>
                          <Typography variant="body2" sx={{ color: '#475569' }}>Official Email: {profileEmployer.email || '—'}</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                          <Typography variant="caption" sx={{ color: '#647089', fontWeight: 800 }}>CONTACT PERSON & MoU REMARKS</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 800, mt: 0.5 }}>{profileEmployer.contactPerson}</Typography>
                          <Typography variant="body2" sx={{ color: '#475569' }}>Phone: {profileEmployer.phone}</Typography>
                          <Typography variant="caption" sx={{ color: '#647089', display: 'block', mt: 1 }}>
                            MoU / Institutional Notes: {profileEmployer.remarks || 'Standard training & placement partner agreement.'}
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Box>
                )}

                {profileTab === 1 && (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                        OJT Trainees Assigned ({employerOjts.length})
                      </Typography>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={handleOpenAddOjtForEmployer}
                        sx={{ bgcolor: '#1a56b0', fontWeight: 800, textTransform: 'none', borderRadius: 2 }}
                      >
                        + Assign OJT Trainee
                      </Button>
                    </Box>
                    <Stack spacing={1.5}>
                      {employerOjts.map((ojt) => {
                        const std = db.students.find((s) => s.id === ojt.studentId);
                        const grp = db.trainingGroups.find((g) => g.id === std?.groupId);
                        const course = db.courses.find((c) => c.id === grp?.courseId);

                        return (
                          <Paper key={ojt.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Avatar src={std?.photoUrl} sx={{ width: 44, height: 44, bgcolor: '#1a56b0', fontWeight: 800 }}>
                                  {std?.name?.[0] || 'S'}
                                </Avatar>
                                <Box>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography
                                      variant="subtitle1"
                                      onClick={() => std && setSelectedStudentForProfile(std)}
                                      sx={{ fontWeight: 800, color: '#1a56b0', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                                    >
                                      {std?.name || 'Student'} 🔗
                                    </Typography>
                                    <Chip label={std?.tgid} size="small" sx={{ fontWeight: 700, height: 20, fontSize: '0.7rem' }} />
                                  </Box>
                                  <Typography variant="caption" sx={{ color: '#647089' }}>
                                    Course: <b>{course?.title || 'Vocational Course'}</b> • Shift {grp?.shift || 'A'}
                                  </Typography>
                                  <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.85rem', mt: 0.3 }}>
                                    Duration: {ojt.startDate} → {ojt.endDate || 'Ongoing'} • Supervisor: {ojt.relatedPerson || profileEmployer.contactPerson}
                                  </Typography>
                                </Box>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Chip
                                  label={ojt.status}
                                  size="small"
                                  sx={{
                                    bgcolor: ojt.status === 'Completed' ? '#e5f8ee' : '#e8f0fd',
                                    color: ojt.status === 'Completed' ? '#16834b' : '#1a56b0',
                                    fontWeight: 800
                                  }}
                                />
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<PersonIcon />}
                                  onClick={() => std && setSelectedStudentForProfile(std)}
                                  sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                                >
                                  Profile
                                </Button>
                              </Box>
                            </Box>
                          </Paper>
                        );
                      })}
                      {employerOjts.length === 0 && (
                        <Box sx={{ py: 4, textAlign: 'center' }}>
                          <WorkIcon sx={{ fontSize: 44, color: '#94a3b8', mb: 1 }} />
                          <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600, mb: 2 }}>
                            No students currently or previously assigned to OJT with this employer.
                          </Typography>
                          <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleOpenAddOjtForEmployer}
                            sx={{ bgcolor: '#1a56b0', fontWeight: 800, textTransform: 'none', borderRadius: 2 }}
                          >
                            + Assign First OJT Trainee
                          </Button>
                        </Box>
                      )}
                    </Stack>
                  </Box>
                )}

                {profileTab === 2 && (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                        Graduates Placed & Employed ({employerPlacements.length})
                      </Typography>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={handleOpenAddPlacementForEmployer}
                        sx={{ bgcolor: '#16834b', fontWeight: 800, textTransform: 'none', borderRadius: 2, '&:hover': { bgcolor: '#15803d' } }}
                      >
                        + Record Placement (EPP)
                      </Button>
                    </Box>
                    <Stack spacing={1.5}>
                      {employerPlacements.map((plc) => {
                        const std = db.students.find((s) => s.id === plc.studentId);
                        const grp = db.trainingGroups.find((g) => g.id === std?.groupId);
                        const course = db.courses.find((c) => c.id === grp?.courseId);

                        return (
                          <Paper key={plc.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Avatar src={std?.photoUrl} sx={{ width: 44, height: 44, bgcolor: '#16834b', fontWeight: 800 }}>
                                  {std?.name?.[0] || 'S'}
                                </Avatar>
                                <Box>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography
                                      variant="subtitle1"
                                      onClick={() => std && setSelectedStudentForProfile(std)}
                                      sx={{ fontWeight: 800, color: '#16834b', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                                    >
                                      {std?.name || 'Graduate'} 🔗
                                    </Typography>
                                    <Chip label={std?.tgid} size="small" sx={{ fontWeight: 700, height: 20, fontSize: '0.7rem' }} />
                                  </Box>
                                  <Typography variant="caption" sx={{ color: '#647089' }}>
                                    Course: <b>{course?.title || 'Vocational Training'}</b> • {plc.employmentType || 'Full-time'}
                                  </Typography>
                                  <Typography variant="body2" sx={{ color: '#16834b', fontWeight: 800, mt: 0.3 }}>
                                    Role: {plc.targetJob} • Salary: NPR {plc.expectedSalary || 'Negotiated'}
                                  </Typography>
                                </Box>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Chip
                                  label={plc.status}
                                  size="small"
                                  sx={{
                                    bgcolor: plc.status === 'Placed' ? '#e5f8ee' : '#fff7df',
                                    color: plc.status === 'Placed' ? '#16834b' : '#c9820a',
                                    fontWeight: 800
                                  }}
                                />
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<PersonIcon />}
                                  onClick={() => std && setSelectedStudentForProfile(std)}
                                  sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                                >
                                  Profile
                                </Button>
                              </Box>
                            </Box>
                          </Paper>
                        );
                      })}
                      {employerPlacements.length === 0 && (
                        <Box sx={{ py: 4, textAlign: 'center' }}>
                          <BusinessIcon sx={{ fontSize: 44, color: '#94a3b8', mb: 1 }} />
                          <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600, mb: 2 }}>
                            No graduates currently placed with this employer partner yet.
                          </Typography>
                          <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleOpenAddPlacementForEmployer}
                            sx={{ bgcolor: '#16834b', fontWeight: 800, textTransform: 'none', borderRadius: 2 }}
                          >
                            + Record First Placement
                          </Button>
                        </Box>
                      )}
                    </Stack>
                  </Box>
                )}
              </DialogContent>

              <DialogActions sx={{ p: 2 }}>
                <Button onClick={() => setProfileEmployer(null)}>Close</Button>
              </DialogActions>
            </>
          );
        })()}
      </Dialog>

      {/* In-Employer Add OJT Modal */}
      <Dialog open={openAddOjtModal} onClose={() => setOpenAddOjtModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          Assign OJT Trainee to {profileEmployer?.name}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label="Select Student / Trainee (विद्यार्थी छनोट)"
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
                  label="OJT Start Date (सुरु मिति)"
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
                  label="OJT End Date (सम्पन्न मिति)"
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
                  label="Supervisor Name (सुपरभाइजर)"
                  fullWidth
                  value={newOjtData.relatedPerson}
                  onChange={(e) => setNewOjtData({ ...newOjtData, relatedPerson: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Supervisor Phone (फोन)"
                  fullWidth
                  value={newOjtData.contactNumber}
                  onChange={(e) => setNewOjtData({ ...newOjtData, contactNumber: e.target.value })}
                />
              </Grid>
            </Grid>

            <TextField
              select
              label="Status (अवस्था)"
              fullWidth
              value={newOjtData.status}
              onChange={(e) => setNewOjtData({ ...newOjtData, status: e.target.value })}
            >
              <MenuItem value="Ongoing">Ongoing (सञ्चालनमा)</MenuItem>
              <MenuItem value="Planned">Planned (योजना गरिएको)</MenuItem>
              <MenuItem value="Completed">Completed (सम्पन्न)</MenuItem>
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
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenAddOjtModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveOjtForEmployer} sx={{ fontWeight: 800, bgcolor: '#1a56b0' }}>
            Assign OJT
          </Button>
        </DialogActions>
      </Dialog>

      {/* In-Employer Add Placement Modal */}
      <Dialog open={openAddPlacementModal} onClose={() => setOpenAddPlacementModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          Record Placed Graduate at {profileEmployer?.name}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label="Select Graduate / Candidate (विद्यार्थी छनोट)"
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
                  label="Target Job Role / Designation (पद)"
                  fullWidth
                  value={newPlacementData.targetJob}
                  onChange={(e) => setNewPlacementData({ ...newPlacementData, targetJob: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Employment Type (रोजगारीको प्रकार)"
                  fullWidth
                  value={newPlacementData.employmentType}
                  onChange={(e) => setNewPlacementData({ ...newPlacementData, employmentType: e.target.value })}
                >
                  <MenuItem value="Full-Time Employee">Full-Time Employee</MenuItem>
                  <MenuItem value="Part-Time Employee">Part-Time Employee</MenuItem>
                  <MenuItem value="Foreign Employment">Foreign Employment (वैदेशिक)</MenuItem>
                  <MenuItem value="Contract Based">Contract Based</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Monthly Salary / Income (मासिक तलब)"
                  fullWidth
                  value={newPlacementData.expectedSalary}
                  onChange={(e) => setNewPlacementData({ ...newPlacementData, expectedSalary: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  type="date"
                  label="Placement Date (नियुक्ति मिति)"
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
                  <MenuItem value="Placed">Placed (नियुक्त भएको)</MenuItem>
                  <MenuItem value="Interview Scheduled">Interview Scheduled</MenuItem>
                  <MenuItem value="Offer Issued">Offer Issued</MenuItem>
                  <MenuItem value="Seeking">Seeking</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            <TextField
              label="Remarks / Notes (टिपोट)"
              fullWidth
              multiline
              rows={2}
              value={newPlacementData.remarks}
              onChange={(e) => setNewPlacementData({ ...newPlacementData, remarks: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
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
