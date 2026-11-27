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
  Avatar,
  Tooltip,
  Tabs,
  Tab,
  Grid,
  Paper,
  LinearProgress,
  InputAdornment,
  useTheme,
  useMediaQuery
} from '@mui/material';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import KeyIcon from '@mui/icons-material/Key';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SchoolIcon from '@mui/icons-material/School';
import BusinessIcon from '@mui/icons-material/Business';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import PhoneIcon from '@mui/icons-material/Phone';
import { QRCodeSVG } from 'qrcode.react';
import { loadDB, saveDB, getNextSequentialId, getNextBiometricId } from '../../services/storage';
import { getWhatsAppUrl } from '../../services/exportUtils';
import { useDialog } from '../../context/DialogContext';
import { ResponsiveDataView, StatusBadge, EntityCard, PhotoUploadField } from '../common';

export default function TrainerManager() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { confirm, alert } = useDialog();
  const [db, setDb] = useState(loadDB());
  const [openDialog, setOpenDialog] = useState(false);

  React.useEffect(() => {
    const refreshDb = () => setDb(loadDB());
    window.addEventListener('kite_db_updated', refreshDb);
    window.addEventListener('kite_cloud_hydrated', refreshDb);
    window.addEventListener('storage', refreshDb);
    return () => {
      window.removeEventListener('kite_db_updated', refreshDb);
      window.removeEventListener('kite_cloud_hydrated', refreshDb);
      window.removeEventListener('storage', refreshDb);
    };
  }, []);
  const [editingItem, setEditingItem] = useState(null);
  const [qrModalItem, setQrModalItem] = useState(null);
  const [profileTrainer, setProfileTrainer] = useState(null);
  const [profileTab, setProfileTab] = useState(0);

  const [formData, setFormData] = useState({
    name: '',
    biometricId: '',
    phone: '',
    occupationId: '',
    pin: '1234',
    specialization: '',
    status: 'Active',
    photo: ''
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      biometricId: getNextBiometricId(db.trainers || [], 2001),
      phone: '',
      occupationId: '',
      pin: '1234',
      specialization: '',
      status: 'Active',
      photo: ''
    });
    setOpenDialog(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({ ...item });
    setOpenDialog(true);
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.phone.trim() || !formData.pin.trim()) {
      alert('Trainer Name, Phone, and 4-Digit PIN are required.');
      return;
    }
    if (formData.pin.length !== 4) {
      alert('PIN must be exactly 4 digits.');
      return;
    }

    let updatedList = [...(db.trainers || [])];
    if (editingItem) {
      updatedList = updatedList.map((x) =>
        x.id === editingItem.id ? { ...x, ...formData } : x
      );
    } else {
      const newId = getNextSequentialId(updatedList, 'TRN-', 2, 'id', 1);
      const nextBioId = (formData.biometricId || '').toString().trim() || getNextBiometricId(updatedList, 2001);
      updatedList.push({
        ...formData,
        occupationId: formData.occupationId || null,
        id: newId,
        biometricId: nextBioId
      });
    }

    const nextDb = { ...db, trainers: updatedList };
    saveDB(nextDb);
    setDb(nextDb);
    setOpenDialog(false);
  };

  const handleDelete = async (id) => {
    const trn = (db.trainers || []).find((x) => x.id === id);
    const assignedBatches = (db.trainingGroups || []).filter((g) => g.trainerId === id);

    if (assignedBatches.length > 0) {
      await alert({
        type: 'warning',
        title: 'Cannot Delete Assigned Trainer',
        message: `Trainer "${trn?.name || id}" is currently assigned to ${assignedBatches.length} training batch(es).`,
        detail: 'Please reassign or remove the trainer from the respective training groups first.'
      });
      return;
    }

    const ok = await confirm({
      type: 'danger',
      title: 'Confirm Trainer Deletion',
      message: `Are you sure you want to permanently remove trainer "${trn?.name || id}" from the system?`,
      detail: 'This action will remove the instructor profile and mobile credentials.',
      confirmText: 'Yes, Delete',
      confirmColor: '#DC2626'
    });

    if (ok) {
      const nextDb = {
        ...db,
        trainers: (db.trainers || []).filter((x) => x.id !== id)
      };
      saveDB(nextDb);
      setDb(nextDb);
    }
  };

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2.2 } }}>
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
          <Grid item xs={12} md={7}>
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
                <PeopleAltIcon sx={{ fontSize: 20, color: '#fbbf24' }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="subtitle1"
                  noWrap
                  sx={{ fontWeight: 800, color: '#ffffff', fontSize: { xs: '0.96rem', sm: '1.06rem' }, lineHeight: 1.2 }}
                >
                  Trainer Master
                </Typography>
                <Typography
                  variant="caption"
                  noWrap
                  sx={{ color: '#cbd5e1', display: 'block', fontSize: '0.73rem', mt: 0.15 }}
                >
                  Prabidhik School, Jorpati • Manage instructors, 4-digit mobile PIN codes, specialization &amp; login QR cards
                </Typography>
              </Box>
            </Stack>
          </Grid>

          <Grid item xs={12} md={5} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
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
                + Add Trainer
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Card>

      <ResponsiveDataView
        rows={db.trainers || []}
        keyExtractor={(trn) => trn.id}
        enableDesktopCardToggle={true}
        emptyIcon={<PeopleAltIcon sx={{ fontSize: 28 }} />}
        emptyTitle="No Trainers Found"
        emptySubtitle="Add a trainer or instructor to assign batches and manage schedules."
        emptyAction={
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd}>
            Add Trainer
          </Button>
        }
        renderCard={(trn) => {
          const occ = (db.occupations || []).find((o) => o.id === trn.occupationId);
          const assignedGroups = (db.trainingGroups || []).filter((g) => g.trainerId === trn.id);
          const statusLabel = trn.status || 'Active';
          const statusTone = statusLabel === 'Active' ? 'success' : 'error';
          const initials =
            (trn.name || 'T')
              .split(' ')
              .filter(Boolean)
              .slice(0, 2)
              .map((w) => w[0].toUpperCase())
              .join('') || 'T';
          const payrollDisplay = trn.payrollModel
            ? trn.rate
              ? `${trn.payrollModel} (NPR ${Number(trn.rate).toLocaleString()})`
              : trn.payrollModel
            : trn.salary
              ? `NPR ${Number(trn.salary).toLocaleString()}/mo`
              : trn.hourlyRate
                ? `NPR ${Number(trn.hourlyRate).toLocaleString()}/hr`
                : 'Standard';

          return (
            <EntityCard
              accentColor="#0D9488"
              avatarSrc={trn.photo}
              avatarText={initials}
              avatarBg="#CCFBF1"
              avatarColor="#0F766E"
              title={trn.name}
              subtitle={trn.specialization || occ?.name || 'Instructor'}
              status={{
                label: statusLabel,
                tone: statusTone,
                showDot: true
              }}
              onCardClick={() => {
                setProfileTrainer(trn);
                setProfileTab(0);
              }}
              fields={[
                { label: 'Phone', value: trn.phone || '-' },
                { label: 'Email', value: trn.email || '-' },
                { label: 'Payroll / Rate', value: payrollDisplay },
                {
                  label: 'Assigned Batches',
                  value: assignedGroups.map((g) => g.groupCode).join(', ') || 'None',
                  color: '#0D9488'
                }
              ]}
              actions={[
                {
                  label: 'Call',
                  icon: <PhoneIcon sx={{ fontSize: 17 }} />,
                  href: trn.phone ? `tel:${trn.phone}` : undefined,
                  disabled: !trn.phone,
                  color: '#059669',
                  bgColor: 'rgba(5, 150, 105, 0.09)'
                },
                {
                  label: 'Edit',
                  icon: <EditIcon sx={{ fontSize: 17 }} />,
                  onClick: () => handleOpenEdit(trn),
                  color: '#0F2C59',
                  bgColor: 'rgba(15, 44, 89, 0.08)'
                },
                {
                  label: 'Delete',
                  icon: <DeleteOutlineIcon sx={{ fontSize: 17 }} />,
                  onClick: () => handleDelete(trn.id),
                  color: '#EF4444',
                  bgColor: 'rgba(239, 68, 68, 0.09)'
                }
              ]}
            />
          );
        }}
        renderTable={() => (
          <Card elevation={0} sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid #E2E8F0' }}>
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
                <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800, width: 46, textAlign: 'center' }}>
                  #
                </TableCell>
                <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800 }}>Trainer</TableCell>
                <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800 }}>Specialization</TableCell>
                <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800 }}>Contact &amp; WhatsApp</TableCell>
                <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800 }}>Security PIN</TableCell>
                <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800 }}>Assigned Batches</TableCell>
                <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800 }}>Status</TableCell>
                <TableCell sx={{ color: '#FFFFFF !important', fontWeight: 800, textAlign: 'right' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(db.trainers || []).map((trn, idx) => {
                const occ = (db.occupations || []).find((o) => o.id === trn.occupationId);
                const assignedGroups = (db.trainingGroups || []).filter((g) => g.trainerId === trn.id);

                return (
                  <TableRow key={trn.id} hover>
                    <TableCell sx={{ fontWeight: 700, textAlign: 'center', color: '#64748B', width: 46, fontSize: '0.75rem' }}>
                      {idx + 1}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar src={trn.photo} sx={{ width: 34, height: 34, bgcolor: '#1a9c5c', fontWeight: 700, fontSize: '0.82rem' }}>
                          {trn.name[0]}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 800, fontSize: '0.8rem', lineHeight: 1.2 }}>
                            {trn.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#647089', display: 'flex', alignItems: 'center', gap: 0.6, mt: 0.2, fontSize: '0.69rem' }}>
                            <span>{trn.id}</span>
                            <Chip
                              size="small"
                              icon={<FingerprintIcon sx={{ fontSize: '11px !important', color: '#0F2E5A !important' }} />}
                              label={`#${trn.biometricId || 'N/A'}`}
                              sx={{ height: 18, fontSize: '0.64rem', fontWeight: 800, bgcolor: '#EEF2F6', color: '#0F2E5A' }}
                            />
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Chip label={occ?.name || 'General'} size="small" sx={{ height: 19, fontSize: '0.68rem', bgcolor: '#e8f0fd', color: '#1a56b0', fontWeight: 700, mb: 0.2, display: 'block', width: 'fit-content' }} />
                      <Typography variant="caption" sx={{ color: '#647089', fontSize: '0.69rem' }}>
                        {trn.specialization || 'Instructor'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.78rem' }}>
                          {trn.phone}
                        </Typography>
                        <IconButton
                          size="small"
                          component="a"
                          href={getWhatsAppUrl(trn.phone, `Namaste ${trn.name}, your Prabidhik School Trainer PIN is ${trn.pin}.`)}
                          target="_blank"
                          sx={{ color: '#25D366', p: 0.3 }}
                        >
                          <WhatsAppIcon sx={{ fontSize: '1rem' }} />
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Chip
                        icon={<KeyIcon sx={{ fontSize: '13px !important' }} />}
                        label={`PIN: ${trn.pin}`}
                        size="small"
                        sx={{ height: 20, fontSize: '0.68rem', bgcolor: '#f1f5f9', fontWeight: 800, color: '#334155' }}
                      />
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.77rem' }}>
                        {assignedGroups.map((g) => g.groupCode).join(', ') || 'No active batch'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Chip
                        label={trn.status}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.68rem',
                          bgcolor: trn.status === 'Active' ? '#e5f8ee' : '#fdeceb',
                          color: trn.status === 'Active' ? '#16834b' : '#d5372f',
                          fontWeight: 700
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end" alignItems="center">
                        <Tooltip title="View Trainer 360° Profile">
                          <Button
                            size="small"
                            startIcon={<VisibilityIcon sx={{ fontSize: '13px !important' }} />}
                            onClick={() => {
                              setProfileTrainer(trn);
                              setProfileTab(0);
                            }}
                            sx={{
                              px: 0.9,
                              py: 0.3,
                              minWidth: 0,
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              whiteSpace: 'nowrap',
                              color: '#1a56b0',
                              bgcolor: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              '&:hover': { bgcolor: '#dbeafe' }
                            }}
                          >
                            Profile
                          </Button>
                        </Tooltip>
                        <Tooltip title="View Login QR Code">
                          <Button
                            size="small"
                            startIcon={<QrCode2Icon sx={{ fontSize: '13px !important' }} />}
                            onClick={() => setQrModalItem(trn)}
                            sx={{
                              px: 0.9,
                              py: 0.3,
                              minWidth: 0,
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              whiteSpace: 'nowrap',
                              color: '#1a56b0',
                              bgcolor: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              '&:hover': { bgcolor: '#f1f5f9' }
                            }}
                          >
                            QR
                          </Button>
                        </Tooltip>
                        <IconButton size="small" onClick={() => handleOpenEdit(trn)} sx={{ color: '#1a56b0', p: 0.35 }}>
                          <EditIcon sx={{ fontSize: '1.05rem' }} />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDelete(trn.id)} sx={{ color: '#d5372f', p: 0.35 }}>
                          <DeleteOutlineIcon sx={{ fontSize: '1.05rem' }} />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
        )}
      />

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
              <SchoolIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, fontSize: '1.05rem', lineHeight: 1.2, color: '#FFFFFF' }}>
                {editingItem ? 'Edit Trainer' : 'Add New Trainer'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.74rem' }}>
                {editingItem ? 'Update trainer profile, mobile PIN and specialization' : 'Register instructor credentials, 4-digit security PIN and trade subject'}
              </Typography>
            </Box>
          </Box>
          <IconButton
            size="small"
            aria-label="Close trainer dialog"
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
            '&::-webkit-scrollbar-thumb': { background: '#CBD5E1', borderRadius: 3 }
          }}
        >
          <Stack spacing={2}>
            {/* Section 1: Instructor Identity & Contact */}
            <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F2C59', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#0F2C59' }} />
                1. Instructor Identity & Contact
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Trainer Full Name"
                    fullWidth
                    size="small"
                    placeholder="e.g. Trainer Full Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Mobile Number (for WhatsApp/SMS)"
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
                    label="Biometric Machine ID"
                    fullWidth
                    size="small"
                    placeholder="e.g. 2001"
                    value={formData.biometricId || ''}
                    onChange={(e) => setFormData({ ...formData, biometricId: e.target.value })}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <FingerprintIcon sx={{ fontSize: 18, color: '#0F2E5A' }} />
                        </InputAdornment>
                      )
                    }}
                    helperText="User ID registered on ZKTeco / Biometric device"
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Section 2: Specialization & Portal Access */}
            <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F2C59', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#2563EB' }} />
                2. Specialization & Portal Access
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="Primary Occupation Specialization"
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
                        {occ.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="4-Digit Security PIN (for mobile unlock)"
                    fullWidth
                    size="small"
                    type="password"
                    inputProps={{ maxLength: 4 }}
                    placeholder="e.g. 1234"
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                    helperText="Instructors use this 4-digit PIN for mobile portal login."
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Specialization Details"
                    fullWidth
                    size="small"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    placeholder="e.g. Cosmetology & Hair Styling / Caregiver"
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Section 3: Profile & Status */}
            <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F2C59', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#059669' }} />
                3. Profile & Status
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={8}>
                  <PhotoUploadField
                    label="Trainer Profile Photo"
                    value={formData.photo}
                    onChange={(url) => setFormData({ ...formData, photo: url })}
                    folder="trainers"
                    entityId={editingItem?.id || formData.name || 'trainer'}
                    name={formData.name}
                  />
                </Grid>
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
              </Grid>
            </Paper>
          </Stack>
        </DialogContent>
        <DialogActions
          sx={{
            px: { xs: 1.5, sm: 2.5 },
            pt: { xs: 1.5, sm: 2 },
            pb: isMobile ? 'calc(12px + env(safe-area-inset-bottom))' : 2.5,
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
              border: '1px solid #CBD5E1',
              borderRadius: 2,
              px: 2.5,
              py: 0.8,
              textTransform: 'none',
              bgcolor: '#FFFFFF',
              '&:hover': { bgcolor: '#F1F5F9', color: '#0F172A', borderColor: '#94A3B8' }
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
              background: 'linear-gradient(135deg, #0F2E5A 0%, #1E40AF 100%)',
              color: '#FFFFFF',
              borderRadius: 2,
              px: 3,
              py: 0.8,
              boxShadow: '0 4px 14px rgba(15, 46, 90, 0.3)',
              textTransform: 'none',
              '&:hover': {
                background: 'linear-gradient(135deg, #0A1E3B 0%, #0F2E5A 100%)',
                boxShadow: '0 6px 18px rgba(15, 46, 90, 0.4)'
              }
            }}
          >
            Save Trainer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Trainer Login QR Dialog */}
      <Dialog open={Boolean(qrModalItem)} onClose={() => setQrModalItem(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, textAlign: 'center' }}>
          Trainer Access Card & QR
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', py: 2 }}>
          {qrModalItem && (
            <Box>
              <Avatar
                src={qrModalItem.photo}
                sx={{ width: 68, height: 68, mx: 'auto', mb: 1.5, bgcolor: '#1a9c5c', fontWeight: 800 }}
              >
                {qrModalItem.name[0]}
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {qrModalItem.name}
              </Typography>
              <Typography variant="body2" sx={{ color: '#647089', mb: 2 }}>
                ID: {qrModalItem.id} • {qrModalItem.specialization || 'Trainer'}
              </Typography>

              <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 3, display: 'inline-block', border: '1px solid #e2e8f0', mb: 2 }}>
                <QRCodeSVG
                  value={`KITE-TRAINER:${qrModalItem.id}:PIN:${qrModalItem.pin}`}
                  size={160}
                  level="H"
                />
              </Box>

              <Box sx={{ bgcolor: '#e5f8ee', p: 1.5, borderRadius: 2, border: '1px solid #c0ebce' }}>
                <Typography variant="caption" sx={{ color: '#16834b', fontWeight: 800, display: 'block' }}>
                  TRAINER LOGIN 4-DIGIT PIN:
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, color: '#16834b', letterSpacing: 4 }}>
                  {qrModalItem.pin}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'center' }}>
          <Button variant="contained" onClick={() => setQrModalItem(null)}>
            Close Card
          </Button>
        </DialogActions>
      </Dialog>

      {/* Trainer 360° Profile Dossier Dialog */}
      <Dialog open={Boolean(profileTrainer)} onClose={() => setProfileTrainer(null)} maxWidth="md" fullWidth>
        {profileTrainer && (() => {
          const occ = (db.occupations || []).find((o) => o.id === profileTrainer.occupationId);
          const assignedGroups = (db.trainingGroups || []).filter((g) => g.trainerId === profileTrainer.id);
          const groupIds = assignedGroups.map((g) => g.id);
          const myStudents = (db.students || []).filter((s) => groupIds.includes(s.groupId));
          const studentIds = myStudents.map((s) => s.id);
          const myOjts = (db.ojts || []).filter((o) => studentIds.includes(o.studentId));
          const myPlacements = (db.placements || []).filter((p) => studentIds.includes(p.studentId));

          return (
            <>
              <DialogTitle sx={{ pb: 1, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar src={profileTrainer.photo} sx={{ width: 56, height: 56, bgcolor: '#1a9c5c', fontWeight: 800 }}>
                    {(profileTrainer.name || 'T')[0]}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        {profileTrainer.name}
                      </Typography>
                      <Chip label={profileTrainer.id} size="small" sx={{ fontWeight: 800, bgcolor: '#1a56b0', color: '#fff' }} />
                      <Chip label={profileTrainer.status} size="small" color={profileTrainer.status === 'Active' ? 'success' : 'default'} />
                    </Box>
                    <Typography variant="caption" sx={{ color: '#647089' }}>
                      {occ?.name || 'Instructor'} • {profileTrainer.specialization} • Phone: {profileTrainer.phone}
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<QrCode2Icon />}
                    onClick={() => {
                      setQrModalItem(profileTrainer);
                    }}
                  >
                    Login QR
                  </Button>
                </Box>
              </DialogTitle>

              <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
                <Tabs value={profileTab} onChange={(e, v) => setProfileTab(v)}>
                  <Tab label="1. Overview" />
                  <Tab label={`2. Assigned Groups (${assignedGroups.length})`} />
                  <Tab label={`3. Enrolled Students (${myStudents.length})`} />
                  <Tab label={`4. Employer Outcomes (${myOjts.length + myPlacements.length})`} />
                </Tabs>
              </Box>

              <DialogContent sx={{ py: 2.5 }}>
                {profileTab === 0 && (
                  <Box>
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      <Grid item xs={6} sm={3}>
                        <Card sx={{ p: 2, textAlign: 'center', bgcolor: '#e8f0fd' }}>
                          <Typography variant="h5" sx={{ fontWeight: 900, color: '#1a56b0' }}>{assignedGroups.length}</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#1a56b0' }}>Active Groups</Typography>
                        </Card>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Card sx={{ p: 2, textAlign: 'center', bgcolor: '#e5f8ee' }}>
                          <Typography variant="h5" sx={{ fontWeight: 900, color: '#16834b' }}>{myStudents.length}</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#16834b' }}>Total Students</Typography>
                        </Card>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Card sx={{ p: 2, textAlign: 'center', bgcolor: '#fdf3e2' }}>
                          <Typography variant="h5" sx={{ fontWeight: 900, color: '#c9820a' }}>{myOjts.length}</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#c9820a' }}>Students in OJT</Typography>
                        </Card>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Card sx={{ p: 2, textAlign: 'center', bgcolor: '#f3e8ff' }}>
                          <Typography variant="h5" sx={{ fontWeight: 900, color: '#7e22ce' }}>{myPlacements.length}</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#7e22ce' }}>Placed Graduates</Typography>
                        </Card>
                      </Grid>
                    </Grid>

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                          <Typography variant="caption" sx={{ color: '#647089', fontWeight: 800 }}>TRAINER CREDENTIALS</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 800, mt: 0.5 }}>{profileTrainer.name}</Typography>
                          <Typography variant="body2" sx={{ color: '#475569' }}>Occupation: {occ?.name || 'General'}</Typography>
                          <Typography variant="body2" sx={{ color: '#475569' }}>Specialization: {profileTrainer.specialization}</Typography>
                          <Typography variant="body2" sx={{ color: '#475569', mt: 1 }}>Phone: {profileTrainer.phone}</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                          <Typography variant="caption" sx={{ color: '#647089', fontWeight: 800 }}>SECURITY & QUICK ACCESS</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                            <Chip icon={<KeyIcon />} label={`Login PIN: ${profileTrainer.pin}`} sx={{ fontWeight: 800, bgcolor: '#f1f5f9' }} />
                            <IconButton
                              size="small"
                              component="a"
                              href={getWhatsAppUrl(profileTrainer.phone, `Namaste Trainer ${profileTrainer.name}, your portal PIN is ${profileTrainer.pin}.`)}
                              target="_blank"
                              sx={{ color: '#25D366' }}
                            >
                              <WhatsAppIcon />
                            </IconButton>
                          </Box>
                          <Typography variant="caption" sx={{ color: '#647089', display: 'block', mt: 1.5 }}>
                            Trainers use this 4-digit PIN to mark attendance, submit work plans, lesson plans, and student evaluations.
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Box>
                )}

                {profileTab === 1 && (
                  <Stack spacing={1.5}>
                    {assignedGroups.map((grp) => {
                      const course = (db.courses || []).find((c) => c.id === grp.courseId);
                      const stdCount = (db.students || []).filter((s) => s.groupId === grp.id).length;
                      return (
                        <Paper key={grp.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                                  Group {grp.groupCode}
                                </Typography>
                                <Chip label={`Shift ${grp.shift}`} size="small" sx={{ fontWeight: 800, bgcolor: '#e8f0fd', color: '#1a56b0' }} />
                                <Chip label={grp.status} size="small" color={grp.status === 'Active' ? 'success' : 'default'} />
                              </Box>
                              <Typography variant="body2" sx={{ color: '#475569', mt: 0.5 }}>
                                Course: <b>{course?.title}</b> ({course?.durationHours} Hours)
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#647089' }}>
                                Class Timing: {grp.startTime} – {grp.endTime} • Admission: {grp.admissionDate} → End: {grp.expectedEndDate}
                              </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                              <Typography variant="h6" sx={{ fontWeight: 900, color: '#1a56b0' }}>
                                {stdCount}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#647089', fontWeight: 700 }}>
                                Students
                              </Typography>
                            </Box>
                          </Box>
                        </Paper>
                      );
                    })}
                    {assignedGroups.length === 0 && (
                      <Typography variant="body2" sx={{ color: '#94a3b8', py: 4, textAlign: 'center' }}>
                        No training groups currently assigned to this trainer.
                      </Typography>
                    )}
                  </Stack>
                )}

                {profileTab === 2 && (
                  <Stack spacing={1}>
                    {myStudents.map((std) => {
                      const grp = (db.trainingGroups || []).find((g) => g.id === std.groupId);
                      const atts = (db.attendances || []).filter((a) => a.studentId === std.id);
                      const present = atts.filter((a) => a.status === 'present').length;
                      const attRate = atts.length > 0 ? Math.round((present / atts.length) * 100) : 100;

                      return (
                        <Paper key={std.id} variant="outlined" sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar src={std.photoUrl} sx={{ width: 40, height: 40, bgcolor: '#1a56b0', fontWeight: 800 }}>
                              {std.name[0]}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                {std.name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#647089' }}>
                                {std.tgid} • Group {grp?.groupCode} • Phone: {std.phone}
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Chip
                              label={`Att: ${attRate}%`}
                              size="small"
                              sx={{
                                bgcolor: attRate >= 80 ? '#e5f8ee' : '#fdeceb',
                                color: attRate >= 80 ? '#16834b' : '#d5372f',
                                fontWeight: 800
                              }}
                            />
                            <Typography variant="caption" sx={{ display: 'block', color: '#647089', mt: 0.3 }}>
                              {std.status}
                            </Typography>
                          </Box>
                        </Paper>
                      );
                    })}
                    {myStudents.length === 0 && (
                      <Typography variant="body2" sx={{ color: '#94a3b8', py: 4, textAlign: 'center' }}>
                        No students enrolled in this trainer's groups yet.
                      </Typography>
                    )}
                  </Stack>
                )}

                {profileTab === 3 && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5 }}>
                      Indirect Employer Connection (OJT & Placement of Trainees Under This Instructor):
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1a56b0', mb: 1.5 }}>
                            🏢 Students in OJT ({myOjts.length})
                          </Typography>
                          <Stack spacing={1}>
                            {myOjts.map((ojt) => {
                              const std = (db.students || []).find((s) => s.id === ojt.studentId);
                              const emp = (db.employers || []).find((e) => e.id === ojt.employerId);
                              return (
                                <Box key={ojt.id} sx={{ p: 1, bgcolor: '#f8fafc', borderRadius: 1.5 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 800 }}>{std?.name || 'Student'}</Typography>
                                  <Typography variant="caption" sx={{ color: '#475569', display: 'block' }}>
                                    Host: <b>{emp?.name || 'Employer'}</b> ({emp?.location})
                                  </Typography>
                                  <Chip label={ojt.status} size="small" color={ojt.status === 'Completed' ? 'success' : 'primary'} sx={{ mt: 0.5 }} />
                                </Box>
                              );
                            })}
                            {myOjts.length === 0 && (
                              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                No students currently dispatched to OJT.
                              </Typography>
                            )}
                          </Stack>
                        </Paper>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#16834b', mb: 1.5 }}>
                            💼 Placed Graduates ({myPlacements.length})
                          </Typography>
                          <Stack spacing={1}>
                            {myPlacements.map((plc) => {
                              const std = (db.students || []).find((s) => s.id === plc.studentId);
                              const emp = (db.employers || []).find((e) => e.id === plc.employerId);
                              return (
                                <Box key={plc.id} sx={{ p: 1, bgcolor: '#f8fafc', borderRadius: 1.5 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 800 }}>{std?.name || 'Student'}</Typography>
                                  <Typography variant="caption" sx={{ color: '#475569', display: 'block' }}>
                                    Employer: <b>{emp?.name || 'Company'}</b> • Post: {plc.jobTitle}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: '#16834b', fontWeight: 800, display: 'block' }}>
                                    Salary: NPR {plc.salary ? plc.salary.toLocaleString() : '—'}
                                  </Typography>
                                </Box>
                              );
                            })}
                            {myPlacements.length === 0 && (
                              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                No graduates placed yet.
                              </Typography>
                            )}
                          </Stack>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </DialogContent>

              <DialogActions sx={{ p: 2 }}>
                <Button onClick={() => setProfileTrainer(null)}>Close</Button>
              </DialogActions>
            </>
          );
        })()}
      </Dialog>
    </Box>
  );
}
