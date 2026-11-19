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
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  Paper,
  useTheme,
  useMediaQuery
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SearchIcon from '@mui/icons-material/Search';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import WorkIcon from '@mui/icons-material/Work';
import PersonIcon from '@mui/icons-material/Person';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { loadDB, saveDB } from '../../services/storage';
import { getStudentWorkflowSummary } from '../../services/tvetWorkflow';
import { getWhatsAppUrl } from '../../services/exportUtils';
import { ResponsiveDataView, StatusBadge, EntityCard } from '../common';

export default function PlacementManager() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isBelowMd = useMediaQuery(theme.breakpoints.down('md'));
  const [db, setDb] = useState(loadDB());
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewMode, setViewMode] = useState('table');

  const [formData, setFormData] = useState({
    studentId: db.students[0]?.id || '',
    employerId: db.employers[0]?.id || '',
    targetJob: '',
    preferredLocation: 'Kathmandu',
    expectedSalary: 'NPR 25,000 / month',
    employmentType: 'Full-Time Employee',
    workSchedule: 'Day Shift',
    paymentType: 'Monthly Salary',
    status: 'Planned',
    remarks: ''
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      studentId: '',
      employerId: '',
      targetJob: '',
      preferredLocation: '',
      expectedSalary: '',
      employmentType: 'Full-Time Employee',
      workSchedule: 'Day Shift',
      paymentType: 'Monthly Salary',
      status: 'Planned',
      remarks: ''
    });
    setOpenDialog(true);
  };

  const handleSave = () => {
    if (!formData.studentId || !formData.targetJob.trim()) {
      alert('Student and Target Job Title are required.');
      return;
    }

    let updatedList = [...db.placements];
    if (editingItem) {
      updatedList = updatedList.map((x) =>
        x.id === editingItem.id ? { ...x, ...formData } : x
      );
    } else {
      const newId = `PLC-${String(updatedList.length + 1).padStart(2, '0')}`;
      updatedList.push({ id: newId, ...formData });

      // Add to Student Timeline
      const std = (db.students || []).find((s) => s.id === formData.studentId);
      const emp = (db.employers || []).find((e) => e.id === formData.employerId);
      const updatedTimelines = [...(db.studentTimelines || [])];
      updatedTimelines.unshift({
        id: `TL-${Date.now()}`,
        studentId: formData.studentId,
        eventType: 'Placement',
        title: `Placement Created: ${formData.targetJob}`,
        description: `Company: ${emp?.name || 'Partner'}, Expected Salary: ${formData.expectedSalary}, Status: ${formData.status}`,
        createdAt: new Date().toISOString()
      });
      nextDb.studentTimelines = updatedTimelines;
    }

    const nextDb = { ...db, placements: updatedList };
    saveDB(nextDb);
    setDb(nextDb);
    setOpenDialog(false);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      studentId: item.studentId,
      employerId: item.employerId || '',
      targetJob: item.targetJob || '',
      preferredLocation: item.preferredLocation || 'Kathmandu',
      expectedSalary: item.expectedSalary || '',
      employmentType: item.employmentType || 'Full-Time Employee',
      workSchedule: item.workSchedule || 'Day Shift',
      paymentType: item.paymentType || 'Monthly Salary',
      status: item.status || 'Planned',
      remarks: item.remarks || ''
    });
    setOpenDialog(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this placement plan?')) {
      const nextDb = {
        ...db,
        placements: (db.placements || []).filter((x) => x.id !== id)
      };
      saveDB(nextDb);
      setDb(nextDb);
    }
  };

  const totalPlacements = (db.placements || []).length;
  const placedCount = (db.placements || []).filter((p) => p.status === 'Placed').length;
  const plannedCount = (db.placements || []).filter((p) => p.status === 'Planned').length;
  const ongoingCount = (db.placements || []).filter((p) => p.status === 'Ongoing').length;

  const filteredPlacements = (db.placements || []).filter((plc) => {
    const std = (db.students || []).find((s) => s.id === plc.studentId);
    const emp = (db.employers || []).find((e) => e.id === plc.employerId);
    const q = searchTerm.toLowerCase();

    const matchesSearch =
      !searchTerm ||
      (std?.name || '').toLowerCase().includes(q) ||
      (std?.tgid || '').toLowerCase().includes(q) ||
      (plc.targetJob || '').toLowerCase().includes(q) ||
      (emp?.name || '').toLowerCase().includes(q) ||
      (plc.preferredLocation || '').toLowerCase().includes(q) ||
      (plc.expectedSalary || '').toLowerCase().includes(q) ||
      (plc.employmentType || '').toLowerCase().includes(q) ||
      (plc.id || '').toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === 'All' || plc.status === statusFilter;

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
                <RocketLaunchIcon sx={{ fontSize: 20, color: '#fbbf24' }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="subtitle1"
                  noWrap
                  sx={{ fontWeight: 800, color: '#ffffff', fontSize: { xs: '0.96rem', sm: '1.06rem' }, lineHeight: 1.2 }}
                >
                  Placements &amp; Employment (EPP)
                </Typography>
                <Typography
                  variant="caption"
                  noWrap
                  sx={{ color: '#cbd5e1', display: 'block', fontSize: '0.73rem', mt: 0.15 }}
                >
                  Prabidhik School, Jorpati • Final TVET outcome tracking: Target Job, Host Employer &amp; Salary
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
                + Create Placement Plan
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
                  Total Candidates
                </Typography>
                <Typography sx={{ fontWeight: 800, color: '#0f2e5a', fontSize: '1.22rem', lineHeight: 1.2, mt: 0.2 }}>
                  {totalPlacements}
                </Typography>
                <Typography variant="caption" noWrap sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.68rem', display: 'block' }}>
                  EPP Records
                </Typography>
              </Box>
              <Box sx={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#eff6ff', borderRadius: 1.5, color: '#1e40af', flexShrink: 0 }}>
                <PersonIcon sx={{ fontSize: 18 }} />
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
                  Placed &amp; Employed
                </Typography>
                <Typography sx={{ fontWeight: 800, color: '#059669', fontSize: '1.22rem', lineHeight: 1.2, mt: 0.2 }}>
                  {placedCount}
                </Typography>
                <Typography variant="caption" noWrap sx={{ color: '#059669', fontWeight: 600, fontSize: '0.68rem', display: 'block' }}>
                  Hired Graduates
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
                  Planned (Pipeline)
                </Typography>
                <Typography sx={{ fontWeight: 800, color: '#0284c7', fontSize: '1.22rem', lineHeight: 1.2, mt: 0.2 }}>
                  {plannedCount}
                </Typography>
                <Typography variant="caption" noWrap sx={{ color: '#0284c7', fontWeight: 600, fontSize: '0.68rem', display: 'block' }}>
                  In Job Matching
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
                  Ongoing Trial
                </Typography>
                <Typography sx={{ fontWeight: 800, color: '#d97706', fontSize: '1.22rem', lineHeight: 1.2, mt: 0.2 }}>
                  {ongoingCount}
                </Typography>
                <Typography variant="caption" noWrap sx={{ color: '#d97706', fontWeight: 600, fontSize: '0.68rem', display: 'block' }}>
                  Probation / Trial
                </Typography>
              </Box>
              <Box sx={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#fffbeb', borderRadius: 1.5, color: '#d97706', flexShrink: 0 }}>
                <RocketLaunchIcon sx={{ fontSize: 18 }} />
              </Box>
            </Stack>
          </Card>
        </Grid>
      </Grid>

      {/* Ready / OJT-Completed & Graduating Trainees Smart EPP Queue */}
      {(() => {
        const placedIds = new Set((db.placements || []).map((p) => p.studentId));
        const ojtByStudent = new Map((db.ojts || []).map((o) => [o.studentId, o]));
        const inSevenDays = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
        const readyTrainees = (db.students || [])
          .filter((s) => {
            if (placedIds.has(s.id) || s.status === 'Dropout') return false;
            const ojt = ojtByStudent.get(s.id);
            return (
              ojt?.status === 'Completed' ||
              ojt?.status === 'Ongoing' ||
              s.status === 'Completed' ||
              s.status === 'OJT' ||
              (s.expectedEndDate && s.expectedEndDate <= inSevenDays)
            );
          })
          .slice(0, 8);
        if (readyTrainees.length === 0) return null;
        return (
          <Card elevation={0} sx={{ p: 1.25, mb: 1.75, bgcolor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 2 }}>
            <Typography variant="caption" sx={{ fontWeight: 900, color: '#166534', display: 'block', mb: 0.75, fontSize: '0.73rem' }}>
              OJT-Completed &amp; Graduating Trainees Ready for EPP Placement ({readyTrainees.length})
            </Typography>
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              {readyTrainees.map((st) => {
                const wf = getStudentWorkflowSummary(db, st);
                const ojt = ojtByStudent.get(st.id);
                const ojtEmp = ojt ? (db.employers || []).find((e) => e.id === ojt.employerId) : null;
                const badgeSuffix = ojt?.status === 'Completed'
                  ? `OJT Done${ojtEmp ? ` @ ${ojtEmp.name}` : ''}`
                  : (wf?.evaluation?.evaluatedUnits > 0 ? `Eval ${wf.evaluation.pct}%` : `End: ${st.expectedEndDate || 'Ready'}`);
                return (
                  <Chip
                    key={st.id}
                    size="small"
                    label={`${st.name} (${wf?.course?.title || st.tgid}) • ${badgeSuffix}`}
                    onClick={() => {
                      setEditingItem(null);
                      setFormData({
                        studentId: st.id,
                        employerId: ojt?.employerId || db.employers?.[0]?.id || '',
                        targetJob: `${wf?.course?.title || 'Vocational'} Specialist`,
                        preferredLocation: ojtEmp?.location || 'Kathmandu',
                        expectedSalary: 'NPR 22,000 / month',
                        employmentType: 'Full-Time Employee',
                        workSchedule: 'Day Shift',
                        paymentType: 'Monthly Salary',
                        status: ojt?.status === 'Completed' ? 'Placed' : 'Planned',
                        remarks: ojt?.status === 'Completed'
                          ? `Converted from Completed OJT at ${ojtEmp?.name || 'Host Employer'}`
                          : 'Matched from Graduating EPP Queue'
                      });
                      setOpenDialog(true);
                    }}
                    sx={{ fontWeight: 700, fontSize: '0.7rem', bgcolor: '#FFFFFF', border: '1px solid #86EFAC', color: '#15803D', cursor: 'pointer' }}
                  />
                );
              })}
            </Stack>
          </Card>
        );
      })()}

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
              placeholder="Search student, job title, employer, location..."
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
              {['All', 'Placed', 'Planned', 'Ongoing'].map((st) => (
                <Chip
                  key={st}
                  label={st}
                  size="small"
                  clickable
                  color={statusFilter === st ? 'primary' : 'default'}
                  onClick={() => setStatusFilter(st)}
                  sx={{ fontWeight: 700, fontSize: '0.74rem' }}
                />
              ))}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Typography variant="caption" sx={{ color: '#647089', fontWeight: 700, fontSize: '0.74rem' }}>
              Showing {filteredPlacements.length} of {totalPlacements}
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
          rows={filteredPlacements}
          enableDesktopCardToggle={true}
          keyExtractor={(plc) => plc.id}
          emptyIcon={<RocketLaunchIcon />}
          emptyTitle="No placement records found"
          emptySubtitle="No placement records found matching the filter criteria."
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
                  <TableCell sx={{ fontWeight: 800 }}>Student Candidate</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Target Job Title</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Employer Partner</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Expected Salary &amp; Terms</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Employment Type</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPlacements.map((plc, idx) => {
                  const std = (db.students || []).find((s) => s.id === plc.studentId);
                  const emp = (db.employers || []).find((e) => e.id === plc.employerId);

                  return (
                    <TableRow key={plc.id} hover>
                      <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.75rem' }}>
                        {idx + 1}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                          <Avatar src={std?.photoUrl} sx={{ width: 30, height: 30, bgcolor: '#1a56b0', fontWeight: 700, fontSize: '0.78rem' }}>
                            {std?.name?.[0] || 'S'}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.8rem' }}>
                              {std?.name || 'Student'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#647089', fontSize: '0.7rem' }}>
                              {std?.tgid}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#152238', fontSize: '0.8rem' }}>
                        {plc.targetJob}
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.79rem' }}>
                          {emp?.name || 'Self-Employed / Freelance'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#647089', fontSize: '0.7rem' }}>
                          {plc.preferredLocation}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#16834b', fontSize: '0.79rem' }}>
                          {plc.expectedSalary}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#647089', fontSize: '0.7rem' }}>
                          {plc.paymentType}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={plc.employmentType} size="small" sx={{ height: 20, fontSize: '0.68rem', bgcolor: '#f1f5f9', fontWeight: 700 }} />
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={<CheckCircleIcon sx={{ fontSize: '13px !important' }} />}
                          label={plc.status}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.68rem',
                            bgcolor: plc.status === 'Placed' ? '#e5f8ee' : plc.status === 'Ongoing' ? '#fdf3e2' : '#e8f0fd',
                            color: plc.status === 'Placed' ? '#16834b' : plc.status === 'Ongoing' ? '#c9820a' : '#1a56b0',
                            fontWeight: 700
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <IconButton size="small" onClick={() => handleOpenEdit(plc)} sx={{ color: '#1a56b0', p: 0.4, mr: 0.25 }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDelete(plc.id)} sx={{ color: '#d5372f', p: 0.4 }}>
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredPlacements.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} sx={{ textAlign: 'center', py: 3.5, color: '#94a3b8', fontSize: '0.8rem' }}>
                      No placement records found matching the filter criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
          )}
          renderCard={(plc, idx) => {
            const std = (db.students || []).find((s) => s.id === plc.studentId);
            const emp = (db.employers || []).find((e) => e.id === plc.employerId);
            const grp = (db.trainingGroups || []).find((g) => g.id === std?.groupId);
            const crs = (db.courses || []).find((c) => c.id === grp?.courseId);
            const statusTone = plc.status === 'Placed' ? 'success' : plc.status === 'Ongoing' ? 'warning' : 'primary';
            const accentColor = plc.status === 'Placed' ? '#059669' : '#0F2C59';

            return (
              <EntityCard
                accentColor={accentColor}
                avatarSrc={std?.photoUrl}
                avatarText={std?.name?.[0] || 'S'}
                avatarBg="#EFF6FF"
                avatarColor="#0F2C59"
                title={std?.name || 'Student'}
                code={std?.tgid || `#${idx + 1}`}
                subtitle={`${plc.targetJob} • ${emp?.name || 'Self-Employed / Freelance'}`}
                status={{ label: plc.status, tone: statusTone, showDot: true }}
                onCardClick={() => handleOpenEdit(plc)}
                fields={[
                  {
                    label: 'Salary / Package',
                    value: plc.expectedSalary || 'Negotiable',
                    icon: <AttachMoneyIcon sx={{ fontSize: 13 }} />
                  },
                  {
                    label: 'Location',
                    value: plc.preferredLocation || emp?.location || 'Nepal',
                    icon: <LocationOnIcon sx={{ fontSize: 13 }} />
                  },
                  {
                    label: 'Placement Date',
                    value: plc.placementDate || plc.createdAt?.slice(0, 10) || '—',
                    icon: <WorkIcon sx={{ fontSize: 13 }} />
                  },
                  {
                    label: 'Course / Trade',
                    value: crs?.title || plc.employmentType || '—',
                    icon: <BusinessIcon sx={{ fontSize: 13 }} />
                  }
                ]}
                actions={[
                  {
                    label: 'View',
                    icon: <VisibilityIcon sx={{ fontSize: 16 }} />,
                    color: '#0284C7',
                    bgColor: 'rgba(2, 132, 199, 0.09)',
                    onClick: () => handleOpenEdit(plc)
                  },
                  {
                    label: 'Edit',
                    icon: <EditIcon sx={{ fontSize: 16 }} />,
                    color: '#0F2C59',
                    bgColor: 'rgba(15, 44, 89, 0.08)',
                    onClick: () => handleOpenEdit(plc)
                  },
                  {
                    label: 'Delete',
                    icon: <DeleteOutlineIcon sx={{ fontSize: 16 }} />,
                    color: '#DC2626',
                    bgColor: 'rgba(220, 38, 38, 0.08)',
                    onClick: () => handleDelete(plc.id)
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
            {filteredPlacements.map((plc, idx) => {
              const std = (db.students || []).find((s) => s.id === plc.studentId);
              const emp = (db.employers || []).find((e) => e.id === plc.employerId);

              return (
                <Grid item xs={12} sm={6} md={4} key={plc.id}>
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
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={`#${idx + 1}`}
                            size="small"
                            sx={{ bgcolor: '#0b2545', color: '#ffffff', fontWeight: 800, fontSize: '0.72rem' }}
                          />
                          <Chip
                            label={plc.id}
                            size="small"
                            sx={{ bgcolor: '#f1f5f9', color: '#475569', fontWeight: 700, fontSize: '0.72rem' }}
                          />
                        </Box>
                        <Chip
                          icon={<CheckCircleIcon />}
                          label={plc.status}
                          size="small"
                          sx={{
                            bgcolor: plc.status === 'Placed' ? '#e5f8ee' : plc.status === 'Ongoing' ? '#fdf3e2' : '#e8f0fd',
                            color: plc.status === 'Placed' ? '#16834b' : plc.status === 'Ongoing' ? '#c9820a' : '#1a56b0',
                            fontWeight: 800
                          }}
                        />
                      </Box>

                      {/* Candidate Row */}
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.2, bgcolor: '#f8fafc', borderRadius: 2, mb: 1.8 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar src={std?.photoUrl} sx={{ width: 44, height: 44, bgcolor: '#1a56b0', fontWeight: 800 }}>
                            {std?.name?.[0] || 'S'}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                              {std?.name || 'Candidate'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#647089', fontWeight: 700, display: 'block' }}>
                              TGID: {std?.tgid}
                            </Typography>
                          </Box>
                        </Box>
                        {std?.phone && (
                          <IconButton
                            size="small"
                            component="a"
                            href={getWhatsAppUrl(std.phone, `Namaste ${std.name}, greetings regarding your career placement.`)}
                            target="_blank"
                            sx={{
                              bgcolor: '#25D366',
                              color: '#ffffff',
                              p: '5px',
                              '&:hover': { bgcolor: '#1ebc59' }
                            }}
                          >
                            <WhatsAppIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        )}
                      </Box>

                      {/* Target Job Title */}
                      <Box sx={{ mb: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.5 }}>
                          <WorkIcon sx={{ fontSize: 18, color: '#1a56b0' }} />
                          <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#152238' }}>
                            {plc.targetJob}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.8, pl: 3.2 }}>
                          <Chip label={plc.employmentType} size="small" sx={{ bgcolor: '#f1f5f9', fontWeight: 700, fontSize: '0.72rem' }} />
                          <Chip label={plc.workSchedule} size="small" sx={{ bgcolor: '#f8fafc', fontWeight: 600, fontSize: '0.72rem' }} />
                        </Box>
                      </Box>

                      {/* Employer Partner Box */}
                      <Box sx={{ p: 1.2, bgcolor: '#eff6ff', borderRadius: 2, mb: 1.5, border: '1px solid #bfdbfe' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.3 }}>
                          <BusinessIcon sx={{ fontSize: 16, color: '#1d4ed8' }} />
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e40af' }}>
                            {emp?.name || 'Self-Employed / Independent'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, pl: 3 }}>
                          <LocationOnIcon sx={{ fontSize: 14, color: '#64748b' }} />
                          <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600 }}>
                            {plc.preferredLocation || emp?.location || 'Nepal'}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Expected / Confirmed Salary */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.2, bgcolor: '#f0fdf4', borderRadius: 2, border: '1px solid #bbf7d0', mb: 1.5 }}>
                        <AttachMoneyIcon sx={{ fontSize: 20, color: '#166534' }} />
                        <Box>
                          <Typography variant="caption" sx={{ color: '#166534', fontWeight: 700, display: 'block', fontSize: '0.68rem' }}>
                            REMUNERATION & COMPENSATION
                          </Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#15803d' }}>
                            {plc.expectedSalary || 'Negotiable'} ({plc.paymentType})
                          </Typography>
                        </Box>
                      </Box>

                      {plc.remarks && (
                        <Typography variant="caption" sx={{ color: '#647089', fontStyle: 'italic', display: 'block', mb: 1 }}>
                          "{plc.remarks}"
                        </Typography>
                      )}
                    </Box>

                    {/* Action Buttons */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, pt: 1.5, borderTop: '1px solid #f1f5f9' }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => handleOpenEdit(plc)}
                        sx={{ fontWeight: 700, textTransform: 'none', fontSize: '0.78rem' }}
                      >
                        Edit
                      </Button>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(plc.id)}
                        sx={{ color: '#d5372f', bgcolor: '#fef2f2', '&:hover': { bgcolor: '#fee2e2' } }}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
          {filteredPlacements.length === 0 && (
            <Card sx={{ p: 5, textAlign: 'center', borderRadius: 3, bgcolor: '#f8fafc', border: '1px dashed #cbd5e1' }}>
              <Typography variant="body1" sx={{ color: '#64748b', fontWeight: 700 }}>
                No placement records found matching "{searchTerm}"
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
            borderRadius: isMobile ? 0 : 4,
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
              <RocketLaunchIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, fontSize: '1.05rem', lineHeight: 1.2 }}>
                {editingItem ? 'Edit Placement Plan' : 'Create Placement Plan'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.72rem' }}>
                Track student job role, partner employer, salary, and contract terms
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
              select
              label="Select Student"
              fullWidth
              size="small"
              value={formData.studentId}
              onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
              required
            >
              <MenuItem value="" sx={{ color: '#94A3B8', fontStyle: 'italic' }}>
                -- Select Student --
              </MenuItem>
              {(db.students || []).map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name} ({s.tgid})
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Target Job / Trade Title"
              fullWidth
              size="small"
              value={formData.targetJob}
              onChange={(e) => setFormData({ ...formData, targetJob: e.target.value })}
              placeholder="e.g. Senior Elderly Care Assistant / Head Beautician"
              required
            />

            <TextField
              select
              label="Partner Employer (or Self-Employed)"
              fullWidth
              size="small"
              value={formData.employerId}
              onChange={(e) => setFormData({ ...formData, employerId: e.target.value })}
            >
              <MenuItem value="" sx={{ color: '#94A3B8', fontStyle: 'italic' }}>
                -- Select Employer --
              </MenuItem>
              {(db.employers || []).map((emp) => (
                <MenuItem key={emp.id} value={emp.id}>
                  {emp.name} ({emp.industry})
                </MenuItem>
              ))}
            </TextField>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Expected Salary / Monthly Remuneration"
                  fullWidth
                  size="small"
                  placeholder="e.g. NPR 25,000 / month"
                  value={formData.expectedSalary}
                  onChange={(e) => setFormData({ ...formData, expectedSalary: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  select
                  label="Employment Type"
                  fullWidth
                  size="small"
                  value={formData.employmentType}
                  onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                >
                  <MenuItem value="Full-Time Employee">Full-Time Employee</MenuItem>
                  <MenuItem value="Part-Time Employee">Part-Time Employee</MenuItem>
                  <MenuItem value="Self-Employed / Business">Self-Employed / Business</MenuItem>
                  <MenuItem value="Overseas Employment">Overseas Employment</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  select
                  label="Work Schedule"
                  fullWidth
                  size="small"
                  value={formData.workSchedule}
                  onChange={(e) => setFormData({ ...formData, workSchedule: e.target.value })}
                >
                  <MenuItem value="Day Shift">Day Shift</MenuItem>
                  <MenuItem value="Night Shift">Night Shift</MenuItem>
                  <MenuItem value="Rotational Shift">Rotational Shift</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  select
                  label="Placement Status"
                  fullWidth
                  size="small"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <MenuItem value="Planned">Planned</MenuItem>
                  <MenuItem value="Placed">Placed</MenuItem>
                  <MenuItem value="Ongoing">Ongoing Trial</MenuItem>
                  <MenuItem value="Cancelled">Cancelled</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            <TextField
              label="Special Remarks / Contract Details"
              multiline
              rows={2}
              fullWidth
              size="small"
              placeholder="Contract details, joining date, or additional instructions..."
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions
          sx={{
            p: 2.5,
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
            Save Placement
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
